# Frontend-to-Backend Integration Matrix — Linear Precision PM SaaS

> **Status:** Draft v1.0
> **Last updated:** 2026-03-23
> **Owner:** Frontend + Backend Architecture Teams
> **Related:** `architecture.md`, `api-integration-master-plan.md`, `backend-architecture-master-plan.md`

---

## 1. Overview

This document maps every frontend page in the Next.js application to its backend data sources, API endpoints, real-time subscriptions, and migration priority. It serves as the integration playbook for replacing mock data with live API calls.

**Current state:** 17 route pages in the root Next.js app. The root shell now includes `AuthProvider`, `WorkspaceProvider`, TanStack Query, `RealtimeProvider`, and a typed fetch-based API client. All authenticated product routes now consume live hooks or live providers: Dashboard, Board, Projects, Inbox, Calendar, Goals, Docs, Sprints, Reports, Time Tracking, Settings core, Automations, Intake, Templates, Portfolio, Timeline, and Workload. Remaining gaps are mostly subfeature-level: richer realtime, missing subresources, disabled affordances for unsupported backend contracts, and broader production hardening.

**Target state:** All applicable pages consume data from the ASP.NET Core REST API via a Kiota-generated TypeScript client, with TanStack Query for caching, and SignalR for real-time updates.

---

## 2. Integration Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API client | Typed fetch-based client today, generated client still planned | Typed request/response and workspace-aware request orchestration |
| Server state | TanStack Query v5 | Caching, deduplication, background refetch, optimistic updates |
| Real-time | `@microsoft/signalr` | WebSocket connections for live updates |
| Auth state | React Context | Memory-first session state, refresh orchestration, workspace context |
| Token management | Custom `AuthProvider` | Access token injection, refresh rotation, logout, secure refresh-cookie bootstrap |

### 2.1 TanStack Query Configuration

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 seconds before refetch
      gcTime: 5 * 60_000,      // 5 minutes garbage collection
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 2.2 Auth Header Injection

```typescript
// lib/api-client.ts
import { LinearPrecisionClient } from '@/api/client';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';

function createClient(accessToken: string, workspaceId: string) {
  const adapter = new FetchRequestAdapter(/* auth provider */);
  adapter.baseUrl = process.env.NEXT_PUBLIC_API_URL!;

  // Inject headers on every request
  adapter.sendAsync = async (requestInfo, ...args) => {
    requestInfo.headers.set('Authorization', `Bearer ${accessToken}`);
    requestInfo.headers.set('X-Workspace-Id', workspaceId);
    return originalSend(requestInfo, ...args);
  };

  return new LinearPrecisionClient(adapter);
}
```

### 2.3 Query Key Convention

```typescript
// Consistent key structure for cache invalidation
const queryKeys = {
  tasks: {
    all: (workspaceId: string) => ['tasks', workspaceId] as const,
    list: (workspaceId: string, filters: TaskFilters) =>
      ['tasks', workspaceId, 'list', filters] as const,
    detail: (workspaceId: string, taskId: string) =>
      ['tasks', workspaceId, 'detail', taskId] as const,
  },
  projects: {
    all: (workspaceId: string) => ['projects', workspaceId] as const,
    list: (workspaceId: string, filters: ProjectFilters) =>
      ['projects', workspaceId, 'list', filters] as const,
    detail: (workspaceId: string, projectId: string) =>
      ['projects', workspaceId, 'detail', projectId] as const,
    metrics: (workspaceId: string, projectId: string) =>
      ['projects', workspaceId, 'metrics', projectId] as const,
  },
  // ... similar for all entities
};
```

---

## 3. Migration Priority Tiers

| Tier | Priority | Criteria | Pages |
|------|----------|----------|-------|
| **T0** | Critical | Auth + workspace — everything depends on this | Login, Register, Workspace selector |
| **T1** | High | Core PM workflows used daily | Dashboard, Board, Projects |
| **T2** | Medium | Important but not blocking | Inbox, Calendar, Goals, Documents, Sprints |
| **T3** | Standard | Supporting workflows | Timeline, Workload, Reports, Time Tracking |
| **T4** | Lower | Admin and specialized | Settings, Automations, Intake, Templates |
| **T5** | Deferred | AI-powered features | AI Copilot (integrated with other pages) |

---

## 4. Per-Page Integration Matrix

### 4.1 Auth Pages (T0)

**Current state:** Real auth and workspace bootstrap pages now exist at `/login`, `/register`, `/forgot-password`, `/reset-password`, `/workspace/select`, `/workspace/create`, and `/invitations/[token]`. Route protection and session bootstrap are wired through `AuthProvider`, `WorkspaceProvider`, and `AppShellGuard`, and the authenticated product routes now use live hooks or live providers with several subfeatures still pending deeper hardening.

**Pages shipped:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/workspace/select`, `/workspace/create`, `/invitations/[token]`

| Data Need | API Endpoint | Query Key | Mutation |
|-----------|-------------|-----------|----------|
| Login | `POST /api/v1/auth/login` | — | `useLogin()` |
| Register | `POST /api/v1/auth/register` | — | `useRegister()` |
| Refresh | `POST /api/v1/auth/refresh` | — | Background interceptor |
| Logout | `POST /api/v1/auth/logout` | — | `useLogout()` |
| Forgot password | `POST /api/v1/auth/forgot-password` | — | `useForgotPassword()` |
| Reset password | `POST /api/v1/auth/reset-password` | — | `useResetPassword()` |
| Accept invitation | `POST /api/v1/invitations/{token}/accept` | — | `useAcceptInvitation()` |
| Set active workspace | `PUT /api/v1/users/me/active-workspace` | — | `useSetActiveWorkspace()` |

**SignalR:** None.

**Migration notes:**
- Root provider stack, auth UI, route guards, and workspace bootstrap pages now exist in `app/providers.tsx`
- Access tokens are held in memory; refresh bootstrap is performed through the secure refresh cookie
- OAuth, magic links, and 2FA remain explicitly post-GA
- Next work is page-level hook migration on authenticated product surfaces

---

### 4.2 Dashboard — `app/page.tsx` (T1)

**Current state:** KPI cards, My Work widget, Project Health widget, issue list, and recent activity feed now query live backend data through TanStack Query and the typed API client. Quick Actions and footer modules still sit inside the legacy mixed shell.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| My assigned tasks | `GET /api/v1/tasks?assigneeId=me&status=Todo,InProgress&pageSize=10` | `tasks.myWork` | staleTime: 30s |
| Project health | `GET /api/v1/projects?pageSize=50` + computed metrics | `projects.list` | staleTime: 60s |
| KPI: total tasks | `GET /api/v1/analytics/workload` | `analytics.workload` | staleTime: 5min |
| KPI: overdue count | `GET /api/v1/tasks?dueDate.lt=today&status.ne=Done&pageSize=0` | `tasks.overdue` | staleTime: 60s |
| Recent activity | `GET /api/v1/admin/audit-events?pageSize=10` | `activity.recent` | staleTime: 30s |
| Unread notifications | `GET /api/v1/notifications?isRead=false&pageSize=0` | `notifications.unread` | staleTime: 15s |

**SignalR:** `NotificationHub` — update unread count in real-time.

**Migration complexity:** Medium — multiple parallel queries, computed KPIs.

---

### 4.3 Board — `app/board/page.tsx` (T1)

**Current state:** Core Kanban task list/detail/create/update/delete and drag-and-drop status changes now use TanStack Query plus the typed API client against live task, project, and workspace-member endpoints. Comments, checklist items, watchers, attachments, and sprint-aware flows are still pending, and non-mapped backend statuses are intentionally hidden from the current four-lane board surface.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Board tasks | `GET /api/v1/tasks?projectId={id}&sortBy=sortOrder` | `tasks.list(projectId)` | staleTime: 15s |
| Task detail | `GET /api/v1/tasks/{id}` | `tasks.detail(id)` | staleTime: 30s |
| Create task | `POST /api/v1/tasks` | — | Mutation + optimistic |
| Update task | `PUT /api/v1/tasks/{id}` | — | Mutation + optimistic |
| Move task (status) | `PATCH /api/v1/tasks/{id}/status` | — | Mutation + optimistic |
| Delete task | `DELETE /api/v1/tasks/{id}` | — | Mutation + optimistic |
| Comments | `POST /api/v1/tasks/{id}/comments` | `tasks.detail(id)` | Pending migration |
| Checklist | `POST/PUT/DELETE /api/v1/tasks/{id}/checklist/*` | `tasks.detail(id)` | Pending migration |
| Watchers | `POST/DELETE /api/v1/tasks/{id}/watchers/*` | `tasks.detail(id)` | Pending migration |
| Team members | `GET /api/v1/workspaces/{id}/members` | `workspace.members` | staleTime: 5min |
| Sprint list | `GET /api/v1/projects/{id}/sprints?status=Active,Planned` | `sprints.list` | staleTime: 2min |

**SignalR:** `BoardHub` — join project group, receive task moved/created/updated/deleted events. Apply optimistic updates and reconcile with server state.

**Optimistic update pattern:**

```typescript
const moveTask = useMutation({
  mutationFn: (data: { taskId: string; newStatus: string }) =>
    client.api.v1.tasks[data.taskId].status.patch({ status: data.newStatus }),
  onMutate: async (data) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list(projectId) });
    const previous = queryClient.getQueryData(queryKeys.tasks.list(projectId));
    queryClient.setQueryData(queryKeys.tasks.list(projectId), (old) =>
      old.map(t => t.id === data.taskId ? { ...t, status: data.newStatus } : t));
    return { previous };
  },
  onError: (err, data, context) => {
    queryClient.setQueryData(queryKeys.tasks.list(projectId), context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list(projectId) });
  },
});
```

**Migration complexity:** High — core CRUD and DnD are shipped, but task subresources and realtime reconciliation are still outstanding.

---

### 4.4 Projects — `app/projects/page.tsx` (T1)

**Current state:** Project list/grid, creation modal, detail panel, inline updates, and favorite toggles now use `/api/v1/projects` through TanStack Query and the typed API client. Some presentation fields are still derived in the frontend because the backend does not yet expose every former mock-only field.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Project list | `GET /api/v1/projects?sortBy=name` | `projects.list` | staleTime: 60s |
| Project detail | `GET /api/v1/projects/{id}` | `projects.detail(id)` | staleTime: 30s |
| Project metrics | `GET /api/v1/projects/{id}/metrics` | `projects.metrics(id)` | staleTime: 2min |
| Create project | `POST /api/v1/projects` | — | Mutation + invalidate list |
| Update project | `PUT /api/v1/projects/{id}` | — | Mutation + invalidate |
| Delete project | `DELETE /api/v1/projects/{id}` | — | Mutation + invalidate |
| Toggle favorite | `POST /api/v1/projects/{id}/favorite` | — | Mutation + optimistic |
| Create from template | `POST /api/v1/projects/from-template` | — | Mutation + invalidate |
| Project templates | `GET /api/v1/request-forms` | `templates.list` | staleTime: 5min |

**SignalR:** None directly — project changes are low-frequency.

**Migration complexity:** Medium — standard CRUD + favorites + template creation.

---

### 4.5 Inbox — `app/inbox/page.tsx` (T2)

**Current state:** Notification feed now uses `InboxProvider` backed by TanStack Query plus the typed API client against `/api/v1/notifications`. Read, mark-all-read, archive, and shared unread counts are live; richer threaded reply behavior is intentionally still not shipped.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Notification list | `GET /api/v1/notifications?pageSize=50` | `notifications.list` | staleTime: 15s |
| Mark read | `PUT /api/v1/notifications/{id}/read` | — | Mutation + optimistic |
| Archive | `PUT /api/v1/notifications/{id}/archive` | — | Mutation + optimistic |
| Mark all read | `PUT /api/v1/notifications/read-all` | — | Mutation + invalidate |
| Unread count | Derived from notification list or separate count query | `notifications.unread` | staleTime: 15s |
| Preferences | `GET /api/v1/notifications/preferences` | `notifications.prefs` | staleTime: 5min |

**SignalR:** `NotificationHub` — new notifications pushed in real-time. Append to query cache and update unread count.

**Migration complexity:** Low — core list and triage are shipped, with richer threaded behavior still pending.

---

### 4.6 Calendar — `app/calendar/page.tsx` (T2)

**Current state:** Month/week/day/agenda views, search, creation, editing, and deletion now use TanStack Query plus the typed API client against `/api/v1/calendar`, with linked project lookup from `/api/v1/projects`. Unsupported mock-only controls for assignees, status, priority, progress, tags, dependencies, and drag-persist behavior were intentionally removed to keep the UI honest to the backend contract. Task due-date overlays are still pending.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Calendar items | `GET /api/v1/calendar?start={}&end={}` | `calendar.range(start,end)` | staleTime: 60s |
| Create item | `POST /api/v1/calendar` | — | Mutation + invalidate range |
| Update item | `PUT /api/v1/calendar/{id}` | — | Mutation + invalidate |
| Delete item | `DELETE /api/v1/calendar/{id}` | — | Mutation + invalidate |
| Task due dates | Pending live migration | Pending | Not yet shipped |

**SignalR:** None — calendar events are low-frequency updates.

**Migration complexity:** Medium — date-range queries, multiple data sources (calendar items + task due dates).

---

### 4.7 Goals — `app/goals/page.tsx` (T2)

**Current state:** Goal list, hierarchy, detail drawer, creation modal, sub-goal creation, initiative creation, and project linking now use TanStack Query plus the typed API client against `/api/v1/goals`, `/api/v1/projects`, and `/api/v1/workspaces/{id}/members`. Realtime goal updates, initiative editing, and richer goal analytics are still pending.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Goals list | `GET /api/v1/goals?sortBy=title` | `goals.list` | staleTime: 60s |
| Goal detail | `GET /api/v1/goals/{id}` | `goals.detail(id)` | staleTime: 30s |
| Create goal | `POST /api/v1/goals` | — | Mutation + invalidate |
| Update goal | `PUT /api/v1/goals/{id}` | — | Mutation + invalidate |
| Delete goal | `DELETE /api/v1/goals/{id}` | — | Mutation + invalidate |
| Add initiative | `POST /api/v1/goals/{id}/initiatives` | — | Mutation + invalidate |
| Link project | `POST /api/v1/goals/{id}/projects` | — | Mutation + invalidate |
| Linked projects | Included in goal detail response | `goals.detail(id)` | — |

**SignalR:** None.

**Migration complexity:** Medium — nested hierarchy and core mutations are now live, but initiative editing and realtime reconciliation remain pending.

---

### 4.8 Documents — `app/docs/page.tsx` (T2)

**Current state:** Document list, search, selection, and editing now use TanStack Query plus the typed API client against `/api/v1/documents`. Unsupported prototype-only affordances such as folders, favorites, sharing, collaborators, and history are intentionally disabled instead of being faked.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Document list | `GET /api/v1/documents` | `documents.list` | staleTime: 60s |
| Document detail | `GET /api/v1/documents/{id}` | `documents.detail(id)` | staleTime: 30s |
| Create document | `POST /api/v1/documents` | — | Mutation + invalidate |
| Update document | `PUT /api/v1/documents/{id}` | — | Mutation + invalidate |
| Delete document | `DELETE /api/v1/documents/{id}` | — | Mutation + invalidate |
| Project documents | `GET /api/v1/projects/{id}/documents` | `documents.byProject(id)` | staleTime: 60s |

**SignalR:** None currently wired for docs; presence remains planned.

**Migration notes:** The shipped live editor currently supports title and plain-text content only. Rich collaboration, revision history, foldering, and favorites remain blocked on missing backend contracts.

**Migration complexity:** Medium — live CRUD is shipped, but richer document behaviors remain pending.

---

### 4.9 Sprints — `app/sprints/page.tsx` (T2)

**Current state:** Sprint planning now uses TanStack Query plus the typed API client. Project selection, sprint lifecycle, backlog assignment, and sprint-board progression are live against the sprint and task endpoints.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Sprint list | `GET /api/v1/projects/{id}/sprints` | `sprints.list(projectId)` | staleTime: 60s |
| Sprint detail | `GET /api/v1/sprints/{id}` | `sprints.detail(id)` | staleTime: 30s |
| Sprint tasks | `GET /api/v1/tasks?projectId={id}` + client-side `sprintId` partitioning | `tasks.list(projectId)` | staleTime: 15s |
| Backlog tasks | `GET /api/v1/tasks?projectId={id}` + client-side `sprintId == null` partitioning | `tasks.list(projectId)` | staleTime: 15s |
| Create sprint | `POST /api/v1/projects/{id}/sprints` | — | Mutation + invalidate |
| Start sprint | `POST /api/v1/sprints/{id}/start` | — | Mutation + invalidate |
| Complete sprint | `POST /api/v1/sprints/{id}/complete` | — | Mutation + invalidate |
| Move task to sprint | `PUT /api/v1/tasks/{id}` (set `sprintId`) | — | Mutation + optimistic |

**SignalR:** None currently wired for the sprint surface.

**Migration complexity:** High — live sprint lifecycle and backlog management are shipped, while richer planning analytics and realtime still remain pending.

---

### 4.10 Timeline — `app/timeline/page.tsx` (T3)

**Current state:** Gantt-style timeline view now uses live TanStack Query data from `/api/v1/projects`, `/api/v1/tasks`, and per-project sprint queries. `components/timeline/data.ts` remains as a mapping and presentation helper, not as the source of truth.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Tasks with dates | `GET /api/v1/tasks?startDate.isNull=false&pageSize=100` | `tasks.timeline` | staleTime: 60s |
| Dependencies | Included in task detail or separate query | `tasks.dependencies` | staleTime: 2min |
| Projects | `GET /api/v1/projects` | `projects.list` | staleTime: 60s |

**SignalR:** None.

**Migration complexity:** Medium — requires tasks with date ranges and dependency visualization.

---

### 4.11 Workload — `app/workload/page.tsx` (T3)

**Current state:** Live aggregate workload dashboard driven by persisted analytics, projects, and tasks. The previous demo capacity-allocation grid has been removed rather than simulated against unsupported backend concepts.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Workload data | `GET /api/v1/analytics/workload` | `analytics.workload` | staleTime: 2min |
| Team members | `GET /api/v1/workspaces/{id}/members` | `workspace.members` | staleTime: 5min |
| Tasks by assignee | `GET /api/v1/tasks?assigneeId={id}` | `tasks.byAssignee(id)` | staleTime: 60s |

**SignalR:** None.

**Migration complexity:** Low — shipped against the current aggregate analytics contract, with richer capacity/scheduling still pending future backend support.

---

### 4.12 Reports — `app/reports/page.tsx` (T3)

**Current state:** Analytics dashboards now use live TanStack Query data from persisted projects, tasks, and analytics endpoints. Saved reports, rich filter presets, sharing, and financial/goals report domains remain planned and are intentionally shown as unavailable.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Project overview snapshot | `GET /api/v1/projects` + `GET /api/v1/tasks` | `projects.list`, `tasks.list` | staleTime: 30-60s |
| Velocity chart | `GET /api/v1/analytics/velocity?projectId={id}` | `analytics.velocity(id)` | staleTime: 5min |
| Workload chart | `GET /api/v1/analytics/workload` | `analytics.workload` | staleTime: 5min |
| Export report | `GET /api/v1/analytics/export?format=csv` | — | Download (no cache) |

**SignalR:** None.

**Migration complexity:** Low — live snapshot reports are shipped, but saved views and richer reporting contracts remain pending.

---

### 4.13 Time Tracking — `app/time-tracking/page.tsx` (T3)

**Current state:** Timesheet grid, live team overview, the log-time modal, and entry deletion now use TanStack Query plus the typed API client against `/api/v1/time-entries`, `/api/v1/tasks`, `/api/v1/projects`, and `/api/v1/workspaces/{id}/members`. Running timers and entry editing are still pending in the UI even though the backend already exposes those contracts.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Time entries | `GET /api/v1/time-entries?startedAfter={rangeStart}&startedBefore={rangeEnd}` | `timeEntries.list(range)` | staleTime: 15s |
| Task lookup | `GET /api/v1/tasks?pageSize=200` | `timeTracking.tasks` | staleTime: 30s |
| Project lookup | `GET /api/v1/projects?pageSize=100` | `timeTracking.projects` | staleTime: 30s |
| Member lookup | `GET /api/v1/workspaces/{id}/members` | `timeTracking.members` | staleTime: 30s |
| Start timer | `POST /api/v1/time-entries/start` | — | Mutation |
| Stop timer | `POST /api/v1/time-entries/{id}/stop` | — | Mutation + invalidate |
| Log time | `POST /api/v1/time-entries` | — | Mutation + invalidate |
| Update entry | `PUT /api/v1/time-entries/{id}` | — | Mutation + invalidate |
| Delete entry | `DELETE /api/v1/time-entries/{id}` | — | Mutation + invalidate |
| Team entries | Included in range query + workspace member lookup | `timeEntries.list(range)` | Derived in client |

**SignalR:** None.

**Migration complexity:** Medium — live logging, deletion, and summaries are shipped; running timer state and entry editing remain pending.

---

### 4.14 Settings — `app/settings/page.tsx` (T4)

**Current state:** Workspace general settings, members, profile, and notification preferences now use live TanStack Query hooks and the typed API client. Billing, integrations, security, teams, and appearance remain placeholder panels without real backend persistence.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Workspace settings | `GET /api/v1/workspaces/{id}/settings` | `workspace.settings` | staleTime: 5min |
| Update settings | `PUT /api/v1/workspaces/{id}/settings` | — | Mutation + invalidate |
| Member list | `GET /api/v1/workspaces/{id}/members` | `workspace.members` | staleTime: 5min |
| Update member role | `PUT /api/v1/workspaces/{id}/members/{userId}` | — | Mutation + invalidate |
| Remove member | `DELETE /api/v1/workspaces/{id}/members/{userId}` | — | Mutation + invalidate |
| Send invitation | `POST /api/v1/workspaces/{id}/invitations` | — | Mutation |
| Subscription info | `GET /api/v1/billing/subscription` | `billing.subscription` | Pending migration |
| Billing portal | `POST /api/v1/billing/portal` | — | Pending migration |
| User profile | `GET /api/v1/users/me` | `user.me` | staleTime: 5min |
| Update profile | `PUT /api/v1/users/me` | — | Mutation + invalidate |
| Change password | `PUT /api/v1/users/me/password` | — | Pending migration |
| Notification prefs | `GET /api/v1/notifications/preferences` | `notifications.prefs` | staleTime: 5min |
| Update notif prefs | `PUT /api/v1/notifications/preferences` | — | Mutation |
| Feature flags | `GET /api/v1/admin/feature-flags` | `admin.flags` | Pending migration |

**SignalR:** None.

**Migration complexity:** Medium — the core workspace/user/preferences panels are shipped, while billing, security, integrations, teams, and appearance still need real data flows.

---

### 4.15 Automations — `app/automations/page.tsx` (T4)

**Current state:** Automation rule builder now uses live TanStack Query data and optimistic mutations against `/api/v1/automations`, `/api/v1/automations/{id}`, `/api/v1/automations/{id}/logs`, and `/api/v1/projects`.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Automation list | `GET /api/v1/automations` | `automations.list` | staleTime: 60s |
| Create automation | `POST /api/v1/automations` | — | Mutation + invalidate |
| Update automation | `PUT /api/v1/automations/{id}` | — | Mutation + invalidate |
| Delete automation | `DELETE /api/v1/automations/{id}` | — | Mutation + invalidate |
| Execution logs | `GET /api/v1/automations/{id}/logs` | `automations.logs(id)` | staleTime: 30s |

**SignalR:** None.

**Migration complexity:** Low — standard CRUD + log viewing.

---

### 4.16 Intake — `app/intake/page.tsx` (T4)

**Current state:** Form management, submission review, and convert-to-task workflow now use live TanStack Query data against request forms, intake submissions, conversion, project, and member endpoints.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Request forms | `GET /api/v1/request-forms` | `intake.forms` | staleTime: 60s |
| Create form | `POST /api/v1/request-forms` | — | Mutation + invalidate |
| Update form | `PUT /api/v1/request-forms/{id}` | — | Mutation + invalidate |
| Submissions | `GET /api/v1/intake/submissions` | `intake.submissions` | staleTime: 30s |
| Convert to task | `POST /api/v1/intake/submissions/{id}/convert-to-task` | — | Mutation + invalidate both lists |

**SignalR:** None.

**Migration complexity:** Low — CRUD + conversion action.

---

### 4.17 Templates — `app/templates/page.tsx` (T4)

**Current state:** Template gallery now uses live TanStack Query data against project template endpoints and creates real projects from templates through the backend.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Template list | `GET /api/v1/projects/templates` (or included in project templates) | `templates.list` | staleTime: 5min |
| Create from template | `POST /api/v1/projects/from-template` | — | Mutation + invalidate projects |

**SignalR:** None.

**Migration complexity:** Low — read-only gallery + single creation action.

---

### 4.18 Portfolio — `app/portfolio/page.tsx` (T3)

**Current state:** Portfolio now uses live TanStack Query data against goals, initiatives, linked projects, project lookup, and workspace members. Unsupported mock-only budgeting and health affordances were removed instead of being simulated.

| Data Need | API Endpoint | Query Key | Cache Strategy |
|-----------|-------------|-----------|----------------|
| Goals + initiatives | `GET /api/v1/goals?type=Initiative` | `goals.initiatives` | staleTime: 60s |
| Goal detail | `GET /api/v1/goals/{id}` | `goals.detail(id)` | staleTime: 30s |
| Projects (for aggregation) | `GET /api/v1/projects` | `projects.list` | staleTime: 60s |
| Create initiative | `POST /api/v1/goals/{id}/initiatives` | — | Mutation + invalidate |

**SignalR:** None.

**Migration complexity:** Medium — aggregated data from goals + projects.

---

## 5. Shared Components Integration

These components appear across multiple pages and have their own data needs:

### 5.1 Header (`components/header.tsx`)

| Data Need | API Endpoint | Query Key |
|-----------|-------------|-----------|
| Current user | `GET /api/v1/users/me` | `user.me` |
| Unread notification count | `GET /api/v1/notifications?isRead=false&pageSize=0` | `notifications.unread` |
| Search | `GET /api/v1/search?q={query}` | `search.results(q)` |

### 5.2 Sidebar (`components/sidebar.tsx`)

| Data Need | API Endpoint | Query Key |
|-----------|-------------|-----------|
| Workspace list | `GET /api/v1/workspaces` | `workspaces.list` |
| Current workspace | `GET /api/v1/workspaces/{id}` | `workspace.detail` |
| Favorite projects | `GET /api/v1/projects?isFavorite=true` | `projects.favorites` |

### 5.3 Command Palette (`components/ui/command-palette.tsx`)

| Data Need | API Endpoint | Query Key |
|-----------|-------------|-----------|
| Task search | `GET /api/v1/tasks?pageSize=100` | `command-palette.tasks` |
| Project search | `GET /api/v1/projects?pageSize=100` | `command-palette.projects` |
| Goal search | `GET /api/v1/goals?pageSize=100` | `command-palette.goals` |
| Member search | `GET /api/v1/workspaces/{id}/members` | `command-palette.members` |
| Document search | `GET /api/v1/documents` | `documents.list` |

### 5.4 AI Copilot (`components/ui/ai-copilot.tsx`)

**Current state:** The demo AI Copilot components still exist in source, but `AiCopilotProvider` is no longer mounted in `app/providers.tsx`, so the AI panel is not active in the current authenticated shell.

| Data Need | API Endpoint | Query Key |
|-----------|-------------|-----------|
| Conversations | `GET /api/v1/ai/conversations` | `ai.conversations` |
| Send message | `POST /api/v1/ai/conversations/{id}/messages` | — |
| AI streaming | SignalR `AIStreamHub` | — |

---

## 6. Data Provider Migration Plan

### 6.1 Phase 1: Auth Foundation

**Goal:** Replace direct page access with authenticated routes.

1. Create `AuthProvider` with JWT token management
2. Create `WorkspaceProvider` with workspace context
3. Add route guard (redirect to `/login` if unauthenticated)
4. Wire `X-Workspace-Id` header into API client
5. Create workspace selector for multi-workspace users

### 6.2 Phase 2: Core Data Migration

**Goal:** Replace `AppDataProvider` mock data with TanStack Query hooks.

1. Install TanStack Query + Kiota client
2. Create query key factory (`lib/query-keys.ts`)
3. Create custom hooks per entity:
   - `useTasks()`, `useTask(id)`, `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()`
   - `useProjects()`, `useProject(id)`, `useCreateProject()`, etc.
   - Pattern: one hook file per entity in `hooks/api/`
4. Dashboard page migrated to live queries
5. Projects page migrated to live queries and mutations
6. Board core workflow migrated to live queries and mutations; finish comments, checklist, watchers, attachments, and realtime reconciliation

### 6.3 Phase 3: Feature Pages

**Goal:** Migrate remaining feature pages.

1. Inbox live-notifications migration shipped; next add richer notification preferences and SignalR cache updates
2. Settings core panels shipped; next add billing, security, integrations, teams, and appearance
3. Portfolio, Intake, Automations, Templates, and Timeline are now live-hook surfaces; deepen them toward richer backend contracts instead of mock replacement
4. Deepen live workload/docs/reports/sprints/board/settings toward richer contracts and realtime coverage

### 6.4 Phase 4: Remove AppDataProvider

**Goal:** Remove mock data layer entirely.

1. Verify all current product routes use live hooks or live providers
2. Keep `contexts/app-data-context.tsx` marked as legacy unused scaffolding until explicit cleanup approval is given
3. Remove remaining mock-only `data.ts` truth sources where they are still more than mapping/helpers
4. `AppDataProvider` has already been removed from the provider stack
5. Keep `app/providers.tsx` and shared shell docs aligned with the live runtime stack

---

## 7. Migration Complexity Summary

| Page | Tier | API Calls | SignalR | Optimistic Updates | Complexity |
|------|------|-----------|---------|-------------------|------------|
| Auth (new) | T0 | 6 | No | No | Medium |
| Dashboard | T1 | 4-6 | NotificationHub | No | Medium |
| Board | T1 | 10+ | BoardHub | Yes (DnD) | **High** |
| Projects | T1 | 4-8 | No | Yes (favorites) | Medium |
| Inbox | T2 | 4 | NotificationHub | Yes (mark read) | Low |
| Calendar | T2 | 5 | No | No | Medium |
| Goals | T2 | 7 | Yes | No | Medium |
| Documents | T2 | 6 | No | No | Medium |
| Sprints | T2 | 7 | No | Yes (task moves) | **High** |
| Timeline | T3 | 3 | No | No | Medium |
| Workload | T3 | 3 | No | No | Low |
| Reports | T3 | 4 | No | No | Low |
| Time Tracking | T3 | 6 | Yes | No | Medium |
| Settings | T4 | 12+ | No | No | Medium |
| Automations | T4 | 5 | No | No | Low |
| Intake | T4 | 5 | No | No | Low |
| Templates | T4 | 2 | No | No | Low |
| Portfolio | T3 | 4 | No | No | Medium |

---

## 8. Error Handling Strategy

### 8.1 Global Error Boundary

```typescript
// TanStack Query global error handler
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,
    },
    mutations: {
      onError: (error) => {
        if (error instanceof ProblemDetailsError) {
          if (error.status === 401) {
            // Trigger token refresh or redirect to login
          } else if (error.status === 403) {
            toast.error('You do not have permission to perform this action');
          } else if (error.status === 429) {
            toast.error('Too many requests. Please try again shortly.');
          }
        }
      },
    },
  },
});
```

### 8.2 Per-Page Error States

Each page should handle:

| State | UI | Implementation |
|-------|-----|---------------|
| Loading | Skeleton / spinner | `isLoading` from `useQuery` |
| Empty | Empty state illustration + CTA | `data?.length === 0` |
| Error | Error message + retry button | `isError` + `refetch()` |
| Offline | Banner + cached data | `navigator.onLine` + stale query data |

---

## 9. Caching and Invalidation Rules

| Event | Invalidation |
|-------|-------------|
| Task created | `tasks.list(projectId)`, `tasks.myWork`, `projects.metrics(projectId)` |
| Task status changed | `tasks.list(projectId)`, `tasks.detail(id)`, `analytics.velocity` |
| Task deleted | Same as created |
| Project created | `projects.list`, `projects.favorites` |
| Sprint completed | `sprints.list(projectId)`, `analytics.velocity`, `analytics.burndown` |
| Notification received (SignalR) | `notifications.list`, `notifications.unread` |
| Board task moved (SignalR) | `tasks.list(projectId)` — merge with optimistic state |
| Member invited | `workspace.members` |
| Subscription changed | `billing.subscription`, `admin.flags` |
