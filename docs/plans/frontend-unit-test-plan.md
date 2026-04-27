# Frontend Comprehensive Unit Test Plan

**Owner:** Sisyphus
**Scope:** `lib/`, `hooks/`, `contexts/`, `components/` (Next.js 15 + React 19 frontend)
**Depth:** Exhaustive — every branch, edge case, error path; property-based where useful
**Status:** **APPROVED — executing in phases**

## Locked decisions (user-approved)
1. `fast-check` **added** as devDependency for property-based tests.
2. Coverage thresholds become **hard CI floors after Phase 4** (target: 85% statements / 80% branches on `lib`, `hooks`, `components`).
3. Component scope: **prune ~10 trivial pure-presentational wrappers** with <3 branches and zero state. Specifically: `ui/skip-to-content`, `global-shortcuts`, plus any layout files that are 100% motion-decorated wrappers with no logic (decision per-file during Phase 4 by the implementing agent, justified inline in PR body).
4. Cadence: **checkpoint after Phase 0 and Phase 1**, then Phases 2–4 run continuously with QA gates between each.
5. Snapshot tests: **disallowed** (matches existing house style).

---

## 0. Why this plan exists

The user requested "comprehensive unit tests" across the entire frontend. Total testable surface is ~170 modules:

| Layer        | Files (testable)               | Existing coverage |
|--------------|--------------------------------|-------------------|
| `lib/`       | ~27 (after skipping pure DTOs) | 6 files done      |
| `hooks/`     | 18                             | 0                 |
| `contexts/`  | 3 (1 is a serialized chokepoint) | 0               |
| `components/`| ~106                           | 0                 |

Generating "all the tests" in one shot would produce templated slop. This plan **phases the work**, defines the **house style**, fixes **infra gaps first**, then delegates per-bucket so the implementing agents have concrete checklists rather than vague "write tests" prompts.

---

## 1. House style (locked) — all new tests MUST follow

Derived from the 6 existing tests + `vitest.config.ts` + `vitest.setup.ts`.

- **Runner:** Vitest, jsdom, `globals: true` — but **still import `describe/it/expect` explicitly** (matches existing files).
- **Co-location:** `foo.test.ts(x)` lives next to `foo.ts(x)`. Never under a separate `__tests__/`.
- **Hierarchy:** One top-level `describe()` per unit. Avoid nested `describe` unless splitting genuinely independent concerns.
- **Naming:** Behavior-first, present-tense, lowercase. `"returns null when input is empty"`, `"rejects with ApiError on 422"`. **Never** `"should ..."`.
- **Assertions (preferred):** `toBe`, `toEqual`, `toMatchObject`, `toContain`, `toMatch`, `toBeInstanceOf`, `toBeNull`, `toBeUndefined`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith`, `toThrow`. Avoid snapshot tests.
- **Mocking:** Prefer `vi.fn()` + dependency injection. Use `vi.mock(...)` only at module-level for hard ESM boundaries (e.g., `next/navigation`, `@microsoft/signalr`, `motion/react`). Use `vi.spyOn` for surgical interception. **Avoid `vi.mock` of in-repo modules where pure-fn unit tests can do the job.**
- **Cleanup:** `beforeEach`/`afterEach` only when state needs resetting (timers, env, globals, query cache).
- **Type safety:** No `as any`, no `@ts-ignore`. Tests are TS-strict like the rest of the repo.
- **One assertion focus per `it`** (multiple `expect`s OK; one logical claim).
- **Imports:** Use `@/...` alias matching production code.

---

## 2. Infra gaps — Phase 0 (must land before component tests)

`vitest.setup.ts` is currently 1 line. Component testing will fail without polyfills. **Add these in a single setup PR before any `components/` test is written.**

### 2.1 `vitest.setup.ts` additions

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom polyfills required by recharts, motion, modals, command palette
class ResizeObserverMock { observe(){} unobserve(){} disconnect(){} }
class IntersectionObserverMock { observe(){} unobserve(){} disconnect(){} takeRecords(){return [];} root = null; rootMargin = ""; thresholds = []; }
vi.stubGlobal("ResizeObserver", ResizeObserverMock);
vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

if (!window.matchMedia) {
  window.matchMedia = (q: string) => ({
    matches: false, media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
}

// scrollTo / scrollIntoView shims (modal/keyboard-shortcuts/command-palette)
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
```

### 2.2 New shared test-utility files (root-level `test-utils/`)

| File | Purpose |
|------|---------|
| `test-utils/render.tsx` | `renderWithProviders(ui, { queryClient?, authState?, workspaceState?, route? })` wrapping QueryClientProvider, AuthContext, WorkspaceContext, MotionProvider as needed. |
| `test-utils/query-client.ts` | `createTestQueryClient()` — retries `false`, gcTime `Infinity`, no refetch on mount/window. |
| `test-utils/fetch.ts` | `mockFetchResponse(body, init?)`, `mockFetchSequence([...])`, `expectFetchCalled(url, init?)`. Implemented via `vi.spyOn(globalThis, "fetch")`. |
| `test-utils/signalr.ts` | `vi.mock("@microsoft/signalr")` factory exposing a controllable `HubConnection` stub with `start/stop/on/off/invoke/state` + helpers to push events. |
| `test-utils/motion.ts` | `vi.mock("motion/react")` lightweight pass-through (renders `motion.div` as `div`, `AnimatePresence` as `Fragment`, ignores variants). |
| `test-utils/dnd.ts` | Helpers for `@hello-pangea/dnd` — wrap component in `DragDropContext` and a no-op `Droppable`/`Draggable` stub for unit-level coverage. |
| `test-utils/next-navigation.ts` | `vi.mock("next/navigation")` returning a controllable `useRouter`/`usePathname`/`useSearchParams`. |
| `test-utils/factories.ts` | Typed factories: `makeTask()`, `makeProject()`, `makeGoal()`, `makeUser()`, `makeWorkspace()` etc. — saves boilerplate. |

> These utilities are **the foundation for every component/hook test**. Building them once costs ~1 file per util; not building them creates per-test mock duplication = slop.

### 2.3 vitest.config.ts addition (none required)

Coverage include/exclude already correct. We may later raise coverage thresholds; out of scope for this plan.

---

## 3. Tier system

Each module gets a tier driven by complexity (from inventory). Tiers determine **minimum** test counts (exhaustive depth = always cover all branches; tier sets the floor):

| Tier | Min cases | When |
|------|-----------|------|
| **S** (smoke)      | 3–5   | Constants, type-only with single branch, trivial wrappers |
| **M** (medium)     | 6–12  | Pure helpers with 5–15 branches, simple components, simple hooks |
| **L** (large)      | 13–25 | Container components, react-query hooks with mutations, recursive logic |
| **XL** (exhaustive)| 25+   | Auth flows, recursive tree builders, time-tracking, optimistic mutations, drag-and-drop boards |

**Property-based testing** (via `fast-check`, NOT yet installed — flag for Phase 0) applies to:
- Recursive transforms: `lib/portfolio/types.ts` tree builders, `goals` tree, `timeline` recursive items.
- Pure normalizers: `automations` duration/timestamp parsing, `goals/data.ts` status normalization.
- ID/key generation utilities.

**Decision needed:** add `fast-check` as devDep? Recommend yes. (Defer if user says no — fall back to enumerated edge-case tables.)

---

## 4. Untestable / out-of-scope (justified skips)

These are **intentionally excluded** from this plan:

1. **Pure DTO/type modules** (`lib/api/contracts/*` except `auth.ts`, `lib/dashboard/types.ts`, `lib/api/contracts.ts` barrel, `lib/motion/tokens.ts`, `lib/motion/index.ts`) — no runtime logic, only type aliases. Testing returns no signal.
2. **`*/data.ts` mock fixtures** — explicitly excluded by `vitest.config.ts` coverage. Only export literals.
3. **`lib/motion/provider.tsx`** — thin `MotionConfig` wrapper, behavior owned by `motion` library. Smoke test only.
4. **Pure motion-decorated wrapper components with zero logic** (a handful in inventory) — visual-only; covered by E2E + the motion mock pass-through.
5. **`contexts/inbox-context.tsx`** — listed as a serialized-write chokepoint in `AGENTS.md`. **In scope for testing**, but tests will be additive to a single new file `inbox-context.test.tsx`; **no edits to the source file**.
6. **Charts (recharts surfaces)** — recharts in jsdom is unstable. We test **the data shaping** that feeds charts (selectors / memoized derivations) and the surrounding controls; the chart SVG itself is asserted only at the structural level (rendered, has expected `<title>` / role).
7. **Drag-and-drop (`@hello-pangea/dnd`)** — full DnD is jsdom-hostile. We test:
   - The `onDragEnd` handler in isolation (pure-fn extraction or via the prop-passed callback).
   - That draggables render with correct content.
   - Skip simulated drag interactions (covered by E2E `tests/e2e/board.spec.ts`).

---

## 5. Phased execution

Each phase is a **delegation unit**. After each phase: run lint + typecheck + `npm test`. Stop and surface failures before proceeding.

### Phase 0 — Test infrastructure (1 delegation, `frontend-owner`)
- Land all of §2 (setup polyfills, shared utilities, `fast-check` devDep if approved).
- Verify `npm test` still passes (existing 6 test files).
- **Acceptance:** all 6 existing tests still green; new utilities exported and type-clean; `npm run typecheck` clean.

### Phase 1 — `lib/` exhaustive coverage (1 delegation)
**Targets** (≈10 new test files, the rest are constant DTOs):

| File | Tier | Key cases |
|------|------|-----------|
| `lib/api/error-utils.ts` | M | ApiError with field-error payload variants, missing payload, network/timeout/abort message normalization, non-ApiError fallthrough, message defaults. |
| `lib/api/presigned-upload.ts` | M | Successful PUT, custom content-type header, missing content-type fallback, non-OK with text body, non-OK without text body, fetch rejection. Mock `globalThis.fetch`. |
| `lib/api/contracts/auth.ts` (`isMfaChallenge`) | S | Truthy MFA shape, missing `challengeId`, missing `methods`, null, undefined, object missing both fields. |
| `lib/portfolio/types.ts` | XL | All converters (`toPortfolioInitiative`, `toPortfolioGoalItem`), tree build with 0/1/N goals, multi-level nesting, orphaned `parentId` (graceful), cycle defense, `flatten` order, `find` hit/miss across depth, status/type/progress-source `toApi` enum mapping (every value), `toCreate*Request`/`toUpdate*Request` trimming + null-vs-undefined semantics, missing project/owner fallbacks. **Property-based:** `flatten ∘ build` length invariant on random tree shapes. |
| `lib/automations/types.ts` | L | `toAutomationSurfaceItem` / `toAutomationSurfaceLog` with full/partial inputs, `stringifyAutomationDocument` with non-object/null/array, `summarizeAutomationDocument` branches (zero/single/multiple entries, depth limits), `previewAutomationDocumentEntries` truncation, `formatAutomationTimestamp` invalid date, `formatAutomationDateTime` locale stability, `formatAutomationDuration` for ms / s / m / h / negative / NaN / overflow. |

**Acceptance:** ≥95% line coverage on the targeted files; all branches hit per `--coverage`; lint/typecheck/test green.

### Phase 2 — `hooks/` exhaustive coverage (2 delegations, split for context budget)

**Phase 2a — Non-network hooks (`frontend-owner`):**
- `hooks/use-keyboard-shortcuts.ts` (S→M): listener attach/detach on mount/unmount; modifier-key combinations; ignored when target is `input`/`textarea`/contenteditable; `g` sequence timeout reset; `next/navigation` push routing per shortcut; multiple registrations idempotency. Mock `next/navigation` + use `userEvent.keyboard`.
- `hooks/use-intake-data.ts` (M): mock-driven async transitions, conversion guards, timeout-based status changes (fake timers), random task-id determinism (`vi.spyOn(Math, "random")`).

**Phase 2b — react-query hooks (`frontend-owner`, ~16 files):**
For each `use-*-data.ts` hook, per file:
1. Renders without auth → returns disabled/empty state, no fetch.
2. Renders with auth → calls expected `apiClient.*` methods with correct args.
3. Mutation success → cache update / invalidation observed via `queryClient.getQueryData`.
4. Mutation failure → error surfaces; cache rollback if optimistic.
5. Pagination / windowing branches (where applicable: `use-calendar-data`, `use-time-tracking-data`, `use-reports-data`).
6. Optimistic update branches (`use-projects-data` favorite toggle, `use-board-data` task moves, `use-automations-data` toggle).
7. Selector / derived-state correctness (e.g., `use-dashboard-data` due-label math, `use-portfolio-data` tree).
8. `signalR` event handlers in `use-board-data` — push events through the mock connection, assert invalidation (debounced; advance timers).
9. Realtime cleanup on unmount (`use-board-data`).
10. CSV export flow (`use-time-tracking-data`, `use-workload-data`) — assert Blob created, `URL.createObjectURL` called, `<a>.click()` invoked. `localStorage` persistence (`use-documents-data`) — assert reads + writes; bad JSON → fallback.

**Mock pattern:** per-test `vi.spyOn(apiClient, "...")` returning a typed stub. `renderHook` from `@testing-library/react` wrapped in `renderWithProviders`.

**Acceptance:** every public-exported function from each hook has at least: success path, error path, edge case (empty/null), and (where applicable) cache-mutation assertion. ≥90% line coverage on `hooks/**`.

### Phase 3 — `contexts/` exhaustive coverage (1 delegation)
- `contexts/app-data-context.tsx` (L): provider mount, every action/dispatch, derived selectors, context-not-found error.
- `contexts/sidebar-context.tsx` (M): toggle/open/close, persistence (if any), collapse breakpoints.
- `contexts/inbox-context.tsx` (L): **READ-ONLY** to source. All filter/select/mark-read/archive/done state transitions, derived counters (unread, by-filter), bulk operations, idempotency.
- Plus contexts found in the larger inventory tail (auth-context, workspace-context, realtime-context, toast-context, announcer-context, confirm-context, command-palette-context, ai-copilot-context) — same pattern: provider mount, every reducer/dispatch, hook-without-provider error.

### Phase 4 — `components/` exhaustive coverage (split into 4 delegations by bucket)

We do not write 106 component test files in one go. Split:

**Phase 4a — Pure presentational (≈20 files, `frontend-owner`):**
- `auth/auth-shell`, `auth/auth-error-fallback`, `error-boundary`, `kpi-card`, `quick-actions`, `recent-activity`, `my-work-widget`, `project-health-widget`, `issue-list`, `footer-stats`, `ui/empty-state`, `ui/form-field`, `ui/breadcrumbs`, `ui/skip-to-content`, `goals/goals-summary`, `portfolio/portfolio-summary`, `portfolio/portfolio-toolbar`, `projects/projects-toolbar`, `timeline/timeline-toolbar`, `calendar/calendar-toolbar`, `board/board-toolbar`, `goals/goals-toolbar`.
- Per file: render with default props, render with each prop variant (loading, empty, populated), conditional renders (every `&&` / ternary), prop-callback invocation via `userEvent`, accessibility (role, name, label).

**Phase 4b — Modals + forms (≈25 files):**
- `*/create-*-modal.tsx`, `auth/*` form panels, `settings/*-panel.tsx`, `portfolio/*-detail.tsx`, `projects/project-detail.tsx`, `board/create-task-modal`, `board/task-detail`, `calendar/create-event-modal`, `calendar/calendar-detail`, `goals/*`, `timeline/timeline-create-modal`, `timeline/timeline-detail`, `inbox/inbox-detail`, `inbox/inbox-list`, `workload/workload-detail`, `workload/workload-toolbar`.
- Per file: open/close, all field validation paths, submit success → callback called with normalized payload, submit failure (when async) → error displayed, cancel/escape, optimistic state (where applicable).

**Phase 4c — Layouts + surfaces (≈30 files):**
- All `*-layout.tsx`, `*-surface.tsx`, `*-grid.tsx`, `*-list.tsx`, `*-sidebar.tsx`.
- Per file: render with mock data set (loading/empty/populated/error), every conditional branch, search/filter/groupBy state changes, item selection callbacks, keyboard nav (where applicable).

**Phase 4d — Specialized (≈30 files):**
- DnD-bearing (`board-column`, `board-surface`, `sprints-layout`): `onDragEnd` extraction tests + render-only.
- Charts (`reports-*`, `time-tracking-layout`): structural assertions + selector/data-shaping logic.
- Header/sidebar (serialized chokepoint files): **test files only**, no source edits. Test rendering with each context state, navigation calls, sidebar collapse, header search/new-item callbacks.
- Providers (`ai-copilot-provider`, `command-palette-provider`): provider state machine, hook-without-provider error.
- `ui/toast`, `ui/modal`, `ui/keyboard-shortcuts-dialog`, `ui/command-palette`, `ui/announcer`, `ui/confirm-dialog`: full lifecycle + a11y (focus trap, escape, role).

**Acceptance for entire Phase 4:** every component file has a `.test.tsx` peer; coverage ≥85% statements / ≥80% branches on `components/**`.

---

## 6. Validation gates (after each phase)

```
cmd /c npm run lint
cmd /c npm run typecheck
cmd /c npm test
cmd /c npm test -- --coverage   # at end of each phase
```

Phase is **not done** until: zero lint errors, zero TS errors, all tests green, coverage delta confirmed for the phase's targeted files.

---

## 7. Risks / known-hard items

| Risk | Mitigation |
|------|-----------|
| `motion/react` ESM + jsdom timing | Module mock to plain DOM elements (`test-utils/motion.ts`). Don't assert on animations. |
| `@hello-pangea/dnd` in jsdom | Test handlers in isolation; rely on E2E for interactive drag. |
| `recharts` ResizeObserver | Polyfill in setup. Assert structure not pixels. |
| `@microsoft/signalr` | Module-mocked stub connection. Drive events synchronously. |
| `next/navigation` in client components | Module-mocked router/pathname/search. |
| Optimistic mutation flakiness | Use `waitFor` with explicit cache assertions; do not assert on intermediate states. |
| Test count explosion | Tier system caps minimums; exhaustive depth handled per-branch via inventory checklists. |
| Serialized chokepoint files (`header.tsx`, `sidebar.tsx`, `inbox-context.tsx`) | Add tests only; no edits. Single delegation owner per file at any time. |

---

## 8. Estimated output

| Phase | New files | Approx LOC |
|-------|-----------|-----------|
| 0     | 8 utilities + setup edits | ~400 |
| 1     | ~10 test files | ~1500 |
| 2a    | 2 test files | ~400 |
| 2b    | 16 test files | ~3500 |
| 3     | ~10 test files | ~1500 |
| 4a    | ~22 test files | ~2000 |
| 4b    | ~25 test files | ~3000 |
| 4c    | ~30 test files | ~3500 |
| 4d    | ~30 test files | ~3500 |
| **Total** | **~155 test files + 8 utilities** | **~19,300 LOC** |

This will take multiple delegated agent runs (each phase = 1 delegation; Phases 2 and 4 split further). Total wall-clock: large.

---

## 9. Open decisions for the user

1. **Add `fast-check` (property-based testing) as devDep?** Recommended yes for §3 targets. Adds ~1 dep.
2. **Coverage thresholds** — set hard floors in `vitest.config.ts` after Phase 4 (e.g., 85/80 statements/branches)? Or leave informational.
3. **Snapshot tests** — confirmed disallowed (matches existing style). Confirm.
4. **Should I proceed phase-by-phase with your review between phases, or run all phases back-to-back?** Recommend phase-by-phase with a checkpoint after Phase 0 (infra) and Phase 1 (lib), then back-to-back for hooks/contexts/components.
5. **Component test scope hardline** — do you want me to actually test all ~106 components, or prune the inventory further (e.g., skip every "pure-presentational with <3 branches" — drops ~10 trivial files)?

---

## 10. What happens after approval

On user "go":
1. Fire `frontend-owner` (Phase 0) with a precise prompt (tasks, must-do, must-not-do, file list, acceptance criteria).
2. After Phase 0 completes + validation passes, fire Phase 1.
3. Continue per §5 with QA validation between phases.
4. Update this plan file as phases complete (mark done, capture deviations).

No test code is written until you approve this plan.
