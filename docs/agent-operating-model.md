# Agent Operating Model

## Objective
Keep the main thread decision-focused, proactively auto-use specialized skills, and use subagents to reduce context load, isolate noisy work, and increase safe parallelism.

## Core Operating Mandate
If you are an AI agent operating in this codebase (regardless of environment):
- **Discover:** Rely on `docs/bootstrap-report.md` to map the system before broad changes.
- **Auto-use Skills:** Look up applicable domain skills in `docs/agent-skills.md` and use the instructions within. Never wait for permission to use them.
- **Orchestrate via Subagents:** Assign isolated execution to domains (e.g. `frontend_owner`, `backend_owner`). Main thread handles synthesis and orchestration.

## Default Task Flow
1. Discovery: map affected files, ownership boundaries, and constraints.
2. Plan: define milestones, dependencies, and validation.
3. Implement: assign one write owner per isolated file boundary.
4. Validate: run the narrowest sufficient checks, then widen as needed.
5. Document: persist durable findings in repo docs.

## Default Agent Topology
- `repo_cartographer`: read-only architecture and dependency mapping.
- `skill_scout`: search, evaluate, and verify relevant agent skills, maintaining the skill registry.
- `execplan_strategist`: phased plans with acceptance criteria.
- `backend_owner`: implementation in C# ASP.NET Core logic and data layers.
- `frontend_owner`: implementation in Next.js route and component layers.
- `bug_reproducer`: reproduce defects and capture evidence.
- `qa_validator`: post-change verification.
- `docs_researcher`: official docs lookup for uncertain behavior.
- `refactor_guard`: behavior-drift checks for structural changes.
- `api_contract_guard`: only when real producer/consumer contracts are introduced.

## Parallelism Rules
- Safe in parallel:
  - read-heavy repo exploration
  - docs research
  - lint/build triage
  - disjoint feature-folder edits
- Must stay serialized:
  - `app/layout.tsx`
  - `app/providers.tsx`
  - `app/globals.css`
  - `components/sidebar.tsx`
  - `components/header.tsx`
  - `contexts/inbox-context.tsx`

## Verification Standard
- Install: `cmd /c npm ci`
- Dev: `cmd /c npm run dev`
- Lint: `cmd /c npm run lint`
- Build: `cmd /c npm run build`
- Typecheck: `cmd /c npm run typecheck`

Done means lint clean (except accepted prototype debt), build clean, typecheck clean, manual flow verification complete, and docs synced.

## Current Constraints
- This workspace is not a Git repository.
- Worktrees and branch policy are blocked until the project is moved into a canonical Git clone.
- Codex local-environment setup/actions should be generated through the app settings pane once the canonical clone is available.

## Lint Debt Policy
- Raw `<img>` warnings are currently accepted prototype debt.
- Lint blockers are not accepted and must be fixed.
