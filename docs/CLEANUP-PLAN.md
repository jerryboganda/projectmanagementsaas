# Safe Cleanup Plan — Project Management SaaS

**Audit date:** 2026-04-26
**Scope:** Full repo (Next.js frontend + ASP.NET Core backend + Capacitor mobile)
**Status:** Plan only — **no deletions performed**. Awaiting user approval.

---

## 0. Executive Summary

| Metric                              | Before  | After (est.) | Delta       |
| ----------------------------------- | ------- | ------------ | ----------- |
| Tracked source files                | ~876    | ~853         | **−23**     |
| Dead-code LOC (frontend + backend)  | ~2,204  | ~0           | **−2,204**  |
| Unused npm deps in `mobile/`        | 5       | 0            | **−5**      |
| Root binary/log artifacts (~6.7 MB) | 4 files | 0            | **−6.7 MB** |
| Stale ESLint configs                | 2       | 1            | **−1**      |
| Working-tree files deleted vs HEAD  | 43      | 0            | **−43**     |

**The single biggest issue is not dead code — it is repo state.** 43 tracked files (including `package.json`, `tsconfig.json`, `package-lock.json`, `playwright.config.ts`, `postcss.config.mjs`, `README.md`, `tests/e2e/`, the entire `_archived_Mobile_App/`) are deleted from the working tree but still tracked in git. The frontend toolchain is currently **unrunnable** (`npm run lint`, `build`, `typecheck` all ENOENT) until this is resolved.

**Recommended order:** Tier 0 (repo recovery) → Tier 4 (hygiene) → Tier 1 (high-confidence dead code) → Tier 2 (barrel-only / context cleanup) → Tier 3 (manual-review). Validate after each tier.

---

## 1. Methodology & Confidence Bands

- **HIGH** — Direct grep across `*.ts,*.tsx,*.cs` (excluding `node_modules`, `.next`, `bin`, `obj`) shows **zero references** outside the file itself (and outside trivial test/barrel re-exports).
- **MEDIUM** — Referenced only by a barrel that itself has zero importers, OR referenced only by tests.
- **LOW** — Plausibly dead but at risk from DI registration, EF reflection, MediatR scanning, dynamic imports, or string-based references. **Manual review required.**

Tools used: PowerShell `Get-ChildItem`, `git ls-files`, `git status`, ripgrep-style `grep`, plus two background `explore` subagents (one frontend, one backend) whose findings were cross-validated against direct grep evidence.

**Limitations:**

- Frontend `lint`/`typecheck` could not be run because root `package.json` is deleted from the working tree. Tier 0 must complete before automated dead-export detection (e.g., `ts-prune`, `knip`) can corroborate findings.
- Backend `dotnet test` was not run; backend deletion claims rest on grep + DI-registration audit only.

---

## 2. Tier 0 — Repo Recovery (BLOCKING; do this first)

The working tree has 43 tracked files marked deleted (`git status` shows `D`). They still exist in `HEAD`.

### Action

```powershell
# Inspect what would be restored
git status --short | Select-String "^ D "

# Restore everything that was deleted but is still tracked
git restore --source=HEAD --staged --worktree -- $(git ls-files --deleted)
```

**Notable files this restores:**

- `package.json`, `package-lock.json`, `tsconfig.json` — frontend toolchain
- `postcss.config.mjs`, `playwright.config.ts` — build/test config
- `README.md`, `docs/PLANS.md` (if previously tracked)
- `tests/e2e/*.spec.ts` — Playwright E2E suite
- `_archived_Mobile_App/**` — already-archived old mobile app (43 files)
- `pm-{backend,frontend,fullstack,lead}.agent.md` — legacy agent docs

### Decision gate (ask user)

After restoring, decide per group:

1. **Keep** — `package.json`, `tsconfig.json`, `package-lock.json`, `postcss.config.mjs`, `playwright.config.ts`, `README.md`, `tests/e2e/`. **These are required.**
2. **Delete intentionally** (commit the deletion) — `_archived_Mobile_App/` (already redundant with `mobile/`), `pm-*.agent.md` (superseded by `.codex/agents/`), `playwright-report/`, `test-results/`.

**Verification after Tier 0:**

```powershell
cmd /c npm ci
cmd /c npm run lint
cmd /c npm run typecheck
cmd /c npm run build
```

All four must succeed before proceeding.

---

## 3. Tier 1 — HIGH-Confidence Dead Code (safe to delete)

Every item below has **zero external references** confirmed by grep across the full source tree. Deletion is reversible via git.

### 3.1 Frontend — Unused utility files (delete entire file)

| File                                | LOC | Evidence                                  |
| ----------------------------------- | --: | ----------------------------------------- |
| `components/file-upload.tsx`        | 123 | Only self-reference; no `FileUpload` importer |
| `lib/security/rate-limiter.ts`      |  68 | No external import                        |
| `lib/security/csrf.ts`              |  38 | No external import                        |
| `lib/security/sanitize.ts`          |  85 | No external import                        |
| `lib/performance/web-vitals.ts`     | 191 | No external import                        |
| `lib/performance/prefetch.ts`       |  66 | No external import                        |
| `lib/validation/index.ts`           |  66 | No external import                        |
| `lib/api/query-keys.ts`             |  90 | `queryKeys` only appears in this file     |
| `lib/api/retry.ts`                  |  57 | `withRetry` only appears in this file     |
| `lib/motion/primitives.tsx`         | 111 | `Fade`, `FadeUp`, `PopIn`, `Stagger` unused |
| **Subtotal**                        | **895** | |

### 3.2 Frontend — Re-export-only data files (delete file)

| File                                | LOC | Evidence                                  |
| ----------------------------------- | --: | ----------------------------------------- |
| `components/portfolio/data.ts`      |  13 | Pure re-export barrel; no importers       |
| `components/projects/data.ts`       |   2 | Pure re-export; no importers              |
| `components/settings/data.ts`       |  88 | No importers                              |
| **Subtotal**                        | **103** | |

### 3.3 Backend — Unused contract

| File                                                        | LOC | Evidence                       |
| ----------------------------------------------------------- | --: | ------------------------------ |
| `backend/src/LinearPrecision.Shared/Contracts/ISearchService.cs` |  15 | Zero implementations / DI registrations / consumers |

### 3.4 Root — Build artifacts and binaries (untrack and gitignore)

| File                          | Size       | Action                                   |
| ----------------------------- | ---------- | ---------------------------------------- |
| `LinearPrecision-debug.apk`   | 6.7 MB     | Delete + add `*.apk` to `.gitignore`     |
| `build.log`                   | 0.5 KB     | Delete + add `*.log` to `.gitignore`     |
| `build-output.log`            | 2.9 KB     | Delete                                   |
| `debug.log`                   | 0.6 KB     | Delete                                   |

**Tier 1 total: ~1,013 LOC + ~6.7 MB binary removed.**

### Verification after Tier 1

```powershell
cmd /c npm run lint
cmd /c npm run typecheck
cmd /c npm run build
dotnet build backend/LinearPrecision.sln
dotnet test backend/LinearPrecision.sln --no-restore
```

---

## 4. Tier 2 — Barrel & Stale Provider Cleanup

These deletions are safe **only** because the barrels themselves have zero importers. Verify with `grep "from ['\"]@/hooks['\"]"` and `grep "from ['\"]@/components/ui['\"]"` (both currently return zero matches).

### 4.1 `hooks/index.ts` barrel + barrel-only hooks

The barrel `hooks/index.ts` (28 LOC) re-exports many hooks but has **zero importers**. Each individual hook below is also imported via the barrel only — direct imports are zero across the codebase.

| File                              | LOC | Notes                          |
| --------------------------------- | --: | ------------------------------ |
| `hooks/index.ts`                  |  28 | Delete the barrel              |
| `hooks/use-virtual-list.ts`       |  82 | Only barrel-referenced         |
| `hooks/use-focus-trap.ts`         |  61 | Only barrel-referenced         |
| `hooks/use-keyboard-navigation.ts`| 139 | Only barrel-referenced         |
| `hooks/use-debounced-value.ts`    |  41 | Only barrel-referenced         |
| `hooks/use-intersection-observer.ts` | 69 | Only barrel-referenced       |
| `hooks/use-on-click-outside.ts`   |  28 | Only barrel-referenced         |
| **Subtotal**                      | **448** | |

> **Caveat:** Hooks like `useDebouncedValue` and `useIntersectionObserver` are common candidates for future use. Confirm with the user whether to **delete** or **keep for future** before executing.

### 4.2 `components/ui/index.ts` barrel

| File                              | LOC | Notes                          |
| --------------------------------- | --: | ------------------------------ |
| `components/ui/index.ts`          |  29 | Zero importers; individual `components/ui/*.tsx` files imported directly |

### 4.3 Stale context: `contexts/app-data-context.tsx` (714 LOC)

`AppDataProvider` and `useAppData` have zero references outside this file. The active providers in use are in `contexts/inbox-context.tsx` and `contexts/sidebar-context.tsx`. This is a legacy mock-data provider replaced by the TanStack Query hooks.

> **High-impact deletion (714 LOC).** Recommend: confirm with user, then delete file. After deletion, run `npm run typecheck` to catch any forgotten references.

**Tier 2 total: ~1,191 LOC removed.**

---

## 5. Tier 3 — Manual-Review Bucket (do NOT auto-delete)

These were flagged by the explore agent but require human judgment because of risk vectors (DI, reflection, future use, generic names producing grep noise).

### 5.1 Unused exports inside still-used files

The frontend explore agent flagged ~50 high-confidence unused **exports** (types, helper consts, mapper functions) embedded in files that ARE still imported. Examples:

- `components/board/types.ts`: `BoardTaskType`, `findProjectName`
- `components/calendar/data.ts`: `CALENDAR_ITEM_TYPES`
- `components/docs/data.ts`: `DocsDocument`, `DOCUMENTS_FEATURES`, `getDocumentStatusTone`, `toDocumentSearchText`
- `components/goals/data.ts`: `GoalLinkProjectInput`, `GoalSurfaceInitiative`, `GoalSurfaceOwner`, `GoalSurfaceProgressSource`, `GoalSurfaceProject`, `toGoalSurfaceInitiative`
- `components/inbox/data.ts`: `InboxItemType`
- `components/intake/data.ts`: `mapIntakeForm`, `mapIntakeSubmission`, `MockMember`, `MockProject`, `normalizeSubmissionStatus`
- `components/reports/data.ts`: `PlannedReportCatalogItem`, `ReportCategory`, `TrendDirection`, `TrendSentiment`
- `components/timeline/data.ts`: `TIMELINE_SOURCE_LABELS`, `TimelineSourceType`, `TimelineZoomLevel`
- `components/workload/data.ts`: `WORKLOAD_FEATURES`, `isTaskOverdue`
- `hooks/use-board-data.ts`: `BoardCreateTaskInput`
- `hooks/use-calendar-data.ts`: `calendarItemTypeOptions`, `CalendarProjectOption`, `CalendarSurfaceItem`, `CalendarSurfaceItemType`, `CalendarTaskOption`, `CalendarUpsertInput`
- `hooks/use-goals-data.ts`: `goalsListQueryKey`, `goalDetailQueryKey`
- `hooks/use-projects-data.ts`: `projectDetailQueryKey`
- `hooks/use-sprints-data.ts`: `SprintAssignee`
- `hooks/use-teams-data.ts`: `teamsListQueryKey`
- `hooks/use-time-tracking-data.ts`: `ComputedStats`, `TimeEntryCreateInput`, `TimeEntryUpdateInput`, `TimerData`, `TimerState`, `TimeTrackingProject`, `TimeTrackingTask`, `TimeTrackingUser`
- `lib/api/client.ts`: `AIConversationWithMessagesResponse`, `CreateAIConversationRequest`, `CreateChecklistItemRequest`, `CreateTaskCommentRequest`, `SendAIMessageRequest`, `UpdateAIProviderSettingsRequest`
- `lib/api/contracts.ts`: `GoalUserBrief`, `IntakeFormSchema`, `IntakeSubmissionStatus`, `InvitationStatus`, `TimeEntryUserBrief`
- `lib/api/error-utils.ts`: `getApiFieldErrors`
- `lib/motion/tokens.ts`: `sheetSideVariants`
- `lib/portfolio/types.ts`: `portfolioGoalStatusToApi`, `portfolioGoalTypeToApi`, `portfolioInitiativeStatusToApi`, `portfolioProgressSourceToApi`, `PortfolioOwner`, `PortfolioProject`, `toPortfolioInitiative`
- `lib/projects/types.ts`: `ProjectSurfaceHealth`, `toApiProjectStatus`
- `lib/templates/types.ts`: `TemplateCategory`, `TemplateTask`

> **Recommendation:** After Tier 0 restores `package.json`, run `npx knip` (or `npx ts-prune`) for tool-corroborated detection. Delete only items confirmed by both grep AND knip. Several mapper functions (`toApiProjectStatus`, `portfolio*ToApi`) may be intentionally kept for future write-API wiring — confirm with user.

### 5.2 Spot-check unused imports

- `components/portfolio/portfolio-detail.tsx` — `Image` from `next/image` imported but never rendered. Single-line edit.

### 5.3 Mobile (`mobile/package.json`) — unused dependencies

The frontend explore agent found these have zero `import` hits across the repo. **Verify in `mobile/` only**, not the root frontend:

- `@capacitor/android`, `@capacitor/ios` — likely **kept intentionally** (Capacitor needs them at build time for native platforms; not imported in JS).
- `@capacitor/filesystem` — verify; if no plugin usage, remove.
- `class-variance-authority` — likely safe to remove if no `cva()` calls.
- `idb` — verify; if no IndexedDB usage, remove.

> **Recommendation:** Run `cd mobile && npx depcheck`. Do NOT remove `@capacitor/android` or `@capacitor/ios` without consulting the mobile build config (`capacitor.config.ts`).

### 5.4 Generic-name helpers (excluded from auto-delete)

- `lib/format/index.ts`
- `lib/utils.ts`

These have generic exports (`cn`, `formatDate`, etc.) where bare grep is unreliable. Manual review only.

### 5.5 Backend LOW-confidence (DI / reflection risk)

Any backend class flagged "no direct usage" must be cross-checked against:

- `backend/src/LinearPrecision.Api/Program.cs` (DI registrations)
- Module `*Module.cs` files (`AddXxxModule` extension methods)
- EF Core `DbContext` (entity configurations may keep types alive via reflection)
- MediatR / FluentValidation auto-discovery

`ISearchService` (Tier 1.3) was confirmed safe because nothing in `Program.cs` or any `*Module.cs` registers it. **Apply the same audit to any future backend deletion candidate.**

---

## 6. Tier 4 — Project Hygiene

### 6.1 ESLint config conflict

- `.eslintrc.json` is a **0-byte legacy file** (`{ "extends": "next" }`) that conflicts with the modern flat config in `eslint.config.mjs`.
- **Action:** Delete `.eslintrc.json`.

### 6.2 `.gitignore` additions

Append:

```
# Build artifacts
*.log
*.apk
.next/
playwright-report/
test-results/
```

### 6.3 Mobile

If Tier 5.3 confirms unused deps, run `npm uninstall` in `mobile/` for the confirmed-dead set.

---

## 7. Execution Checklist (recommended order)

```text
[ ] Tier 0: git restore deleted files; user decides keep/delete per group
[ ] npm ci && lint && typecheck && build (must all pass before proceeding)
[ ] Tier 4: delete .eslintrc.json; update .gitignore
[ ] Tier 1.4: rm root logs + .apk
[ ] Tier 1.1 + 1.2: delete confirmed-dead frontend files
[ ] Tier 1.3: delete ISearchService.cs
[ ] Re-run lint + typecheck + build + dotnet test
[ ] Tier 2.3 (with user confirm): delete contexts/app-data-context.tsx
[ ] Tier 2.1 + 2.2 (with user confirm): delete hooks barrel + ui barrel + barrel-only hooks
[ ] Re-run lint + typecheck + build
[ ] Tier 3: run `npx knip` and `cd mobile && npx depcheck`; review with user
[ ] Single git commit per tier with descriptive message
```

---

## 8. Risk Register

| Risk                                              | Mitigation                                                |
| ------------------------------------------------- | --------------------------------------------------------- |
| Hook in Tier 2.1 needed by upcoming feature       | User confirms keep-for-future before deletion             |
| Backend type used via reflection / DI scanning    | Check `Program.cs`, module registrations, EF config       |
| Mobile dep needed at native-build time, not JS    | Keep `@capacitor/{android,ios}`; verify others manually   |
| Mapper function (`toApiProjectStatus` etc.) needed for upcoming write API | User confirms before deletion             |
| Tier 0 restore conflicts with newer changes       | None expected — working-tree shows zero `M` (modified)    |

---

## 9. What This Plan Does NOT Do

- Does not refactor working code.
- Does not change any runtime behavior.
- Does not touch backend modules currently in active use (Teams, Tasks, Projects, Billing, Analytics, Identity, Files, Workspace).
- Does not delete documentation under `docs/` or `.codex/`.
- Does not touch shared write surfaces (`app/layout.tsx`, `components/sidebar.tsx`, etc.) — per AGENTS.md serialization rules.

---

**Awaiting your approval to proceed with Tier 0. Reply with which tiers to execute (e.g., "do Tier 0 + Tier 1 + Tier 4") or call out items to keep.**
