# AI Operating System for Linear Precision PM SaaS

> A production-grade multi-agent development environment for GitHub Copilot, Claude Code, and Codex.

## Quick Start

1. **Select a chat mode** in VS Code: hit `Ctrl+Shift+P` → "Chat: Change Mode" → pick a `pm-*` agent
2. **Or use default agent mode** — it reads `.github/copilot-instructions.md` automatically
3. **Common workflows** live in `.github/copilot/prompts/` — type `@` in chat to invoke them

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  USER / VS Code Chat                 │
├───────────┬───────────┬────────────┬────────────────┤
│ pm-lead   │pm-frontend│ pm-backend │ pm-fullstack   │
│ (planning)│ (Next.js) │ (ASP.NET)  │ (integration)  │
├───────────┴───────────┴────────────┴────────────────┤
│              Subagent Layer (.claude/agents/)         │
│  frontend-owner │ backend-owner │ qa-validator       │
│  repo-cartographer │ Explore (built-in)              │
├──────────────────────────────────────────────────────┤
│              Skills (.agents/skills/)                 │
│  feature-plan │ bug-triage │ contract-check          │
│  api-integration │ backend-module │ ui-regression    │
│  repo-discovery │ docs-sync                          │
├──────────────────────────────────────────────────────┤
│              Instructions Layer                       │
│  .github/copilot-instructions.md (VS Code Copilot)   │
│  AGENTS.md (cross-tool mandate)                       │
│  CLAUDE.md (Claude-specific)                          │
│  .claude/rules/*.md (file-scoped rules)               │
└──────────────────────────────────────────────────────┘
```

## AUTOMATIC ROUTING — No Manual Invocation Required

**All agents, subagents, skills, and validations fire automatically based on task type. The user NEVER needs to specify which agent to use or which skill to load. The system detects the task context and routes immediately.**

This is enforced at 3 layers simultaneously:
1. `.github/copilot-instructions.md` — VS Code Copilot reads this on every prompt
2. `AGENTS.md` — Cross-tool mandate read by Codex and Claude Code
3. `*.agent.md` mode files — Each mode has its own mandatory routing rules

## Agent Modes (User-Selectable)

| Mode | File | When to Use |
|------|------|-------------|
| **pm-lead** | `pm-lead.agent.md` | Planning, architecture decisions, cross-layer features, multi-perspective review |
| **pm-frontend** | `pm-frontend.agent.md` | Component work, page creation, styling, React patterns, UI bugs |
| **pm-backend** | `pm-backend.agent.md` | C# endpoints, EF Core entities, module creation, background jobs |
| **pm-fullstack** | `pm-fullstack.agent.md` | Wiring frontend hooks to backend APIs, end-to-end feature delivery |

## Subagents (Delegated Automatically)

| Agent | Purpose | Invoked By |
|-------|---------|------------|
| `frontend-owner` | Implements frontend changes | pm-lead, pm-frontend |
| `backend-owner` | Implements backend changes | pm-lead, pm-backend |
| `qa-validator` | Runs build/lint/test validation | All modes after changes |
| `repo-cartographer` | Read-only codebase exploration | Any mode needing context |
| `Explore` | Fast read-only research | Any mode for quick lookups |

## Skills (Auto-Loaded)

Skills load automatically when their trigger conditions are met. See `docs/agent-skills.md` for the full trigger matrix.

| Skill | Trigger |
|-------|---------|
| `feature-plan` | Adding a new feature area |
| `bug-triage` | Bug report, stack trace, failing test |
| `contract-check` | Modifying shared types or API boundary |
| `api-integration` | Wiring frontend to backend endpoint |
| `backend-module` | Creating a new ASP.NET Core module |
| `ui-regression-check` | After UI edits |
| `repo-discovery` | Exploring unfamiliar code |
| `docs-sync` | After structural changes |

## Prompt Files (Reusable Workflows)

Invoke from chat with `@workspace` or by opening the prompt file:

| Prompt | File | Purpose |
|--------|------|---------|
| Audit Feature | `audit-feature.prompt.md` | Deep audit of a feature module |
| New Feature | `new-feature.prompt.md` | Plan + implement a new feature |
| Fix Bug | `fix-bug.prompt.md` | Structured bug diagnosis and fix |
| Integrate API | `integrate-api.prompt.md` | Wire a frontend feature to backend |
| Review Changes | `review-changes.prompt.md` | Multi-perspective code review |
| Hardening Pass | `hardening-pass.prompt.md` | Security, accessibility, performance check |

## Routing Guide

```
User wants to...                          → Use
──────────────────────────────────────────────────
Plan a cross-layer feature                → pm-lead mode
Build/modify a React component            → pm-frontend mode
Add a backend API endpoint                → pm-backend mode
Connect frontend to backend               → pm-fullstack mode
Quick codebase question                   → Default mode + Explore subagent
Fix a bug (unknown layer)                 → pm-lead mode (it delegates)
Run quality checks                        → pm-lead mode → qa-validator subagent
Audit documentation                       → Default mode + docs-sync skill
```

## File Locations

```
.github/copilot-instructions.md     ← VS Code Copilot global instructions
AGENTS.md                           ← Cross-tool operating mandate
CLAUDE.md                           ← Claude-specific project identity
pm-lead.agent.md                    ← Coordinator chat mode
pm-frontend.agent.md                ← Frontend chat mode
pm-backend.agent.md                 ← Backend chat mode
pm-fullstack.agent.md               ← Integration chat mode
.claude/agents/                     ← Subagent definitions
.claude/rules/                      ← File-scoped instruction rules
.agents/skills/                     ← Canonical skill directory
.github/copilot/prompts/            ← Reusable prompt files
docs/ai-operating-system/           ← This documentation
docs/agent-skills.md                ← Skill trigger matrix
docs/agent-operating-model.md       ← Operating mandate details
```

## Current Limitations

1. **No Git repository** — branch-based workflows blocked until canonical Git clone is established
2. **No nested subagents** — subagents cannot spawn their own subagents in VS Code
3. **No VS Code hooks** — Claude Code hooks exist in `.claude/settings.json` but VS Code Copilot does not support hooks natively
4. **Model pinning** — VS Code custom agents cannot force a specific model; the user selects the model globally
5. **Mobile App** — secondary applet under `Mobile App/` has its own package.json and is not covered by root build commands
