---
description: Rules for all frontend component and page files
globs: ["components/**/*.tsx", "app/**/*.tsx", "app/**/*.ts"]
---

# Frontend Component Rules

## Component Pattern
- Every feature directory follows: layout → surface → toolbar → detail → data
- Layout components manage state and coordinate children
- Surface components render the main visual content
- Toolbar components handle search, filter, and view controls
- Detail components show expanded item views (typically as side panels)
- Data files export TypeScript interfaces AND mock data arrays

## Styling
- Use Tailwind CSS classes exclusively — no inline styles or CSS modules
- Use `cn()` from `@/lib/utils` for conditional classes
- Follow the dark theme palette from globals.css
- Use `motion` components for enter/exit animations
- Use Lucide React for all icons

## State Management
- Prefer component-local `useState` for feature-specific state
- Use React Context only for cross-component shared state
- Use `useMemo` for expensive derived data (filtered/grouped lists)

## Imports
- Use `@/` path alias for all imports
- Group imports: React/Next → external libs → local components → types/data
