# Linear Precision — Mobile Design System

**Version:** 1.0
**Status:** canonical — every mobile screen MUST follow this document
**Reference screenshot:** the archived `_archived_Mobile_App/app/page.tsx` landing view

This document is the single source of truth for the mobile app's look and feel. It mirrors the original "Linear Precision PM" dashboard that was archived, and **replaces** the generic shared-web Layouts that were mistakenly adopted during the first scaffold pass.

---

## 1. Design Language

Terminal-inspired, information-dense, minimalist dark surface. Inspired by Linear, GitHub Primer Mono, and Bloomberg Terminal. Three personality markers:

1. **Mono uppercase labels with tracking-widest** for every section header, metric label, and nav label.
2. **Large bold sans-serif numbers** (32 px) for hero metrics.
3. **Hairline `#1A1A1A` borders** instead of shadows or elevation.

Use of color is restrained. The only chromatic accents are:

- `#0066FF` — primary / active / links / hover rail
- `emerald-500` — positive delta, success, deploy
- `orange-500` — negative delta, at-risk
- `#F97316` — high priority / urgent marker

---

## 2. Tokens

### 2.1 Colors (Tailwind arbitrary values)

| Token | Hex | Usage |
| --- | --- | --- |
| `bg-background` | `#0A0A0A` | Page background, top bar, bottom nav |
| `bg-surface` | `#111111` | Slightly raised surfaces (rare — prefer flat) |
| `bg-surface-hover` | `#141414` | Row hover on touch / desktop preview |
| `bg-chip` | `#1A1A1A` | Inline mono chips (issue keys, badges) |
| `border-hairline` | `#1A1A1A` | All dividers, section borders, row separators |
| `border-chip` | `#222222` | Hover border on interactive chips |
| `text-primary` | `slate-100` (#F1F5F9) | Body, headings, metric numbers |
| `text-secondary` | `slate-300` (#CBD5E1) | Row labels |
| `text-muted` | `slate-400` (#94A3B8) | Secondary prose |
| `text-label` | `slate-500` (#64748B) | Uppercase mono labels |
| `text-mono-dim` | `slate-600` (#475569) | Timestamps, meta |
| `accent` | `#0066FF` | Primary, active nav, create button, link |
| `accent-soft-bg` | `rgba(0, 102, 255, 0.10)` | Button backgrounds, active row rail |
| `accent-soft-border` | `rgba(0, 102, 255, 0.20)` | Primary button border |
| `positive` | `emerald-500` | Positive trend, success |
| `negative` | `orange-500` | Negative trend |
| `urgent` | `#F97316` | High-priority "!" marker |

### 2.2 Typography

| Style | Font | Size | Weight | Tracking | Case |
| --- | --- | --- | --- | --- | --- |
| Hero metric | sans | 32 / 1.0 | 700 | tight (-0.02em) | as-is |
| Title (H1) | sans | 13 | 600 | wide (0.05em) | UPPERCASE |
| Section header | mono | 12 | 700 | widest (0.1em) | UPPERCASE |
| Row primary | sans | 13 | 400 | normal | as-is |
| Row meta | mono | 11 | 400 | normal | as-is |
| Label | mono | 11 | 600 | widest (0.1em) | UPPERCASE |
| Nav label | mono | 10 | 700 | widest (0.1em) | UPPERCASE |
| Chip / badge | mono | 11 | 500 | wider (0.05em) | UPPERCASE |
| Timestamp | mono | 10–11 | 400 | normal | lowercase abbrev (`2h`, `45m`, `Apr 10`) |

Font stack:

```
--font-sans: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
```

### 2.3 Spacing & Layout

- Horizontal page padding: `px-4` (16 px).
- Vertical section spacing: `mt-2` between sections, inner `py-4` on section headers.
- Row height: `h-[52px]` for triage / issue rows.
- Section header row: `py-4` with `border-b border-[#1A1A1A]`.
- Divider between rows: `divide-y divide-[#1A1A1A]`.
- Content bottom-pads `pb-20` to clear the bottom nav (`60 px + safe-bottom`).

### 2.4 Motion

- Screen transition: 180 ms fade + 6 px y slide (keep it subtle).
- Row hover: `transition-colors` only. Do not animate height or translate.
- Active rail: 2 px left bar `#0066FF`, fades in on hover (desktop) / active press (mobile).
- Respect `prefers-reduced-motion`.

### 2.5 Radius

- Icon tiles / logos: `rounded-[4px]`
- Mono chips / badges: `rounded-[3px]`
- Buttons: `rounded-[4px]`
- Avatars: `rounded-[4px]` (square-ish, not circles — this is part of the LP aesthetic)

---

## 3. Shell

### 3.1 Top Bar (fixed, 56 px + safe-top)

```
┌─[LogoTile]─[LINEAR PRECISION PM]─[▼]───────────[+]─┐
```

- Height: `h-14` (56 px).
- Background: `#0A0A0A`, `border-b border-[#1A1A1A]`, sticky, `z-50`.
- Logo tile: 24 × 24, `#0066FF`, rounded-4px, white vector layered icon inside.
- Title: `text-[13px] font-semibold tracking-wide uppercase font-mono text-slate-100`.
- Chevron: `ChevronsUpDown` 4×4 `text-slate-500` — this opens the workspace / destination switcher.
- Right: `size-7 rounded-[4px] bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20` Plus button — opens create menu.

**No centered page titles, no back button.** Top bar is a constant brand anchor. Routing within the app is driven by the 4-tab bottom nav and the workspace switcher.

### 3.2 Bottom Nav (fixed, 60 px + safe-bottom)

Exactly **4 tabs** (not 5):

| Tab | Icon | Route | Default? |
| --- | --- | --- | --- |
| Inbox | `Inbox` (filled when active) | `/` | ✅ |
| Issues | `List` | `/issues` | |
| Projects | `LayoutGrid` | `/projects` | |
| Search | `Search` | `/search` | |

- Labels: mono, 10 px, 700 weight, uppercase, tracking-widest.
- Active color: `#0066FF`. Inactive: `text-slate-500`, hover `text-slate-300`.
- Icon stroke: `1.5`.
- Active icon has `fill="currentColor"`; inactive is stroked only.
- No badge dots on scaffold — when real notification count wires in, use a 6 px `#0066FF` dot top-right of Inbox icon.

**All other feature destinations** (Board, Calendar, Timeline, Goals, Portfolio, Workload, Reports, Docs, Sprints, Time Tracking, Templates, Automations, Settings) live inside an in-app **workspace switcher sheet** triggered by the top-bar chevron. They are not tabs.

---

## 4. Primitives (must exist in `mobile/src/ui/`)

Every screen is composed from these building blocks. **Do not import shared web Layouts** (`ProjectsLayout`, `InboxLayout`, etc.) into mobile — those are desktop designs.

- `SectionHeader` — mono uppercase 12 px label + optional right-side controls, followed by `border-b`.
- `MetricRow` — label + 32 px value + trend pill.
- `TrendPill` — emerald (+) or orange (−) pill with mono delta text.
- `TriageItem` / `IssueRow` — checkbox, priority badge, overdue badge, date badge, avatar, title, mono time.
- `ActivityItem` — avatar tile, wrap-aware body, mono `target` chip, time.
- `FilterDropdown` — mono uppercase button with `ChevronDown`, menu `bg-[#1A1A1A]` border `#222`.
- `SearchInput` — full-width pill, `bg-[#111]` border `#1A1A1A`, 12 px leading icon.
- `EmptyState` — centered 40 px icon + 13 px title + 12 px muted paragraph.
- `Chip` — mono uppercase 11 px, `bg-[#1A1A1A]` or color-10/20 variants.
- `PriorityBadge` — `HIGH` red, `MEDIUM` amber, `LOW` slate, 10 px mono uppercase.
- `StatusBadge` — `OPEN`, `IN PROGRESS`, `DONE`, `OVERDUE`, `AT RISK`, `BLOCKED` — all 10 px mono uppercase, colored bg-10 border-20.

---

## 5. Screen Composition Pattern

Every screen follows exactly this structure:

```tsx
<div className="flex min-h-full flex-col bg-[#0A0A0A] text-slate-100 pb-20">
  {/* 1. Hero metric strip (optional, max 3 rows) */}
  <section className="border-b border-[#1A1A1A]">
    <MetricRow ... />
    <MetricRow ... />
    <MetricRow ... />
  </section>

  {/* 2..N. Named sections */}
  <section className="mt-2">
    <SectionHeader title="..." actions={<FilterDropdown ... />} />
    <div className="divide-y divide-[#1A1A1A]">
      {rows.map(r => <Row key={r.id} {...r} />)}
    </div>
  </section>
</div>
```

No page-specific padding. No custom headers. The top bar and bottom nav are always present via `MobileShell`.

---

## 6. Screens Catalog

| Route | Name | Primary sections |
| --- | --- | --- |
| `/` | Inbox (Home dashboard) | Metrics (Open / InProgress / Completed) · Personal Triage · Recent Activity |
| `/issues` | Issues | Filter bar · Grouped issue list · Empty state |
| `/projects` | Projects | Filter bar · Project list (with progress pill + health chip) |
| `/projects/:id` | Project detail | Header metrics · Tabs (Overview, Tasks, Docs, Activity) · Scrollable sections |
| `/search` | Search | Search input · Recent searches · Result groups |
| `/board` | Board | Column swiper · Board cards |
| `/calendar` | Calendar | Date strip · Grouped events |
| `/timeline` | Timeline | Gantt-style rows |
| `/goals` | Goals | OKR rows · Progress bars |
| `/portfolio` | Portfolio | Portfolio metric strip · Program list |
| `/workload` | Workload | Per-user load rows |
| `/reports` | Reports | Report tiles |
| `/docs` | Docs | Doc tree |
| `/sprints` | Sprints | Sprint strip · Burndown |
| `/time-tracking` | Time | Today total · Entries list |
| `/templates` | Templates | Template grid |
| `/automations` | Automations | Rule rows |
| `/settings` | Settings | Grouped settings list |

---

## 7. Non-negotiables (common regressions to avoid)

1. **No desktop-web layouts in mobile.** `components/**/*-layout.tsx` is forbidden inside `mobile/src/**`.
2. **Top bar title is always `LINEAR PRECISION PM`.** It does not change per route.
3. **Bottom nav has 4 tabs, not 5.** Home is renamed to Inbox.
4. **Uppercase mono tracking-widest on every label.** No mixed-case body labels on UI chrome.
5. **Borders over shadows.** Never use `box-shadow` for elevation.
6. **No Motion page-scale / rotate transitions.** Only opacity + 6 px y.
7. **No circular avatars.** Use 4-px rounded squares.
8. **No emojis, no gradients, no glass morphism.** This is a terminal aesthetic.
