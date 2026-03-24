---
name: feature-plan
description: Create an implementation plan for a new feature module following project conventions. Use when adding a new feature area (e.g., new page + component directory).
---

# Feature Implementation Plan

When the user wants to add a new feature to the project management SaaS, create a structured plan.

## Steps

1. **Define the feature scope** — what data models, views, and interactions are needed
2. **Design the data model** — create TypeScript interfaces in a new `data.ts` file
3. **Plan the component structure** following the project pattern:
   - `<feature>-layout.tsx` — container with state management
   - `<feature>-surface.tsx` — main visual content
   - `<feature>-toolbar.tsx` — search, filter, view controls
   - `<feature>-detail.tsx` — detail panel for selected items
   - `data.ts` — types + mock data
4. **Create the page route** — `app/<feature>/page.tsx`
5. **Add sidebar navigation** — update `components/sidebar.tsx`
6. **Validate** — run `npm run build` to catch errors

## Output Format

Return a structured plan with:
- Feature description
- Data model (TypeScript interfaces)
- Component list with responsibilities
- New files to create
- Existing files to modify
- Risk areas or dependencies
