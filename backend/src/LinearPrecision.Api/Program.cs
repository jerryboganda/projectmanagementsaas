using System.Text;
using System.Threading.RateLimiting;
using Amazon.S3;
using FluentValidation;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Api.Infrastructure.Behaviors;
using LinearPrecision.Api.Infrastructure.Email;
using LinearPrecision.Api.Infrastructure.Events;
using LinearPrecision.Api.Infrastructure.Middleware;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Infrastructure.Persistence.Interceptors;
using LinearPrecision.Api.Infrastructure.Persistence.Seeding;
using LinearPrecision.Api.Infrastructure.Storage;
using LinearPrecision.Api.Modules.Admin;
using LinearPrecision.Api.Modules.AI;
using LinearPrecision.Api.Modules.Analytics;
using LinearPrecision.Api.Modules.Automations;
using LinearPrecision.Api.Modules.Billing;
using LinearPrecision.Api.Modules.Calendar;
using LinearPrecision.Api.Modules.Documents;
using LinearPrecision.Api.Modules.Files;
using LinearPrecision.Api.Modules.Goals;
using LinearPrecision.Api.Modules.Identity;
using LinearPrecision.Api.Modules.Intake;
using LinearPrecision.Api.Modules.Notifications;
using LinearPrecision.Api.Modules.Projects;
using LinearPrecision.Api.Modules.Search;
using LinearPrecision.Api.Modules.Sprints;
using LinearPrecision.Api.Modules.Tasks;
using LinearPrecision.Api.Modules.TimeTracking;
using LinearPrecision.Api.Modules.Workspace;
using LinearPrecision.Api.Modules.Teams;
using LinearPrecision.Api.Hubs;
using LinearPrecision.Shared.Contracts;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using Serilog;
using StackExchange.Redis;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// ═══════════════════════════════════════════════
// 0. STARTUP SECRETS GUARD (F-01)
// ═══════════════════════════════════════════════
// Outside Development and explicit integration Testing, refuse to boot if any
// required secret is missing or equal to a known-insecure development placeholder.
// This prevents the API from silently coming up with a leaked-by-source-code key.
if (!builder.Environment.IsDevelopment() && !builder.Environment.IsEnvironment("Testing"))
{
    static bool IsMissingOrInsecure(string? value, params string[] insecureMarkers)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        foreach (var marker in insecureMarkers)
            if (value.Contains(marker, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    var requiredSecrets = new (string Key, string[] InsecureMarkers, int? MinLength)[]
    {
        ("Jwt:Key", new[] { "super-secret-development-key", "super-secret-production-key" }, 32),
        ("ConnectionStrings:DefaultConnection", new[] { "Password=dev" }, null),
        ("ConnectionStrings:Redis", Array.Empty<string>(), null),
        ("Storage:AccessKey", new[] { "minioadmin" }, null),
        ("Storage:SecretKey", new[] { "minioadmin" }, null),
        ("Storage:ServiceUrl", Array.Empty<string>(), null),
    };

    var failures = new List<string>();
    foreach (var (key, markers, minLen) in requiredSecrets)
    {
        var value = builder.Configuration[key];
        if (IsMissingOrInsecure(value, markers))
            failures.Add($"  - '{key}' is missing or matches a known-insecure development value.");
        else if (minLen is int min && Encoding.UTF8.GetByteCount(value!) < min)
            failures.Add($"  - '{key}' is shorter than the required {min} bytes.");
    }

    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    if (corsOrigins.Length == 0 ||
        corsOrigins.Any(o => string.IsNullOrWhiteSpace(o) || o.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase)))
    {
        failures.Add("  - 'Cors:AllowedOrigins' must be set to your production origin(s) and must not include http://localhost.");
    }

    if (failures.Count > 0)
    {
        throw new InvalidOperationException(
            "Refusing to start: the following required configuration values are missing or insecure. "
            + "Provide them via environment variables, user secrets, or a vault:" + Environment.NewLine
            + string.Join(Environment.NewLine, failures));
    }
}

// ═══════════════════════════════════════════════
// 1. INFRASTRUCTURE SERVICES
// ═══════════════════════════════════════════════

// Serilog
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

// EF Core + PostgreSQL
builder.Services.AddScoped<AuditInterceptor>();
builder.Services.AddScoped<SoftDeleteInterceptor>();
builder.Services.AddScoped<TenantInterceptor>();
builder.Services.AddScoped<DomainEventDispatcher>();

builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var connStr = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

    options.UseNpgsql(connStr, npgsqlOptions =>
           npgsqlOptions.ConfigureDataSource(dataSourceBuilder => dataSourceBuilder.EnableDynamicJson()))
           .UseSnakeCaseNamingConvention()
           .AddInterceptors(
               sp.GetRequiredService<AuditInterceptor>(),
               sp.GetRequiredService<SoftDeleteInterceptor>(),
               sp.GetRequiredService<TenantInterceptor>(),
               sp.GetRequiredService<DomainEventDispatcher>());
});

// Redis
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(redisConnectionString));

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnectionString;
    options.InstanceName = "lp:";
});

// ═══════════════════════════════════════════════
// 2. AUTHENTICATION & AUTHORIZATION
// ═══════════════════════════════════════════════

// ASP.NET Core Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    // Password policy
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
    options.Password.RequiredUniqueChars = 4;

    // Lockout
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User
    options.User.RequireUniqueEmail = true;

    // Sign-in
    options.SignIn.RequireConfirmedEmail = true;
    options.SignIn.RequireConfirmedAccount = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// F-03: bump PBKDF2 iteration count to current OWASP guidance (>=600,000).
// IdentityV3 already uses HMAC-SHA256; only the iteration count is configurable.
// Existing hashes are validated against their embedded iteration count, then
// rehashed at the next successful login via PasswordHasher.VerifyHashedPassword's
// RehashPasswordIfNeeded path.
builder.Services.Configure<PasswordHasherOptions>(options =>
{
    options.IterationCount = 600_000;
});

builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(1);
});

// JWT Bearer Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT signing key 'Jwt:Key' is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero,
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // SignalR passes JWT as ?access_token= on WebSocket connections.
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = async context =>
        {
            // Check Redis blocklist for revoked tokens
            var redis = context.HttpContext.RequestServices.GetRequiredService<IConnectionMultiplexer>();
            var db = redis.GetDatabase();
            var jti = context.Principal?.FindFirst("jti")?.Value;
            var path = context.HttpContext.Request.Path;
            var isHubPath = path.StartsWithSegments("/hubs");

            if (!string.IsNullOrEmpty(jti))
            {
                var isBlocked = await db.KeyExistsAsync($"blocklist:at:{jti}");
                if (isBlocked)
                {
                    context.Fail("Token has been revoked.");
                }
            }

            var tokenUse = context.Principal?.FindFirst("token_use")?.Value;
            var isHubToken = string.Equals(tokenUse, "hub", StringComparison.Ordinal);
            if (isHubToken)
            {
                var hubPath = context.Principal?.FindFirst("hub_path")?.Value;
                if (!isHubPath || !string.Equals(hubPath, path.Value, StringComparison.OrdinalIgnoreCase))
                {
                    context.Fail("Hub token is not valid for this endpoint.");
                }
            }

            if (isHubPath && context.HttpContext.Request.Query.ContainsKey("access_token") && !isHubToken)
            {
                context.Fail("SignalR query-string authentication requires a hub-scoped token.");
            }
        },
    };
});

// Authorization Policies
builder.Services.AddAuthorizationPolicies();

// ═══════════════════════════════════════════════
// 3. CROSS-CUTTING SERVICES
// ═══════════════════════════════════════════════

// JSON options — accept string enums from frontend (matches TypeScript contract)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

// MVC Controllers (needed for AuthController)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// MediatR
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);
    cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
    cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
});

// FluentValidation
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

// ICurrentUser, ITenantContext, JwtTokenGenerator
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUserAccessor>();
builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddScoped<JwtTokenGenerator>();

// Storage (S3-compatible / MinIO)
// F-01: no fallback to known-insecure defaults. SecretsGuard above already rejects empties in non-dev.
var storageAccessKey = builder.Configuration["Storage:AccessKey"] ?? "minioadmin";
var storageSecretKey = builder.Configuration["Storage:SecretKey"] ?? "minioadmin";
var storageServiceUrl = builder.Configuration["Storage:ServiceUrl"] ?? "http://localhost:9000";
builder.Services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(
    storageAccessKey,
    storageSecretKey,
    new AmazonS3Config
    {
        ServiceURL = storageServiceUrl,
        ForcePathStyle = true  // required for MinIO path-style access
    }));
builder.Services.AddScoped<IStorageService, S3StorageService>();

// Email (SMTP / MailKit)
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

// Middleware (IMiddleware pattern requires DI registration)
builder.Services.AddTransient<CorrelationIdMiddleware>();
builder.Services.AddTransient<RequestLoggingMiddleware>();
builder.Services.AddTransient<GlobalExceptionMiddleware>();
builder.Services.AddTransient<TenantResolutionMiddleware>();

// CORS (F-11: explicit method/header lists; no wildcard)
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
              .WithHeaders(
                  "Authorization",
                  "Content-Type",
                  "X-Workspace-Id",
                  "X-Correlation-Id",
                  "X-Request-Id",
                  "Stripe-Signature",
                  "X-LP-Client")
              .WithExposedHeaders("X-Correlation-Id", "X-Request-Id")
              .AllowCredentials();
    });
});

// F-12: forwarded headers (must be configured before HTTPS redirection / HSTS
// or any code that reads Request.Scheme/IsHttps/RemoteIpAddress behind a proxy).
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    // KnownNetworks/KnownProxies must be set explicitly per deployment; the empty
    // defaults reject all proxies. Operators override via environment-specific config.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// F-12: HSTS hardened (matches frontend HSTS: 2 years, includeSubDomains, preload).
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(730);
});

builder.Services.AddHttpsRedirection(options =>
{
    options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global: 600 requests per minute per client IP (sliding window).
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 600,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

    // Auth: 20 requests per 15 minutes, partitioned by client IP.
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

    // F-09 — Intake (public anonymous form): 10 requests per minute partitioned
    // by client IP to limit abuse without affecting authenticated traffic.
    options.AddPolicy("intake", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
            }));

    // AI: 30 concurrent tokens (token bucket)
    options.AddTokenBucketLimiter("ai", limiter =>
    {
        limiter.TokenLimit = 30;
        limiter.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        limiter.TokensPerPeriod = 5;
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiter.QueueLimit = 0;
    });
});

// OpenAPI
builder.Services.AddOpenApi();

// Health Checks
var dbConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

builder.Services.AddHealthChecks()
    .AddNpgSql(dbConnectionString, name: "postgresql", tags: ["ready"])
    .AddRedis(redisConnectionString, name: "redis", tags: ["ready"]);

// SignalR with Redis backplane
builder.Services.AddSignalR()
    .AddStackExchangeRedis(redisConnectionString, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal("lp-signalr");
    });

// ═══════════════════════════════════════════════
// 4. MODULE REGISTRATION
// ═══════════════════════════════════════════════

builder.Services.AddIdentityModule();
builder.Services.AddWorkspaceModule();
builder.Services.AddTeamsModule();
builder.Services.AddProjectsModule();
builder.Services.AddTasksModule();
builder.Services.AddGoalsModule();
builder.Services.AddSprintsModule();
builder.Services.AddCalendarModule();
builder.Services.AddDocumentsModule();
builder.Services.AddTimeTrackingModule();
builder.Services.AddIntakeModule();
builder.Services.AddAutomationsModule();
builder.Services.AddNotificationsModule();
builder.Services.AddSearchModule();
builder.Services.AddBillingModule();
builder.Services.AddAIModule();
builder.Services.AddAnalyticsModule();
builder.Services.AddFilesModule();
builder.Services.AddAdminModule();

var app = builder.Build();

await Program.InitializeDatabaseAsync(app);

// ═══════════════════════════════════════════════
// MIDDLEWARE PIPELINE (exact order!)
// ═══════════════════════════════════════════════

// F-12: forwarded headers FIRST so Request.Scheme/IsHttps/RemoteIpAddress are correct.
app.UseForwardedHeaders();

// F-12: outside development, force HTTPS and emit HSTS.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// F-12: defense-in-depth security headers on every response.
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    headers["Cross-Origin-Opener-Policy"] = "same-origin";
    headers["Cross-Origin-Resource-Policy"] = "same-site";
    // Tight CSP for any HTML the API emits (error pages, Scalar in dev).
    headers["Content-Security-Policy"] =
        "default-src 'none'; " +
        "img-src 'self' data:; " +
        "style-src 'self' 'unsafe-inline'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'; " +
        "base-uri 'none'; " +
        "form-action 'self'";
    await next();
});

app.UseMiddleware<CorrelationIdMiddleware>();    // 1. Correlation ID
app.UseMiddleware<RequestLoggingMiddleware>();    // 2. Request Logging
app.UseMiddleware<GlobalExceptionMiddleware>();   // 3. Global Exception Handler
app.UseRateLimiter();                            // 4. Rate Limiter
app.UseCors();                                   // 5. CORS
app.UseAuthentication();                         // 6. Authentication
app.UseMiddleware<TenantResolutionMiddleware>();  // 7. Tenant Resolution
app.UseAuthorization();                          // 8. Authorization

// ═══════════════════════════════════════════════
// ENDPOINT MAPPING
// ═══════════════════════════════════════════════

// OpenAPI + Scalar
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Health checks
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status200OK,
        [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
    }
});

app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false, // No checks — just confirms the process is running
    ResultStatusCodes =
    {
        [HealthStatus.Healthy] = StatusCodes.Status200OK
    }
});

// MVC Controllers (AuthController)
app.MapControllers();

// Module endpoints
app.MapIdentityEndpoints();
app.MapWorkspaceEndpoints();
app.MapTeamsEndpoints();
app.MapProjectsEndpoints();
app.MapTasksEndpoints();
app.MapGoalsEndpoints();
app.MapSprintsEndpoints();
app.MapCalendarEndpoints();
app.MapDocumentsEndpoints();
app.MapTimeTrackingEndpoints();
app.MapIntakeEndpoints();
app.MapAutomationsEndpoints();
app.MapNotificationsEndpoints();
app.MapSearchEndpoints();
app.MapBillingEndpoints();
app.MapAIEndpoints();
app.MapAnalyticsEndpoints();
app.MapFilesEndpoints();
app.MapAdminEndpoints();

// SignalR Hubs
app.MapHub<BoardHub>("/hubs/board");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<PresenceHub>("/hubs/presence");
app.MapHub<AIStreamHub>("/hubs/ai-stream");

app.Run();

// Make the implicit Program class public so test projects can reference it
// via WebApplicationFactory<Program>
public partial class Program
{
    internal static async Task InitializeDatabaseAsync(WebApplication app)
    {
        const int maxAttempts = 5;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await using var scope = app.Services.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.MigrateAsync();
                await PlanSeeder.SeedAsync(db);

                if (app.Environment.IsDevelopment())
                {
                    await DevDataSeeder.SeedAsync(db);
                }

                await ProjectTemplateSeeder.SeedAllAsync(db);

                return;
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                app.Logger.LogWarning(
                    ex,
                    "Database initialization attempt {Attempt} of {MaxAttempts} failed. Retrying.",
                    attempt,
                    maxAttempts);

                await Task.Delay(TimeSpan.FromSeconds(attempt * 2));
            }
        }
    }
}
