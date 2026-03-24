# Project Management SaaS Design System 2026

## 1. Product Thesis
Build a **high-density, premium, fast, calm-but-powerful** project management SaaS for teams that switch constantly between overview and execution.

Core product qualities:
- Dense without feeling cramped
- Motion-rich without feeling playful or distracting
- Enterprise-trustworthy but modern
- Keyboard-first and accessibility-safe
- Built strictly for **Next.js App Router**
- Componentized, token-driven, themeable, and scalable

Design principle:
> Show more information per screen, but reveal complexity progressively.

---

## 2. Recommended Frontend Stack (Strict)
- **Next.js App Router**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** as the component starting layer
- **Radix UI primitives** for accessibility-critical overlays and interactive foundations
- **Motion for React** for animations, layout transitions, drag gestures, shared-element transitions, and micro-interactions
- **next/font** for self-hosted typography
- **next/image** for optimized media
- **Recharts or Visx** for charts (use custom wrappers inside the design system)
- **TanStack Table** for high-density tables
- **TanStack Virtual** for large lists/tables
- **React Aria patterns where needed** for advanced accessibility cases
- **next-themes** or token-driven class/data-theme strategy for theming

---

## 3. Visual Positioning
The visual language should feel like a blend of:
- Linear-level precision
- Notion-level information organization
- Atlassian-level workflow clarity
- Stripe-level polish
- Vercel-level calm and restraint

Avoid:
- Overly soft “consumer app” UI
- Excessive glassmorphism on core work surfaces
- Giant cards everywhere
- Decorative motion that slows task completion

---

## 4. Experience Goals by User Role
### Executives
Need: portfolio overview, risk, timeline confidence, delivery status.

### Project Managers
Need: dependencies, milestones, capacity, blockers, status, timeline shifts.

### Team Leads
Need: workload, throughput, bottlenecks, sprint execution.

### Contributors
Need: my tasks, next actions, context, updates, comments, due dates.

### Ops/Admins
Need: permissions, templates, automations, auditability.

---

## 5. Information Architecture
### Global navigation
- Top bar for global search, quick create, notifications, command menu, workspace switcher, profile
- Left sidebar for primary sections
- Optional collapsible right rail for contextual details/activity/AI

### Primary sections
- Home
- Inbox / Updates
- My Work
- Projects
- Portfolio
- Board
- Timeline
- Calendar
- Workload
- Goals / OKRs
- Docs
- Reports / Analytics
- Automations
- Team
- Settings

### Project-level navigation
- Overview
- Tasks
- Board
- Timeline
- Milestones
- Files
- Activity
- Custom Fields
- Automations
- Settings

### Content model
- Workspace
- Team
- Project
- View
- Task
- Subtask
- Milestone
- Sprint
- Goal
- Document
- Comment
- Automation rule
- Attachment
- Time entry
- Dependency

---

## 6. Density Strategy
### Density modes
Provide **3 density modes** globally and per data-heavy view:
- Comfortable
- Default
- Compact

### High-density rules
- Use compact row heights only in tables, lists, sidebars, and secondary controls
- Preserve larger tap targets for mobile and coarse pointers
- Keep core action buttons and critical forms at accessible hit targets
- Never shrink focus rings or status indicators below clear visibility

### Spacing model
- 4px foundational rhythm
- 8px for tight groups
- 12px for compact sections
- 16px default component padding
- 24px section separation
- 32px page section separation
- 48–64px hero/marketing only, not product work surfaces

### Recommended heights
- Toolbar dense: 36px
- Input dense: 36px
- Input default: 40px
- Button dense: 32px
- Button default: 36px / 40px
- Table row compact: 32px
- Table row default: 40px
- Sidebar item compact: 32px
- Sidebar item default: 36px
- Top nav: 56px

---

## 7. Layout System
### App shell
- 12-column responsive grid on desktop
- 8-column tablet adaptation
- 4-column mobile
- Max content width for documentation/long text; full-width for dashboards/tables

### Major layouts
1. Overview dashboard
2. Data table workspace
3. Kanban board workspace
4. Timeline/Gantt workspace
5. Calendar workspace
6. Form/editor workspace
7. Settings workspace
8. Split-view collaboration workspace

### Canonical desktop layout
- Left sidebar: 72px icon rail or 240–280px expanded
- Top bar: 56px
- Optional filter/action toolbar: 44–52px
- Main content flexible
- Context drawer: 320–420px

---

## 8. Typography System
### Font pairing
Use a neutral, highly legible sans with strong numeric clarity.
Recommended:
- **Geist** or **Inter** for UI text
- Optional monospace: **JetBrains Mono** or **Geist Mono** for IDs, durations, system values

### Type scale
- Display: 40/48
- H1: 32/40
- H2: 24/32
- H3: 20/28
- H4: 18/26
- Title LG: 16/24 semibold
- Body MD: 14/20
- Body SM: 13/18
- Label MD: 13/18 medium
- Label SM: 12/16 medium
- Caption: 11/14

### Rules
- Default body in app surfaces: 13px or 14px
- Dense tables may use 12px labels with strong contrast
- Avoid 12px body text in long paragraphs
- Use tabular numerals for dates, estimates, counts, timers
- Use semibold sparingly to create hierarchy

---

## 9. Color System
### Brand approach
Use a restrained neutral base with 1 strong brand accent and 4 semantic accents.

### Core tokens
- Background/base
- Surface/subtle
- Surface/elevated
- Surface/overlay
- Border/subtle
- Border/default
- Border/strong
- Foreground/default
- Foreground/muted
- Foreground/subtle
- Accent/solid
- Accent/soft
- Accent/focus

### Semantic tokens
- Success
- Warning
- Danger
- Info
- Neutral
- Priority low / medium / high / urgent
- Status planned / active / blocked / done / archived

### Suggested product palette behavior
- Mostly neutral chroma
- Accent color reserved for selected state, primary CTA, active charts, key progress
- Semantic colors used with discipline, not everywhere
- Dark mode should reduce glare and increase depth separation through luminance, not saturation spikes

### Surfaces
- Level 0: app background
- Level 1: default panels
- Level 2: cards / elevated panels
- Level 3: popovers / menus / dialogs
- Level 4: command palette / overlays / spotlight interactions

---

## 10. Shadows, Borders, and Depth
Use depth carefully:
- Dense work surfaces rely more on contrast and borders than large shadows
- Shadows reserved for overlay layers and drag states
- Default cards use hairline borders with subtle background lift
- Active drag item uses stronger shadow and scale

Token examples:
- shadow-xs
- shadow-sm
- shadow-md
- shadow-lg only for modal/command palette

Borders:
- 1px default
- 0.5px optical lines where supported
- Stronger borders for selected/invalid/focus-within containers

Radius:
- 6px micro elements
- 8px controls
- 10–12px cards/panels
- 14–16px modal shells

---

## 11. Iconography
- Use a clean stroke icon set like **lucide-react**
- 16px default inline icons
- 18px toolbar icons
- 20px primary navigation icons
- Use filled or duotone sparingly for states only

Rules:
- Icons should not replace labels in dense enterprise workflows unless universally recognizable
- Pair icon + label for destructive, irreversible, or ambiguous actions

---

## 12. Motion System
### Motion philosophy
Motion must:
- Clarify cause and effect
- Preserve context during view/state changes
- Reward precision
- Improve perceived performance
- Never delay expert workflows

### Motion layers
1. **Micro feedback** — hover, focus, press, toggle, badge count updates
2. **State transitions** — empty to loaded, validation, optimistic updates
3. **Layout transitions** — sidebar collapse, board reflow, detail drawer open
4. **Navigation transitions** — route changes, view switching, tab transitions
5. **Spatial interactions** — drag, reorder, resize, dock, snap
6. **Background ambiance** — subtle progress shimmer, live pulse, skeleton wave

### Timing tokens
- instant: 80ms
- fast: 120ms
- normal: 180ms
- moderate: 240ms
- slow: 320ms
- deliberate: 420ms

### Easing tokens
- standard: cubic-bezier(0.2, 0, 0, 1)
- entrance: cubic-bezier(0.16, 1, 0.3, 1)
- exit: cubic-bezier(0.4, 0, 1, 1)
- spring-soft
- spring-snappy
- spring-drag

### Animation rules
- Hover: 120–160ms
- Press: 80–120ms
- Popover/dialog entry: 180–240ms
- Drawer slide: 220–280ms
- Page section reveal: 180–240ms staggered
- Route transition: preserve layout, animate only changed region
- Drag/reorder: spring physics with high clarity and ghost state

### Reduced motion
Every animation category must degrade gracefully:
- remove parallax
- remove non-essential scale
- shorten fades/slides
- keep opacity and instant spatial state changes when necessary

---

## 13. Microinteractions Inventory
### Core microinteractions
- Button hover lift or background modulation
- Press compression with quick rebound
- Toggle thumb spring
- Input focus ring + border interpolation
- Menu item hover highlight
- Checkbox / radio check draw-in
- Inline save confirmation pulse
- Toast enter/stack/exit choreography
- Skeleton to content dissolve
- Notification badge increment animation
- Assignee avatar add/remove transition
- Task status change morph
- Priority chip color transition
- Tab indicator shared-element slide
- Accordion height + opacity reveal
- Tooltip fade/slide
- Kanban card hover affordance
- Drag placeholder insertion animation
- Resizable panel handle feedback
- Cursor-follow emphasis for selected objects (subtle)
- Empty state illustration accent motion (minimal)
- Command palette results highlight motion
- Search result matched-text emphasis
- Loading progress shimmer or indeterminate top bar

### Project-management-specific microinteractions
- Task moved across columns with ghost + target emphasis
- Dependency line highlight on hover/focus
- Timeline bar drag handles
- Date shift preview before commit
- Bulk-select toolbar emergence
- Inline comment resolved collapse
- New activity ping in feed
- Real-time collaborator cursor / presence appearance
- Auto-save status transition: Saving → Saved → Synced
- Time tracker running pulse
- Milestone reached celebration (low-noise)
- SLA breach or overdue state escalation animation

---

## 14. Navigation Patterns
### Top bar
Contains:
- Workspace switcher
- Global search / command palette trigger
- Quick create
- Notifications
- Help / AI assistant
- User avatar menu

### Sidebar
Should support:
- Collapse to icon rail
- Nested groups
- Favorites / pinned views
- Workspace-specific recents
- Clear active state
- Drag to reorder personal shortcuts

### Secondary navigation
Use tabs or segmented controls for:
- Overview / Board / List / Timeline / Calendar / Workload

### Command system
Required:
- Universal command palette
- Keyboard shortcuts visible inline
- Fuzzy navigation, search, and action execution
- Recently used commands
- Context-sensitive suggestions

---

## 15. Feedback & System Status
- Inline validation
- Optimistic mutation feedback
- Toasts for ephemeral confirmations
- Banners for account/project scope alerts
- Sync indicators
- Loading skeletons
- Empty states with action
- Retry states with diagnostics
- Offline / reconnect states

### Feedback hierarchy
1. Inline if local
2. Toast if temporary and non-blocking
3. Banner if page/project relevant
4. Modal only for blocking decisions

---

## 16. Core Views for a Project Management SaaS
### Dashboard / Overview
Must include:
- KPI cards
- Burndown/progress charts
- Milestones summary
- At-risk projects panel
- Upcoming deadlines
- Workload overview
- Activity feed
- Quick actions

### List view
- Column customization
- Sort / group / filter
- Saved views
- Inline edit
- Bulk actions
- Sticky columns
- Keyboard navigation
- Row selection
- Expandable detail rows

### Kanban board
- Swimlanes
- WIP limits
- Card density options
- Column collapse
- Drag-and-drop with keyboard support fallback
- Quick edit on card
- Assignee, due date, estimate, priority chips

### Timeline / Gantt
- Zoom levels
- Dependencies
- Critical path emphasis
- Resizable date bars
- Drag to reschedule
- Milestone diamonds
- Baseline vs actual option

### Calendar
- Day/week/month/agenda
- Drag scheduling
- Workload overlays
- Time blocking
- Holiday/team availability overlays

### Workload / Capacity
- Per person/team capacity bars
- Allocation heatmap
- Over/under-utilization badges
- Scenario comparison

### Docs / Notes
- Rich text or block editing
- Mentioning, comments, embeds, references to tasks/projects

### Reports / Analytics
- Saved reports
- Date range presets
- Drill-down
- Export/share

---

## 17. Component Taxonomy
### Foundations
- Tokens
- Color roles
- Typography styles
- Spacing
- Radius
- Shadows
- Motion tokens
- Z-index scale
- Breakpoints
- Focus ring styles

### Inputs
- Button
- Icon button
- Split button
- Link button
- Toggle button
- Text input
- Search input
- Textarea
- Number input
- Date picker
- Date range picker
- Time picker
- Select
- Combobox
- Multi-select
- Checkbox
- Radio group
- Switch
- Slider
- Stepper
- File upload
- Rich text input
- Mention input

### Data display
- Avatar
- Badge
- Chip
- Status pill
- Tooltip
- Popover
- Empty state
- Skeleton
- Progress bar
- Circular progress
- Stat card
- KPI card
- Activity item
- Timeline item
- Comment block
- Attachment item
- Presence indicator

### Navigation
- Sidebar
- Top nav
- Tabs
- Segmented control
- Breadcrumbs
- Pagination
- Stepper nav
- Command palette

### Overlay
- Dialog
- Alert dialog
- Drawer
- Sheet
- Dropdown menu
- Context menu
- Hover card
- Tooltip
- Tour / coachmark

### Collections
- Table
- Virtualized table
- List
- Tree view
- Accordion
- Kanban column
- Kanban card
- Calendar grid
- Gantt lane
- Swimlane
- Feed list

### Advanced workflow components
- Filter builder
- Query builder
- Saved view bar
- Bulk action bar
- Inline edit cell
- Dependency editor
- Assignee picker
- Label manager
- Workflow builder
- Automation rule builder
- Recurrence rule editor
- Permissions matrix
- Audit log viewer
- Activity stream

### Charts & viz
- Line chart
- Bar chart
- Stacked bar
- Area chart
- Donut chart
- Heatmap
- Sparkline
- Progress trend
- Burndown chart
- Cumulative flow diagram
- Capacity heatmap

---

## 18. Component Specs (Key Rules)
### Buttons
Variants:
- Primary
- Secondary
- Tertiary
- Ghost
- Destructive
- Link

States:
- Default
- Hover
- Active
- Focus-visible
- Disabled
- Loading

Rules:
- Keep primary CTA count low per viewport
- Dense icon-only buttons must always have tooltip/aria-label
- Loading buttons should preserve width

### Inputs
Rules:
- Label always visible for forms; placeholder never acts as label
- Inline descriptions for complex fields
- Error text adjacent to field
- Support prefix/suffix, hotkeys, inline validation, loading

### Tables
Rules:
- Sticky header
- Optional sticky first column
- Resizable columns
- Reorderable columns
- Show/hide columns
- Sort indicators visible, not hidden on hover only
- Multi-select with persistent bulk actions
- Density switch
- Zebra striping optional only if it improves scanability
- Keyboard navigation required

### Modals/Drawers
Rules:
- Use drawers for object detail/edit when context should remain visible
- Use modals for confirmation or focused creation flows
- Never nest deep modal stacks

### Cards
Rules:
- Use only where grouping or emphasis helps
- Prefer flat sections and dividers in dense workspaces
- Avoid wrapping every metric in oversized cards

---

## 19. Token Structure (Suggested)
### Color tokens
- --bg-app
- --bg-surface
- --bg-elevated
- --bg-overlay
- --fg-default
- --fg-muted
- --fg-subtle
- --border-subtle
- --border-default
- --border-strong
- --accent-50 to --accent-950
- --success-* / --warning-* / --danger-* / --info-*

### Space tokens
- --space-1: 4px
- --space-2: 8px
- --space-3: 12px
- --space-4: 16px
- --space-5: 20px
- --space-6: 24px
- --space-8: 32px
- --space-10: 40px
- --space-12: 48px

### Radius tokens
- --radius-xs: 6px
- --radius-sm: 8px
- --radius-md: 10px
- --radius-lg: 12px
- --radius-xl: 16px

### Motion tokens
- --dur-instant
- --dur-fast
- --dur-normal
- --dur-moderate
- --dur-slow
- --ease-standard
- --ease-entrance
- --ease-exit
- --spring-soft
- --spring-snappy

### Layer tokens
- --z-base
- --z-dropdown
- --z-sticky
- --z-overlay
- --z-modal
- --z-toast
- --z-command

---

## 20. Theming Strategy
Support:
- Light
- Dark
- High contrast
- Brand-customized workspaces

Theming rules:
- All semantic colors derive from accessible pairs
- Charts must adapt to dark mode and high contrast
- Elevation differences must remain visible in dark mode
- Avoid neon saturation spikes

---

## 21. Accessibility Requirements
- WCAG 2.2 AA baseline
- Visible focus indicators on every interactive control
- Keyboard access for all major workflows
- Proper labelling and announcements for dynamic updates
- Reduced motion support
- Target size safe defaults where possible
- Drag interactions must have non-drag alternative
- Color never sole source of meaning
- Form help and error recovery must be explicit

Specific PM SaaS concerns:
- Kanban drag-and-drop must have keyboard move alternative
- Gantt/timeline adjustments need textual date editing fallback
- Dense tables need sortable headers and row context readable by screen readers
- Status chips require text labels, not just color

---

## 22. Performance Rules for Next.js
- Prefer Server Components for read-heavy screens
- Use Client Components only where interactivity is needed
- Stream route segments with Suspense
- Lazy-load large charts/editors/rare modals
- Use virtualized lists/tables for large datasets
- Optimize images and fonts
- Keep animation work mostly on transform/opacity
- Avoid layout thrash in drag-heavy surfaces
- Batch state updates and debounce expensive filters

---

## 23. Page-Level Animation Patterns
### Route transitions
- Keep shell persistent
- Crossfade and translate only content region
- Preserve sidebar/topbar to maintain orientation

### Tab/view switching
- Shared-element indicator
- Content fade/slide of active panel
- Avoid full re-render flash

### Drawer/detail panel
- Backdrop fade 120–180ms
- Panel slide/fade 200–260ms
- Internal sections stagger 20–40ms

### Boards and tables
- Animate insert/remove/reorder
- Avoid animating thousands of rows simultaneously
- Animate around viewport focus only

---

## 24. Empty, Loading, Error, and Success States
### Empty state types
- First-use empty
- Filtered empty
- Permission empty
- Archived empty
- Search empty

### Loading types
- Skeleton rows/cards
- Partial section loading
- Optimistic loading
- Background refresh indicator

### Error types
- Inline field error
- Section retry state
- Full-page fail state
- Offline/reconnect state

### Success types
- Inline save check
- Toast confirmation
- Activity feed insertion
- Completion micro-celebration for meaningful milestones

---

## 25. Project Management Domain Patterns
- Task creation from anywhere
- Quick-add from keyboard
- Cross-view consistency between list/board/timeline/calendar
- Saved filters by role
- Personal vs shared views
- Recurring tasks
- Dependencies and blockers visible at task and portfolio level
- Time tracking integrated but not intrusive
- Collaboration context visible: comments, mentions, attachments, activity
- Auditability for workflow changes
- Templates for project setup

---

## 26. Recommended Default Screen Blueprints
### A. Portfolio dashboard
- KPI strip
- Risk matrix
- On-track / at-risk projects table
- Milestones timeline
- Team allocation card
- Recent updates feed

### B. Project overview
- Header with project status / owner / timeline / actions
- KPI summary
- Progress chart
- Milestone list
- Activity feed
- Team workload snapshot

### C. Task list workspace
- Saved view bar
- Filter/search toolbar
- Dense virtualized table
- Detail drawer on row click

### D. Board workspace
- Filter toolbar
- Column header summary
- Dense cards
- Right-side detail drawer

### E. Timeline workspace
- Project header
- Zoom + dependencies toolbar
- Left grid + right timeline pane
- Milestone and dependency overlay

---

## 27. Design Language Dos / Don’ts
### Do
- Keep hierarchy crisp and obvious
- Design for scanning first, reading second
- Use motion to preserve context
- Support expert efficiency and keyboard workflows
- Make dense views customizable
- Keep components token-driven and reusable

### Don’t
- Oversize cards, spacing, and typography in core work areas
- Depend on color alone
- Use decorative motion everywhere
- Hide important actions behind hover-only affordances
- Build inconsistent interaction models across views
- Mix too many visual metaphors

---

## 28. Suggested Folder Architecture for Next.js
- app/
- components/
  - ui/
  - data-display/
  - navigation/
  - overlays/
  - workflow/
  - charts/
  - forms/
- features/
  - projects/
  - tasks/
  - timeline/
  - reports/
  - automations/
- lib/
- hooks/
- styles/
  - tokens.css
  - themes.css
  - motion.css
- public/

---

## 29. Figma/System Deliverables
- Foundations page
- Tokens page
- Light theme
- Dark theme
- High contrast theme
- Component master library
- Interaction specs page
- Motion specs page
- Page templates
- Domain patterns page (board/list/timeline/calendar/workload)
- Accessibility annotation page

---

## 30. Minimum MVP Design-System Deliverables
1. Color, type, spacing, radius, shadow, motion tokens
2. App shell
3. Buttons, inputs, selects, combobox, date pickers
4. Sidebar, topbar, tabs, breadcrumbs, command palette
5. Table system
6. Drawer + modal system
7. Badge/chip/status system
8. Toast/alert/banner system
9. Empty/loading/error states
10. Board card/column
11. Timeline primitives
12. Chart wrappers
13. Accessibility and reduced-motion rules
14. Light/dark/high-contrast themes
15. Documentation and usage guidance

---

## 31. Gold-Standard Version
Includes everything in MVP plus:
- Query builder
- Automation builder
- Permissions matrix
- Audit log
- Real-time collaboration indicators
- Advanced motion orchestration
- Role-based templates
- AI assistant surface patterns
- Extensive chart system
- Content authoring system
- Advanced keyboard maps

---

## 32. Final Recommendation
For a **2026-modern project management SaaS**, the winning direction is:
- neutral, high-density, premium interface
- strong typography and hierarchy
- restrained color usage
- rich but disciplined motion
- highly customizable workspaces
- accessibility-first interaction model
- tokenized design system built on Next.js App Router + Tailwind v4 + shadcn/ui + Radix + Motion

This should feel less like a generic dashboard template and more like a serious product operating system for work.

