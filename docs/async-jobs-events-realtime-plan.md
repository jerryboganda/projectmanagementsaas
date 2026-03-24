# Async Jobs, Domain Events, and Real-time Plan — Linear Precision PM SaaS

> **Status:** Draft v1.0
> **Last updated:** 2026-03-19
> **Owner:** Backend Architecture Team
> **Related:** `backend-architecture-master-plan.md`, `domain-model.md`, `api-integration-master-plan.md`

---

## 1. Overview

This document defines the asynchronous processing, domain event, and real-time communication architecture for Linear Precision. The system uses three complementary mechanisms:

1. **MediatR domain events** — in-process notifications for cross-module reactions.
2. **Hangfire background jobs** — durable, retryable out-of-process work.
3. **SignalR hubs** — real-time push to connected frontend clients.

**Flow pattern:**

```
User Action → Command Handler → Domain Event (MediatR INotification)
                                      ├─→ In-process handler (e.g., update counters)
                                      ├─→ Enqueue Hangfire job (e.g., send email)
                                      └─→ Push via SignalR (e.g., board update)
```

---

## 2. Domain Events (MediatR Notifications)

### 2.1 Event Infrastructure

```csharp
// LinearPrecision.Shared/Events/IDomainEvent.cs
public interface IDomainEvent : INotification
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
    Guid? ActorId { get; }
    Guid? WorkspaceId { get; }
}

// Base record for all domain events
public abstract record DomainEvent : IDomainEvent
{
    public Guid EventId { get; init; } = Guid.CreateVersion7();
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
    public Guid? ActorId { get; init; }
    public Guid? WorkspaceId { get; init; }
}
```

### 2.2 Event Dispatch

Events are dispatched from command handlers after the entity is persisted:

```csharp
// Inside CreateTaskHandler
public async Task<TaskDto> Handle(CreateTask command, CancellationToken ct)
{
    var task = new TaskItem { ... };
    _dbContext.Tasks.Add(task);
    await _dbContext.SaveChangesAsync(ct);

    // Dispatch domain event after successful persistence
    await _mediator.Publish(new TaskCreatedEvent(
        TaskId: task.Id,
        ProjectId: task.ProjectId,
        WorkspaceId: task.WorkspaceId,
        ActorId: _currentUser.UserId), ct);

    return task.ToDto();
}
```

### 2.3 Complete Event Catalog

#### Identity Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `UserRegisteredEvent` | New user registration | `UserId`, `Email`, `FullName` | Notifications (welcome email), Analytics |
| `UserProfileUpdatedEvent` | Profile edit | `UserId`, `ChangedFields` | Audit |
| `UserDeactivatedEvent` | Account deactivation | `UserId`, `DeactivatedBy` | Workspace (remove from active), Audit |
| `UserLoginEvent` | Successful login | `UserId`, `IpAddress`, `Method` | Audit |
| `PasswordChangedEvent` | Password change | `UserId` | Notifications (security alert email) |
| `TwoFactorEnabledEvent` | 2FA setup complete | `UserId` | Audit |

#### Workspace Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `WorkspaceCreatedEvent` | New workspace | `WorkspaceId`, `OwnerId`, `Name` | Billing (create free subscription), Analytics |
| `WorkspaceUpdatedEvent` | Settings change | `WorkspaceId`, `ChangedFields` | Audit |
| `WorkspaceDeletedEvent` | Soft delete | `WorkspaceId`, `DeletedBy` | Billing (cancel subscription), Cleanup jobs |
| `MemberInvitedEvent` | Invitation sent | `WorkspaceId`, `Email`, `Role`, `InvitedBy` | Notifications (invitation email) |
| `MemberJoinedEvent` | Invitation accepted | `WorkspaceId`, `UserId`, `Role` | Notifications (welcome to workspace), Analytics |
| `MemberRemovedEvent` | Member removed | `WorkspaceId`, `UserId`, `RemovedBy` | Notifications, Audit |
| `MemberRoleChangedEvent` | Role update | `WorkspaceId`, `UserId`, `OldRole`, `NewRole` | Audit, Notifications |

#### Projects Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `ProjectCreatedEvent` | New project | `ProjectId`, `WorkspaceId`, `Name` | Search (index), Analytics |
| `ProjectUpdatedEvent` | Project edit | `ProjectId`, `ChangedFields` | Search (re-index), Audit |
| `ProjectDeletedEvent` | Soft delete | `ProjectId`, `DeletedBy` | Search (remove), Audit |
| `ProjectStatusChangedEvent` | Status transition | `ProjectId`, `OldStatus`, `NewStatus` | Notifications (watchers), Analytics |
| `ProjectFavoritedEvent` | Toggle favorite | `ProjectId`, `UserId`, `IsFavorite` | — (local to user) |

#### Tasks Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `TaskCreatedEvent` | New task | `TaskId`, `ProjectId`, `WorkspaceId`, `Title` | Search, Notifications (project watchers), SignalR (BoardHub), Analytics |
| `TaskUpdatedEvent` | Task edit | `TaskId`, `ChangedFields` | Search, SignalR (BoardHub), Audit |
| `TaskStatusChangedEvent` | Status transition | `TaskId`, `ProjectId`, `OldStatus`, `NewStatus` | SignalR (BoardHub), Notifications (assignee, watchers), Analytics, Automations |
| `TaskAssignedEvent` | Assignee change | `TaskId`, `OldAssignee`, `NewAssignee` | Notifications (new assignee), SignalR (BoardHub) |
| `TaskDeletedEvent` | Soft delete | `TaskId`, `ProjectId` | Search, SignalR (BoardHub), Analytics |
| `TaskCommentAddedEvent` | New comment | `TaskId`, `CommentId`, `AuthorId` | Notifications (watchers, assignee), SignalR (BoardHub) |
| `TaskDependencyAddedEvent` | Dependency created | `FromTaskId`, `ToTaskId`, `Type` | — |
| `TaskWatcherAddedEvent` | Watcher added | `TaskId`, `UserId` | — |
| `TaskChecklistUpdatedEvent` | Checklist change | `TaskId`, `ItemId`, `IsCompleted` | SignalR (BoardHub) |

#### Goals Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `GoalCreatedEvent` | New goal | `GoalId`, `WorkspaceId`, `Title` | Search, Analytics |
| `GoalUpdatedEvent` | Goal edit | `GoalId`, `ChangedFields` | Search, Audit |
| `GoalProgressChangedEvent` | Progress update | `GoalId`, `OldProgress`, `NewProgress` | Notifications (owner), Analytics |
| `InitiativeCreatedEvent` | New initiative | `InitiativeId`, `GoalId` | Analytics |

#### Sprints Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `SprintCreatedEvent` | New sprint | `SprintId`, `ProjectId` | Analytics |
| `SprintStartedEvent` | Sprint start | `SprintId`, `ProjectId`, `StartDate`, `EndDate` | Notifications (team), Analytics |
| `SprintCompletedEvent` | Sprint complete | `SprintId`, `CompletedPoints`, `PlannedPoints` | Analytics (velocity), Notifications |

#### Calendar Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `CalendarItemCreatedEvent` | New event | `ItemId`, `OwnerId`, `StartTime` | Notifications (reminders) |
| `CalendarItemUpdatedEvent` | Event edit | `ItemId`, `ChangedFields` | Notifications (if time changed) |

#### Documents Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `DocumentCreatedEvent` | New document | `DocumentId`, `ProjectId` | Search |
| `DocumentUpdatedEvent` | Document edit | `DocumentId`, `UpdatedBy` | Search (re-index) |
| `DocumentDeletedEvent` | Soft delete | `DocumentId` | Search (remove) |

#### TimeTracking Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `TimeEntryCreatedEvent` | Time logged | `EntryId`, `UserId`, `TaskId`, `Duration` | Analytics |
| `TimerStartedEvent` | Timer start | `EntryId`, `UserId` | SignalR (PresenceHub) |
| `TimerStoppedEvent` | Timer stop | `EntryId`, `UserId`, `Duration` | Analytics |

#### Intake Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `RequestSubmittedEvent` | New submission | `SubmissionId`, `FormId`, `WorkspaceId` | Notifications (form owners) |
| `RequestConvertedToTaskEvent` | Conversion | `SubmissionId`, `TaskId` | Notifications (submitter if tracked) |

#### Automations Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `AutomationTriggeredEvent` | Rule matched | `RuleId`, `TriggerTaskId` | Audit |
| `AutomationExecutedEvent` | Action completed | `RuleId`, `LogId`, `Status` | Analytics |

#### Billing Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `SubscriptionCreatedEvent` | New subscription | `SubscriptionId`, `WorkspaceId`, `PlanId` | Feature flags (update entitlements) |
| `SubscriptionChangedEvent` | Plan change | `SubscriptionId`, `OldPlanId`, `NewPlanId` | Feature flags, Notifications (admin) |
| `SubscriptionCancelledEvent` | Cancellation | `SubscriptionId`, `WorkspaceId` | Notifications (admin), Workspace (grace period) |
| `PaymentFailedEvent` | Payment failure | `SubscriptionId`, `WorkspaceId` | Notifications (owner), Workspace (dunning) |

#### Notifications Module Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `NotificationCreatedEvent` | New notification | `NotificationId`, `RecipientId` | SignalR (NotificationHub) |

---

## 3. Event Handler Patterns

### 3.1 Synchronous In-Process Handler

For fast, critical reactions (e.g., updating cached counters):

```csharp
public class UpdateProjectTaskCountHandler : INotificationHandler<TaskCreatedEvent>
{
    private readonly AppDbContext _db;

    public async Task Handle(TaskCreatedEvent evt, CancellationToken ct)
    {
        await _db.Projects
            .Where(p => p.Id == evt.ProjectId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.TaskCount, p => p.TaskCount + 1), ct);
    }
}
```

### 3.2 Enqueue Background Job Handler

For expensive or unreliable work (e.g., email, search indexing):

```csharp
public class EnqueueTaskCreatedJobsHandler : INotificationHandler<TaskCreatedEvent>
{
    private readonly IBackgroundJobClient _jobs;

    public Task Handle(TaskCreatedEvent evt, CancellationToken ct)
    {
        // Enqueue search indexing (fire-and-forget)
        _jobs.Enqueue<SearchIndexJob>(j => j.IndexTask(evt.TaskId));

        // Enqueue notification dispatch
        _jobs.Enqueue<NotificationDispatchJob>(j =>
            j.NotifyProjectWatchers(evt.ProjectId, evt.TaskId, "TaskCreated"));

        return Task.CompletedTask;
    }
}
```

### 3.3 SignalR Push Handler

For real-time UI updates:

```csharp
public class BroadcastTaskStatusChangeHandler : INotificationHandler<TaskStatusChangedEvent>
{
    private readonly IHubContext<BoardHub> _boardHub;

    public async Task Handle(TaskStatusChangedEvent evt, CancellationToken ct)
    {
        await _boardHub.Clients
            .Group($"project:{evt.ProjectId}")
            .SendAsync("TaskStatusChanged", new
            {
                evt.TaskId,
                evt.OldStatus,
                evt.NewStatus,
                evt.ActorId,
                evt.OccurredAt
            }, ct);
    }
}
```

---

## 4. Hangfire Background Jobs

### 4.1 Job Infrastructure

```csharp
// Worker/Program.cs
builder.Services.AddHangfire(config => config
    .UsePostgreSqlStorage(o =>
        o.UseNpgsqlConnection(connectionString))
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings());

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = Environment.ProcessorCount * 2;
    options.Queues = new[] { "critical", "default", "low" };
});
```

### 4.2 Complete Job Catalog

#### Critical Queue

| Job | Type | Trigger | Retry | Description |
|-----|------|---------|-------|-------------|
| `EmailDispatchJob` | Fire-and-forget | Domain events | 3 retries, exponential backoff | Send transactional emails via MailKit |
| `StripeWebhookProcessingJob` | Fire-and-forget | Stripe webhook | 5 retries | Process Stripe events (payment, subscription changes) |
| `AutomationExecutionJob` | Fire-and-forget | `TaskStatusChangedEvent`, etc. | 2 retries | Evaluate and execute automation rules |

#### Default Queue

| Job | Type | Trigger | Retry | Description |
|-----|------|---------|-------|-------------|
| `SearchIndexJob` | Fire-and-forget | Entity created/updated/deleted events | 3 retries | Update full-text search index (PG tsvector or Meilisearch) |
| `NotificationDispatchJob` | Fire-and-forget | Various domain events | 2 retries | Create in-app notifications, push via SignalR |
| `ReportGenerationJob` | Fire-and-forget | User requests export | 1 retry | Generate PDF/CSV reports via QuestPDF |
| `InvitationExpiryJob` | Recurring (hourly) | Cron schedule | 1 retry | Expire invitations past their expiry date |
| `SprintAutoCompleteJob` | Recurring (daily 00:00 UTC) | Cron schedule | 1 retry | Auto-complete sprints past their end date |

#### Low Queue

| Job | Type | Trigger | Retry | Description |
|-----|------|---------|-------|-------------|
| `UsageAggregationJob` | Recurring (daily 02:00 UTC) | Cron schedule | 2 retries | Aggregate workspace usage metrics for billing |
| `CleanupJob` | Recurring (daily 03:00 UTC) | Cron schedule | 1 retry | Purge expired tokens, old audit logs (>1 year), orphaned files |
| `EmailDigestJob` | Recurring (daily 08:00 UTC) | Cron schedule | 1 retry | Send daily/weekly email digests per user preferences |
| `AnalyticsSnapshotJob` | Recurring (daily 01:00 UTC) | Cron schedule | 1 retry | Snapshot velocity, burndown data for historical charts |

### 4.3 Job Implementation Pattern

```csharp
public class EmailDispatchJob
{
    private readonly IEmailService _email;
    private readonly ILogger<EmailDispatchJob> _logger;

    public EmailDispatchJob(IEmailService email, ILogger<EmailDispatchJob> logger)
    {
        _email = email;
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 10, 60, 300 })]
    [Queue("critical")]
    public async Task SendAsync(EmailMessage message)
    {
        _logger.LogInformation("Sending email to {Recipient}: {Subject}",
            message.To, message.Subject);

        await _email.SendAsync(message);

        _logger.LogInformation("Email sent successfully to {Recipient}", message.To);
    }
}
```

### 4.4 Recurring Job Registration

```csharp
// Registered in Program.cs or a startup filter
public static class RecurringJobRegistration
{
    public static void RegisterRecurringJobs(this IApplicationBuilder app)
    {
        RecurringJob.AddOrUpdate<InvitationExpiryJob>(
            "invitation-expiry",
            j => j.ExpireInvitationsAsync(),
            Cron.Hourly,
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        RecurringJob.AddOrUpdate<SprintAutoCompleteJob>(
            "sprint-auto-complete",
            j => j.AutoCompleteSprintsAsync(),
            Cron.Daily(0, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        RecurringJob.AddOrUpdate<UsageAggregationJob>(
            "usage-aggregation",
            j => j.AggregateUsageAsync(),
            Cron.Daily(2, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        RecurringJob.AddOrUpdate<CleanupJob>(
            "cleanup",
            j => j.CleanupAsync(),
            Cron.Daily(3, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        RecurringJob.AddOrUpdate<EmailDigestJob>(
            "email-digest",
            j => j.SendDigestsAsync(),
            Cron.Daily(8, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        RecurringJob.AddOrUpdate<AnalyticsSnapshotJob>(
            "analytics-snapshot",
            j => j.SnapshotAsync(),
            Cron.Daily(1, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });
    }
}
```

### 4.5 Hangfire Dashboard Access

```csharp
app.MapHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[]
    {
        new HangfireDashboardAuthFilter(requiredRoles: new[] { "Owner", "Admin" })
    },
    DashboardTitle = "Linear Precision — Background Jobs",
    StatsPollingInterval = 5000,
    DisplayStorageConnectionString = false
});
```

---

## 5. SignalR Real-Time Hubs

### 5.1 Hub Infrastructure

```csharp
// Program.cs
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.MaximumReceiveMessageSize = 64 * 1024; // 64 KB
})
.AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis")!, options =>
{
    options.Configuration.ChannelPrefix = RedisChannel.Literal("lp-signalr");
});

// Endpoint mapping
app.MapHub<BoardHub>("/hubs/board");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<PresenceHub>("/hubs/presence");
app.MapHub<AIStreamHub>("/hubs/ai");
```

### 5.2 BoardHub

**Path:** `/hubs/board`
**Purpose:** Real-time Kanban board updates, task changes, sprint board.

```csharp
[Authorize(Policy = "WorkspaceMember")]
public class BoardHub : Hub
{
    private readonly ITenantContext _tenant;

    public BoardHub(ITenantContext tenant)
    {
        _tenant = tenant;
    }

    // Client joins a project's board channel
    public async Task JoinProject(Guid projectId)
    {
        var group = $"project:{projectId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, group);
        await Clients.Group(group).SendAsync("UserJoinedBoard", new
        {
            UserId = Context.UserIdentifier,
            ProjectId = projectId,
            JoinedAt = DateTime.UtcNow
        });
    }

    public async Task LeaveProject(Guid projectId)
    {
        var group = $"project:{projectId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
        await Clients.Group(group).SendAsync("UserLeftBoard", new
        {
            UserId = Context.UserIdentifier,
            ProjectId = projectId
        });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up: remove from all project groups
        await base.OnDisconnectedAsync(exception);
    }
}
```

**Server-to-client events:**

| Event | Payload | Trigger |
|-------|---------|---------|
| `TaskCreated` | `{ taskId, projectId, title, status, assigneeId }` | New task in project |
| `TaskUpdated` | `{ taskId, changedFields }` | Task field edit |
| `TaskStatusChanged` | `{ taskId, oldStatus, newStatus, actorId }` | Status/column move |
| `TaskDeleted` | `{ taskId, projectId }` | Task soft-deleted |
| `TaskAssigned` | `{ taskId, oldAssignee, newAssignee }` | Assignee changed |
| `TaskCommentAdded` | `{ taskId, commentId, authorId, preview }` | New comment |
| `TaskChecklistUpdated` | `{ taskId, itemId, isCompleted }` | Checklist toggle |
| `UserJoinedBoard` | `{ userId, projectId, joinedAt }` | User opened board |
| `UserLeftBoard` | `{ userId, projectId }` | User left board |

---

### 5.3 NotificationHub

**Path:** `/hubs/notifications`
**Purpose:** Real-time notification delivery, unread count updates.

```csharp
[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // Each user gets their own group for targeted notifications
        var userId = Context.UserIdentifier!;
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
        await base.OnConnectedAsync();
    }

    // Client acknowledges notification to sync state
    public async Task MarkRead(Guid notificationId)
    {
        // Delegate to mediator command — hub is just a transport
        var mediator = Context.GetHttpContext()!
            .RequestServices.GetRequiredService<IMediator>();
        await mediator.Send(new MarkNotificationRead(notificationId));
    }
}
```

**Server-to-client events:**

| Event | Payload | Trigger |
|-------|---------|---------|
| `NewNotification` | `{ id, type, title, body, resourceType, resourceId, createdAt }` | Any notification created for this user |
| `UnreadCountChanged` | `{ count }` | Notification read/created |
| `NotificationsBatchRead` | `{ count }` | Mark-all-read action |

---

### 5.4 PresenceHub

**Path:** `/hubs/presence`
**Purpose:** Online/offline status, document editing presence.

```csharp
[Authorize(Policy = "WorkspaceMember")]
public class PresenceHub : Hub
{
    private readonly IConnectionMultiplexer _redis;

    public PresenceHub(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier!;
        var workspaceId = Context.GetHttpContext()!
            .Request.Headers["X-Workspace-Id"].ToString();

        // Set presence in Redis with 5-minute TTL (heartbeat extends)
        var db = _redis.GetDatabase();
        await db.StringSetAsync(
            $"presence:{workspaceId}:{userId}",
            DateTime.UtcNow.ToString("O"),
            TimeSpan.FromMinutes(5));

        await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace:{workspaceId}");
        await Clients.Group($"workspace:{workspaceId}")
            .SendAsync("UserOnline", new { UserId = userId });

        await base.OnConnectedAsync();
    }

    // Heartbeat to keep presence alive
    public async Task Heartbeat()
    {
        var userId = Context.UserIdentifier!;
        var workspaceId = Context.GetHttpContext()!
            .Request.Headers["X-Workspace-Id"].ToString();

        var db = _redis.GetDatabase();
        await db.StringSetAsync(
            $"presence:{workspaceId}:{userId}",
            DateTime.UtcNow.ToString("O"),
            TimeSpan.FromMinutes(5));
    }

    // Document editing presence
    public async Task JoinDocument(Guid documentId)
    {
        var group = $"document:{documentId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, group);
        await Clients.Group(group).SendAsync("UserJoinedDocument", new
        {
            UserId = Context.UserIdentifier,
            DocumentId = documentId
        });
    }

    public async Task LeaveDocument(Guid documentId)
    {
        var group = $"document:{documentId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
        await Clients.Group(group).SendAsync("UserLeftDocument", new
        {
            UserId = Context.UserIdentifier,
            DocumentId = documentId
        });
    }

    // Cursor position for collaborative editing
    public async Task UpdateCursor(Guid documentId, int position, int selectionLength)
    {
        await Clients.Group($"document:{documentId}")
            .SendAsync("CursorMoved", new
            {
                UserId = Context.UserIdentifier,
                Position = position,
                SelectionLength = selectionLength
            });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier!;
        var workspaceId = Context.GetHttpContext()!
            .Request.Headers["X-Workspace-Id"].ToString();

        var db = _redis.GetDatabase();
        await db.KeyDeleteAsync($"presence:{workspaceId}:{userId}");

        await Clients.Group($"workspace:{workspaceId}")
            .SendAsync("UserOffline", new { UserId = userId });

        await base.OnDisconnectedAsync(exception);
    }
}
```

**Server-to-client events:**

| Event | Payload | Trigger |
|-------|---------|---------|
| `UserOnline` | `{ userId }` | User connects |
| `UserOffline` | `{ userId }` | User disconnects |
| `UserJoinedDocument` | `{ userId, documentId }` | User opens document |
| `UserLeftDocument` | `{ userId, documentId }` | User closes document |
| `CursorMoved` | `{ userId, position, selectionLength }` | User moves cursor |

---

### 5.5 AIStreamHub

**Path:** `/hubs/ai`
**Purpose:** Streaming AI responses token-by-token.

```csharp
[Authorize(Policy = "WorkspaceMember")]
public class AIStreamHub : Hub
{
    // No client-to-server methods — AI messages are sent via REST API
    // The AI handler streams responses back through this hub

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier!;
        await Groups.AddToGroupAsync(Context.ConnectionId, $"ai:{userId}");
        await base.OnConnectedAsync();
    }
}
```

**Server-to-client events (pushed by AI message handler):**

| Event | Payload | Trigger |
|-------|---------|---------|
| `StreamStart` | `{ conversationId, messageId }` | AI starts generating |
| `StreamToken` | `{ conversationId, messageId, token }` | Each token of response |
| `StreamComplete` | `{ conversationId, messageId, fullContent, tokensUsed }` | AI finished |
| `StreamError` | `{ conversationId, error }` | AI generation failed |
| `ToolInvocation` | `{ conversationId, toolName, status, result }` | AI called a tool |

**Streaming implementation:**

```csharp
public class AIMessageHandler : IRequestHandler<SendAIMessage, AIMessageDto>
{
    private readonly IHubContext<AIStreamHub> _aiHub;
    private readonly IChatClient _chatClient;

    public async Task<AIMessageDto> Handle(SendAIMessage cmd, CancellationToken ct)
    {
        var userGroup = $"ai:{cmd.UserId}";

        await _aiHub.Clients.Group(userGroup)
            .SendAsync("StreamStart", new { cmd.ConversationId, MessageId = messageId }, ct);

        var fullContent = new StringBuilder();

        await foreach (var update in _chatClient.GetStreamingChatCompletionAsync(messages, ct))
        {
            if (update.ContentUpdate is { Length: > 0 })
            {
                fullContent.Append(update.ContentUpdate);
                await _aiHub.Clients.Group(userGroup)
                    .SendAsync("StreamToken", new
                    {
                        cmd.ConversationId,
                        MessageId = messageId,
                        Token = update.ContentUpdate
                    }, ct);
            }
        }

        await _aiHub.Clients.Group(userGroup)
            .SendAsync("StreamComplete", new
            {
                cmd.ConversationId,
                MessageId = messageId,
                FullContent = fullContent.ToString(),
                TokensUsed = totalTokens
            }, ct);

        return messageDto;
    }
}
```

---

## 6. Frontend SignalR Integration

### 6.1 Connection Manager

```typescript
// lib/signalr.ts
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';

class SignalRManager {
  private connections = new Map<string, HubConnection>();

  async connect(hubName: string, accessToken: string, workspaceId: string): Promise<HubConnection> {
    if (this.connections.has(hubName)) {
      return this.connections.get(hubName)!;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL}/hubs/${hubName}`, {
        accessTokenFactory: () => accessToken,
        headers: { 'X-Workspace-Id': workspaceId },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onreconnecting(() => console.warn(`SignalR reconnecting: ${hubName}`));
    connection.onreconnected(() => console.log(`SignalR reconnected: ${hubName}`));
    connection.onclose(() => this.connections.delete(hubName));

    await connection.start();
    this.connections.set(hubName, connection);
    return connection;
  }

  async disconnect(hubName: string): Promise<void> {
    const connection = this.connections.get(hubName);
    if (connection) {
      await connection.stop();
      this.connections.delete(hubName);
    }
  }

  disconnectAll(): void {
    this.connections.forEach(c => c.stop());
    this.connections.clear();
  }
}

export const signalR = new SignalRManager();
```

### 6.2 React Hook Pattern

```typescript
// hooks/use-board-hub.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signalR } from '@/lib/signalr';
import { queryKeys } from '@/lib/query-keys';

export function useBoardHub(projectId: string, accessToken: string, workspaceId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let connection: HubConnection;

    async function setup() {
      connection = await signalR.connect('board', accessToken, workspaceId);
      await connection.invoke('JoinProject', projectId);

      connection.on('TaskStatusChanged', (data) => {
        // Update query cache optimistically
        queryClient.setQueryData(
          queryKeys.tasks.list(workspaceId, { projectId }),
          (old: Task[]) => old?.map(t =>
            t.id === data.taskId ? { ...t, status: data.newStatus } : t
          )
        );
      });

      connection.on('TaskCreated', (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.list(workspaceId, { projectId })
        });
      });

      connection.on('TaskDeleted', (data) => {
        queryClient.setQueryData(
          queryKeys.tasks.list(workspaceId, { projectId }),
          (old: Task[]) => old?.filter(t => t.id !== data.taskId)
        );
      });
    }

    setup();

    return () => {
      connection?.invoke('LeaveProject', projectId);
    };
  }, [projectId, accessToken, workspaceId, queryClient]);
}
```

---

## 7. Redis Pub/Sub Topology

SignalR Redis backplane uses pub/sub channels for multi-instance message routing:

| Channel Pattern | Purpose |
|----------------|---------|
| `lp-signalr:board:*` | Board hub messages |
| `lp-signalr:notifications:*` | Notification hub messages |
| `lp-signalr:presence:*` | Presence hub messages |
| `lp-signalr:ai:*` | AI stream hub messages |

**Presence state keys:**

| Key Pattern | Value | TTL |
|------------|-------|-----|
| `presence:{workspaceId}:{userId}` | ISO 8601 timestamp | 5 min (heartbeat) |
| `timer:{workspaceId}:{userId}` | `{ taskId, startedAt }` | 24 hours |

---

## 8. Error Handling and Resilience

### 8.1 Event Handler Failure Policy

| Handler Type | Failure Impact | Mitigation |
|-------------|---------------|------------|
| In-process (counter update) | Stale count until next recalculation | Eventual consistency; periodic reconciliation job |
| Hangfire job | Job in failed state | Automatic retry with backoff; Hangfire dashboard alerts |
| SignalR push | Client misses update | Client reconnect triggers query invalidation; stale query data until refetch |

### 8.2 Hangfire Retry Configuration

```csharp
// Global default
GlobalJobFilters.Filters.Add(new AutomaticRetryAttribute
{
    Attempts = 3,
    DelaysInSeconds = new[] { 30, 120, 600 }, // 30s, 2min, 10min
    OnAttemptsExceeded = AttemptsExceededAction.Fail
});
```

### 8.3 Circuit Breaker for External Services

```csharp
// Email service circuit breaker
builder.Services.AddHttpClient<IEmailService, SmtpEmailService>()
    .AddTransientHttpErrorPolicy(policy => policy
        .CircuitBreakerAsync(5, TimeSpan.FromMinutes(1)));
```

---

## 9. Automation Engine

### 9.1 Event-Driven Automation

Automations are triggered by domain events and executed via Hangfire:

```csharp
public class AutomationTriggerHandler : INotificationHandler<TaskStatusChangedEvent>
{
    private readonly AppDbContext _db;
    private readonly IBackgroundJobClient _jobs;

    public async Task Handle(TaskStatusChangedEvent evt, CancellationToken ct)
    {
        // Find matching automation rules
        var rules = await _db.AutomationRules
            .Where(r => r.WorkspaceId == evt.WorkspaceId
                     && r.IsEnabled
                     && r.TriggerType == "TaskStatusChanged")
            .ToListAsync(ct);

        foreach (var rule in rules)
        {
            // Check if trigger condition matches
            if (EvaluateTriggerCondition(rule.TriggerCondition, evt))
            {
                _jobs.Enqueue<AutomationExecutionJob>(
                    j => j.ExecuteAsync(rule.Id, evt.TaskId));
            }
        }
    }

    private bool EvaluateTriggerCondition(JsonDocument? condition, TaskStatusChangedEvent evt)
    {
        if (condition is null) return true; // No condition = always match

        var root = condition.RootElement;
        if (root.TryGetProperty("fromStatus", out var from) &&
            from.GetString() != evt.OldStatus)
            return false;
        if (root.TryGetProperty("toStatus", out var to) &&
            to.GetString() != evt.NewStatus)
            return false;

        return true;
    }
}
```

### 9.2 Supported Trigger Types

| Trigger Type | Source Event | Example Condition |
|-------------|-------------|-------------------|
| `TaskCreated` | `TaskCreatedEvent` | `{ projectId: "..." }` |
| `TaskStatusChanged` | `TaskStatusChangedEvent` | `{ fromStatus: "InProgress", toStatus: "Done" }` |
| `TaskAssigned` | `TaskAssignedEvent` | `{ toAssignee: "..." }` |
| `SprintStarted` | `SprintStartedEvent` | `{ projectId: "..." }` |
| `SprintCompleted` | `SprintCompletedEvent` | `{ projectId: "..." }` |
| `RequestSubmitted` | `RequestSubmittedEvent` | `{ formId: "..." }` |

### 9.3 Supported Action Types

| Action Type | Implementation | Example Config |
|-------------|---------------|----------------|
| `SetStatus` | Update task status | `{ status: "InReview" }` |
| `SetAssignee` | Assign user to task | `{ assigneeId: "..." }` |
| `AddLabel` | Add label to task | `{ label: "reviewed" }` |
| `CreateTask` | Create a new task | `{ projectId, title, status }` |
| `SendNotification` | Push notification | `{ recipientId, message }` |
| `MoveToSprint` | Assign task to sprint | `{ sprintId: "..." }` |
| `Webhook` | HTTP POST to external URL | `{ url, headers, bodyTemplate }` |

---

## 10. Monitoring and Observability

### 10.1 Metrics to Track

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| Event dispatch latency | OpenTelemetry span on `MediatR.Publish` | > 100ms |
| Hangfire failed jobs | Hangfire dashboard / PostgreSQL query | > 0 (critical queue) |
| Hangfire queue depth | Hangfire storage query | > 100 (default queue) |
| SignalR connected clients | `HubLifetimeManager` metric | — (informational) |
| SignalR message rate | Custom counter per hub | — (capacity planning) |
| Redis pub/sub latency | StackExchange.Redis profiling | > 10ms |
| Automation execution time | `AutomationLog.DurationMs` | > 5000ms |
| Email delivery rate | MailKit response tracking | < 95% success |
