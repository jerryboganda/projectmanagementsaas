# Technical Debt & Cleanup Plan

_Generated 2026-04-26. Builds on Phase 1–3 remediation already recorded in `/memories/repo/pm-saas-remediation-progress.md`._

## 1. Snapshot

| Area | Status |
|---|---|
| Frontend stack | Next 15.5.13, React 19.2.4, TS 5.9.3, Tailwind 4.1.11, ESLint 9.39 — all on current majors |
| Backend stack | .NET 9.0, EF Core 9, MediatR 12, FluentValidation 11, Hangfire 1.8 — all current majors |
| TypeScript hygiene | No `: any` types, no raw `<img>`, no rogue `console.log` in app code |
| Test coverage | 64 unit tests; backend integration tests deferred (Docker-dependent) |
| Build health | lint, typecheck, build all clean; backend builds with 0 errors / 233 pre-existing CA advisories |

The codebase is in materially better shape than the AGENTS.md narrative suggests. The remaining debt is concentrated, not systemic.

---

## 2. Priority 0 — Security (do this week)

### P0.1 Patch Next.js + transitive vulns

`npm audit` reports **4 advisories (2 high, 2 moderate)** all auto-fixable:

| Package | Severity | Issue |
|---|---|---|
| `next` < 15.5.15 | **High** | DoS via Server Components ([GHSA-q4gf-8mx6-v5v3](https://github.com/advisories/GHSA-q4gf-8mx6-v5v3)) + unbounded `next/image` disk cache ([GHSA-3x4c-7xq6-9pq8](https://github.com/advisories/GHSA-3x4c-7xq6-9pq8)) |
| `picomatch` ≤ 2.3.1 | **High** | ReDoS via extglob quantifiers + glob method injection |
| `postcss` < 8.5.10 | Moderate | XSS via unescaped `</style>` |
| `brace-expansion` | Moderate | Zero-step sequence DoS |

**Action:** `npm audit fix` (no breaking changes; bumps Next 15.5.13 → 15.5.15 patch).

### P0.2 Pin floating NuGet versions

`backend/src/**/*.csproj` uses floating wildcards (`9.0.*`, `2.*`, `1.*`, `8.*`). This breaks reproducible builds on CI cache misses and lets transitive CVEs slip in unaudited.

**Action:** Replace each `Version="X.*"` with the resolved exact version from `obj/project.assets.json`. Move repeated versions to `Directory.Packages.props` with central package management (`<ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>`).

---

## 3. Priority 1 — Outdated dependencies (next sprint)

### Frontend (in-range patches — risk-free)
```
@playwright/test       1.58.2 → 1.59.1
@tanstack/react-query  5.95.0 → 5.100.5
autoprefixer           10.4.27 → 10.5.0
react / react-dom      19.2.4 → 19.2.5
recharts               3.8.0 → 3.8.1
```
**Action:** `npm update` (single PR, run lint/typecheck/build/tests).

### Frontend (major bumps — schedule individually)
| Package | From | To | Risk | Notes |
|---|---|---|---|---|
| `lucide-react` | 0.553 | 1.11 | Low | API-stable, just left 0.x |
| `eslint-config-next` | 16.0.8 | 16.2.4 | Low | Pairs with Next 16 |
| `next` | 15.5 | **16.2** | **Medium** | Breaking: revised caching defaults, async `params`/`searchParams` already used; review release notes |
| `tailwindcss` / `@tailwindcss/postcss` | 4.1.11 | 4.2.4 | Low | Patch within v4 |
| `eslint` | 9.39 | 10.2 | Medium | Flat config already in use; verify plugin compatibility |
| `typescript` | 5.9 | 6.0 | Medium | Run typecheck on a branch first |
| `@types/node` | 20 | 25 | Low | Match Node runtime in CI/Docker |

**Recommendation:** Land Next 16 alone; bundle ESLint 10 + TS 6 + types/node together; do Tailwind + Lucide in a third pass.

### Backend NuGet
- `MediatR` 12.* → review **before** moving to v13: v13 is **commercial-licensed**. Either stay on 12.x with security patches or migrate to a free alternative (e.g. roll a minimal `IRequestHandler` dispatcher — most modules already follow that pattern via `MediatR.Contracts` 2.0.1).
- `Stripe.net` 45.* → 47.* available; check API version pinning in `StripeEndpoints.cs`.
- `QuestPDF` 2024.* → 2026.* available; check license tier.
- `Serilog.AspNetCore` 8.* → 9.* (matches .NET 9 host).
- `FluentAssertions` 7.* → review v8 license terms (commercial post v8).

---

## 4. Priority 2 — Architectural debt

### P2.1 Oversized files (deferred from Phase 3)
Splitting these unlocks meaningful test coverage and parallel feature work:

| File | LOC | Suggested split |
|---|---|---|
| `components/time-tracking/time-tracking-layout.tsx` | **1922** | timer subview, entries list, summary tabs |
| `components/docs/docs-editor.tsx` | **1139** | toolbar, editor surface, comments rail |
| `lib/api/client.ts` | **1051** | one file per resource (projects, tasks, ai, …) re-exported from index |
| `components/automations/automations-layout.tsx` | 1045 | builder, runs panel, trigger config |
| `components/sprints/sprints-layout.tsx` | 938 | board view, stats, sprint list |
| `lib/api/contracts.ts` | 805 | shard by module: `contracts/projects.ts`, `contracts/goals.ts`, etc. |
| `backend/.../WorkspaceEndpoints.cs` | 763 | one partial class per concern (members, invites, settings, billing) |

Add at least one snapshot or interaction test per extracted unit before splitting.

### P2.2 Replace native `confirm()` / `alert()`

7 `// eslint-disable-next-line no-alert` suppressions in:
- `components/automations/automations-layout.tsx:880`
- `components/time-tracking/time-tracking-layout.tsx:1485`
- `components/portfolio/portfolio-detail.tsx:187`
- `components/goals/goals-detail.tsx:194,456`
- `components/docs/docs-editor.tsx:684,701`

**Action:** Wire a project-wide `<ConfirmDialog>` (already have `motion` + `components/ui/`) and a toast helper. Removes the lint suppressions and fixes accessibility (`alert/confirm` is non-themed and breaks focus management).

### P2.3 `react-hooks/exhaustive-deps` suppressions
3 sites: `timeline-create-modal.tsx` (74, 87) and `onboarding-wizard.tsx` (109). Refactor to `useEffect` with stable refs or `useCallback` to remove the exception — these are common bug breeding grounds.

### P2.4 Backend analyzer debt
233 CA warnings in `dotnet build`. Triage by category (CA1031 catch-all, CA1860 `Any()` vs `Count`, CA2007 ConfigureAwait). Fix one rule at a time across the solution; flip `<TreatWarningsAsErrors>` to `true` for that rule once green.

---

## 5. Priority 3 — Hygiene

### P3.1 Drop committed scratch artifacts
Repo root contains generated JSON that should not be tracked:
- `knip-report.json`, `unused-exports.json`, `unused-trim.json`, `verify-results.json`

**Action:** Move to `.gitignore`; either delete or move under `tools/reports/` if needed for CI baselines. The current `knip-report.json` is also stale (still references already-deleted `types/index.ts`, `types/shared.ts`).

### P3.2 `verify-unused.mjs` lint warnings
3 lint warnings flagged in remediation memory but never resolved. Either fix or move script under `tools/` excluded from lint.

### P3.3 Mobile workspace tree noise
Knip flags ~70 files under `mobile/` (Capacitor sub-app + iOS/Android build outputs). Fixes:
- Add `mobile/dist`, `mobile/android/app/build`, `mobile/ios/App/App/public/assets` to root `.gitignore`.
- Add `mobile/` to the workspace's knip ignore list (it has its own `package.json`).

### P3.4 Knip-reported unused exports
After mobile/build artifacts are excluded, the remaining real findings are ~15 named exports (e.g. `goalsListQueryKey`, `calendarItemTypeOptions`, several types in `lib/api/contracts.ts`). Audit individually — query keys are usually intentional public API; trim only the genuinely orphaned ones.

### P3.5 Backend integration tests
Already in deferred bucket. Fastest unblock: containerize the test runner (`backend/docker-compose.yml` already provisions Postgres/Redis). Add a `make test-integration` or `dotnet test --filter Category=Integration` target that spins the compose stack up.

---

## 6. Sequenced execution plan

| Wave | Scope | Validation |
|---|---|---|
| **W1 (this week)** | P0.1 `npm audit fix`, P0.2 pin NuGets + central package mgmt, P3.1 ignore scratch files | `npm test`, `npm run build`, `dotnet build`, `dotnet test` |
| **W2** | P1 frontend in-range bumps, P3.2/P3.3 hygiene | full lint+typecheck+build+test |
| **W3** | P1 Next 16 upgrade (isolated PR) | full suite + manual smoke of `/projects`, `/board`, `/calendar`, `/inbox` |
| **W4** | P1 ESLint 10 + TS 6 + types/node bundle, MediatR licensing decision | typecheck + new lint rule audit |
| **W5+** | P2.1 file splits (one per PR with new tests), P2.2 confirm dialog migration, P2.3 hooks fix, P2.4 CA analyzer batches | per-PR scope + targeted tests |
| **Continuous** | P3.5 backend integration tests | run in Docker-capable CI lane |

---

## 7. Out of scope (do not touch without explicit approval)

Per AGENTS.md "Protected Changes":
- Package-manager swap
- Global design-system rewrite
- Auth/persistence architecture replacement
- Bulk deletion of shared/global files

The serialized chokepoints (`app/layout.tsx`, `app/providers.tsx`, `app/globals.css`, `components/sidebar.tsx`, `components/header.tsx`, `contexts/inbox-context.tsx`) must be edited single-threaded across waves.
