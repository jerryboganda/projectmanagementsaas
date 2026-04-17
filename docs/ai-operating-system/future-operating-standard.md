# Future Operating Standard

This document defines the rulebook for how AI agents should operate on the Linear Precision PM SaaS workspace going forward.

## Decision Framework

### When the Coordinator Should Stay in Control

- **Cross-layer features** — work that spans frontend and backend simultaneously
- **Architecture decisions** — choosing between approaches, evaluating trade-offs
- **Multi-step planning** — breaking down epics into bounded tasks with dependencies
- **Ambiguity resolution** — interpreting vague requirements, asking targeted questions
- **Result synthesis** — combining subagent findings into a coherent recommendation

### When to Delegate to Subagents

- **Codebase exploration** — mapping code paths, tracing dependencies, understanding patterns → `repo-cartographer` or `Explore`
- **Frontend implementation** — component creation, page modification, styling → `frontend-owner`
- **Backend implementation** — endpoint creation, entity modification, test writing → `backend-owner`
- **Quality validation** — running build/lint/test commands, checking for regressions → `qa-validator`
- **Parallel analysis** — running multiple review perspectives simultaneously → multiple `Explore` subagents

### When Built-in Planning Is Enough

- **Single-file changes** — no plan needed, just implement directly
- **Well-understood patterns** — following existing feature-plan template
- **Bug fixes with clear scope** — reproduce → fix → validate cycle
- **Documentation updates** — targeted doc changes after code changes

### When a Prompt File Should Be Used

- **Recurring workflow** — the same structured process will be repeated (audit, new feature, bug fix, integration, review, hardening)
- **Quality consistency** — ensuring all perspectives are covered every time
- **Onboarding** — helping new users or new sessions produce consistent results
- **Scope boundaries** — preventing scope creep by defining explicit output contracts

### When a Skill Should Be Used

Skills auto-load based on trigger conditions. The system should use a skill when:
- The task matches a trigger in `docs/agent-skills.md`
- The skill's workflow provides concrete steps that prevent mistakes
- The skill references project-specific files, commands, or patterns

Skills should NOT be created for:
- Generic knowledge the model already has (e.g., "how to write a React component")
- One-time operations that won't repeat
- Tasks without a stable multi-step workflow

### When a Hook Should Enforce Policy

Currently, VS Code Copilot does not support hooks. Claude Code hooks in `.claude/settings.json` should be used conservatively:
- **Protected file warning** — already implemented for shared chokepoints
- **Post-edit formatting** — could be added if formatting drift becomes a problem
- Do NOT add: noisy hooks, expensive full-repo scans, or hooks that block on every edit

### When MCP Should Be Invoked

MCP servers should be configured when:
- A workflow repeatedly needs access to a specific external system (GitHub API, database, docs site)
- The integration saves significant manual context-gathering effort
- The trust/security implications are acceptable

Currently: No project-scoped MCP servers are configured. Consider adding:
- **GitHub MCP** — if/when the repo is moved to a Git repository for PR/issue integration
- **PostgreSQL MCP** — for direct database exploration during backend development

### When to Summarize Back to the Main Thread

After every subagent delegation:
- Subagent returns → coordinator receives distilled results
- Coordinator posts: concise finding summary, decision, and next step
- Raw logs stay in the subagent's context, never dumped to main thread

After every implementation cycle:
- List files changed
- Validation results (pass/fail)
- Any remaining work or known issues

## Keeping Future Sessions Clean

### Session Startup Ritual

1. Read `docs/ai-operating-system/README.md` for routing guide
2. Check `docs/project-ssot.md` for current project status
3. If entering unfamiliar area: run `repo-discovery` skill first
4. Select the appropriate agent mode for the task type

### Preventing Context Bloat

- **Delegate exploration** — never paste 500 lines of code into the main thread; use subagents
- **Summarize, don't relay** — subagent results should be 5-15 lines of synthesis, not raw output
- **One task at a time** — complete and validate one bounded change before starting the next
- **Use prompt files** — they enforce structured output contracts that prevent rambling

### Keeping Implementation, Validation, and Documentation Synchronized

The completion checklist for any significant change:

1. **Implement** — make the code changes
2. **Validate** — run the appropriate build/lint/test commands
3. **Document** — check if `docs-sync` skill should be triggered
4. **Update SSOT** — if feature status changed, update `docs/project-ssot.md`

### Adding to the Operating System

When a new workflow becomes common enough to deserve automation:

1. **Skill** — if it's a multi-step workflow with stable steps that prevents mistakes
2. **Prompt file** — if it's a structured kickoff template with variable inputs
3. **Agent mode** — if it's a fundamentally different working context (unlikely to need more than the 4 current modes)
4. **Subagent** — if it's a specialized worker role (unlikely to need more than the 4 current subagents)
5. **Rule file** — if it's a file-pattern-scoped coding convention (`.claude/rules/*.md`)

## Maintenance Schedule

- **Per session:** Read the operating system README before complex work
- **Per sprint:** Review `docs/agent-skills.md` for skill relevance; remove unused skills
- **Per quarter:** Evaluate whether agent modes and subagents still match the actual work patterns
- **After major refactors:** Run `docs-sync` skill; update `docs/ai-operating-system/README.md` if agent routing changed
