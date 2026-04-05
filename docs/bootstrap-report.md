# Agentic OS Bootstrap Report

## 1. Project Summary
This repository houses a mixed Project Management SaaS application comprising a Next.js App Router frontend at the repository root and an ASP.NET Core backend within the `backend/` directory. The project exhibits a highly structured feature-folder layout spanning UI, API contracts, local persistence models, and comprehensive agentic scaffolding. 

## 2. Stack Summary
- **Frontend:** Next.js 15, React 19, TypeScript 5.9 (strict), Tailwind CSS v4, Motion, Recharts, @hello-pangea/dnd.
- **Backend:** ASP.NET Core, EF Core, minimal APIs, worker services, Docker orchestration (`docker-compose.yml`).
- **Tooling/QA:** ESLint, Playwright, integrated type-checking, .NET test frameworks.
- **Agentic Scaffold:** `.codex/` and `.agents/` directories containing custom instructions, runtime subagents, and domain-specific skills.

## 3. Architecture Map
- `app/` - Frontend route entrypoints and shell wiring.
- `components/` - Feature modules (e.g., board, calendar, inbox, workload) following a layout → surface → toolbar → detail → data pattern.
- `backend/` - C# API, persistence models, database migrations, and .NET tests.
- `contexts/` - Global frontend state (app-data, auth, workspace).
- `docs/` - System architecture, agent operating models, decision logs, and roadmaps.

## 4. Risk Areas
- **Serialized Write Chokepoints:** Modifications to `app/layout.tsx`, `app/providers.tsx`, `components/sidebar.tsx`, etc., face high merge/clobber risks and must be serialized.
- **Root-level Integration:** The codebase currently functions with local mock data (e.g., `data.ts` per feature) and a distinct backend. Transitioning contracts from mock to ASP.NET APIs will require careful contract-guarding.
- **Prototype Debt:** Ignored raw `<img>` tags and missing exhaustive error boundaries in newer feature modules.

## 5. Missing Docs/Config
- A definitive `agent-skills.md` skill trigger matrix was missing (resolved via this bootstrap).
- Auto-use policies were merely suggested rather than enforced in the VS Code Copilot context (resolving via `.github/copilot-instructions.md`).

## 6. Proposed Subagent Topology
- `repo_cartographer`: Read-only architecture mapping.
- `skill_scout`: Skill catalog evaluation and routing.
- `execplan_strategist`: Cross-layer phase planning.
- `frontend_owner`: Next.js UI implementation.
- `backend_owner`: ASP.NET Core infrastructure.
- `qa_validator`: Local regression runs and build checks.
- `api_contract_guard`: Validates changes bridging `components/**/data.ts` and `backend/`.

## 7. Installed/Recommended Skills
- **Installed:** `feature-plan`, `bug-triage`, `contract-check`, `docs-sync`, `feature-execplan`, `repo-discovery`, `ui-regression-check`.
- **Recommendation:** All agents must automatically invoke these skills for corresponding tasks without requesting permission.

## 8. MCP Integrations
- No global MCP tools are currently mandated. The environment relies strictly on local docs, code exploration tools, and local terminal runners. Adding heavy MCP dependencies is blocked unless backed by extreme justification.

## 9. Worktree Strategy
- Branching and parallel worktrees are blocked until canonical Git initialization. All current work is confined to a single directory structure.

## 10. Prioritized Bootstrap Plan
1. Stand up the `docs/agent-skills.md` registry.
2. Hardcode the "Auto-Use Policy" in `AGENTS.md`.
3. Provide `.github/copilot-instructions.md` for VS Code integration.
4. Finalize the `agent-operating-model.md`.