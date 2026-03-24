---
name: docs-sync
description: Use when behavior, architecture, workflow, or operating guidance changed and repo docs need to be synchronized in this PM SaaS prototype.
metadata:
  short-description: PM SaaS docs sync
---

# Docs Sync

Use this skill after changes that should persist beyond the current chat.

## Workflow

1. Identify which durable docs are affected: `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/decision-log.md`, or `docs/PLANS.md`.
2. Update only the docs that changed behavior or workflow actually requires.
3. Keep docs concise, repo-specific, and aligned with the current codebase.
4. Note unresolved gaps or intentional debt instead of hiding them.
5. Verify the updated docs do not contradict the current commands or architecture.
