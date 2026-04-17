---
description: "Structured bug diagnosis and fix — reproduces, narrows, and resolves the issue with validation."
---

# Fix Bug

Diagnose and fix a bug in the Linear Precision PM SaaS workspace.

## Bug Description

{{bug_description}}

## Workflow (load `.agents/skills/bug-triage/SKILL.md`)

### Phase 1: Reproduce

1. Identify the affected route, component, or backend endpoint
2. Trace the exact steps to reproduce
3. Capture expected vs actual behavior

### Phase 2: Narrow

Classify the bug boundary:
- **Shared shell** — affects multiple routes (layout, providers, sidebar, header)
- **Shared context** — state issue in contexts/ (auth, workspace, inbox, realtime)
- **Feature-local** — isolated to one feature's state or rendering
- **Data/contract** — type mismatch between mock data and API contracts
- **Backend** — endpoint logic, validation, EF Core, or domain events

### Phase 3: Fix

- Make the minimal change that resolves the issue
- Do not refactor or improve unrelated code
- If the fix touches a serialized chokepoint, flag it explicitly

### Phase 4: Validate

For frontend fixes:
```bash
cmd /c npm run lint
cmd /c npm run typecheck
cmd /c npm run build
```

For backend fixes:
```bash
dotnet test backend/LinearPrecision.sln --no-restore
```

## Output

- Root cause explanation (1-2 sentences)
- Files changed
- Validation results (pass/fail)
