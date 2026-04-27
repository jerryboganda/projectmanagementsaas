# Decision Log

## 2026-03-18 - Bootstrap Baseline

### Context
The current workspace is a standalone Next.js frontend prototype folder and not an active Git repository.

### Decisions
- Treat this codebase as a PM SaaS frontend prototype, not an AI Studio/Gemini app.
- Use Windows-safe verification commands:
  - `cmd /c npm ci`
  - `cmd /c npm run dev`
  - `cmd /c npm run lint`
  - `cmd /c npm run build`
  - `cmd /c npm run typecheck`
- Keep shared shell and global surfaces serialized for edits:
  - `app/layout.tsx`
  - `app/providers.tsx`
  - `app/globals.css`
  - `components/sidebar.tsx`
  - `components/header.tsx`
  - `contexts/inbox-context.tsx`
  - `contexts/app-data-context.tsx` (added Wave 1)
- Allow safe parallelism for read-heavy discovery and disjoint feature-folder changes.
- Accept raw `<img>` lint warnings as temporary prototype debt.
- Require lint blockers to be fixed before completion.
- Store repo-local skills under `.codex/skills` to match the active local Codex project convention in this environment.
- Leave Codex local-environment actions documented but ungenerated for now.

### Consequences
- Worktrees and branch policy stay blocked until this project is moved into a canonical Git clone.
- All significant process and architecture updates must be reflected in `AGENTS.md`, this file, and related docs.

---

## 2026-03-18 - Unified Data Store Architecture

### Context
The original prototype had 11+ modules each with their own `data.ts` file containing duplicated type definitions and disconnected mock data. Cross-module operations (e.g., task creation updating project metrics) were impossible.

### Decisions
- Create a single `AppDataProvider` context (`contexts/app-data-context.tsx`) as the centralized in-memory data store.
- Define canonical types for all entities in one file: User, Task, Project, GoalItem, Initiative, Sprint, Automation, TimeEntry, RequestForm, RequestSubmission, ProjectTemplate, DocItem, CalendarItem.
- Expose CRUD functions for all entity types via React context.
- Include cross-entity operations: `convertRequestToTask`, `createProjectFromTemplate`.
- Seed rich mock data on initialization for all entity types.
- Prioritize migration of 5 core modules first (board, projects, calendar, portfolio, goals).
- Defer migration of 6 modules that have complex local data needs (timeline, workload, reports, docs, inbox, settings).

### Consequences
- Single large context file (~817 lines) — risk of re-render overhead and maintenance burden.
- Two data paradigms coexist: AppDataProvider modules vs. local data.ts modules.
- All new Wave 3 pages built directly on AppDataProvider, establishing it as the default pattern.
- `contexts/app-data-context.tsx` added to serialized write surfaces list.

---

## 2026-03-18 - New Feature Pages as Single-File Modules

### Context
Original modules used a multi-file pattern (layout, surface, toolbar, detail, modal, data.ts). Building 5 new feature pages in this pattern would require 30+ files.

### Decisions
- Implement new Wave 3 feature pages (sprints, automations, time-tracking, intake, templates) as single-file layout components.
- Each file contains all state, rendering, modals, and detail panels in one component (~530-620 lines each).
- New pages consume data from AppDataProvider rather than local data.ts files.

### Consequences
- Faster development velocity for new pages.
- Larger individual files (up to 960 lines after iteration), trading file count for file size.
- Deviation from original module pattern may cause confusion; documented in architecture.md.
- Refactoring to multi-file pattern remains possible if maintenance burden increases.

---

## 2026-03-18 - Keyboard Shortcuts via Custom Hook + Event System

### Context
Need for global keyboard navigation (Linear-style `g+X` sequences) across all 17 pages without tightly coupling the shortcut system to individual page components.

### Decisions
- Create a custom hook `use-keyboard-shortcuts.ts` that registers global key listeners.
- Use `window.dispatchEvent(new CustomEvent(...))` for decoupled communication between shortcuts and UI components (e.g., triggering create modals, command palette).
- Create a `GlobalShortcuts` wrapper component rendered once in providers.tsx.
- Create a visual `KeyboardShortcutsDialog` accessible via `?` key.

### Consequences
- Shortcuts work globally without per-page wiring.
- CustomEvent pattern avoids prop drilling but is less discoverable than explicit props.
- Adding new shortcuts requires updating the hook and the dialog.

---

## 2026-03-18 - Onboarding Wizard with localStorage Persistence

### Context
New users landing on the dashboard have no guidance on available features. Need a first-run experience.

### Decisions
- Implement a 5-step overlay wizard (welcome, workspace setup, features overview, shortcuts preview, ready).
- Use localStorage to track completion state — wizard only shows once.
- Allow re-triggering via a custom DOM event (`triggerOnboarding`) so it can be invoked from settings or help menus.
- Render the wizard globally in providers.tsx.

### Consequences
- Minimal persistence without backend dependency.
- localStorage is device-specific; users on new devices see the wizard again (acceptable for MVP).
- Wizard content is static; would need dynamic content for multi-workspace scenarios.

---

## 2026-03-18 - React Compiler Compatibility Patterns

### Context
React 19.2 with React Compiler enforces stricter rules than manual React. Several patterns that worked pre-compiler caused build/lint errors.

### Decisions
- Replace recursive `useCallback` with plain functions inside `useMemo`.
- Remove simulated loading states that use synchronous `setState` in `useEffect` body.
- Convert manual `useCallback` with empty deps `[]` to plain arrow functions (let compiler infer deps).
- Wrap `Date.now()` and `new Date()` in `useState(() => ...)` lazy initializer pattern.

### Consequences
- Code patterns documented for future contributors.
- Some idiomatic React patterns (e.g., `useCallback` for stable refs) no longer appropriate.
- Must verify new patterns against React Compiler on each build.

---

## 2026-03-23 - Project SSOT And Mixed-System Framing

### Context
The repository now contains both a substantial Next.js frontend MVP and a real ASP.NET Core backend foundation under `backend/`, but several repo-facing docs still describe the project as frontend-only. The frontend also still has split state ownership across `AppDataProvider`, `InboxProvider`, local `data.ts` modules, and `localStorage`.

### Decisions
- Treat the repository as a mixed system: root Next.js frontend plus checked-in backend API and worker.
- Add `docs/project-ssot.md` as the canonical engineering SSOT for the repository.
- Use this truth hierarchy when docs disagree:
  - source code and fresh passing checks
  - migrations and schema
  - planning and architecture docs
- Define `app/providers.tsx`, `contexts/app-data-context.tsx`, and `backend/src/LinearPrecision.Api/Program.cs` as the current runtime anchors.
- Treat `AppDataProvider` as the closest current frontend SSOT, but not the long-term product-domain SSOT.
- Treat the backend API and persistence layer as the future business-domain SSOT once the frontend is integrated.

### Consequences
- Repo-facing docs must stop calling the system frontend-only unless they are explicitly scoped to historical frontend work.
- Documentation must distinguish between what is implemented in source and what is only planned.
- The frontend-to-backend integration path remains planned work, not shipped behavior.

---

## 2026-03-23 - Retire Legacy AppData And Demo AI From The Runtime Shell

### Context
As the remaining authenticated product routes moved onto live TanStack Query hooks and live providers, `app/providers.tsx` was still mounting `AppDataProvider` and `AiCopilotProvider`. That left the runtime shell misaligned with the codebase's actual ownership model and made the SSOT/docs understate how much of the app had already moved off the legacy mock store.

### Decisions
- Remove `AppDataProvider` from `app/providers.tsx` because no current source consumers remain outside `contexts/app-data-context.tsx`.
- Remove `AiCopilotProvider` from `app/providers.tsx` and the AI button from `components/header.tsx`.
- Keep `contexts/app-data-context.tsx` and `components/ai-copilot-provider.tsx` in source as legacy/demo scaffolding until there is explicit cleanup approval or a real production AI implementation.
- Treat the current frontend runtime as distributed across auth/workspace providers, TanStack Query hooks, `InboxProvider`, and the typed API client rather than a single monolithic store.

### Consequences
- The live authenticated shell no longer mounts `AppDataProvider` or `AiCopilotProvider`.
- The command palette, route layouts, and provider stack are now aligned with the live-hook migration status.
- Durable docs must describe `contexts/app-data-context.tsx` as legacy unused scaffolding rather than the current frontend SSOT.

---

## 2026-03-23 - Live Inbox Notifications And Web Build-Time Public Runtime Contract

### Context
The inbox surface, header unread badge, and sidebar unread badge were still powered by mock `InboxProvider` state, even after the root shell had real auth, workspace, query, and API-client foundations. Separately, the production web container relied on `NEXT_PUBLIC_*` values that were only being injected at container runtime, which is too late for the browser bundle baked during `next build`.

### Decisions
- Move `InboxProvider` from seeded mock items to TanStack Query plus the typed API client over `/api/v1/notifications`.
- Extend the notifications contract with archived-item support:
  - `GET /api/v1/notifications?isArchived={bool}`
  - `PUT /api/v1/notifications/{id}/archive`
- Treat the default inbox list and shared unread badges as active notifications only, excluding archived items.
- Keep live inbox detail actions honest: mark read, archive, save, and done are available; fake reply simulation is removed until a real threaded backend contract exists.
- Make the web image's public frontend runtime contract explicit at build time by passing `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SIGNALR_BASE_URL` through the root `Dockerfile`, `backend/docker-compose.yml`, and CI image builds.
- Add a web-container smoke test in CI so the built image is validated beyond compilation.

### Consequences
- Inbox is now a real backend-backed surface, but still only partially migrated because threaded reply and linked-entity navigation behavior are intentionally deferred.
- Archived notifications no longer inflate active unread counts or remain visible in the default inbox list.
- The web image no longer silently bakes fallback localhost API URLs when built in CI or Compose without explicit build-time values.

---

## 2026-03-23 - Live Goals Hierarchy And Goal Contract Tightening

### Context
The goals route was still powered by `AppDataProvider`, even after the root shell had real auth, workspace, query, and API-client foundations. The backend already exposed goal CRUD, detail, initiative, and project-link endpoints, but the frontend was still relying on mock OKR state and looser string-based local types.

### Decisions
- Move the goals surface from `AppDataProvider` to TanStack Query plus the typed API client over `/api/v1/goals`.
- Normalize the goals UI around stricter goal and initiative unions so the create modal, detail drawer, and live hook share one contract boundary.
- Treat goal detail as the live source for linked projects, initiatives, and the current child-goal tree.
- Reuse live `/api/v1/projects` and `/api/v1/workspaces/{id}/members` data to populate goal project-link and owner selectors.
- Keep initiative editing and realtime goal reconciliation explicitly pending until the next slice instead of simulating missing backend behaviors.

### Consequences
- Goals is now a partially migrated live backend surface rather than an `AppDataProvider` module.
- Dashboard quick actions can create real goals through the same typed goal contract.
- Remaining gaps are now concentrated in calendar, docs, sprints, time tracking, intake, portfolio, and other still-mock-backed surfaces.

---

## 2026-03-23 - Live Time Tracking Query Migration

### Context
The time-tracking page was still powered by `AppDataProvider`, even though the backend already exposed time-entry CRUD plus timer endpoints and the root shell already had auth, workspace, query, and API-client foundations. The UI also still showed a hard-coded billable ratio instead of deriving it from persisted entries.

### Decisions
- Move the time-tracking surface from `AppDataProvider` to TanStack Query plus the typed API client over `/api/v1/time-entries`.
- Add typed frontend contracts and API-client methods for listing, creating, updating, deleting, starting, and stopping time entries.
- Use live `/api/v1/tasks`, `/api/v1/projects`, and `/api/v1/workspaces/{id}/members` lookups to drive the timesheet, filters, and team overview.
- Make the billable summary derive from persisted `isBillable` data instead of a fixed placeholder percentage.
- Keep timer controls and entry editing explicitly pending in the UI until a follow-up slice wires those flows.

### Consequences
- Time Tracking is now a partially migrated live backend surface rather than an `AppDataProvider` module.
- The log-time modal writes real persisted entries, recent entries can be deleted through the live API, and the summary/team views reflect workspace data instead of seeded mock entries.
- Calendar, docs, sprints, intake, portfolio, workload, timeline, and other remaining mock-backed surfaces are now the main frontend migration backlog.

---

## 2026-03-24 - Provider-Backed AI Copilot Baseline

### Context
The runtime shell was still mounting `AiCopilotProvider`, but the backend only stored conversations and user messages, while the frontend synthesized assistant replies locally in demo mode. The settings integrations panel also had no durable contract for attaching third-party AI credentials.

### Decisions
- Add a tenant-scoped `AIProviderConnection` entity, but scope each saved connection to the current user within the workspace so personal API keys are not implicitly shared across members.
- Start with one active OpenAI-compatible provider connection per user/workspace, exposed through:
  - `GET /api/v1/ai/provider`
  - `PUT /api/v1/ai/provider`
  - `DELETE /api/v1/ai/provider`
- Store API keys in protected form using ASP.NET Core Data Protection before persisting them.
- Route AI Copilot message generation through a generic OpenAI-compatible chat completions client instead of local demo fallback replies.
- Surface the provider attachment flow in Settings > Integrations so saving a base URL, model, and API key immediately enables the copilot path.
- Explicitly enable Npgsql dynamic JSON for EF PostgreSQL connections so existing JSONB-backed primitive collections like task labels continue to work in real PostgreSQL integration environments.

### Consequences
- AI Copilot now has a real provider-backed baseline without requiring project-scoped provider-specific code paths.
- The initial contract is intentionally narrow: one saved provider connection per user/workspace, no provider rotation UI, no streaming, and no tool-calling orchestration yet.
- Targeted Docker-backed integration coverage now exists for both the AI provider flow and the board task-subresource flow.

---

## 2026-03-24 - Browser E2E Harness And Auto-Enabled First AI Provider

### Context
The project needed real browser verification for the new auth and AI-provider flows, and the first saved AI provider could remain disabled unless the user manually toggled it on, which conflicted with the requirement that attaching a provider should make AI start working automatically.

### Decisions
- Add a repo-owned Playwright harness with a dedicated local dev port and Chromium coverage under `tests/e2e/`.
- Start browser coverage with two live-path tests:
  - anonymous redirect to login while preserving the target route
  - register user, open Settings > Integrations, save an AI provider, then remove it
- Bind shared `FormField` labels to generated input ids so accessibility and browser selectors both operate on the real form contract.
- Treat an unconfigured AI provider form as enabled-by-default so the first successful provider attachment activates the copilot path automatically unless the user explicitly turns it off.
- Expand development CORS origins to include the dedicated local browser-harness origins used by the repo.

### Consequences
- The repository now has repeatable browser E2E coverage for core auth gating and the provider-backed AI settings flow.
- First-time provider setup is aligned with the product promise that attaching a provider makes AI available immediately.
- Browser coverage is still intentionally narrow and does not yet prove board drag/drop, attachments, invitations, or billing-critical flows.

---

## 2026-03-23 - Live Calendar Range Query Migration

### Context
The calendar page was still powered by `AppDataProvider`, even though the backend already exposed calendar-item CRUD and the root shell already had auth, workspace, query, and API-client foundations. The existing calendar UI also depended on mock-only concepts such as assignees, status, priority, progress, tags, dependencies, and drag persistence that do not exist in the backend contract.

### Decisions
- Move the calendar surface from `AppDataProvider` to TanStack Query plus the typed API client over `/api/v1/calendar`.
- Keep the live calendar UI honest to the backend contract by supporting only backend-backed fields: title, description, type, color, start/end, all-day, recurrence, and linked project.
- Remove unsupported prototype-only controls rather than simulating missing backend capabilities.
- Query calendar items by visible date window and fix the backend list endpoint to return items overlapping the requested range instead of only items fully contained within it.
- Add integration coverage for calendar list/create/get/update/delete contracts, even though the latest local rerun is currently blocked by a Docker Desktop engine failure outside the repo.

### Consequences
- Calendar is now a partially migrated live backend surface rather than an `AppDataProvider` module.
- Month, week, day, and agenda views remain available, but task due-date overlays and richer scheduling aggregation are still pending.
- The remaining frontend migration backlog is now centered on docs, sprints, intake, portfolio, workload, timeline, reports, automations, templates, and other still-mock-backed surfaces.

---

## 2026-03-23 - Live Documents, Reports, And Sprints Migration Slice

### Context
After Dashboard, Projects, Inbox, Calendar, Goals, and Time Tracking were moved onto live APIs, the next strongest remaining truthful migrations were Documents, Sprints, and Reports. Documents already had a dedicated CRUD module, Sprints already had dedicated sprint lifecycle endpoints plus task assignment through the tasks API, and Reports could be rebuilt honestly on top of persisted projects, tasks, and analytics endpoints even though the backend does not yet expose a saved-reports domain.

### Decisions
- Move the docs surface from static `mockDocsData` to TanStack Query plus the typed API client over `/api/v1/documents`.
- Keep the docs UI honest to the backend contract by treating the surface as a flat live document list and disabling unsupported prototype affordances such as folders, favorites, sharing, collaborators, and history.
- Move the sprints surface from `AppDataProvider` to TanStack Query plus the typed API client over `/api/v1/projects/{id}/sprints`, `/api/v1/sprints/{id}`, and `/api/v1/tasks`.
- Keep sprint planning honest to the current backend by using explicit project selection, task `sprintId` assignment for backlog moves, and real start/complete lifecycle calls.
- Rebuild the reports surface on live `projects`, `tasks`, and `analytics` queries instead of static mock charts.
- Treat project-health and workload scores as explicit frontend-derived snapshots until a richer dedicated reports domain exists on the backend.
- Update the command palette to use live document search results instead of the removed docs mock exports.

### Consequences
- Docs, Reports, and Sprints are now partially migrated live backend surfaces rather than purely mock-backed pages.
- The documents editor now performs real create/update/delete operations, but still only supports title and plain-text content because the backend lacks richer collaboration and revision contracts.
- The reports page now presents live workspace snapshots and disables saved-view/share affordances that the backend cannot yet truthfully support.
- The remaining major mock-heavy backlog is now centered on workload, timeline, intake, portfolio, automations, templates, and the remaining board/settings subresources.

---

## 2026-03-23 - Workload Live Migration And Reports Hardening

### Context
After the reports, docs, and sprints migrations landed, the workload page was still mock-backed and the new reports surface still had a few correctness gaps: unrelated analytics query failures could blank the selected report, the velocity export path still returned the tasks CSV, and the report detail CTA was non-functional.

### Decisions
- Move the workload surface from local/demo data to TanStack Query plus the typed API client over `/api/v1/analytics/workload`, `/api/v1/tasks`, and `/api/v1/projects`.
- Keep the workload UI honest to the backend by shipping a live aggregate member view with task drill-down instead of simulating unavailable capacity-allocation concepts.
- Scope report loading and error handling to the selected report instead of treating all analytics queries as one global blocker.
- Extend `/api/v1/analytics/export` to support truthful `tasks`, `velocity`, and `workload` CSV exports.
- Wire the report detail CTA to the Projects route and harden command-palette keyboard navigation for zero-result states.

### Consequences
- Workload is now a partially migrated live backend surface rather than a local mock page.
- Reports no longer fail closed when a non-selected analytics query is slow or unavailable.
- Team Velocity and Workload exports now map to their own backend datasets instead of silently downloading the tasks report.
- The remaining major mock-heavy backlog is now centered on intake, timeline, portfolio, automations, templates, and deeper follow-on work for board, settings, reports, and workload contracts.

---

## 2026-04-26 - Confirmed Email Required Before Auth Sessions

### Context
The auth security audit left email confirmation as the final account lifecycle gap after rate limiting, refresh-token hardening, MFA, password reset/session revocation, and hub-scoped SignalR tokens were implemented.

### Decisions
- Require confirmed email/account in ASP.NET Core Identity before authentication sessions can be issued.
- Keep registration as a workspace-creation flow, but return `RegistrationPendingResponse` instead of an access/refresh token pair.
- Add anonymous `POST /api/v1/auth/confirm-email` and enumeration-safe `POST /api/v1/auth/resend-confirmation` endpoints under the existing `auth` rate limiter.
- Reject unconfirmed users at every session or token boundary: login, MFA login verification, refresh, active-workspace session refresh, hub-token issuance, and invitation acceptance.
- Align web and mobile clients so registration shows a confirmation-required state and login can resend confirmation emails when a confirmed address is required.

### Consequences
- Browser and mobile clients must not expect a session from registration.
- Existing unconfirmed accounts cannot sign in until they complete the confirmation flow.
- Confirmation links use the frontend `/confirm-email` route, which scrubs email/token query parameters after reading them.

---

## 2026-04-26 - Backend API Performance Guardrails

### Context
The backend/API performance audit identified a confirmed workload export N+1, several heavy list/detail endpoints without defensive bounds, repeated aggregate-query patterns, low-risk read paths suitable for cache-aside, and worker jobs that could overlap or materialize too much data at once.

### Decisions
- Keep existing frontend-facing response shapes while adding bounded `page`/`pageSize` defaults and maximums to heavy list endpoints.
- Use set-based grouped aggregates for workload export, project metrics, and sprint task counts instead of repeated per-row or per-status count queries.
- Omit document body content from document list responses while preserving full content on document detail responses.
- Use short distributed-cache TTLs for low-risk plan, feature-flag, and workspace-role reads, with mutation-side invalidation where role or feature-flag state changes.
- Add Hangfire concurrency guards and batch limits to recurring cleanup/digest jobs.

### Consequences
- Clients that need broad task, sprint, time-entry, intake, team, usage, or form datasets should page explicitly rather than relying on unbounded default results.
- Workspace stats remain sequential because parallelizing queries on the scoped EF Core `DbContext` would be unsafe without introducing separate contexts.
- Integration environments should apply the request-submission ordering-index migration before measuring intake-submission query performance.
