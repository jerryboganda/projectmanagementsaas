# Agent Operating Model

## Objective
Keep the main thread decision-focused, proactively auto-use specialized skills, and use subagents to reduce context load, isolate noisy work, and increase safe parallelism.

For the full architecture documentation, see `docs/ai-operating-system/README.md`.

## Core Operating Mandate — AUTOMATIC AND MANDATORY
If you are an AI agent operating in this codebase (regardless of environment):
- **AUTOMATICALLY Discover:** Rely on `docs/bootstrap-report.md` and `Explore`/`repo-cartographer` subagents to map the system before changes. Do this WITHOUT being asked.
- **AUTOMATICALLY use Skills:** Look up applicable skills in `docs/agent-skills.md`. If a trigger matches, read the `SKILL.md` and follow it. NEVER ask for permission.
- **AUTOMATICALLY delegate to Subagents:** Route frontend work to `frontend-owner`, backend work to `backend-owner`, quality validation to `qa-validator`. NEVER ask which agent to use.
- **AUTOMATICALLY validate after changes:** Run the appropriate build/lint/test commands. NEVER skip this step.

## Default Task Flow
1. Discovery: map affected files, ownership boundaries, and constraints.
2. Plan: define milestones, dependencies, and validation.
3. Implement: assign one write owner per isolated file boundary.
4. Validate: run the narrowest sufficient checks, then widen as needed.
5. Document: persist durable findings in repo docs.

## Agent Topology

### User-Selectable Chat Modes
- `pm-lead`: Cross-layer planning and orchestration (defined in `pm-lead.agent.md`)
- `pm-frontend`: Next.js component and page work (defined in `pm-frontend.agent.md`)
- `pm-backend`: ASP.NET Core endpoint and module work (defined in `pm-backend.agent.md`)
- `pm-fullstack`: Frontend-backend integration (defined in `pm-fullstack.agent.md`)

### Delegatable Subagents
- `frontend-owner`: Frontend implementation in Next.js route and component layers (`.claude/agents/`)
- `backend-owner`: Backend implementation in C# ASP.NET Core logic and data layers (`.claude/agents/`)
- `qa-validator`: Post-change verification — lint, typecheck, build, tests (`.claude/agents/`)
- `repo-cartographer`: Read-only architecture and dependency mapping (`.claude/agents/`)
- `Explore`: Built-in fast read-only exploration for quick lookups

### Legacy Codex Topology (retained for backward compatibility in `.codex/agents/`)
- `skill_scout`, `execplan_strategist`, `bug_reproducer`, `docs_researcher`, `refactor_guard`, `api_contract_guard`

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

### Frontend
- Install: `cmd /c npm ci`
- Dev: `cmd /c npm run dev`
- Lint: `cmd /c npm run lint`
- Build: `cmd /c npm run build`
- Typecheck: `cmd /c npm run typecheck`

### Backend
- Restore: `dotnet restore backend/LinearPrecision.sln`
- Test: `dotnet test backend/LinearPrecision.sln --no-restore`

Done means lint clean (except accepted prototype debt), build clean, typecheck clean, tests passing, manual flow verification complete, and docs synced.

## Current Constraints
- This workspace is not a Git repository.
- Worktrees and branch policy are blocked until the project is moved into a canonical Git clone.

## Lint Debt Policy
- Raw `<img>` warnings are currently accepted prototype debt.
- Lint blockers are not accepted and must be fixed.
