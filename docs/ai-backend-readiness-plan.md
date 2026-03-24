# AI Backend Readiness Plan

> Linear Precision -- AI Copilot Backend Architecture
> Owner: Backend Team | Status: Draft | Last Updated: 2026-03-18

---

## 1. Architecture Overview

### Design Principles

1. **Server-side only** -- Every LLM call originates from the backend. The frontend never holds API keys, never constructs prompts, and never parses raw model output.
2. **Provider abstraction** -- All LLM access goes through `Microsoft.Extensions.AI` (`IChatClient`). Swapping Gemini for another provider requires only a DI registration change.
3. **Tool-use first** -- The AI copilot is not a free-form chatbot. It operates through a registered set of tools with strict schemas, permissions, and audit trails.
4. **Human-in-the-loop for writes** -- Any tool that mutates workspace data requires explicit user confirmation before execution.
5. **Streaming by default** -- Chat responses are streamed to the frontend via Server-Sent Events (SSE) with a SignalR fallback for environments that block SSE.

### High-Level Flow

```
┌──────────┐    POST /api/v1/ai/chat     ┌───────────────┐
│ Frontend  │ ──────────────────────────> │ ChatEndpoints  │
│ (Next.js) │ <── SSE stream ─────────── │                │
└──────────┘                              └───────┬───────┘
                                                  │
                                          ┌───────▼───────┐
                                          │ AIChatService  │
                                          │  (orchestrator)│
                                          └───────┬───────┘
                                                  │
                              ┌────────────┬──────┴──────┬────────────┐
                              ▼            ▼             ▼            ▼
                      AIContextBuilder  AIToolRegistry  AIRateLimiter AIAuditLogger
                              │            │
                              ▼            ▼
                      EF Core Queries  AIToolExecutor
                              │            │
                              ▼            ▼
                        PostgreSQL     Domain Services
```

### Technology Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| LLM Abstraction | Microsoft.Extensions.AI 9.x | `IChatClient`, `ChatMessage`, `ChatOptions` |
| Primary Provider | Google Gemini (gemini-2.0-flash) | Via `Microsoft.Extensions.AI.Google` |
| Fallback Provider | OpenAI GPT-4o-mini | Via `Microsoft.Extensions.AI.OpenAI` |
| Streaming | SSE (primary), SignalR (fallback) | `text/event-stream` content type |
| Rate Limiting | `System.Threading.RateLimiting` | Token bucket per user per plan tier |
| Caching | Redis | Conversation history, tool result caching |
| Audit | PostgreSQL `ai_audit_logs` table | Append-only, immutable |

---

## 2. AI Module Structure

```
src/LinearPrecision.Api/
└── AI/
    ├── Endpoints/
    │   ├── ChatEndpoints.cs          # POST /ai/chat, GET /ai/chat/{id}/stream
    │   └── ToolEndpoints.cs          # GET /ai/tools, POST /ai/tools/{name}/execute
    ├── Services/
    │   ├── AIChatService.cs          # Orchestrates conversation flow
    │   ├── AIContextBuilder.cs       # Gathers workspace data for prompt injection
    │   ├── AIToolRegistry.cs         # Discovers and registers available tools
    │   └── AIToolExecutor.cs         # Validates, authorizes, and executes tool calls
    ├── Tools/
    │   ├── GenerateSubtasksTool.cs   # Break a task into subtasks
    │   ├── WriteStatusUpdateTool.cs  # Draft a status update for a project
    │   ├── IdentifyRisksTool.cs      # Analyze project data for risks
    │   ├── SuggestNextStepsTool.cs   # Recommend next actions for a task/project
    │   ├── CreateTaskTool.cs         # Create a new task (write action)
    │   ├── SummarizeProjectTool.cs   # Generate project summary
    │   └── SearchWorkspaceTool.cs    # Search tasks, projects, docs
    ├── Guards/
    │   ├── AIRateLimiter.cs          # Per-user, per-plan rate limiting
    │   ├── AIAuditLogger.cs          # Mandatory audit trail for all AI actions
    │   └── AIApprovalGate.cs         # Human confirmation for write actions
    ├── Models/
    │   ├── AIConversation.cs         # Conversation aggregate
    │   ├── AIMessage.cs              # Individual message (user, assistant, tool)
    │   ├── AIToolInvocation.cs       # Tool call record with input/output
    │   ├── AIToolDefinition.cs       # Tool metadata and schema
    │   └── AIUsageRecord.cs          # Token usage tracking
    └── Configuration/
        ├── AIOptions.cs              # Configuration POCO
        └── AIServiceRegistration.cs  # DI registration extension method
```

---

## 3. Tool Contract Design

### Tool Interface

```csharp
public interface IAITool
{
    string Name { get; }
    string Description { get; }
    JsonSchema InputSchema { get; }
    JsonSchema OutputSchema { get; }
    AIToolClassification Classification { get; }
    bool IsWriteAction { get; }
    bool RequiresConfirmation { get; }
    string[] RequiredPermissions { get; }
    Task<AIToolResult> ExecuteAsync(JsonElement input, AIToolContext context, CancellationToken ct);
}
```

### Tool Definitions

| Tool | Description | Write | Confirm | Permissions | Audit Level |
|------|-------------|-------|---------|-------------|-------------|
| `generate_subtasks` | Analyze a task and suggest 3-8 subtasks with titles, descriptions, and estimates | No | No | `task:read` | Standard |
| `write_status_update` | Draft a project status update based on recent activity | Yes | Yes | `project:write` | Elevated |
| `identify_risks` | Scan project metrics and flag potential risks | No | No | `project:read` | Standard |
| `suggest_next_steps` | Recommend prioritized next actions for a task or project | No | No | `task:read` | Standard |
| `create_task` | Create a new task in a specified project | Yes | Yes | `task:create` | Elevated |
| `summarize_project` | Generate a comprehensive project summary | No | No | `project:read` | Standard |
| `search_workspace` | Full-text search across tasks, projects, and documents | No | No | `workspace:read` | Standard |

### Detailed Tool Schemas

#### `generate_subtasks`

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "taskId": { "type": "string", "format": "uuid", "description": "The parent task to decompose" },
    "maxSubtasks": { "type": "integer", "minimum": 1, "maximum": 15, "default": 5 },
    "includeEstimates": { "type": "boolean", "default": true }
  },
  "required": ["taskId"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "parentTaskId": { "type": "string" },
    "subtasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "estimateHours": { "type": "number" },
          "priority": { "type": "string", "enum": ["urgent", "high", "medium", "low"] },
          "suggestedAssignee": { "type": "string", "nullable": true }
        }
      }
    },
    "reasoning": { "type": "string" }
  }
}
```

#### `create_task`

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectId": { "type": "string", "format": "uuid" },
    "title": { "type": "string", "minLength": 1, "maxLength": 500 },
    "description": { "type": "string", "maxLength": 5000 },
    "priority": { "type": "string", "enum": ["urgent", "high", "medium", "low", "none"] },
    "assigneeId": { "type": "string", "format": "uuid", "nullable": true },
    "labels": { "type": "array", "items": { "type": "string" } },
    "dueDate": { "type": "string", "format": "date", "nullable": true },
    "estimateHours": { "type": "number", "minimum": 0, "nullable": true }
  },
  "required": ["projectId", "title"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "taskId": { "type": "string" },
    "taskIdentifier": { "type": "string", "description": "Human-readable ID like PROJ-123" },
    "url": { "type": "string", "format": "uri" },
    "status": { "type": "string", "enum": ["created", "pending_approval", "failed"] },
    "message": { "type": "string" }
  }
}
```

#### `write_status_update`

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectId": { "type": "string", "format": "uuid" },
    "periodDays": { "type": "integer", "minimum": 1, "maximum": 90, "default": 7 },
    "audience": { "type": "string", "enum": ["team", "stakeholders", "executive"], "default": "stakeholders" },
    "includeMetrics": { "type": "boolean", "default": true }
  },
  "required": ["projectId"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "projectId": { "type": "string" },
    "statusUpdate": {
      "type": "object",
      "properties": {
        "summary": { "type": "string" },
        "highlights": { "type": "array", "items": { "type": "string" } },
        "risks": { "type": "array", "items": { "type": "string" } },
        "nextSteps": { "type": "array", "items": { "type": "string" } },
        "metrics": { "type": "object" }
      }
    },
    "draft": { "type": "boolean", "description": "Always true -- requires human review" }
  }
}
```

#### `search_workspace`

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "minLength": 2, "maxLength": 500 },
    "scope": {
      "type": "array",
      "items": { "type": "string", "enum": ["tasks", "projects", "documents", "goals", "comments"] },
      "default": ["tasks", "projects", "documents"]
    },
    "projectId": { "type": "string", "format": "uuid", "nullable": true, "description": "Limit to a specific project" },
    "limit": { "type": "integer", "minimum": 1, "maximum": 50, "default": 10 }
  },
  "required": ["query"]
}
```

---

## 4. Context Injection

### Overview

The `AIContextBuilder` is responsible for gathering relevant workspace data and injecting it into the system prompt and tool context before each LLM call. This ensures the model has accurate, up-to-date information without the frontend needing to send it.

### Context Layers

```
┌─────────────────────────────────────────────┐
│ Layer 1: System Prompt (static)             │
│ - Role definition                           │
│ - Behavioral constraints                    │
│ - Output format rules                       │
│ - Tool usage instructions                   │
├─────────────────────────────────────────────┤
│ Layer 2: Workspace Context (per-request)    │
│ - Workspace name, plan tier                 │
│ - User role, permissions                    │
│ - Current date/time, timezone               │
├─────────────────────────────────────────────┤
│ Layer 3: Page Context (per-request)         │
│ - Current page/route                        │
│ - Active project/task being viewed          │
│ - Recent user actions (last 5)              │
├─────────────────────────────────────────────┤
│ Layer 4: Relevant Data (dynamic)            │
│ - Project summary if on project page        │
│ - Task details if on task detail            │
│ - Sprint metrics if on sprint board         │
│ - Recent activity feed (last 20 events)     │
├─────────────────────────────────────────────┤
│ Layer 5: Conversation History (per-session) │
│ - Previous messages in this conversation    │
│ - Previous tool calls and results           │
└─────────────────────────────────────────────┘
```

### Context Budget Management

| Layer | Max Tokens | Strategy |
|-------|-----------|----------|
| System Prompt | 2,000 | Static, cached |
| Workspace Context | 500 | Compact format |
| Page Context | 1,500 | Summarize if needed |
| Relevant Data | 4,000 | Truncate oldest first |
| Conversation History | 8,000 | Sliding window, summarize old messages |
| **Total Budget** | **16,000** | Leaves room for model response |

### Context Builder Implementation

```csharp
public class AIContextBuilder
{
    public async Task<AIContext> BuildContextAsync(
        AIContextRequest request,
        CancellationToken ct)
    {
        var workspace = await _workspaceRepo.GetAsync(request.WorkspaceId, ct);
        var user = await _userRepo.GetAsync(request.UserId, ct);
        var permissions = await _permissionService.GetEffectivePermissionsAsync(
            request.UserId, request.WorkspaceId, ct);

        var context = new AIContext
        {
            SystemPrompt = BuildSystemPrompt(workspace, user, permissions),
            PageContext = await BuildPageContextAsync(request.PageRoute, request.EntityId, ct),
            RelevantData = await GatherRelevantDataAsync(request, ct),
            ConversationHistory = await GetConversationHistoryAsync(request.ConversationId, ct),
            AvailableTools = _toolRegistry.GetToolsForPermissions(permissions),
            TokenBudget = GetTokenBudgetForPlan(workspace.PlanTier)
        };

        return context;
    }
}
```

### Data Gathering Strategies

| Page Context | Data Gathered |
|-------------|---------------|
| Board View | Project summary, sprint info, task counts by status, recent moves |
| Task Detail | Full task with subtasks, comments (last 10), activity log (last 20) |
| Project Overview | Project health metrics, milestone status, team members, recent activity |
| Goals | Goal hierarchy, progress metrics, linked projects |
| Dashboard | Workspace-level KPIs, overdue tasks count, upcoming deadlines |
| Documents | Document metadata, folder structure (no content unless specific doc) |

### Caching Strategy

- **Workspace context**: Redis cache, 5-minute TTL
- **User permissions**: Redis cache, 1-minute TTL
- **Project summaries**: Redis cache, 2-minute TTL, invalidated on write
- **Conversation history**: Redis sorted set, 24-hour TTL
- **System prompt**: In-memory, application lifetime

---

## 5. Security

### API Key Management

```
Environment Variable: AI__Gemini__ApiKey
Storage: Azure Key Vault (production) / User Secrets (development)
Access: Only AIChatService via IOptions<AIOptions>
Rotation: Quarterly, automated via Key Vault rotation policy
```

- API keys are NEVER included in:
  - Frontend bundles
  - API responses
  - Log output
  - Error messages
  - OpenAPI spec

### Rate Limiting

| Plan Tier | Requests/min | Requests/day | Max Tokens/day | Concurrent Streams |
|-----------|-------------|-------------|---------------|-------------------|
| Free | 5 | 50 | 50,000 | 1 |
| Pro | 20 | 500 | 500,000 | 3 |
| Business | 60 | 2,000 | 2,000,000 | 10 |
| Enterprise | 120 | 10,000 | 10,000,000 | 25 |

Implementation uses `System.Threading.RateLimiting.TokenBucketRateLimiter`:

```csharp
public class AIRateLimiter
{
    private readonly ConcurrentDictionary<string, RateLimiter> _limiters = new();

    public async Task<RateLimitResult> CheckAsync(string userId, PlanTier tier)
    {
        var limiter = _limiters.GetOrAdd(
            $"{userId}:{tier}",
            _ => CreateLimiter(tier));

        using var lease = await limiter.AcquireAsync(1);
        if (!lease.IsAcquired)
        {
            return RateLimitResult.Exceeded(lease.TryGetMetadata(
                MetadataName.RetryAfter, out var retryAfter)
                ? retryAfter : TimeSpan.FromMinutes(1));
        }

        return RateLimitResult.Allowed();
    }
}
```

### Audit Logging

Every AI interaction is logged to the `ai_audit_logs` table:

```sql
CREATE TABLE ai_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    conversation_id UUID NOT NULL,
    event_type      VARCHAR(50) NOT NULL,  -- 'chat_request', 'tool_call', 'tool_result', 'approval', 'rejection'
    tool_name       VARCHAR(100),
    input_summary   JSONB,                 -- Sanitized, no PII in free text
    output_summary  JSONB,
    tokens_used     INTEGER,
    model_id        VARCHAR(100),
    latency_ms      INTEGER,
    ip_address      INET,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_audit_workspace_date ON ai_audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_ai_audit_user_date ON ai_audit_logs(user_id, created_at DESC);
```

**Audit classification levels:**
- **Standard**: Log event type, tool name, token count, latency. No input/output content.
- **Elevated**: Log event type, tool name, token count, latency, sanitized input summary, output summary.
- **Critical**: Full logging including raw input/output (for write actions that modify data).

### Human Confirmation for Write Actions

```
1. AI decides to call a write tool (e.g., create_task)
2. Backend pauses execution, stores pending invocation
3. SSE sends approval_required event to frontend:
   {
     "type": "approval_required",
     "invocationId": "uuid",
     "toolName": "create_task",
     "description": "Create task 'Design login page' in project Frontend",
     "input": { ... sanitized preview ... }
   }
4. Frontend shows confirmation dialog
5. User approves or rejects
6. POST /api/v1/ai/tools/{invocationId}/approve or /reject
7. If approved: tool executes, result returned via SSE
8. If rejected: AI informed, conversation continues
```

### Token Budget Management

```csharp
public class TokenBudgetManager
{
    public async Task<TokenBudgetStatus> GetStatusAsync(string userId, string workspaceId)
    {
        var plan = await _billingService.GetPlanAsync(workspaceId);
        var usage = await _usageRepo.GetDailyUsageAsync(userId, DateOnly.FromDateTime(DateTime.UtcNow));

        return new TokenBudgetStatus
        {
            DailyLimit = plan.AiTokensPerDay,
            Used = usage.TotalTokens,
            Remaining = Math.Max(0, plan.AiTokensPerDay - usage.TotalTokens),
            ResetsAt = DateTime.UtcNow.Date.AddDays(1)
        };
    }
}
```

---

## 6. Streaming Implementation

### SSE Endpoint

```csharp
app.MapPost("/api/v1/ai/chat", async (
    AIChatRequest request,
    AIChatService chatService,
    HttpContext httpContext,
    CancellationToken ct) =>
{
    httpContext.Response.ContentType = "text/event-stream";
    httpContext.Response.Headers.CacheControl = "no-cache";
    httpContext.Response.Headers.Connection = "keep-alive";

    await foreach (var chunk in chatService.StreamChatAsync(request, ct))
    {
        var data = JsonSerializer.Serialize(chunk);
        await httpContext.Response.WriteAsync($"data: {data}\n\n", ct);
        await httpContext.Response.Body.FlushAsync(ct);
    }

    await httpContext.Response.WriteAsync("data: [DONE]\n\n", ct);
});
```

### SSE Event Types

```typescript
// Frontend event types
type AIStreamEvent =
  | { type: "chunk"; content: string }
  | { type: "tool_call_start"; toolName: string; invocationId: string }
  | { type: "tool_call_result"; invocationId: string; result: unknown }
  | { type: "approval_required"; invocationId: string; toolName: string; description: string; input: unknown }
  | { type: "error"; code: string; message: string }
  | { type: "usage"; tokensUsed: number; tokensRemaining: number }
  | { type: "done"; conversationId: string };
```

### SignalR Fallback

For environments where SSE is blocked (corporate proxies, some hosting providers):

```csharp
public class AIChatHub : Hub
{
    public async IAsyncEnumerable<AIStreamEvent> StreamChat(
        AIChatRequest request,
        [EnumeratorCancellation] CancellationToken ct)
    {
        await foreach (var chunk in _chatService.StreamChatAsync(request, ct))
        {
            yield return chunk;
        }
    }
}
```

### Frontend Integration

```typescript
// SSE client
const startAIChat = async (message: string, conversationId?: string) => {
  const response = await fetch('/api/v1/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, conversationId, pageContext: getCurrentPageContext() }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const events = text.split('\n\n').filter(Boolean);

    for (const event of events) {
      if (event.startsWith('data: ')) {
        const data = event.slice(6);
        if (data === '[DONE]') return;
        handleStreamEvent(JSON.parse(data));
      }
    }
  }
};
```

---

## 7. Error Handling

| Error | Status Code | User Message | Recovery |
|-------|------------|-------------|---------|
| Rate limit exceeded | 429 | "You've reached your AI usage limit. Resets at {time}." | Show upgrade prompt |
| Provider timeout | 504 | "AI is taking longer than expected. Please try again." | Auto-retry once |
| Provider error | 502 | "AI service temporarily unavailable." | Retry with fallback provider |
| Invalid tool input | 400 | "I couldn't complete that action. Let me try differently." | AI self-corrects |
| Permission denied | 403 | "You don't have permission to use that tool." | Suggest requesting access |
| Token budget exceeded | 402 | "Daily AI token budget exhausted." | Show usage dashboard |
| Conversation too long | 400 | "This conversation is getting long. Start a new one for best results." | Offer to summarize and start fresh |

---

## 8. Monitoring and Observability

### Metrics (OpenTelemetry)

- `ai.chat.requests.total` -- Counter, labels: `workspace_id`, `plan_tier`
- `ai.chat.latency.ms` -- Histogram, labels: `model`, `has_tools`
- `ai.tokens.used` -- Counter, labels: `workspace_id`, `direction` (input/output)
- `ai.tool.calls.total` -- Counter, labels: `tool_name`, `approved`
- `ai.errors.total` -- Counter, labels: `error_type`
- `ai.streams.active` -- Gauge

### Health Checks

```csharp
public class AIProviderHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct)
    {
        try
        {
            var response = await _chatClient.CompleteAsync("ping", cancellationToken: ct);
            return HealthCheckResult.Healthy($"Gemini responding, latency: {sw.ElapsedMilliseconds}ms");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Gemini unavailable", ex);
        }
    }
}
```

### Alerting Rules

| Condition | Severity | Action |
|-----------|---------|--------|
| Error rate > 5% over 5 min | Warning | Slack notification |
| Error rate > 20% over 5 min | Critical | PagerDuty, auto-switch to fallback |
| P95 latency > 10s | Warning | Investigate, consider model downgrade |
| Daily token usage > 80% of budget | Info | Notify workspace admin |
| Audit log write failure | Critical | Circuit breaker, block AI requests |

---

## 9. Testing Strategy for AI Module

### Unit Tests

- Tool input validation (invalid schema, missing required fields)
- Permission checks (user without `task:create` cannot use `create_task`)
- Rate limiter behavior (allows within limit, blocks over limit, resets correctly)
- Context builder (correct data gathered per page route)
- Token budget calculations

### Integration Tests

- Full chat flow: request -> context build -> LLM call -> response stream
- Tool execution with approval gate (mock LLM, real DB)
- Rate limiting with Redis (Testcontainers)
- Audit log persistence and query

### Contract Tests

- SSE event format stability
- Tool input/output schema backward compatibility
- Error response format consistency

### Mock LLM for Testing

```csharp
public class MockChatClient : IChatClient
{
    private readonly Queue<ChatCompletion> _responses = new();

    public void EnqueueResponse(string content, IList<FunctionCallContent>? toolCalls = null)
    {
        _responses.Enqueue(new ChatCompletion(new ChatMessage(ChatRole.Assistant, content))
        {
            // Configure tool calls if needed
        });
    }

    public Task<ChatCompletion> CompleteAsync(
        IList<ChatMessage> chatMessages,
        ChatOptions? options = null,
        CancellationToken ct = default)
    {
        return Task.FromResult(_responses.Dequeue());
    }
}
```

---

## 10. Rollout Plan

### Phase 1: Read-Only Tools (Week 17)
- `summarize_project`
- `search_workspace`
- `suggest_next_steps`
- No write actions, minimal risk
- Gather usage data and feedback

### Phase 2: Analysis Tools (Week 18)
- `generate_subtasks`
- `identify_risks`
- Still read-only but more complex context
- Tune prompt quality based on Phase 1 feedback

### Phase 3: Write Tools (Week 19)
- `create_task`
- `write_status_update`
- Full approval gate active
- Elevated audit logging

### Phase 4: Optimization (Week 20)
- Prompt caching
- Response caching for repeated queries
- Context compression
- Latency optimization

---

## 11. Future Considerations

- **Custom tools per workspace**: Allow Business/Enterprise plans to define custom AI tools via a low-code interface.
- **Fine-tuning**: If usage patterns stabilize, fine-tune a smaller model on workspace-specific data for faster, cheaper responses.
- **Agent mode**: Multi-step autonomous task completion (e.g., "Set up a new sprint with tasks from the backlog") with step-by-step approval.
- **RAG over documents**: Vector embeddings for workspace documents, enabling AI to reference specific document content.
- **Multi-modal**: Screenshot analysis for bug reports, whiteboard-to-task conversion.
