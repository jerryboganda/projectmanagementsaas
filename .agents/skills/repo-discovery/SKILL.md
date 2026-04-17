---
name: repo-discovery
description: Use when starting work on an unfamiliar area of the codebase. Triggered when the agent cannot fully trace the affected code paths in immediate context.
---

# Repo Discovery

Use this skill when implementation should start with understanding code ownership and flow.

## Workflow

1. **Map route to feature module.**
   - Trace `app/<route>/page.tsx` → `components/<feature>/*`
   - Identify which layout, surface, toolbar, and detail components exist.

2. **Identify shared chokepoints and whether the request touches them.**
   - Serialized: `app/layout.tsx`, `app/providers.tsx`, `app/globals.css`, `components/sidebar.tsx`, `components/header.tsx`, `contexts/inbox-context.tsx`
   - If the task touches any of these, flag as requiring serialized editing.

3. **Trace state ownership.**
   - Local state: `useState` in the feature's layout component
   - Context state: which contexts from `contexts/` are consumed?
   - Server state: which hook from `hooks/use-<feature>-data.ts` is used?
   - API layer: which methods in `lib/api/client.ts` are called?

4. **Map backend module (if applicable).**
   - Which `backend/src/LinearPrecision.Api/Modules/<Module>/` owns this domain?
   - What endpoints exist? What DTOs?
   - Check `docs/frontend-to-backend-integration-matrix.md` for the mapping.

5. **Summarize safe zones.**
   - Safe parallel zones: disjoint feature folders
   - Serialized zones: shared chokepoints
   - Contract boundaries: data.ts types, lib/api/contracts.ts, backend DTOs
