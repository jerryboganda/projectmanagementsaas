# Agent Skills Registry & Trigger Matrix

This registry defines the durable skill set available to the agentic operating system in this repository. All capable agents MUST consult this matrix and **automatically use** the relevant skills when their trigger conditions are met.

Do not ask for permission to use a skill. If the task matches the trigger, read the `SKILL.md` and follow its workflow immediately.

**Canonical skill location:** `.agents/skills/` (cross-tool compatible — works with VS Code Copilot, Claude Code, and Codex).

## Installed Skills

### 1. `feature-plan`
* **Source:** `.agents/skills/feature-plan/`
* **Purpose:** Create an implementation plan for a new feature module following project conventions.
* **Trigger:** User requests adding a new feature area, page, or complex component directory.

### 2. `bug-triage`
* **Source:** `.agents/skills/bug-triage/`
* **Purpose:** Systematically reproduce, isolate, and debug issues before jumping to code changes.
* **Trigger:** User reports a bug, exception, stack trace, or failing test.

### 3. `contract-check`
* **Source:** `.agents/skills/contract-check/`
* **Purpose:** Verify compatibility between ASP.NET Core backend DTOs and Next.js frontend TypeScript types.
* **Trigger:** Modifying `backend/` data models, updating `lib/api/contracts.ts`, or changing `components/*/data.ts` schemas.

### 4. `docs-sync`
* **Source:** `.agents/skills/docs-sync/`
* **Purpose:** Ensure that architecture, decision logs, and plans are updated in sync with code changes.
* **Trigger:** Completing a major feature, making a structural architectural change, or resolving significant technical debt.

### 5. `api-integration`
* **Source:** `.agents/skills/api-integration/`
* **Purpose:** Wire a frontend feature's TanStack Query hooks to a backend ASP.NET Core API endpoint.
* **Trigger:** Connecting a frontend feature to its backend API, migrating from mock data to live API.

### 6. `backend-module`
* **Source:** `.agents/skills/backend-module/`
* **Purpose:** Create a new ASP.NET Core domain module following the modular monolith pattern.
* **Trigger:** Adding a new backend domain module with endpoints, entities, validators, and tests.

### 7. `repo-discovery`
* **Source:** `.agents/skills/repo-discovery/`
* **Purpose:** Read-only exploration and architecture mapping for unfamiliar zones.
* **Trigger:** Agent is asked to operate on a domain it cannot fully trace in its immediate context.

### 8. `ui-regression-check`
* **Source:** `.agents/skills/ui-regression-check/`
* **Purpose:** Run linters, type checks, and verify UI states after frontend edits.
* **Trigger:** Finishing any substantive UI implementation or Tailwind refactor.

## Legacy Skills (Codex-format, retained for backward compatibility)

The following skills remain in `.codex/skills/` for Codex backward compatibility. The canonical versions are in `.agents/skills/`.
- `feature-execplan` — superseded by `feature-plan` + execution planning in agent modes

## Fallback Policy

If a workflow requires a skill not present in this registry, explicitly document the missing capability in `docs/bootstrap-report.md`, proceed using native reasoning, and recommend the necessary skill scaffold creation in the task summary.