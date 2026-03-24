# Implementation Phasing -- Detailed Week-by-Week Plan

> Linear Precision -- Backend Build-Out Execution Plan
> Owner: Engineering Lead | Status: Draft | Last Updated: 2026-03-18

---

## 1. Overview

This document is the operational execution plan for building the Linear Precision backend. It maps directly to the phases defined in `docs/mvp-to-functional-saas-migration-roadmap.md` but drills down to **week-level task lists** with specific deliverables, acceptance criteria, and risk callouts.

**Scope**: 28 weeks, 5 phases, from bare .NET solution to production-grade SaaS.

**Current state**: 100% frontend-only Next.js prototype. 17 routes. Zero backend. Zero persistence. See `docs/architecture.md` for the full current-state inventory.

---

## 2. Prerequisites

Before Week 1 begins:

| Prerequisite | Owner | Status |
|-------------|-------|--------|
| PostgreSQL 16 available locally or via Docker | DevOps | Pending |
| Redis 7 available locally or via Docker | DevOps | Pending |
| .NET 9 SDK installed on dev machines | All devs | Pending |
| IDE setup (Rider or VS 2022 + C# extension) | All devs | Pending |
| Docker Desktop or Rancher Desktop installed | All devs | Pending |
| GitHub repo with branch protection | DevOps | Pending |
| CI runner configured (GitHub Actions) | DevOps | Pending |
| Stripe test account created | Product | Pending |
| Google Cloud project for Gemini API | AI Lead | Pending |
| Domain registered (linearprecision.com) | Product | Pending |

---

## 3. Phase P0: Foundations (Weeks 1-4)

### Week 1: Solution Bootstrap

**Goal**: .NET solution compiles, Docker Compose runs, health check responds.

**Day 1-2: Solution Structure**
- [ ] Create `LinearPrecision.sln` at repo root
- [ ] Create `src/LinearPrecision.Api/` (ASP.NET Core 9 Minimal API)
- [ ] Create `src/LinearPrecision.Worker/` (.NET 9 BackgroundService host)
- [ ] Create `src/LinearPrecision.Shared/` (class library: entities, DTOs, interfaces)
- [ ] Create `tests/LinearPrecision.Api.Tests/` (xUnit test project)
- [ ] Add `Directory.Build.props` with shared settings:
  ```xml
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  ```
- [ ] Add `.editorconfig` with C# coding conventions
- [ ] Add `global.json` pinning .NET 9 SDK version

**Day 2-3: NuGet Packages**

Api project:
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.*" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.*" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="9.0.*" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.*" />
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.*" />
<PackageReference Include="NSwag.AspNetCore" Version="14.*" />
<PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.*" />
<PackageReference Include="MediatR" Version="12.*" />
<PackageReference Include="StackExchange.Redis" Version="2.*" />
<PackageReference Include="Serilog.AspNetCore" Version="8.*" />
<PackageReference Include="Serilog.Sinks.Console" Version="6.*" />
<PackageReference Include="Serilog.Sinks.Seq" Version="8.*" />
<PackageReference Include="Microsoft.AspNetCore.SignalR" />
```

Test project:
```xml
<PackageReference Include="xunit" Version="2.*" />
<PackageReference Include="FluentAssertions" Version="7.*" />
<PackageReference Include="NSubstitute" Version="5.*" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.0.*" />
<PackageReference Include="Testcontainers.PostgreSql" Version="4.*" />
<PackageReference Include="Testcontainers.Redis" Version="4.*" />
<PackageReference Include="Verify.Xunit" Version="26.*" />
```

**Day 3-4: Program.cs and Docker Compose**
- [ ] Configure `Program.cs`:
  - Serilog logging
  - CORS policy (allow frontend origin)
  - Health check endpoint (`/health`)
  - OpenAPI spec generation
  - Swagger UI (development only)
  - Exception handler middleware
  - Request logging middleware
- [ ] Create `docker-compose.yml`:
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      ports: ["5432:5432"]
      environment:
        POSTGRES_DB: linearprecision
        POSTGRES_USER: lp_user
        POSTGRES_PASSWORD: lp_dev_password
      volumes:
        - pgdata:/var/lib/postgresql/data
    redis:
      image: redis:7-alpine
      ports: ["6379:6379"]
    api:
      build: ./src/LinearPrecision.Api
      ports: ["5000:8080"]
      environment:
        ConnectionStrings__Database: Host=postgres;Database=linearprecision;Username=lp_user;Password=lp_dev_password
        ConnectionStrings__Redis: redis:6379
      depends_on: [postgres, redis]
  volumes:
    pgdata:
  ```
- [ ] Create `Dockerfile` for API project
- [ ] Create `appsettings.Development.json` with connection strings

**Day 5: CI Pipeline**
- [ ] Create `.github/workflows/ci.yml`:
  - Checkout -> Setup .NET 9 -> Restore -> Build -> Unit Tests
  - Run on push to main and PRs
- [ ] Verify: `dotnet build` passes
- [ ] Verify: `docker compose up` starts all services
- [ ] Verify: `GET /health` returns 200
- [ ] Verify: `GET /openapi/v1.json` returns valid spec
- [ ] Verify: CI pipeline is green

**Acceptance Criteria:**
- `dotnet build` succeeds with zero warnings
- `docker compose up` starts PostgreSQL, Redis, and API
- `/health` returns `{ "status": "Healthy" }`
- `/openapi/v1.json` returns valid OpenAPI 3.1 document
- CI pipeline runs and passes

---

### Week 2: Database Foundation

**Goal**: Core entity schema exists, migrations work, multi-tenant query filters active.

**Day 1-2: Entity Classes**

Define in `LinearPrecision.Shared/Entities/`:

```
Entities/
├── Workspace.cs          # id, name, slug, plan_tier, logo_url, created_at
├── User.cs               # id (Identity), email, display_name, avatar_url, created_at
├── WorkspaceMembership.cs # workspace_id, user_id, role, joined_at, invited_by
├── Invitation.cs         # id, workspace_id, email, role, token, expires_at, accepted_at
├── Project.cs            # id, workspace_id, name, identifier, description, status, lead_id, created_by, created_at, icon, color
├── ProjectStatus.cs      # id, project_id, name, color, sort_order, is_default, is_done_state
├── TaskEntity.cs         # id, project_id, workspace_id, parent_task_id, identifier, title, description, status_id, priority, assignee_id, reporter_id, sort_order, due_date, estimated_hours, created_by, created_at, updated_at, version
├── TaskComment.cs        # id, task_id, author_id, content, comment_type, created_at, updated_at
├── TaskWatcher.cs        # task_id, user_id
├── TaskDependency.cs     # id, blocker_task_id, blocked_task_id, dependency_type
├── TaskChecklist.cs      # id, task_id, title, is_completed, sort_order
├── Label.cs              # id, workspace_id, name, color
├── TaskLabel.cs          # task_id, label_id
├── Sprint.cs             # id, project_id, workspace_id, name, goal, start_date, end_date, status, created_by
├── SprintTask.cs         # sprint_id, task_id, sort_order
├── Goal.cs               # id, workspace_id, parent_goal_id, title, description, target_value, current_value, unit, start_date, end_date, status, owner_id
├── GoalLink.cs           # id, goal_id, linked_entity_type, linked_entity_id
├── CalendarEvent.cs      # id, workspace_id, project_id, title, description, start_time, end_time, all_day, location, created_by
├── TimeEntry.cs          # id, workspace_id, task_id, user_id, date, hours, description, billable
├── Document.cs           # id, workspace_id, parent_document_id, title, content_json, is_folder, created_by, created_at, updated_at
└── Notification.cs       # id, workspace_id, user_id, type, title, body, entity_type, entity_id, is_read, created_at
```

**Day 2-3: DbContext Configuration**

```csharp
public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    // DbSets
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMembership> Memberships => Set<WorkspaceMembership>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskEntity> Tasks => Set<TaskEntity>();
    // ... all entities

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Multi-tenant query filters
        builder.Entity<Project>().HasQueryFilter(p => p.WorkspaceId == _tenantContext.WorkspaceId);
        builder.Entity<TaskEntity>().HasQueryFilter(t => t.WorkspaceId == _tenantContext.WorkspaceId);
        builder.Entity<Sprint>().HasQueryFilter(s => s.WorkspaceId == _tenantContext.WorkspaceId);
        builder.Entity<Goal>().HasQueryFilter(g => g.WorkspaceId == _tenantContext.WorkspaceId);
        builder.Entity<CalendarEvent>().HasQueryFilter(e => e.WorkspaceId == _tenantContext.WorkspaceId);
        builder.Entity<TimeEntry>().HasQueryFilter(te => te.WorkspaceId == _tenantContext.WorkspaceId);
        builder.Entity<Document>().HasQueryFilter(d => d.WorkspaceId == _tenantContext.WorkspaceId);
        builder.Entity<Notification>().HasQueryFilter(n => n.WorkspaceId == _tenantContext.WorkspaceId);

        // Indexes
        builder.Entity<TaskEntity>().HasIndex(t => new { t.ProjectId, t.StatusId, t.SortOrder });
        builder.Entity<TaskEntity>().HasIndex(t => t.AssigneeId);
        builder.Entity<TaskEntity>().HasIndex(t => t.DueDate);
        builder.Entity<Notification>().HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

        // Concurrency token
        builder.Entity<TaskEntity>().Property(t => t.Version).IsConcurrencyToken();

        // Soft delete
        builder.Entity<Project>().HasQueryFilter(p => !p.IsDeleted);
        builder.Entity<TaskEntity>().HasQueryFilter(t => !t.IsDeleted);

        // Unique constraints
        builder.Entity<Workspace>().HasIndex(w => w.Slug).IsUnique();
        builder.Entity<TaskEntity>().HasIndex(t => new { t.ProjectId, t.Identifier }).IsUnique();
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        // Auto-set audit columns
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
                entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
        }
        return base.SaveChangesAsync(ct);
    }
}
```

**Day 4: Migrations and Seed Data**
- [ ] Create initial migration: `dotnet ef migrations add InitialCreate`
- [ ] Verify migration applies cleanly: `dotnet ef database update`
- [ ] Create `IDataSeeder` interface
- [ ] Implement `DevelopmentSeeder` with realistic mock data (see testing plan)
- [ ] Add CLI flag: `dotnet run -- --seed` applies seed data
- [ ] Verify seed data loads without errors

**Day 5: Integration Test Infrastructure**
- [ ] Create `DatabaseFixture` with Testcontainers PostgreSQL
- [ ] Create basic integration test that verifies migration applies
- [ ] Verify query filters work (create data in two workspaces, query returns only one)

**Acceptance Criteria:**
- Migration creates all tables with correct columns and indexes
- Multi-tenant query filter prevents cross-workspace data access
- Seed data loads 7 users, 10 projects, 50 tasks
- Integration test passes with Testcontainers PostgreSQL

---

### Week 3: Authentication

**Goal**: Users can register, login, and get JWT tokens. Protected endpoints reject unauthenticated requests.

**Day 1-2: Identity Configuration**
- [ ] Create `ApplicationUser` extending `IdentityUser<Guid>`:
  - `DisplayName`, `AvatarUrl`, `CreatedAt`, `LastLoginAt`
- [ ] Configure Identity options:
  - Password: min 8 chars, require uppercase, require digit
  - Lockout: 5 attempts, 15 min duration
  - User: require unique email
- [ ] Configure JWT:
  - RS256 signing
  - 15 min access token expiry
  - Issuer/audience from configuration
- [ ] Create `RefreshToken` entity:
  - `Id`, `UserId`, `Token` (hashed), `ExpiresAt`, `CreatedAt`, `RevokedAt`, `ReplacedByTokenId`

**Day 2-3: Auth Endpoints**
- [ ] `POST /api/v1/auth/register`:
  - Input: `email`, `password`, `displayName`
  - Validation: email format, password strength, duplicate email check
  - Output: `{ userId, email, displayName }`
  - Side effect: send verification email (stubbed in dev)
- [ ] `POST /api/v1/auth/login`:
  - Input: `email`, `password`
  - Validation: credentials, account locked, email verified
  - Output: `{ accessToken, refreshToken, expiresIn, user }`
  - Side effect: update `LastLoginAt`
- [ ] `POST /api/v1/auth/refresh`:
  - Input: `refreshToken`
  - Validation: token exists, not expired, not revoked
  - Output: `{ accessToken, refreshToken, expiresIn }`
  - Side effect: revoke old refresh token, create new one (rotation)
- [ ] `POST /api/v1/auth/logout`:
  - Input: `refreshToken`
  - Side effect: revoke refresh token
  - Output: 204 No Content
- [ ] `GET /api/v1/auth/me`:
  - Requires: valid access token
  - Output: `{ id, email, displayName, avatarUrl }`
- [ ] `POST /api/v1/auth/forgot-password`:
  - Input: `email`
  - Side effect: generate reset token, send email (stubbed)
  - Output: 200 OK (always, to prevent email enumeration)
- [ ] `POST /api/v1/auth/reset-password`:
  - Input: `token`, `newPassword`
  - Output: 200 OK

**Day 4: OAuth Providers**
- [ ] Configure Google OAuth:
  - `GET /api/v1/auth/external/google` -> redirect to Google
  - `GET /api/v1/auth/external/callback` -> handle callback, create/link user
- [ ] Configure GitHub OAuth (same pattern)
- [ ] Link external login to existing user if email matches

**Day 5: Tests**
- [ ] Unit tests: password validation, token generation, refresh rotation
- [ ] Integration tests:
  - Register -> Login -> Get profile
  - Login with wrong password -> 401
  - Refresh token rotation
  - Expired access token -> 401
  - Revoked refresh token -> 401

**Acceptance Criteria:**
- Registration creates user in database
- Login returns valid JWT
- Protected endpoint with valid JWT -> 200
- Protected endpoint without JWT -> 401
- Refresh token rotation works
- OAuth redirect works (callback can be stubbed)

---

### Week 4: Tenant & RBAC

**Goal**: Workspace creation, member management, tenant isolation middleware, role-based access control.

**Day 1-2: Workspace & Membership Endpoints**
- [ ] `POST /api/v1/workspaces` -- create workspace (auto-add creator as Owner)
- [ ] `GET /api/v1/workspaces` -- list workspaces for current user
- [ ] `PATCH /api/v1/workspaces/{id}` -- update workspace name, slug, settings
- [ ] `GET /api/v1/workspaces/{id}/members` -- list members with roles
- [ ] `POST /api/v1/workspaces/{id}/invitations` -- create invitation (send email stub)
- [ ] `POST /api/v1/invitations/{token}/accept` -- accept invitation, create membership
- [ ] `PATCH /api/v1/memberships/{id}` -- change role (Owner/Admin only)
- [ ] `DELETE /api/v1/memberships/{id}` -- remove member (cannot remove last Owner)

**Day 3: Tenant Resolution Middleware**
```csharp
public class TenantMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // Skip for auth endpoints
        if (context.Request.Path.StartsWithSegments("/api/v1/auth"))
        {
            await next(context);
            return;
        }

        // Resolve workspace ID
        var workspaceId = ResolveWorkspaceId(context);
        if (workspaceId == null)
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { error = "X-Workspace-Id header required" });
            return;
        }

        // Verify membership
        var userId = context.User.GetUserId();
        var membership = await _membershipService.GetAsync(workspaceId.Value, userId);
        if (membership == null)
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Not a member of this workspace" });
            return;
        }

        // Set tenant context
        var tenantContext = context.RequestServices.GetRequiredService<ITenantContext>();
        tenantContext.WorkspaceId = workspaceId.Value;
        tenantContext.UserId = userId;
        tenantContext.Role = membership.Role;

        await next(context);
    }
}
```

**Day 4: RBAC Policies**

Define authorization policies:

| Policy | Roles | Used By |
|--------|-------|---------|
| `WorkspaceOwner` | Owner | Delete workspace, transfer ownership |
| `WorkspaceAdmin` | Owner, Admin | Manage members, workspace settings |
| `ProjectManager` | Owner, Admin, Member (if project lead) | Delete project, manage project members |
| `TaskWriter` | Owner, Admin, Member | Create/update/delete tasks |
| `TaskReader` | Owner, Admin, Member, Guest | Read tasks |
| `BillingAccess` | Owner | View/manage billing |
| `AIAccess` | Owner, Admin, Member (Pro+ plans) | Use AI features |

```csharp
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("WorkspaceOwner", p => p.RequireRole("Owner"))
    .AddPolicy("WorkspaceAdmin", p => p.RequireRole("Owner", "Admin"))
    .AddPolicy("TaskWriter", p => p.RequireRole("Owner", "Admin", "Member"))
    .AddPolicy("TaskReader", p => p.RequireRole("Owner", "Admin", "Member", "Guest"));
```

**Day 5: OpenAPI Spec + Tests**
- [ ] Configure OpenAPI spec with security scheme
- [ ] Generate spec and verify all endpoints documented
- [ ] Unit tests: tenant middleware (missing header, invalid workspace, non-member)
- [ ] Integration tests:
  - Create workspace -> Invite member -> Accept -> Verify access
  - Member of Workspace A cannot access Workspace B resources
  - Role-based access: Guest cannot create tasks

**Acceptance Criteria:**
- Workspace CRUD works
- Invitation flow works end-to-end
- Tenant middleware rejects requests without workspace context
- Guest cannot write, Member can write, Admin can manage
- OpenAPI spec includes all P0 endpoints

### Frontend Work (Week 4, parallel)
- [ ] Create `/login` page with email/password form
- [ ] Create `/register` page with registration form
- [ ] Create `AuthProvider` context with token management
- [ ] Create `useAuth()` hook
- [ ] Create `ProtectedRoute` wrapper component
- [ ] Add `Authorization` header to all API requests
- [ ] Add workspace selector (if user has multiple workspaces)
- [ ] Add `X-Workspace-Id` header to all API requests

---

## 4. Phase P1: Functional Backbone (Weeks 5-10)

### Week 5: Project API

**Goal**: Full Project CRUD with team management.

**Day 1-3: Endpoints**
- [ ] `POST /api/v1/projects` -- Create project
  - Auto-generate identifier from name (e.g., "Mobile App" -> "MOB")
  - Auto-create default statuses: Backlog, Todo, In Progress, In Review, Done
  - Add creator as project lead
- [ ] `GET /api/v1/projects` -- List projects (paginated)
  - Filters: `status`, `leadId`, `isFavorite`, `isArchived`
  - Sort: `name`, `createdAt`, `updatedAt`
  - Include: task count, member count, health summary
- [ ] `GET /api/v1/projects/{id}` -- Get project detail
  - Include: members, statuses, recent activity
- [ ] `PATCH /api/v1/projects/{id}` -- Update project
- [ ] `DELETE /api/v1/projects/{id}` -- Soft delete (archive)
- [ ] `POST /api/v1/projects/{id}/statuses` -- Create custom status
- [ ] `PATCH /api/v1/projects/{id}/statuses/{statusId}` -- Update/reorder status
- [ ] `DELETE /api/v1/projects/{id}/statuses/{statusId}` -- Delete status (move tasks first)
- [ ] `POST /api/v1/projects/{id}/favorite` -- Toggle favorite
- [ ] `GET /api/v1/projects/{id}/activity` -- Activity feed (last 50 events)

**Day 4-5: Validators, Tests, Documentation**
- [ ] FluentValidation for all request DTOs
- [ ] Unit tests: validators, mappers
- [ ] Integration tests: CRUD flow, authorization, tenant isolation
- [ ] OpenAPI annotations with examples

### Week 6: Task API

**Goal**: Full Task CRUD with board support.

**Day 1-3: Core Task Endpoints**
- [ ] `POST /api/v1/tasks` -- Create task
  - Auto-assign identifier: `{PROJECT_PREFIX}-{auto_increment}`
  - Default status: first status of project (Backlog)
- [ ] `GET /api/v1/tasks` -- List tasks (paginated)
  - Filters: `projectId`, `status`, `priority`, `assigneeId`, `sprintId`, `labels`, `dueDate`, `search`
  - Sort: `createdAt`, `updatedAt`, `priority`, `dueDate`, `sortOrder`
- [ ] `GET /api/v1/tasks/{id}` -- Get task detail
  - Include: subtasks, comments (count), watchers, labels, checklist, dependencies
- [ ] `PATCH /api/v1/tasks/{id}` -- Update task (with concurrency check via `version`)
- [ ] `DELETE /api/v1/tasks/{id}` -- Soft delete
- [ ] `PATCH /api/v1/tasks/{id}/move` -- Move task (status + sort order)
  - Used by board drag-drop
  - Returns new status and sort order

**Day 3-4: Related Entities**
- [ ] `POST /api/v1/tasks/{id}/subtasks` -- Create subtask (max depth: 2)
- [ ] `GET /api/v1/tasks/{id}/subtasks` -- List subtasks
- [ ] `POST /api/v1/tasks/{id}/comments` -- Add comment
- [ ] `GET /api/v1/tasks/{id}/comments` -- List comments (paginated)
- [ ] `PATCH /api/v1/comments/{id}` -- Edit comment (author only)
- [ ] `DELETE /api/v1/comments/{id}` -- Delete comment (author or admin)
- [ ] `POST /api/v1/tasks/{id}/watchers` -- Add watcher
- [ ] `DELETE /api/v1/tasks/{id}/watchers/{userId}` -- Remove watcher
- [ ] `POST /api/v1/tasks/{id}/labels` -- Add label
- [ ] `DELETE /api/v1/tasks/{id}/labels/{labelId}` -- Remove label
- [ ] `POST /api/v1/tasks/{id}/checklist` -- Add checklist item
- [ ] `PATCH /api/v1/tasks/{id}/checklist/{itemId}` -- Toggle / edit checklist item
- [ ] `DELETE /api/v1/tasks/{id}/checklist/{itemId}` -- Remove checklist item
- [ ] `POST /api/v1/tasks/{id}/dependencies` -- Add dependency
- [ ] `DELETE /api/v1/tasks/{id}/dependencies/{depId}` -- Remove dependency

**Day 4-5: Board Endpoint + Tests**
- [ ] `GET /api/v1/projects/{id}/board` -- Board data
  - Returns tasks grouped by status with sort order
  - Optimized query: only fields needed for card rendering
- [ ] Unit tests: identifier generation, concurrency, validators
- [ ] Integration tests: CRUD, move, board endpoint, subtask depth limit

### Week 7: Sprint & Goal APIs

**Goal**: Sprint lifecycle and OKR hierarchy.

**Sprints (Day 1-2):**
- [ ] `POST /api/v1/sprints` -- Create sprint
- [ ] `GET /api/v1/sprints` -- List sprints for project
- [ ] `GET /api/v1/sprints/{id}` -- Sprint detail with tasks
- [ ] `PATCH /api/v1/sprints/{id}` -- Update sprint (name, goal, dates)
- [ ] `POST /api/v1/sprints/{id}/start` -- Start sprint
  - Validate: no other active sprint in project
  - Set start_date if not set
- [ ] `POST /api/v1/sprints/{id}/complete` -- Complete sprint
  - Return incomplete task IDs for move dialog
- [ ] `POST /api/v1/sprints/{id}/tasks` -- Add task to sprint
- [ ] `DELETE /api/v1/sprints/{id}/tasks/{taskId}` -- Remove task
- [ ] `GET /api/v1/sprints/{id}/burndown` -- Burndown chart data

**Goals (Day 3-4):**
- [ ] `POST /api/v1/goals` -- Create goal (objective or key result)
- [ ] `GET /api/v1/goals` -- List goals (tree structure with children)
- [ ] `GET /api/v1/goals/{id}` -- Goal detail with children and links
- [ ] `PATCH /api/v1/goals/{id}` -- Update goal
- [ ] `DELETE /api/v1/goals/{id}` -- Soft delete
- [ ] `POST /api/v1/goals/{id}/children` -- Create child goal (key result)
- [ ] `POST /api/v1/goals/{id}/links` -- Link project or task
- [ ] `DELETE /api/v1/goals/{id}/links/{linkId}` -- Unlink
- [ ] `GET /api/v1/goals/{id}/progress` -- Calculated progress (roll-up from tasks + key results)

**Day 5: Tests**
- [ ] Sprint lifecycle: create -> add tasks -> start -> complete
- [ ] Sprint constraint: cannot start two sprints simultaneously
- [ ] Goal hierarchy: parent/child relationships, progress calculation
- [ ] Goal linking: link project, verify progress reflects project completion %

### Week 8: Calendar & Time Entry APIs

**Calendar (Day 1-2):**
- [ ] `POST /api/v1/calendar/events` -- Create event
- [ ] `GET /api/v1/calendar/events?start={date}&end={date}` -- List events in range
- [ ] `GET /api/v1/calendar/events/{id}` -- Event detail
- [ ] `PATCH /api/v1/calendar/events/{id}` -- Update event
- [ ] `DELETE /api/v1/calendar/events/{id}` -- Delete event
- [ ] `GET /api/v1/calendar/deadlines?start={date}&end={date}` -- Task deadlines in range
- [ ] Recurring event support (daily, weekly, monthly, yearly with end date)

**Time Entries (Day 3-4):**
- [ ] `POST /api/v1/time-entries` -- Log time entry
- [ ] `GET /api/v1/time-entries` -- List entries (filter by user, project, task, date range)
- [ ] `PATCH /api/v1/time-entries/{id}` -- Update entry
- [ ] `DELETE /api/v1/time-entries/{id}` -- Delete entry
- [ ] `GET /api/v1/time-entries/summary` -- Aggregated summary
  - Group by: `user`, `project`, `task`, `date`
  - Period: `day`, `week`, `month`
- [ ] `POST /api/v1/time-entries/timer/start` -- Start a timer (creates entry with null hours)
- [ ] `POST /api/v1/time-entries/timer/stop` -- Stop timer (sets hours from duration)

**Day 5: Tests**
- [ ] Calendar: date range query correctness, recurring events
- [ ] Time entries: aggregation accuracy, timer start/stop lifecycle

### Week 9-10: Frontend Migration Phase 1

**Goal**: 7 core pages running on real backend with loading and error states.

**Week 9 (Day 1-5):**
- [ ] Install TanStack Query v5
- [ ] Generate TypeScript API client from OpenAPI spec (see `docs/openapi-roadmap.md`)
- [ ] Create `QueryClientProvider` in app providers
- [ ] Create `AuthProvider` with JWT token management
- [ ] Build `/login` page (email + password)
- [ ] Build `/register` page (email + password + name)
- [ ] Create `ProtectedRoute` HOC
- [ ] Migrate Board page:
  - Replace mock data with `useQuery(['board', projectId])`
  - Replace local drag-drop state with `useMutation` + optimistic updates
  - Add skeleton loader for board columns
  - Add error boundary
- [ ] Migrate Projects page:
  - Project list from API
  - Create/edit project modals use mutations
  - Loading and empty states

**Week 10 (Day 1-5):**
- [ ] Migrate Goals page (tree from API, CRUD mutations)
- [ ] Migrate Calendar page (events from API, date range queries)
- [ ] Migrate Sprints page (sprint list, task management)
- [ ] Migrate Time Tracking page (entries from API, timer)
- [ ] Set up SignalR client connection:
  ```typescript
  const connection = new HubConnectionBuilder()
    .withUrl('/hubs/board', { accessTokenFactory: () => getAccessToken() })
    .withAutomaticReconnect()
    .build();

  connection.on('TaskMoved', (taskId, newStatusId, newSortOrder) => {
    queryClient.setQueryData(['board', projectId], (old) => {
      // Update task position in cached board data
    });
  });
  ```
- [ ] Verify all migrated pages work end-to-end
- [ ] Remove feature flags for migrated pages (set `USE_API=true` as default)

**Acceptance Criteria (Week 10):**
- Board drag-drop persists across page refresh
- Two browser tabs: task moved in one appears in other via SignalR
- Projects list loads from API with pagination
- Goals tree renders hierarchy from API
- Calendar shows events from API in correct date ranges
- Sprint board shows tasks from API
- Time entries persist and aggregate correctly
- All pages show loading skeletons during fetch
- All pages show error states on API failure
- Login/register flow works end-to-end

---

## 5. Phase P2: Major Workflow Completion (Weeks 11-16)

### Week 11-12: Notifications & Documents

**Week 11: Notification System**
- [ ] Create domain event infrastructure (MediatR `INotification`)
- [ ] Define event types: `TaskAssignedEvent`, `TaskStatusChangedEvent`, `CommentAddedEvent`, `SprintStartedEvent`, `MentionedEvent`
- [ ] Create `NotificationGenerator` handlers that create `Notification` records
- [ ] Create notification endpoints:
  - `GET /api/v1/notifications` (paginated, filter by read/unread)
  - `PUT /api/v1/notifications/{id}/read`
  - `PUT /api/v1/notifications/read-all`
  - `DELETE /api/v1/notifications/{id}`
  - `GET /api/v1/notifications/unread-count`
  - `GET /api/v1/notifications/preferences`
  - `PUT /api/v1/notifications/preferences`
- [ ] SignalR notification push: `connection.on('NewNotification', handler)`
- [ ] Frontend: migrate Inbox page to real API

**Week 12: Document System**
- [ ] Create document endpoints:
  - `POST /api/v1/documents` (create doc or folder)
  - `GET /api/v1/documents` (root level tree)
  - `GET /api/v1/documents/{id}` (document with content)
  - `PATCH /api/v1/documents/{id}` (update metadata)
  - `PUT /api/v1/documents/{id}/content` (update content JSON)
  - `DELETE /api/v1/documents/{id}` (soft delete)
  - `POST /api/v1/documents/{id}/move` (move in tree)
  - `GET /api/v1/documents/{id}/versions` (version history)
- [ ] Content stored as JSONB (Tiptap JSON format)
- [ ] Auto-save: debounced PUT on content change
- [ ] Frontend: replace contentEditable with Tiptap editor
- [ ] Frontend: migrate Documents page to real API

### Week 13-14: Analytics & Reports

**Week 13: KPI and Analytics Endpoints**
- [ ] `GET /api/v1/analytics/dashboard` -- workspace KPIs
- [ ] `GET /api/v1/analytics/projects/{id}/health` -- project health score
- [ ] `GET /api/v1/analytics/velocity` -- team velocity (tasks/sprint)
- [ ] `GET /api/v1/analytics/workload` -- team workload by person
- [ ] `GET /api/v1/analytics/time-summary` -- time tracking aggregations
- [ ] `GET /api/v1/analytics/burndown/{sprintId}` -- sprint burndown
- [ ] `GET /api/v1/analytics/cumulative-flow/{projectId}` -- flow diagram data

**Week 14: Reports + Frontend Migration**
- [ ] `POST /api/v1/reports` -- save report configuration
- [ ] `GET /api/v1/reports` -- list saved reports
- [ ] `GET /api/v1/reports/{id}` -- get report with data
- [ ] `DELETE /api/v1/reports/{id}` -- delete report
- [ ] Frontend: migrate Dashboard to real KPI API
- [ ] Frontend: migrate Reports page to real analytics APIs
- [ ] Frontend: migrate Workload page to real API
- [ ] Frontend: migrate Timeline page to real API

### Week 15-16: Remaining Modules

**Week 15: Settings, Portfolio, Intake, Templates**
- [ ] Settings API: workspace settings, user profile, label management
- [ ] Initiative/Portfolio API: CRUD, project linking, budget tracking
- [ ] Intake API: form builder, public submission endpoint, submission review
- [ ] Template API: project/task templates, apply template

**Week 16: Search, Files, Frontend Cleanup**
- [ ] PostgreSQL full-text search: `tsvector` columns on tasks, projects, documents
- [ ] `GET /api/v1/search?q={query}&type={all|tasks|projects|documents}` endpoint
- [ ] GIN index on tsvector columns for performance
- [ ] File upload: presigned URL generation for S3/Azure Blob
- [ ] File attachment CRUD
- [ ] Frontend: migrate ALL remaining pages
- [ ] Frontend: remove ALL mock data utilities
- [ ] Frontend: remove `USE_API` feature flag
- [ ] Verify: every page loads from API, zero mock data

**Phase P2 Acceptance Criteria:**
- All 17 pages use real API data
- Zero mock data files in codebase
- Notifications appear in real-time via SignalR
- Documents save and load with Tiptap editor
- Search returns results across entities
- Analytics compute from real data

---

## 6. Phase P3: Advanced Features (Weeks 17-22)

### Week 17-18: Automations & AI

**Week 17: Automation Engine**
- [ ] Automation rule CRUD endpoints
- [ ] Trigger evaluation engine in Worker service
- [ ] Wire domain events to trigger evaluation
- [ ] Action execution engine (set field, assign, label, notify, create task)
- [ ] Automation execution logging
- [ ] Frontend: migrate Automations page to real API

**Week 18: AI Copilot**
- [ ] Add `Microsoft.Extensions.AI.Google` NuGet package
- [ ] Implement `AIChatService` with streaming
- [ ] Implement `AIContextBuilder` with workspace data gathering
- [ ] Implement `AIToolRegistry` with 7 tools
- [ ] Implement `AIApprovalGate` for write actions
- [ ] Implement `AIRateLimiter` per plan
- [ ] Implement `AIAuditLogger`
- [ ] `POST /api/v1/ai/chat` -- SSE streaming endpoint
- [ ] `POST /api/v1/ai/tools/{invocationId}/approve` -- approve tool
- [ ] `POST /api/v1/ai/tools/{invocationId}/reject` -- reject tool
- [ ] `GET /api/v1/ai/conversations` -- conversation history
- [ ] Frontend: connect AI copilot panel to real backend
- [ ] See `docs/ai-backend-readiness-plan.md` for full implementation details

### Week 19-20: Billing & Audit

**Week 19: Stripe Integration**
- [ ] Install `Stripe.net` NuGet package
- [ ] Create Stripe products and prices for each plan tier
- [ ] `POST /api/v1/billing/checkout` -- create Stripe Checkout session
- [ ] `GET /api/v1/billing/subscription` -- current subscription info
- [ ] `POST /api/v1/billing/portal` -- Stripe customer portal session
- [ ] `POST /api/v1/billing/webhooks` -- Stripe webhook handler
  - Handle: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Entitlement middleware: check plan limits on create operations
- [ ] Frontend: billing settings page

**Week 20: Audit Log**
- [ ] Audit log entity: `actor`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `ip_address`, `timestamp`
- [ ] Auto-capture via EF Core `SaveChanges` interceptor
- [ ] `GET /api/v1/audit-logs` -- query audit logs (admin only)
- [ ] `GET /api/v1/audit-logs/export` -- CSV export
- [ ] Retention policy per plan tier

### Week 21-22: Email & Import/Export

**Week 21: Transactional Email**
- [ ] Add MailKit NuGet package
- [ ] Create email templates: invitation, verification, password reset, notification digest
- [ ] Implement email sender service in Worker
- [ ] Configure SMTP settings (SendGrid/SES for production)
- [ ] Notification email delivery with user preferences
- [ ] Unsubscribe link handling

**Week 22: Import/Export**
- [ ] CSV export: tasks, time entries (background job, download link)
- [ ] PDF report generation with QuestPDF (background job)
- [ ] CSV import for tasks: upload, column mapping, preview, commit
- [ ] Trello JSON import: boards -> projects, lists -> statuses, cards -> tasks
- [ ] Asana JSON import: projects -> projects, sections -> statuses, tasks -> tasks
- [ ] Import runs as background job with progress tracking

---

## 7. Phase P4: Scale and Polish (Weeks 23-28)

### Week 23-24: External Integrations

**Week 23: Slack & GitHub**
- [ ] Slack app: OAuth installation, notification delivery, slash command
- [ ] GitHub app: OAuth installation, PR linking to tasks, webhook for PR events
- [ ] Auto-update task status on PR merge

**Week 24: Google Calendar & Webhooks**
- [ ] Google Calendar: OAuth, event sync, two-way (optional)
- [ ] Outbound webhook system: register, event subscriptions, delivery, retry
- [ ] Webhook delivery history and debugging UI

### Week 25-26: Enterprise Features

**Week 25: SSO & Advanced Search**
- [ ] SAML 2.0 integration via `Sustainsys.Saml2`
- [ ] JIT provisioning from SAML attributes
- [ ] Admin: enforce SSO-only login per workspace
- [ ] Meilisearch integration: indexing pipeline, search API migration, typo tolerance

**Week 26: Custom Fields & Admin Tooling**
- [ ] Custom field definitions (text, number, date, select, multi-select)
- [ ] Custom fields on tasks and projects (stored as JSONB)
- [ ] Filterable/sortable by custom fields
- [ ] Admin dashboard: workspace overview, user management
- [ ] Support impersonation (with full audit trail)

### Week 27-28: Hardening

**Week 27: Performance & Security**
- [ ] Database query audit: identify and fix N+1 queries
- [ ] Add missing indexes based on query analysis
- [ ] Configure PgBouncer for connection pooling
- [ ] Redis caching for hot paths (dashboard KPIs, board data)
- [ ] Response compression middleware
- [ ] Security audit: OWASP Top 10 checklist
- [ ] CSP headers, HSTS, X-Frame-Options
- [ ] Dependency vulnerability scan

**Week 28: Observability & Production Readiness**
- [ ] OpenTelemetry traces for all HTTP requests
- [ ] Custom metrics: request rate, error rate, latency histograms
- [ ] Grafana dashboards: API performance, database performance, error rates
- [ ] Alerting rules: error rate spikes, latency degradation, DB pool exhaustion
- [ ] Load testing with NBomber (target: 500 concurrent users)
- [ ] Define SLOs: 99.9% availability, P95 < 200ms reads, P95 < 500ms writes
- [ ] Production deployment guide (Docker Compose or Kubernetes)
- [ ] Disaster recovery runbook
- [ ] On-call playbook for common incidents

---

## 8. Parallel Work Streams

Throughout all phases, these work streams run in parallel:

| Stream | Owner | Cadence |
|--------|-------|---------|
| Backend API development | Backend team | Continuous |
| Frontend migration | Frontend team | 1-2 weeks behind API |
| Test automation | QA | Parallel with API development |
| CI/CD and infrastructure | DevOps | Continuous |
| Documentation | All | Updated with each milestone |
| Security review | Security lead | Monthly review, full audit in Week 27 |

### Serialization Points

These activities MUST be serialized (not parallel):

1. **Database migrations**: Only one migration branch at a time. Merge to main before creating next.
2. **Shared file edits** (per AGENTS.md): `layout.tsx`, `providers.tsx`, `globals.css`, `sidebar.tsx`, `header.tsx`
3. **OpenAPI spec updates**: Regenerate client after each API merge to main.
4. **Provider stack changes**: `AuthProvider` addition must be coordinated with existing providers.

---

## 9. Definition of Done -- Per-Week Checklist

Every week's work must satisfy:

- [ ] All new endpoints have OpenAPI documentation with examples
- [ ] All new endpoints have integration tests (happy path + auth + tenant isolation)
- [ ] All new domain logic has unit tests
- [ ] `dotnet build` passes with zero warnings
- [ ] `dotnet test` passes (all tests green)
- [ ] OpenAPI spec is updated and committed
- [ ] TypeScript client is regenerated if API changed
- [ ] Frontend `npm run build` passes if frontend was changed
- [ ] Frontend `npm run typecheck` passes if frontend was changed
- [ ] `docs/PLANS.md` updated with completion status
- [ ] No new security vulnerabilities introduced

---

## 10. Key Milestones Summary

| Week | Milestone | Verification |
|------|-----------|-------------|
| 1 | Solution compiles, Docker runs, health check works | `GET /health` → 200 |
| 2 | Database schema exists, multi-tenant filters work | Integration test passes |
| 3 | Auth works: register, login, JWT, refresh | Login returns valid JWT |
| 4 | Workspace, RBAC, OpenAPI spec | Tenant isolation test passes |
| 6 | Projects + Tasks API complete | Board endpoint returns grouped tasks |
| 8 | Sprint, Goals, Calendar, Time APIs complete | All CRUD flows work |
| 10 | Frontend Phase 1 migrated (7 pages on real API) | Board persists across refresh |
| 12 | Notifications + Documents live | Real-time notification delivery |
| 14 | Analytics + Reports live | Dashboard shows real KPIs |
| 16 | All 17 pages on real backend, zero mock data | Search returns real results |
| 18 | Automations + AI copilot operational | AI streams responses, tools work |
| 20 | Billing + Audit live | Stripe checkout completes |
| 22 | Email + Import/Export functional | CSV roundtrip preserves data |
| 24 | External integrations operational | Slack notification delivered |
| 26 | Enterprise features (SSO, search, custom fields) | SAML login works |
| 28 | Production-ready, load-tested, security-audited | 500 concurrent users sustained |
