# Codex-to-VS-Code Translation Memo

## Purpose

This workspace was originally scaffolded with Codex-oriented AI customization (`.codex/agents/`, `.codex/skills/`, `config.toml`). This memo maps those concepts to the VS Code + GitHub Copilot + Claude Code architecture that is the primary development environment.

## Concept Mapping

| Codex Concept | VS Code Equivalent | Notes |
|---------------|-------------------|-------|
| **Codex subagents** (`spawn agents in parallel`) | **`runSubagent` tool** + `.claude/agents/` definitions | VS Code subagents are invoked via `runSubagent` with agent name. Agents defined in `.claude/agents/` appear as invocable targets. |
| **Codex custom agent TOML** (`.codex/agents/*.toml`) | **`.claude/agents/*.md`** for subagents + **`*.agent.md`** for chat modes | VS Code has TWO distinct concepts: subagents (delegated programmatically) and chat modes (user-selected). Codex conflated these. |
| **Codex `config.toml`** | **No direct equivalent** | VS Code model selection is per-session via UI. Agent instructions replace config directives. |
| **Codex `model` per agent** | **Not controllable** per agent in VS Code | VS Code uses the globally selected model. `.claude/agents/` can suggest a model keyword but the runtime decides. |
| **Codex `sandbox_mode`** | **Tool restrictions** in `.agent.md` frontmatter | Use `tools:` field to restrict read-only agents from write tools. |
| **Codex skills** (`.codex/skills/*/SKILL.md`) | **`.agents/skills/*/SKILL.md`** | Direct equivalent. Same SKILL.md format works. Moving canonical location to `.agents/skills/` for cross-tool compatibility. |
| **Codex `agents.max_threads`** | **No equivalent** | VS Code manages concurrency internally. The orchestrator can limit parallel `runSubagent` calls manually. |
| **Codex `agents.max_depth`** | **Depth is 1 in VS Code** | Subagents in VS Code cannot spawn their own subagents. Design accordingly. |
| **Codex hooks** (`PreToolUse`, `PostToolUse`) | **`.claude/settings.json` hooks** (Claude Code only) | VS Code Copilot does not support hooks natively. Claude Code IDE does via `.claude/settings.json`. |
| **Codex `spawn_agents_on_csv`** | **No equivalent** | Must be handled with sequential subagent calls or manual orchestration. |
| **Codex `model_reasoning_effort`** | **No equivalent** | Model behavior is controlled by instructions, not a reasoning dial. |
| **Codex `developer_instructions`** | **Markdown body** of `.claude/agents/` or `.agent.md` | Instructions are the markdown content after YAML frontmatter. |
| **Codex `nickname_candidates`** | **No equivalent** | VS Code uses agent name from frontmatter `name:` field. |

## What Transfers Directly

1. **Skill format** — `SKILL.md` files with workflow steps work identically across Codex, VS Code Copilot, and Claude Code.
2. **Agent instruction philosophy** — narrow responsibility, clear job description, anti-scope-creep rules. Same principles apply.
3. **Subagent orchestration pattern** — parent delegates, subagent returns distilled result. Same pattern in VS Code via `runSubagent`.
4. **AGENTS.md** — Respected by Codex, Claude Code, and VS Code Copilot (via `.github/copilot-instructions.md` reference).
5. **Read-only exploration agents** — Limit tools to prevent writes. Works in both systems.

## What Must Be Adapted

1. **Agent definitions** — Codex uses TOML; VS Code uses Markdown with YAML frontmatter. Format conversion needed.
2. **Model pinning** — Codex lets you pin `gpt-5.4-mini` per agent. VS Code doesn't. Instead, write instructions that guide cheaper behavior (brevity, targeted scope).
3. **Chat modes vs subagents** — Codex has one agent concept. VS Code has TWO:
   - **Chat modes** (`*.agent.md` at workspace root) — user selects before chatting
   - **Subagents** (`.claude/agents/*.md`) — delegated programmatically by other agents
4. **Depth limit** — Codex allows `max_depth > 1` for nested delegation. VS Code limits to depth 1. Design flat: coordinator → specialist, never specialist → specialist.
5. **Approval flow** — Codex has interactive approval UI for subagents. VS Code subagents run within the parent's permission context automatically.

## What Should Be Avoided

1. **Do not create Codex TOML agents** expecting them to work in VS Code — they won't be loaded.
2. **Do not rely on `config.toml` model/effort settings** — they are Codex-only runtime config.
3. **Do not design for nested subagent chains** — VS Code depth is 1.
4. **Do not use `spawn_agents_on_csv`** patterns — no equivalent exists.
5. **Do not duplicate agents in both `.codex/agents/` and `.claude/agents/`** unless both tools are actively used. Keep `.codex/` for Codex backward compatibility only.

## Final VS Code-Native Design

```
Instruction layers:
  .github/copilot-instructions.md  → VS Code Copilot reads automatically
  AGENTS.md                         → Cross-tool mandate (Codex + Claude Code)
  CLAUDE.md                         → Claude-specific identity
  .claude/rules/*.md                → File-scoped rules (Claude Code)

User-selectable chat modes:
  pm-lead.agent.md                  → Planning + orchestration
  pm-frontend.agent.md              → Frontend specialist
  pm-backend.agent.md               → Backend specialist
  pm-fullstack.agent.md             → Integration specialist

Delegatable subagents:
  .claude/agents/frontend-owner.md  → Frontend implementation worker
  .claude/agents/backend-owner.md   → Backend implementation worker
  .claude/agents/qa-validator.md    → Quality validation runner
  .claude/agents/repo-cartographer.md → Read-only explorer

Auto-triggered skills:
  .agents/skills/*/SKILL.md         → Canonical cross-tool location

Reusable prompts:
  .github/copilot/prompts/*.prompt.md → Common workflow kickoffs
```
