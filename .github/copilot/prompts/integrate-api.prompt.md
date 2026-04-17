---
description: "Wire a frontend feature to its backend API endpoint — aligns contracts, updates hooks, and validates the full data flow."
---

# Integrate API

Wire the **{{feature}}** frontend feature to its backend API endpoint.

## Workflow (load `.agents/skills/api-integration/SKILL.md`)

### Phase 1: Map the Integration

1. Frontend side:
   - Component: `components/{{feature}}/`
   - Hook: `hooks/use-{{feature}}-data.ts`
   - Current data source: mock data in `data.ts` or API client?

2. Backend side:
   - Module: `backend/src/LinearPrecision.Api/Modules/{{Module}}/`
   - Endpoints available?
   - DTOs defined?

3. Check `docs/frontend-to-backend-integration-matrix.md` for existing mapping.

### Phase 2: Align Contracts (load `.agents/skills/contract-check/SKILL.md`)

- Compare C# DTO fields with `lib/api/contracts.ts` TypeScript types
- Update TypeScript contracts to match backend exactly
- Pay attention to: casing, nullability, date formats, enum representation

### Phase 3: Wire the Hook

- Update `lib/api/client.ts` with new methods if needed
- Update `hooks/use-{{feature}}-data.ts` to call API client
- Configure TanStack Query: keys, staleTime, mutations with optimistic updates
- Add SignalR subscription if real-time updates needed

### Phase 4: Handle Edge Cases

- Loading state (skeleton/spinner)
- Error state (API errors surfaced in UI)
- Empty state (no data)
- Offline/network failure handling

### Phase 5: Validate

```bash
cmd /c npm run typecheck
cmd /c npm run build
dotnet test backend/LinearPrecision.sln --no-restore
```

## Output

- Contract alignment summary
- Files changed (frontend and backend)
- Validation results
