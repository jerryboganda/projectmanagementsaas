---
name: docs-sync
description: Use when behavior, architecture, workflows, or operating guidance has changed and repo docs need to be synchronized.
---

# Docs Sync

Use this skill after changes that should persist beyond the current chat.

## Workflow

1. **Identify which docs are affected:**
   - `README.md` — project overview and getting started
   - `AGENTS.md` — cross-tool operating mandate
   - `docs/architecture.md` — technical architecture and runtime anchors
   - `docs/project-ssot.md` — source of truth status and feature matrix
   - `docs/decision-log.md` — technical decisions
   - `docs/PLANS.md` — active implementation plans
   - `docs/frontend-to-backend-integration-matrix.md` — API endpoint mapping
   - `docs/domain-model.md` — entity relationships
   - `docs/agent-skills.md` — skill trigger matrix
   - `docs/agent-operating-model.md` — operating mandate

2. **Update only the docs that the actual change requires.**
   - Do not update docs speculatively.
   - Do not add docs for unchanged behavior.

3. **Keep docs concise, repo-specific, and aligned with the current codebase.**
   - Verify file paths and commands are still correct.
   - Remove references to deleted files or deprecated patterns.

4. **Note unresolved gaps** or intentional debt instead of hiding them.
   - Use a `> ⚠️ Known gap:` callout for documented technical debt.

5. **Verify the updated docs do not contradict:**
   - Build/test commands in `CLAUDE.md` and `AGENTS.md`
   - Architecture described in `docs/architecture.md`
   - Feature matrix in `docs/project-ssot.md`
