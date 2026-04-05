# Agent Skills Registry & Trigger Matrix

This registry defines the durable skill set available to the agentic operating system in this repository. All capable agents MUST consult this matrix and **automatically use** the relevant skills when their trigger conditions are met. 

Do not ask for permission to use a skill. If the task matches the trigger, invoke it (e.g., by reading its instructions, running its checks, or adopting its workflow).

## Installed Skills

### 1. `feature-plan`
* **Source:** `.agents/skills/feature-plan/`
* **Purpose:** Create an implementation plan for a new feature module following project conventions.
* **Trigger:** User requests adding a new feature area, page, or complex component directory.

### 2. `bug-triage`
* **Source:** `.codex/skills/bug-triage/`
* **Purpose:** Systematically reproduce, isolate, and debug issues before jumping to code changes.
* **Trigger:** User reports a bug, exception, stack trace, or failing test.

### 3. `contract-check`
* **Source:** `.codex/skills/contract-check/`
* **Purpose:** Verify compatibility between ASP.NET Core APIs and Next.js frontend models/mocks.
* **Trigger:** Modifying `backend/` data models or updating frontend `data.ts` schemas.

### 4. `docs-sync`
* **Source:** `.codex/skills/docs-sync/`
* **Purpose:** Ensure that architecture, decision logs, and plans are updated in sync with code changes.
* **Trigger:** Completing a major feature, making a structural architectural change, or resolving significant technical debt.

### 5. `feature-execplan`
* **Source:** `.codex/skills/feature-execplan/`
* **Purpose:** Define validation and acceptance criteria before substantive edits across UI or Backend layers.
* **Trigger:** Initiating cross-layer features or risky refactors.

### 6. `repo-discovery`
* **Source:** `.codex/skills/repo-discovery/`
* **Purpose:** Read-only exploration and architecture mapping for unfamiliar zones.
* **Trigger:** Agent is asked to operate on a domain it cannot fully trace in its immediate context.

### 7. `ui-regression-check`
* **Source:** `.codex/skills/ui-regression-check/`
* **Purpose:** Run linters, type checks, and basic component rendering verifications.
* **Trigger:** Finishing any substantive UI implementation or Tailwind refactor.

## Fallback Policy
If a workflow requires a skill not present in this registry, explicitly document the missing capability in `docs/bootstrap-report.md`, proceed using native reasoning, and recommend the necessary skill scaffold creation in the task summary.