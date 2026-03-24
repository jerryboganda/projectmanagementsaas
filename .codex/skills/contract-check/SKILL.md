---
name: contract-check
description: Use when a change introduces or modifies shared data contracts, producer-consumer assumptions, or mock-to-real API transitions in this PM SaaS prototype.
metadata:
  short-description: PM SaaS contract check
---

# Contract Check

Use this skill when a change can affect shared types or future API boundaries.

## Workflow

1. Identify the producer and consumer modules involved.
2. Check `components/*/data.ts`, shared context, and route-level composition for type drift.
3. Call out assumptions that are still mock-only versus ready for a real API contract.
4. Require synchronized updates to types, UI expectations, and docs.
5. Record lasting contract decisions in `docs/decision-log.md`.
