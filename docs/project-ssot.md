# Project SSOT

Last updated: 2026-03-24 (full integration suite and browser E2E verification pass)

## Purpose

This document is the canonical engineering single source of truth for the repository.

When this document conflicts with code or fresh checks, trust:

1. source code and passing verification
2. database schema and migrations
3. this document
4. older roadmap or architecture notes

## Current Verdict

This project is not honestly "100% complete" and it is not yet production-ready.

What is true today:

- The frontend and backend both build successfully.
- Frontend lint and typecheck pass for the current codebase.
- Backend API unit tests and worker tests pass.
- The full backend integration suite now passes end to end.
- Browser E2E coverage now exists for auth redirect behavior and the AI provider attach/remove flow.
- The board task-detail contract for comments, checklist items, watchers, and attachments is now aligned across frontend and backend source.
- The board surface now consumes the existing SignalR board hub to invalidate live task and task-detail data.
- The AI copilot now uses a saved OpenAI-compatible provider connection instead of local demo/offline fallback replies.
- First-time AI provider setup now defaults to enabled so attaching a provider actually activates copilot usage automatically.
- The previous SSOT overstated some gaps and overstated some readiness claims at the same time.

What is still blocking a production-ready label:

- This workspace is not a Git repository, so normal branch/PR/release operations are not active here.
- Realtime is no longer dormant, but only the board surface is wired; broader multi-surface live behavior is still incomplete and not fully runtime-proven here.
- The AI copilot now has a real provider-backed path, but it is still limited to a single saved OpenAI-compatible connection per user/workspace and is not yet runtime-proven across broader AI workflows like streaming and tool use.
- Browser coverage is still narrow and does not yet prove board drag/drop, attachments, billing-critical flows, invitation flows, or broader workspace lifecycle paths.
- Active deployment validation and operational readiness work remain incomplete or unverified in this pass.

## Verified Today

Reviewed on 2026-03-24 with local commands and code inspection.

| Check | Result | Notes |
|---|---|---|
| `cmd /c npm run lint` | PASS | 7 warnings, all raw `<img>` optimization debt |
| `cmd /c npm run typecheck` | PASS | Clean |
| `cmd /c npm run build` | PASS | Build also linted/types-checked successfully |
| `dotnet build backend/src/LinearPrecision.Api/LinearPrecision.Api.csproj --no-restore` | PASS | API compiles |
| `dotnet test backend/tests/LinearPrecision.Api.Tests/LinearPrecision.Api.Tests.csproj --no-restore` | PASS | 37/37 |
| `dotnet test backend/tests/LinearPrecision.Worker.Tests/LinearPrecision.Worker.Tests.csproj --no-restore` | PASS | 10/10 |
| `dotnet build backend/tests/LinearPrecision.Integration.Tests/LinearPrecision.Integration.Tests.csproj --no-restore` | PASS | Integration test project compiles |
| `dotnet test backend/tests/LinearPrecision.Integration.Tests/LinearPrecision.Integration.Tests.csproj --no-restore` | PASS | 31/31 |
| `cmd /c npm run e2e` | PASS | Playwright Chromium: auth redirect + AI provider save/remove |
| `node --test output/frontend-tests/presigned-upload.test.js` | PASS | Presigned upload helper test passes |

## Frontend Reality

### Verified Product Runtime

- Primary product routes are wrapped in `ErrorBoundary` components under `app/`.
- `app/providers.tsx` mounts `AuthProvider`, `WorkspaceProvider`, `RealtimeProvider`, `InboxProvider`, `ToastProvider`, `AiCopilotProvider`, and the command palette stack.
- `contexts/app-data-context.tsx` still exists in source, but it is not mounted in the runtime provider tree.
- `AiCopilotProvider` is mounted in runtime, contrary to the older SSOT.
- The copilot now loads persisted AI provider settings from the API, shows real configuration/error state, and no longer synthesizes local demo assistant replies.

### Board Subresource Status

The board task detail surface is no longer accurately described as "UI missing".

Verified in source:

- `components/board/task-detail.tsx` renders checklist, comments, watchers, and attachments sections.
- `components/board/board-layout.tsx` loads and passes those datasets and actions into task detail.
- `hooks/use-board-data.ts` exposes mutations and queries for those subresources.
- `lib/api/client.ts` now matches backend request/response contracts for task comments, checklist items, watchers, and attachment uploads.
- Attachment upload now performs both steps: request presigned upload metadata and upload the actual file bytes to the returned URL.
- Board task cards now use the real `attachmentCount` returned by the backend instead of hardcoding `0`.
- The board hook now subscribes to `/hubs/board` and invalidates board/task-detail queries when task events arrive.

### Frontend Debt Still Open

- 7 raw `<img>` warnings remain. This is accepted prototype debt per repo policy, but still not ideal for production performance.
- Realtime invalidation is board-only at the moment; other feature surfaces still do not consume SignalR updates.
- The settings integrations panel now includes a live AI provider form that saves a per-user OpenAI-compatible base URL, model, enable flag, and protected API key.
- Broader AI UX remains incomplete: no streaming UX, no tool calling, and no provider rotation.
- Shared `FormField` labels are now programmatically bound to inputs, which improves accessibility and makes browser automation reliable on the live auth/settings surfaces.

## Backend Reality

### Verified Backend State

- The API project compiles successfully.
- API unit tests pass.
- Worker tests pass.
- SignalR hubs are registered at `/hubs/board`, `/hubs/notifications`, `/hubs/presence`, and `/hubs/ai-stream`.
- Task comment, checklist, watcher, and attachment endpoints are registered from `backend/src/LinearPrecision.Api/Modules/Tasks/TasksModule.cs`.
- Task and task-subresource writes now publish board events so the frontend board can refresh live data.
- Npgsql dynamic JSON is now explicitly enabled for EF PostgreSQL connections so persisted JSON/primitive collection fields work in Docker-backed integration environments.

### Board Contract Work Completed In This Pass

The task subresource API was previously incomplete for the frontend already present in source. That gap is now closed in code.

Implemented:

- `GET /api/v1/tasks/{taskId}/comments`
- `GET /api/v1/tasks/{taskId}/checklist`
- `GET /api/v1/tasks/{taskId}/watchers`
- `GET /api/v1/tasks/{taskId}/attachments`
- `POST /api/v1/tasks/{taskId}/attachments/upload`
- `DELETE /api/v1/tasks/{taskId}/attachments/{attachmentId}`

Also added:

- response models for comment/checklist/watcher/attachment list endpoints
- attachment upload request validation
- storage service test double wiring for integration tests
- targeted integration tests covering list flows and attachment upload/delete flow

### AI Contract Work Completed In This Pass

Implemented:

- `GET /api/v1/ai/provider`
- `PUT /api/v1/ai/provider`
- `DELETE /api/v1/ai/provider`
- provider-backed assistant generation from `POST /api/v1/ai/conversations/{conversationId}/messages`

Also added:

- a tenant-scoped `AIProviderConnection` entity plus migration
- protected API key storage via ASP.NET Core Data Protection
- a generic OpenAI-compatible chat completions client
- integration coverage covering the full suite plus provider save/load and provider-backed message replies
- frontend settings UI for attaching provider name, base URL, model, and API key

### Backend Gaps Still Blocking A Production Claim

- Realtime hub registration exists, but this pass did not verify every end-to-end event path beyond the board refresh flow already implemented.
- Production operations such as active deployment validation, secrets handling, backups, alerts, and incident runbooks were not completed or proven in this pass.

## SSOT Drift Corrected

The previous SSOT was stale in several important ways. These points are now corrected:

- `AiCopilotProvider` is mounted in the live provider tree.
- Product routes already use `ErrorBoundary` wrappers.
- A CI workflow file exists at `.github/workflows/ci.yml`.
- Board comments, checklist, watchers, and attachments already had frontend UI in task detail.
- The real gap was the backend/frontend contract and attachment upload flow, which is now implemented in source.
- The realtime provider now has a real board consumer instead of sitting unused in the runtime shell.
- `next.config.ts` no longer suppresses lint failures during build.

## Remaining Launch Blockers

These are the highest-confidence blockers still standing after this pass:

1. Move the project into a canonical Git clone so CI/CD, branching, and release workflows can operate normally.
2. Expand browser E2E coverage beyond the new auth/AI baseline into workspace lifecycle, board flows, attachments, invitations, and billing-critical paths.
3. Expand realtime behavior beyond the board surface and prove it end-to-end under live runtime conditions.
4. Extend AI beyond the new single-connection OpenAI-compatible baseline and prove it with broader runtime and browser coverage.
5. Finish production operations work that was not proven here: secrets management, deploy verification, backups, alerting, and runbooks.

## Runtime Anchors

| Area | Canonical File |
|---|---|
| Frontend provider tree | `app/providers.tsx` |
| Frontend API client | `lib/api/client.ts` |
| Frontend board data orchestration | `hooks/use-board-data.ts` |
| Frontend board task detail | `components/board/task-detail.tsx` |
| Frontend realtime provider | `contexts/realtime-context.tsx` |
| Backend API host | `backend/src/LinearPrecision.Api/Program.cs` |
| Backend task endpoints | `backend/src/LinearPrecision.Api/Modules/Tasks/TasksModule.cs` |
| Backend task attachments | `backend/src/LinearPrecision.Api/Modules/Tasks/Endpoints/TaskAttachmentEndpoints.cs` |
| Backend integration fixture | `backend/tests/LinearPrecision.Integration.Tests/Fixtures/ApiFixture.cs` |

## Bottom Line

The codebase is materially stronger than the previous SSOT claimed in some areas, and materially less production-ready than it claimed in others.

After this pass, the correct statement is:

- core frontend and backend builds are green
- the full backend integration suite passes in this environment
- browser E2E now proves auth redirect and AI provider attach/remove against the live app
- board task-detail subresources are implemented across both layers in source
- documentation is now aligned with the code
- the project still requires broader E2E scope, wider realtime completion, and operational hardening before it can be called production-ready
