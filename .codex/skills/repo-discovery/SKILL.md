---
name: repo-discovery
description: Use when a request starts with repository exploration, ownership mapping, or route tracing for this Next.js PM SaaS prototype.
metadata:
  short-description: PM SaaS repo discovery
---

# Repo Discovery

Use this skill when implementation should start with understanding code ownership and flow.

## Workflow

1. Map `app/*/page.tsx` to `components/<feature>/*`.
2. Identify shared chokepoints and whether the request touches them.
3. Trace state ownership: local feature state vs `contexts/inbox-context.tsx`.
4. Note mock data contracts in `components/*/data.ts`.
5. Summarize safe parallel zones and serialized edit zones.
