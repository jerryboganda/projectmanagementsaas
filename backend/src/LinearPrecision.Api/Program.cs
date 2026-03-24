using System.Text;
using System.Threading.RateLimiting;
using Amazon.S3;
using FluentValidation;
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
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

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
        OnTokenValidated = async context =>
        {
            // Check Redis blocklist for revoked tokens
            var redis = context.HttpContext.RequestServices.GetRequiredService<IConnectionMultiplexer>();
            var db = redis.GetDatabase();
            var jti = context.Principal?.FindFirst("jti")?.Value;

            if (!string.IsNullOrEmpty(jti))
            {
                var isBlocked = await db.KeyExistsAsync($"blocklist:at:{jti}");
                if (isBlocked)
                {
                    context.Fail("Token has been revoked.");
                }
            }
        },
    };
});

// Authorization Policies
builder.Services.AddAuthorizationPolicies();

// ═══════════════════════════════════════════════
// 3. CROSS-CUTTING SERVICES
// ═══════════════════════════════════════════════

// MVC Controllers (needed for AuthController)
builder.Services.AddControllers();

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
builder.Services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(
    builder.Configuration["Storage:AccessKey"] ?? "minioadmin",
    builder.Configuration["Storage:SecretKey"] ?? "minioadmin",
    new AmazonS3Config
    {
        ServiceURL = builder.Configuration["Storage:ServiceUrl"] ?? "http://localhost:9000",
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

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global: 600 requests per minute (sliding window)
    options.AddSlidingWindowLimiter("global", limiter =>
    {
        limiter.PermitLimit = 600;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.SegmentsPerWindow = 6;
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiter.QueueLimit = 0;
    });

    // Auth: 20 requests per 15 minutes (fixed window)
    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.PermitLimit = 20;
        limiter.Window = TimeSpan.FromMinutes(15);
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiter.QueueLimit = 0;
    });

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
