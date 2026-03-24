using MediatR;

namespace LinearPrecision.Shared.Events;

// ── Identity Events ──
public record UserRegisteredEvent(Guid UserId, string Email) : INotification;
public record UserProfileUpdatedEvent(Guid UserId) : INotification;
public record UserDeactivatedEvent(Guid UserId) : INotification;

// ── Workspace Events ──
public record WorkspaceCreatedEvent(Guid WorkspaceId, Guid CreatedByUserId) : INotification;
public record WorkspaceUpdatedEvent(Guid WorkspaceId) : INotification;
public record WorkspaceDeletedEvent(Guid WorkspaceId) : INotification;

// ── Membership Events ──
public record MemberJoinedEvent(Guid WorkspaceId, Guid UserId) : INotification;
public record MemberRoleChangedEvent(Guid WorkspaceId, Guid UserId, string OldRole, string NewRole) : INotification;
public record MemberRemovedEvent(Guid WorkspaceId, Guid UserId) : INotification;
public record InvitationCreatedEvent(Guid WorkspaceId, Guid InvitationId, string Email) : INotification;
public record InvitationAcceptedEvent(Guid WorkspaceId, Guid InvitationId, Guid UserId) : INotification;
public record InvitationExpiredEvent(Guid WorkspaceId, Guid InvitationId) : INotification;

// ── Project Events ──
public record ProjectCreatedEvent(Guid ProjectId, Guid WorkspaceId) : INotification;
public record ProjectUpdatedEvent(Guid ProjectId, Guid WorkspaceId) : INotification;
public record ProjectStatusChangedEvent(Guid ProjectId, Guid WorkspaceId, string OldStatus, string NewStatus) : INotification;
public record ProjectDeletedEvent(Guid ProjectId, Guid WorkspaceId) : INotification;

// ── Task Events ──
public record TaskCreatedEvent(Guid TaskId, Guid ProjectId, Guid WorkspaceId) : INotification;
public record TaskUpdatedEvent(Guid TaskId, Guid ProjectId, Guid WorkspaceId) : INotification;
public record TaskStatusChangedEvent(Guid TaskId, Guid ProjectId, Guid WorkspaceId, string OldStatus, string NewStatus) : INotification;
public record TaskAssignedEvent(Guid TaskId, Guid WorkspaceId, Guid? OldAssigneeId, Guid? NewAssigneeId) : INotification;
public record TaskPriorityChangedEvent(Guid TaskId, Guid WorkspaceId, string OldPriority, string NewPriority) : INotification;
public record TaskMovedToSprintEvent(Guid TaskId, Guid WorkspaceId, Guid? OldSprintId, Guid NewSprintId) : INotification;
public record TaskDeletedEvent(Guid TaskId, Guid ProjectId, Guid WorkspaceId) : INotification;
public record TaskCommentAddedEvent(Guid TaskId, Guid CommentId, Guid WorkspaceId, Guid AuthorId) : INotification;

// ── Sprint Events ──
public record SprintCreatedEvent(Guid SprintId, Guid ProjectId, Guid WorkspaceId) : INotification;
public record SprintStartedEvent(Guid SprintId, Guid ProjectId, Guid WorkspaceId) : INotification;
public record SprintCompletedEvent(Guid SprintId, Guid ProjectId, Guid WorkspaceId, decimal? CompletedPoints) : INotification;

// ── Goal Events ──
public record GoalCreatedEvent(Guid GoalId, Guid WorkspaceId) : INotification;
public record GoalStatusChangedEvent(Guid GoalId, Guid WorkspaceId, string OldStatus, string NewStatus) : INotification;
public record GoalProgressUpdatedEvent(Guid GoalId, Guid WorkspaceId, decimal OldProgress, decimal NewProgress) : INotification;

// ── Document Events ──
public record DocumentCreatedEvent(Guid DocumentId, Guid WorkspaceId) : INotification;
public record DocumentUpdatedEvent(Guid DocumentId, Guid WorkspaceId) : INotification;

// ── TimeEntry Events ──
public record TimeEntryCreatedEvent(Guid TimeEntryId, Guid WorkspaceId, Guid UserId) : INotification;

// ── Automation Events ──
public record AutomationTriggeredEvent(Guid AutomationRuleId, Guid WorkspaceId, string Status) : INotification;

// ── Billing Events ──
public record SubscriptionChangedEvent(Guid WorkspaceId, Guid SubscriptionId, string OldPlan, string NewPlan) : INotification;

// ── File Events ──
public record FileUploadedEvent(Guid FileAttachmentId, Guid WorkspaceId) : INotification;

// ── AI Events ──
public record AIConversationCreatedEvent(Guid ConversationId, Guid WorkspaceId, Guid UserId) : INotification;
