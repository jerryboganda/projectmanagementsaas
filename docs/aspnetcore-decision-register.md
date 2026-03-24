# ASP.NET Core Decision Register — Linear Precision PM SaaS

> **Status:** Draft v1.0
> **Last updated:** 2026-03-19
> **Owner:** Backend Architecture Team
> **Related:** `backend-architecture-master-plan.md`, `domain-model.md`, `data-model-and-storage-plan.md`

---

## 1. Purpose

This document records key technology and architecture decisions made during the design of the Linear Precision backend. Each decision follows an Architecture Decision Record (ADR) format with context, options considered, the decision taken, rationale, and consequences.

Decisions are numbered sequentially. Once a decision is **Accepted**, it remains in effect unless a subsequent ADR supersedes it.

---

## 2. Decision Log

### ADR-001: Modular Monolith over Microservices

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** The project is starting from a frontend-only Next.js prototype with zero backend. The team is small (2-4 engineers). We need an architecture that enables rapid feature delivery while preserving the ability to extract services later.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Microservices | Independent deployment, tech diversity, fault isolation | Distributed complexity, network latency, operational overhead, overkill for team size |
| Modular monolith | Simple deployment, in-process communication, easy debugging, refactor-friendly | Must enforce module boundaries manually, single deployment unit |
| Traditional layered monolith | Familiar, simple | Cross-cutting concerns leak across layers, hard to extract modules later |

**Decision:** Build as a modular monolith with explicit module boundaries per feature domain.

**Rationale:** A modular monolith gives us the development speed of a monolith with the architectural hygiene of microservices. Module boundaries are enforced through folder structure, DI registration, and MediatR-mediated cross-module communication. This is appropriate for our team size and allows extraction to microservices if scale demands it.

**Consequences:**
- Positive: Single deployable, simple infrastructure, fast in-process communication, easy local development.
- Negative: Must discipline ourselves to respect module boundaries — no direct cross-module DbContext access.
- Mitigations: Code reviews enforce boundary rules; MediatR notifications for cross-module events; consider ArchUnitNET tests later.

---

### ADR-002: ASP.NET Core 9 Minimal APIs as Default API Style

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** ASP.NET Core supports both Controllers and Minimal APIs. We need a consistent API style across 18 modules with minimal boilerplate, strong OpenAPI integration, and good testability.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Controllers | Familiar MVC pattern, built-in model binding, attribute routing | More boilerplate, heavier base classes, slower startup |
| Minimal APIs | Less ceremony, faster startup, first-class OpenAPI support in .NET 9, composable via MapGroup | Less discoverability without conventions, newer pattern |
| Hybrid | Best of both worlds for specific modules | Inconsistency across codebase |

**Decision:** Use Minimal APIs as the default for all domain modules. Use Controllers only for the Identity module where ASP.NET Core Identity scaffolding expects them.

**Rationale:** Minimal APIs in .NET 9 have reached feature parity with Controllers for our needs. The `MapGroup()` pattern maps cleanly to our module structure. Each module registers its endpoints in a static extension method, giving us consistent discoverability.

**Consequences:**
- Positive: Less boilerplate, faster compilation, cleaner module registration pattern.
- Negative: Identity module uses a different pattern (Controllers), creating a minor inconsistency.
- Mitigations: Document the exception clearly; Identity is a one-off module with external scaffolding requirements.

---

### ADR-003: PostgreSQL as Primary Database

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** We need a relational database that supports multi-tenant row-level security, JSONB for flexible fields, full-text search, and strong transactional guarantees. The database must have a healthy open-source ecosystem and managed hosting options.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| PostgreSQL 16+ | JSONB, full-text search, partial indexes, CTEs, strong ecosystem, excellent .NET support via Npgsql | Less familiar to some teams than SQL Server |
| SQL Server | Excellent .NET integration, mature tooling, temporal tables | Licensing costs, less flexible JSON support, vendor lock-in |
| MySQL 8 | Widely used, good performance | Weaker JSON support, no partial indexes, less advanced features |
| CockroachDB | Distributed SQL, PostgreSQL wire-compatible | Added complexity, less mature tooling, overkill for current scale |

**Decision:** Use PostgreSQL 16+ as the primary and only relational database.

**Rationale:** PostgreSQL provides the best combination of advanced features (JSONB, GIN indexes, partial unique indexes, `tsvector` full-text search) with zero licensing cost. Npgsql is the most mature .NET PostgreSQL driver. Managed hosting is available on every cloud (Neon, Supabase, RDS, Azure, GCP).

**Consequences:**
- Positive: JSONB for flexible schema fields (labels, settings, automation configs), built-in full-text search avoids a separate search engine initially, partial indexes for business rules.
- Negative: Team members more familiar with SQL Server need to learn PostgreSQL-specific features.
- Mitigations: Use EF Core abstractions where possible; document PostgreSQL-specific patterns.

---

### ADR-004: EF Core 9 with Code-First Migrations

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** We need an ORM strategy for 36 tables across 18 modules. The ORM must support multi-tenant global query filters, soft delete interception, audit field population, and PostgreSQL-specific features.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| EF Core 9 Code-First | Rich LINQ, migrations, interceptors, global query filters, change tracking | Performance overhead for bulk operations, abstraction leaks |
| Dapper only | Raw SQL performance, full control | No change tracking, no migrations, manual mapping boilerplate |
| EF Core + Dapper hybrid | Best of both — EF for CRUD, Dapper for complex reads | Two data access patterns to maintain |

**Decision:** Use EF Core 9 as the primary ORM with code-first migrations. Use Dapper as a secondary read-only tool for complex reporting queries (see ADR-005).

**Rationale:** EF Core 9's global query filters are essential for multi-tenant isolation. SaveChanges interceptors handle audit fields and soft delete consistently. Code-first migrations keep schema evolution in source control. The Npgsql provider supports all PostgreSQL-specific column types we need.

**Consequences:**
- Positive: Multi-tenant filters applied automatically, audit fields populated via interceptor, migration history tracked in Git.
- Negative: Must be careful with N+1 queries; complex reporting queries may be awkward in LINQ.
- Mitigations: Use Dapper for analytics (ADR-005); add query logging in development; use `.AsNoTracking()` for read-heavy paths.

---

### ADR-005: Dapper for Reporting and Analytics Queries

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** The Analytics module needs to run complex cross-module aggregate queries (velocity charts, burndown, workload distribution) that would be awkward and potentially slow to express in LINQ/EF Core.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| EF Core raw SQL | Stays within one ORM | Verbose, no micro-ORM mapping convenience |
| Dapper | Lean, raw SQL with strong mapping, battle-tested | Separate data access pattern, no change tracking |
| Hand-rolled ADO.NET | Maximum control | Too much boilerplate |

**Decision:** Use Dapper for all read-only reporting and analytics queries in the Analytics module.

**Rationale:** Dapper's micro-ORM approach maps cleanly to hand-tuned SQL for complex aggregates, window functions, and CTEs. It avoids EF Core's change tracker overhead for queries that never write data.

**Consequences:**
- Positive: Optimal SQL for complex reports, no change tracker overhead, easy to tune with EXPLAIN.
- Negative: Two data access patterns in the codebase.
- Mitigations: Dapper usage is scoped to the Analytics module; all other modules use EF Core exclusively.

---

### ADR-006: UUID v7 Primary Keys

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** Primary keys must be globally unique (for cross-module references and future service extraction), avoid sequential-integer enumeration attacks, and maintain reasonable index performance.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Auto-increment integer | Simple, small, fast index scans | Enumerable, not globally unique, problematic for distributed systems |
| UUID v4 | Globally unique, no coordination | Random — causes B-tree page splits, poor index locality |
| UUID v7 | Globally unique, time-ordered — preserves B-tree insert locality | Slightly larger than integers (16 bytes), newer standard |
| ULID | Time-ordered, Crockford base32 sortable | Non-standard, less tooling support |

**Decision:** Use UUID v7 for all primary keys across all tables.

**Rationale:** UUID v7 provides the global uniqueness needed for a multi-module system with the time-ordering property that maintains B-tree insert performance. PostgreSQL's `gen_random_uuid()` can be replaced with a v7 generator at the application level. This also eliminates sequence contention under concurrent inserts.

**Consequences:**
- Positive: No sequence contention, globally unique across modules, time-sortable by creation order.
- Negative: 16 bytes per key vs 4-8 bytes for integers; join performance slightly lower.
- Mitigations: Impact is negligible at our expected scale; indexes on UUID v7 columns remain compact due to time-ordering.

---

### ADR-007: MediatR for In-Process CQRS

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** We want a consistent pattern for dispatching commands and queries within modules, and a way to publish domain events across module boundaries without direct dependencies.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| MediatR | Mature, pipeline behaviors for cross-cutting concerns, `INotification` for events | Magic indirection, harder to navigate call chains |
| Direct service injection | Simple, easy to trace | Tight coupling between modules, no pipeline behaviors |
| Wolverine | Modern, built-in saga support | Less mature ecosystem, steeper learning curve |
| Custom dispatcher | Full control | Maintenance burden, reinventing the wheel |

**Decision:** Use MediatR 12.x for in-process command/query dispatch and domain event notifications.

**Rationale:** MediatR's `IRequest<T>` / `IRequestHandler<T>` pattern maps directly to our CQRS-lite approach. Pipeline behaviors give us validation, logging, and performance tracking with zero per-handler boilerplate. `INotification` enables cross-module event consumers without circular dependencies.

**Consequences:**
- Positive: Consistent handler pattern, pluggable pipeline behaviors, decoupled event consumers.
- Negative: Indirection makes call-chain navigation harder in IDEs; must avoid overusing notifications for synchronous workflows.
- Mitigations: Use Go-to-Implementation in Rider/VS; keep notification handlers async and non-critical.

---

### ADR-008: FluentValidation over Data Annotations

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** Request validation must be consistent, testable, and support complex rules (cross-field validation, async checks like uniqueness).

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Data Annotations | Built-in, familiar, no extra dependency | Limited to simple rules, hard to test in isolation, no async support |
| FluentValidation | Expressive fluent syntax, async rules, DI support, testable | Extra dependency, separate from model |
| Custom validation | Full control | Maintenance burden |

**Decision:** Use FluentValidation with MediatR pipeline behavior for automatic validation of all commands and queries.

**Rationale:** FluentValidation's `AbstractValidator<T>` classes are independently testable and support complex rules including async database checks. The `ValidationBehavior<TRequest, TResponse>` pipeline behavior in MediatR validates every request before it reaches the handler.

**Consequences:**
- Positive: Validators are unit-testable, support complex cross-field and async rules, validation is automatic via pipeline.
- Negative: Validators are separate from the request model — must remember to create them.
- Mitigations: Convention: every command gets a validator; CI can flag commands without corresponding validator classes.

---

### ADR-009: Redis for Caching, Rate Limiting, and SignalR Backplane

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** We need a fast in-memory store for distributed caching, rate-limit counters, refresh token blocklist, user presence tracking, and SignalR multi-instance scaling.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Redis 7+ | Sub-millisecond latency, pub/sub, TTL, sorted sets, mature .NET client | Additional infrastructure dependency |
| In-memory `IMemoryCache` | Zero infrastructure, built-in | Not distributed — breaks with multiple API instances |
| Memcached | Simple, fast | No pub/sub, no data structures beyond key-value |
| Valkey (Redis fork) | API-compatible, permissive license | Younger ecosystem |

**Decision:** Use Redis 7+ as the single transient data store for caching, rate limiting, SignalR backplane, token blocklist, and presence state.

**Rationale:** Redis serves multiple roles that would otherwise require separate services. The `StackExchange.Redis` client is the gold standard for .NET. Redis pub/sub powers SignalR scaling. TTL-based key expiry handles token and cache lifecycle automatically.

**Consequences:**
- Positive: One infrastructure dependency serves five use cases; sub-millisecond reads.
- Negative: Redis is another service to operate and monitor.
- Mitigations: Use managed Redis (Upstash, ElastiCache) in production; local Redis via Docker Compose for development.

---

### ADR-010: JWT RS256 over HS256 or Opaque Tokens

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** The API needs a stateless authentication token format. The signing algorithm must allow the API to validate tokens without holding the signing key, supporting future scenarios like microservice extraction.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| JWT HS256 (symmetric) | Simple, fast | Signing key must be shared with every validator; compromised validator leaks signing capability |
| JWT RS256 (asymmetric) | Private key only on issuer; public key for validation; supports JWKS endpoint | Slightly slower signing (~1ms), larger token | 
| Opaque tokens + introspection | Revocable, no exposed claims | Requires introspection endpoint for every request; not stateless |
| JWT ES256 (ECDSA) | Smaller signatures than RS256 | Less .NET tooling maturity for key management |

**Decision:** Use JWT with RS256 (RSA 2048-bit) for access tokens.

**Rationale:** RS256 allows the token issuer (Identity module) to hold the private key while any service can validate using the public key from a JWKS endpoint. This is future-proof for service extraction and prevents key compromise from propagating.

**Consequences:**
- Positive: Stateless validation, JWKS key discovery, signing key isolation.
- Negative: Slightly larger tokens than HS256; RSA key rotation required every 90 days.
- Mitigations: 15-minute token lifetime limits exposure; key rotation is automated via configuration.

---

### ADR-011: Refresh Token Rotation with Family Tracking

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** Refresh tokens are long-lived (7 days). We need a strategy that detects token theft and limits the blast radius of compromised refresh tokens.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Static refresh tokens (no rotation) | Simple | Stolen token valid for entire lifetime |
| Rotation without family tracking | Each refresh issues new token, old one invalidated | Cannot detect concurrent use (theft) |
| Rotation with family tracking | Detects theft via reuse detection; invalidates entire chain | More complex Redis state management |

**Decision:** Implement refresh token rotation with family-based reuse detection.

**Rationale:** Each refresh token belongs to a `familyId`. When a token is refreshed, the old token is marked as revoked and a new one is issued with the same `familyId`. If a revoked token is ever presented (indicating theft), the entire family is invalidated, forcing re-authentication.

**Consequences:**
- Positive: Automatic theft detection, limited blast radius, defense in depth.
- Negative: Slightly more Redis state; legitimate race conditions (e.g., duplicate requests) can trigger false positives.
- Mitigations: Frontend retry logic with exponential backoff; a brief grace period (~10 seconds) before revoking the family on reuse.

---

### ADR-012: Row-Level Multi-Tenancy via Global Query Filters

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** Every workspace (tenant) must have complete data isolation. We need a mechanism that is transparent to module code and impossible to accidentally bypass.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Separate database per tenant | Strongest isolation, easy to reason about | Operational nightmare at scale, connection pool explosion, migration per tenant |
| Separate schema per tenant | Good isolation within one database | EF Core doesn't support dynamic schema switching well |
| Row-level with global query filters | Shared schema, transparent filtering, simple operations | Must ensure filter is always applied; harder to reason about cross-tenant queries |
| PostgreSQL RLS policies | Database-enforced, impossible to bypass in app | Complex setup, debugging difficulty, not standard EF Core pattern |

**Decision:** Use row-level multi-tenancy with EF Core global query filters on `WorkspaceId`. Every `TenantEntity` has a `WorkspaceId` column, and a global filter ensures queries are always scoped.

**Rationale:** Global query filters are applied at the DbContext level and cannot be accidentally omitted by module code. The `TenantResolutionMiddleware` resolves the workspace from `X-Workspace-Id` header and sets the `ITenantContext.WorkspaceId` that the filter references.

**Consequences:**
- Positive: Transparent to module developers — no manual WHERE clauses needed; single migration path.
- Negative: Cross-tenant admin queries require explicitly ignoring filters (`.IgnoreQueryFilters()`); must audit any use of filter bypass.
- Mitigations: `SaveChangesInterceptor` validates that `WorkspaceId` is set on all `TenantEntity` inserts; `.IgnoreQueryFilters()` usage is flagged in code review.

---

### ADR-013: SignalR for Real-Time over WebSockets or SSE

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** The application needs real-time updates for board changes, notifications, presence indicators, and AI response streaming. The solution must work with the existing ASP.NET Core stack and scale across multiple API instances.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Raw WebSockets | Low-level control, lightweight | No built-in reconnection, serialization, or group management |
| SignalR | Built-in reconnection, groups, hub pattern, Redis backplane, first-class .NET + JS clients | Heavier than raw WS; opinionated protocol |
| Server-Sent Events (SSE) | Simple, HTTP-based, firewall-friendly | Unidirectional (server→client only), no binary support |
| Third-party (Pusher, Ably) | Managed infrastructure | Vendor lock-in, cost at scale, latency |

**Decision:** Use ASP.NET Core SignalR with Redis backplane for all real-time features.

**Rationale:** SignalR provides automatic reconnection, transport fallback (WebSockets → SSE → Long Polling), typed hub methods, group management (per-workspace, per-project), and a Redis backplane for multi-instance scaling. The `@microsoft/signalr` npm package integrates cleanly with the Next.js frontend.

**Consequences:**
- Positive: Four hubs (Board, Notification, Presence, AI Stream) share one infrastructure; automatic reconnection; scales via Redis pub/sub.
- Negative: SignalR protocol adds overhead vs raw WebSockets; must manage connection lifecycle on the client.
- Mitigations: Connection pooling on client; lazy hub connection (only connect when the feature is active).

---

### ADR-014: Hangfire over Hosted BackgroundService for Jobs

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** Background processing is needed for email dispatch, search indexing, usage aggregation, automation execution, report generation, invitation expiry, sprint auto-completion, and data cleanup. Jobs must survive process restarts, support scheduling, and provide visibility.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| `IHostedService` / `BackgroundService` | Built-in, no dependency | No persistence, no retry, no dashboard, lost on restart |
| Hangfire | Persistent (PostgreSQL), retries, scheduling, dashboard, recurring jobs | Additional dependency, PostgreSQL schema |
| Quartz.NET | Mature scheduler, cron triggers | More complex setup, no built-in dashboard |
| Message queue (RabbitMQ) | Decoupled, scalable | Operational overhead, overkill for current needs |

**Decision:** Use Hangfire with PostgreSQL storage for all background job processing. Run the Hangfire server in the dedicated `LinearPrecision.Worker` process.

**Rationale:** Hangfire's persistent storage guarantees jobs survive process restarts. The dashboard provides operational visibility without custom tooling. PostgreSQL storage avoids adding another infrastructure dependency. The `LinearPrecision.Worker` service separates job processing from the API process.

**Consequences:**
- Positive: Persistent jobs, automatic retries with backoff, cron scheduling, built-in dashboard, separation of concerns.
- Negative: Additional PostgreSQL schema (`hangfire`); dashboard needs access control.
- Mitigations: Dashboard access restricted to Owner/Admin roles; Hangfire schema in a separate PostgreSQL schema to avoid clutter.

---

### ADR-015: Serilog over Built-In Logging

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** Structured logging is essential for observability. We need enrichment (correlation ID, tenant ID, user ID), multiple sinks (console, file, OpenTelemetry), and configuration-driven log levels.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Built-in `ILogger` + providers | Zero dependency, standard interface | Limited enrichment, fewer sinks, no structured output by default |
| Serilog | Rich enrichment, 100+ sinks, structured JSON, `ILogger` compatible | Extra dependency |
| NLog | Mature, XML config | Less idiomatic for modern .NET; fewer enrichers |

**Decision:** Use Serilog as the logging provider with OpenTelemetry, Console, and Seq sinks.

**Rationale:** Serilog's structured logging and enrichment pipeline allow us to attach `CorrelationId`, `WorkspaceId`, and `UserId` to every log entry automatically. The `Serilog.Sinks.OpenTelemetry` package exports logs alongside traces and metrics via OTLP.

**Consequences:**
- Positive: Structured JSON logs, automatic enrichment, unified OTLP export, development-friendly console output.
- Negative: Serilog dependency; configuration split between code and `appsettings.json`.
- Mitigations: Bootstrap logging catches startup failures before Serilog initializes; `appsettings.json` overrides for per-module log levels.

---

### ADR-016: OpenTelemetry for Distributed Tracing

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** We need end-to-end request tracing across HTTP requests, database queries, Redis operations, and background jobs. The solution must be vendor-neutral and support multiple backends (Jaeger, Grafana Tempo, Datadog).

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| OpenTelemetry .NET SDK | Vendor-neutral, OTLP standard, auto-instrumentation for ASP.NET Core, EF Core, HTTP client, Redis | Requires collector infrastructure |
| Application Insights SDK | Deep Azure integration, smart detection | Azure vendor lock-in |
| Datadog APM | Rich UI, easy setup | Vendor lock-in, cost |
| Custom tracing | Full control | Massive effort, non-standard |

**Decision:** Use OpenTelemetry .NET SDK with OTLP exporter for traces, metrics, and logs.

**Rationale:** OpenTelemetry is the CNCF standard for observability. The .NET SDK provides auto-instrumentation for ASP.NET Core, EF Core, HTTP clients, and Redis. OTLP export works with any compatible backend (Jaeger for development, Grafana Cloud for production).

**Consequences:**
- Positive: Vendor-neutral, automatic instrumentation, unified traces/metrics/logs, W3C Trace Context propagation.
- Negative: Requires a collector (Jaeger/Grafana Agent) in the infrastructure.
- Mitigations: Docker Compose includes Jaeger for development; production uses managed observability (Grafana Cloud, Datadog via OTLP).

---

### ADR-017: Stripe for Billing Integration

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team, Product

**Context:** The product has four subscription tiers (Free, Pro, Business, Enterprise). We need subscription management, per-seat billing, usage metering, invoicing, and a customer portal. Build vs buy.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Stripe Billing | Complete subscription lifecycle, Checkout, Customer Portal, webhooks, per-seat & usage billing | Transaction fees (~2.9% + 30¢), vendor dependency |
| Paddle | Merchant of record, handles VAT/tax | Higher fees, less API flexibility |
| Custom billing | Full control, no fees | Massive engineering effort, PCI compliance burden |
| LemonSqueezy | Simple API, MoR | Limited per-seat support, less mature |

**Decision:** Use Stripe Billing via the `Stripe.net` SDK for all subscription and payment processing.

**Rationale:** Stripe provides the most comprehensive billing API with native support for per-seat subscriptions, proration, usage-based metering, and a hosted customer portal. The `Stripe.net` SDK is well-maintained and the webhook-based event model integrates naturally with our domain event architecture.

**Consequences:**
- Positive: No PCI compliance burden, hosted checkout/portal, comprehensive webhook events, battle-tested at scale.
- Negative: Transaction fees; Stripe as a critical external dependency.
- Mitigations: Abstract Stripe behind `IBillingService` interface for testability; webhook signature validation; idempotent event handlers.

---

### ADR-018: S3-Compatible Object Storage for Files

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** Users upload file attachments to tasks, documents, and projects. We need object storage that works locally (development) and in production across multiple cloud providers.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| S3-compatible (MinIO local, S3/GCS/Azure Blob production) | Standard API, presigned URLs, lifecycle policies, multi-cloud | Requires S3 SDK abstraction |
| Database BLOB storage | Simple, transactional with other data | Database bloat, backup size, poor for large files |
| Local filesystem | Simplest | Not scalable, not cloud-ready, no CDN |

**Decision:** Use S3-compatible object storage via `AWSSDK.S3`. MinIO for local development, AWS S3 / GCS / Azure Blob for production.

**Rationale:** The S3 API is the de facto standard for object storage. MinIO provides a fully compatible local development experience. Presigned URLs allow direct browser-to-storage uploads, keeping file bytes out of the API process.

**Consequences:**
- Positive: Direct upload via presigned URLs, cloud-portable, lifecycle policies for cost optimization.
- Negative: Extra infrastructure component (MinIO in Docker Compose).
- Mitigations: `IStorageService` abstraction in `LinearPrecision.Shared`; MinIO runs alongside PostgreSQL and Redis in Docker Compose.

---

### ADR-019: Testcontainers for Integration Testing

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** Integration tests must exercise real PostgreSQL queries, EF Core migrations, and Redis operations. Mocking these layers would provide false confidence.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Testcontainers | Real databases in ephemeral Docker containers, CI-compatible | Requires Docker, slower than in-memory |
| SQLite in-memory | Fast, no Docker | PostgreSQL-specific features (JSONB, partial indexes, tsvector) not supported |
| Shared dev database | Simple setup | State leaks between tests, non-deterministic |
| EF Core InMemory provider | Fastest | No SQL execution, no constraint checking, false positives |

**Decision:** Use Testcontainers for PostgreSQL and Redis in all integration tests.

**Rationale:** Testing against real PostgreSQL ensures our migrations, JSONB queries, full-text search, and partial unique indexes work correctly. Testcontainers provides ephemeral, isolated containers per test class with automatic cleanup.

**Consequences:**
- Positive: Real database behavior, migration validation, no state leaks, CI-compatible.
- Negative: Slower test startup (~3-5 seconds per container); Docker required on CI and dev machines.
- Mitigations: Share containers per test class (not per test); parallel test execution; container reuse mode in development.

---

### ADR-020: RFC 7807 Problem Details for Error Responses

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** The API needs a consistent error response format that works across all modules, provides machine-readable error types, and includes enough detail for frontend error handling.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| RFC 7807 Problem Details | Standard format, `type`/`title`/`status`/`detail`, supported by ASP.NET Core | Slightly verbose |
| Custom error envelope | Full control over shape | Non-standard, clients need custom parsing |
| Plain status codes + message | Simple | No structured error information |

**Decision:** Use RFC 7807 Problem Details (`application/problem+json`) for all error responses, implemented via `GlobalExceptionMiddleware`.

**Rationale:** ASP.NET Core has built-in support for `ProblemDetails` and `ValidationProblemDetails`. This gives clients a predictable error structure with `type`, `title`, `status`, `detail`, and an `errors` dictionary for validation failures.

**Consequences:**
- Positive: Standard format, predictable for frontend parsing, validation errors include field-level detail.
- Negative: Slightly more verbose than minimal error responses.
- Mitigations: Frontend utility function wraps error parsing once; Kiota-generated client handles ProblemDetails natively.

---

### ADR-021: Feature Flags via Microsoft.FeatureManagement

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** We need feature flags to gate plan-specific features (AI, advanced reports, custom fields), support gradual rollouts, and enable kill switches for new features.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Microsoft.FeatureManagement | Built-in ASP.NET Core integration, filters, DI-friendly | Basic compared to full-featured services |
| LaunchDarkly | Rich targeting, analytics, SDKs | Cost, external dependency |
| Unleash | Open-source, self-hosted | Operational overhead |
| Database-stored flags (custom) | Simple, queryable | No percentage rollouts, must build evaluation logic |

**Decision:** Use `Microsoft.FeatureManagement.AspNetCore` with a custom `PlanFeatureFilter` that checks the workspace's subscription plan.

**Rationale:** The library integrates with ASP.NET Core's DI and middleware pipeline. Our `PlanFeatureFilter` evaluates whether the workspace's current plan includes a given feature. Feature flags are stored in the `feature_flags` table and cached in Redis.

**Consequences:**
- Positive: Plan-gated features are declarative; feature checks via `IFeatureManager.IsEnabledAsync("feature-name")`; filter extensible for percentage rollouts later.
- Negative: Less sophisticated than LaunchDarkly for A/B testing and user targeting.
- Mitigations: Sufficient for our current needs; can migrate to LaunchDarkly when we need advanced targeting.

---

### ADR-022: QuestPDF for Server-Side Report Generation

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** The Analytics module needs to export reports as PDF. Reports include charts, tables, and formatted text. Generation must happen server-side without browser dependencies.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| QuestPDF | Fluent C# API, no external dependencies, excellent table/layout support | Newer library, community edition licensing changes |
| iTextSharp | Mature, powerful | AGPL license, complex API |
| Puppeteer/Playwright (headless browser) | Pixel-perfect HTML-to-PDF | Heavy dependency, slow, memory-intensive |
| wkhtmltopdf | Proven HTML-to-PDF | Deprecated, security concerns, native binary dependency |

**Decision:** Use QuestPDF for all server-side PDF report generation.

**Rationale:** QuestPDF's fluent C# API allows composing report layouts programmatically with tables, headers, page numbers, and dynamic content. No external process or browser required. Community edition is free for businesses under $1M revenue.

**Consequences:**
- Positive: Pure .NET, fast generation, programmatic layout, no external dependencies.
- Negative: Must build chart rendering in code (no HTML/CSS); QuestPDF licensing may change.
- Mitigations: Abstract report generation behind `IReportGenerator`; monitor licensing terms.

---

### ADR-023: Scalar over Swagger UI for API Documentation

**Status:** Accepted
**Date:** 2026-03-18
**Deciders:** Backend Architecture Team

**Context:** We need an interactive API documentation UI for development and API consumers. It must render from the OpenAPI spec generated by `Microsoft.AspNetCore.OpenApi`.

**Options considered:**

| Option | Pros | Cons |
|--------|------|------|
| Scalar | Modern UI, dark mode, better search, authentication testing, first-class .NET 9 support | Newer, less established |
| Swagger UI (Swashbuckle) | Industry standard, familiar | Swashbuckle unmaintained, dated UI, conflicts with .NET 9 built-in OpenAPI |
| Redoc | Clean read-only docs | No interactive testing |
| NSwag UI | Alternative to Swagger | Less polished |

**Decision:** Use Scalar as the interactive API documentation UI via `Scalar.AspNetCore`.

**Rationale:** `Scalar.AspNetCore` integrates directly with .NET 9's built-in OpenAPI generation (`Microsoft.AspNetCore.OpenApi`), avoiding the Swashbuckle dependency which is no longer maintained. Scalar provides a modern UI with built-in authentication testing, search, and dark mode.

**Consequences:**
- Positive: Modern UI, active maintenance, direct .NET 9 integration, better developer experience.
- Negative: Less familiar to developers used to Swagger UI.
- Mitigations: Scalar's layout is intuitive; linked from the health check endpoint for discoverability.

---

## 3. Decision Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-001 | Modular Monolith over Microservices | Accepted | 2026-03-18 |
| ADR-002 | ASP.NET Core 9 Minimal APIs as Default | Accepted | 2026-03-18 |
| ADR-003 | PostgreSQL as Primary Database | Accepted | 2026-03-18 |
| ADR-004 | EF Core 9 with Code-First Migrations | Accepted | 2026-03-18 |
| ADR-005 | Dapper for Reporting/Analytics Queries | Accepted | 2026-03-18 |
| ADR-006 | UUID v7 Primary Keys | Accepted | 2026-03-18 |
| ADR-007 | MediatR for In-Process CQRS | Accepted | 2026-03-18 |
| ADR-008 | FluentValidation over Data Annotations | Accepted | 2026-03-18 |
| ADR-009 | Redis for Caching, Rate Limiting, and SignalR Backplane | Accepted | 2026-03-18 |
| ADR-010 | JWT RS256 over HS256 or Opaque Tokens | Accepted | 2026-03-18 |
| ADR-011 | Refresh Token Rotation with Family Tracking | Accepted | 2026-03-18 |
| ADR-012 | Row-Level Multi-Tenancy via Global Query Filters | Accepted | 2026-03-18 |
| ADR-013 | SignalR for Real-Time over WebSockets or SSE | Accepted | 2026-03-18 |
| ADR-014 | Hangfire over Hosted BackgroundService for Jobs | Accepted | 2026-03-18 |
| ADR-015 | Serilog over Built-In Logging | Accepted | 2026-03-18 |
| ADR-016 | OpenTelemetry for Distributed Tracing | Accepted | 2026-03-18 |
| ADR-017 | Stripe for Billing Integration | Accepted | 2026-03-18 |
| ADR-018 | S3-Compatible Object Storage for Files | Accepted | 2026-03-18 |
| ADR-019 | Testcontainers for Integration Testing | Accepted | 2026-03-18 |
| ADR-020 | RFC 7807 Problem Details for Error Responses | Accepted | 2026-03-18 |
| ADR-021 | Feature Flags via Microsoft.FeatureManagement | Accepted | 2026-03-18 |
| ADR-022 | QuestPDF for Server-Side Report Generation | Accepted | 2026-03-18 |
| ADR-023 | Scalar over Swagger UI for API Documentation | Accepted | 2026-03-18 |

---

## 4. Future Decisions (Pending)

The following decisions are expected to be formalized as the project matures:

| Topic | Expected Trigger |
|-------|-----------------|
| Meilisearch vs PostgreSQL FTS | When search latency or index complexity exceeds PG capabilities |
| Message broker (RabbitMQ / Azure Service Bus) | When async cross-module communication outgrows MediatR notifications |
| CQRS read projections | When read-heavy modules need denormalized read models |
| CDN strategy for static assets | When frontend is deployed to production |
| SAML / SSO provider | When Enterprise tier customers require it |
| Kubernetes deployment | When horizontal scaling requires orchestration beyond single-instance deployment |
| Database sharding or partitioning | When tenant data volume exceeds single-instance PostgreSQL performance |
