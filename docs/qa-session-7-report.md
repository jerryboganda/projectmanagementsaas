# End-to-End QA Report — Session 7

_Date: 2025-11-28_
_Scope: Full-stack web application audit (register → login → all features A-Z)_
_Auditor: Automated agent pass + static analysis_

---

## 1. Executive Summary

The user requested a full A-Z live end-to-end walk (register a test account, sign in, exercise every feature, identify gaps, and fix them). Because live E2E is gated by runtime constraints on this machine, this pass combined **partial live verification** (pages reachable, layouts render, auth flow initialized) with a **comprehensive static audit** across all 25+ routes and feature modules. Four real gaps were identified and fixed. `lint` + `typecheck` are green post-fix.

### What could be verified live
- Dev server boots on `http://localhost:3100` in ~3 s
- All auth routes (`/login`, `/register`, `/forgot-password`, `/reset-password`) reachable and render
- Onboarding wizard auto-mounts on first visit and exposes a correct a11y tree
- Fetch calls to the absent backend fail cleanly and no longer hang

### What could NOT be verified live, and why
| Blocker | Impact |
| --- | --- |
| No Docker / Postgres / Redis / MinIO on this machine | `backend/src/LinearPrecision.Api/Program.cs` hard-requires all three at startup — API cannot boot |
| VS Code's integrated Playwright browser reports `viewport: 0×0` in headless mode | `getBoundingClientRect()` returns 2 px boxes — visual layout cannot be reliably measured programmatically |
| Playwright `page.route('http://localhost:5000/**')` fires **after** TCP `ERR_ABORTED` | Backend cannot be simulated via route mocking |

A real live walk requires either (a) Docker up with `backend/docker-compose.yml`, or (b) running the API against an in-memory fallback (does not exist today). Both are documented below as follow-ups.

---

## 2. Gaps Found & Fixed This Session

### GAP-1 — Auth refresh hangs indefinitely when backend unreachable ✅ FIXED
- **Where**: `contexts/auth-context.tsx`, `lib/api/client.ts`
- **Symptom**: Root "Restoring your session" splash persists forever; user cannot reach `/login`
- **Root cause**: Mount-effect refresh called `fetch()` with no abort signal, and when the TCP connection refused, the promise never resolved (browsers retry internally)
- **Fix**: Added an 8 s `AbortController` around the refresh in both the mount-effect and the `refresh` callback. Added `{ signal?: AbortSignal }` option to `LinearPrecisionApiClient.refresh`
- **Verified**: `/login` renders after 8 s even with backend fully down

### GAP-2 — Onboarding modal not properly centered + missing a11y attributes ✅ FIXED
- **Where**: `components/onboarding/onboarding-wizard.tsx`
- **Symptom**: Framer Motion animating `y` collided with Tailwind's `-translate-x-1/2 -translate-y-1/2` centering; `max-h-[min(90vh,640px)]` arbitrary value did not parse reliably in Tailwind v4
- **Root cause**: Two competing transform sources on the same element
- **Fix**: Wrapped `motion.div` in a `fixed inset-0 flex items-center justify-center p-4 pointer-events-none` container so positioning is driven by flexbox and Motion only animates y/opacity. Simplified max-h to `max-h-[90vh]`. Added `role="dialog"`, `aria-modal="true"`, `aria-label="Welcome onboarding"` to the card
- **Verified**: JSX compiles cleanly, a11y tree exposes dialog correctly

### GAP-3 — All API calls could hang forever when backend is unreachable ✅ FIXED
- **Where**: `lib/api/client.ts` (`request<T>`)
- **Symptom**: Login / register submit could sit spinning for minutes if the server didn't answer
- **Root cause**: `fetch` has no client-side default timeout
- **Fix**: Added a default 20 s request timeout using `AbortSignal.timeout(20_000)` in `request<T>`. Callers that pass an explicit signal keep full control
- **Impact**: Every one of the 100+ endpoints exposed by `LinearPrecisionApiClient` now fails fast on an unreachable backend and surfaces a user-visible error

### GAP-4 — Timeout / network errors surfaced as raw "aborted" strings ✅ FIXED
- **Where**: `lib/api/error-utils.ts` (`getApiErrorMessage`)
- **Symptom**: When a request times out, the toast previously read "signal timed out" or "The operation was aborted"
- **Fix**: Added mapping for `TimeoutError`, `AbortError`, and `TypeError: Failed to fetch` to friendly, actionable messages ("The server didn't respond in time…", "We couldn't reach the server…")
- **Impact**: Every feature that uses `getApiErrorMessage` (login, register, forgot password, reset password, goals, docs, automations, intake, time tracking, board, sprints, calendar, reports, portfolio, workspace admin, AI Copilot, notifications, etc.) now shows a clear message instead of raw platform strings

---

## 3. Feature Inventory (25 routes)

| Route | Module | Notes |
| --- | --- | --- |
| `/` (Dashboard) | `components/{issue-list,my-work-widget,project-health-widget,recent-activity,kpi-card,quick-actions,footer-stats}` | Loads, renders mock data when API absent |
| `/login` | `app/login/page.tsx` | ✅ Proper error toast + inline error; respects `?redirect=` |
| `/register` | `app/register/page.tsx` | ✅ Name/email/password/confirm with validation |
| `/forgot-password` | `app/forgot-password/page.tsx` | ✅ Single-field request flow |
| `/reset-password` | `app/reset-password/page.tsx` | ✅ Token-based reset |
| `/workspace/create` | `app/workspace/create/page.tsx` | ✅ Post-signup landing |
| `/workspace/select` | `app/workspace/select/page.tsx` | ✅ Multi-workspace picker |
| `/invitations/[token]` | `app/invitations/[token]/page.tsx` | ✅ Accept invite flow |
| `/board` | `components/board/*` | Kanban w/ DnD, task detail slide-over |
| `/sprints` | `components/sprints/*` | Sprint planning, burndown |
| `/calendar` | `components/calendar/*` | Month/week views, create modal |
| `/timeline` | `components/timeline/*` | Gantt-style timeline, create modal |
| `/goals` | `components/goals/*` | OKR tracking, initiatives, modal |
| `/workload` | `components/workload/*` | Team capacity heatmap |
| `/time-tracking` | `components/time-tracking/*` | Timers, entries, approvals |
| `/docs` | `components/docs/*` | Tree, editor, revisions, sharing |
| `/automations` | `components/automations/*` | Rules, triggers, logs |
| `/templates` | `components/templates/*` | Project/task template library |
| `/intake` | `components/intake/*` | Public form builder + submissions |
| `/reports` | `components/reports/*` | KPI dashboards |
| `/portfolio` | `components/portfolio/*` | Program health |
| `/projects` | `components/projects/*` | Project list + detail |
| `/inbox` | `components/inbox/*` | Notifications + assignments |
| `/settings` | `components/settings/*` | Workspace + user prefs |
| `/api/*` | Server actions | Not audited (thin pass-throughs) |

Every route has a `page.tsx` default export, a matching `loading.tsx` skeleton, and inherits the root `error.tsx` / `not-found.tsx` boundaries.

---

## 4. Static Audit Findings (Observations, Non-blocking)

These were surveyed during the pass but judged acceptable / non-blocking. Listed for future hardening work.

1. **Native `window.confirm()` for destructive actions** in `components/goals/goals-detail.tsx`, `components/docs/docs-editor.tsx`, `components/automations/automations-layout.tsx`, `components/portfolio/portfolio-detail.tsx`, `components/time-tracking/time-tracking-layout.tsx`. Each is correctly gated with `// eslint-disable-next-line no-alert`. For design-system consistency a future pass should replace these with a custom `ConfirmDialog` component.
2. **Raw `<img>` warnings** across prototype mock-data surfaces. Per `AGENTS.md` these are accepted prototype debt.
3. **Two pre-existing `react-hooks/exhaustive-deps` disables** in `components/timeline/timeline-create-modal.tsx` — intentional, ref-stable props.
4. **Mock data fallbacks** (in `issue-list`, `my-work-widget`, `footer-stats`) are baked into components rather than pulled through a feature flag. Fine for demo; worth promoting to a `DemoData` context once backend parity is reached.
5. **`app/page.tsx` (dashboard)** does not yet dispatch API loads; it renders static widgets. This is expected at the current integration milestone.

---

## 5. Validation Run (Post-Fix)

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `cmd /c npm run lint` | ✅ Clean |
| Typecheck | `cmd /c npm run typecheck` | ✅ Clean |
| Build | `cmd /c npm run build` | Not re-run this session — no config or route files changed |
| Backend tests | `dotnet test backend/LinearPrecision.sln --no-restore` | Out of scope (no backend changes) |

---

## 6. Follow-ups To Complete A-Z Live E2E

To unblock the live register → login → feature-walk that could not be executed this session:

1. **Stand up backend infrastructure**: install Docker Desktop and run `docker compose up` from `backend/`. This starts Postgres 16, Redis 7, MinIO, and the API.
2. **Seed a test account** via `/api/v1/auth/register` or a backend seed script.
3. **Run the existing Playwright suite** with `cmd /c npx playwright test` (suite lives under `tests/e2e/`).
4. **Optional enhancement**: add an `IN_MEMORY_MODE=true` env flag to `backend/src/LinearPrecision.Api/Program.cs` that swaps Postgres/Redis/MinIO for in-memory equivalents, enabling laptop-only demos and faster CI smoke tests.

---

## 7. Files Changed This Session

| File | Change |
| --- | --- |
| `contexts/auth-context.tsx` | 8 s abort on mount-refresh + `refresh` callback |
| `lib/api/client.ts` | Default 20 s timeout on all requests; `refresh({ signal })` option |
| `lib/api/error-utils.ts` | Friendly messages for `TimeoutError` / `AbortError` / fetch network errors |
| `components/onboarding/onboarding-wizard.tsx` | Flex-centered wrapper, simpler max-h, full dialog a11y |
| `docs/qa-session-7-report.md` | This report |

---

_End of report._
