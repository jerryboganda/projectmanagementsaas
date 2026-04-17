---
name: contract-check
description: Use when a change introduces or modifies shared data contracts, producer-consumer assumptions, or API boundaries between frontend and backend.
---

# Contract Check

Use this skill when a change can affect shared types or API boundaries.

## Workflow

1. **Identify the producer and consumer modules involved.**
   - Producer: which side creates/sends the data? (backend endpoint or frontend mutation)
   - Consumer: which side reads/renders the data? (frontend component or backend handler)

2. **Check contract surfaces:**
   - Frontend types: `lib/api/contracts.ts` (TypeScript request/response types)
   - Frontend mock data: `components/*/data.ts` (local interfaces)
   - Backend DTOs: `backend/src/LinearPrecision.Shared/` (C# DTOs and entities)
   - API client: `lib/api/client.ts` (method signatures)

3. **Detect mismatches:**
   - Field name differences (camelCase TS vs PascalCase C# — check JSON serialization config)
   - Type differences (string vs enum, nullable vs required, Date vs ISO string)
   - Missing fields (DTO has fields that TypeScript type doesn't, or vice versa)
   - Array vs single object mismatches

4. **Require synchronized updates:**
   - If changing a backend DTO → update `lib/api/contracts.ts` to match
   - If changing a frontend type → verify backend DTO already supports the shape
   - If changing mock data types → note whether the API contract needs to follow

5. **Record lasting contract decisions** in `docs/decision-log.md` when:
   - A breaking change is required
   - A new API contract is established
   - A mock-to-real transition is completed
