# MVP to Functional SaaS Migration Roadmap

> Linear Precision -- From Frontend Prototype to Production SaaS
> Owner: Engineering Lead | Status: Draft | Last Updated: 2026-03-18

---

## 1. Current State Assessment

### What Exists

| Dimension | Status | Details |
|-----------|--------|---------|
| Frontend | Prototype | Next.js 14 App Router, 17 routes, Tailwind CSS, shadcn/ui |
| Backend | None | Zero server-side code |
| Database | None | Zero persistence, all data is mock/in-memory |
| Authentication | None | No login, no user identity |
| Authorization | None | No RBAC, no tenant isolation |
| API | None | No REST, no GraphQL, no RPC |
| Real-time | None | No WebSockets, no SSE |
| AI | Frontend-only | @google/genai dependency, no server-side orchestration |
| Deployment | Local only | `npm run dev`, no CI/CD, no containers |

### Route Inventory

| Route | UI State | Backend Dependency |
|-------|----------|-------------------|
| `/` | Dashboard with KPI cards | KPI aggregation API |
| `/projects` | Project list with filters | Project CRUD API |
| `/projects/[id]` | Project detail + settings | Project detail API |
| `/board` | Kanban board with drag-drop | Task CRUD + Board API |
| `/calendar` | Calendar view with events | Calendar event API |
| `/goals` | OKR hierarchy view | Goal CRUD + hierarchy API |
| `/sprints` | Sprint board + backlog | Sprint CRUD API |
| `/timeline` | Gantt-style timeline | Timeline data API |
| `/workload` | Team workload heatmap | Workload aggregation API |
| `/documents` | Doc editor + folder tree | Document CRUD API |
| `/inbox` | Notification inbox | Notification API |
| `/reports` | Analytics dashboards | Analytics aggregation API |
| `/time-tracking` | Time entry list + timer | Time entry CRUD API |
| `/settings` | Workspace settings | Settings API |
| `/portfolio` | Initiative/portfolio view | Portfolio API |
| `/intake` | Request intake forms | Intake form API |
| `/templates` | Project/task templates | Template API |

### Feature Coverage Analysis

Based on `docs/feature-coverage-matrix.md`:

- **Total planned features**: 158
- **UI shells built**: ~75 (47%)
- **Fully functional (with backend)**: 0 (0%)
- **Gap to MVP**: Authentication, persistence, real-time, API layer

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CDN / Edge                        │
├─────────────────────────────────────────────────────────┤
│              Next.js Frontend (Vercel/Docker)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ TanStack Query ←→ Generated TypeScript API Client │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│              ASP.NET Core 9 API (Docker)                 │
│  ┌─────────┬──────────┬──────────┬─────────────────┐   │
│  │ Minimal │ Auth +   │ Multi-   │ OpenAPI +        │   │
│  │ APIs    │ RBAC     │ Tenant   │ Versioning       │   │
│  ├─────────┼──────────┼──────────┼─────────────────┤   │
│  │ MediatR │ EF Core  │ SignalR  │ Microsoft.Ext.AI │   │
│  └─────────┴──────────┴──────────┴─────────────────┘   │
├─────────────────────────────────────────────────────────┤
│           Background Worker (Docker)                     │
│  ┌──────────────┬─────────────┬─────────────────────┐   │
│  │ Notifications│ Automations │ AI Jobs + Billing    │   │
│  └──────────────┴─────────────┴─────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                    Data Layer                             │
│  ┌──────────┐ ┌───────┐ ┌──────────┐ ┌──────────────┐  │
│  │PostgreSQL│ │ Redis │ │ Blob     │ │ Meilisearch  │  │
│  │ 16       │ │ 7     │ │ Storage  │ │ (Phase P4)   │  │
│  └──────────┘ └───────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | ASP.NET Core 9 Minimal APIs | Performance, mature ecosystem, strong typing |
| ORM | EF Core 9 | First-class .NET support, migrations, LINQ |
| Database | PostgreSQL 16 | JSONB for flexible fields, full-text search, row-level security |
| Cache | Redis 7 | Session, rate limiting, pub/sub, caching |
| Auth | ASP.NET Core Identity + JWT | Built-in, battle-tested, extensible |
| Real-time | SignalR | Built into ASP.NET Core, automatic transport negotiation |
| Background jobs | .NET BackgroundService + Redis Streams | No external dependency (Hangfire later if needed) |
| AI | Microsoft.Extensions.AI + Gemini | Provider abstraction, streaming, tool use |
| API client | Kiota-generated TypeScript | Type-safe, auto-generated from OpenAPI |
| Search | PostgreSQL full-text (P2), Meilisearch (P4) | Start simple, scale later |
| File storage | Local (dev), Azure Blob / S3 (prod) | Presigned URLs for direct upload |
| Email | MailKit | Cross-platform, full SMTP support |
| PDF generation | QuestPDF | Fluent API, no external dependencies |

---

## 3. Phase P0: Foundations (Weeks 1-4)

### Objectives
- Backend project compiles and runs
- Database exists with core schema
- Users can register, login, and create workspaces
- Multi-tenant middleware works
- RBAC policies enforced
- OpenAPI spec generated
- CI pipeline running

### Week 1: Solution Bootstrap

**Tasks:**
1. Create .NET 9 solution: `LinearPrecision.sln`
2. Create projects:
   - `src/LinearPrecision.Api` -- ASP.NET Core Minimal API host
   - `src/LinearPrecision.Worker` -- Background service host
   - `src/LinearPrecision.Shared` -- Domain entities, DTOs, contracts
3. Add NuGet packages:
   - `Microsoft.EntityFrameworkCore` + `Npgsql.EntityFrameworkCore.PostgreSQL`
   - `Microsoft.AspNetCore.Identity.EntityFrameworkCore`
   - `Microsoft.AspNetCore.Authentication.JwtBearer`
   - `Microsoft.AspNetCore.OpenApi` + `NSwag.AspNetCore`
   - `MediatR` + `FluentValidation`
   - `StackExchange.Redis`
   - `Microsoft.AspNetCore.SignalR`
4. Configure `Program.cs` with health checks, CORS, Swagger
5. Create `docker-compose.yml`:
   - PostgreSQL 16
   - Redis 7
   - API (Dockerfile)
6. `appsettings.Development.json` with connection strings

**Definition of Done:** `dotnet build` succeeds, Docker Compose starts, `/health` returns 200.

### Week 2: Database Foundation

**Tasks:**
1. Define entity classes:
   - `Workspace`, `User`, `Membership`, `Invitation`
   - `Project`, `ProjectStatus`, `ProjectMember`
   - `Task`, `TaskStatus`, `TaskComment`, `TaskWatcher`, `TaskDependency`
   - `Label`, `TaskLabel`
   - `Sprint`, `SprintTask`
   - `Goal`, `GoalLink`
2. Configure `AppDbContext` with:
   - Global query filter for `WorkspaceId` (multi-tenant isolation)
   - Soft delete filter (`IsDeleted == false`)
   - Audit columns (`CreatedAt`, `UpdatedAt`, `CreatedBy`)
3. Create initial migration
4. Seed data script
5. Connection pooling configuration (Npgsql)

**Definition of Done:** Migration applies cleanly, seed data loads, query filters verified.

### Week 3: Authentication

**Tasks:**
1. Configure ASP.NET Core Identity with PostgreSQL store
2. JWT token generation:
   - Access token: 15 min expiry, contains `userId`, `workspaceId`, `role`
   - Refresh token: 7 day expiry, stored in DB, single-use
3. Endpoints:
   - `POST /api/v1/auth/register` -- email, password, name
   - `POST /api/v1/auth/login` -- email, password -> access + refresh tokens
   - `POST /api/v1/auth/refresh` -- refresh token -> new access + refresh
   - `POST /api/v1/auth/logout` -- invalidate refresh token
   - `POST /api/v1/auth/forgot-password` -- send reset email
   - `POST /api/v1/auth/reset-password` -- token + new password
4. OAuth providers:
   - Google (already have frontend dependency)
   - GitHub
5. Email verification flow (dev: log to console, prod: send email)

**Definition of Done:** Register -> Login -> Get access token -> Call protected endpoint -> works.

### Week 4: Tenant & RBAC

**Tasks:**
1. Workspace CRUD:
   - `POST /api/v1/workspaces` -- create workspace
   - `GET /api/v1/workspaces` -- list user's workspaces
   - `PATCH /api/v1/workspaces/{id}` -- update settings
2. Membership:
   - `GET /api/v1/workspaces/{id}/members` -- list members
   - `POST /api/v1/workspaces/{id}/invitations` -- invite by email
   - `POST /api/v1/invitations/{token}/accept` -- accept invitation
   - `PATCH /api/v1/memberships/{id}` -- change role
   - `DELETE /api/v1/memberships/{id}` -- remove member
3. Tenant resolution middleware:
   - Extract workspace from JWT claim or `X-Workspace-Id` header
   - Set `ITenantContext.WorkspaceId` for the request
   - EF Core query filter uses `ITenantContext` automatically
4. RBAC policies:
   - `Owner`: full access
   - `Admin`: all except billing and workspace deletion
   - `Member`: CRUD on own tasks, read on most resources
   - `Guest`: read-only on invited projects
5. OpenAPI spec generation and Swagger UI

**Definition of Done:** Full auth flow works. Tenant isolation verified. RBAC blocks unauthorized access.

### Frontend Work (Week 4, parallel)

1. Create `/login` and `/register` pages
2. Create `AuthContext` with token storage (httpOnly cookies or localStorage)
3. Create `useAuth` hook
4. Wrap all routes with `ProtectedRoute` component
5. API client setup with `Authorization` header injection

---

## 4. Phase P1: Functional Backbone (Weeks 5-10)

### Objectives
- Core PM features have real APIs
- Board, Projects, Goals, Calendar, Sprints, Time Tracking work end-to-end
- Real-time board updates via SignalR
- Loading and error states in frontend

### Week 5-6: Projects & Tasks API

**Endpoints:**

```
Projects:
  POST   /api/v1/projects                     Create project
  GET    /api/v1/projects                     List projects (paginated, filterable)
  GET    /api/v1/projects/{id}                Get project detail
  PATCH  /api/v1/projects/{id}                Update project
  DELETE /api/v1/projects/{id}                Soft delete
  GET    /api/v1/projects/{id}/board          Get board data (tasks grouped by status)
  POST   /api/v1/projects/{id}/statuses       Create custom status
  PATCH  /api/v1/projects/{id}/statuses/{id}  Reorder status
  GET    /api/v1/projects/{id}/activity       Activity feed

Tasks:
  POST   /api/v1/tasks                        Create task
  GET    /api/v1/tasks                        List tasks (paginated, filterable)
  GET    /api/v1/tasks/{id}                   Get task detail
  PATCH  /api/v1/tasks/{id}                   Update task
  DELETE /api/v1/tasks/{id}                   Soft delete
  PATCH  /api/v1/tasks/{id}/move              Move task (status + sort order)
  POST   /api/v1/tasks/{id}/subtasks          Create subtask
  GET    /api/v1/tasks/{id}/subtasks          List subtasks
  POST   /api/v1/tasks/{id}/comments          Add comment
  GET    /api/v1/tasks/{id}/comments          List comments
  POST   /api/v1/tasks/{id}/watchers          Add watcher
  DELETE /api/v1/tasks/{id}/watchers/{userId} Remove watcher
  POST   /api/v1/tasks/{id}/dependencies      Add dependency
  DELETE /api/v1/tasks/{id}/dependencies/{id} Remove dependency
  POST   /api/v1/tasks/{id}/labels            Add label
  DELETE /api/v1/tasks/{id}/labels/{labelId}  Remove label
  POST   /api/v1/tasks/{id}/checklist         Add checklist item
  PATCH  /api/v1/tasks/{id}/checklist/{id}    Toggle checklist item
```

### Week 7-8: Sprint, Goals, Calendar, Time

**Endpoints:**

```
Sprints:
  POST   /api/v1/sprints                      Create sprint
  GET    /api/v1/sprints                      List sprints
  GET    /api/v1/sprints/{id}                 Get sprint detail
  PATCH  /api/v1/sprints/{id}                 Update sprint
  POST   /api/v1/sprints/{id}/start           Start sprint
  POST   /api/v1/sprints/{id}/complete        Complete sprint
  POST   /api/v1/sprints/{id}/tasks           Add task to sprint
  DELETE /api/v1/sprints/{id}/tasks/{taskId}  Remove task from sprint
  GET    /api/v1/sprints/{id}/burndown        Burndown chart data

Goals:
  POST   /api/v1/goals                        Create goal
  GET    /api/v1/goals                        List goals (tree structure)
  GET    /api/v1/goals/{id}                   Get goal detail
  PATCH  /api/v1/goals/{id}                   Update goal
  DELETE /api/v1/goals/{id}                   Soft delete
  POST   /api/v1/goals/{id}/children          Create child goal
  POST   /api/v1/goals/{id}/links             Link to project/task
  DELETE /api/v1/goals/{id}/links/{linkId}    Remove link

Calendar:
  POST   /api/v1/calendar/events              Create event
  GET    /api/v1/calendar/events              List events (date range)
  GET    /api/v1/calendar/events/{id}         Get event detail
  PATCH  /api/v1/calendar/events/{id}         Update event
  DELETE /api/v1/calendar/events/{id}         Delete event

Time Entries:
  POST   /api/v1/time-entries                 Create time entry
  GET    /api/v1/time-entries                 List time entries (filterable)
  PATCH  /api/v1/time-entries/{id}            Update time entry
  DELETE /api/v1/time-entries/{id}            Delete time entry
  GET    /api/v1/time-entries/summary         Aggregated time summary
  POST   /api/v1/time-entries/timer/start     Start timer
  POST   /api/v1/time-entries/timer/stop      Stop timer
```

### Week 9-10: Frontend Migration Phase 1

**Tasks:**
1. Install TanStack Query (`@tanstack/react-query`)
2. Generate TypeScript API client from OpenAPI spec
3. Create API client wrapper with:
   - Base URL configuration
   - Auth token injection
   - Error interceptor (401 -> redirect to login)
   - Request/response logging (dev only)
4. Migrate pages to real API:
   - `/board` -- Replace mock data with TanStack Query + Board API
   - `/projects` -- Replace mock data with Project list API
   - `/projects/[id]` -- Replace mock data with Project detail API
   - `/goals` -- Replace mock data with Goals tree API
   - `/calendar` -- Replace mock data with Calendar API
   - `/sprints` -- Replace mock data with Sprint API
   - `/time-tracking` -- Replace mock data with Time entries API
5. Add loading states (skeleton loaders)
6. Add error states (error boundaries, retry buttons)
7. Add empty states (no data illustrations)
8. Set up SignalR client for board real-time updates:
   - Task created -> add card
   - Task moved -> animate card to new column
   - Task updated -> update card in place
   - Task deleted -> remove card with animation

**Migration Pattern:**
```typescript
// Before (mock)
const tasks = useMockTasks();

// After (real API with TanStack Query)
const { data: tasks, isLoading, error } = useQuery({
  queryKey: ['projects', projectId, 'board'],
  queryFn: () => apiClient.projects.getBoard(projectId),
});

// Optimistic update for drag-drop
const moveTask = useMutation({
  mutationFn: (args) => apiClient.tasks.move(args.taskId, args.body),
  onMutate: async (args) => {
    await queryClient.cancelQueries(['projects', projectId, 'board']);
    const previous = queryClient.getQueryData(['projects', projectId, 'board']);
    // Optimistically update cache
    queryClient.setQueryData(['projects', projectId, 'board'], (old) => {
      // Move task in cached data
    });
    return { previous };
  },
  onError: (err, args, context) => {
    queryClient.setQueryData(['projects', projectId, 'board'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['projects', projectId, 'board']);
  },
});
```

**Definition of Done:** Core PM workflows operate on real data. Page refresh preserves state. Multi-user collaboration works.

---

## 5. Phase P2: Major Workflow Completion (Weeks 11-16)

### Objectives
- All 17 pages running on real backend
- Zero mock data remaining
- Notification system operational
- Document editor functional
- Reports with real analytics
- Search works

### Week 11-12: Notifications & Documents

**Notification System Architecture:**
```
Domain Event (e.g., TaskAssigned)
  → MediatR notification handler
    → NotificationGenerator (determines who gets notified)
      → Redis Stream (for async processing)
        → Worker: NotificationDispatcher
          → DB write (inbox notification)
          → SignalR push (real-time badge/toast)
          → Email queue (if preference enabled)
```

**Notification Types:**
- Task assigned to you
- Task you watch was updated
- Comment on your task
- Mentioned in comment
- Sprint started/completed
- Goal progress milestone
- Invitation to workspace
- Automation triggered

**Document System:**
- Tiptap editor on frontend (replace contentEditable)
- Document content stored as JSON (Tiptap format) in PostgreSQL JSONB column
- Folder hierarchy via `parent_id` self-referential relationship
- Real-time collaboration via Y.js + SignalR (Phase P3 stretch)

### Week 13-14: Analytics & Reports

**KPI Endpoints:**
```
GET /api/v1/analytics/dashboard           Workspace-level KPIs
GET /api/v1/analytics/projects/{id}/health  Project health metrics
GET /api/v1/analytics/velocity            Team velocity (per sprint)
GET /api/v1/analytics/workload            Team workload distribution
GET /api/v1/analytics/time-summary        Time tracking aggregations
GET /api/v1/analytics/burndown/{sprintId} Sprint burndown
GET /api/v1/analytics/cumulative-flow     Cumulative flow diagram data
```

**Dashboard KPIs:**
- Total active tasks / completed this week
- Tasks overdue
- Project health distribution (on track / at risk / off track)
- Team velocity trend (last 6 sprints)
- Time logged this week vs. target
- Upcoming deadlines (next 7 days)
- Goal progress summary

### Week 15-16: Remaining Modules

| Module | Endpoints | Notes |
|--------|-----------|-------|
| Settings | Workspace settings CRUD, user profile, notification preferences | |
| Initiatives | Initiative CRUD, portfolio view, project grouping | Hierarchical: Initiative > Project |
| Intake | Form builder, public form endpoint, submission list | Public URL for external requests |
| Templates | Project template CRUD, task template CRUD, apply template | Copy entire project structure |
| Search | `GET /api/v1/search?q=&type=&project=` | PostgreSQL `tsvector` + `tsquery` |
| File Upload | Presigned URL generation, attachment CRUD | S3-compatible or local in dev |

**Definition of Done:** All 17 frontend pages connected to real APIs. Mock data utilities removed. Search returns real results.

---

## 6. Phase P3: Advanced Features (Weeks 17-22)

### Objectives
- Automation engine processes rules
- AI copilot operational
- Billing enforced
- Email notifications sent
- Import/export functional

### Automation Engine (Week 17-18)

```
Rule Definition:
  WHEN [trigger] AND [conditions] THEN [actions]

Triggers:
  - Task status changed
  - Task assigned
  - Task created
  - Due date reached
  - Label added/removed
  - Sprint started/completed
  - Custom field changed

Conditions:
  - Project is X
  - Priority is Y
  - Assignee is Z
  - Label contains A
  - Custom field equals B

Actions:
  - Change task status
  - Assign task
  - Add label
  - Send notification
  - Create subtask
  - Move to sprint
  - Set custom field
  - Send webhook
```

### AI Copilot (Week 17-18)

See `docs/ai-backend-readiness-plan.md` for full architecture.

Summary:
- Microsoft.Extensions.AI + Gemini
- 7 tools: generate subtasks, write status update, identify risks, suggest next steps, create task, summarize project, search workspace
- SSE streaming
- Human confirmation for write actions
- Full audit trail

### Billing (Week 19-20)

| Component | Implementation |
|-----------|---------------|
| Provider | Stripe |
| Plans | Free, Pro ($12/user/mo), Business ($24/user/mo), Enterprise (custom) |
| Checkout | Stripe Checkout Session |
| Portal | Stripe Customer Portal |
| Webhooks | `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` |
| Entitlements | Middleware checks plan tier before feature access |
| Metering | Track AI usage, storage, member count |

### Email, Import, Export (Week 21-22)

**Email:**
- MailKit for SMTP
- Templates: invitation, password reset, notification digest, billing receipt
- Preference-gated: users opt-in per notification type

**Export:**
- CSV: tasks, time entries, project data
- PDF: project reports, sprint reports, time reports (QuestPDF)

**Import:**
- CSV upload with column mapping UI
- Trello JSON import (boards -> projects, cards -> tasks)
- Asana JSON import (projects -> projects, tasks -> tasks)

---

## 7. Phase P4: Scale and Polish (Weeks 23-28)

### Objectives
- External integrations operational
- Enterprise security features
- Performance optimized
- Production deployment ready

### Integrations (Week 23-24)

| Integration | Direction | Scope |
|------------|-----------|-------|
| Slack | Outbound | Notifications, task updates, slash commands |
| GitHub | Bidirectional | PR linking to tasks, status sync, branch detection |
| Google Calendar | Bidirectional | Event sync, availability |
| Webhooks | Outbound | Custom HTTP callbacks for any event |

### Enterprise (Week 25-26)

- SSO/SAML via `Sustainsys.Saml2`
- Meilisearch for advanced full-text search with typo tolerance
- Custom fields on tasks and projects (JSONB schema)
- Admin support tooling (user lookup, workspace management)
- Impersonation for support

### Hardening (Week 27-28)

- Performance profiling and optimization
- Security audit (OWASP Top 10)
- Penetration testing
- Load testing with NBomber (see testing plan)
- Observability: OpenTelemetry traces + Prometheus metrics + Grafana dashboards
- SLO definition: 99.9% uptime, P95 < 200ms for reads
- Production deployment guide
- Disaster recovery runbook

---

## 8. Risk Mitigation

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| EF Core query performance | High | Medium | Index strategy from day 1, query profiling in CI |
| Multi-tenant data leak | Critical | Low | Dedicated test suite, global query filters, code review |
| Frontend migration breaks | Medium | Medium | Feature flags, parallel mock + API mode |
| Gemini API instability | Medium | Low | Fallback provider, circuit breaker |
| Stripe webhook reliability | High | Low | Idempotent handlers, dead letter queue |
| SignalR scaling | Medium | Medium | Redis backplane from day 1 |

### Process Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Scope creep per phase | High | High | Strict phase gates, no feature additions mid-phase |
| Frontend/backend desync | Medium | Medium | Generated TypeScript client, contract tests |
| Migration downtime | High | Low | Parallel operation mode, feature flags |
| Knowledge concentration | Medium | Medium | Pair programming on critical paths, documentation |

### Rollback Strategy

Each phase has a rollback plan:

- **P0**: Drop database, delete backend folder. Frontend unaffected.
- **P1**: Feature flag each migrated page back to mock mode. Revert API client to mock service.
- **P2**: Same as P1, per-page granularity.
- **P3**: Feature flags for AI, automations, billing. Stripe test mode throughout.
- **P4**: Integrations behind feature flags. SSO optional per workspace.

### Database Migration Strategy

1. All migrations are forward-only (no `Down()` methods in production)
2. Every migration is tested against a copy of production schema
3. Large data migrations run as background jobs, not in migration
4. Zero-downtime migrations: add column (nullable) -> backfill -> add constraint -> update code -> drop old column
5. Migration PRs reviewed by 2 engineers

---

## 9. Success Metrics

### Phase Gates

| Phase | Gate | Measurement |
|-------|------|-------------|
| P0 | Auth works end-to-end | Manual test: register -> login -> create workspace -> API call succeeds |
| P1 | Core PM on real data | Board page loads from DB, task CRUD persists, page refresh preserves state |
| P2 | All pages real | Zero mock data imports, all 17 pages load from API |
| P3 | Commercially viable | Billing flow works, AI responds, automations fire |
| P4 | Production ready | Load test passes, security audit clean, monitoring operational |

### Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| API latency P95 | < 200ms (reads), < 500ms (writes) | Prometheus histogram |
| Error rate | < 0.1% | Prometheus counter |
| Test coverage | > 80% line, > 70% branch | Codecov |
| Deployment frequency | Daily (main branch) | CI/CD metrics |
| Lead time for changes | < 1 day | PR merge to production |
| Mean time to recovery | < 30 minutes | Incident tracking |

---

## 10. Team Structure Recommendation

| Role | Count | Responsibility |
|------|-------|---------------|
| Backend Engineer | 2 | API, database, infrastructure |
| Frontend Engineer | 1-2 | Migration, new UI features |
| Full-Stack Engineer | 1 | Integration, DevOps, CI/CD |
| QA Engineer | 1 | Test automation, E2E, load testing |
| **Total** | **5-6** | |

### Parallel Work Streams

During most phases, these streams can operate in parallel:
1. **API development** (backend team)
2. **Frontend migration** (frontend team, 1-2 weeks behind API)
3. **Test automation** (QA, parallel with both)
4. **Infrastructure/DevOps** (full-stack, continuous)

---

## 11. Dependency Map

```
P0 Week 1: Solution Bootstrap
    └── P0 Week 2: Database Foundation
        └── P0 Week 3: Authentication
            └── P0 Week 4: Tenant & RBAC + OpenAPI
                ├── P1 Week 5-6: Projects & Tasks API
                │   └── P1 Week 9-10: Frontend Migration (Board, Projects)
                ├── P1 Week 7-8: Sprint, Goals, Calendar, Time
                │   └── P1 Week 9-10: Frontend Migration (Goals, Calendar, Sprints, Time)
                ├── P2 Week 11-12: Notifications & Documents
                ├── P2 Week 13-14: Analytics & Reports
                ├── P2 Week 15-16: Remaining Modules
                │   └── P3 Week 17-18: Automations & AI
                │       └── P3 Week 19-20: Billing & Audit
                │           └── P3 Week 21-22: Email & Import/Export
                │               └── P4 Week 23-28: Integrations, Enterprise, Hardening
```

Items that can be parallelized:
- Projects API + Tasks API (Week 5-6)
- Sprint API + Goals API + Calendar API + Time API (Week 7-8)
- Notifications + Documents (Week 11-12)
- Analytics work is independent of remaining modules (Week 13-16)
- AI + Automations are independent of Billing (Week 17-20)
