# Known Risks

Last updated: 2026-03-23

## Critical
- **No version control** - Project is not a git repository. Risk of losing work.
- **Commercial-GA flows are not fully complete** - The authenticated shell and route surfaces now use live hooks/providers, but several deeper subfeatures, billing flows, file flows, and end-to-end launch gates are still incomplete.
- **No CD pipeline in source** - An initial CI workflow exists, but there is still no checked-in deploy, promotion, rollback, or release automation.

## High
- **Frontend source of truth is still distributed** - Runtime state now lives across TanStack Query hooks, `InboxProvider`, auth/workspace providers, and feature-local UI state. There is still no single project-wide runtime SSOT.
- **Security plan and implementation drift** - Auth and tenancy docs describe a more hardened target than the current backend startup wiring implements today. This creates planning confidence that the running code has not fully earned yet.
- **ESLint ignored in frontend builds** - `eslintDuringBuilds: false` in `next.config.ts` means lint errors do not block deploys.
- **Partial frontend data migration at the subfeature level** - Route surfaces are live-backed, but board comments/checklists/watchers/attachments, settings billing/security/integrations/teams/appearance, richer docs/reports/workload contracts, and other deeper flows still need real backend coverage.
- **Legacy AppData scaffolding remains in source** - `contexts/app-data-context.tsx` is no longer mounted, but leaving the monolith in source can still confuse contributors and reintroduce stale patterns if it is not cleaned up deliberately.

## Medium
- **Backend integration tests require Docker/Testcontainers** - In environments without Docker, the integration suite cannot validate end-to-end API behavior.
- **No error boundaries** - Client errors can still crash an entire page.
- **Frontend still assumes synchronous local data in many places** - Several components are not yet designed around real network latency, loading states, retries, and API errors.
- **Large component files** - Several feature modules remain large enough to create maintenance and readability pressure.
- **Provider nesting depth** - The provider stack is already deep, and adding more global providers will further increase coupling.
- **No frontend runtime validation** - The typed client and live hooks still rely mostly on compile-time validation; runtime payload validation is still thin.
- **Doc/code drift risk** - Several architecture and migration docs are ahead of implementation and require deliberate upkeep to remain trustworthy.
- **Type duplication** - Several modules still keep local types alongside the unified frontend model, which creates drift risk.

## Low
- **No Prettier** - Code formatting still relies on local editor settings.
- **localStorage coupling** - The onboarding wizard still persists completion state directly with `localStorage`.
- **CustomEvent communication** - Some global interactions use `window.dispatchEvent(new CustomEvent(...))`, which is less discoverable than explicit contracts.
