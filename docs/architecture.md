# Architecture

Last updated: 2026-03-23

## Overview

Project Management SaaS ("Linear Precision") is a mixed system:

- a root Next.js 15 App Router frontend with a broad PM SaaS MVP surface
- a `backend/` ASP.NET Core 9 modular monolith plus worker service

The backend foundation is real and checked in. The frontend authenticated shell now runs through live auth, workspace, query, realtime, and typed API-client foundations, and the major route surfaces use live hooks or live providers, but several deeper subfeatures remain partial or placeholder.

Canonical engineering SSOT for this repository lives in `docs/project-ssot.md`.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15.5, React 19.2, TypeScript 5.9 |
| Frontend UI | Tailwind CSS v4, Motion, Lucide React, Recharts, `@hello-pangea/dnd` |
| Backend | ASP.NET Core 9 Minimal APIs plus MVC controllers where needed |
| Persistence | EF Core plus PostgreSQL |
| Realtime and jobs | SignalR, Redis, Hangfire |
| Storage | S3-compatible object storage |
| Local deployment | Frontend dev server at repo root, backend Docker Compose under `backend/` |

## Runtime Anchors

| Anchor | File | Meaning |
|--------|------|---------|
| Frontend runtime shell | `app/providers.tsx` | Provider composition and global UI systems |
| Frontend live data layer | `lib/api/client.ts` | Typed API client used by live TanStack Query hooks across the authenticated shell |
| Frontend legacy mock store | `contexts/app-data-context.tsx` | Legacy in-memory scaffolding retained in source only; not mounted in the runtime shell |
| Backend runtime shell | `backend/src/LinearPrecision.Api/Program.cs` | API host, middleware, module registration, SignalR, health checks |

## Runtime Boundaries

- Route entrypoints live in `app/*/page.tsx`
- Most interactive frontend behavior is in client components under `components/*`
- Shared frontend runtime state lives in React providers under `app/providers.tsx` plus TanStack Query hooks across feature surfaces
- There is no single project-wide frontend store now; `contexts/app-data-context.tsx` is legacy unused scaffolding
- The backend runtime lives under `backend/src/LinearPrecision.Api`
- There are currently no root Next.js `app/api/*` route handlers or server actions serving as the main product backend

## Repository Map

```text
app/                        -> Next.js pages and root layout
components/                 -> Frontend feature modules and reusable UI
contexts/                   -> Frontend shared providers and state
hooks/                      -> Frontend hooks
lib/                        -> Frontend utilities
backend/                    -> ASP.NET Core API, worker, persistence, migrations, tests, Docker Compose
docs/                       -> Architecture, plans, decisions, and operating guidance
```

## Current Frontend SSOT

There is no single frontend-wide SSOT in source today.

The live authenticated shell is distributed across:

- `app/providers.tsx` for auth, workspace, query, realtime, toast, inbox, command palette, shortcuts, and onboarding composition
- `lib/api/client.ts` for typed backend access
- feature-level TanStack Query hooks under `hooks/use-*-data.ts`

`contexts/app-data-context.tsx` still exists in source as legacy mock scaffolding, but it is no longer mounted in `app/providers.tsx` and no current source consumers remain outside the file itself.

## Provider Stack

```text
QueryClientProvider
  -> SidebarProvider
    -> AuthProvider
      -> WorkspaceProvider
        -> AppShellGuard
          -> RealtimeProvider
            -> InboxProvider
              -> ToastProvider
                -> CommandPaletteProvider
                  -> GlobalShortcuts
                  -> KeyboardShortcutsDialog
                  -> OnboardingWizard
                  -> {children}
```

## Frontend State Ownership

| Surface | Data source | Status |
|---------|-------------|--------|
| Board | `useBoardData` + typed API client + TanStack Query | partially implemented |
| Calendar | `useCalendarData` + typed API client + TanStack Query | partially implemented |
| Projects | `useProjectsData` + typed API client + TanStack Query | partially implemented |
| Goals | `useGoalsData` + typed API client + TanStack Query | partially implemented |
| Portfolio | `usePortfolioData` + typed API client + TanStack Query | partially implemented |
| Sprints | `useSprintsData` + typed API client + TanStack Query | partially implemented |
| Automations | `useAutomationsData` + typed API client + TanStack Query | partially implemented |
| Time Tracking | `useTimeTrackingData` + typed API client + TanStack Query | partially implemented |
| Intake | `useIntakeData` + typed API client + TanStack Query | partially implemented |
| Templates | `useTemplatesData` + typed API client + TanStack Query | partially implemented |
| Inbox | `InboxProvider` backed by TanStack Query + typed API client | partially implemented |
| Dashboard | `useDashboardData` + typed API client + TanStack Query | partially implemented |
| Docs | `useDocumentsData` + typed API client + TanStack Query | partially implemented |
| Reports | `useReportsData` + typed API client + TanStack Query | partially implemented |
| Settings | `useSettingsData` + typed API client + TanStack Query for core panels | partially implemented |
| Timeline | `useTimelineData` + typed API client + TanStack Query, with local helper transforms only | partially implemented |
| Workload | `useWorkloadData` + typed API client + TanStack Query | partially implemented |

## Backend Runtime

The repository contains a real backend implementation under `backend/`:

- API host: `backend/src/LinearPrecision.Api/Program.cs`
- Module groups: Identity, Workspace, Projects, Tasks, Goals, Sprints, Calendar, Documents, TimeTracking, Intake, Automations, Notifications, Search, Billing, AI, Analytics, Files, Admin
- Persistence: EF Core configurations, interceptors, and migrations under `backend/src/LinearPrecision.Api/Infrastructure/Persistence`
- Worker service: Hangfire-backed background jobs under `backend/src/LinearPrecision.Worker`
- Local infrastructure: PostgreSQL, Redis, MinIO, API, and worker in `backend/docker-compose.yml`

## Data Migration Status

| Module | Current source | Status |
|--------|----------------|--------|
| Board | live hook | partially implemented |
| Projects | live hook | partially implemented |
| Calendar | live hook | partially implemented |
| Portfolio | live hook | partially implemented |
| Goals | live hook | partially implemented |
| Sprints | live hook | partially implemented |
| Automations | live hook | partially implemented |
| Time Tracking | live hook | partially implemented |
| Intake | live hook | partially implemented |
| Templates | live hook | partially implemented |
| Timeline | live hook plus helper transforms | partially implemented |
| Workload | live hook | partially implemented |
| Reports | live hook | partially implemented |
| Docs | live hook | partially implemented |
| Inbox | live provider | partially implemented |
| Settings | live hook for core panels | partially implemented |

## Shared, Write-Sensitive Frontend Surfaces

These files are high-impact and should be serialized for edits:

- `app/layout.tsx`
- `app/providers.tsx`
- `app/globals.css`
- `components/sidebar.tsx`
- `components/header.tsx`
- `contexts/app-data-context.tsx`
- `contexts/inbox-context.tsx`
- `contexts/sidebar-context.tsx`

## Known Gaps

- Many route subfeatures still are not integrated with the checked-in backend runtime
- Several disabled affordances and placeholder panels still exist where backend contracts are missing
- Frontend auth and workspace selection flows are wired into the root app, but still need deeper production hardening and end-to-end verification
- Only an initial CI workflow is checked in; full CD, promotion, rollback, and production deployment automation are still pending
- Partial frontend data migration remains at the subfeature level even though the route surfaces now use live hooks or live providers
