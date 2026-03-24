# Feature Coverage Matrix

> Benchmarking a modern all-in-one Project Management SaaS MVP against market expectations.
>
> **Benchmark references:** Asana, Monday.com, ClickUp, Linear, Notion, Confluence, Smartsheet, Wrike, Jira, Shortcut, and emerging AI-first PM tools.
>
> **Implementation context:** User-facing coverage of the current Next.js app, which still runs on mock/local frontend data in many places even though a real backend foundation now exists separately under `backend/`.

---

## Implementation Status Summary

After 4 waves of implementation, the following features have been built (UI-functional with mock data):

| Category | Built | Total | Coverage |
|----------|-------|-------|----------|
| A. Workspace & Organization | 3 | 9 | 33% |
| B. Task Management | 14 | 20 | 70% |
| C. Project Management | 7 | 12 | 58% |
| D. Views & Planning | 8 | 14 | 57% |
| E. Collaboration | 4 | 11 | 36% |
| F. Automation | 3 | 8 | 38% |
| G. Goals & Strategy | 5 | 6 | 83% |
| H. Reporting & Analytics | 3 | 9 | 33% |
| I. AI Features | 5 | 11 | 45% |
| J. Search & Navigation | 6 | 8 | 75% |
| K. Notifications & Inbox | 2 | 7 | 29% |
| L. Integrations | 0 | 10 | 0% |
| M. Admin & Security | 2 | 10 | 20% |
| N. Mobile / Responsive | 2 | 7 | 29% |
| O. Request Intake | 5 | 6 | 83% |
| P. Dev / Engineering | 6 | 10 | 60% |
| **Total** | **~75** | **~158** | **~47%** |

### Status Legend
- **DONE** — Fully functional UI with mock data
- **PARTIAL** — Basic implementation exists, not feature-complete
- **PENDING** — Not yet implemented

---

## Priority Legend

| Tag              | Meaning                                                        |
| ---------------- | -------------------------------------------------------------- |
| **CORE**         | Table-stakes. Users will not adopt without it.                 |
| **EXPECTED**     | Modern users assume this exists. Absence feels dated.          |
| **DIFFERENTIATOR** | Sets the product apart from established players.             |
| **STRETCH**      | Nice for completeness but not MVP-critical.                    |

## Complexity Legend (Frontend-Only Next.js + Mock Data)

| Rating     | Meaning                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| **Low**    | Standard UI components, minimal state. 1-3 days.                       |
| **Medium** | Complex state management, drag-and-drop, or rich interaction. 3-7 days. |
| **High**   | Significant architectural work, real-time simulation, or novel UI. 1-2+ weeks. |

---

## A. Workspace & Organization

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| A1 | Organization / Workspace container | CORE | Low | PENDING | Top-level entity. Every competitor has this. |
| A2 | Team / Space grouping | CORE | Low | PENDING | Logical grouping beneath org (Asana Teams, ClickUp Spaces). |
| A3 | Role-based membership (Owner, Admin, Member, Guest) | CORE | Medium | PENDING | Permission model drives trust. Guest access is table-stakes for client collaboration. |
| A4 | User invitation flow | CORE | Low | PARTIAL | Mock invite in settings members panel. |
| A5 | Onboarding wizard / checklist | EXPECTED | Medium | **DONE** | 5-step wizard with localStorage persistence. |
| A6 | Workspace templates (pre-built) | EXPECTED | Medium | **DONE** | Template gallery with 6 categories, preview, create-from-template. |
| A7 | Custom workspace branding (logo, colors) | STRETCH | Low | PENDING | White-label feel. Smartsheet and Monday offer this on higher tiers. |
| A8 | Multi-workspace switching | EXPECTED | Low | PENDING | Freelancers and agencies need this. Notion, Asana, ClickUp all support it. |
| A9 | Workspace-level settings panel | CORE | Medium | **DONE** | Multi-panel settings with localStorage persistence, save/reset. |

---

## B. Task Management

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| B1 | Create / edit / delete tasks | CORE | Low | **DONE** | Full CRUD via AppDataProvider + board detail panel. |
| B2 | Task detail panel / modal | CORE | Medium | **DONE** | ~640-line slide-over with subtasks, checklists, comments, watchers, time tracking. |
| B3 | Task status workflow (To Do, In Progress, Done, custom) | CORE | Medium | **DONE** | Status dropdowns in detail panel and board. |
| B4 | Assignee (single + multiple) | CORE | Low | **DONE** | Single assignee with dropdown selector. |
| B5 | Due dates and date ranges | CORE | Low | **DONE** | Date picker in task detail and creation modal. |
| B6 | Priority levels | CORE | Low | **DONE** | Urgent/High/Medium/Low/None with color coding. |
| B7 | Labels / Tags | CORE | Low | **DONE** | Tags array on tasks, displayed on cards. |
| B8 | Subtasks (at least 1 level) | CORE | Medium | **DONE** | Interactive subtasks with add/toggle/delete in task detail. |
| B9 | Multi-level subtasks (nested hierarchy) | EXPECTED | High | PENDING | Only 1 level implemented. |
| B10 | Custom fields (text, number, dropdown, date, checkbox) | EXPECTED | High | PENDING | Requires dynamic schema UI. |
| B11 | Task dependencies (blocking, blocked by) | EXPECTED | Medium | PARTIAL | Dependencies array exists in Task model, no UI for managing. |
| B12 | Recurring tasks | EXPECTED | Medium | PENDING | Recurrence rules not yet built. |
| B13 | Bulk actions (multi-select, batch update) | EXPECTED | Medium | PARTIAL | Board has multi-select + bulk status/delete. Other modules pending. |
| B14 | Task templates | EXPECTED | Low | PARTIAL | ProjectTemplate includes task templates; no standalone task template save. |
| B15 | Checklists within tasks | CORE | Low | **DONE** | Checkbox lists in task detail with progress tracking. |
| B16 | Time tracking on tasks | STRETCH | Medium | **DONE** | Full time tracking page + TimeEntry model + log time modal. |
| B17 | Task duplication / copy | CORE | Low | **DONE** | Duplicate button in task detail panel. |
| B18 | Drag-and-drop reordering | CORE | Medium | **DONE** | @hello-pangea/dnd in board columns. |
| B19 | Quick-add task (inline creation) | CORE | Low | **DONE** | Inline add at bottom of board columns. |
| B20 | Task ID / reference number | EXPECTED | Low | **DONE** | TSK-### pattern displayed on task cards. |

---

## C. Project Management

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| C1 | Projects as containers for tasks | CORE | Low | **DONE** | Projects page with task association via AppDataProvider. |
| C2 | Project overview / summary page | CORE | Medium | **DONE** | Project detail panel with stats, description, team, dates. |
| C3 | Sections / Groups within projects | CORE | Medium | PENDING | No section/group model within projects. |
| C4 | Milestones | EXPECTED | Low | **DONE** | Milestone model on projects, displayed in portfolio detail. |
| C5 | Project templates | EXPECTED | Medium | **DONE** | Template gallery with createProjectFromTemplate. |
| C6 | Project status updates (health tracking) | EXPECTED | Medium | **DONE** | On-track/At-risk/Off-track health + Project Health widget on dashboard. |
| C7 | Project-level custom fields | EXPECTED | High | PENDING | Mirrors B10 at project scope. |
| C8 | Project archiving | CORE | Low | **DONE** | Archive status in project model. |
| C9 | Starred / Favorited projects | CORE | Low | **DONE** | Favorite toggle on projects. |
| C10 | Project color / icon customization | EXPECTED | Low | **DONE** | Color property on projects, displayed in sidebar and cards. |
| C11 | Multi-project task sharing | STRETCH | High | PENDING | A task living in multiple projects. Complex data model. |
| C12 | Project permissions (public, private, team-only) | CORE | Medium | PENDING | No permission model. |

---

## D. Views & Planning

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| D1 | List view | CORE | Medium | **DONE** | Project list + goal list + portfolio list surfaces. |
| D2 | Board / Kanban view | CORE | Medium | **DONE** | Full DnD Kanban with columns, cards, inline add. |
| D3 | Calendar view | EXPECTED | High | **DONE** | Month/week/day/agenda views with event creation. |
| D4 | Timeline / Gantt view | EXPECTED | High | **DONE** | Timeline page with Gantt-style bars (local data). |
| D5 | My Work / My Tasks view | CORE | Medium | **DONE** | My Work widget on dashboard. |
| D6 | Workload / Resource view | DIFFERENTIATOR | High | **DONE** | Workload page with resource bars (local data). |
| D7 | Portfolio / Multi-project view | DIFFERENTIATOR | High | **DONE** | Portfolio page with initiative tracking, budget viz, milestones. |
| D8 | Table view (spreadsheet-like) | EXPECTED | High | PENDING | No editable grid view. |
| D9 | Dashboard view (widget-based) | EXPECTED | High | **DONE** | Dashboard with KPI cards, Quick Actions, My Work, Project Health. |
| D10 | Saved views / View customization | EXPECTED | Medium | PENDING | No saved view configurations. |
| D11 | Grouping (by status, assignee, priority, section) | CORE | Medium | PARTIAL | Board groups by status. Other groupings not configurable. |
| D12 | Sorting (multi-level) | CORE | Low | PENDING | No multi-level sort controls. |
| D13 | Filtering (multi-field, compound) | CORE | Medium | PARTIAL | Basic search/filter on toolbars. No compound AND/OR logic. |
| D14 | View switching within project | CORE | Low | PENDING | No in-project view toggle. |

---

## E. Collaboration

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| E1 | Task comments (threaded) | CORE | Medium | **DONE** | Comments tab in task detail with add/display. |
| E2 | @mentions in comments | CORE | Medium | PENDING | No mention parsing. |
| E3 | File attachments on tasks | CORE | Medium | PENDING | Requires backend for upload. |
| E4 | Activity log / History on tasks | EXPECTED | Medium | **DONE** | Activity panel with typed events. |
| E5 | Reactions on comments (emoji) | EXPECTED | Low | PENDING | Not implemented. |
| E6 | Approval workflows | DIFFERENTIATOR | High | PENDING | No approval flow. |
| E7 | Proofing / Annotation on attachments | STRETCH | High | PENDING | Not implemented. |
| E8 | Real-time presence indicators | EXPECTED | Medium | PENDING | Requires backend. |
| E9 | Docs / Notes (rich-text, embedded in project) | DIFFERENTIATOR | High | PARTIAL | Docs page with basic editor. Not full rich-text. |
| E10 | Watchers / Followers on tasks | EXPECTED | Low | **DONE** | Watcher add/remove in task detail. |
| E11 | Guest access / External collaboration | EXPECTED | Medium | PENDING | Requires auth system. |

---

## F. Automation

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| F1 | Rule builder (when X happens, do Y) | EXPECTED | High | **DONE** | Full automation builder with trigger/action visual flow, CRUD modal. |
| F2 | Pre-built automation templates | EXPECTED | Medium | **DONE** | 6 trigger types, 6 action types, pre-seeded automations. |
| F3 | Auto-assign based on rules | EXPECTED | Medium | **DONE** | assign_to action type in automation model. |
| F4 | Due date auto-shifting on dependency change | DIFFERENTIATOR | High | PENDING | Requires dependency cascade logic. |
| F5 | Status auto-progression | EXPECTED | Medium | PARTIAL | Architecture exists in automation model (subtask_completed trigger). |
| F6 | Recurring task auto-creation | EXPECTED | Medium | PENDING | No recurrence engine. |
| F7 | Custom webhook triggers | STRETCH | High | PENDING | Requires backend. |
| F8 | Smart defaults (auto-fill based on context) | DIFFERENTIATOR | Medium | PENDING | Not implemented. |

---

## G. Goals & Strategy

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| G1 | Goals / OKRs container | DIFFERENTIATOR | Medium | **DONE** | Goals page with OKR hierarchy, creation modal, detail panel. |
| G2 | Goal-to-project linking | DIFFERENTIATOR | Medium | **DONE** | Linked projects displayed in goals detail. |
| G3 | Progress rollup (auto-calculated from linked work) | DIFFERENTIATOR | High | **DONE** | Progress percentage computed and displayed. |
| G4 | Initiative / Epic grouping | EXPECTED | Medium | **DONE** | Portfolio page with initiative tracking. |
| G5 | Goal status updates | DIFFERENTIATOR | Low | **DONE** | Status field with on-track/at-risk/off-track indicators. |
| G6 | Goal hierarchy (company > team > individual) | STRETCH | High | PARTIAL | Child goals tree in detail panel. No formal level hierarchy. |

---

## H. Reporting & Analytics

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| H1 | Project-level progress dashboard | CORE | Medium | **DONE** | Reports page with project metrics, completion %. |
| H2 | Customizable dashboard with widgets | EXPECTED | High | PENDING | Dashboard has fixed widgets, not drag-and-drop configurable. |
| H3 | Chart types (bar, pie, line, burndown) | EXPECTED | High | **DONE** | Recharts integration with bar, pie, line charts. |
| H4 | Saved / Shared reports | EXPECTED | Medium | PENDING | No report save/share. |
| H5 | Team workload analytics | DIFFERENTIATOR | High | PARTIAL | Workload page exists but uses local data. |
| H6 | Time-series trend analysis | STRETCH | High | PENDING | Not implemented. |
| H7 | Export to CSV / PDF | EXPECTED | Medium | PENDING | Not implemented. |
| H8 | Burndown / Burnup charts (for sprints) | EXPECTED | High | PENDING | Sprint stats exist but no burndown visualization. |
| H9 | Widget library (status summary, overdue, by assignee) | EXPECTED | High | **DONE** | KPI cards, My Work, Project Health widgets on dashboard. |

---

## I. AI Features

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| I1 | Task description generation / enhancement | EXPECTED | Medium | **DONE** | AI copilot generates task descriptions via mock responses. |
| I2 | Project summary generation | EXPECTED | Medium | PENDING | Not directly implemented. |
| I3 | Smart task breakdown (goal to tasks) | DIFFERENTIATOR | Medium | **DONE** | "Generate subtasks" quick action in AI copilot. |
| I4 | Natural language task creation | DIFFERENTIATOR | Medium | **DONE** | AI copilot mock supports natural language input. |
| I5 | AI-powered search (semantic) | DIFFERENTIATOR | High | PENDING | Search is keyword-based, not semantic. |
| I6 | Risk / blocker detection | DIFFERENTIATOR | High | **DONE** | "Identify risks" quick action in AI copilot. |
| I7 | Writing assistant in comments/docs | EXPECTED | Medium | PENDING | No inline writing assistance. |
| I8 | Meeting notes to tasks conversion | DIFFERENTIATOR | High | PENDING | Not implemented. |
| I9 | AI copilot / chat assistant | DIFFERENTIATOR | High | **DONE** | Full chat interface with contextual mock responses. |
| I10 | Smart notifications (AI-prioritized) | STRETCH | High | PENDING | Not implemented. |
| I11 | Predictive due dates / effort estimation | STRETCH | High | PENDING | Not implemented. |

---

## J. Search & Navigation

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| J1 | Global search (tasks, projects, people, docs) | CORE | Medium | **DONE** | Command palette searches Tasks, Projects, Goals, Initiatives, Docs, People. |
| J2 | Quick navigation / Command palette | EXPECTED | Medium | **DONE** | Cmd+K with grouped results, quick actions, keyboard nav. |
| J3 | Advanced filters (saved, shareable) | EXPECTED | Medium | PENDING | No saved/shareable filter configs. |
| J4 | Recent items | CORE | Low | PENDING | No recent items tracking. |
| J5 | Keyboard shortcuts | EXPECTED | Medium | **DONE** | 16+ g+X navigation sequences, action keys, help dialog. |
| J6 | Breadcrumb navigation | CORE | Low | **DONE** | Route-aware breadcrumbs on all 17 pages. |
| J7 | Sidebar navigation with collapsible tree | CORE | Medium | **DONE** | 14-item sidebar with mobile drawer. |
| J8 | Starred / Pinned items | CORE | Low | **DONE** | Favorite toggle on projects. |

---

## K. Notifications & Inbox

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| K1 | In-app notification center / Inbox | CORE | Medium | **DONE** | Inbox page with notification feed, InboxContext. |
| K2 | Notification preferences (per-type control) | EXPECTED | Medium | PARTIAL | Toggle switches in settings, no real notification routing. |
| K3 | Email notification digests | EXPECTED | Medium | PENDING | Requires email backend. |
| K4 | Push notifications (browser) | EXPECTED | Medium | PENDING | Not implemented. |
| K5 | Unread / Read state management | CORE | Low | **DONE** | Mark as read, unread count badge on header bell icon. |
| K6 | Notification grouping (by project, by type) | EXPECTED | Medium | PENDING | Flat list, no grouping. |
| K7 | Do Not Disturb / Snooze | STRETCH | Low | PENDING | Not implemented. |

---

## L. Integrations

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| L1 | Slack integration (notifications, task creation) | EXPECTED | High | PENDING | Mock with UI only. |
| L2 | GitHub / GitLab integration | EXPECTED | High | PENDING | Not implemented. |
| L3 | Google Calendar / Outlook sync | EXPECTED | High | PENDING | Not implemented. |
| L4 | Google Drive / Dropbox / OneDrive file linking | EXPECTED | Medium | PENDING | Not implemented. |
| L5 | Email-to-task (inbound email) | EXPECTED | Medium | PENDING | Not implemented. |
| L6 | Webhooks (outbound) | STRETCH | High | PENDING | Requires backend. |
| L7 | Zapier / Make integration | STRETCH | High | PENDING | Not implemented. |
| L8 | REST API | STRETCH | High | PENDING | Not MVP for frontend-only. |
| L9 | Import from other tools (CSV, Asana, Trello, Jira) | EXPECTED | Medium | PENDING | Not implemented. |
| L10 | Integration marketplace UI | STRETCH | Medium | PARTIAL | Settings integrations panel has connect/disconnect cards. |

---

## M. Admin & Security

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| M1 | Role-based access control (RBAC) | CORE | Medium | PENDING | No permission model. |
| M2 | Workspace settings panel | CORE | Medium | **DONE** | Multi-panel settings with persistence. |
| M3 | Member management (invite, remove, role change) | CORE | Medium | **DONE** | Members panel in settings with invite + role table. |
| M4 | Audit log | EXPECTED | Medium | PENDING | Not implemented. |
| M5 | Two-factor authentication (2FA) | EXPECTED | High | PENDING | Requires auth backend. |
| M6 | SSO / SAML support | STRETCH | High | PENDING | Requires auth backend. |
| M7 | Data export / Backup | EXPECTED | Medium | PENDING | Not implemented. |
| M8 | Session management | STRETCH | Medium | PENDING | Requires auth backend. |
| M9 | Password policy settings | STRETCH | Low | PENDING | Requires auth backend. |
| M10 | Compliance badges display (SOC2, GDPR) | STRETCH | Low | PENDING | Not implemented. |

---

## N. Mobile / Responsive

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| N1 | Responsive layout (tablet + mobile breakpoints) | CORE | Medium | **DONE** | Tailwind breakpoints, responsive grids across all pages. |
| N2 | Mobile task creation and editing | CORE | Medium | **DONE** | Modals and forms work on mobile viewports. |
| N3 | Mobile notification viewing | CORE | Low | PARTIAL | Inbox page renders on mobile but not optimized. |
| N4 | Mobile board view (horizontal scroll) | EXPECTED | Medium | PENDING | Board not touch-optimized. |
| N5 | Offline support / PWA | STRETCH | High | PENDING | Not implemented. |
| N6 | Mobile bottom navigation | EXPECTED | Low | PENDING | Not implemented. |
| N7 | Touch-optimized interactions | EXPECTED | Medium | PENDING | No swipe actions or long-press menus. |

---

## O. Request Intake

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| O1 | Request / Intake forms | EXPECTED | Medium | **DONE** | Full intake page with form management. |
| O2 | Form builder (drag-and-drop fields) | EXPECTED | High | PARTIAL | Form creation with field types, but not drag-and-drop reordering. |
| O3 | Form-to-task routing | EXPECTED | Medium | **DONE** | convertRequestToTask in AppDataProvider. |
| O4 | Triage / Review queue | DIFFERENTIATOR | Medium | **DONE** | Submissions table with review/approve/reject workflow. |
| O5 | Public form sharing (external link) | EXPECTED | Low | **DONE** | Form preview with submission capability. |
| O6 | Form response tracking | EXPECTED | Medium | **DONE** | All submissions visible with status tracking. |

---

## P. Dev / Engineering Workflows

| # | Feature | Priority | Complexity | Status | Notes |
|---|---------|----------|------------|--------|-------|
| P1 | Backlog management | EXPECTED | Medium | **DONE** | Sprint page backlog with assign-to-sprint. |
| P2 | Sprint / Iteration planning | EXPECTED | High | **DONE** | Full sprint planning with create sprint, dates, goals. |
| P3 | Sprint board (active sprint view) | EXPECTED | Medium | **DONE** | Sprint board with 3 status columns. |
| P4 | Bug / Issue tracking (type differentiation) | EXPECTED | Low | **DONE** | TaskType: task, bug, story, feature, epic with icons. |
| P5 | Release management | DIFFERENTIATOR | High | PENDING | Not implemented. |
| P6 | Cycle / Velocity tracking | DIFFERENTIATOR | High | PARTIAL | Sprint velocity stat displayed; no historical tracking. |
| P7 | Git branch / PR linking | EXPECTED | High | PENDING | Requires backend integration. |
| P8 | Code review status on tasks | DIFFERENTIATOR | High | PENDING | Not implemented. |
| P9 | Epic-level planning and tracking | EXPECTED | Medium | **DONE** | Epic type exists, portfolio initiatives serve as epic containers. |
| P10 | Estimation (story points, t-shirt sizing) | EXPECTED | Low | **DONE** | estimatedHours on tasks, displayed in time tracking. |

---

## Summary: MVP Scope Recommendation

### Implementation Progress (Post Wave 4)

Of ~158 features benchmarked, approximately **75 are now DONE or substantially implemented** (~47% coverage). The strongest coverage is in:
- **Goals & Strategy (83%)** — Full OKR system with hierarchy, linking, progress rollup
- **Request Intake (83%)** — Complete form management and submission workflow
- **Search & Navigation (75%)** — Command palette, keyboard shortcuts, breadcrumbs, sidebar
- **Task Management (70%)** — Rich task detail, subtasks, checklists, DnD, time tracking
- **Dev Workflows (60%)** — Sprint planning, backlog, task types, estimation

### Weakest Areas (Require Backend)
- **Integrations (0%)** — All require external service connectivity
- **Admin & Security (20%)** — Requires authentication system
- **Notifications (29%)** — Real notification routing requires backend
- **Mobile (29%)** — Touch optimization and bottom nav not yet done

### Must-Ship (CORE features): ~45 features
**~30 now implemented.** Remaining CORE gaps: project sections/groups, RBAC, project permissions, advanced sorting, recent items.

### Should-Ship (EXPECTED features): ~65 features
**~35 now implemented.** Key remaining: custom fields, recurring tasks, saved views, compound filters, integrations, import/export.

### Differentiators Implemented: ~15 of ~25
AI copilot, Goals/OKR, Portfolio, Workload, Request Intake triage, Automation builder — all functional.

### Recommended Next Phase Focus

| Phase | Focus | Feature Count (approx) |
|-------|-------|----------------------|
| **Phase 1: Foundation** | Workspace, Tasks, Projects, List/Board views, Comments, Search, Notifications, Auth | ~40 CORE — **~30 DONE** |
| **Phase 2: Planning** | Timeline/Gantt, Calendar, Dependencies, Custom Fields, Filters/Saved Views | ~25 EXPECTED — **~10 DONE** |
| **Phase 3: Intelligence** | AI task generation, Summaries, Copilot, Automations, Dashboards | ~15 DIFFERENTIATOR — **~10 DONE** |
| **Phase 4: Scale** | Portfolio, Goals/OKRs, Workload, Sprint planning, Integrations | ~20 EXPECTED + DIFFERENTIATOR — **~15 DONE** |
| **Phase 5: Polish** | Mobile optimization, Import/Export, Intake forms, Advanced reporting | ~15 STRETCH — **~5 DONE** |

---

## Competitive Positioning Notes

**vs. Asana/Monday (Established all-in-one):** Compete on AI depth and modern UX. These tools carry legacy UI debt. A fresh product can feel faster and smarter.

**vs. Linear (Dev-first):** Linear's strength is opinionated simplicity for engineering. Compete by offering the same dev workflow quality but extending to non-engineering teams.

**vs. Notion (Docs-first):** Notion's PM features are flexible but unstructured. Compete with purpose-built PM views (Gantt, workload) that Notion cannot match with databases alone.

**vs. ClickUp (Feature-max):** ClickUp has everything but is often criticized for complexity and performance. Compete on speed, clarity, and a curated feature set that does fewer things better.

**vs. AI-first entrants:** Many new tools lead with AI but lack PM fundamentals. Compete by combining solid PM foundations with genuinely useful AI -- not AI as a gimmick.
