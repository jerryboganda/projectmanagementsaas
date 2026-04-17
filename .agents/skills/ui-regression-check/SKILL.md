---
name: ui-regression-check
description: Use when validating UI changes for regressions. Triggered after substantive frontend edits or Tailwind refactors.
---

# UI Regression Check

Use this skill after UI edits to catch regressions.

## Workflow

1. **Verify the changed route flow first.**
   - Navigate to the affected route mentally or via dev server.
   - Confirm the primary user flow still works.

2. **Check all UI states for touched surfaces:**
   - Loading state (spinner/skeleton)
   - Empty state (no data message)
   - Error state (error boundary or inline error)
   - Success state (normal data rendering)
   - Interactive state (selection, hover, active)

3. **If shared chokepoints changed, spot-check across routes:**
   - `app/layout.tsx` → check at least 3 different routes
   - `app/providers.tsx` → check auth flow + data loading + realtime
   - `app/globals.css` → check typography, colors, spacing across 2+ routes
   - `components/sidebar.tsx` → check navigation highlighting on 3+ routes
   - `components/header.tsx` → check search, notifications, user menu
   - `contexts/inbox-context.tsx` → check inbox badge count + notification actions

4. **Run validation commands:**
   ```bash
   cmd /c npm run lint
   cmd /c npm run typecheck
   cmd /c npm run build
   ```

5. **Report pass/fail and remaining risk clearly.**
   - List any warnings (accepted prototype debt like raw `<img>` is OK).
   - Flag anything that needs manual visual verification.
