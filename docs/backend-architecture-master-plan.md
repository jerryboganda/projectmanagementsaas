# Backend Architecture Master Plan — Linear Precision PM SaaS

## 1. Overview

This document defines the backend architecture for the Linear Precision PM SaaS product. The system is designed as a **modular monolith** built on ASP.NET Core 9, deployed alongside a Worker Service for background processing. The existing Next.js frontend communicates exclusively through a REST API layer and SignalR hubs for real-time updates.

**Core tenets:**

- **Modular monolith** — vertical feature slices with explicit module boundaries; no microservices overhead until scale demands it.
- **Platform-agnostic** — runs in Docker on any cloud or bare metal; no vendor lock-in for compute.
- **Progressive complexity** — start simple, add sophistication (search engines, event buses, CQRS projections) only when metrics justify it.
- **Multi-tenant from day one** — row-level security with `WorkspaceId` on every tenant-scoped table.

**Infrastructure components:**

| Component | Technology | Role |
|-----------|-----------|------|
| Application server | ASP.NET Core 9 Minimal APIs | HTTP API, SignalR hubs |
| Background processor | .NET Worker Service + Hangfire | Scheduled/delayed jobs |
| Primary database | PostgreSQL 16+ | Relational storage, full-text search |
| Cache / state | Redis 7+ | Caching, rate-limit counters, SignalR backplane, token blocklist |
| Object storage | S3-compatible (MinIO local, S3/GCS/Azure Blob production) | File attachments, exports |
| Observability | OpenTelemetry → Jaeger/Prometheus/Grafana | Traces, metrics, logs |

---

## 2. Target Platform

| Aspect | Choice | Notes |
|--------|--------|-------|
| Runtime | .NET 9 | Upgrade path to .NET 10 LTS when released (Nov 2025) |
| Web framework | ASP.NET Core 9 Minimal APIs (primary) + Controllers (Identity module) | Minimal APIs for domain; Controllers where Identity scaffolding expects them |
| ORM | EF Core 9 with Npgsql provider | Code-first migrations, global query filters for multi-tenant |
| Reporting queries | Dapper | Complex analytics and cross-module reporting |
| Caching | Redis via `Microsoft.Extensions.Caching.StackExchangeRedis` | Distributed cache, rate-limit backing store |
| Background jobs | Hangfire with `Hangfire.PostgreSql` storage | Dashboard, retry policies, scheduling |
| Real-time | SignalR with Redis backplane | Board updates, notifications, presence, AI streaming |
| Observability | OpenTelemetry .NET SDK | Traces, metrics, structured logging |
| AI | `Microsoft.Extensions.AI` | Vendor-agnostic LLM abstraction |
| Auth | ASP.NET Core Identity + JWT Bearer | Full control, no external auth dependency |

---

## 3. Solution Structure

```
backend/
├── src/
│   ├── LinearPrecision.Api/                    # ASP.NET Core Web API host
│   │   ├── Modules/
│   │   │   ├── Identity/                       # Auth, users, sessions
│   │   │   │   ├── Endpoints/
│   │   │   │   │   ├── AuthEndpoints.cs
│   │   │   │   │   ├── UserEndpoints.cs
│   │   │   │   │   └── OAuthEndpoints.cs
│   │   │   │   ├── Controllers/
│   │   │   │   │   └── IdentityController.cs   # ASP.NET Identity scaffold
│   │   │   │   ├── Services/
│   │   │   │   │   ├── TokenService.cs
│   │   │   │   │   ├── RefreshTokenService.cs
│   │   │   │   │   ├── MagicLinkService.cs
│   │   │   │   │   └── OAuthService.cs
│   │   │   │   ├── Models/
│   │   │   │   │   ├── LoginRequest.cs
│   │   │   │   │   ├── RegisterRequest.cs
│   │   │   │   │   ├── TokenResponse.cs
│   │   │   │   │   └── RefreshRequest.cs
│   │   │   │   ├── Validators/
│   │   │   │   │   ├── LoginRequestValidator.cs
│   │   │   │   │   └── RegisterRequestValidator.cs
│   │   │   │   └── IdentityModule.cs            # IServiceCollection + IEndpointRouteBuilder registration
│   │   │   │
│   │   │   ├── Workspace/                       # Tenancy, membership, settings
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── WorkspaceModule.cs
│   │   │   │
│   │   │   ├── Projects/                        # Project CRUD, templates, favorites
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── ProjectsModule.cs
│   │   │   │
│   │   │   ├── Tasks/                           # Task CRUD, comments, checklists, dependencies, watchers
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   ├── Hubs/
│   │   │   │   │   └── BoardHub.cs              # Real-time board updates
│   │   │   │   └── TasksModule.cs
│   │   │   │
│   │   │   ├── Goals/                           # Goals, initiatives, milestones, OKR links
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── GoalsModule.cs
│   │   │   │
│   │   │   ├── Sprints/                         # Sprint management, velocity tracking
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── SprintsModule.cs
│   │   │   │
│   │   │   ├── Calendar/                        # Calendar items, scheduling
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── CalendarModule.cs
│   │   │   │
│   │   │   ├── Documents/                       # Rich-text docs, collaboration
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── DocumentsModule.cs
│   │   │   │
│   │   │   ├── TimeTracking/                    # Time entries, reports
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── TimeTrackingModule.cs
│   │   │   │
│   │   │   ├── Intake/                          # Request forms, submissions, triage
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── IntakeModule.cs
│   │   │   │
│   │   │   ├── Automations/                     # Automation rules, execution log
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Engine/
│   │   │   │   │   └── AutomationEngine.cs
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── AutomationsModule.cs
│   │   │   │
│   │   │   ├── Notifications/                   # In-app, email, push notifications
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Channels/
│   │   │   │   │   ├── InAppChannel.cs
│   │   │   │   │   ├── EmailChannel.cs
│   │   │   │   │   └── PushChannel.cs
│   │   │   │   ├── Hubs/
│   │   │   │   │   └── NotificationHub.cs
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── NotificationsModule.cs
│   │   │   │
│   │   │   ├── Search/                          # Full-text search, indexing
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Indexers/
│   │   │   │   ├── Models/
│   │   │   │   └── SearchModule.cs
│   │   │   │
│   │   │   ├── Billing/                         # Subscriptions, plans, usage, Stripe webhooks
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Webhooks/
│   │   │   │   │   └── StripeWebhookHandler.cs
│   │   │   │   ├── Validators/
│   │   │   │   ├── Models/
│   │   │   │   └── BillingModule.cs
│   │   │   │
│   │   │   ├── AI/                              # AI conversations, tool invocations, streaming
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Tools/
│   │   │   │   │   ├── TaskQueryTool.cs
│   │   │   │   │   ├── ProjectSummaryTool.cs
│   │   │   │   │   └── ReportGeneratorTool.cs
│   │   │   │   ├── Hubs/
│   │   │   │   │   └── AIStreamHub.cs
│   │   │   │   ├── Models/
│   │   │   │   └── AIModule.cs
│   │   │   │
│   │   │   ├── Analytics/                       # Reporting, dashboards, exports
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Reports/
│   │   │   │   ├── Models/
│   │   │   │   └── AnalyticsModule.cs
│   │   │   │
│   │   │   ├── Files/                           # File upload, presigned URLs, metadata
│   │   │   │   ├── Endpoints/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Handlers/
│   │   │   │   ├── Services/
│   │   │   │   │   └── StorageService.cs
│   │   │   │   ├── Models/
│   │   │   │   └── FilesModule.cs
│   │   │   │
│   │   │   └── Admin/                           # Workspace admin, feature flags, audit log
│   │   │       ├── Endpoints/
│   │   │       ├── Queries/
│   │   │       ├── Handlers/
│   │   │       ├── Models/
│   │   │       └── AdminModule.cs
│   │   │
│   │   ├── Infrastructure/
│   │   │   ├── Persistence/
│   │   │   │   ├── AppDbContext.cs               # Main EF Core context
│   │   │   │   ├── Configurations/              # IEntityTypeConfiguration<T> per entity
│   │   │   │   │   ├── WorkspaceConfiguration.cs
│   │   │   │   │   ├── UserConfiguration.cs
│   │   │   │   │   ├── TaskConfiguration.cs
│   │   │   │   │   └── ...
│   │   │   │   ├── Migrations/
│   │   │   │   ├── Interceptors/
│   │   │   │   │   ├── AuditInterceptor.cs      # Populate CreatedAt, UpdatedAt
│   │   │   │   │   ├── SoftDeleteInterceptor.cs  # Redirect Delete to soft-delete
│   │   │   │   │   └── TenantInterceptor.cs      # Enforce WorkspaceId on insert
│   │   │   │   └── Seeding/
│   │   │   │       ├── PlanSeeder.cs
│   │   │   │       └── DevDataSeeder.cs
│   │   │   │
│   │   │   ├── Auth/
│   │   │   │   ├── JwtTokenGenerator.cs
│   │   │   │   ├── RefreshTokenStore.cs         # Redis-backed
│   │   │   │   ├── CurrentUserAccessor.cs
│   │   │   │   └── PolicyRegistration.cs
│   │   │   │
│   │   │   ├── Middleware/
│   │   │   │   ├── TenantResolutionMiddleware.cs
│   │   │   │   ├── RequestLoggingMiddleware.cs
│   │   │   │   ├── GlobalExceptionMiddleware.cs
│   │   │   │   └── CorrelationIdMiddleware.cs
│   │   │   │
│   │   │   ├── Events/
│   │   │   │   ├── DomainEventDispatcher.cs     # MediatR-based
│   │   │   │   └── IntegrationEventPublisher.cs # For cross-module events
│   │   │   │
│   │   │   └── OpenApi/
│   │   │       ├── OpenApiConfiguration.cs
│   │   │       └── SecuritySchemeTransformer.cs
│   │   │
│   │   ├── Program.cs                           # Host builder, service registration, middleware pipeline
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   └── LinearPrecision.Api.csproj
│   │
│   ├── LinearPrecision.Worker/                  # Background job processor
│   │   ├── Jobs/
│   │   │   ├── EmailDispatchJob.cs
│   │   │   ├── SearchIndexJob.cs
│   │   │   ├── UsageAggregationJob.cs
│   │   │   ├── AutomationExecutionJob.cs
│   │   │   ├── ReportGenerationJob.cs
│   │   │   ├── InvitationExpiryJob.cs
│   │   │   ├── SprintAutoCompleteJob.cs
│   │   │   └── CleanupJob.cs
│   │   ├── Program.cs
│   │   └── LinearPrecision.Worker.csproj
│   │
│   └── LinearPrecision.Shared/                  # Shared kernel — no infrastructure dependencies
│       ├── Domain/
│       │   ├── BaseEntity.cs                    # Id, CreatedAt, UpdatedAt
│       │   ├── TenantEntity.cs                  # extends BaseEntity + WorkspaceId
│       │   ├── ISoftDeletable.cs
│       │   ├── IAuditable.cs
│       │   └── Enums/
│       │       ├── TaskStatus.cs
│       │       ├── TaskPriority.cs
│       │       ├── MembershipRole.cs
│       │       ├── GoalStatus.cs
│       │       ├── SprintStatus.cs
│       │       ├── InvitationStatus.cs
│       │       └── ...
│       ├── Events/
│       │   ├── IDomainEvent.cs
│       │   ├── TaskCreatedEvent.cs
│       │   ├── TaskStatusChangedEvent.cs
│       │   ├── MemberInvitedEvent.cs
│       │   ├── SprintStartedEvent.cs
│       │   └── ...
│       ├── Contracts/
│       │   ├── ICurrentUser.cs
│       │   ├── ITenantContext.cs
│       │   ├── IStorageService.cs
│       │   ├── IEmailService.cs
│       │   └── ISearchService.cs
│       └── Extensions/
│           ├── StringExtensions.cs
│           ├── DateTimeExtensions.cs
│           ├── QueryableExtensions.cs
│           └── GuidExtensions.cs
│
├── tests/
│   ├── LinearPrecision.Api.Tests/               # Unit tests per module
│   │   ├── Modules/
│   │   │   ├── Identity/
│   │   │   ├── Tasks/
│   │   │   └── ...
│   │   └── Infrastructure/
│   │
│   ├── LinearPrecision.Worker.Tests/            # Worker job tests
│   │
│   └── LinearPrecision.Integration.Tests/       # Integration tests with Testcontainers
│       ├── Fixtures/
│       │   ├── ApiFixture.cs                    # WebApplicationFactory + Testcontainers
│       │   └── DatabaseFixture.cs
│       ├── Modules/
│       │   ├── Identity/
│       │   ├── Tasks/
│       │   └── ...
│       └── Helpers/
│           ├── AuthHelper.cs
│           └── SeedHelper.cs
│
├── docker-compose.yml                           # Production-like
├── docker-compose.override.yml                  # Dev overrides (ports, volumes, hot reload)
├── Dockerfile.api
├── Dockerfile.worker
├── .env.example
└── LinearPrecision.sln
```

---

## 4. Application Style Decisions

### 4.1 API Routing Strategy

**Minimal APIs** are the default for all domain modules. Each module registers its endpoints in a static extension method:

```csharp
// ProjectsModule.cs
public static class ProjectsModule
{
    public static IServiceCollection AddProjectsModule(this IServiceCollection services)
    {
        services.AddScoped<IProjectService, ProjectService>();
        services.AddValidatorsFromAssemblyContaining<CreateProjectValidator>();
        return services;
    }

    public static IEndpointRouteBuilder MapProjectsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/projects")
            .WithTags("Projects")
            .RequireAuthorization("WorkspaceMember");

        group.MapGet("/", ProjectEndpoints.List)
            .WithName("ListProjects")
            .WithDescription("List all projects in the current workspace")
            .Produces<PagedResult<ProjectDto>>(200);

        group.MapPost("/", ProjectEndpoints.Create)
            .WithName("CreateProject")
            .Produces<ProjectDto>(201)
            .ProducesValidationProblem();

        group.MapGet("/{projectId:guid}", ProjectEndpoints.Get)
            .WithName("GetProject")
            .Produces<ProjectDto>(200)
            .ProducesProblem(404);

        group.MapPut("/{projectId:guid}", ProjectEndpoints.Update)
            .WithName("UpdateProject")
            .Produces<ProjectDto>(200);

        group.MapDelete("/{projectId:guid}", ProjectEndpoints.Delete)
            .WithName("DeleteProject")
            .Produces(204);

        return app;
    }
}
```

**Controllers** are used only for the Identity module, where ASP.NET Core Identity scaffolding and middleware integration is more natural:

```csharp
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<TokenResponse>> Login(LoginRequest request) { ... }

    [HttpPost("register")]
    public async Task<ActionResult<TokenResponse>> Register(RegisterRequest request) { ... }

    [HttpPost("refresh")]
    public async Task<ActionResult<TokenResponse>> Refresh(RefreshRequest request) { ... }
}
```

### 4.2 CQRS-Lite Pattern

Each module follows a lightweight CQRS pattern without separate read/write databases:

```
Module/
├── Commands/
│   ├── CreateTask.cs          # record CreateTask(string Title, ...) : IRequest<TaskDto>
│   └── UpdateTaskStatus.cs
├── Queries/
│   ├── GetTaskById.cs         # record GetTaskById(Guid Id) : IRequest<TaskDto?>
│   └── ListTasks.cs
├── Handlers/
│   ├── CreateTaskHandler.cs   # IRequestHandler<CreateTask, TaskDto>
│   └── ListTasksHandler.cs
└── Validators/
    ├── CreateTaskValidator.cs # AbstractValidator<CreateTask>
    └── UpdateTaskStatusValidator.cs
```

MediatR pipeline behaviors enforce cross-cutting logic:

```csharp
// Validation behavior — runs FluentValidation before every handler
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        => _validators = validators;

    public async Task<TResponse> Handle(TRequest request,
        RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = (await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, ct))))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Count > 0)
            throw new ValidationException(failures);

        return await next();
    }
}

// Logging behavior
public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public async Task<TResponse> Handle(TRequest request,
        RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        _logger.LogInformation("Handling {RequestName}", typeof(TRequest).Name);
        var sw = Stopwatch.StartNew();
        var response = await next();
        _logger.LogInformation("Handled {RequestName} in {Elapsed}ms",
            typeof(TRequest).Name, sw.ElapsedMilliseconds);
        return response;
    }
}
```

### 4.3 Domain Events

Domain events are dispatched **in-process** via MediatR notifications:

```csharp
public record TaskCreatedEvent(Guid TaskId, Guid ProjectId, Guid WorkspaceId) : INotification;

// Consumer in Notifications module
public class TaskCreatedNotificationHandler : INotificationHandler<TaskCreatedEvent>
{
    public async Task Handle(TaskCreatedEvent evt, CancellationToken ct)
    {
        // Create in-app notification for project watchers
        // Enqueue email notification job
    }
}
```

### 4.4 Real-Time Strategy

SignalR hubs are grouped by concern:

| Hub | Path | Purpose |
|-----|------|---------|
| `BoardHub` | `/hubs/board` | Task moves, column changes, sprint board |
| `NotificationHub` | `/hubs/notifications` | Real-time notification delivery |
| `PresenceHub` | `/hubs/presence` | Online status, document editing presence |
| `AIStreamHub` | `/hubs/ai` | Streaming AI responses |

All hubs use the Redis backplane for multi-instance scaling.

### 4.5 Error Handling

All errors are returned as RFC 7807 Problem Details:

```csharp
public class GlobalExceptionMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try { await next(context); }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new ValidationProblemDetails
            {
                Title = "Validation Failed",
                Status = 400,
                Errors = ex.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())
            });
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Not Found",
                Status = 404,
                Detail = ex.Message
            });
        }
        catch (ForbiddenException ex)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Forbidden",
                Status = 403,
                Detail = ex.Message
            });
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Internal Server Error",
                Status = 500,
                Detail = _env.IsDevelopment() ? ex.ToString() : "An unexpected error occurred."
            });
        }
    }
}
```

---

## 5. Module Boundaries

### 5.1 Identity Module

**Responsibility:** User registration, authentication, sessions, password recovery, OAuth, profile management, 2FA.

**Entities:** `User` (extends IdentityUser), `RefreshToken` (Redis)

**Dependencies:** None (foundational module)

**Key endpoints:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/magic-link`
- `GET /api/v1/auth/oauth/{provider}`
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `PUT /api/v1/users/me/password`
- `GET /api/v1/users/me/workspaces`
- `PUT /api/v1/users/me/active-workspace`

### 5.2 Workspace Module

**Responsibility:** Multi-tenant workspace management, memberships, invitations, workspace settings.

**Entities:** `Workspace`, `Membership`, `Invitation`

**Dependencies:** Identity

**Key endpoints:**
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces`
- `GET /api/v1/workspaces/{id}`
- `PUT /api/v1/workspaces/{id}`
- `GET /api/v1/workspaces/{id}/members`
- `POST /api/v1/workspaces/{id}/invitations`
- `PUT /api/v1/workspaces/{id}/settings`

### 5.3 Projects Module

**Responsibility:** Project CRUD, templates, favorites, project-level settings.

**Entities:** `Project`, `ProjectFavorite`, `ProjectTemplate`

**Dependencies:** Workspace

**Key endpoints:**
- `CRUD /api/v1/projects`
- `POST /api/v1/projects/{id}/favorite`
- `POST /api/v1/projects/from-template`

### 5.4 Tasks Module

**Responsibility:** Task CRUD, comments, checklists, dependencies, watchers, attachments, board views.

**Entities:** `Task`, `TaskComment`, `TaskWatcher`, `TaskDependency`, `TaskChecklistItem`, `TaskAttachment`

**Dependencies:** Projects, Sprints, Identity (assignee)

**Key endpoints:**
- `CRUD /api/v1/tasks`
- `POST /api/v1/tasks/{id}/comments`
- `POST /api/v1/tasks/{id}/checklist`
- `POST /api/v1/tasks/{id}/dependencies`
- `POST /api/v1/tasks/{id}/watchers`
- `POST /api/v1/tasks/{id}/attachments`
- `PUT /api/v1/tasks/{id}/status` (triggers board hub)

### 5.5 Goals Module

**Responsibility:** Goal tracking, initiatives, milestones, project-goal links (OKR-style).

**Entities:** `Goal`, `GoalProjectLink`, `Initiative`, `InitiativeMilestone`

**Dependencies:** Projects

**Key endpoints:**
- `CRUD /api/v1/goals`
- `CRUD /api/v1/goals/{id}/initiatives`
- `POST /api/v1/goals/{id}/projects`

### 5.6 Sprints Module

**Responsibility:** Sprint creation, start/complete, task assignment, velocity tracking.

**Entities:** `Sprint`

**Dependencies:** Projects, Tasks

**Key endpoints:**
- `CRUD /api/v1/projects/{projectId}/sprints`
- `POST /api/v1/sprints/{id}/start`
- `POST /api/v1/sprints/{id}/complete`

### 5.7 Calendar Module

**Responsibility:** Calendar items, scheduling, due-date views.

**Entities:** `CalendarItem`

**Dependencies:** Tasks, Projects

**Key endpoints:**
- `CRUD /api/v1/calendar`
- `GET /api/v1/calendar?start={}&end={}`

### 5.8 Documents Module

**Responsibility:** Rich-text document CRUD, versioning, collaboration presence.

**Entities:** `Document`

**Dependencies:** Projects, Workspace

**Key endpoints:**
- `CRUD /api/v1/documents`
- `GET /api/v1/projects/{id}/documents`

### 5.9 TimeTracking Module

**Responsibility:** Time entries, time reports, timer start/stop.

**Entities:** `TimeEntry`

**Dependencies:** Tasks, Projects, Identity

**Key endpoints:**
- `CRUD /api/v1/time-entries`
- `POST /api/v1/time-entries/start`
- `POST /api/v1/time-entries/{id}/stop`
- `GET /api/v1/time-entries/report`

### 5.10 Intake Module

**Responsibility:** Request forms, public submission, triage queue.

**Entities:** `RequestForm`, `RequestSubmission`

**Dependencies:** Projects, Tasks (auto-create)

**Key endpoints:**
- `CRUD /api/v1/request-forms`
- `POST /api/v1/intake/{formSlug}/submit` (public)
- `GET /api/v1/intake/submissions`
- `POST /api/v1/intake/submissions/{id}/convert-to-task`

### 5.11 Automations Module

**Responsibility:** Trigger-action automation rules, execution log.

**Entities:** `AutomationRule`, `AutomationLog`

**Dependencies:** Tasks, Projects (trigger sources)

**Key endpoints:**
- `CRUD /api/v1/automations`
- `GET /api/v1/automations/{id}/logs`
- `POST /api/v1/automations/{id}/test`

### 5.12 Notifications Module

**Responsibility:** In-app notifications, email dispatch, push tokens, notification preferences.

**Entities:** `Notification`, `NotificationPreference`

**Dependencies:** Identity (recipient), all modules (event sources)

**Key endpoints:**
- `GET /api/v1/notifications`
- `PUT /api/v1/notifications/{id}/read`
- `PUT /api/v1/notifications/{id}/archive`
- `PUT /api/v1/notifications/read-all`
- `GET /api/v1/notifications/preferences`
- `PUT /api/v1/notifications/preferences`

### 5.13 Search Module

**Responsibility:** Full-text search across tasks, projects, documents, goals.

**Entities:** None (reads from indexed sources)

**Dependencies:** Tasks, Projects, Documents, Goals

**Key endpoints:**
- `GET /api/v1/search?q={query}&type={task|project|document|goal}`

### 5.14 Billing Module

**Responsibility:** Subscription management, plan enforcement, usage tracking, plan catalog, Stripe integration.

**Entities:** `Subscription`, `Plan`, `UsageRecord`

**Dependencies:** Workspace, Identity

**Key endpoints:**
- `GET /api/v1/billing/subscription`
- `POST /api/v1/billing/subscription`
- `PUT /api/v1/billing/subscription`
- `DELETE /api/v1/billing/subscription`
- `POST /api/v1/billing/checkout`
- `POST /api/v1/billing/portal`
- `POST /api/v1/billing/webhook` (Stripe)
- `GET /api/v1/billing/usage`
- `GET /api/v1/billing/usage/summary`
- `GET /api/v1/plans`
- `GET /api/v1/plans/{id}`

### 5.15 AI Module

**Responsibility:** AI conversations, tool invocations, streaming responses.

**Entities:** `AIConversation`, `AIMessage`, `AIToolInvocation`

**Dependencies:** Tasks, Projects, Goals (tool targets)

**Key endpoints:**
- `POST /api/v1/ai/conversations`
- `POST /api/v1/ai/conversations/{id}/messages`
- `GET /api/v1/ai/conversations`
- `DELETE /api/v1/ai/conversations/{id}`

### 5.16 Analytics Module

**Responsibility:** Reporting dashboards, data exports, velocity metrics.

**Entities:** None (reads via Dapper queries)

**Dependencies:** Tasks, Sprints, TimeTracking, Projects

**Key endpoints:**
- `GET /api/v1/analytics/velocity`
- `GET /api/v1/analytics/burndown`
- `GET /api/v1/analytics/workload`
- `GET /api/v1/analytics/export` (PDF, CSV)

### 5.17 Files Module

**Responsibility:** File upload, presigned URL generation, metadata management.

**Entities:** `FileAttachment`

**Dependencies:** Workspace (tenant scoping)

**Key endpoints:**
- `POST /api/v1/files/upload`
- `GET /api/v1/files/{id}/url` (presigned)
- `DELETE /api/v1/files/{id}`

### 5.18 Admin Module

**Responsibility:** Workspace administration, audit events, feature flags.

**Entities:** `AuditEvent`, `FeatureFlag`

**Dependencies:** Workspace, Identity

**Key endpoints:**
- `GET /api/v1/admin/audit-events`
- `GET /api/v1/admin/audit-events/{id}`
- `GET /api/v1/admin/feature-flags`
- `POST /api/v1/admin/feature-flags`
- `PUT /api/v1/admin/feature-flags/{id}`
- `DELETE /api/v1/admin/feature-flags/{id}`
- `GET /api/v1/admin/workspace-stats`

---

## 6. Cross-Cutting Concerns

### 6.1 Middleware Pipeline Order

```csharp
// Program.cs middleware registration order
app.UseCorrelationId();           // 1. Attach correlation ID to every request
app.UseRequestLogging();          // 2. Structured request/response logging
app.UseGlobalExceptionHandler();  // 3. Catch-all error handler → ProblemDetails
app.UseRateLimiter();             // 4. Rate limiting (Redis-backed sliding window)
app.UseCors("DefaultPolicy");     // 5. CORS headers
app.UseAuthentication();          // 6. JWT validation
app.UseTenantResolution();        // 7. Resolve workspace from X-Workspace-Id header
app.UseAuthorization();           // 8. Policy evaluation
app.UseOutputCache();             // 9. Response caching for read-heavy endpoints
```

### 6.2 Tenant Resolution

```csharp
public class TenantResolutionMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // Skip for auth endpoints and public intake endpoints
        if (context.Request.Path.StartsWithSegments("/api/v1/auth") ||
            context.Request.Path.StartsWithSegments("/api/v1/intake"))
        {
            await next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("X-Workspace-Id", out var workspaceIdHeader) ||
            !Guid.TryParse(workspaceIdHeader, out var workspaceId))
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Missing Workspace Context",
                Status = 400,
                Detail = "X-Workspace-Id header is required."
            });
            return;
        }

        var tenantContext = context.RequestServices.GetRequiredService<ITenantContext>();
        tenantContext.WorkspaceId = workspaceId;

        // Verify user is a member of this workspace
        var membershipCheck = context.RequestServices.GetRequiredService<IMembershipService>();
        var userId = context.User.GetUserId();
        if (userId.HasValue && !await membershipCheck.IsMember(userId.Value, workspaceId))
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Title = "Forbidden",
                Status = 403,
                Detail = "You are not a member of this workspace."
            });
            return;
        }

        await next(context);
    }
}
```

### 6.3 Health Checks

```csharp
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "postgresql")
    .AddRedis(redisConnectionString, name: "redis")
    .AddUrlGroup(new Uri("https://api.stripe.com/v1"), name: "stripe", tags: ["external"])
    .AddCheck<HangfireHealthCheck>("hangfire");

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = _ => true,
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false  // Just checks the app is running
});
```

### 6.4 OpenAPI Configuration

```csharp
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, ct) =>
    {
        document.Info.Title = "Linear Precision PM API";
        document.Info.Version = "v1";
        document.Info.Description = "Project Management SaaS API";
        return Task.CompletedTask;
    });

    options.AddDocumentTransformer<SecuritySchemeTransformer>();
});
```

### 6.5 CORS Configuration

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()!)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();  // Required for SignalR
    });
});
```

### 6.6 Rate Limiting

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;

    // Global sliding window
    options.AddSlidingWindowLimiter("global", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.SegmentsPerWindow = 6;
        limiter.PermitLimit = 600;
        limiter.QueueLimit = 10;
    });

    // Strict limit for auth endpoints
    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(15);
        limiter.PermitLimit = 20;
    });

    // AI endpoints — token-expensive
    options.AddTokenBucketLimiter("ai", limiter =>
    {
        limiter.TokenLimit = 30;
        limiter.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
        limiter.TokensPerPeriod = 10;
    });
});
```

---

## 7. Technology Stack Summary

| Package | Version | Purpose |
|---------|---------|---------|
| `Microsoft.AspNetCore.App` | 9.0.x | ASP.NET Core framework |
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore` | 9.0.x | User management + EF Core store |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 9.0.x | JWT token validation |
| `Microsoft.AspNetCore.Authentication.Google` | 9.0.x | Google OAuth |
| `Microsoft.AspNetCore.Authentication.MicrosoftAccount` | 9.0.x | Microsoft OAuth |
| `AspNet.Security.OAuth.GitHub` | 9.0.x | GitHub OAuth |
| `Microsoft.AspNetCore.SignalR.StackExchangeRedis` | 9.0.x | SignalR Redis backplane |
| `Microsoft.AspNetCore.OpenApi` | 9.0.x | OpenAPI document generation |
| `Microsoft.AspNetCore.RateLimiting` | 9.0.x | Built-in rate limiter |
| `Microsoft.EntityFrameworkCore` | 9.0.x | ORM framework |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 9.0.x | EF Core PostgreSQL provider |
| `Microsoft.EntityFrameworkCore.Tools` | 9.0.x | CLI migration tooling |
| `Dapper` | 2.1.x | Micro-ORM for reporting queries |
| `MediatR` | 12.x | In-process messaging, CQRS dispatch |
| `FluentValidation.DependencyInjectionExtensions` | 11.x | Validation rules + DI integration |
| `Hangfire.AspNetCore` | 1.8.x | Background job framework |
| `Hangfire.PostgreSql` | 1.20.x | Hangfire PostgreSQL storage |
| `StackExchange.Redis` | 2.8.x | Redis client |
| `Microsoft.Extensions.Caching.StackExchangeRedis` | 9.0.x | Distributed cache over Redis |
| `Microsoft.Extensions.AI` | 9.x | Vendor-agnostic AI abstraction |
| `Microsoft.Extensions.AI.OpenAI` | 9.x | OpenAI provider for M.E.AI |
| `Microsoft.FeatureManagement.AspNetCore` | 4.x | Feature flag evaluation |
| `OpenTelemetry.Extensions.Hosting` | 1.9.x | Telemetry host integration |
| `OpenTelemetry.Instrumentation.AspNetCore` | 1.9.x | HTTP request tracing |
| `OpenTelemetry.Instrumentation.EntityFrameworkCore` | 1.x | EF Core query tracing |
| `OpenTelemetry.Exporter.OpenTelemetryProtocol` | 1.9.x | OTLP exporter |
| `Serilog.AspNetCore` | 8.x | Structured logging |
| `Serilog.Sinks.OpenTelemetry` | 4.x | Log export via OTLP |
| `QuestPDF` | 2024.x | PDF report generation |
| `MailKit` | 4.x | SMTP email sending |
| `AWSSDK.S3` | 3.x | S3-compatible object storage |
| `Stripe.net` | 45.x | Stripe billing integration |
| `Scalar.AspNetCore` | 1.x | OpenAPI UI (Scalar replaces Swagger UI) |
| `AspNetCore.HealthChecks.NpgSql` | 8.x | PostgreSQL health check |
| `AspNetCore.HealthChecks.Redis` | 8.x | Redis health check |
| `AspNetCore.HealthChecks.Uris` | 8.x | External URL health check |

### Test dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `Microsoft.AspNetCore.Mvc.Testing` | 9.0.x | WebApplicationFactory |
| `Testcontainers.PostgreSql` | 3.x | Disposable PostgreSQL for integration tests |
| `Testcontainers.Redis` | 3.x | Disposable Redis for integration tests |
| `xunit` | 2.9.x | Test framework |
| `FluentAssertions` | 7.x | Assertion library |
| `NSubstitute` | 5.x | Mocking framework |
| `Bogus` | 35.x | Test data generation |

---

## 8. Deployment Architecture

### 8.1 Docker Compose (Development)

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=linearprecision;Username=lp;Password=dev
      - ConnectionStrings__Redis=redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=linearprecision;Username=lp;Password=dev
      - ConnectionStrings__Redis=redis:6379
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: linearprecision
      POSTGRES_USER: lp
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lp -d linearprecision"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

### 8.2 Production Deployment

The application is platform-agnostic. Recommended production targets:

1. **Container orchestration:** Kubernetes or Railway/Fly.io/Render
2. **Managed PostgreSQL:** Neon, Supabase, AWS RDS, Azure Database for PostgreSQL
3. **Managed Redis:** Upstash, AWS ElastiCache, Azure Cache for Redis
4. **Object Storage:** AWS S3, GCS, Azure Blob, Cloudflare R2
5. **CDN:** Cloudflare or cloud-native CDN for frontend assets

---

## 9. Program.cs — Host Wiring

```csharp
var builder = WebApplication.CreateBuilder(args);

// === Infrastructure ===
builder.AddServiceDefaults();    // OpenTelemetry, health checks, logging
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddStackExchangeRedisCache(options =>
    options.Configuration = builder.Configuration.GetConnectionString("Redis"));

// === Auth ===
builder.Services.AddIdentity<User, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* RS256 config */ })
    .AddGoogle(options => { /* Google OAuth */ })
    .AddMicrosoftAccount(options => { /* MS OAuth */ })
    .AddGitHub(options => { /* GitHub OAuth */ });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("WorkspaceOwner", p => p.RequireRole("Owner"));
    options.AddPolicy("WorkspaceAdmin", p => p.RequireRole("Owner", "Admin"));
    options.AddPolicy("WorkspaceMember", p => p.RequireRole("Owner", "Admin", "Member"));
    options.AddPolicy("WorkspaceGuest", p => p.RequireRole("Owner", "Admin", "Member", "Guest"));
});

// === Cross-cutting ===
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
builder.Services.AddSignalR().AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis")!);
builder.Services.AddHangfire(cfg => cfg.UsePostgreSqlStorage(
    builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();
builder.Services.AddRateLimiter(/* ... */);
builder.Services.AddCors(/* ... */);
builder.Services.AddOpenApi();
builder.Services.AddFeatureManagement();

// === Module registration ===
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

// === Middleware pipeline ===
app.UseCorrelationId();
app.UseRequestLogging();
app.UseGlobalExceptionHandler();
app.UseRateLimiter();
app.UseCors("DefaultPolicy");
app.UseAuthentication();
app.UseTenantResolution();
app.UseAuthorization();

// === Endpoint mapping ===
app.MapOpenApi();
app.MapScalarApiReference();
app.MapHealthChecks("/health/ready");
app.MapHealthChecks("/health/live");
app.MapHangfireDashboard("/hangfire");

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

app.MapHub<BoardHub>("/hubs/board");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<PresenceHub>("/hubs/presence");
app.MapHub<AIStreamHub>("/hubs/ai");

app.Run();
```

---

## 10. Phase Delivery Plan

| Phase | Scope | Target |
|-------|-------|--------|
| **Phase 1** | Identity, Workspace, Projects, Tasks (core CRUD) | Week 1-3 |
| **Phase 2** | Goals, Sprints, Calendar, Documents | Week 4-6 |
| **Phase 3** | TimeTracking, Intake, Automations, Notifications | Week 7-9 |
| **Phase 4** | Search, Billing, Files, Admin | Week 10-12 |
| **Phase 5** | AI, Analytics, polish, performance | Week 13-15 |
| **Phase 6** | Production hardening, monitoring, load testing | Week 16-18 |

Each phase follows: Schema → Endpoints → Tests → Frontend integration → Review.
