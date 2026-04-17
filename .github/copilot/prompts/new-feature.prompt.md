---
description: "Plan and implement a new feature module following project conventions — creates data model, components, route, and sidebar entry."
---

# New Feature Module

Plan and implement a new **{{feature_name}}** feature module for the Linear Precision PM SaaS.

## Requirements

{{description}}

## Workflow

### Phase 1: Plan (load `.agents/skills/feature-plan/SKILL.md`)

1. Define the data model — TypeScript interfaces for the feature's entities
2. Design the component structure following the pattern:
   - `components/{{feature_name}}/{{feature_name}}-layout.tsx` — container with state
   - `components/{{feature_name}}/{{feature_name}}-surface.tsx` — main content
   - `components/{{feature_name}}/{{feature_name}}-toolbar.tsx` — search/filter controls
   - `components/{{feature_name}}/{{feature_name}}-detail.tsx` — detail side panel
   - `components/{{feature_name}}/data.ts` — interfaces + mock data
3. Plan the page route: `app/{{feature_name}}/page.tsx`
4. Identify if sidebar navigation needs updating

### Phase 2: Implement

Create all files following project conventions:
- `"use client"` for interactive components
- Tailwind CSS dark theme styling
- Lucide React icons
- Motion animations for enter/exit
- `cn()` for conditional classes
- `@/` import path alias

### Phase 3: Validate

```bash
cmd /c npm run lint
cmd /c npm run typecheck
cmd /c npm run build
```

## Output

- All new files created and building cleanly
- Feature accessible via its route
- Brief summary of files created and any decisions made
