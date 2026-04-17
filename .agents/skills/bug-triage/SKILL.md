---
name: bug-triage
description: Use when a bug needs reproduction, narrowing, and evidence capture before fixing. Triggered by bug reports, stack traces, exceptions, or failing tests.
---

# Bug Triage

Use this skill before non-trivial fixes.

## Workflow

1. **Reproduce** with exact route, steps, and environment assumptions.
   - Frontend: which route? What state? What user action?
   - Backend: which endpoint? What request payload? What response?
   - Check browser console, network tab, or server logs for evidence.

2. **Capture** expected vs actual behavior and any console/runtime evidence.
   - Screenshot or describe the exact failure.
   - Include error messages, stack traces, HTTP status codes.

3. **Narrow the boundary**:
   - **Shared shell** — affects multiple routes (layout.tsx, providers.tsx, sidebar.tsx, header.tsx)
   - **Shared context** — state corruption in contexts/ (auth, workspace, inbox, realtime)
   - **Feature-local state** — useState/useMemo in feature layout component
   - **Data/type mismatch** — mock data in data.ts vs API contract in lib/api/contracts.ts
   - **Backend** — endpoint logic, validation, EF Core query, or domain event

4. **Separate facts from hypotheses.** Label each finding as confirmed or suspected.

5. **Propose fix scope** only after reproduction is confirmed.
   - Identify the minimal set of files to change.
   - Flag if the fix touches serialized chokepoints (layout, providers, sidebar, header, inbox-context).
