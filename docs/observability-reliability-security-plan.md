# Observability, Reliability, and Security Plan — Linear Precision PM SaaS

> **Status:** Draft v1.0
> **Last updated:** 2026-03-19
> **Owner:** Backend Architecture Team
> **Related:** `backend-architecture-master-plan.md`, `data-model-and-storage-plan.md`, `auth-tenancy-rbac-plan.md`, `async-jobs-events-realtime-plan.md`

---

## 1. Overview

This document consolidates and expands on the cross-cutting observability, reliability, and security concerns introduced in the backend architecture master plan. It covers three pillars:

1. **Observability** — Structured logging (Serilog), distributed tracing (OpenTelemetry), custom metrics, and monitoring dashboards that provide deep visibility into system behavior.
2. **Reliability** — Health checks, SLOs, rate limiting, circuit breakers, and incident response processes that ensure consistent uptime and performance.
3. **Security** — Security headers, CORS, input validation, audit logging, secrets management, and vulnerability scanning that protect against threats and satisfy compliance requirements.

**Key technologies:**

| Concern | Technology | Role |
|---------|-----------|------|
| Structured logging | Serilog + Sinks (Console, Seq, OTLP) | Enriched, queryable log output |
| Distributed tracing | OpenTelemetry .NET SDK + OTLP | End-to-end request tracing |
| Metrics | OpenTelemetry Metrics → Prometheus | Custom counters, histograms, gauges |
| Dashboards | Grafana | Visualization and alerting |
| Health checks | ASP.NET Core HealthChecks | Dependency probing |
| Rate limiting | `Microsoft.AspNetCore.RateLimiting` + Redis | Sliding window, token bucket |
| Audit logging | Custom service → `audit_events` table | Compliance-grade change tracking |
| Secret management | Azure Key Vault / AWS Secrets Manager | Production credential storage |

---

## 2. Structured Logging (Serilog)

### 2.1 Serilog Configuration

```json
// appsettings.json — Serilog section
{
  "Serilog": {
    "Using": [
      "Serilog.Sinks.Console",
      "Serilog.Sinks.Seq",
      "Serilog.Sinks.OpenTelemetry"
    ],
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore": "Warning",
        "Microsoft.EntityFrameworkCore.Database.Command": "Warning",
        "Hangfire": "Information",
        "System.Net.Http.HttpClient": "Warning"
      }
    },
    "Enrich": [
      "FromLogContext",
      "WithMachineName",
      "WithEnvironmentName",
      "WithThreadId",
      "WithCorrelationId",
      "WithTenantContext",
      "WithUserContext"
    ],
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "[{Timestamp:HH:mm:ss.fff} {Level:u3}] {CorrelationId} {WorkspaceId} {UserId} {Message:lj}{NewLine}{Exception}"
        }
      },
      {
        "Name": "Seq",
        "Args": {
          "serverUrl": "http://localhost:5341",
          "apiKey": ""
        }
      },
      {
        "Name": "OpenTelemetry",
        "Args": {
          "endpoint": "http://localhost:4317",
          "protocol": "Grpc",
          "resourceAttributes": {
            "service.name": "linearprecision-api",
            "service.version": "1.0.0"
          }
        }
      }
    ]
  }
}
```

### 2.2 Custom Enrichers

```csharp
// LinearPrecision.Shared/Logging/CorrelationIdEnricher.cs
public class CorrelationIdEnricher : ILogEventEnricher
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string HeaderName = "X-Correlation-Id";

    public CorrelationIdEnricher(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        string correlationId;

        if (httpContext?.Request.Headers.TryGetValue(HeaderName, out var headerValue) == true
            && !string.IsNullOrWhiteSpace(headerValue))
        {
            correlationId = headerValue.ToString();
        }
        else
        {
            correlationId = Guid.CreateVersion7().ToString();
            httpContext?.Response.Headers.TryAdd(HeaderName, correlationId);
        }

        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("CorrelationId", correlationId));
    }
}

// LinearPrecision.Shared/Logging/TenantContextEnricher.cs
public class TenantContextEnricher : ILogEventEnricher
{
    private readonly IServiceProvider _serviceProvider;

    public TenantContextEnricher(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var tenantContext = _serviceProvider.GetService<ITenantContext>();
        if (tenantContext?.WorkspaceId is { } workspaceId)
        {
            logEvent.AddPropertyIfAbsent(
                propertyFactory.CreateProperty("WorkspaceId", workspaceId));
        }
    }
}

// LinearPrecision.Shared/Logging/UserContextEnricher.cs
public class UserContextEnricher : ILogEventEnricher
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextEnricher(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var userId = _httpContextAccessor.HttpContext?.User.GetUserId();
        if (userId.HasValue)
        {
            logEvent.AddPropertyIfAbsent(
                propertyFactory.CreateProperty("UserId", userId.Value));
        }
    }
}
```

### 2.3 Request Logging Middleware

```csharp
// LinearPrecision.Api/Middleware/RequestLoggingMiddleware.cs
public class RequestLoggingMiddleware : IMiddleware
{
    private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/health/ready",
        "/health/live",
        "/favicon.ico"
    };

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (ExcludedPaths.Contains(context.Request.Path.Value ?? string.Empty))
        {
            await next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var requestBodySize = context.Request.ContentLength ?? 0;

        try
        {
            await next(context);
            stopwatch.Stop();

            Log.ForContext("HttpMethod", context.Request.Method)
               .ForContext("RequestPath", context.Request.Path.Value)
               .ForContext("QueryString", context.Request.QueryString.Value)
               .ForContext("StatusCode", context.Response.StatusCode)
               .ForContext("ElapsedMs", stopwatch.Elapsed.TotalMilliseconds)
               .ForContext("RequestBodySize", requestBodySize)
               .ForContext("ResponseBodySize", context.Response.ContentLength ?? 0)
               .Information("HTTP {HttpMethod} {RequestPath} → {StatusCode} in {ElapsedMs:0.00}ms");
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            Log.ForContext("HttpMethod", context.Request.Method)
               .ForContext("RequestPath", context.Request.Path.Value)
               .ForContext("ElapsedMs", stopwatch.Elapsed.TotalMilliseconds)
               .Error(ex, "HTTP {HttpMethod} {RequestPath} failed after {ElapsedMs:0.00}ms");

            throw;
        }
    }
}
```

### 2.4 Log Levels Strategy

| Level | Scenarios | Example |
|-------|----------|---------|
| **Trace** | Raw SQL queries, cache hit/miss details, token parsing | `EF Core query: SELECT * FROM tasks WHERE ...` |
| **Debug** | MediatR dispatch events, Hangfire job start/end, SignalR hub connect | `Dispatching CreateTask command` |
| **Information** | Request completed, user authenticated, entity CRUD, subscription changed | `HTTP GET /api/v1/tasks → 200 in 23ms` |
| **Warning** | Rate limit approaching threshold, token refresh issued, deprecated endpoint called, slow query (>500ms) | `Rate limit 80% consumed for workspace {id}` |
| **Error** | Unhandled exception, external service failure (Stripe, S3), validation error in webhook | `Stripe webhook signature verification failed` |
| **Fatal** | Database connection lost, Redis unavailable, application startup failure | `PostgreSQL connection pool exhausted` |

---

## 3. Distributed Tracing (OpenTelemetry)

### 3.1 OpenTelemetry Configuration

```csharp
// LinearPrecision.Api/Configuration/OpenTelemetryConfig.cs
public static class OpenTelemetryConfig
{
    public static IHostApplicationBuilder AddObservability(
        this IHostApplicationBuilder builder)
    {
        var serviceName = "linearprecision-api";
        var serviceVersion = typeof(Program).Assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? "1.0.0";

        builder.Services.AddOpenTelemetry()
            .ConfigureResource(resource => resource
                .AddService(
                    serviceName: serviceName,
                    serviceVersion: serviceVersion)
                .AddAttributes(new Dictionary<string, object>
                {
                    ["deployment.environment"] = builder.Environment.EnvironmentName,
                    ["host.name"] = Environment.MachineName
                }))
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation(options =>
                {
                    options.RecordException = true;
                    options.Filter = ctx =>
                        !ctx.Request.Path.StartsWithSegments("/health");
                })
                .AddEntityFrameworkCoreInstrumentation(options =>
                {
                    options.SetDbStatementForText = true;
                    options.SetDbStatementForStoredProcedure = true;
                })
                .AddHttpClientInstrumentation(options =>
                {
                    options.RecordException = true;
                })
                .AddRedisInstrumentation()
                .AddSource("LinearPrecision.MediatR")
                .AddSource("LinearPrecision.Hangfire")
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(
                        builder.Configuration["OpenTelemetry:OtlpEndpoint"]
                        ?? "http://localhost:4317");
                    options.Protocol = OtlpExportProtocol.Grpc;
                }))
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddRuntimeInstrumentation()
                .AddProcessInstrumentation()
                .AddMeter("LinearPrecision.Api")
                .AddMeter("LinearPrecision.Billing")
                .AddMeter("LinearPrecision.SignalR")
                .AddMeter("LinearPrecision.Hangfire")
                .AddMeter("LinearPrecision.AI")
                .AddOtlpExporter(options =>
                {
                    options.Endpoint = new Uri(
                        builder.Configuration["OpenTelemetry:OtlpEndpoint"]
                        ?? "http://localhost:4317");
                    options.Protocol = OtlpExportProtocol.Grpc;
                }));

        return builder;
    }
}
```

### 3.2 Custom Spans

```csharp
// MediatR tracing behavior
public class TracingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private static readonly ActivitySource ActivitySource = new("LinearPrecision.MediatR");

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        using var activity = ActivitySource.StartActivity(
            $"MediatR.{typeof(TRequest).Name}",
            ActivityKind.Internal);

        activity?.SetTag("mediatr.request_type", typeof(TRequest).FullName);
        activity?.SetTag("mediatr.response_type", typeof(TResponse).FullName);

        try
        {
            var response = await next();
            activity?.SetStatus(ActivityStatusCode.Ok);
            return response;
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.RecordException(ex);
            throw;
        }
    }
}

// Stripe API call tracing
public class TracedStripeService
{
    private static readonly ActivitySource ActivitySource = new("LinearPrecision.Stripe");

    public async Task<Session> CreateCheckoutSessionAsync(SessionCreateOptions options)
    {
        using var activity = ActivitySource.StartActivity(
            "Stripe.CreateCheckoutSession",
            ActivityKind.Client);

        activity?.SetTag("stripe.operation", "checkout.session.create");
        activity?.SetTag("stripe.price_id", options.LineItems?.FirstOrDefault()?.Price);

        var service = new SessionService();
        var session = await service.CreateAsync(options);

        activity?.SetTag("stripe.session_id", session.Id);
        return session;
    }
}

// AI inference tracing
public class TracedAIService
{
    private static readonly ActivitySource ActivitySource = new("LinearPrecision.AI");

    public async Task<string> GenerateAsync(string prompt, Guid workspaceId)
    {
        using var activity = ActivitySource.StartActivity(
            "AI.Generate",
            ActivityKind.Client);

        activity?.SetTag("ai.workspace_id", workspaceId.ToString());
        activity?.SetTag("ai.prompt_length", prompt.Length);

        var response = await _chatClient.CompleteAsync(prompt);

        activity?.SetTag("ai.completion_tokens", response.Usage.OutputTokenCount);
        activity?.SetTag("ai.prompt_tokens", response.Usage.InputTokenCount);
        activity?.SetTag("ai.total_tokens", response.Usage.TotalTokenCount);
        activity?.SetTag("ai.model", response.ModelId);

        return response.Message.Text ?? string.Empty;
    }
}
```

### 3.3 Custom Metrics

```csharp
// LinearPrecision.Shared/Telemetry/AppMetrics.cs
public static class AppMetrics
{
    private static readonly Meter ApiMeter = new("LinearPrecision.Api", "1.0.0");
    private static readonly Meter BillingMeter = new("LinearPrecision.Billing", "1.0.0");
    private static readonly Meter SignalRMeter = new("LinearPrecision.SignalR", "1.0.0");
    private static readonly Meter HangfireMeter = new("LinearPrecision.Hangfire", "1.0.0");
    private static readonly Meter AIMeter = new("LinearPrecision.AI", "1.0.0");

    // --- API metrics ---
    public static readonly Counter<long> RequestsTotal =
        ApiMeter.CreateCounter<long>(
            "linearprecision.api.requests_total",
            description: "Total HTTP requests processed");

    public static readonly Histogram<double> RequestDuration =
        ApiMeter.CreateHistogram<double>(
            "linearprecision.api.request_duration_ms",
            unit: "ms",
            description: "HTTP request duration in milliseconds");

    public static readonly Counter<long> TasksCreated =
        ApiMeter.CreateCounter<long>(
            "linearprecision.tasks.created_total",
            description: "Total tasks created, tagged by workspace");

    // --- Billing metrics ---
    public static readonly Histogram<double> UsageCheckDuration =
        BillingMeter.CreateHistogram<double>(
            "linearprecision.billing.usage_check_duration_ms",
            unit: "ms",
            description: "Entitlement check duration");

    public static readonly Counter<long> PlanUpgrades =
        BillingMeter.CreateCounter<long>(
            "linearprecision.billing.plan_upgrades_total",
            description: "Total plan upgrades");

    // --- SignalR metrics ---
    public static readonly UpDownCounter<long> ActiveConnections =
        SignalRMeter.CreateUpDownCounter<long>(
            "linearprecision.signalr.connections_active",
            description: "Currently active SignalR connections");

    // --- Hangfire metrics ---
    public static readonly Counter<long> JobsProcessed =
        HangfireMeter.CreateCounter<long>(
            "linearprecision.hangfire.jobs_processed_total",
            description: "Total background jobs processed, tagged by queue");

    public static readonly Counter<long> JobsFailed =
        HangfireMeter.CreateCounter<long>(
            "linearprecision.hangfire.jobs_failed_total",
            description: "Total background jobs that exhausted retries");

    // --- AI metrics ---
    public static readonly Counter<long> AiTokensConsumed =
        AIMeter.CreateCounter<long>(
            "linearprecision.ai.tokens_consumed_total",
            description: "Total AI tokens consumed, tagged by workspace");
}
```

---

## 4. Health Checks

### 4.1 Health Check Registration

```csharp
// Program.cs — health check setup
builder.Services.AddHealthChecks()
    .AddNpgSql(
        connectionString,
        name: "postgresql",
        tags: ["ready"])
    .AddRedis(
        redisConnectionString,
        name: "redis",
        tags: ["ready"])
    .AddUrlGroup(
        new Uri("https://api.stripe.com/v1"),
        name: "stripe",
        tags: ["ready", "external"])
    .AddCheck<HangfireHealthCheck>(
        "hangfire",
        tags: ["ready"]);

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false  // Liveness: just checks the app process is running
});
```

### 4.2 Custom Hangfire Health Check

```csharp
// LinearPrecision.Api/HealthChecks/HangfireHealthCheck.cs
public class HangfireHealthCheck : IHealthCheck
{
    private readonly IMonitoringApi _monitoringApi;

    public HangfireHealthCheck()
    {
        _monitoringApi = JobStorage.Current.GetMonitoringApi();
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var servers = _monitoringApi.Servers();
        var latestHeartbeat = servers
            .OrderByDescending(s => s.Heartbeat)
            .FirstOrDefault()?.Heartbeat;

        // Server heartbeat check
        if (latestHeartbeat == null ||
            DateTime.UtcNow - latestHeartbeat > TimeSpan.FromSeconds(60))
        {
            return Task.FromResult(HealthCheckResult.Unhealthy(
                "No Hangfire server heartbeat within 60 seconds."));
        }

        // Queue depth check
        var stats = _monitoringApi.GetStatistics();
        var enqueuedCount = stats.Enqueued;

        if (enqueuedCount > 5000)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy(
                $"Hangfire queue depth critical: {enqueuedCount} enqueued jobs."));
        }

        if (enqueuedCount > 1000)
        {
            return Task.FromResult(HealthCheckResult.Degraded(
                $"Hangfire queue depth elevated: {enqueuedCount} enqueued jobs."));
        }

        var data = new Dictionary<string, object>
        {
            ["servers"] = servers.Count,
            ["enqueued"] = enqueuedCount,
            ["processing"] = stats.Processing,
            ["failed"] = stats.Failed,
            ["scheduled"] = stats.Scheduled
        };

        return Task.FromResult(HealthCheckResult.Healthy(
            "Hangfire is operating normally.", data));
    }
}
```

### 4.3 Health Check Response Format

```json
{
  "status": "Healthy",
  "totalDuration": "00:00:00.0451234",
  "entries": {
    "postgresql": {
      "status": "Healthy",
      "duration": "00:00:00.0123456",
      "tags": ["ready"]
    },
    "redis": {
      "status": "Healthy",
      "duration": "00:00:00.0034567",
      "tags": ["ready"]
    },
    "stripe": {
      "status": "Healthy",
      "duration": "00:00:00.0234567",
      "tags": ["ready", "external"]
    },
    "hangfire": {
      "status": "Healthy",
      "description": "Hangfire is operating normally.",
      "duration": "00:00:00.0012345",
      "data": {
        "servers": 1,
        "enqueued": 12,
        "processing": 3,
        "failed": 0,
        "scheduled": 45
      },
      "tags": ["ready"]
    }
  }
}
```

### 4.4 Kubernetes Probe Integration

```yaml
# k8s deployment excerpt
spec:
  containers:
    - name: linearprecision-api
      livenessProbe:
        httpGet:
          path: /health/live
          port: 8080
        initialDelaySeconds: 10
        periodSeconds: 15
        timeoutSeconds: 5
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 8080
        initialDelaySeconds: 15
        periodSeconds: 10
        timeoutSeconds: 10
        failureThreshold: 5
      startupProbe:
        httpGet:
          path: /health/live
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
        failureThreshold: 30
```

---

## 5. Service Level Objectives (SLOs)

| Metric | Target | Measurement | Window |
|--------|--------|-------------|--------|
| API Availability | 99.9% (≤ 8.7h downtime/year) | Successful responses / total requests | 30-day rolling |
| P50 Latency | ≤ 50ms | OpenTelemetry histogram | 30-day rolling |
| P95 Latency | ≤ 200ms | OpenTelemetry histogram | 30-day rolling |
| P99 Latency | ≤ 500ms | OpenTelemetry histogram | 30-day rolling |
| Error Rate (5xx) | ≤ 0.1% of requests | Error counter / request counter | 30-day rolling |
| SignalR Delivery | ≤ 100ms fan-out latency | Custom trace span | Per message |
| Background Job Completion | 99.5% within retry budget | Hangfire success / total | 7-day rolling |
| Search Latency | ≤ 150ms P95 | Search module trace | 30-day rolling |
| AI Response Time (non-streaming) | ≤ 3s P95 | AI module trace | 30-day rolling |
| Database Query P95 | ≤ 50ms | EF Core instrumentation | 30-day rolling |
| Redis Cache Hit Rate | ≥ 85% | Redis INFO stats | 24-hour rolling |
| Health Check Pass Rate | 100% during uptime | Health check probe | Continuous |

**Error Budget Policy:**

| SLO Remaining Budget | Action |
|---------------------|--------|
| > 50% | Normal feature velocity |
| 25-50% | Review recent deployments, increase monitoring |
| 10-25% | Freeze non-critical deploys, focus on reliability |
| < 10% | Incident mode — all hands on stability |

---

## 6. Rate Limiting

### 6.1 Rate Limit Policies

```csharp
// Program.cs — complete rate limiting configuration
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";
        await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Title = "Too Many Requests",
            Status = 429,
            Detail = $"Rate limit exceeded. Retry after {context.Lease.TryGetMetadata(
                MetadataName.RetryAfter, out var retryAfter)
                    ? retryAfter.TotalSeconds : 60} seconds.",
            Extensions = { ["retryAfter"] = retryAfter?.TotalSeconds ?? 60 }
        }, ct);
    };

    // 1. Global sliding window — 600 requests/min per client
    options.AddSlidingWindowLimiter("global", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.SegmentsPerWindow = 6;
        limiter.PermitLimit = 600;
        limiter.QueueLimit = 10;
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });

    // 2. Auth endpoints — 20 requests/15min (brute-force protection)
    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(15);
        limiter.PermitLimit = 20;
    });

    // 3. AI endpoints — token bucket (expensive operations)
    options.AddTokenBucketLimiter("ai", limiter =>
    {
        limiter.TokenLimit = 30;
        limiter.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
        limiter.TokensPerPeriod = 10;
        limiter.AutoReplenishment = true;
    });

    // 4. File upload — 50 uploads/hour per user
    options.AddFixedWindowLimiter("upload", limiter =>
    {
        limiter.Window = TimeSpan.FromHours(1);
        limiter.PermitLimit = 50;
    });

    // 5. Webhook ingress — 100/min per source
    options.AddSlidingWindowLimiter("webhook", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.SegmentsPerWindow = 4;
        limiter.PermitLimit = 100;
    });

    // 6. Export — 10/hour per workspace
    options.AddFixedWindowLimiter("export", limiter =>
    {
        limiter.Window = TimeSpan.FromHours(1);
        limiter.PermitLimit = 10;
    });
});
```

### 6.2 Rate Limit Response Headers

| Header | Description | Example |
|--------|-----------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed in window | `600` |
| `X-RateLimit-Remaining` | Remaining requests in current window | `423` |
| `X-RateLimit-Reset` | UTC epoch seconds when window resets | `1711036800` |
| `Retry-After` | Seconds until the client can retry (on 429) | `12` |

### 6.3 Per-Tenant Rate Limiting

```csharp
// LinearPrecision.Api/RateLimiting/PlanBasedRateLimitPolicy.cs
public class PlanBasedRateLimitPolicy : IRateLimiterPolicy<string>
{
    private readonly IServiceProvider _serviceProvider;

    public PlanBasedRateLimitPolicy(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public Func<OnRejectedContext, CancellationToken, ValueTask>? OnRejected =>
        async (context, ct) =>
        {
            context.HttpContext.Response.StatusCode = 429;
            await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Too Many Requests",
                Status = 429,
                Detail = "Plan rate limit exceeded. Consider upgrading for higher limits."
            }, ct);
        };

    public RateLimitPartition<string> GetPartition(HttpContext httpContext)
    {
        var workspaceId = httpContext.Request.Headers["X-Workspace-Id"].ToString();

        if (string.IsNullOrEmpty(workspaceId))
        {
            return RateLimitPartition.GetSlidingWindowLimiter(
                "anonymous", _ => new SlidingWindowRateLimiterOptions
                {
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 6,
                    PermitLimit = 100  // Heavily restricted for unauthenticated
                });
        }

        // Resolve plan tier from cache
        var cache = httpContext.RequestServices.GetRequiredService<IDistributedCache>();
        var planTier = cache.GetString($"plan:{workspaceId}") ?? "Free";

        var permitLimit = planTier switch
        {
            "Enterprise" => 3000,
            "Business"   => 1500,
            "Pro"        => 900,
            _            => 300   // Free tier
        };

        return RateLimitPartition.GetSlidingWindowLimiter(
            workspaceId, _ => new SlidingWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                PermitLimit = permitLimit,
                QueueLimit = 5
            });
    }
}
```

---

## 7. Security Headers

### 7.1 Security Header Middleware

```csharp
// LinearPrecision.Api/Middleware/SecurityHeadersMiddleware.cs
public class SecurityHeadersMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var headers = context.Response.Headers;

        // HSTS — enforce HTTPS for 1 year, include subdomains
        headers.Append("Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload");

        // Prevent MIME-type sniffing
        headers.Append("X-Content-Type-Options", "nosniff");

        // Prevent clickjacking
        headers.Append("X-Frame-Options", "DENY");

        // Disable legacy XSS filter (modern browsers use CSP)
        headers.Append("X-XSS-Protection", "0");

        // Referrer policy
        headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

        // Permissions policy — disable unused browser features
        headers.Append("Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

        // CSP for API responses (no inline scripts/styles)
        headers.Append("Content-Security-Policy",
            "default-src 'none'; frame-ancestors 'none'");

        // Prevent caching of authenticated responses
        if (context.User.Identity?.IsAuthenticated == true)
        {
            headers.Append("Cache-Control", "no-store, no-cache, must-revalidate");
            headers.Append("Pragma", "no-cache");
        }

        await next(context);
    }
}
```

### 7.2 CORS Configuration

```csharp
// Program.cs — CORS setup
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? ["http://localhost:3000"];

        policy
            .WithOrigins(allowedOrigins)
            .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .WithHeaders(
                "Authorization",
                "Content-Type",
                "X-Workspace-Id",
                "X-Correlation-Id",
                "X-Idempotency-Key")
            .WithExposedHeaders(
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset",
                "X-Correlation-Id",
                "Content-Disposition")
            .AllowCredentials()          // Required for SignalR
            .SetPreflightMaxAge(TimeSpan.FromSeconds(7200));
    });
});

// appsettings.json
// {
//   "Cors": {
//     "AllowedOrigins": [
//       "https://app.linearprecision.com",
//       "https://staging.linearprecision.com"
//     ]
//   }
// }
```

---

## 8. Audit Logging

### 8.1 Audit Event Schema

Reference: `data-model-and-storage-plan.md` § 2.34

```sql
CREATE TABLE audit_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_id        uuid REFERENCES users(id),
    action          varchar(50) NOT NULL,
    entity_type     varchar(50) NOT NULL,
    entity_id       uuid NOT NULL,
    old_values      jsonb,
    new_values      jsonb,
    ip_address      varchar(45),
    user_agent      varchar(500),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_events_workspace_entity ON audit_events (workspace_id, entity_type, entity_id);
CREATE INDEX ix_audit_events_workspace_actor_created ON audit_events (workspace_id, actor_id, created_at DESC);
CREATE INDEX ix_audit_events_created ON audit_events (created_at);
-- Partition-ready: consider range partitioning on created_at for large volumes
```

### 8.2 Audit Service

```csharp
// LinearPrecision.Shared/Audit/IAuditService.cs
public interface IAuditService
{
    Task RecordAsync(
        string action,
        string entityType,
        Guid entityId,
        object? oldValues = null,
        object? newValues = null,
        CancellationToken ct = default);
}

// LinearPrecision.Api/Services/AuditService.cs
public class AuditService : IAuditService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(
        AppDbContext db,
        ICurrentUserService currentUser,
        IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _currentUser = currentUser;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task RecordAsync(
        string action,
        string entityType,
        Guid entityId,
        object? oldValues = null,
        object? newValues = null,
        CancellationToken ct = default)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        var auditEvent = new AuditEvent
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = _currentUser.WorkspaceId,
            ActorId = _currentUser.UserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues != null
                ? JsonSerializer.SerializeToDocument(oldValues)
                : null,
            NewValues = newValues != null
                ? JsonSerializer.SerializeToDocument(newValues)
                : null,
            IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = httpContext?.Request.Headers.UserAgent.ToString()
                is { Length: > 0 } ua ? ua[..Math.Min(ua.Length, 500)] : null,
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditEvents.Add(auditEvent);
        await _db.SaveChangesAsync(ct);
    }
}
```

### 8.3 Audit Action Catalog

| Module | Action | Entity Type | Description |
|--------|--------|-------------|-------------|
| **Identity** | `user.login` | User | Successful authentication |
| | `user.login_failed` | User | Failed authentication attempt |
| | `user.logout` | User | Session terminated |
| | `user.password_changed` | User | Password updated |
| | `user.2fa_enabled` | User | Two-factor authentication enabled |
| | `user.2fa_disabled` | User | Two-factor authentication disabled |
| | `user.invited` | User | Invitation sent to new user |
| **Workspace** | `workspace.created` | Workspace | New workspace provisioned |
| | `workspace.updated` | Workspace | Workspace settings changed |
| | `workspace.settings_changed` | Workspace | Workspace configuration modified |
| | `workspace.member_added` | WorkspaceMember | Member joined workspace |
| | `workspace.member_removed` | WorkspaceMember | Member removed from workspace |
| | `workspace.role_changed` | WorkspaceMember | Member role updated |
| **Projects** | `project.created` | Project | New project created |
| | `project.updated` | Project | Project details changed |
| | `project.archived` | Project | Project archived |
| | `project.deleted` | Project | Project soft-deleted |
| **Tasks** | `task.created` | Task | New task created |
| | `task.status_changed` | Task | Task moved to different status |
| | `task.assigned` | Task | Task assignee changed |
| | `task.deleted` | Task | Task soft-deleted |
| **Billing** | `subscription.created` | Subscription | New subscription activated |
| | `subscription.upgraded` | Subscription | Plan upgraded |
| | `subscription.downgraded` | Subscription | Plan downgraded |
| | `subscription.cancelled` | Subscription | Subscription cancelled |
| | `plan.changed` | Subscription | Plan tier changed |
| **Documents** | `document.created` | Document | New document created |
| | `document.updated` | Document | Document content changed |
| | `document.shared` | Document | Sharing permissions changed |
| | `document.deleted` | Document | Document soft-deleted |
| **Automations** | `automation.created` | AutomationRule | New automation rule created |
| | `automation.enabled` | AutomationRule | Automation rule activated |
| | `automation.disabled` | AutomationRule | Automation rule deactivated |
| | `automation.deleted` | AutomationRule | Automation rule removed |
| **Admin** | `admin.impersonated` | User | Admin impersonated a user |
| | `admin.export_requested` | Workspace | Data export initiated |

### 8.4 Audit Log Retention

| Storage Tier | Duration | Location | Format |
|-------------|----------|----------|--------|
| Hot | 90 days | PostgreSQL `audit_events` table | Relational rows |
| Warm | 1 year | S3-compatible object storage | Compressed JSONL (gzip) |
| Cold / Archive | 7 years | S3 Glacier / equivalent | Compressed JSONL |

**Partitioning strategy:**

```sql
-- Monthly range partitioning on created_at
CREATE TABLE audit_events (
    -- ... columns as above ...
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_events_2026_01 PARTITION OF audit_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE audit_events_2026_02 PARTITION OF audit_events
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... auto-created by Hangfire recurring job
```

**Archive job:** A Hangfire recurring job (`ArchiveAuditLogs`) runs monthly, exports partitions older than 90 days to S3 as gzipped JSONL, then detaches and drops the archived partition.

---

## 9. Input Validation Strategy

### 9.1 FluentValidation Pipeline

```csharp
// LinearPrecision.Shared/Behaviors/ValidationBehavior.cs
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);
        var results = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = results
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count > 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

### 9.2 Common Validation Rules

| Field Category | Rule | Limit |
|---------------|------|-------|
| Name / Title | Required, trimmed, non-empty | 1–100 characters |
| Description | Optional | 0–5,000 characters |
| Slug / Identifier | Required, lowercase alphanumeric + hyphens | 1–50 characters |
| URL | Optional, valid URI format | 0–2,048 characters |
| Email | Optional, valid email format | 0–254 characters |
| UUID | Must be valid UUID v4 or v7 | 36 characters |
| Enum values | Must match allowed string set | Per enum definition |
| JSONB settings | Optional, valid JSON | ≤ 64 KB |
| JSONB form schemas | Optional, valid JSON | ≤ 256 KB |
| Pagination — page | Required, integer | ≥ 1 |
| Pagination — pageSize | Required, integer | 1–100 (default 25) |
| Sort field | Must be in per-endpoint whitelist | Per endpoint |
| Sort direction | `asc` or `desc` | Default `asc` |
| File upload size | Per file | ≤ 50 MB |
| File MIME type | Whitelist per feature | See § 9.3 |
| Rich text content | Required sanitization | ≤ 1 MB |

### 9.3 Anti-XSS and Input Sanitization

| Threat | Mitigation |
|--------|-----------|
| **XSS in rich text** | HTML sanitization via `HtmlSanitizer` NuGet package. Whitelist: `<p>`, `<b>`, `<i>`, `<ul>`, `<ol>`, `<li>`, `<a>`, `<h1>`–`<h6>`, `<code>`, `<pre>`, `<blockquote>`, `<img>` (with `src` validation). |
| **SQL injection** | Parameterized queries via EF Core and Dapper `@param` syntax. No raw string concatenation. |
| **Path traversal** | Validate file names against `Path.GetInvalidFileNameChars()`. Store files by UUID key, not user-supplied names. |
| **Mass assignment** | Explicit request DTOs per command. Never bind directly to entities. |
| **JSONB injection** | Validate JSON structure and depth (max 5 levels). Reject unknown top-level keys in settings payloads. |

**Allowed file MIME types:**

| Category | MIME Types |
|----------|-----------|
| Images | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` |
| Documents | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*` |
| Spreadsheets | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Archives | `application/zip`, `application/gzip` |
| Text | `text/plain`, `text/csv`, `text/markdown` |

---

## 10. Secrets Management

### 10.1 Secret Categories

| Secret | Environment Variable | Used By |
|--------|---------------------|---------|
| PostgreSQL connection string | `ConnectionStrings__DefaultConnection` | EF Core, Hangfire |
| Redis connection string | `ConnectionStrings__Redis` | Cache, SignalR backplane, rate limiter |
| JWT RSA private key | `Jwt__PrivateKey` | Token signing (RS256) |
| JWT RSA public key | `Jwt__PublicKey` | Token validation |
| Stripe secret key | `Stripe__SecretKey` | Stripe.net SDK |
| Stripe webhook secret | `Stripe__WebhookSecret` | Webhook signature verification |
| Google OAuth client secret | `Authentication__Google__ClientSecret` | Google OAuth |
| Microsoft OAuth client secret | `Authentication__Microsoft__ClientSecret` | Microsoft OAuth |
| GitHub OAuth client secret | `Authentication__GitHub__ClientSecret` | GitHub OAuth |
| S3 access key | `S3__AccessKey` | File storage |
| S3 secret key | `S3__SecretKey` | File storage |
| SMTP credentials | `Smtp__Password` | MailKit email sending |
| OpenAI API key | `AI__OpenAI__ApiKey` | Microsoft.Extensions.AI |
| Seq API key | `Serilog__WriteTo__1__Args__apiKey` | Seq log ingestion |

### 10.2 Configuration Hierarchy

| Priority | Source | Scope | Secrets Allowed |
|----------|--------|-------|-----------------|
| 1 (lowest) | `appsettings.json` | All environments | No — non-sensitive defaults only |
| 2 | `appsettings.{Environment}.json` | Per environment | No — overrides for URLs, feature flags |
| 3 | Environment variables | Container / cloud | Yes — primary method for CI/CD |
| 4 | Azure Key Vault / AWS Secrets Manager | Production only | Yes — vault-backed secret store |
| 5 (highest) | `dotnet user-secrets` | Local development | Yes — developer machine only |

```csharp
// Program.cs — configuration providers
var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsProduction())
{
    builder.Configuration.AddAzureKeyVault(
        new Uri(builder.Configuration["KeyVault:Uri"]!),
        new DefaultAzureCredential());
}
```

### 10.3 Secret Rotation

| Secret | Rotation Strategy | Downtime |
|--------|------------------|----------|
| JWT signing key | Dual-key overlap: new key signs, both keys verify for 24h, then old key removed | Zero |
| Database password | Blue-green: update password in vault, roll pods, old password valid for 1h | Zero |
| Stripe API keys | Rotate via Stripe dashboard, update vault, roll pods | Zero (Stripe supports key overlap) |
| OAuth client secrets | Generate new secret in provider, update vault, roll pods, revoke old | Zero |
| S3 credentials | IAM role rotation (preferred) or key rotation with overlap period | Zero |

---

## 11. Dependency Vulnerability Scanning

| Tool | Stage | Scope | Action on Findings |
|------|-------|-------|-------------------|
| `dotnet list package --vulnerable` | CI pipeline | NuGet packages | Fail build on High/Critical |
| GitHub Dependabot | Continuous | NuGet + Docker | Auto-PR with version bump |
| OWASP Dependency Check | Weekly CI | Transitive dependencies | Report + Slack notification |
| Trivy | CI pipeline | Docker base images | Fail build on Critical |
| `dotnet format` | Pre-commit hook | Code style | Auto-fix or fail |

**CI pipeline integration:**

```yaml
# .github/workflows/security.yml excerpt
- name: Check NuGet vulnerabilities
  run: |
    dotnet list package --vulnerable --include-transitive 2>&1 | tee vuln-report.txt
    if grep -q "has the following vulnerable packages" vuln-report.txt; then
      echo "::error::Vulnerable NuGet packages detected"
      exit 1
    fi

- name: Trivy container scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: linearprecision-api:${{ github.sha }}
    severity: CRITICAL,HIGH
    exit-code: 1
```

---

## 12. Monitoring Dashboards

### 12.1 Grafana Dashboard Catalog

| Dashboard | Key Panels | Data Source |
|-----------|-----------|-------------|
| **API Overview** | Request rate, error rate, latency P50/P95/P99, status code distribution, top slow endpoints | Prometheus (OTLP) |
| **Database** | Query duration histogram, active connections, connection pool utilization, transactions/sec, slow query log | Prometheus + PostgreSQL exporter |
| **Redis** | Hit/miss rate, memory usage, connected clients, eviction rate, command latency | Prometheus + Redis exporter |
| **SignalR** | Active connections (gauge), messages/sec, hub distribution, reconnection rate | `LinearPrecision.SignalR` meter |
| **Hangfire** | Job throughput by queue, queue depth, failure rate, retry count, processing time histogram | `LinearPrecision.Hangfire` meter |
| **Billing** | Active subscriptions by plan, MRR, churn rate, trial conversion rate, failed payments | `LinearPrecision.Billing` meter |
| **Security** | Failed auth attempts/min, rate limit rejections, audit event volume, IP blocklist hits | Prometheus + audit queries |

### 12.2 Alerting Rules

| Alert | Condition | Severity | Channel | Cooldown |
|-------|----------|----------|---------|----------|
| High Error Rate | 5xx rate > 1% for 5 min | SEV1 | PagerDuty | 15 min |
| High Latency | P95 > 500ms for 10 min | SEV2 | Slack #alerts | 30 min |
| DB Pool Exhaustion | Connection pool > 80% for 5 min | SEV2 | Slack #alerts | 15 min |
| Health Check Failure | Any dependency unhealthy for 2 min | SEV1 | PagerDuty | 5 min |
| Rate Limit Burst | Rejections > 50% of capacity/min | SEV3 | Slack #alerts | 60 min |
| Auth Brute Force | > 100 failed logins/hour per IP | SEV2 | Slack #security + audit | 30 min |
| Hangfire Dead Letters | Dead letter queue > 0 | SEV3 | Email + Slack | 60 min |
| Disk Usage | Database disk > 85% | SEV2 | Slack #infra | 4 hours |
| Certificate Expiry | TLS cert expires within 14 days | SEV3 | Email | 24 hours |
| Redis Memory | Memory usage > 80% of maxmemory | SEV2 | Slack #infra | 2 hours |

---

## 13. Incident Response

### 13.1 Severity Levels

| Level | Description | Response Time | Example |
|-------|-----------|---------------|---------|
| **SEV1** | Complete outage or data loss risk | 15 min acknowledge, 1h update | Database down, auth broken for all users |
| **SEV2** | Major feature degradation | 30 min acknowledge, 2h update | Real-time updates not working, search unavailable |
| **SEV3** | Minor feature impact | 4h acknowledge, next business day | Single background job type failing, slow reports |
| **SEV4** | Cosmetic or low-impact | Next business day | Dashboard metric incorrect, non-critical alert noise |

### 13.2 Escalation Path

1. **On-call engineer** — Initial triage, check dashboards, attempt rollback if obvious.
2. **Team lead** — Escalated if not resolved in 30 min (SEV1) or 2h (SEV2).
3. **Engineering manager** — Escalated if customer-facing impact exceeds 1h.
4. **CTO** — Escalated for data breach, extended outage (>4h), or legal/compliance impact.

### 13.3 Post-Incident Review

- Required for all SEV1 and SEV2 incidents.
- Blameless post-mortem within 48 hours.
- Document: timeline, root cause, impact, detection method, resolution steps, action items.
- Track action items in the PM tool itself (dogfooding).

---

## 14. Compliance Considerations

| Framework | Requirement | Implementation |
|-----------|------------|----------------|
| **GDPR** | Right to access | `GET /api/v1/users/me/data-export` — full user data export (JSON) |
| | Right to erasure | `DELETE /api/v1/users/me` — anonymize PII, retain aggregate data |
| | Data portability | Export tasks, projects, documents in standard formats (JSON, CSV) |
| | Consent tracking | `consent_given_at` field on user registration |
| | Data processing agreement | Available for Business/Enterprise customers |
| **SOC 2** | Audit logging | `audit_events` table with 7-year retention |
| | Access controls | 4-role RBAC with least-privilege defaults |
| | Encryption at rest | PostgreSQL TDE or disk encryption, S3 SSE |
| | Encryption in transit | TLS 1.2+ enforced via HSTS |
| | Change management | All changes via version-controlled migrations |
| **Data Residency** | Region awareness | `workspace.timezone` captures locale; future: region-pinned database shards |

---

## 15. Implementation Timeline

| Phase | Weeks | Items |
|-------|-------|-------|
| **Phase 1 — Foundation** | 1–2 | Serilog configuration, Console + Seq sinks, CorrelationId middleware, RequestLogging middleware, health checks (PostgreSQL, Redis), `/health/ready` + `/health/live` endpoints |
| **Phase 2 — Tracing** | 3–4 | OpenTelemetry SDK integration, ASP.NET Core + EF Core instrumentation, OTLP exporter, Jaeger local setup, custom MediatR tracing behavior |
| **Phase 3 — Security** | 5–8 | Security headers middleware, CORS configuration, rate limiting (all 6 policies), input validation pipeline (FluentValidation behavior), secrets management (Key Vault integration) |
| **Phase 4 — Audit** | 19–20 | Audit service implementation, audit action handlers across all modules, audit log query endpoints, CSV export endpoint, partition strategy |
| **Phase 5 — Dashboards** | 25–26 | Grafana dashboard provisioning (7 dashboards), custom metrics registration, alerting rules configuration, PagerDuty + Slack integrations |
| **Phase 6 — Hardening** | 27 | OWASP Top 10 security audit, dependency vulnerability scan, penetration testing, SLO baseline measurement, incident response runbook documentation |
| **Phase 7 — Compliance** | 27–28 | GDPR data export/erasure endpoints, audit log retention automation, encryption-at-rest verification, SOC 2 evidence collection |

---

## 16. References

| Document | Relevance |
|----------|-----------|
| `backend-architecture-master-plan.md` | Middleware pipeline, health checks, rate limiting, technology stack |
| `data-model-and-storage-plan.md` | `audit_events` table schema, partition strategy |
| `auth-tenancy-rbac-plan.md` | JWT configuration, RBAC policies, session management |
| `async-jobs-events-realtime-plan.md` | Hangfire monitoring, SignalR hub metrics, domain event tracing |
| `api-integration-master-plan.md` | Endpoint catalog for audit action mapping, rate limit policy assignment |
| `implementation-phasing.md` | Week-by-week delivery schedule |
