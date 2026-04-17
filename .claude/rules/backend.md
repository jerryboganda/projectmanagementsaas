---
description: Rules for backend C# files in the ASP.NET Core modular monolith
globs: ["backend/**/*.cs"]
---

# Backend C# Rules

## Module Pattern
Each module under `Modules/<Name>/` contains:
- `Endpoints/` — Minimal API route handlers
- `Models/` — Domain entities and DTOs
- `Validators/` — FluentValidation rules
- `Events/` — Domain events
- `Handlers/` — Event and command handlers

## Code Style
- Target framework: net9.0
- Language version: latest (top-level statements, pattern matching, records)
- Nullable reference types: enabled (`#nullable enable` implicit)
- Implicit usings: enabled
- Use minimal API pattern — not MVC controllers
- Use records for DTOs, classes for entities

## Infrastructure
- EF Core interceptors: AuditInterceptor, SoftDeleteInterceptor, TenantInterceptor, DomainEventDispatcher
- JWT Bearer authentication with Redis revocation check
- Redis cache prefix: `lp:`
- Rate limiting middleware configured in Program.cs
- Serilog for structured logging

## Testing
- MSTest framework
- Unit tests: `backend/tests/LinearPrecision.Api.Tests/`
- Worker tests: `backend/tests/LinearPrecision.Worker.Tests/`
- Integration tests: `backend/tests/LinearPrecision.Integration.Tests/`
- Run with: `dotnet test backend/LinearPrecision.sln --no-restore`
