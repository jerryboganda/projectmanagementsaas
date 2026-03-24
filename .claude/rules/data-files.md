---
description: Rules for feature data files containing types and mock data
globs: ["components/**/data.ts"]
---

# Data File Rules

## Structure
Each `data.ts` file must export:
1. TypeScript interfaces/types for the feature's data models
2. Mock data arrays/objects conforming to those types

## Type Conventions
- Use `interface` for object shapes (not `type` aliases for objects)
- Status fields use string literal unions
- IDs are strings
- Dates are ISO strings
- The `User` type is duplicated per feature for now — when consolidating, create `@/types/shared.ts`

## Mock Data
- Keep 4-8 items per collection for realistic demos
- Use `picsum.photos` seeds for avatar images
- Include variety in status, priority, and health values
- Use realistic project names and descriptions
