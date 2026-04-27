# Project SSOT

Last updated: 2026-04-27 (validation and status refresh)

## Purpose

This document is the canonical engineering single source of truth for the repository.

When this document conflicts with code or fresh checks, trust:

1. source code and passing verification
2. database schema and migrations
3. this document
4. older roadmap or architecture notes

## Current Verdict

The product shell is substantially implemented, but the repository is **not yet production-complete**. Major route surfaces exist and the validated command suite is clean, while deeper subfeatures, production operations, Docker-backed integration execution, and some backend contracts remain open.

What is true today:

- Frontend lint, typecheck, Vitest, and production build all pass with zero errors.
- The Next.js 16 build generates 28 app routes and uses offline-safe system font stacks, so production builds do not depend on fetching Google Fonts.
- All current app-level raw `<img>` lint blockers have been removed; remaining image usage is through Next.js `Image` where applicable.
- Legacy dead code (`app-data-context.tsx`) has been removed.
- Backend API and worker tests pass; Docker-backed integration tests are discovered and skipped with a clear prerequisite message when Docker is unavailable.
- Browser E2E coverage exists for selected flows, but full end-to-end coverage is still incomplete.
- Every major product route has an interactive UI; some deeper subfeatures still use local/simulated behavior or await broader backend contracts.

## Verified Today

Reviewed on 2026-04-27 after the validation/build remediation pass.

| Check | Result | Notes |
|---|---|---|
| `cmd /c npm run lint` | PASS | Zero errors reported |
| `cmd /c npm run typecheck` | PASS | Zero diagnostics reported |
| `cmd /c npm test` | PASS | 64/64 Vitest tests |
| `cmd /c npm run build` | PASS | 28 app routes generated; exit code 0 |
| `dotnet build backend/LinearPrecision.sln --no-restore` | PASS | 6 projects built |
| `dotnet test backend/LinearPrecision.sln --no-restore` | PASS | 110 total, 72 passed, 38 Docker-backed integration tests skipped |

## Frontend Feature Matrix -- Current Surface Status

> Known gap: This matrix records the visible route surfaces. Some entries still include local/simulated subfeatures or disabled affordances where backend contracts, broader realtime coverage, or production integrations are not complete.

### Dashboard (app/page.tsx)
- **Status: COMPLETE**
- KPI strip with live workspace data (Cycle Velocity, Open Issues, Completed, Team Capacity)
- My Work widget, Issue List, Project Health widget, Recent Activity
- Quick Actions bar with 5 creation modals (Task, Project, Doc, Goal, Event)
- FooterStats now shows live dynamic data (Active Projects, Tasks Completed, Active Members, Team Load)
- Error handling with retry, loading states, fallback data

### Board (app/board/page.tsx)
- **Status: COMPLETE**
- Full Kanban board with task cards, drag-and-drop via @hello-pangea/dnd
- Task detail side panel with comments, checklists, watchers, attachments
- Create task modal, task status management
- Real-time SignalR updates for live board refresh
- Attachment upload with presigned URLs

### Projects (app/projects/page.tsx)
- **Status: COMPLETE**
- Grid and list views with search and filters
- Project detail side panel with full editing
- Create project modal
- Live API integration via TanStack Query

### Portfolio (app/portfolio/page.tsx)
- **Status: COMPLETE**
- Grid and list views with initiative management
- Create initiative modal, portfolio detail panel
- Summary stats and health indicators

### Calendar (app/calendar/page.tsx)
- **Status: COMPLETE**
- Four view modes: Month, Week, Day, Agenda
- Click-to-create on empty time slots (week/day views)
- Overlap stacking for concurrent events in week/day views
- Full CRUD: create, edit, delete calendar items
- Recurrence rule support (stored, editable)
- Live API integration

### Timeline (app/timeline/page.tsx)
- **Status: COMPLETE**
- Full Gantt chart surface with three zoom levels (Days/Weeks/Months)
- Drag-to-reschedule for tasks (move + resize-left + resize-right)
- Assignee reassignment from detail panel dropdown
- Today indicator, weekend shading, status-colored bars
- Multi-entity aggregation (projects, sprints, tasks)
- Create task modal, search and filter pipeline

### Sprints (app/sprints/page.tsx)
- **Status: COMPLETE**
- Full sprint lifecycle: create, start, complete
- Edit sprint (name, goal, dates) via modal
- Delete sprint with confirmation dialog
- Drag-and-drop task cards between columns (To Do / In Progress / Done) via @hello-pangea/dnd
- Backlog panel with search
- Task movement between backlog and sprint

### Goals (app/goals/page.tsx)
- **Status: COMPLETE**
- Hierarchical tree view with expandable rows (Objectives and Key Results)
- Full CRUD: create, edit, delete goals
- Initiative creation, editing, and deletion
- Project linking and unlinking
- Multi-filter toolbar (search, status, type, cycle)
- Summary bar with progress aggregation

### Docs (app/docs/page.tsx)
- **Status: COMPLETE**
- Document sidebar with search, favorites, folder tree (5 folders)
- Rich editor with markdown toolbar, auto-save (3s debounce)
- Publish/unpublish toggle with confirmation
- Comments panel (localStorage-persisted per document)
- Revision history panel with restore capability
- Share modal with link generation and collaborator management
- Word/character count, dirty detection

### Reports (app/reports/page.tsx)
- **Status: COMPLETE**
- Three live report views: Project Health, Team Velocity, Workload
- KPI strip with info tooltips on hover
- Trend analysis charts via Recharts
- Contributing projects table with drill-down detail panel
- Date range filter (7 days, 30 days, 90 days, quarter, year, all time)
- CSV export
- Share-to-clipboard button
- Goals and Financial as selectable "Coming Soon" placeholders

### Time-Tracking (app/time-tracking/page.tsx)
- **Status: COMPLETE**
- Running timer with start/pause/resume/stop lifecycle
- Two view modes: List view and Timesheet (weekly grid)
- Custom date range picker with start/end date inputs
- Timesheet inline editing (click cells to log/edit hours)
- Inline editing in list view (hours, description, billable toggle)
- Log Time modal with task selector
- Three working filters (date range, member, project)
- Stats bar with live aggregated metrics
- CSV export

### Workload (app/workload/page.tsx)
- **Status: COMPLETE**
- Member workload cards with tone indicators (Idle/Balanced/Watch/Busy)
- Summary KPI strip (5 cards)
- Member detail side panel with full task list
- Search + project filter
- Workload level filter (Idle/Balanced/Watch/Busy)
- CSV export
- Manual refresh

### Inbox (app/inbox/page.tsx)
- **Status: COMPLETE**
- Notification list with filter rail
- Detail panel with full notification content
- Unread badge count in sidebar

### Settings (app/settings/page.tsx)
- **Status: COMPLETE**
- **General**: Workspace name, slug, logo, domain, description, regional defaults, danger zone -- live API
- **Members**: Full CRUD with invite, role change, remove -- live API
- **Profile**: Full form with save -- live API
- **Notifications**: Toggle grid for 5 event types across 3 channels -- live API
- **Teams**: Team management with create, edit, delete, member avatars -- local state with persistence note
- **Billing**: Plan display, usage meters, plan comparison, payment method modal, invoice history -- simulated with Stripe note
- **Security**: Change password, 2FA toggle, session management, API keys -- simulated
- **Integrations**: AI Provider (live API), third-party integration cards, webhook management
- **Appearance**: Theme, accent color, layout density, font size, date/time format with live preview, localStorage persistence, reset to defaults
- Sidebar search with filtering and highlighting

### Intake (app/intake/page.tsx)
- **Status: COMPLETE**
- Form list with search
- Submission table with status management
- Submission detail slide-in panel with all field values and metadata
- Full review workflow: New -> In Review -> Accepted/Rejected -> Convert to Task
- Form preview with test submission capability

### Templates (app/templates/page.tsx)
- **Status: COMPLETE**
- Grid and list views with category filter tabs
- Template preview side panel with task/subtask list
- "Use Template" modal to create projects from templates
- Search, loading skeleton, empty states

### Automations (app/automations/page.tsx)
- **Status: COMPLETE**
- Full CRUD: create, edit, toggle, delete automation rules
- Execution log viewing per automation
- Optimistic UI updates via TanStack Query
- Toast notifications for all actions

### Auth Pages
- **Status: COMPLETE**
- Login, Register, Forgot Password, Reset Password pages
- Invitation acceptance page
- Workspace Create / Select pages
- Auth shell guard for protected routes

### Shared Infrastructure
- **Status: COMPLETE**
- Error boundaries around all product surfaces
- Onboarding wizard (5 steps, localStorage persistence)
- Command palette with global search (Ctrl+K, tasks/projects/goals/docs/people)
- Keyboard shortcuts (16 "go" routes + 6 single-key actions)
- AI Copilot panel with conversation management and provider-backed replies
- File upload component (drag-and-drop, validation, status display)
- Toast notification system
- Breadcrumbs, modals, badges, form fields
- Sidebar with 20 navigation links (all resolve to existing routes)
- Header with search, notifications, profile dropdown

## Technical Debt Resolved

| Item | Status |
|---|---|
| Raw `<img>` elements | All replaced with Next.js `Image` |
| Legacy `app-data-context.tsx` | Removed (was unused dead code) |
| ESLint warnings | Zero (was 7 `<img>` warnings) |
| FooterStats hardcoded data | Now accepts live dashboard props |
| Settings teams panel | Full UI (was PlaceholderPanel stub) |
| Settings sidebar search | Now functional (was visual-only) |
| Billing payment button | Now has handler and modal |
| Appearance save | Now persists to localStorage |

## Backend Reality

### Verified Backend State

- API project compiles successfully.
- Backend solution builds successfully.
- Backend tests pass with 110 total, 72 passed, and 38 Docker-backed integration tests skipped when Docker is unavailable on `PATH`.
- SignalR hubs registered at `/hubs/board`, `/hubs/notifications`, `/hubs/presence`, `/hubs/ai-stream`.
- Task subresource endpoints (comments, checklist, watchers, attachments) are implemented.
- AI provider CRUD endpoints with protected API key storage.
- Npgsql dynamic JSON enabled for EF PostgreSQL connections.

### Backend Gaps (Not Blocking Frontend)

- Realtime hub coverage is board-only; other surfaces not yet wired to SignalR.
- Production operations (secrets management, deploy verification, backups, alerting, runbooks) not proven.
- Teams backend contract is still incomplete for the full settings UI.
- Billing/Stripe UI has simulated affordances and still needs production Stripe configuration/webhook verification.
- Security settings have MFA support, but session/API-key management and broader account-security operations still need completion.

## Runtime Anchors

| Area | Canonical File |
|---|---|
| Frontend provider tree | `app/providers.tsx` |
| Frontend API client | `lib/api/client.ts` |
| Frontend board data orchestration | `hooks/use-board-data.ts` |
| Frontend board task detail | `components/board/task-detail.tsx` |
| Frontend realtime provider | `contexts/realtime-context.tsx` |
| Frontend settings data | `hooks/use-settings-data.ts` |
| Frontend dashboard data | `hooks/use-dashboard-data.ts` |
| Backend API host | `backend/src/LinearPrecision.Api/Program.cs` |
| Backend task endpoints | `backend/src/LinearPrecision.Api/Modules/Tasks/TasksModule.cs` |
| Backend integration fixture | `backend/tests/LinearPrecision.Integration.Tests/Fixtures/ApiFixture.cs` |

## Bottom Line

The repository is in a clean, validated development state, but it is **not yet production-complete**:

- All current frontend and backend validation commands pass with zero failures
- Major product surfaces have interactive UI, loading/error handling, and API integration where contracts exist
- CRUD operations are wired to backend APIs where contracts exist
- Features without backend contracts use realistic local state with explicit user-facing notes
- Error boundaries protect every product surface
- Global infrastructure (command palette, keyboard shortcuts, onboarding, AI copilot) is fully functional

What would be needed for a full production deployment:

1. Move workspace into a Git repository for CI/CD operations
2. Run Docker-backed integration tests in a Docker-capable environment
3. Complete remaining backend contracts and production integrations (teams, billing, security sessions/API keys, broader realtime)
4. Expand E2E test coverage across all product surfaces
5. Production operations hardening (secrets, deploy verification, backups, alerting)
