# Project Management SaaS

## Current Identity
- Mixed PM SaaS codebase: a Next.js App Router frontend at the repo root plus an ASP.NET Core backend foundation under `backend/`.
- Frontend and backend both exist in this workspace, but the root frontend is not yet fully integrated with the backend runtime.
- Canonical engineering SSOT lives in `docs/project-ssot.md`.
- This folder is not a Git repository; worktree workflows stay blocked until the project is moved into a canonical Git clone.

## Stack
- **Framework:** Next.js 15 + React 19 + TypeScript 5.9 (strict)
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
- `contexts/app-data-context.tsx` is the closest current frontend SSOT, but project-wide runtime truth is still split.
- Shared chokepoints must stay serialized:
  - `app/layout.tsx`
  - `app/providers.tsx`
  - `app/globals.css`
  - `components/sidebar.tsx`
  - `components/header.tsx`
  - `contexts/inbox-context.tsx`
- Existing raw `<img>` warnings are accepted prototype debt; lint blockers are not.

## Subagent Usage
- Use discovery first for medium and large changes.
- Use one write agent per isolated file boundary.
- Use `qa_validator` after substantive changes.
- Keep shared-shell edits serialized even when feature work is parallelized.
