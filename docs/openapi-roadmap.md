# OpenAPI Roadmap

> Linear Precision -- API Specification, Client Generation, and Versioning Strategy
> Owner: Backend Team | Status: Draft | Last Updated: 2026-03-18

---

## 1. Overview

The OpenAPI specification is the contract between the Linear Precision backend and all consumers (frontend, mobile, integrations, third-party developers). This document defines how the spec is generated, how TypeScript clients are produced, how versioning works, how CI enforces compatibility, and how documentation is published.

### Principles

1. **Spec-from-code**: The OpenAPI spec is generated from the ASP.NET Core Minimal API definitions. Code is the source of truth.
2. **Automated client generation**: The TypeScript client is regenerated on every API change. Manual API wrappers are prohibited.
3. **Breaking changes are CI failures**: Any backward-incompatible change is caught by CI and must be explicitly approved.
4. **Versioned URLs**: All endpoints are prefixed with `/api/v1/`. Breaking changes require a new version.
5. **Always current documentation**: API docs are auto-generated and published on every deployment.

---

## 2. Spec Generation

### Technology Stack

| Component | Package | Purpose |
|-----------|---------|---------|
| Spec generation | `Microsoft.AspNetCore.OpenApi` (built-in .NET 9) | Generates OpenAPI 3.1 spec from Minimal API endpoints |
| Swagger UI | `NSwag.AspNetCore` | Interactive API browser at `/swagger` |
| Spec enrichment | `Swashbuckle.AspNetCore.Annotations` | Extra metadata (descriptions, examples, deprecation) |
| Schema filtering | Custom `IOperationFilter` | Exclude internal endpoints, add security schemes |

### Configuration

```csharp
// Program.cs
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, ct) =>
    {
        document.Info = new OpenApiInfo
        {
            Title = "Linear Precision API",
            Version = "v1",
            Description = "Project Management SaaS API",
            Contact = new OpenApiContact
            {
                Name = "Linear Precision Engineering",
                Email = "api@linearprecision.com"
            },
            License = new OpenApiLicense
            {
                Name = "Proprietary"
            }
        };

        document.Servers = new List<OpenApiServer>
        {
            new() { Url = "https://api.linearprecision.com", Description = "Production" },
            new() { Url = "https://api.staging.linearprecision.com", Description = "Staging" },
            new() { Url = "http://localhost:5000", Description = "Development" }
        };

        return Task.CompletedTask;
    });

    options.AddDocumentTransformer<SecuritySchemeTransformer>();
});
```

### Spec Endpoints

| URL | Purpose | Environment |
|-----|---------|-------------|
| `/openapi/v1.json` | Machine-readable OpenAPI 3.1 spec | All |
| `/swagger` | Interactive Swagger UI | Development, Staging |
| `/scalar` | Modern API documentation UI | All |

### Endpoint Metadata

Every endpoint must include:

```csharp
app.MapPost("/api/v1/tasks", CreateTask)
    .WithName("CreateTask")
    .WithDescription("Create a new task in a project")
    .WithTags("Tasks")
    .Produces<TaskResponse>(StatusCodes.Status201Created)
    .Produces<ValidationProblemDetails>(StatusCodes.Status422UnprocessableEntity)
    .Produces(StatusCodes.Status401Unauthorized)
    .Produces(StatusCodes.Status403Forbidden)
    .ProducesValidationProblem()
    .WithOpenApi(op =>
    {
        op.Summary = "Create a task";
        op.Description = "Creates a new task in the specified project. " +
                         "The authenticated user must have task:create permission.";
        op.Parameters[0].Description = "The project to create the task in";
        return op;
    });
```

### Security Scheme Definition

```csharp
public class SecuritySchemeTransformer : IDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken ct)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes = new Dictionary<string, OpenApiSecurityScheme>
        {
            ["Bearer"] = new()
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "JWT access token obtained from POST /api/v1/auth/login"
            }
        };

        document.SecurityRequirements = new List<OpenApiSecurityRequirement>
        {
            new()
            {
                [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = Array.Empty<string>()
            }
        };

        return Task.CompletedTask;
    }
}
```

---

## 3. TypeScript Client Generation

### Strategy

| Option | Tool | Pros | Cons | Decision |
|--------|------|------|------|----------|
| A | **Kiota** (Microsoft) | Type-safe, tree-shakeable, supports streaming | Newer, smaller community | **Selected** |
| B | openapi-typescript-codegen | Mature, widely used | Less type-safe, no streaming support | Backup |
| C | openapi-fetch + openapi-typescript | Minimal bundle, types-only option | Manual fetch calls | Types-only fallback |
| D | orval | React Query integration, mock generation | Opinionated, large output | Evaluated, not selected |

### Kiota Configuration

```json
// kiota-config.json
{
  "descriptionLocation": "http://localhost:5000/openapi/v1.json",
  "outputPath": "./src/api/generated",
  "language": "TypeScript",
  "clientClassName": "LinearPrecisionClient",
  "clientNamespaceName": "LinearPrecision.Api",
  "excludePatterns": [
    "**/internal/**",
    "**/health"
  ],
  "includePatterns": [
    "**/api/v1/**"
  ],
  "structuredMimeTypes": [
    "application/json"
  ],
  "serializers": [
    "Microsoft.Kiota.Serialization.Json.JsonSerializationWriterFactory"
  ],
  "deserializers": [
    "Microsoft.Kiota.Serialization.Json.JsonParseNodeFactory"
  ]
}
```

### Generation Script

```json
// frontend/package.json
{
  "scripts": {
    "api:generate": "kiota generate -l TypeScript -d http://localhost:5000/openapi/v1.json -o src/api/generated -n LinearPrecision.Api --cc LinearPrecisionClient",
    "api:generate:ci": "kiota generate -l TypeScript -d openapi-spec/v1.json -o src/api/generated -n LinearPrecision.Api --cc LinearPrecisionClient",
    "api:validate": "kiota info -d openapi-spec/v1.json"
  }
}
```

### Generated Client Structure

```
frontend/src/api/
├── generated/                    # Auto-generated -- DO NOT EDIT
│   ├── models/
│   │   ├── taskResponse.ts
│   │   ├── createTaskRequest.ts
│   │   ├── projectResponse.ts
│   │   ├── paginatedResponse.ts
│   │   ├── errorResponse.ts
│   │   └── ...
│   ├── api/
│   │   └── v1/
│   │       ├── tasks/
│   │       │   ├── tasksRequestBuilder.ts
│   │       │   └── item/
│   │       │       ├── taskItemRequestBuilder.ts
│   │       │       ├── comments/
│   │       │       ├── subtasks/
│   │       │       └── move/
│   │       ├── projects/
│   │       │   ├── projectsRequestBuilder.ts
│   │       │   └── item/
│   │       │       ├── projectItemRequestBuilder.ts
│   │       │       └── board/
│   │       └── ...
│   ├── linearPrecisionClient.ts
│   └── index.ts
├── client.ts                     # Client initialization with auth
├── hooks/                        # TanStack Query hooks wrapping generated client
│   ├── useTasks.ts
│   ├── useProjects.ts
│   ├── useGoals.ts
│   └── ...
└── types.ts                      # Re-exports of generated types for convenience
```

### Client Initialization

```typescript
// frontend/src/api/client.ts
import { LinearPrecisionClient } from './generated';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import { AnonymousAuthenticationProvider } from '@microsoft/kiota-abstractions';

const authProvider = {
  authenticateRequest: async (request: RequestInformation) => {
    const token = getAccessToken(); // From auth context
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    const workspaceId = getActiveWorkspaceId();
    if (workspaceId) {
      request.headers.set('X-Workspace-Id', workspaceId);
    }
  }
};

const adapter = new FetchRequestAdapter(authProvider);
adapter.baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export const apiClient = new LinearPrecisionClient(adapter);
```

### TanStack Query Integration

```typescript
// frontend/src/api/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { CreateTaskRequest, TaskResponse } from '../generated/models';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export function useTasks(projectId: string, filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list({ projectId, ...filters }),
    queryFn: () => apiClient.api.v1.tasks.get({
      queryParameters: { projectId, ...filters }
    }),
    staleTime: 30_000, // 30 seconds
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => apiClient.api.v1.tasks.byTaskId(taskId).get(),
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTaskRequest) => apiClient.api.v1.tasks.post(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: MoveTaskRequest }) =>
      apiClient.api.v1.tasks.byTaskId(taskId).move.patch(body),
    onMutate: async ({ taskId, body }) => {
      // Optimistic update for smooth drag-drop
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      // ... update cache optimistically
    },
    onError: (err, variables, context) => {
      // Rollback on error
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
```

### Committed vs. Published

| Approach | When | Notes |
|----------|------|-------|
| Committed to frontend repo | Monorepo or tightly coupled dev | Simpler, no package management |
| Published as npm package | Separate repos, multiple consumers | `@linearprecision/api-client` |
| **Decision**: Committed initially | Phase P0-P2 | Migrate to published package when external API consumers exist |

---

## 4. API Versioning Strategy

### URL-Based Versioning

All endpoints are prefixed with the version:

```
/api/v1/tasks
/api/v1/projects
/api/v1/auth/login
```

### Version Policy

| Change Type | Example | Handling |
|-------------|---------|----------|
| Add optional field to response | Add `customFields` to TaskResponse | Non-breaking, same version |
| Add new endpoint | Add `GET /api/v1/tasks/export` | Non-breaking, same version |
| Add optional query parameter | Add `?includeArchived=true` | Non-breaking, same version |
| Add new enum value | Add `"blocked"` to TaskStatus | Non-breaking (clients should ignore unknown values) |
| Remove field from response | Remove `legacyField` from TaskResponse | **Breaking** -- new version |
| Rename field | Rename `name` to `title` | **Breaking** -- new version |
| Change field type | Change `priority` from string to integer | **Breaking** -- new version |
| Remove endpoint | Remove `DELETE /api/v1/tasks/{id}/legacy` | **Breaking** -- new version |
| Change authentication scheme | Switch from JWT to API key | **Breaking** -- new version |

### Multi-Version Support

```csharp
// Program.cs
var v1 = app.MapGroup("/api/v1")
    .WithGroupName("v1")
    .RequireAuthorization();

var v2 = app.MapGroup("/api/v2")
    .WithGroupName("v2")
    .RequireAuthorization();

// v1 endpoints
v1.MapGet("/tasks", TaskEndpointsV1.List);
v1.MapPost("/tasks", TaskEndpointsV1.Create);

// v2 endpoints (when needed)
v2.MapGet("/tasks", TaskEndpointsV2.List);   // New response shape
v2.MapPost("/tasks", TaskEndpointsV2.Create); // New request shape

// Separate OpenAPI docs per version
builder.Services.AddOpenApi("v1", options => { /* v1 config */ });
builder.Services.AddOpenApi("v2", options => { /* v2 config */ });
```

### Deprecation and Sunset Policy

| Stage | Duration | Action |
|-------|---------|--------|
| **Stable** | Indefinite | Normal operation |
| **Deprecated** | Minimum 6 months | `Sunset` header added, docs updated, deprecation warnings in client |
| **Sunset** | 30-day final notice | `Sunset: <date>` header, email notification to API users |
| **Removed** | After sunset date | 410 Gone response with migration guide URL |

**Deprecation Headers:**

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 18 Sep 2027 00:00:00 GMT
Link: <https://docs.linearprecision.com/api/migration/v1-to-v2>; rel="deprecation"
```

**Frontend Client Handling:**

```typescript
// Interceptor that warns on deprecated endpoints
adapter.middleware = [
  {
    pre: async (request) => request,
    post: async (request, response) => {
      if (response.headers.get('Deprecation') === 'true') {
        const sunset = response.headers.get('Sunset');
        console.warn(
          `[API Deprecation] ${request.url} is deprecated. Sunset: ${sunset}`
        );
        // Report to telemetry
        reportDeprecatedApiUsage(request.url, sunset);
      }
      return response;
    }
  }
];
```

---

## 5. CI Validation Pipeline

### 5.1 Spec Generation and Diff

```yaml
# .github/workflows/openapi.yml
name: OpenAPI Validation

on:
  pull_request:
    paths:
      - 'src/LinearPrecision.Api/**'

jobs:
  openapi-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for base comparison

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'

      - name: Build API
        run: dotnet build src/LinearPrecision.Api -c Release

      - name: Generate Current Spec
        run: dotnet run --project src/LinearPrecision.Api -- --export-openapi > current-spec.json

      - name: Get Base Spec
        run: |
          git checkout origin/main -- openapi-spec/v1.json 2>/dev/null || echo '{}' > openapi-spec/v1.json
          cp openapi-spec/v1.json base-spec.json

      - name: Check Breaking Changes
        uses: oasdiff/oasdiff-action@v1
        with:
          base: base-spec.json
          revision: current-spec.json
          fail-on: ERR  # Fail on breaking changes

      - name: Generate Diff Report
        if: always()
        run: |
          npx oasdiff diff base-spec.json current-spec.json --format markdown > api-diff.md

      - name: Comment PR with Diff
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const diff = fs.readFileSync('api-diff.md', 'utf8');
            if (diff.trim()) {
              github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: `## API Changes\n\n${diff}`
              });
            }

      - name: Validate Spec
        run: |
          npx @redocly/cli lint current-spec.json --config redocly.yaml

      - name: Update Committed Spec
        run: |
          cp current-spec.json openapi-spec/v1.json
```

### 5.2 Breaking Change Detection Rules

The following changes are flagged as breaking:

| Change | Severity | CI Behavior |
|--------|---------|-------------|
| Endpoint removed | Error | Block merge |
| Required request field added | Error | Block merge |
| Response field removed | Error | Block merge |
| Response field type changed | Error | Block merge |
| Status code removed | Error | Block merge |
| Required field became required | Error | Block merge |
| Enum value removed | Warning | Warn, allow merge |
| Description changed | Info | Log only |
| New endpoint added | Info | Log only |
| Optional field added | Info | Log only |

### 5.3 TypeScript Client Regeneration

```yaml
  regenerate-client:
    runs-on: ubuntu-latest
    needs: openapi-check
    steps:
      - name: Generate TypeScript Client
        run: |
          npx @microsoft/kiota generate \
            -l TypeScript \
            -d current-spec.json \
            -o frontend/src/api/generated \
            -n LinearPrecision.Api \
            --cc LinearPrecisionClient

      - name: Check for Client Changes
        id: client-diff
        run: |
          if git diff --quiet frontend/src/api/generated; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Frontend Type Check
        if: steps.client-diff.outputs.changed == 'true'
        run: |
          cd frontend
          npm ci
          npm run typecheck

      - name: Frontend Build
        if: steps.client-diff.outputs.changed == 'true'
        run: |
          cd frontend
          npm run build

      - name: Commit Updated Client
        if: steps.client-diff.outputs.changed == 'true'
        run: |
          git add frontend/src/api/generated
          git commit -m "chore: regenerate API client from OpenAPI spec"
          git push
```

### 5.4 Schema Validation Rules

```yaml
# redocly.yaml
extends:
  - recommended

rules:
  operation-operationId: error
  operation-summary: error
  operation-description: warn
  tag-description: warn
  no-ambiguous-paths: error
  no-identical-paths: error
  path-parameters-defined: error
  operation-4xx-response: warn
  response-contains-header:
    severity: warn
    names:
      - X-Request-Id
  security-defined: error
  no-unresolved-refs: error
  no-enum-type-mismatch: error
  paths-kebab-case: error
```

---

## 6. API Documentation

### 6.1 Documentation Platform

| Option | Used For | URL |
|--------|---------|-----|
| Swagger UI | Development / debugging | `/swagger` (dev/staging only) |
| Scalar | Public API docs | `/docs/api` |
| Redoc | Alternative public docs | `/docs/api/redoc` (optional) |

### 6.2 Scalar Configuration

```csharp
app.MapScalarApiReference(options =>
{
    options.WithTitle("Linear Precision API")
        .WithTheme(ScalarTheme.Default)
        .WithDefaultHttpClient(ScalarTarget.JavaScript, ScalarClient.Fetch)
        .WithPreferredScheme("Bearer")
        .WithApiKeyAuthentication(apiKey =>
        {
            apiKey.Token = "your-jwt-token-here";
        });
});
```

### 6.3 Documentation Enrichment

Beyond auto-generated docs, supplement with:

| Section | Content | Source |
|---------|---------|--------|
| Getting Started | Authentication flow, first API call | Hand-written markdown |
| Concepts | Multi-tenancy, RBAC, pagination | Hand-written markdown |
| Webhooks | Event types, payload schemas, retry policy | Auto-generated from code |
| Errors | Error code reference, troubleshooting | Auto-generated from error constants |
| Rate Limits | Per-plan limits, headers, best practices | Hand-written markdown |
| Changelog | Version history with breaking/non-breaking changes | Auto-generated from git + spec diff |
| SDKs | TypeScript client usage, installation | Auto-generated from Kiota |

### 6.4 Example Enrichment in Code

```csharp
app.MapPost("/api/v1/tasks", CreateTask)
    .WithOpenApi(op =>
    {
        op.RequestBody.Content["application/json"].Example = new OpenApiString(
            JsonSerializer.Serialize(new
            {
                projectId = "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                title = "Design login page",
                description = "Create Figma designs for the login page including...",
                priority = "high",
                assigneeId = "3fa85f64-5717-4562-b3fc-2c963f66afa7",
                labels = new[] { "design", "frontend" },
                dueDate = "2026-04-15",
                estimateHours = 8.0
            }));
        return op;
    });
```

---

## 7. Response Format Standards

### 7.1 Pagination

All list endpoints return a consistent paginated response:

```json
{
  "items": [ ... ],
  "total": 142,
  "page": 1,
  "pageSize": 25,
  "totalPages": 6,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

Query parameters: `?page=1&pageSize=25&sort=createdAt&order=desc`

### 7.2 Error Responses

All errors follow RFC 9457 (Problem Details):

```json
{
  "type": "https://docs.linearprecision.com/errors/validation",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more validation errors occurred.",
  "instance": "/api/v1/tasks",
  "traceId": "00-abc123-def456-01",
  "errors": {
    "title": ["Title is required and must be between 1 and 500 characters."],
    "priority": ["'invalid' is not a valid priority value. Allowed: urgent, high, medium, low, none."]
  }
}
```

### 7.3 Envelope-Free Responses

Single-item responses return the resource directly (no wrapper):

```json
// GET /api/v1/tasks/123
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "identifier": "PROJ-42",
  "title": "Design login page",
  "status": "in_progress",
  "priority": "high",
  "createdAt": "2026-03-18T10:30:00Z",
  "updatedAt": "2026-03-18T14:22:00Z"
}
```

### 7.4 Standard Headers

| Header | Direction | Purpose |
|--------|-----------|---------|
| `X-Request-Id` | Response | Unique request ID for tracing |
| `X-RateLimit-Limit` | Response | Rate limit ceiling |
| `X-RateLimit-Remaining` | Response | Remaining requests in window |
| `X-RateLimit-Reset` | Response | Unix timestamp when limit resets |
| `X-Total-Count` | Response (lists) | Total items matching query |
| `ETag` | Response | Resource version for caching |
| `If-None-Match` | Request | Conditional GET |
| `If-Match` | Request | Optimistic concurrency |

---

## 8. Spec Management and Governance

### 8.1 Spec File Location

```
openapi-spec/
├── v1.json           # Current v1 spec (committed, auto-updated by CI)
├── v1.changelog.md   # Version-by-version changelog
└── archive/
    └── v1.2025-12-01.json  # Archived previous specs for reference
```

### 8.2 Review Process for API Changes

1. **PR adds or modifies an endpoint**
2. CI generates new spec and diffs against base
3. CI comments on PR with API diff summary
4. **Breaking changes**: CI blocks merge. Requires:
   - Justification in PR description
   - Migration guide written
   - Version bump (if v2 needed)
   - Approval from API owner
5. **Non-breaking changes**: CI passes. Normal review process.
6. On merge: spec committed, client regenerated, docs updated

### 8.3 API Design Review Checklist

- [ ] Endpoint follows RESTful conventions (nouns, not verbs)
- [ ] URL uses kebab-case (`/time-entries`, not `/timeEntries`)
- [ ] Request/response use camelCase JSON
- [ ] All fields have descriptions
- [ ] Required vs. optional fields are correct
- [ ] Pagination is used for list endpoints
- [ ] Error responses follow Problem Details format
- [ ] Authentication requirement is documented
- [ ] Rate limiting is considered
- [ ] Examples are provided
- [ ] Breaking changes are flagged and justified

---

## 9. Timeline

| Week | Milestone |
|------|-----------|
| Week 1 | OpenAPI generation configured, Swagger UI running |
| Week 4 | First TypeScript client generated (auth endpoints) |
| Week 6 | Client covers Projects + Tasks APIs |
| Week 8 | Client covers all P1 endpoints |
| Week 10 | Frontend fully migrated to generated client |
| Week 16 | Client covers all P2 endpoints |
| Week 22 | Client covers all P3 endpoints |
| Week 24 | External developer portal published |
| Week 26 | API versioning (v2) infrastructure ready if needed |

---

## 10. External API Considerations (Future)

When Linear Precision opens its API to third-party developers:

| Feature | Implementation |
|---------|---------------|
| API Keys | Long-lived tokens for server-to-server integration |
| OAuth 2.0 | Authorization code flow for third-party apps |
| Scopes | Granular permission scopes (e.g., `tasks:read`, `tasks:write`) |
| Webhooks | Configurable outbound HTTP callbacks for events |
| Rate Limits | Separate, more restrictive limits for external API |
| SDK Publishing | Publish `@linearprecision/api-client` to npm |
| Developer Portal | Self-service API key management, usage dashboard |
| Sandbox | Separate sandbox environment with test data |
