---
name: ui-regression-check
description: Use when validating UI changes for regressions in this Next.js PM SaaS prototype.
metadata:
  short-description: PM SaaS UI regression check
---

# UI Regression Check

Use this skill after UI edits.

## Workflow

1. Verify the changed route flow first.
2. Check loading, empty, error, and success states for touched surfaces.
3. If shared chokepoints changed, run spot checks across at least two unrelated routes.
4. Run `cmd /c npm run lint`, `cmd /c npm run typecheck`, and `cmd /c npm run build`.
5. Report pass/fail and remaining risk clearly.
