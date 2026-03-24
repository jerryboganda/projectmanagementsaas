---
name: bug-triage
description: Use when a bug needs reproduction, narrowing, and evidence capture before fixing.
metadata:
  short-description: PM SaaS bug triage
---

# Bug Triage

Use this skill before non-trivial fixes.

## Workflow

1. Reproduce with exact route, steps, and environment assumptions.
2. Capture expected vs actual behavior and any console/runtime evidence.
3. Narrow the boundary: shared shell, shared context, feature-local state, or mock data/type mismatch.
4. Separate facts from hypotheses.
5. Propose fix scope only after reproduction is confirmed.
