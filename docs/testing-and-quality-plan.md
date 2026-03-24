# Testing and Quality Plan

> Linear Precision -- Comprehensive Testing and Quality Assurance Strategy
> Owner: Engineering Team | Status: Draft | Last Updated: 2026-03-18

---

## 1. Testing Philosophy

- **Tests are a first-class deliverable.** Every feature PR includes tests. No exceptions.
- **Test the behavior, not the implementation.** Tests should survive refactoring.
- **Multi-tenant isolation is a security boundary.** It gets dedicated, rigorous testing.
- **Fast feedback loop.** Unit tests run in < 10 seconds. Full suite in < 5 minutes.
- **Flaky tests are bugs.** A flaky test is removed or fixed within 24 hours.

---

## 2. Testing Strategy Overview

| Layer | Tool | Scope | Speed | Runs In |
|-------|------|-------|-------|---------|
| Unit | xUnit + FluentAssertions + NSubstitute | Domain logic, validators, mappers, guards | < 10s | CI (every push) |
| Integration | WebApplicationFactory + Testcontainers | HTTP -> middleware -> handler -> DB roundtrip | < 2 min | CI (every push) |
| Contract | Verify (snapshot testing) | API response shape stability | < 30s | CI (every push) |
| API Flow | WebApplicationFactory | Multi-step business workflows | < 3 min | CI (every push) |
| Load | NBomber | Concurrent users, rate limiting, DB contention | 5-15 min | CI (nightly) |
| E2E | Playwright (.NET) | Full browser-based user flows | 5-10 min | CI (pre-release) |
| Security | Custom + OWASP ZAP | Tenant isolation, auth bypass, injection | 10-20 min | CI (weekly) |
| Mutation | Stryker.NET | Test suite effectiveness validation | 30-60 min | CI (weekly) |

---

## 3. Test Project Structure

```
tests/
├── LinearPrecision.Api.Tests/
│   ├── Unit/
│   │   ├── Modules/
│   │   │   ├── Tasks/
│   │   │   │   ├── CreateTaskCommandTests.cs
│   │   │   │   ├── UpdateTaskCommandTests.cs
│   │   │   │   ├── DeleteTaskCommandTests.cs
│   │   │   │   ├── MoveTaskCommandTests.cs
│   │   │   │   ├── TaskValidatorTests.cs
│   │   │   │   ├── TaskMapperTests.cs
│   │   │   │   └── BoardGroupingServiceTests.cs
│   │   │   ├── Projects/
│   │   │   │   ├── CreateProjectCommandTests.cs
│   │   │   │   ├── UpdateProjectCommandTests.cs
│   │   │   │   ├── ProjectValidatorTests.cs
│   │   │   │   └── ProjectHealthCalculatorTests.cs
│   │   │   ├── Sprints/
│   │   │   │   ├── CreateSprintCommandTests.cs
│   │   │   │   ├── StartSprintCommandTests.cs
│   │   │   │   ├── CompleteSprintCommandTests.cs
│   │   │   │   └── SprintBurndownCalculatorTests.cs
│   │   │   ├── Goals/
│   │   │   │   ├── GoalHierarchyTests.cs
│   │   │   │   ├── GoalProgressCalculatorTests.cs
│   │   │   │   └── GoalValidatorTests.cs
│   │   │   ├── Auth/
│   │   │   │   ├── RegisterCommandTests.cs
│   │   │   │   ├── LoginCommandTests.cs
│   │   │   │   ├── RefreshTokenTests.cs
│   │   │   │   └── PasswordHashingTests.cs
│   │   │   ├── Notifications/
│   │   │   │   ├── NotificationGeneratorTests.cs
│   │   │   │   └── NotificationPreferenceTests.cs
│   │   │   ├── Documents/
│   │   │   │   ├── DocumentValidatorTests.cs
│   │   │   │   └── FolderTreeTests.cs
│   │   │   ├── TimeTracking/
│   │   │   │   ├── TimeEntryValidatorTests.cs
│   │   │   │   └── TimeAggregationTests.cs
│   │   │   ├── Automations/
│   │   │   │   ├── TriggerEvaluatorTests.cs
│   │   │   │   ├── ConditionMatcherTests.cs
│   │   │   │   └── ActionExecutorTests.cs
│   │   │   └── Billing/
│   │   │       ├── EntitlementCheckerTests.cs
│   │   │       └── UsageMeterTests.cs
│   │   ├── Infrastructure/
│   │   │   ├── TenantMiddlewareTests.cs
│   │   │   ├── AuthPolicyTests.cs
│   │   │   ├── RateLimiterTests.cs
│   │   │   ├── ExceptionHandlerTests.cs
│   │   │   └── PaginationTests.cs
│   │   └── AI/
│   │       ├── AIContextBuilderTests.cs
│   │       ├── AIToolRegistryTests.cs
│   │       ├── AIRateLimiterTests.cs
│   │       ├── AIApprovalGateTests.cs
│   │       └── Tools/
│   │           ├── GenerateSubtasksToolTests.cs
│   │           ├── CreateTaskToolTests.cs
│   │           └── SearchWorkspaceToolTests.cs
│   └── Integration/
│       ├── TaskEndpointTests.cs
│       ├── ProjectEndpointTests.cs
│       ├── SprintEndpointTests.cs
│       ├── GoalEndpointTests.cs
│       ├── AuthEndpointTests.cs
│       ├── CalendarEndpointTests.cs
│       ├── TimeEntryEndpointTests.cs
│       ├── DocumentEndpointTests.cs
│       ├── NotificationEndpointTests.cs
│       ├── SearchEndpointTests.cs
│       ├── SettingsEndpointTests.cs
│       ├── MultiTenantTests.cs
│       ├── FileUploadTests.cs
│       └── Fixtures/
│           ├── ApiFixture.cs
│           ├── DatabaseFixture.cs
│           └── AuthHelper.cs
├── LinearPrecision.Worker.Tests/
│   ├── NotificationDispatcherTests.cs
│   ├── AutomationEvaluatorTests.cs
│   ├── AIJobProcessorTests.cs
│   ├── EmailSenderTests.cs
│   ├── BillingWebhookProcessorTests.cs
│   └── ImportProcessorTests.cs
├── LinearPrecision.Integration.Tests/
│   ├── Workflows/
│   │   ├── ProjectLifecycleTests.cs
│   │   ├── SprintWorkflowTests.cs
│   │   ├── IntakeToTaskFlowTests.cs
│   │   ├── GoalTrackingWorkflowTests.cs
│   │   ├── DocumentCollaborationTests.cs
│   │   └── AutomationTriggerWorkflowTests.cs
│   ├── Security/
│   │   ├── TenantIsolationTests.cs
│   │   ├── RBACTests.cs
│   │   ├── AuthTokenTests.cs
│   │   └── InputSanitizationTests.cs
│   └── Performance/
│       ├── ConcurrentBoardOperationsTests.cs
│       ├── BulkTaskCreationTests.cs
│       └── SearchPerformanceTests.cs
├── LinearPrecision.Contract.Tests/
│   ├── Snapshots/
│   │   ├── TaskResponseSnapshot.cs
│   │   ├── ProjectResponseSnapshot.cs
│   │   ├── ErrorResponseSnapshot.cs
│   │   └── PaginatedResponseSnapshot.cs
│   └── SchemaValidation/
│       └── OpenApiSchemaTests.cs
├── LinearPrecision.Load.Tests/
│   ├── Scenarios/
│   │   ├── BoardLoadScenario.cs
│   │   ├── SearchLoadScenario.cs
│   │   ├── AuthLoadScenario.cs
│   │   └── MixedWorkloadScenario.cs
│   └── Reports/
│       └── .gitkeep
└── LinearPrecision.E2E.Tests/
    ├── Flows/
    │   ├── LoginFlowTests.cs
    │   ├── CreateProjectFlowTests.cs
    │   ├── BoardDragDropTests.cs
    │   ├── SprintManagementTests.cs
    │   └── AIAssistantTests.cs
    └── Fixtures/
        ├── PlaywrightFixture.cs
        └── TestDataSeeder.cs
```

---

## 4. Critical Coverage Areas

### 4.1 Multi-Tenant Isolation (Priority: Critical)

Every data-access path must be tested for tenant boundary enforcement.

| Test Case | Description | Expectation |
|-----------|-------------|-------------|
| Cross-tenant task read | User in Workspace A requests task from Workspace B | 404 Not Found (not 403) |
| Cross-tenant project list | User in Workspace A lists projects | Only Workspace A projects returned |
| Cross-tenant search | Search query scoped to workspace | Zero results from other workspaces |
| Tenant header spoofing | Request with forged X-Workspace-Id header | Rejected; tenant resolved from auth token |
| Admin cross-tenant | Workspace Admin tries to access other workspace | 404 Not Found |
| Shared user isolation | User in both Workspace A and B | Correct data per active workspace |

**Implementation pattern:**
```csharp
[Fact]
public async Task GetTask_FromDifferentWorkspace_Returns404()
{
    // Arrange
    var workspaceA = await CreateWorkspaceAsync("Workspace A");
    var workspaceB = await CreateWorkspaceAsync("Workspace B");
    var taskInB = await CreateTaskAsync(workspaceB);

    var client = CreateAuthenticatedClient(workspaceA);

    // Act
    var response = await client.GetAsync($"/api/v1/tasks/{taskInB.Id}");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
}
```

### 4.2 Permission Enforcement (Priority: Critical)

Every endpoint must be tested against the RBAC matrix.

| Role | Projects | Tasks | Sprints | Settings | Billing | Members |
|------|---------|-------|---------|----------|---------|---------|
| Owner | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| Admin | CRUD | CRUD | CRUD | CRU | R | CRU |
| Member | R | CRUD (own) | R | R | - | R |
| Guest | R (invited) | R (invited) | - | - | - | - |

**Test matrix:** Each cell generates at least one positive and one negative test.

```csharp
[Theory]
[InlineData("Owner", HttpStatusCode.OK)]
[InlineData("Admin", HttpStatusCode.OK)]
[InlineData("Member", HttpStatusCode.Forbidden)]
[InlineData("Guest", HttpStatusCode.Forbidden)]
public async Task DeleteProject_ByRole_ReturnsExpectedStatus(string role, HttpStatusCode expected)
{
    var client = CreateAuthenticatedClient(workspace, role);
    var response = await client.DeleteAsync($"/api/v1/projects/{project.Id}");
    response.StatusCode.Should().Be(expected);
}
```

### 4.3 Automation Trigger Evaluation (Priority: High)

| Trigger Type | Condition | Action | Test Cases |
|-------------|-----------|--------|------------|
| Task status change | Status == "Done" | Move to sprint backlog | Status to Done, Status to In Progress (no trigger) |
| Task assignment | Assignee changed | Send notification | Assign, Unassign, Reassign |
| Due date passed | DueDate < Now | Mark overdue, notify | Due today, Due yesterday, Due next week (no trigger) |
| Label added | Label == "Blocked" | Notify project lead | Add "Blocked", Add "Enhancement" (no trigger) |
| Custom field change | Priority changed to "Urgent" | Create Slack notification | Priority to Urgent, Priority to Low (no trigger) |

### 4.4 Billing Entitlement Gates (Priority: High)

| Feature | Free | Pro | Business | Enterprise |
|---------|------|-----|----------|-----------|
| Max projects | 3 | 25 | Unlimited | Unlimited |
| Max members | 5 | 25 | 100 | Unlimited |
| AI requests/day | 50 | 500 | 2,000 | 10,000 |
| Automations | 5 | 50 | 500 | Unlimited |
| File storage (GB) | 1 | 10 | 100 | 1,000 |
| Custom fields | No | Yes | Yes | Yes |
| SSO/SAML | No | No | Yes | Yes |

```csharp
[Fact]
public async Task CreateProject_FreePlan_Over3Projects_Returns402()
{
    var workspace = await CreateWorkspaceWithPlan(PlanTier.Free);
    await CreateProjectsAsync(workspace, count: 3); // Fill limit

    var client = CreateAuthenticatedClient(workspace);
    var response = await client.PostAsJsonAsync("/api/v1/projects", new { Name = "Fourth Project" });

    response.StatusCode.Should().Be(HttpStatusCode.PaymentRequired);
    var body = await response.Content.ReadFromJsonAsync<ErrorResponse>();
    body!.Code.Should().Be("plan_limit_reached");
    body.Feature.Should().Be("projects");
}
```

### 4.5 AI Audit Trail Completeness (Priority: High)

Every AI interaction must produce a complete audit record:

```csharp
[Fact]
public async Task AIChat_WritesCompleteAuditTrail()
{
    // Arrange
    var client = CreateAuthenticatedClient(workspace);

    // Act
    var response = await client.PostAsJsonAsync("/api/v1/ai/chat", new
    {
        Message = "Summarize Project Alpha",
        ConversationId = (string?)null
    });

    // Assert
    var auditLogs = await GetAuditLogsAsync(workspace.Id);
    auditLogs.Should().ContainSingle(l => l.EventType == "chat_request");
    auditLogs.Should().ContainSingle(l => l.EventType == "tool_call" && l.ToolName == "summarize_project");
    auditLogs.Should().ContainSingle(l => l.EventType == "tool_result");

    var chatLog = auditLogs.First(l => l.EventType == "chat_request");
    chatLog.WorkspaceId.Should().Be(workspace.Id);
    chatLog.UserId.Should().Be(user.Id);
    chatLog.TokensUsed.Should().BeGreaterThan(0);
    chatLog.LatencyMs.Should().BeGreaterThan(0);
    chatLog.ModelId.Should().NotBeNullOrEmpty();
}
```

### 4.6 Concurrent Board Operations (Priority: High)

```csharp
[Fact]
public async Task ConcurrentTaskMoves_NoDataLoss()
{
    // Arrange
    var tasks = await CreateTasksAsync(project, count: 20);
    var clients = Enumerable.Range(0, 5)
        .Select(_ => CreateAuthenticatedClient(workspace))
        .ToList();

    // Act: 5 users move tasks simultaneously
    var moves = tasks.Take(10).Select((task, i) =>
        clients[i % 5].PatchAsJsonAsync($"/api/v1/tasks/{task.Id}/move", new
        {
            StatusId = targetStatus.Id,
            SortOrder = i * 1000
        }));

    var responses = await Task.WhenAll(moves);

    // Assert: All moves succeed, no lost updates
    responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.OK));

    var boardTasks = await GetBoardTasksAsync(project.Id);
    boardTasks.Where(t => t.StatusId == targetStatus.Id).Should().HaveCount(10);
}
```

---

## 5. Seed Data Strategy

### 5.1 Development Seed

Used for local development via `dotnet run --seed`:

| Entity | Count | Notes |
|--------|-------|-------|
| Workspaces | 1 | "Acme Corp" |
| Users | 7 | 1 Owner, 2 Admins, 3 Members, 1 Guest |
| Projects | 10 | Various statuses and health levels |
| Tasks | 50 | Distributed across projects, statuses, priorities |
| Sprints | 3 | 1 completed, 1 active, 1 planned |
| Goals | 5 | OKR hierarchy: 1 objective, 4 key results |
| Documents | 8 | Mix of docs and folders |
| Time Entries | 30 | Last 2 weeks of data |
| Notifications | 20 | Various types, read/unread mix |
| Automations | 3 | 1 active, 1 paused, 1 draft |
| Labels | 8 | Bug, Feature, Enhancement, Blocked, etc. |

```csharp
public class DevelopmentSeeder : IDataSeeder
{
    public async Task SeedAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.Workspaces.AnyAsync(ct)) return; // Idempotent

        var workspace = new Workspace { Name = "Acme Corp", Slug = "acme-corp" };
        // ... create all entities with realistic relationships
    }
}
```

### 5.2 Test Seed

Minimal, per-test setup. Tests create only what they need:

```csharp
// Each test creates its own isolated data
[Fact]
public async Task UpdateTask_ValidInput_ReturnsUpdatedTask()
{
    // Arrange -- minimal setup
    var workspace = await CreateWorkspaceAsync();
    var project = await CreateProjectAsync(workspace);
    var task = await CreateTaskAsync(project, title: "Original Title");

    // Act & Assert...
}
```

**Shared fixtures** for expensive setup (database, API host):

```csharp
public class DatabaseFixture : IAsyncLifetime
{
    private PostgreSqlContainer _postgres = null!;

    public async Task InitializeAsync()
    {
        _postgres = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .Build();
        await _postgres.StartAsync();
    }

    public string ConnectionString => _postgres.GetConnectionString();

    public async Task DisposeAsync() => await _postgres.DisposeAsync();
}
```

### 5.3 Demo Seed

Rich dataset for demos, sales, and screenshots:

| Entity | Count | Notes |
|--------|-------|-------|
| Workspaces | 2 | "LinearCorp" (full), "StartupCo" (small) |
| Users | 25 | Realistic names, avatars, varied activity |
| Projects | 20 | Across departments, various stages |
| Tasks | 200+ | Full lifecycle representation |
| Sprints | 8 | Historical data for burndown charts |
| Goals | 15 | Full OKR tree with progress |
| Documents | 30 | Templates, meeting notes, specs |
| Time Entries | 500+ | 3 months of realistic time data |
| Comments | 100+ | Threaded discussions |
| Activity Log | 1000+ | Rich activity feed |

---

## 6. Testing Utilities and Helpers

### 6.1 API Test Base

```csharp
public abstract class ApiTestBase : IClassFixture<ApiFixture>, IAsyncLifetime
{
    protected readonly HttpClient Client;
    protected readonly ApiFixture Fixture;

    protected ApiTestBase(ApiFixture fixture)
    {
        Fixture = fixture;
        Client = fixture.CreateClient();
    }

    protected async Task<WorkspaceContext> CreateWorkspaceAsync(string name = "Test Workspace")
    {
        // Creates workspace + owner user + auth token
        // Returns context object with all IDs and authenticated client
    }

    protected HttpClient CreateAuthenticatedClient(WorkspaceContext ctx, string role = "Owner")
    {
        var client = Fixture.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", ctx.GetTokenForRole(role));
        client.DefaultRequestHeaders.Add("X-Workspace-Id", ctx.WorkspaceId.ToString());
        return client;
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public async Task DisposeAsync() => await Fixture.ResetDatabaseAsync();
}
```

### 6.2 Fluent Assertion Extensions

```csharp
public static class ResponseAssertions
{
    public static async Task<T> ShouldBeSuccessful<T>(this HttpResponseMessage response)
    {
        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.OK, HttpStatusCode.Created, HttpStatusCode.NoContent);
        return await response.Content.ReadFromJsonAsync<T>()
            ?? throw new InvalidOperationException("Response body was null");
    }

    public static async Task ShouldBeValidationError(
        this HttpResponseMessage response, string field)
    {
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        var error = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        error!.Errors.Should().ContainKey(field);
    }

    public static async Task ShouldBePaginated<T>(
        this HttpResponseMessage response, int expectedTotal)
    {
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<PaginatedResponse<T>>();
        result!.Total.Should().Be(expectedTotal);
        result.Items.Should().NotBeNull();
    }
}
```

### 6.3 Test Data Builders

```csharp
public class TaskBuilder
{
    private string _title = "Test Task";
    private string? _description;
    private Priority _priority = Priority.Medium;
    private Guid? _assigneeId;
    private DateOnly? _dueDate;
    private List<string> _labels = new();

    public TaskBuilder WithTitle(string title) { _title = title; return this; }
    public TaskBuilder WithPriority(Priority p) { _priority = p; return this; }
    public TaskBuilder WithAssignee(Guid id) { _assigneeId = id; return this; }
    public TaskBuilder WithDueDate(DateOnly d) { _dueDate = d; return this; }
    public TaskBuilder WithLabels(params string[] labels) { _labels.AddRange(labels); return this; }

    public CreateTaskRequest BuildRequest() => new()
    {
        Title = _title,
        Description = _description,
        Priority = _priority,
        AssigneeId = _assigneeId,
        DueDate = _dueDate,
        Labels = _labels
    };
}
```

---

## 7. CI Pipeline

### 7.1 Pipeline Stages

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'

      - name: Restore
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Unit Tests
        run: dotnet test tests/LinearPrecision.Api.Tests --filter "Category=Unit" --no-build -c Release --logger "trx" --collect:"XPlat Code Coverage"

      - name: Integration Tests
        run: dotnet test tests/LinearPrecision.Api.Tests --filter "Category=Integration" --no-build -c Release --logger "trx"
        services:
          postgres:
            image: postgres:16-alpine
            env:
              POSTGRES_PASSWORD: test
            ports: ['5432:5432']
          redis:
            image: redis:7-alpine
            ports: ['6379:6379']

      - name: Contract Tests
        run: dotnet test tests/LinearPrecision.Contract.Tests --no-build -c Release --logger "trx"

      - name: Workflow Tests
        run: dotnet test tests/LinearPrecision.Integration.Tests --no-build -c Release --logger "trx"

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: '**/coverage.cobertura.xml'

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: '**/*.trx'

  openapi-check:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Generate OpenAPI Spec
        run: dotnet run --project src/LinearPrecision.Api -- --export-openapi

      - name: Diff Against Previous
        run: |
          npx @openapitools/openapi-diff previous-openapi.json current-openapi.json --fail-on-incompatible

  frontend-check:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Generate TypeScript Client
        run: npx kiota generate -l TypeScript -d openapi.json -o frontend/src/api/generated

      - name: Frontend Build
        run: npm ci && npm run build
        working-directory: frontend

  nightly:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - name: Load Tests
        run: dotnet run --project tests/LinearPrecision.Load.Tests -c Release

      - name: Security Scan
        run: dotnet tool run security-scan

      - name: Mutation Tests
        run: dotnet stryker
```

### 7.2 Quality Gates

| Gate | Threshold | Enforcement |
|------|----------|-------------|
| Unit test pass rate | 100% | CI blocks merge |
| Integration test pass rate | 100% | CI blocks merge |
| Code coverage (line) | >= 80% | CI warning at < 80%, block at < 70% |
| Code coverage (branch) | >= 70% | CI warning |
| OpenAPI breaking changes | 0 | CI blocks merge |
| Contract test failures | 0 | CI blocks merge |
| Security vulnerabilities (critical) | 0 | CI blocks merge |
| Security vulnerabilities (high) | 0 | CI warning |
| Build warnings | 0 new | CI warning |
| Mutation score | >= 60% | Nightly report |

### 7.3 Test Categorization

```csharp
// Tests are categorized for selective CI execution
[Trait("Category", "Unit")]
public class TaskValidatorTests { }

[Trait("Category", "Integration")]
public class TaskEndpointTests { }

[Trait("Category", "Security")]
public class TenantIsolationTests { }

[Trait("Category", "Performance")]
public class ConcurrentBoardOperationsTests { }
```

---

## 8. Load Testing with NBomber

### 8.1 Scenarios

```csharp
public class BoardLoadScenario
{
    public ScenarioProps Create()
    {
        return Scenario.Create("board_operations", async context =>
        {
            // Step 1: Load board
            var loadBoard = await Step.Run("load_board", context, async () =>
            {
                var response = await _client.GetAsync($"/api/v1/projects/{_projectId}/board");
                return response.IsSuccessStatusCode
                    ? Response.Ok() : Response.Fail();
            });

            // Step 2: Move a task
            var moveTask = await Step.Run("move_task", context, async () =>
            {
                var response = await _client.PatchAsJsonAsync(
                    $"/api/v1/tasks/{RandomTask()}/move",
                    new { StatusId = RandomStatus(), SortOrder = Random.Shared.Next(1000, 99999) });
                return response.IsSuccessStatusCode
                    ? Response.Ok() : Response.Fail();
            });

            return loadBoard.IsError ? loadBoard : moveTask;
        })
        .WithWarmUpDuration(TimeSpan.FromSeconds(10))
        .WithLoadSimulations(
            Simulation.Inject(rate: 10, interval: TimeSpan.FromSeconds(1), during: TimeSpan.FromMinutes(2)),
            Simulation.Inject(rate: 50, interval: TimeSpan.FromSeconds(1), during: TimeSpan.FromMinutes(2)),
            Simulation.Inject(rate: 100, interval: TimeSpan.FromSeconds(1), during: TimeSpan.FromMinutes(2))
        );
    }
}
```

### 8.2 Performance Targets

| Endpoint | P50 | P95 | P99 | Max RPS |
|----------|-----|-----|-----|---------|
| GET /tasks (list) | < 50ms | < 150ms | < 300ms | 500 |
| GET /tasks/{id} | < 30ms | < 80ms | < 150ms | 1000 |
| POST /tasks | < 100ms | < 250ms | < 500ms | 200 |
| PATCH /tasks/{id}/move | < 50ms | < 150ms | < 300ms | 300 |
| GET /projects/{id}/board | < 100ms | < 300ms | < 600ms | 200 |
| GET /search?q=... | < 150ms | < 400ms | < 800ms | 100 |
| POST /ai/chat | < 500ms (TTFB) | < 1500ms | < 3000ms | 50 |

---

## 9. E2E Testing with Playwright

### 9.1 Critical User Flows

| Flow | Steps | Priority |
|------|-------|----------|
| Registration & Login | Register -> Verify Email -> Login -> See Dashboard | P0 |
| Create Project & Task | Login -> New Project -> New Task -> See on Board | P0 |
| Board Drag & Drop | Login -> Board -> Drag task to new status -> Verify persistence | P0 |
| Sprint Management | Create Sprint -> Add Tasks -> Start -> Complete | P1 |
| Goal Tracking | Create Goal -> Link Project -> Update Progress -> Verify Roll-up | P1 |
| AI Assistant | Open AI Panel -> Ask Question -> Receive Streamed Response | P1 |
| Settings & Billing | Navigate Settings -> Update Workspace -> View Billing | P2 |

### 9.2 E2E Test Example

```csharp
[Test]
public async Task CreateProjectAndTask_FullFlow()
{
    await Page.GotoAsync("/login");
    await Page.FillAsync("[data-testid='email-input']", "test@example.com");
    await Page.FillAsync("[data-testid='password-input']", "TestPass123!");
    await Page.ClickAsync("[data-testid='login-button']");

    await Page.WaitForURLAsync("**/dashboard");

    // Create project
    await Page.ClickAsync("[data-testid='new-project-button']");
    await Page.FillAsync("[data-testid='project-name']", "E2E Test Project");
    await Page.ClickAsync("[data-testid='create-project-submit']");

    await Expect(Page.Locator("[data-testid='project-title']"))
        .ToHaveTextAsync("E2E Test Project");

    // Create task
    await Page.ClickAsync("[data-testid='new-task-button']");
    await Page.FillAsync("[data-testid='task-title']", "E2E Test Task");
    await Page.ClickAsync("[data-testid='create-task-submit']");

    await Expect(Page.Locator("[data-testid='board-card']").First)
        .ToContainTextAsync("E2E Test Task");
}
```

---

## 10. Code Coverage Strategy

### 10.1 Coverage Targets by Module

| Module | Line Coverage | Branch Coverage | Notes |
|--------|-------------|----------------|-------|
| Domain entities & value objects | 95% | 90% | Core business logic |
| Command/query handlers | 90% | 85% | Application logic |
| Validators | 95% | 90% | Input validation |
| API endpoints (integration) | 85% | 75% | HTTP layer |
| Infrastructure (middleware, filters) | 80% | 70% | Cross-cutting concerns |
| AI module | 80% | 70% | LLM calls mocked |
| Worker jobs | 85% | 75% | Background processing |
| Mappers | 90% | N/A | Simple transformations |

### 10.2 Coverage Exclusions

```xml
<!-- coverlet.runsettings -->
<Configuration>
  <Exclude>
    [*]*.Migrations.*
    [*]*.Generated.*
    [*]*.Program
    [*]*.Startup
    [*]*.ServiceRegistration*
  </Exclude>
</Configuration>
```

---

## 11. Test Environment Management

### 11.1 Docker Compose for Test Infrastructure

```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: linearprecision_test
      POSTGRES_PASSWORD: test
    ports: ["5433:5432"]
    tmpfs: /var/lib/postgresql/data  # RAM disk for speed

  redis-test:
    image: redis:7-alpine
    ports: ["6380:6379"]

  mailhog:
    image: mailhog/mailhog
    ports: ["8025:8025", "1025:1025"]
```

### 11.2 Database Reset Between Tests

```csharp
public class ApiFixture : IAsyncLifetime
{
    public async Task ResetDatabaseAsync()
    {
        // Use Respawn for fast database reset
        var respawner = await Respawner.CreateAsync(_connectionString, new RespawnerOptions
        {
            TablesToIgnore = new[] { new Table("__EFMigrationsHistory") },
            DbAdapter = DbAdapter.Postgres
        });
        await respawner.ResetAsync(_connectionString);
    }
}
```

---

## 12. Continuous Improvement

### 12.1 Flaky Test Protocol

1. Flaky test detected (fails intermittently in CI)
2. Immediately quarantined with `[Trait("Quarantine", "true")]`
3. Issue created with reproduction steps
4. Fixed within 48 hours or permanently removed
5. Root cause documented in decision log

### 12.2 Test Review Checklist

- [ ] Tests cover the happy path
- [ ] Tests cover validation failures
- [ ] Tests cover authorization (at least one forbidden case)
- [ ] Tests cover tenant isolation (if data-access involved)
- [ ] Tests use descriptive names (`Method_Condition_ExpectedResult`)
- [ ] No hardcoded sleeps or timing-dependent assertions
- [ ] Tests clean up after themselves
- [ ] New test categories are properly tagged

### 12.3 Monthly Quality Review

- Review coverage trends (should be increasing or stable)
- Review flaky test count (should be zero)
- Review mutation test score (should be increasing)
- Review load test results (should meet targets)
- Review test execution time (should not be increasing)
- Update this plan with lessons learned
