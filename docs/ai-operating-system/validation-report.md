# Validation Report — AI Operating System

Generated: 2026-04-16

## Methodology

Each validation flow tests whether the agent system routes work correctly, outputs are concise, there are no role collisions, and context noise is minimal.

## Flow 1: Understanding a New Area — Board Feature Audit

**Scenario:** User asks "audit the board feature module"

**Expected routing:**
1. User selects `pm-lead` mode or uses `audit-feature.prompt.md`
2. System loads `repo-discovery` skill (unfamiliar area trigger)
3. pm-lead delegates to `repo-cartographer` or `Explore` subagent for parallel exploration
4. Subagent returns: file list, component structure, state flow, API integration status
5. pm-lead synthesizes findings into structured audit report

**Validation:**
- ✅ `pm-lead.agent.md` has explicit delegation rules for exploration
- ✅ `repo-cartographer` has full-stack awareness (frontend routes + backend modules)
- ✅ `audit-feature.prompt.md` provides structured template with all audit areas
- ✅ `repo-discovery` skill covers route mapping, state tracing, and backend module mapping
- ✅ No role collision — exploration is read-only, coordinator synthesizes

---

## Flow 2: Planning a Cross-Layer Feature

**Scenario:** User asks "plan a notification preferences feature"

**Expected routing:**
1. User starts in `pm-lead` mode
2. System loads `feature-plan` skill (new feature trigger)
3. pm-lead uses `Explore` subagent to check existing notification code
4. pm-lead creates phased plan: frontend components + backend module + API integration
5. Plan separates parallelizable work from serialized chokepoints

**Validation:**
- ✅ `pm-lead.agent.md` handles cross-layer planning with delegation rules
- ✅ `feature-plan` skill provides structured 6-step workflow
- ✅ Contract boundaries identified: `lib/api/contracts.ts` ↔ backend DTOs
- ✅ Serialized chokepoint: `app/providers.tsx` if new context needed
- ✅ No overlap — pm-lead plans, frontend-owner implements frontend, backend-owner implements backend

---

## Flow 3: Frontend Component Implementation

**Scenario:** User asks "add a filter dropdown to the projects toolbar"

**Expected routing:**
1. User selects `pm-frontend` mode
2. Agent reads `components/projects/projects-toolbar.tsx`
3. Implements filter dropdown following Tailwind dark theme
4. Runs `ui-regression-check` skill after implementation
5. Validates with `cmd /c npm run build`

**Validation:**
- ✅ `pm-frontend.agent.md` has detailed component pattern rules
- ✅ Tool access includes Read, Write, Edit (full implementation capability)
- ✅ `ui-regression-check` skill auto-triggers after UI edits
- ✅ Anti-scope-creep: agent will not touch backend code
- ✅ No role collision — pm-frontend is self-contained for frontend work

---

## Flow 4: Backend API Endpoint Creation

**Scenario:** User asks "create a GET /api/notifications endpoint"

**Expected routing:**
1. User selects `pm-backend` mode
2. Agent reads existing Notifications module structure
3. Loads `backend-module` skill if creating new module (or extends existing)
4. Creates endpoint following minimal API pattern
5. Writes MSTest unit test
6. Validates with `dotnet test`

**Validation:**
- ✅ `pm-backend.agent.md` has detailed module pattern and validation rules
- ✅ `backend-module` skill provides 10-step workflow for new modules
- ✅ Anti-scope-creep: agent will not modify frontend code
- ✅ Backend rules in `.claude/rules/backend.md` active for `backend/**/*.cs` files
- ✅ No role collision — pm-backend is isolated to backend work

---

## Flow 5: Full-Stack API Integration

**Scenario:** User asks "wire the goals feature to the backend goals API"

**Expected routing:**
1. User selects `pm-fullstack` mode
2. System loads `api-integration` skill (frontend-to-backend wiring trigger)
3. Agent checks `docs/frontend-to-backend-integration-matrix.md` for mapping
4. Agent compares C# DTOs with TypeScript contracts
5. Updates `lib/api/contracts.ts`, `lib/api/client.ts`, `hooks/use-goals-data.ts`
6. Loads `contract-check` skill for validation
7. Runs both frontend build and backend tests

**Validation:**
- ✅ `pm-fullstack.agent.md` has integration checklist
- ✅ `api-integration` skill provides 8-step detailed workflow
- ✅ `contract-check` skill catches type mismatches
- ✅ Dual validation: frontend typecheck + backend dotnet test
- ✅ No role collision — fullstack agent handles the boundary, not individual layers

---

## Flow 6: Bug Fix

**Scenario:** User reports "the inbox notification count is wrong"

**Expected routing:**
1. User uses `fix-bug.prompt.md` or describes bug in `pm-lead` mode
2. System loads `bug-triage` skill (bug report trigger)
3. Agent narrows boundary: inbox-context.tsx (serialized chokepoint) or feature-local
4. If feature-local: fixes directly
5. If shared context: confirms serialized editing, makes minimal change
6. Runs validation

**Validation:**
- ✅ `bug-triage` skill provides 5-step reproduce → narrow → fix workflow
- ✅ `fix-bug.prompt.md` provides structured template
- ✅ Serialized chokepoint handling: inbox-context.tsx flagged explicitly
- ✅ Anti-scope-creep: minimal change policy enforced
- ✅ No role collision — bug fix is single-agent, subagents used only for exploration

---

## Flow 7: Multi-Perspective Code Review

**Scenario:** User asks "review my recent changes for regressions"

**Expected routing:**
1. User uses `review-changes.prompt.md`
2. System runs parallel `Explore` subagents for different concerns
3. Subagent 1: correctness review
4. Subagent 2: security review
5. Subagent 3: performance + accessibility review
6. Coordinator synthesizes into severity-sorted table

**Validation:**
- ✅ `review-changes.prompt.md` defines 4 review perspectives
- ✅ Subagent delegation keeps main context clean
- ✅ Output contract: findings with severity + file references
- ✅ No write conflicts — reviews are read-only

---

## Flow 8: Documentation Update

**Scenario:** User asks "update docs after the sprint module refactor"

**Expected routing:**
1. System loads `docs-sync` skill (structural change trigger)
2. Agent identifies affected docs from the skill's checklist
3. Updates only docs that actually need changes
4. Verifies no contradictions with current commands and architecture

**Validation:**
- ✅ `docs-sync` skill provides 5-step targeted update workflow
- ✅ Skill prevents unnecessary doc churn (step 2: "update only what the change requires")
- ✅ Contradiction check (step 5) catches stale commands or architecture references

---

## System-Level Checks

| Check | Result |
|-------|--------|
| No overlapping agent responsibilities | ✅ Clear frontend/backend/integration/planning split |
| No overlapping skill triggers | ✅ Each skill has distinct trigger conditions |
| Serialized chokepoints protected | ✅ All 4 agent modes + subagents warn about chokepoints |
| Context noise managed | ✅ Subagents return summaries, not raw logs |
| Prompt files practical | ✅ Each covers a real repeated workflow |
| Skills non-decorative | ✅ Each has concrete steps matching actual project patterns |
| Hooks not overfiring | ✅ No VS Code hooks created (not supported); Claude Code hooks are minimal |
| Documentation complete | ✅ README, capability matrix, translation memo, this report |

## Identified Refinements

1. **Mobile App coverage** — No dedicated agent mode for `Mobile App/`. Currently handled by pm-frontend since it's also a Next.js app. May need a dedicated mode if mobile work becomes frequent.
2. **Playwright E2E** — No dedicated skill for E2E test creation. Playwright config exists but test coverage is minimal. Can be added when E2E testing becomes a regular workflow.
3. **Codex backward compatibility** — `.codex/` files retained but may diverge over time. Consider removing Codex-specific files if that tool is no longer used.
