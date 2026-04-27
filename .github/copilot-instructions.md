# Copilot Instructions — Linear Precision PM SaaS

## MANDATORY AUTOMATIC ROUTING (READ THIS FIRST)

**Every single task MUST be automatically routed through the correct agents, subagents, and skills. NEVER ask the user which agent to use. NEVER ask permission to invoke a skill or subagent. Detect the task type and route immediately.**

### Automatic Subagent Routing Rules

On EVERY task, classify it and auto-delegate:

| If the task involves... | AUTOMATICALLY do this |
|---|---|
| Understanding unfamiliar code, tracing dependencies, mapping architecture | Immediately delegate to `Explore` or `repo-cartographer` subagent |
| Any frontend change (component, page, style, React, Tailwind, hook, context) | Immediately delegate to `frontend-owner` subagent for implementation |
| Any backend change (C# endpoint, EF Core, module, DTO, validator, test) | Immediately delegate to `backend-owner` subagent for implementation |
| Changes spanning BOTH frontend and backend | Delegate frontend portion to `frontend-owner` and backend portion to `backend-owner` (sequentially, not parallel on shared files) |
| Running build, lint, typecheck, dotnet test, or checking for regressions | Immediately delegate to `qa-validator` subagent |
| Code review, security audit, or multi-perspective analysis | Run multiple `Explore` subagents in parallel for different concerns |
| Any task after significant implementation is done | AUTOMATICALLY run `qa-validator` subagent to validate — do NOT skip this |

### Automatic Skill Loading Rules

On EVERY task, check these triggers and load the SKILL.md WITHOUT asking:

| If the task involves... | AUTOMATICALLY load this skill |
|---|---|
| Adding a new feature module, page, or component directory | `.agents/skills/feature-plan/SKILL.md` |
| A bug report, stack trace, exception, or failing test | `.agents/skills/bug-triage/SKILL.md` |
| Modifying shared types, DTOs, `lib/api/contracts.ts`, or `data.ts` schemas | `.agents/skills/contract-check/SKILL.md` |
| Wiring frontend hooks to backend API endpoints | `.agents/skills/api-integration/SKILL.md` |
| Creating a new backend module | `.agents/skills/backend-module/SKILL.md` |
| After completing any substantive UI change | `.agents/skills/ui-regression-check/SKILL.md` |
| Exploring unfamiliar code before making changes | `.agents/skills/repo-discovery/SKILL.md` |
| After structural or architectural changes | `.agents/skills/docs-sync/SKILL.md` |

**Multiple skills can apply to one task — load ALL that match.**

### Automatic Validation (NEVER SKIP)

After ANY code change, AUTOMATICALLY run validation:
- Frontend changes → `cmd /c npm run lint; cmd /c npm run typecheck; cmd /c npm run build`
- Backend changes → `dotnet test backend/LinearPrecision.sln --no-restore`
- Cross-layer changes → BOTH of the above

Do NOT wait for the user to ask for validation. Do NOT skip it.

---

## Project Identity

Mixed PM SaaS codebase: Next.js 16 App Router frontend at root, ASP.NET Core .NET 9 modular monolith under `backend/`, secondary mobile applet under `mobile/`.

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript 6 strict, Tailwind CSS v4, Motion, Lucide React, Recharts, TanStack Query, @hello-pangea/dnd
- **Backend:** ASP.NET Core .NET 9, EF Core, PostgreSQL 16, Redis 7, MinIO, SignalR, Hangfire
- **Testing:** Vitest (frontend unit), Playwright (E2E), xUnit (.NET)

## Serialized Chokepoints (NEVER edit in parallel)

`app/layout.tsx`, `app/providers.tsx`, `app/globals.css`, `components/sidebar.tsx`, `components/header.tsx`, `contexts/inbox-context.tsx`

## Safe Parallelism

Read-heavy exploration, disjoint feature-folder edits, lint/build triage can run in parallel.

## Custom Agent Modes (user can select for focused work)

- `pm-lead` — Cross-layer planning and orchestration
- `pm-frontend` — Next.js component and page work
- `pm-backend` — ASP.NET Core endpoint and module work
- `pm-fullstack` — Frontend-backend integration

## Prompt Files

Available in `.github/copilot/prompts/`: `audit-feature`, `new-feature`, `fix-bug`, `integrate-api`, `review-changes`, `hardening-pass`.

## Key References

- `docs/ai-operating-system/README.md` — Agent architecture documentation
- `docs/agent-skills.md` — Skill trigger matrix
- `docs/agent-operating-model.md` — Operating mandate
- `docs/bootstrap-report.md` — Repository overview
- `docs/architecture.md` — Technical architecture
- `docs/project-ssot.md` — Current status and feature matrix
- `docs/frontend-to-backend-integration-matrix.md` — API endpoint mapping