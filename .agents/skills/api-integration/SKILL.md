---
name: api-integration
description: Use when wiring a frontend feature's TanStack Query hooks to a backend ASP.NET Core API endpoint. Covers contract alignment, hook updates, error handling, and real-time subscription.
---

# API Integration Workflow

Use this skill when connecting a frontend feature to its backend API.

## Steps

1. **Identify the integration boundary**
   - Which frontend feature? → `components/<feature>/`, `hooks/use-<feature>-data.ts`
   - Which backend module? → `backend/src/LinearPrecision.Api/Modules/<Module>/`
   - Check `docs/frontend-to-backend-integration-matrix.md` for existing mapping

2. **Verify backend endpoint exists**
   - Read `Modules/<Module>/Endpoints/` for route definitions
   - Check HTTP method, route pattern, request/response shapes
   - If endpoint doesn't exist, create it following the module's endpoint pattern

3. **Align contracts**
   - Compare backend C# DTO with `lib/api/contracts.ts` TypeScript type
   - Update TypeScript type to match C# DTO exactly (field names, types, nullability)
   - Pay attention to: enum representation, date format (ISO string vs DateTime), nested objects

4. **Update API client**
   - Add or verify method in `lib/api/client.ts`
   - Follow existing pattern: typed fetch with proper HTTP method and path
   - Include auth header injection via the client's built-in mechanism

5. **Update TanStack Query hook**
   - Wire query to API client method instead of mock data
   - Query key convention: `["resource", "scope", workspaceId, ...params]`
   - Configure `staleTime`, `refetchOnWindowFocus` consistent with existing hooks
   - For mutations: implement `onMutate` (optimistic), `onError` (rollback), `onSettled` (invalidate)

6. **Handle real-time (if needed)**
   - Subscribe to SignalR hub events in `contexts/realtime-context.tsx`
   - Invalidate relevant TanStack Query keys when real-time events arrive

7. **Handle errors**
   - Surface API errors in the UI (loading/error/empty states in layout component)
   - Use `lib/api/error-utils.ts` for error parsing

8. **Validate**
   - Run `cmd /c npm run typecheck` and `cmd /c npm run build`
   - Run `dotnet test backend/LinearPrecision.sln --no-restore`
   - Verify the feature renders correctly with API data
