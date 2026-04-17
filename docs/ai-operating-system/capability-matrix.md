# Capability Matrix — VS Code + GitHub Copilot Agent Mode

Generated: 2026-04-16

## Environment

| Capability | Status | Notes |
|------------|--------|-------|
| Agent Mode | **YES** | Running in VS Code with GitHub Copilot |
| Primary Model | **Claude Opus 4.6** | Selected for this session |
| Subagents | **YES** | `runSubagent` tool available; `.claude/agents/` agents are invocable |
| Nested Subagents | **LIMITED** | Subagents cannot spawn their own subagents |
| VS Code Hooks | **NO** | Not natively supported by VS Code Copilot |
| Claude Code Hooks | **YES** | `.claude/settings.json` hooks for Claude Code IDE |
| Agent Plugins | **YES** | User-level plugins at `~/.vscode/agent-plugins/` |
| MCP Servers | **YES** | Tool search available; can configure project MCP |
| Web Research | **YES** | `fetch_webpage` tool available |
| Built-in Tools | **YES** | File read/write/edit, terminal, search, test runner, memory |
| Custom Chat Modes | **YES** | `.agent.md` files at workspace root |
| Prompt Files | **YES** | `.prompt.md` files loadable in chat |
| Instruction Files | **YES** | `.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`, `.instructions.md` |
| Skill Files | **YES** | `SKILL.md` in skill directories auto-load on trigger |

## Workspace Profile

| Attribute | Value |
|-----------|-------|
| Type | Multi-app monorepo (frontend + backend + mobile) |
| Frontend | Next.js 15 + React 19 + TypeScript 5.9 + Tailwind v4 |
| Backend | ASP.NET Core (.NET 9) modular monolith |
| Mobile | Secondary Next.js applet (`Mobile App/`) |
| Database | PostgreSQL 16 + Redis 7 + MinIO (S3) |
| Realtime | SignalR |
| Data Fetching | TanStack Query |
| Testing | Playwright (E2E), MSTest (.NET) |
| Routes | 27 frontend routes |
| Backend Modules | 15+ domain modules |
| Backend Tests | 78 (all passing) |
| Git | NOT initialized — branch workflows blocked |
| Docs | 28+ architecture and planning documents |

## Existing AI Customization (Pre-Consolidation)

| Location | Files | Status |
|----------|-------|--------|
| `AGENTS.md` | 1 | Active cross-tool mandate |
| `CLAUDE.md` | 1 | Active Claude-specific identity |
| `.github/copilot-instructions.md` | 1 | Active but needs update |
| `.claude/agents/` | 3 agents | Active subagents (frontend-owner, qa-validator, repo-cartographer) |
| `.claude/rules/` | 2 rules | Active file-scoped rules |
| `.claude/settings.json` | 1 | Claude Code hooks (protected file warning) |
| `.claude/skills/` | 1 skill | Duplicate of `.agents/skills/feature-plan` |
| `.codex/agents/` | 8 agents | Codex-specific, needs VS Code translation |
| `.codex/skills/` | 6 skills | Codex-specific, move to `.agents/skills/` |
| `.codex/config.toml` | 1 | Codex runtime config (GPT models) |
| `.agents/skills/` | 1 skill | Cross-tool skill directory |
| `docs/agent-skills.md` | 1 | Skill trigger matrix |
| `docs/agent-operating-model.md` | 1 | Operating mandate |

## Model Strategy for This Workspace

| Task Type | Recommended Model | Rationale |
|-----------|-------------------|-----------|
| Planning, architecture, ambiguity | Claude Opus 4.6 | Best reasoning quality |
| Frontend implementation | Claude Opus 4.6 or Sonnet | Complex component logic |
| Backend implementation | Claude Opus 4.6 | C# + SQL + module coordination |
| Codebase exploration | Any available | Read-only, speed matters |
| Quality validation | Any available | Running commands, parsing output |
| Documentation | Any available | Structured writing |
