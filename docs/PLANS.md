# Plans

## Project SSOT And Production SaaS Conversion - IN PROGRESS

### Goal
Create a canonical engineering SSOT for the full repository, align repo-facing docs with the actual mixed frontend/backend codebase, and define the verified path from the current MVP system to a production-ready SaaS.

### Strategy
- Treat the repo as a mixed system instead of a frontend-only prototype.
- Use code and fresh verification evidence as the top truth source.
- Record current implemented behavior separately from planned target architecture.
- Treat the backend API as the future product-domain SSOT and the frontend in-memory store as temporary migration scaffolding.

### Milestones
1. Canonical SSOT and repo framing - DONE
   - Added `docs/project-ssot.md` as the canonical engineering SSOT.
   - Updated `README.md`, `AGENTS.md`, `CLAUDE.md`, and durable docs to reflect the mixed frontend/backend system.
   - Corrected stale frontend-only framing and overstatements about current state unification.
2. Frontend-to-backend runtime integration - IN PROGRESS
   - Auth pages, session refresh, workspace selection, API client wiring, TanStack Query, and SignalR clients are now shipped in the root runtime shell.
   - Dashboard, Board, Projects, Inbox, Calendar, Goals, Docs, Sprints, Reports, Time Tracking, Settings core panels, Automations, Intake, Templates, Portfolio, Timeline, and Workload are now live-hook or live-provider surfaces.
   - `AppDataProvider` has been removed from the runtime shell; the remaining work is deeper subfeature migration, richer contracts, and eventual cleanup of the legacy unused scaffolding file.
   - Board task-detail comments, checklist items, watchers, and attachments are now wired across frontend and backend source, and the board now consumes SignalR events for query invalidation.
   - Settings now includes a live OpenAI-compatible provider attachment flow, AI Copilot now uses persisted provider settings instead of local demo replies, and first-time provider setup defaults to enabled so attaching a provider turns AI on automatically.
   - A Playwright browser harness now covers auth redirect protection plus AI provider save/remove against the live frontend and API.
   - The full backend integration suite now passes end to end in this environment.
3. Product completion and SaaS hardening - PENDING
   - Move remaining partial modules to real backend data.
   - Close product gaps around broader browser E2E coverage, broader realtime behavior, deeper AI coverage, custom fields, recurring tasks, saved views, guest access, imports/exports, and mobile readiness.
   - Align auth, tenancy, RBAC, observability, CI/CD, deploy, backups, and production runbooks with the existing backend plans.

### Acceptance Criteria
- The repository has one canonical engineering SSOT under `docs/`.
- Repo-facing docs no longer describe the codebase as frontend-only.
- Current implemented behavior, planned target architecture, and gap-to-production work are clearly separated.
- Verification guidance for frontend and backend is explicit and current.
- Runtime migration progress is kept current as each feature surface moves from mock data to live backend contracts.

## Bootstrap Agentic Operating Model - COMPLETE

### Goal
Establish durable repo intelligence and a repeatable multi-agent workflow for this repository.

### Milestones
1. Baseline docs and metadata - DONE
   - Replaced stale app framing in `README.md` and `metadata.json`.
   - Added `AGENTS.md` with execution and verification policy.
   - Added architecture, decision log, and operating-model docs under `docs/`.
2. Codex project scaffolding - DONE
   - Added `.codex/config.toml`.
   - Added focused custom agents under `.codex/agents/`.
   - Added reusable skills under `.codex/skills/`.
   - Codex local-environment actions pending canonical Git clone.
3. Validation baseline - DONE
   - Lint blockers resolved.
   - `build` and `typecheck` pass.
   - Accepted lint debt limited to known raw `<img>` warnings.

---

## Linear Precision MVP Feature Expansion - COMPLETE

### Goal
Transform the original frontend prototype into a feature-rich, market-competitive PM SaaS MVP without changing the established design system.

### Strategy
- 5-wave execution: foundation, core features, new surfaces, UX hardening, documentation.
- Closest unified frontend store centered on `AppDataProvider`, with some state still remaining outside it.
- Functional UI with mock data for broad feature coverage.
- Aggressive subagent parallelism for disjoint module work.
- Serialized writes to shared surfaces.

### Wave 1: Foundation And Data Store - COMPLETE
**Milestone:** Centralized state management, dead-end fixes, module migrations.

- [x] Full product audit (12 screens, data architecture, UX flows)
- [x] Market benchmark (~135 features against Asana/Monday/ClickUp/Linear/Notion)
- [x] Master 5-wave plan created and approved
- [x] Unified AppDataProvider (`contexts/app-data-context.tsx`, ~817 lines)
  - 13 entity types with rich mock data
  - Full CRUD for all entities in that store
  - Cross-entity queries and computed metrics
- [x] Wired AppDataProvider into provider stack
- [x] Fixed all dead-end buttons (header, sidebar, dashboard)
- [x] Migrated 5 modules to AppData: board, projects, calendar, portfolio, goals
- [x] Fixed projects page (was missing Sidebar/Header)

### Wave 2: Core Feature Enhancements - COMPLETE
**Milestone:** Interactive detail panels, cross-cutting UX features.

- [x] Task detail rewrite (~640 lines): subtasks, checklists, comments, watchers, time tracking, duplication, type icons
- [x] Board enhancements: inline quick-add, bulk actions, selection checkboxes
- [x] Keyboard shortcuts: `hooks/use-keyboard-shortcuts.ts` with 16+ `g+X` sequences and action keys
- [x] Keyboard shortcuts dialog: `components/ui/keyboard-shortcuts-dialog.tsx`
- [x] Global shortcuts wrapper: `components/global-shortcuts.tsx`
- [x] Breadcrumbs: `components/ui/breadcrumbs.tsx` wired to all 17 pages
- [x] Enhanced detail panels: calendar (editable fields, delete), goals (child tree, linked projects), portfolio (budget visualization, milestones, delete)

### Wave 3: New Feature Surfaces - COMPLETE
**Milestone:** 5 new pages, onboarding wizard, sidebar expansion.

- [x] Sprint Planning (`/sprints`): sprint board, backlog, stats, create sprint
- [x] Automation Builder (`/automations`): rule cards, trigger/action flow, CRUD, filter tabs
- [x] Time Tracking (`/time-tracking`): timesheet grid, log time modal, team overview
- [x] Request Intake (`/intake`): form management, submissions, convert-to-task
- [x] Template Library (`/templates`): category filters, grid/list views, preview, use-template
- [x] Onboarding Wizard: 5-step guided flow, localStorage persistence, re-triggerable
- [x] Sidebar updated: 14 nav items (5 new)

### Wave 4: UX Hardening - COMPLETE
**Milestone:** Polish, save feedback, enhanced search.

- [x] Empty states added to 7 modules
- [x] Command palette rewrite: cross-entity search (tasks, projects, goals, initiatives, docs, people)
- [x] Settings save/reset UX with success feedback (durable persistence still pending)
- [x] Docs editor component
- [x] Reports date range filter
- [x] React Compiler lint fixes

### Wave 5: Documentation And Validation - COMPLETE
**Milestone:** Core docs updated and checks green.

- [x] Build passes (17 pages compile, 20 static pages)
- [x] Typecheck passes (zero errors)
- [x] Lint passes (zero errors, accepted `<img>` warnings only)
- [x] Architecture docs updated
- [x] Implementation roadmap updated
- [x] Feature coverage matrix updated (with implementation status column)
- [x] UX improvement log updated (37 improvements logged across 4 waves)
- [x] Decision log updated (6 decision entries)
- [x] Known risks updated (new risks added, mitigated risks noted)
- [x] `PLANS.md` updated

### Acceptance Criteria
- All 17 pages render and are navigable via sidebar and keyboard shortcuts.
- The main AppData-backed frontend modules provide CRUD for their core entities.
- Creation buttons, nav links, and primary action buttons are functional in the frontend MVP.
- Build, typecheck, and lint all pass.
- Documentation reflects actual implementation state.
- No design system changes (dark theme, Tailwind v4, Lucide icons preserved).

### Remaining Work (Post-Wave 5)
- Bulk actions for modules beyond board
- Advanced filter builder with save/share
- Custom fields on tasks/projects
- Recurring tasks
- Legacy scaffold cleanup plus the remaining board/settings deep-feature migrations
- Mobile optimization pass (touch, bottom nav, swipe)
- File attachments (requires backend)
- Real-time collaboration (requires backend)
- Authentication system (requires backend)
- Full test suite expansion (unit, integration, end-to-end)
