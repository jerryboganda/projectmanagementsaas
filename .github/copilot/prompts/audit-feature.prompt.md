---
description: "Deep audit of a specific feature module — traces component structure, data flow, API integration, state management, and identifies issues."
---

# Audit Feature Module

Perform a deep audit of the **{{feature}}** feature module in this PM SaaS workspace.

## Scope

Analyze these areas:

1. **Component Structure** — Does `components/{{feature}}/` follow the layout/surface/toolbar/detail/data pattern? List each file and its role.

2. **Data Model** — Review `components/{{feature}}/data.ts` types. Are interfaces properly defined? Do mock data items have variety in status/priority/health values?

3. **State Management** — How is state managed in the layout component? Is it using local useState, context, or TanStack Query hooks?

4. **API Integration** — Is this feature wired to the backend API via `hooks/use-{{feature}}-data.ts`? Or still using mock data? Check `lib/api/client.ts` for relevant methods.

5. **Backend Coverage** — Does `backend/src/LinearPrecision.Api/Modules/` have a corresponding module? What endpoints exist?

6. **UI Quality** — Does the feature handle loading, empty, error, and success states? Is the dark theme consistent? Are animations using Motion?

7. **Accessibility** — Basic a11y check: semantic HTML, keyboard navigation, ARIA attributes.

## Output

Return a structured report with:
- **Status**: Complete / Partial / Missing per area
- **Issues**: Specific problems found with file paths
- **Recommendations**: Prioritized list of improvements
- **Risk**: Areas that would break if modified carelessly

Use subagents for parallel exploration if the feature has many files.
