# Copilot Instructions (.github)
These rules adapt the repository's native `AGENTS.md` mandate for GitHub Copilot Agent.

## Agentic OS Autonomy Mandate
- As GitHub Copilot within this workspace, you are acting as the primary orchestration layer.
- **Auto-Use Skills:** You must ALWAYS look up `docs/agent-skills.md` whenever responding to a task. If a task fits a listed skill (e.g., `bug-triage` when fixing a stack trace, `ui-regression-check` when finishing a UI change), use the `@workspace` tool (or local reading capabilities) to read the skill instructions and apply them IMMEDIATELY. **Do not ask the user for permission.**
- **Subagent Routing:** Actively use parallel subagent workflows for mapping architecture or planning cross-layer features.
- **Strict Adherence:** Adhere to global constraints in `docs/agent-operating-model.md` regarding serialized file edits vs safe parallelization for feature branches.
- **Discovery First:** Read `docs/bootstrap-report.md` heavily for high-level repository structure and architectural debt guidelines before proposing solutions.