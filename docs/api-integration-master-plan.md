# API Integration Master Plan — Linear Precision PM SaaS

> **Status:** Synced with current backend implementation
> **Last updated:** 2026-04-11
> **Owner:** Backend Architecture Team
> **Related:** `backend-architecture-master-plan.md`, `auth-tenancy-rbac-plan.md`, `domain-model.md`

---

## 1. Overview

This document defines the complete REST API surface for Linear Precision. It covers endpoint inventory, request/response conventions, pagination, filtering, rate limiting, versioning, error handling, and header requirements.

> **Implementation note:** The baseline inventory below reflects the original P0-P3 spec. The current backend also exposes 16 additional routes documented in section 7.21, while the six magic-link/OAuth/2FA auth routes in section 7.1 remain deferred to P4+.

**Design principles:**

- **Resource-oriented** — endpoints map to domain entities, not UI screens.
- **Consistent conventions** — every endpoint follows the same pagination, filtering, sorting, and error patterns.
- **OpenAPI-first** — all endpoints are documented via `Microsoft.AspNetCore.OpenApi` and browsable via Scalar UI.
- **Versioned from day one** — URL path prefix `/api/v1/` with a clear deprecation policy.

---

## 2. API Conventions

### 2.1 URL Structure

```
{scheme}://{host}/api/v{version}/{resource}[/{id}][/{sub-resource}]
```

**Examples:**

| Pattern | Example |
|---------|---------|
| Collection | `GET /api/v1/projects` |
| Single resource | `GET /api/v1/projects/{id}` |
| Sub-resource collection | `GET /api/v1/projects/{id}/tasks` |
| Action | `POST /api/v1/sprints/{id}/start` |
| Singleton | `GET /api/v1/users/me` |

### 2.2 HTTP Methods

| Method | Semantics | Idempotent | Request Body |
|--------|-----------|------------|--------------|
| `GET` | Read resource(s) | Yes | No |
| `POST` | Create resource or trigger action | No | Yes |
| `PUT` | Full update of resource | Yes | Yes |
| `PATCH` | Partial update of resource | Yes | Yes (JSON Merge Patch) |
| `DELETE` | Remove resource (soft delete) | Yes | No |

### 2.3 Standard Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (except public endpoints) | `Bearer {accessToken}` |
| `X-Workspace-Id` | Yes (except auth/public endpoints) | UUID of the current workspace |
| `Content-Type` | Yes (for request body) | `application/json` |
| `Accept` | Optional | `application/json` (default) |
| `X-Request-Id` | Optional | Client-generated correlation ID |
| `X-Idempotency-Key` | Optional (for POST) | UUID for safe retries |

### 2.4 Standard Response Headers

| Header | Description |
|--------|-------------|
| `X-Correlation-Id` | Server-generated or echoed from `X-Request-Id` |
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Remaining requests in window |
| `X-RateLimit-Reset` | UTC epoch seconds when window resets |
| `Content-Type` | `application/json` or `application/problem+json` |

### 2.5 Status Codes

| Code | Usage |
|------|-------|
| `200 OK` | Successful GET, PUT, PATCH |
| `201 Created` | Successful POST creating a resource (with `Location` header) |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation failure (returns `ValidationProblemDetails`) |
| `401 Unauthorized` | Missing or invalid JWT |
| `403 Forbidden` | Valid JWT but insufficient permissions |
| `404 Not Found` | Resource does not exist (or not visible to tenant) |
| `409 Conflict` | Duplicate key or state conflict |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unhandled exception |

---

## 3. Pagination

All collection endpoints support cursor-based pagination with optional keyset fallback.

### 3.1 Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageSize` | int | 25 | Items per page (max 100) |
| `cursor` | string | null | Opaque cursor from previous response |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | `asc` or `desc` |

### 3.2 Response Envelope

```json
{
  "data": [ ... ],
  "pagination": {
    "pageSize": 25,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextCursor": "eyJpZCI6IjAxOTU...",
    "previousCursor": null,
    "totalCount": 142
  }
}
```

### 3.3 Implementation

```csharp
public record PagedResult<T>(
    IReadOnlyList<T> Data,
    PaginationMeta Pagination);

public record PaginationMeta(
    int PageSize,
    bool HasNextPage,
    bool HasPreviousPage,
    string? NextCursor,
    string? PreviousCursor,
    int? TotalCount);

// Cursor encoding: Base64(JSON({ id, sortValue }))
public static class CursorEncoder
{
    public static string Encode(Guid id, object sortValue)
        => Convert.ToBase64String(
            JsonSerializer.SerializeToUtf8Bytes(new { id, sortValue }));

    public static (Guid Id, JsonElement SortValue) Decode(string cursor)
    {
        var json = JsonSerializer.Deserialize<JsonElement>(
            Convert.FromBase64String(cursor));
        return (json.GetProperty("id").GetGuid(),
                json.GetProperty("sortValue"));
    }
}
```

---

## 4. Filtering and Sorting

### 4.1 Filter Query Parameters

Filters use field-based query parameters with operator suffixes:

| Operator | Syntax | Example |
|----------|--------|---------|
| Equals | `field=value` | `status=Active` |
| Not equals | `field.ne=value` | `status.ne=Done` |
| In (multi-value) | `field=val1,val2` | `priority=High,Urgent` |
| Greater than | `field.gt=value` | `dueDate.gt=2026-03-01` |
| Less than | `field.lt=value` | `createdAt.lt=2026-04-01` |
| Contains (text) | `field.contains=value` | `title.contains=bug` |
| Is null | `field.isNull=true` | `assigneeId.isNull=true` |

**Example:**

```
GET /api/v1/tasks?status=InProgress,InReview&priority=High,Urgent&assigneeId=abc123&sortBy=dueDate&sortOrder=asc&pageSize=50
```

### 4.2 Common Filterable Fields by Module

| Module | Filterable Fields |
|--------|------------------|
| Tasks | `status`, `priority`, `assigneeId`, `projectId`, `sprintId`, `dueDate`, `labels`, `isDeleted` |
| Projects | `status`, `leadId`, `startDate`, `targetDate`, `isDeleted` |
| Goals | `status`, `type`, `ownerId`, `startDate`, `targetDate` |
| Sprints | `status`, `projectId`, `startDate`, `endDate` |
| Documents | `projectId`, `isPublished`, `isDeleted` |
| Time Entries | `userId`, `taskId`, `projectId`, `startedAt`, `isBillable` |
| Notifications | `isRead`, `type` |
| Automations | `isEnabled`, `projectId`, `triggerType` |

---

## 5. Rate Limiting

### 5.1 Rate Limit Tiers

| Policy | Window | Limit | Applies To |
|--------|--------|-------|------------|
| `global` | 1 minute (sliding, 6 segments) | 600 requests | All authenticated endpoints |
| `auth` | 15 minutes (fixed) | 20 requests | `/api/v1/auth/*` |
| `ai` | 1 minute (token bucket) | 30 tokens, replenish 10/min | `/api/v1/ai/*` |
| `webhook` | 1 minute (fixed) | 100 requests | `/api/v1/billing/webhook` |
| `search` | 1 minute (sliding) | 120 requests | `/api/v1/search` |
| `file-upload` | 1 hour (fixed) | 100 uploads | `POST /api/v1/files/upload` |

### 5.2 Rate Limit Headers

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1711000060
Retry-After: 15
Content-Type: application/problem+json

{
  "type": "https://linearprecision.com/errors/rate-limited",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded the rate limit of 600 requests per minute."
}
```

---

## 6. API Versioning

### 6.1 Strategy

| Aspect | Decision |
|--------|----------|
| Versioning scheme | URL path prefix (`/api/v1/`, `/api/v2/`) |
| Current version | `v1` |
| Deprecation notice | `Sunset` header + 6-month deprecation period |
| Breaking change policy | Breaking changes require a new major version |

### 6.2 Non-Breaking Changes (allowed in same version)

- Adding new optional fields to response bodies
- Adding new optional query parameters
- Adding new endpoints
- Adding new enum values (clients must handle unknown values)

### 6.3 Breaking Changes (require new version)

- Removing or renaming fields
- Changing field types
- Removing endpoints
- Changing required parameters
- Changing status code semantics

---

## 7. Complete Endpoint Inventory

### 7.1 Identity Module (10 endpoints)

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 1 | `POST` | `/api/v1/auth/register` | Register new user | No | `auth` |
| 2 | `POST` | `/api/v1/auth/login` | Email/password login | No | `auth` |
| 3 | `POST` | `/api/v1/auth/refresh` | Refresh access token | No | `auth` |
| 4 | `POST` | `/api/v1/auth/logout` | Revoke refresh token | Yes | `global` |
| 5 | `POST` | `/api/v1/auth/magic-link` | Request magic link | No | `auth` |
| 6 | `POST` | `/api/v1/auth/magic-link/verify` | Verify magic link | No | `auth` |
| 7 | `GET` | `/api/v1/auth/oauth/{provider}` | Initiate OAuth flow | No | `auth` |
| 8 | `POST` | `/api/v1/auth/2fa/setup` | Setup 2FA TOTP | Yes | `global` |
| 9 | `POST` | `/api/v1/auth/2fa/enable` | Enable 2FA | Yes | `global` |
| 10 | `POST` | `/api/v1/auth/2fa/verify` | Verify 2FA code during login | No | `auth` |

> Current implementation also exposes `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`; see section 7.21.

### 7.2 User Module (4 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 11 | `GET` | `/api/v1/users/me` | Get current user profile | Yes | Any |
| 12 | `PUT` | `/api/v1/users/me` | Update current user profile | Yes | Any |
| 13 | `PUT` | `/api/v1/users/me/password` | Change password | Yes | Any |
| 14 | `GET` | `/api/v1/users/me/workspaces` | List user's workspaces | Yes | Any |

> Current implementation also exposes `PUT /api/v1/users/me/active-workspace`; see section 7.21.

### 7.3 Workspace Module (10 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 15 | `POST` | `/api/v1/workspaces` | Create workspace | Yes | Any |
| 16 | `GET` | `/api/v1/workspaces` | List user's workspaces | Yes | Any |
| 17 | `GET` | `/api/v1/workspaces/{id}` | Get workspace details | Yes | Guest+ |
| 18 | `PUT` | `/api/v1/workspaces/{id}` | Update workspace | Yes | Admin+ |
| 19 | `DELETE` | `/api/v1/workspaces/{id}` | Delete workspace (soft) | Yes | Owner |
| 20 | `GET` | `/api/v1/workspaces/{id}/members` | List members | Yes | Guest+ |
| 21 | `PUT` | `/api/v1/workspaces/{id}/members/{userId}` | Update member role | Yes | Admin+ |
| 22 | `DELETE` | `/api/v1/workspaces/{id}/members/{userId}` | Remove member | Yes | Admin+ |
| 23 | `POST` | `/api/v1/workspaces/{id}/invitations` | Send invitation | Yes | Admin+ |
| 24 | `PUT` | `/api/v1/workspaces/{id}/settings` | Update workspace settings | Yes | Admin+ |

### 7.4 Projects Module (9 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 25 | `GET` | `/api/v1/projects` | List projects | Yes | Member+ |
| 26 | `POST` | `/api/v1/projects` | Create project | Yes | Member+ |
| 27 | `GET` | `/api/v1/projects/{id}` | Get project | Yes | Guest+ |
| 28 | `PUT` | `/api/v1/projects/{id}` | Update project | Yes | Member+ |
| 29 | `DELETE` | `/api/v1/projects/{id}` | Delete project (soft) | Yes | Admin+ |
| 30 | `POST` | `/api/v1/projects/{id}/favorite` | Toggle favorite | Yes | Member+ |
| 31 | `POST` | `/api/v1/projects/from-template` | Create from template | Yes | Member+ |
| 32 | `GET` | `/api/v1/projects/{id}/activity` | Get project activity | Yes | Guest+ |
| 33 | `GET` | `/api/v1/projects/{id}/metrics` | Get project metrics | Yes | Member+ |

### 7.5 Tasks Module (16 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 34 | `GET` | `/api/v1/tasks` | List tasks (filters: project, sprint, assignee, status) | Yes | Guest+ |
| 35 | `POST` | `/api/v1/tasks` | Create task | Yes | Member+ |
| 36 | `GET` | `/api/v1/tasks/{id}` | Get task with relations | Yes | Guest+ |
| 37 | `PUT` | `/api/v1/tasks/{id}` | Update task | Yes | Member+ |
| 38 | `PATCH` | `/api/v1/tasks/{id}/status` | Update task status | Yes | Member+ |
| 39 | `DELETE` | `/api/v1/tasks/{id}` | Delete task (soft) | Yes | Member+ |
| 40 | `POST` | `/api/v1/tasks/{id}/comments` | Add comment | Yes | Guest+ |
| 41 | `PUT` | `/api/v1/tasks/{id}/comments/{commentId}` | Edit comment | Yes | Author |
| 42 | `DELETE` | `/api/v1/tasks/{id}/comments/{commentId}` | Delete comment | Yes | Author/Admin |
| 43 | `POST` | `/api/v1/tasks/{id}/checklist` | Add checklist item | Yes | Member+ |
| 44 | `PUT` | `/api/v1/tasks/{id}/checklist/{itemId}` | Toggle checklist item | Yes | Member+ |
| 45 | `DELETE` | `/api/v1/tasks/{id}/checklist/{itemId}` | Remove checklist item | Yes | Member+ |
| 46 | `POST` | `/api/v1/tasks/{id}/dependencies` | Add dependency | Yes | Member+ |
| 47 | `DELETE` | `/api/v1/tasks/{id}/dependencies/{depId}` | Remove dependency | Yes | Member+ |
| 48 | `POST` | `/api/v1/tasks/{id}/watchers` | Add watcher | Yes | Member+ |
| 49 | `DELETE` | `/api/v1/tasks/{id}/watchers/{userId}` | Remove watcher | Yes | Member+ |

### 7.6 Goals Module (8 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 50 | `GET` | `/api/v1/goals` | List goals | Yes | Member+ |
| 51 | `POST` | `/api/v1/goals` | Create goal | Yes | Member+ |
| 52 | `GET` | `/api/v1/goals/{id}` | Get goal with initiatives | Yes | Guest+ |
| 53 | `PUT` | `/api/v1/goals/{id}` | Update goal | Yes | Member+ |
| 54 | `DELETE` | `/api/v1/goals/{id}` | Delete goal (soft) | Yes | Admin+ |
| 55 | `POST` | `/api/v1/goals/{id}/initiatives` | Add initiative | Yes | Member+ |
| 56 | `PUT` | `/api/v1/goals/{id}/initiatives/{initId}` | Update initiative | Yes | Member+ |
| 57 | `POST` | `/api/v1/goals/{id}/projects` | Link project to goal | Yes | Member+ |

### 7.7 Sprints Module (7 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 58 | `GET` | `/api/v1/projects/{projectId}/sprints` | List sprints for project | Yes | Member+ |
| 59 | `POST` | `/api/v1/projects/{projectId}/sprints` | Create sprint | Yes | Member+ |
| 60 | `GET` | `/api/v1/sprints/{id}` | Get sprint with tasks | Yes | Guest+ |
| 61 | `PUT` | `/api/v1/sprints/{id}` | Update sprint | Yes | Member+ |
| 62 | `POST` | `/api/v1/sprints/{id}/start` | Start sprint | Yes | Member+ |
| 63 | `POST` | `/api/v1/sprints/{id}/complete` | Complete sprint | Yes | Member+ |
| 64 | `DELETE` | `/api/v1/sprints/{id}` | Delete sprint | Yes | Admin+ |

### 7.8 Calendar Module (5 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 65 | `GET` | `/api/v1/calendar` | List calendar items (filter: start, end, owner) | Yes | Member+ |
| 66 | `POST` | `/api/v1/calendar` | Create calendar item | Yes | Member+ |
| 67 | `GET` | `/api/v1/calendar/{id}` | Get calendar item | Yes | Guest+ |
| 68 | `PUT` | `/api/v1/calendar/{id}` | Update calendar item | Yes | Member+ |
| 69 | `DELETE` | `/api/v1/calendar/{id}` | Delete calendar item | Yes | Member+ |

### 7.9 Documents Module (6 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 70 | `GET` | `/api/v1/documents` | List documents | Yes | Guest+ |
| 71 | `POST` | `/api/v1/documents` | Create document | Yes | Member+ |
| 72 | `GET` | `/api/v1/documents/{id}` | Get document | Yes | Guest+ |
| 73 | `PUT` | `/api/v1/documents/{id}` | Update document | Yes | Member+ |
| 74 | `DELETE` | `/api/v1/documents/{id}` | Delete document (soft) | Yes | Member+ |
| 75 | `GET` | `/api/v1/projects/{id}/documents` | List project documents | Yes | Guest+ |

### 7.10 TimeTracking Module (6 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 76 | `GET` | `/api/v1/time-entries` | List time entries (filter: user, task, project, date) | Yes | Member+ |
| 77 | `POST` | `/api/v1/time-entries` | Create time entry | Yes | Member+ |
| 78 | `PUT` | `/api/v1/time-entries/{id}` | Update time entry | Yes | Owner/Admin |
| 79 | `DELETE` | `/api/v1/time-entries/{id}` | Delete time entry | Yes | Owner/Admin |
| 80 | `POST` | `/api/v1/time-entries/start` | Start timer | Yes | Member+ |
| 81 | `POST` | `/api/v1/time-entries/{id}/stop` | Stop timer | Yes | Member+ |

### 7.11 Intake Module (7 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 82 | `GET` | `/api/v1/request-forms` | List request forms | Yes | Member+ |
| 83 | `POST` | `/api/v1/request-forms` | Create request form | Yes | Admin+ |
| 84 | `PUT` | `/api/v1/request-forms/{id}` | Update request form | Yes | Admin+ |
| 85 | `DELETE` | `/api/v1/request-forms/{id}` | Delete request form | Yes | Admin+ |
| 86 | `POST` | `/api/v1/intake/{formSlug}/submit` | Submit request (public) | No | — |
| 87 | `GET` | `/api/v1/intake/submissions` | List submissions | Yes | Member+ |
| 88 | `POST` | `/api/v1/intake/submissions/{id}/convert-to-task` | Convert to task | Yes | Member+ |

### 7.12 Automations Module (5 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 89 | `GET` | `/api/v1/automations` | List automations | Yes | Member+ |
| 90 | `POST` | `/api/v1/automations` | Create automation | Yes | Admin+ |
| 91 | `PUT` | `/api/v1/automations/{id}` | Update automation | Yes | Admin+ |
| 92 | `DELETE` | `/api/v1/automations/{id}` | Delete automation | Yes | Admin+ |
| 93 | `GET` | `/api/v1/automations/{id}/logs` | View execution logs | Yes | Admin+ |

### 7.13 Notifications Module (6 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 94 | `GET` | `/api/v1/notifications` | List notifications (paginated) | Yes | Any |
| 95 | `PUT` | `/api/v1/notifications/{id}/read` | Mark notification read | Yes | Any |
| 96 | `PUT` | `/api/v1/notifications/{id}/archive` | Archive notification | Yes | Any |
| 97 | `PUT` | `/api/v1/notifications/read-all` | Mark all read | Yes | Any |
| 98 | `GET` | `/api/v1/notifications/preferences` | Get notification preferences | Yes | Any |
| 99 | `PUT` | `/api/v1/notifications/preferences` | Update notification preferences | Yes | Any |

> Current implementation also exposes `PUT /api/v1/notifications/{id}/archive`; see section 7.21.

### 7.14 Search Module (1 endpoint)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 99 | `GET` | `/api/v1/search` | Full-text search (params: `q`, `type`, `projectId`) | Yes | Guest+ |

### 7.15 Billing Module (5 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 100 | `GET` | `/api/v1/billing/subscription` | Get current subscription | Yes | Admin+ |
| 101 | `POST` | `/api/v1/billing/checkout` | Create Stripe Checkout session | Yes | Owner |
| 102 | `POST` | `/api/v1/billing/portal` | Create Stripe Customer Portal session | Yes | Owner |
| 103 | `POST` | `/api/v1/billing/webhook` | Stripe webhook receiver | No | — |
| 104 | `GET` | `/api/v1/billing/usage` | Get usage metrics | Yes | Admin+ |

> Current implementation also exposes subscription CRUD, usage summary, and public plan lookup routes; see section 7.21.

### 7.16 AI Module (4 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 105 | `POST` | `/api/v1/ai/conversations` | Create AI conversation | Yes | Member+ |
| 106 | `POST` | `/api/v1/ai/conversations/{id}/messages` | Send message (triggers AI response) | Yes | Member+ |
| 107 | `GET` | `/api/v1/ai/conversations` | List conversations | Yes | Member+ |
| 108 | `GET` | `/api/v1/ai/conversations/{id}` | Get conversation with messages | Yes | Member+ |

> Current implementation also exposes `DELETE /api/v1/ai/conversations/{id}`; see section 7.21.

### 7.17 Analytics Module (4 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 109 | `GET` | `/api/v1/analytics/velocity` | Sprint velocity chart data | Yes | Member+ |
| 110 | `GET` | `/api/v1/analytics/burndown` | Sprint burndown chart data | Yes | Member+ |
| 111 | `GET` | `/api/v1/analytics/workload` | Team workload distribution | Yes | Member+ |
| 112 | `GET` | `/api/v1/analytics/export` | Export report (PDF/CSV) | Yes | Admin+ |

### 7.18 Files Module (4 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 113 | `POST` | `/api/v1/files/upload/presign` | Get presigned upload URL | Yes | Member+ |
| 114 | `POST` | `/api/v1/files/upload/{fileId}/confirm` | Confirm upload complete | Yes | Member+ |
| 115 | `GET` | `/api/v1/files/{id}/url` | Get presigned download URL | Yes | Guest+ |
| 116 | `DELETE` | `/api/v1/files/{id}` | Delete file | Yes | Member+ |

### 7.19 Admin Module (4 endpoints)

| # | Method | Path | Description | Auth | Role |
|---|--------|------|-------------|------|------|
| 117 | `GET` | `/api/v1/admin/audit-log` | List audit events (paginated, filterable) | Yes | Admin+ |
| 118 | `GET` | `/api/v1/admin/feature-flags` | List feature flags | Yes | Admin+ |
| 119 | `PUT` | `/api/v1/admin/feature-flags/{key}` | Toggle feature flag | Yes | Owner |
| 120 | `GET` | `/api/v1/admin/workspace-stats` | Workspace usage statistics | Yes | Admin+ |

> Current implementation uses `/api/v1/admin/audit-events` plus feature-flag create/delete routes; see section 7.21.

### 7.20 Health and Infrastructure (3 endpoints)

| # | Method | Path | Description | Auth | Rate Limit |
|---|--------|------|-------------|------|------------|
| 121 | `GET` | `/health/ready` | Readiness probe (DB + Redis + external) | No | — |
| 122 | `GET` | `/health/live` | Liveness probe (app running) | No | — |
| 123 | `GET` | `/openapi/v1.json` | OpenAPI spec | No | — |

---

### 7.21 Current Implementation Delta (16 routes)

The backend currently exposes the following routes in addition to the baseline inventory above:

| # | Method | Path | Description | Auth | Notes |
|---|--------|------|-------------|------|-------|
| 124 | `POST` | `/api/v1/auth/forgot-password` | Request password reset | No | Auth |
| 125 | `POST` | `/api/v1/auth/reset-password` | Reset password | No | Auth |
| 126 | `PUT` | `/api/v1/users/me/active-workspace` | Set active workspace | Yes | User module |
| 127 | `PUT` | `/api/v1/notifications/{id}/archive` | Archive notification | Yes | Notifications |
| 128 | `POST` | `/api/v1/billing/subscription` | Create subscription | Yes | Billing |
| 129 | `PUT` | `/api/v1/billing/subscription` | Update subscription | Yes | Billing |
| 130 | `DELETE` | `/api/v1/billing/subscription` | Cancel subscription | Yes | Billing |
| 131 | `GET` | `/api/v1/billing/usage/summary` | Usage summary | Yes | Billing |
| 132 | `GET` | `/api/v1/plans` | List plans | No | Public |
| 133 | `GET` | `/api/v1/plans/{id}` | Get plan | No | Public |
| 134 | `DELETE` | `/api/v1/ai/conversations/{id}` | Delete conversation | Yes | AI |
| 135 | `GET` | `/api/v1/admin/audit-events` | List audit events | Yes | Admin |
| 136 | `GET` | `/api/v1/admin/audit-events/{id}` | Get audit event | Yes | Admin |
| 137 | `POST` | `/api/v1/admin/feature-flags` | Create feature flag | Yes | Admin |
| 138 | `PUT` | `/api/v1/admin/feature-flags/{id}` | Update feature flag | Yes | Admin |
| 139 | `DELETE` | `/api/v1/admin/feature-flags/{id}` | Delete feature flag | Yes | Admin |

These routes bring the current codebase to 131 implemented endpoints. The six missing routes are the deferred magic-link/OAuth/2FA auth endpoints listed in section 7.1.

## 8. Endpoint Summary

| Module | Endpoints | CRUD | Actions | Queries |
|--------|-----------|------|---------|---------|
| Identity/Auth | 12 | — | 12 | — |
| User | 5 | 2 | 2 | 1 |
| Plans | 2 | — | — | 2 |
| Workspace | 10 | 5 | 2 | 3 |
| Projects | 9 | 4 | 2 | 3 |
| Tasks | 16 | 10 | 2 | 4 |
| Goals | 8 | 4 | 2 | 2 |
| Sprints | 7 | 4 | 2 | 1 |
| Calendar | 5 | 4 | — | 1 |
| Documents | 6 | 4 | — | 2 |
| TimeTracking | 6 | 3 | 2 | 1 |
| Intake | 7 | 3 | 2 | 2 |
| Automations | 5 | 3 | — | 2 |
| Notifications | 6 | — | 4 | 2 |
| Search | 1 | — | — | 1 |
| Billing | 11 | 4 | 3 | 4 |
| AI | 5 | 2 | 1 | 2 |
| Analytics | 4 | — | — | 4 |
| Files | 4 | 1 | 2 | 1 |
| Admin | 7 | 1 | 2 | 4 |
| **Total** | **~139** | **~57** | **~41** | **~41** |

Current code implements 131 of the 139 listed routes; the eight missing routes are the six deferred magic-link/OAuth/2FA auth endpoints plus the two baseline admin path variants documented in section 7.19 and represented by their current implementations in section 7.21.

---

## 9. Request/Response Examples

### 9.1 Create Task

**Request:**

```http
POST /api/v1/tasks HTTP/1.1
Authorization: Bearer eyJhbG...
X-Workspace-Id: 01957abc-def0-7000-8000-000000000001
Content-Type: application/json

{
  "projectId": "01957abc-def0-7000-8000-000000000002",
  "title": "Fix login page redirect",
  "description": "Users are redirected to the wrong page after login",
  "status": "Todo",
  "priority": "High",
  "assigneeId": "01957abc-def0-7000-8000-000000000003",
  "dueDate": "2026-03-25",
  "labels": ["bug", "auth"]
}
```

**Response:**

```http
HTTP/1.1 201 Created
Location: /api/v1/tasks/01957abc-def0-7000-8000-000000000099
Content-Type: application/json

{
  "id": "01957abc-def0-7000-8000-000000000099",
  "projectId": "01957abc-def0-7000-8000-000000000002",
  "identifier": "PRJ-42",
  "title": "Fix login page redirect",
  "description": "Users are redirected to the wrong page after login",
  "status": "Todo",
  "priority": "High",
  "assignee": {
    "id": "01957abc-def0-7000-8000-000000000003",
    "fullName": "Jane Doe",
    "avatarUrl": "https://..."
  },
  "dueDate": "2026-03-25",
  "labels": ["bug", "auth"],
  "createdAt": "2026-03-19T14:30:00Z",
  "updatedAt": "2026-03-19T14:30:00Z",
  "createdBy": {
    "id": "01957abc-def0-7000-8000-000000000004",
    "fullName": "John Smith"
  }
}
```

### 9.2 List Tasks (Paginated + Filtered)

**Request:**

```http
GET /api/v1/tasks?projectId=01957abc-def0-7000-8000-000000000002&status=InProgress,InReview&sortBy=priority&sortOrder=desc&pageSize=10 HTTP/1.1
Authorization: Bearer eyJhbG...
X-Workspace-Id: 01957abc-def0-7000-8000-000000000001
```

**Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 592

{
  "data": [
    {
      "id": "...",
      "identifier": "PRJ-42",
      "title": "Fix login page redirect",
      "status": "InProgress",
      "priority": "High",
      "assignee": { "id": "...", "fullName": "Jane Doe", "avatarUrl": "..." },
      "dueDate": "2026-03-25",
      "labels": ["bug", "auth"],
      "createdAt": "2026-03-19T14:30:00Z"
    }
  ],
  "pagination": {
    "pageSize": 10,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "nextCursor": "eyJpZCI6IjAxOTU3...",
    "previousCursor": null,
    "totalCount": 28
  }
}
```

### 9.3 Validation Error

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation Failed",
  "status": 400,
  "errors": {
    "title": ["'Title' must not be empty."],
    "projectId": ["'Project Id' must be a valid GUID."]
  }
}
```

---

## 10. OpenAPI and Client Generation

### 10.1 OpenAPI Spec

The API spec is generated at build time by `Microsoft.AspNetCore.OpenApi` and served at `/openapi/v1.json`. It includes:

- All endpoints with request/response schemas
- Authentication requirements (Bearer JWT)
- Parameter descriptions and validation constraints
- Example values for common fields

### 10.2 Client Generation via Kiota

The frontend uses **Microsoft Kiota** to generate a TypeScript API client from the OpenAPI spec:

```bash
# Generate TypeScript client from running API
kiota generate \
  --language TypeScript \
  --openapi http://localhost:5000/openapi/v1.json \
  --output ./src/api/client \
  --class-name LinearPrecisionClient \
  --namespace-name LinearPrecision
```

This generates:
- Typed request builders for every endpoint
- Request/response models from OpenAPI schemas
- Authentication provider integration
- Automatic serialization/deserialization

### 10.3 Frontend Usage Pattern

```typescript
import { LinearPrecisionClient } from '@/api/client';

// List tasks with filters
const result = await client.api.v1.tasks.get({
  queryParameters: {
    projectId: 'abc-123',
    status: ['InProgress', 'InReview'],
    sortBy: 'priority',
    sortOrder: 'desc',
    pageSize: 25
  }
});

// Create task
const newTask = await client.api.v1.tasks.post({
  body: {
    projectId: 'abc-123',
    title: 'New task',
    priority: 'High'
  }
});
```

---

## 11. SignalR Hubs

Real-time events are delivered via SignalR hubs, not REST endpoints. See `async-jobs-events-realtime-plan.md` for full hub specifications.

| Hub | Path | Purpose |
|-----|------|---------|
| BoardHub | `/hubs/board` | Task status changes, column reorder, new tasks |
| NotificationHub | `/hubs/notifications` | Real-time notification delivery |
| PresenceHub | `/hubs/presence` | Online status, document editing presence |
| AIStreamHub | `/hubs/ai` | Streaming AI responses token-by-token |

---

## 12. Idempotency

### 12.1 Idempotency Keys

`POST` endpoints that create resources accept an optional `X-Idempotency-Key` header. The server stores the response for a given key in Redis for 24 hours. If the same key is sent again, the stored response is returned without re-executing the operation.

```csharp
public class IdempotencyMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (context.Request.Method != "POST") { await next(context); return; }

        var key = context.Request.Headers["X-Idempotency-Key"].FirstOrDefault();
        if (key is null) { await next(context); return; }

        var redis = context.RequestServices.GetRequiredService<IConnectionMultiplexer>();
        var db = redis.GetDatabase();
        var cacheKey = $"idempotency:{key}";

        var cached = await db.StringGetAsync(cacheKey);
        if (cached.HasValue)
        {
            // Return cached response
            context.Response.StatusCode = 200;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(cached!);
            return;
        }

        // Execute and cache
        var originalBody = context.Response.Body;
        using var memoryStream = new MemoryStream();
        context.Response.Body = memoryStream;
        await next(context);
        memoryStream.Seek(0, SeekOrigin.Begin);
        var responseBody = await new StreamReader(memoryStream).ReadToEndAsync();
        await db.StringSetAsync(cacheKey, responseBody, TimeSpan.FromHours(24));
        memoryStream.Seek(0, SeekOrigin.Begin);
        await memoryStream.CopyToAsync(originalBody);
    }
}
```

---

## 13. Implementation Priority

Endpoints are implemented in phases matching the project's execution plan:

| Phase | Modules | Endpoint Count | Target |
|-------|---------|---------------|--------|
| P0 (Weeks 1-4) | Identity, Workspace, Projects, Tasks (core CRUD) | ~43 | Foundation |
| P1 (Weeks 5-8) | Goals, Sprints, Calendar, Documents | ~26 | Feature expansion |
| P2 (Weeks 9-12) | TimeTracking, Intake, Automations, Notifications | ~23 | Workflow features |
| P3 (Weeks 13-16) | Search, Billing, Files, Admin | ~14 | Platform features |
| P4 (Weeks 17-20) | AI, Analytics | ~8 | Intelligence features |
| P5 (Weeks 21-28) | Polish, additional endpoints, v2 planning | ~6 | Hardening |
