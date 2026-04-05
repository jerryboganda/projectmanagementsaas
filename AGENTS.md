# AGENTS

## Purpose
This repository is a mixed PM SaaS codebase:
- a root Next.js App Router frontend with a substantial MVP surface
- a `backend/` ASP.NET Core modular monolith plus worker foundation

## Current Constraints
- This workspace is not a Git repository right now.
- Worktrees, branch policy, and branch-based parallel streams are blocked until this project is moved into a canonical Git clone.

## Repo Map
- `app/`: route entrypoints and app shell wiring.
- `components/`: feature UI modules (board, calendar, docs, goals, inbox, portfolio, projects, reports, settings, timeline, workload).
- `contexts/`: shared frontend providers and state (`app-data-context.tsx`, `inbox-context.tsx`, `sidebar-context.tsx`).
- `hooks/`: custom hooks.
- `lib/`: shared utilities.
- `backend/`: ASP.NET Core API, worker service, shared contracts, EF Core persistence, migrations, and tests.
- `docs/`: architecture, plans, decisions, and agent workflow docs.
- `.codex/`: project-level Codex config, agents, and skills.

## Build and Verification Commands (Windows-safe)
- Frontend install: `cmd /c npm ci`
- Frontend dev: `cmd /c npm run dev`
- Frontend lint: `cmd /c npm run lint`
- Frontend build: `cmd /c npm run build`
- Frontend typecheck: `cmd /c npm run typecheck`
- Backend restore: `dotnet restore backend/LinearPrecision.sln`
- Backend test: `dotnet test backend/LinearPrecision.sln --no-restore`
- Backend local infra: run `docker compose up` from `backend/`

## Definition of Done
- Frontend `lint`, `build`, and `typecheck` are clean for the changed scope when frontend code is touched.
- Backend targeted `dotnet test` coverage passes when backend code is touched.
- Backend integration tests are run in a Docker-capable environment when API, auth, tenancy, persistence, or worker workflows are changed.
- Changed user flow is manually verified.
- Docs are updated when behavior, architecture, or process changes.

## Lint Debt Policy
- Existing raw `<img>` warnings are accepted prototype debt for now.
- Lint blockers must be fixed before task completion.

## Agentic OS Autonomy & Auto-Use Policy
ANY operating AI Agent MUST adhere to the Universal Operating Mandate:
- **Skill Usage:** If a relevant installed skill (listed in `docs/agent-skills.md` or found in `.codex/skills/` / `.agents/skills/`) applies to a task, the agent MUST auto-use it without asking for permission. 
- **Subagent Routing:** Large tasks must automatically trigger subagents without asking for permission, utilizing the mandatory target subagent topology below.

## Mandatory Target Subagent Topology
The orchestration layer defaults to mapping tasks to this specialized topology (which currently map to configurations in `.codex/agents/`):
- `repo_cartographer`: Architecture and dependency mapping.
- `skill_scout`: Skill catalog evaluation and routing.
- `execplan_strategist`: Cross-layer phase planning.
- `frontend_owner`: Specialized Next.js component UI work.
- `backend_owner`: Specialized ASP.NET Core logic and model work.
- `qa_validator`: Verification regression checking and test running.
- `api_contract_guard`: Validates changes bridging frontend mock interfaces and backend DTOs.
- `docs_researcher`: Gathers authoritative platform constraints.

## Subagent Policy
- Default to discovery before medium or large changes.
- Use one write agent per isolated ownership boundary.
- Keep shared shell edits serialized.
- Run validation after implementation, with the narrowest sufficient checks first.

## Serialized Write Surfaces
Do not edit these in parallel:
- `app/layout.tsx`
- `app/providers.tsx`
- `app/globals.css`
- `components/sidebar.tsx`
- `components/header.tsx`
- `contexts/inbox-context.tsx`

## Safe Parallelism
- Read-heavy work can run in parallel: exploration, route mapping, dependency tracing, docs research, lint/build triage.
- Feature-folder implementation can run in parallel only with disjoint file ownership.

## Plan Expectations
- Create or update a plan for cross-layer features, risky refactors, or migrations.
- Keep `docs/PLANS.md` current when milestones, assumptions, or acceptance criteria change.
- Keep `docs/project-ssot.md` current when source-of-truth ownership or repo framing changes.

## Research and MCP Use
- Prefer local code and local docs first.
- Use official framework docs when behavior is uncertain.
- Do not add project-scoped MCP servers by default.
- Add MCP only when there is repeated, concrete value.

## Repo Skills
- Reusable project skills currently live in `.codex/skills/` to match the active Codex project layout already present in this environment.
- Keep skill scope narrow and reusable. Prefer adding or updating a skill only when the same workflow is likely to repeat.

## Recommended Skill Map
- Start with project-local skills when they fit, because they encode this repo's folder layout, serialized edit zones, and PM SaaS workflow assumptions.
- UI and route work: `repo-discovery`, `next-best-practices`, `react-best-practices`.
- UI redesign and polish: `frontend-design`, `web-design-guidelines`, `responsive-design`, `web-accessibility`.
- Component-system work: `design-system`, `frontend-design-system`, `ui-component-patterns`, `shadcn`.
- Bug reproduction and debugging: `bug-triage`, `systematic-debugging`, `debugging`.
- Cross-layer features or risky refactors: `feature-execplan`, `writing-plans`, `executing-plans`, then `verification-before-completion`.
- Frontend regression checks: `ui-regression-check`, `playwright`, `webapp-testing`.
- Frontend-to-backend integration or mock-to-real transitions: `contract-check`, `api-design`, `api-documentation`.
- ASP.NET Core backend work in `backend/`: `aspnet-core`, `dotnet-backend-patterns`, `aspnet-minimal-api-openapi`.
- Backend auth, data, and platform concerns: `authentication-setup`, `database-schema-design`, `backend-testing`, `monitoring-observability`, `containerize-aspnetcore`.
- Docs and durable operating guidance: `docs-sync`.
- Explicit security work only: `security-best-practices`, `security-threat-model`, `security-ownership-map`.
- Use `render-deploy`, `gh-address-comments`, and `gh-fix-ci` only when the task explicitly calls for those workflows.

## Protected Changes Requiring Explicit Approval
- Package manager switch or dependency-system rewrite.
- Global design language rewrite across all feature surfaces.
- Replacing or fundamentally restructuring the existing backend/API/persistence/auth architecture.
- Destructive deletions across shared or global files.
