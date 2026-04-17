---
description: "Security, accessibility, and performance hardening pass across the workspace or a specific feature."
---

# Hardening Pass

Run a hardening pass on **{{target}}** covering security, accessibility, and performance.

## Security Hardening

1. **Authentication & Authorization**
   - Review auth context and JWT handling in `contexts/auth-context.tsx`
   - Verify protected routes redirect unauthenticated users
   - Check backend endpoint authorization attributes

2. **Input Validation**
   - Frontend: review form inputs and user-controlled data
   - Backend: verify FluentValidation rules on all endpoints
   - Check for SQL injection, XSS, and path traversal vectors

3. **Data Exposure**
   - Review API responses for over-fetching sensitive data
   - Check that error messages don't leak internal details
   - Verify no secrets in client-side code or environment variables

## Accessibility Hardening

1. **Semantic Structure** — headings, landmarks, lists, tables used correctly
2. **Keyboard Navigation** — all interactive elements reachable and operable
3. **Screen Reader** — ARIA labels, live regions, role attributes
4. **Visual** — color contrast, focus indicators, text sizing
5. **Motion** — `prefers-reduced-motion` respected for animations

## Performance Hardening

1. **Frontend Bundle** — are heavy dependencies tree-shaken? Any unnecessary imports?
2. **Rendering** — memo usage for expensive components, stable callback references
3. **Data Fetching** — proper staleTime, deduplication, prefetching where valuable
4. **Backend** — EF Core query efficiency, proper async/await, no blocking calls

## Output

Prioritized finding list with:
- Category (security / a11y / performance)
- Severity (critical / high / medium / low)
- File and location
- Specific recommendation
