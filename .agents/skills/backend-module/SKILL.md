---
name: backend-module
description: Use when creating a new ASP.NET Core domain module in the backend modular monolith. Covers module structure, registration, endpoints, entities, and tests.
---

# Backend Module Creation Workflow

Use this skill when adding a new domain module to the ASP.NET Core backend.

## Steps

1. **Define module scope**
   - What domain concept does this module own?
   - What entities, DTOs, and operations are needed?
   - Which existing modules does it interact with?

2. **Create module directory**
   ```
   backend/src/LinearPrecision.Api/Modules/<ModuleName>/
     Endpoints/       ← Minimal API route handlers
     Models/          ← Domain entities and DTOs
     Validators/      ← FluentValidation rules
     Events/          ← Domain events
     Handlers/        ← Event and command handlers
   ```

3. **Create entities in Shared project**
   - Add entity classes to `backend/src/LinearPrecision.Shared/`
   - Follow existing patterns: Guid IDs, audit fields, soft delete support
   - Add DbSet to the EF Core context

4. **Create module endpoints**
   - Follow minimal API pattern matching existing modules
   - Standard CRUD: List (GET), Get (GET /:id), Create (POST), Update (PUT /:id), Delete (DELETE /:id)
   - Apply auth, rate limiting, and validation

5. **Create module registration**
   - Add `Add<Module>Module()` extension method
   - Register in `Program.cs` alongside existing module registrations
   - Register validators, handlers, and any module-specific services

6. **Create validators**
   - Use FluentValidation for request validation
   - Validate required fields, string lengths, enum ranges

7. **Create EF Core migration**
   ```bash
   dotnet ef migrations add Add<ModuleName> --project backend/src/LinearPrecision.Api
   ```

8. **Write tests**
   - Add unit tests in `backend/tests/LinearPrecision.Api.Tests/`
   - Test endpoint handlers, validators, and business logic
   - Follow existing MSTest patterns

9. **Validate**
   ```bash
   dotnet restore backend/LinearPrecision.sln
   dotnet test backend/LinearPrecision.sln --no-restore
   ```

10. **Update docs**
    - Update `docs/frontend-to-backend-integration-matrix.md` with new endpoints
    - Update `docs/domain-model.md` if new entities added
