# Project Management SaaS

Mixed frontend and backend repository for a project management SaaS product.

## Current State

- Root app: Next.js 15 App Router frontend with 17 route pages and a substantial mock-backed MVP surface
- `backend/`: ASP.NET Core 9 modular monolith plus worker service, EF Core persistence, migrations, tests, SignalR, Redis, and local Docker Compose
- Root deployment artifacts now include a production `Dockerfile` for the Next.js web app
- The frontend is **not yet production-complete**, but the authenticated product shell now runs through live auth/workspace/query/realtime foundations and all major route surfaces use live hooks or live providers. The remaining gaps are mostly deeper subfeatures, placeholder panels, missing contracts, and broader SaaS hardening
- This folder is currently not a Git repository, so worktree and branch-based workflows are still blocked

## Canonical Project Doc

- Engineering SSOT: `docs/project-ssot.md`

## Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- `motion`
- `@hello-pangea/dnd`
- Recharts

### Backend

- ASP.NET Core 9
- .NET Worker Service
- Entity Framework Core + PostgreSQL
- Redis
- SignalR
- Hangfire
- Docker Compose for local `web` + `api` + `worker` infrastructure

## Frontend Commands (Windows-safe)

- Install: `cmd /c npm ci`
- Dev: `cmd /c npm run dev`
- Lint: `cmd /c npm run lint`
- Build: `cmd /c npm run build`
- Typecheck: `cmd /c npm run typecheck`

## Backend Commands

- Restore: `dotnet restore backend/LinearPrecision.sln`
- Test: `dotnet test backend/LinearPrecision.sln --no-restore`
- Local infrastructure: run `docker compose up --build` from `backend/` to start `web`, `api`, `worker`, PostgreSQL, Redis, and MinIO

## Verification Expectations

- Frontend changes: lint, build, and typecheck
- Backend changes: relevant `dotnet test` coverage, with Docker-capable integration tests when touched scope requires them
- Docs updated whenever repo architecture, behavior, or workflow changes

## Lint Debt Policy

- Existing raw `<img>` warnings are accepted prototype debt for now
- Lint blockers must be fixed

## Codex Project Scaffolding

- Project config, custom agents, and reusable skills live under `.codex/`
- This detached workspace includes repo operating docs and agent scaffolding, but worktree activation still requires moving the project into its canonical Git clone
