# Project Management SaaS

## Current Identity
- Mixed PM SaaS codebase: a Next.js App Router frontend at the repo root plus an ASP.NET Core backend foundation under `backend/`.
- Frontend and backend both exist in this workspace, but the root frontend is not yet fully integrated with the backend runtime.
- Canonical engineering SSOT lives in `docs/project-ssot.md`.
- This folder is not a Git repository; worktree workflows stay blocked until the project is moved into a canonical Git clone.

## Stack
- **Framework:** Next.js 16 + React 19 + TypeScript 6 (strict)
- **Styling:** Tailwind CSS v4, Motion, Lucide React
- **Charts:** Recharts
- **Drag & Drop:** @hello-pangea/dnd

## Commands
```bash
cmd /c npm ci
cmd /c npm run dev
cmd /c npm run lint
cmd /c npm run build
cmd /c npm run typecheck
cmd /c npm test
cmd /c npm run clean
dotnet restore backend/LinearPrecision.sln
dotnet test backend/LinearPrecision.sln --no-restore
```

## Architecture
- `app/` -> App Router entrypoints and frontend shell wiring
- `components/` -> feature-local UI modules and mock/demo data
- `contexts/` -> shared frontend contexts
- `hooks/` -> custom hooks
- `lib/` -> shared utilities
- `backend/` -> ASP.NET Core API, contracts, persistence, worker, and tests
- `docs/` -> architecture, plans, decisions, and operating guidance
- `.codex/` -> project-local Codex config, agents, and skills

## Conventions
- Most interactive surfaces are client components.
- Feature modules follow a repeated layout/surface/toolbar/detail/data structure.
- `contexts/workspace-context.tsx`, TanStack Query hooks, and the typed API client are the closest current frontend runtime sources of truth; project-wide runtime truth is still split across frontend and backend.
- Shared chokepoints must stay serialized:
  - `app/layout.tsx`
  - `app/providers.tsx`
  - `app/globals.css`
  - `components/sidebar.tsx`
  - `components/header.tsx`
  - `contexts/inbox-context.tsx`
- Existing raw `<img>` warnings are accepted prototype debt; lint blockers are not.

## Subagent Usage — MANDATORY AUTO-ROUTING

**NEVER ask the user which agent/subagent to use. Detect and route automatically:**
- Frontend work → `frontend-owner` subagent
- Backend work → `backend-owner` subagent
- Codebase exploration → `repo-cartographer` or `Explore` subagent
- After any code change → `qa-validator` subagent (NEVER skip)
- Cross-layer → both `frontend-owner` and `backend-owner` sequentially

**NEVER ask permission to load a skill. Auto-load when triggers match:**
- New feature → `.agents/skills/feature-plan/SKILL.md`
- Bug/error → `.agents/skills/bug-triage/SKILL.md`
- Shared types changed → `.agents/skills/contract-check/SKILL.md`
- Frontend-to-backend wiring → `.agents/skills/api-integration/SKILL.md`
- New backend module → `.agents/skills/backend-module/SKILL.md`
- After UI edits → `.agents/skills/ui-regression-check/SKILL.md`
- Unfamiliar code → `.agents/skills/repo-discovery/SKILL.md`
- After structural changes → `.agents/skills/docs-sync/SKILL.md`

Use discovery first for medium and large changes.
Use one write agent per isolated file boundary.
Keep shared-shell edits serialized even when feature work is parallelized.
