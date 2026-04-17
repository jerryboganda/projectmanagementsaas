---
description: "Multi-perspective code review — runs parallel subagents for correctness, security, performance, and accessibility analysis."
---

# Review Changes

Perform a multi-perspective review of recent changes in this workspace.

## Scope

{{scope_description}}

## Review Perspectives

Run these reviews in parallel using subagents where appropriate:

### 1. Correctness Review
- Do the changes match the stated requirements?
- Are there logic errors, off-by-one issues, or missing edge cases?
- Are TypeScript types correctly used (no `any`, proper nullability)?
- Do mutations handle optimistic updates and rollback correctly?

### 2. Security Review
- Input validation: are user inputs validated before use?
- Auth: are protected routes/endpoints properly guarded?
- XSS: is user-generated content properly escaped?
- CSRF: are state-changing operations protected?
- Secrets: no hardcoded tokens, keys, or credentials?

### 3. Performance Review
- Are expensive computations wrapped in `useMemo` or `useCallback`?
- Are TanStack Query keys stable (no unnecessary refetches)?
- Are large lists virtualized or paginated?
- Backend: are EF Core queries efficient (no N+1, proper includes)?

### 4. Accessibility Review
- Semantic HTML elements used appropriately?
- Interactive elements keyboard-accessible?
- ARIA attributes present where needed?
- Color contrast sufficient for dark theme?
- Focus management correct for modals and side panels?

## Output

For each perspective, provide:
- **Findings**: specific issues with file paths and line references
- **Severity**: critical / high / medium / low
- **Recommendation**: specific fix suggestion

End with a summary table of all findings sorted by severity.
