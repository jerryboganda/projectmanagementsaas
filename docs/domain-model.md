# Domain Model — Linear Precision PM SaaS

## 1. Base Types

All entities extend one of these base types:

```csharp
// Global entity — no tenant scoping
public abstract class BaseEntity
{
    public Guid Id { get; set; }          // UUID v7 for time-ordered keys
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Tenant-scoped entity — all queries filtered by WorkspaceId
public abstract class TenantEntity : BaseEntity
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;
}

// Soft-deletable marker
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
    Guid? DeletedBy { get; set; }
}

// Audit trail marker
public interface IAuditable
{
    Guid? CreatedBy { get; set; }
    Guid? UpdatedBy { get; set; }
}
```

---

## 2. Entity Inventory

### 2.1 User

**Module:** Identity  
**Base:** `BaseEntity` (global — not tenant-scoped)  
**Extends:** `IdentityUser<Guid>`

```csharp
public class User : IdentityUser<Guid>, IAuditable
{
    // Identity fields inherited: Id, Email, UserName, PasswordHash, etc.

    // Profile
    public string FullName { get; set; } = string.Empty;          // Required, max 200
    public string? DisplayName { get; set; }                       // Optional, max 100
    public string? AvatarUrl { get; set; }                         // Optional, URL
    public string? Timezone { get; set; }                          // IANA timezone, e.g. "America/New_York"
    public string? Locale { get; set; }                            // e.g. "en-US"
    public string? JobTitle { get; set; }                          // Optional, max 100

    // Status
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public string? LastLoginIp { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<Membership> Memberships { get; set; } = [];
    public ICollection<TaskComment> Comments { get; set; } = [];
    public ICollection<TimeEntry> TimeEntries { get; set; } = [];
}
```

**Validation rules:**
- `FullName`: required, 1-200 chars
- `Email`: required, valid email format, unique
- `DisplayName`: optional, max 100 chars
- `Timezone`: valid IANA timezone if provided

**Indexes:**
- `IX_Users_Email` (unique)
- `IX_Users_UserName` (unique)
- `IX_Users_IsActive`

**Lifecycle:** Active → Deactivated (soft, `IsActive = false`)

**Events triggered:**
- `UserRegisteredEvent`
- `UserProfileUpdatedEvent`
- `UserDeactivatedEvent`

---

### 2.2 Workspace

**Module:** Workspace  
**Base:** `BaseEntity` (top-level tenant entity)

```csharp
public class Workspace : BaseEntity, ISoftDeletable, IAuditable
{
    public string Name { get; set; } = string.Empty;              // Required, max 200
    public string Slug { get; set; } = string.Empty;              // Required, unique, URL-safe
    public string? Description { get; set; }                       // Optional, max 1000
    public string? LogoUrl { get; set; }                           // Optional
    public string? Domain { get; set; }                            // Custom domain for SSO
    public JsonDocument? Settings { get; set; }                    // JSONB for flexible settings

    // Billing
    public Guid? SubscriptionId { get; set; }
    public Subscription? Subscription { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<Membership> Memberships { get; set; } = [];
    public ICollection<Project> Projects { get; set; } = [];
    public ICollection<Invitation> Invitations { get; set; } = [];
    public ICollection<Goal> Goals { get; set; } = [];
}
```

**Validation rules:**
- `Name`: required, 1-200 chars
- `Slug`: required, 2-50 chars, `^[a-z0-9-]+$`, unique

**Indexes:**
- `IX_Workspaces_Slug` (unique)
- `IX_Workspaces_IsDeleted`

**Lifecycle:** Active → Suspended (billing) → Deleted (soft)

**Events triggered:**
- `WorkspaceCreatedEvent`
- `WorkspaceUpdatedEvent`
- `WorkspaceDeletedEvent`

---

### 2.3 Membership

**Module:** Workspace  
**Base:** `TenantEntity`

```csharp
public class Membership : TenantEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public MembershipRole Role { get; set; } = MembershipRole.Member;

    public bool IsActive { get; set; } = true;
    public DateTime? JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }

    // Workspace-specific profile overrides
    public string? WorkspaceDisplayName { get; set; }              // Optional override
    public string? WorkspaceAvatarUrl { get; set; }                // Optional override
}

public enum MembershipRole
{
    Owner,
    Admin,
    Member,
    Guest
}
```

**Validation rules:**
- `UserId` + `WorkspaceId`: unique composite
- `Role`: valid enum value
- Every workspace must have at least one Owner

**Indexes:**
- `IX_Memberships_WorkspaceId_UserId` (unique composite)
- `IX_Memberships_UserId` (for "my workspaces" queries)
- `IX_Memberships_WorkspaceId_Role`

**Lifecycle:** Active → Left (`LeftAt` set, `IsActive = false`)

**Events triggered:**
- `MemberJoinedEvent`
- `MemberRoleChangedEvent`
- `MemberRemovedEvent`

---

### 2.4 Invitation

**Module:** Workspace  
**Base:** `TenantEntity`

```csharp
public class Invitation : TenantEntity
{
    public string Email { get; set; } = string.Empty;             // Required
    public MembershipRole Role { get; set; } = MembershipRole.Member;
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    public Guid InvitedBy { get; set; }
    public User InvitedByUser { get; set; } = null!;

    public string Token { get; set; } = string.Empty;             // Unique, URL-safe
    public DateTime ExpiresAt { get; set; }

    // Optionally scoped to specific projects (for Guest role)
    public List<Guid>? ProjectIds { get; set; }                   // JSONB
}

public enum InvitationStatus
{
    Pending,
    Accepted,
    Declined,
    Expired,
    Revoked
}
```

**Validation rules:**
- `Email`: required, valid email
- `ExpiresAt`: must be in the future on creation
- `Token`: auto-generated, unique

**Indexes:**
- `IX_Invitations_Token` (unique)
- `IX_Invitations_WorkspaceId_Email`
- `IX_Invitations_Status_ExpiresAt`

**Lifecycle:** Pending → Accepted | Declined | Expired | Revoked

**Events triggered:**
- `InvitationCreatedEvent`
- `InvitationAcceptedEvent`
- `InvitationExpiredEvent`

---

### 2.5 Project

**Module:** Projects  
**Base:** `TenantEntity`

```csharp
public class Project : TenantEntity, ISoftDeletable, IAuditable
{
    public string Name { get; set; } = string.Empty;              // Required, max 200
    public string? Description { get; set; }                       // Optional, max 5000
    public string Identifier { get; set; } = string.Empty;        // e.g. "PRJ", unique per workspace
    public string? Color { get; set; }                             // Hex color
    public string? IconUrl { get; set; }

    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public ProjectVisibility Visibility { get; set; } = ProjectVisibility.Workspace;

    public Guid? LeadId { get; set; }                             // Project lead
    public User? Lead { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? TargetDate { get; set; }

    public int SortOrder { get; set; }

    // Flexible metadata
    public JsonDocument? Metadata { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<TaskItem> Tasks { get; set; } = [];
    public ICollection<Sprint> Sprints { get; set; } = [];
    public ICollection<Document> Documents { get; set; } = [];
    public ICollection<ProjectFavorite> Favorites { get; set; } = [];
    public ICollection<GoalProjectLink> GoalLinks { get; set; } = [];
}

public enum ProjectStatus { Active, Paused, Completed, Archived }
public enum ProjectVisibility { Workspace, Private, Public }
```

**Validation rules:**
- `Name`: required, 1-200 chars
- `Identifier`: required, 2-10 uppercase alphanumeric, unique per workspace
- `Color`: valid hex color if provided
- `StartDate` < `TargetDate` if both provided

**Indexes:**
- `IX_Projects_WorkspaceId_Identifier` (unique composite)
- `IX_Projects_WorkspaceId_Status`
- `IX_Projects_LeadId`
- `IX_Projects_IsDeleted`

**Lifecycle:** Active → Paused → Completed → Archived → Deleted (soft)

**Events triggered:**
- `ProjectCreatedEvent`
- `ProjectUpdatedEvent`
- `ProjectStatusChangedEvent`
- `ProjectDeletedEvent`

---

### 2.6 ProjectFavorite

**Module:** Projects  
**Base:** `TenantEntity`

```csharp
public class ProjectFavorite : TenantEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public int SortOrder { get; set; }
}
```

**Validation rules:**
- `ProjectId` + `UserId` + `WorkspaceId`: unique composite

**Indexes:**
- `IX_ProjectFavorites_UserId_WorkspaceId` (for sidebar listing)
- `IX_ProjectFavorites_ProjectId_UserId` (unique composite)

---

### 2.7 TaskItem

**Module:** Tasks  
**Base:** `TenantEntity`  
**Note:** Named `TaskItem` to avoid collision with `System.Threading.Tasks.Task`.

```csharp
public class TaskItem : TenantEntity, ISoftDeletable, IAuditable
{
    public string Title { get; set; } = string.Empty;             // Required, max 500
    public string? Description { get; set; }                       // Rich text / markdown, max 50000
    public string Identifier { get; set; } = string.Empty;        // e.g. "PRJ-42", auto-generated

    // Classification
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Backlog;
    public TaskPriority Priority { get; set; } = TaskPriority.None;
    public string? TaskType { get; set; }                          // "Bug", "Feature", "Chore", etc.
    public List<string> Labels { get; set; } = [];                 // JSONB string array

    // Hierarchy
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid? ParentTaskId { get; set; }                       // Sub-task support
    public TaskItem? ParentTask { get; set; }

    // Assignment
    public Guid? AssigneeId { get; set; }
    public User? Assignee { get; set; }
    public Guid? CreatorId { get; set; }
    public User? Creator { get; set; }

    // Scheduling
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Estimation
    public decimal? EstimatePoints { get; set; }                  // Story points
    public decimal? EstimateHours { get; set; }

    // Sprint
    public Guid? SprintId { get; set; }
    public Sprint? Sprint { get; set; }

    // Board position
    public int SortOrder { get; set; }

    // Flexible metadata
    public JsonDocument? CustomFields { get; set; }               // JSONB

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<TaskComment> Comments { get; set; } = [];
    public ICollection<TaskChecklistItem> ChecklistItems { get; set; } = [];
    public ICollection<TaskWatcher> Watchers { get; set; } = [];
    public ICollection<TaskDependency> DependsOn { get; set; } = [];
    public ICollection<TaskDependency> DependedOnBy { get; set; } = [];
    public ICollection<TaskAttachment> Attachments { get; set; } = [];
    public ICollection<TaskItem> SubTasks { get; set; } = [];
    public ICollection<TimeEntry> TimeEntries { get; set; } = [];
}

public enum TaskItemStatus
{
    Backlog,
    Todo,
    InProgress,
    InReview,
    Done,
    Cancelled
}

public enum TaskPriority
{
    None,
    Low,
    Medium,
    High,
    Urgent
}
```

**Validation rules:**
- `Title`: required, 1-500 chars
- `Identifier`: auto-generated from project identifier + sequence
- `EstimatePoints`: >= 0 if provided
- `EstimateHours`: >= 0 if provided
- `DueDate` >= `StartDate` if both provided
- No circular parent-child relationships
- No circular dependencies

**Indexes:**
- `IX_Tasks_WorkspaceId_ProjectId_Status`
- `IX_Tasks_WorkspaceId_AssigneeId`
- `IX_Tasks_WorkspaceId_SprintId`
- `IX_Tasks_ProjectId_Identifier` (unique composite)
- `IX_Tasks_ParentTaskId`
- `IX_Tasks_DueDate`
- `IX_Tasks_IsDeleted`
- `GIN index on Labels` (JSONB)
- `GIN index on CustomFields` (JSONB)

**Lifecycle:** Backlog → Todo → InProgress → InReview → Done | Cancelled

**Events triggered:**
- `TaskCreatedEvent`
- `TaskUpdatedEvent`
- `TaskStatusChangedEvent`
- `TaskAssignedEvent`
- `TaskPriorityChangedEvent`
- `TaskMovedToSprintEvent`
- `TaskDeletedEvent`
- `TaskCommentAddedEvent`

---

### 2.8 TaskComment

**Module:** Tasks  
**Base:** `TenantEntity`

```csharp
public class TaskComment : TenantEntity, ISoftDeletable, IAuditable
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;

    public string Body { get; set; } = string.Empty;              // Markdown, max 10000
    public bool IsEdited { get; set; }

    // Reply support
    public Guid? ParentCommentId { get; set; }
    public TaskComment? ParentComment { get; set; }

    // Reactions (JSONB: { "👍": ["userId1", "userId2"], ... })
    public JsonDocument? Reactions { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<TaskComment> Replies { get; set; } = [];
}
```

**Indexes:**
- `IX_TaskComments_TaskId_CreatedAt`
- `IX_TaskComments_AuthorId`
- `IX_TaskComments_ParentCommentId`

---

### 2.9 TaskWatcher

**Module:** Tasks  
**Base:** `TenantEntity`

```csharp
public class TaskWatcher : TenantEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
```

**Indexes:**
- `IX_TaskWatchers_TaskId_UserId` (unique composite)
- `IX_TaskWatchers_UserId`

---

### 2.10 TaskDependency

**Module:** Tasks  
**Base:** `TenantEntity`

```csharp
public class TaskDependency : TenantEntity
{
    public Guid TaskId { get; set; }                              // The task that depends
    public TaskItem Task { get; set; } = null!;

    public Guid DependsOnTaskId { get; set; }                     // The task it depends on
    public TaskItem DependsOnTask { get; set; } = null!;

    public DependencyType Type { get; set; } = DependencyType.FinishToStart;
}

public enum DependencyType
{
    FinishToStart,    // Default: B can't start until A finishes
    StartToStart,     // B can't start until A starts
    FinishToFinish,   // B can't finish until A finishes
    StartToFinish     // B can't finish until A starts
}
```

**Indexes:**
- `IX_TaskDependencies_TaskId_DependsOnTaskId` (unique composite)
- `IX_TaskDependencies_DependsOnTaskId`

**Validation:** Circular dependency detection required.

---

### 2.11 TaskChecklistItem

**Module:** Tasks  
**Base:** `TenantEntity`

```csharp
public class TaskChecklistItem : TenantEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public string Title { get; set; } = string.Empty;             // Required, max 500
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? CompletedBy { get; set; }

    public int SortOrder { get; set; }
}
```

**Indexes:**
- `IX_TaskChecklistItems_TaskId_SortOrder`

---

### 2.12 TaskAttachment

**Module:** Tasks  
**Base:** `TenantEntity`

```csharp
public class TaskAttachment : TenantEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public Guid FileAttachmentId { get; set; }
    public FileAttachment FileAttachment { get; set; } = null!;

    public Guid UploadedBy { get; set; }
    public User Uploader { get; set; } = null!;
}
```

**Indexes:**
- `IX_TaskAttachments_TaskId`
- `IX_TaskAttachments_FileAttachmentId`

---

### 2.13 Goal

**Module:** Goals  
**Base:** `TenantEntity`

```csharp
public class Goal : TenantEntity, ISoftDeletable, IAuditable
{
    public string Title { get; set; } = string.Empty;             // Required, max 300
    public string? Description { get; set; }                       // Optional, max 5000

    public GoalStatus Status { get; set; } = GoalStatus.OnTrack;
    public GoalType Type { get; set; } = GoalType.Objective;

    // Progress
    public decimal ProgressPercent { get; set; }                  // 0-100, auto-calculated or manual
    public GoalProgressSource ProgressSource { get; set; } = GoalProgressSource.Manual;

    // Ownership
    public Guid? OwnerId { get; set; }
    public User? Owner { get; set; }

    // Scheduling
    public DateTime? StartDate { get; set; }
    public DateTime? TargetDate { get; set; }

    // Hierarchy
    public Guid? ParentGoalId { get; set; }
    public Goal? ParentGoal { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<Goal> SubGoals { get; set; } = [];
    public ICollection<GoalProjectLink> ProjectLinks { get; set; } = [];
    public ICollection<Initiative> Initiatives { get; set; } = [];
}

public enum GoalStatus { OnTrack, AtRisk, OffTrack, Completed, Cancelled }
public enum GoalType { Objective, KeyResult }
public enum GoalProgressSource { Manual, LinkedProjects, LinkedTasks }
```

**Indexes:**
- `IX_Goals_WorkspaceId_Status`
- `IX_Goals_OwnerId`
- `IX_Goals_ParentGoalId`
- `IX_Goals_TargetDate`

**Events triggered:**
- `GoalCreatedEvent`
- `GoalStatusChangedEvent`
- `GoalProgressUpdatedEvent`

---

### 2.14 GoalProjectLink

**Module:** Goals  
**Base:** `TenantEntity`

```csharp
public class GoalProjectLink : TenantEntity
{
    public Guid GoalId { get; set; }
    public Goal Goal { get; set; } = null!;

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
}
```

**Indexes:**
- `IX_GoalProjectLinks_GoalId_ProjectId` (unique composite)

---

### 2.15 Initiative

**Module:** Goals  
**Base:** `TenantEntity`

```csharp
public class Initiative : TenantEntity, ISoftDeletable, IAuditable
{
    public string Title { get; set; } = string.Empty;             // Required, max 300
    public string? Description { get; set; }                       // Optional, max 5000

    public Guid GoalId { get; set; }
    public Goal Goal { get; set; } = null!;

    public InitiativeStatus Status { get; set; } = InitiativeStatus.Planned;

    public Guid? OwnerId { get; set; }
    public User? Owner { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? TargetDate { get; set; }

    public decimal ProgressPercent { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<InitiativeMilestone> Milestones { get; set; } = [];
}

public enum InitiativeStatus { Planned, InProgress, Completed, Cancelled }
```

**Indexes:**
- `IX_Initiatives_GoalId`
- `IX_Initiatives_OwnerId`
- `IX_Initiatives_Status`

---

### 2.16 InitiativeMilestone

**Module:** Goals  
**Base:** `TenantEntity`

```csharp
public class InitiativeMilestone : TenantEntity
{
    public Guid InitiativeId { get; set; }
    public Initiative Initiative { get; set; } = null!;

    public string Title { get; set; } = string.Empty;             // Required, max 300
    public DateTime? TargetDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }

    public int SortOrder { get; set; }
}
```

**Indexes:**
- `IX_InitiativeMilestones_InitiativeId_SortOrder`

---

### 2.17 Sprint

**Module:** Sprints  
**Base:** `TenantEntity`

```csharp
public class Sprint : TenantEntity, IAuditable
{
    public string Name { get; set; } = string.Empty;              // Required, max 200
    public string? Goal { get; set; }                              // Sprint goal description

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public SprintStatus Status { get; set; } = SprintStatus.Planned;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Velocity
    public decimal? PlannedPoints { get; set; }
    public decimal? CompletedPoints { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<TaskItem> Tasks { get; set; } = [];
}

public enum SprintStatus { Planned, Active, Completed }
```

**Validation rules:**
- `StartDate` < `EndDate`
- Only one Active sprint per project at a time

**Indexes:**
- `IX_Sprints_ProjectId_Status`
- `IX_Sprints_WorkspaceId_StartDate`

**Events triggered:**
- `SprintCreatedEvent`
- `SprintStartedEvent`
- `SprintCompletedEvent`

---

### 2.18 CalendarItem

**Module:** Calendar  
**Base:** `TenantEntity`

```csharp
public class CalendarItem : TenantEntity, IAuditable
{
    public string Title { get; set; } = string.Empty;             // Required, max 300
    public string? Description { get; set; }

    public CalendarItemType Type { get; set; }
    public string? Color { get; set; }                             // Hex color

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsAllDay { get; set; }

    // Recurrence (RRULE string, null for one-time)
    public string? RecurrenceRule { get; set; }

    // Linked entity (optional)
    public Guid? LinkedTaskId { get; set; }
    public Guid? LinkedProjectId { get; set; }

    // Creator
    public Guid CreatorId { get; set; }
    public User Creator { get; set; } = null!;

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}

public enum CalendarItemType { Event, Milestone, Deadline, Meeting, Reminder }
```

**Indexes:**
- `IX_CalendarItems_WorkspaceId_StartTime_EndTime`
- `IX_CalendarItems_CreatorId`
- `IX_CalendarItems_LinkedTaskId`

---

### 2.19 Document

**Module:** Documents  
**Base:** `TenantEntity`

```csharp
public class Document : TenantEntity, ISoftDeletable, IAuditable
{
    public string Title { get; set; } = string.Empty;             // Required, max 500
    public string? Content { get; set; }                           // Rich text / JSON (e.g. TipTap JSON)
    public string ContentFormat { get; set; } = "tiptap-json";    // Format identifier

    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }

    public Guid? ParentDocumentId { get; set; }                   // Nested docs
    public Document? ParentDocument { get; set; }

    public Guid CreatorId { get; set; }
    public User Creator { get; set; } = null!;

    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }

    public int SortOrder { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<Document> ChildDocuments { get; set; } = [];
}
```

**Indexes:**
- `IX_Documents_WorkspaceId_ProjectId`
- `IX_Documents_ParentDocumentId`
- `IX_Documents_CreatorId`
- Full-text search index on `Title` and `Content`

---

### 2.20 TimeEntry

**Module:** TimeTracking  
**Base:** `TenantEntity`

```csharp
public class TimeEntry : TenantEntity, IAuditable
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? TaskId { get; set; }
    public TaskItem? Task { get; set; }

    public Guid? ProjectId { get; set; }
    public Project? Project { get; set; }

    public string? Description { get; set; }                       // Optional, max 1000

    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }                         // Null = timer running
    public decimal DurationMinutes { get; set; }                  // Calculated or manual

    public bool IsBillable { get; set; }
    public decimal? HourlyRate { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
```

**Validation rules:**
- `EndTime` >= `StartTime` if provided
- `DurationMinutes` >= 0
- Only one running timer per user at a time

**Indexes:**
- `IX_TimeEntries_WorkspaceId_UserId_StartTime`
- `IX_TimeEntries_TaskId`
- `IX_TimeEntries_ProjectId`

---

### 2.21 AutomationRule

**Module:** Automations  
**Base:** `TenantEntity`

```csharp
public class AutomationRule : TenantEntity, IAuditable
{
    public string Name { get; set; } = string.Empty;              // Required, max 200
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    // Trigger definition (JSONB)
    public JsonDocument Trigger { get; set; } = null!;
    // Example: { "event": "task.status_changed", "conditions": { "newStatus": "Done" } }

    // Action definition (JSONB)
    public JsonDocument Action { get; set; } = null!;
    // Example: { "type": "send_notification", "config": { "channel": "slack", "message": "..." } }

    public Guid? ProjectId { get; set; }                          // Scoped to project, or workspace-wide
    public Project? Project { get; set; }

    public int ExecutionCount { get; set; }
    public DateTime? LastExecutedAt { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
```

**Indexes:**
- `IX_AutomationRules_WorkspaceId_IsActive`
- `IX_AutomationRules_ProjectId`

---

### 2.22 AutomationLog

**Module:** Automations  
**Base:** `TenantEntity`

```csharp
public class AutomationLog : TenantEntity
{
    public Guid AutomationRuleId { get; set; }
    public AutomationRule AutomationRule { get; set; } = null!;

    public AutomationLogStatus Status { get; set; }
    public string? TriggerData { get; set; }                       // JSON snapshot of trigger event
    public string? ActionResult { get; set; }                      // JSON snapshot of action result
    public string? ErrorMessage { get; set; }

    public TimeSpan ExecutionDuration { get; set; }
}

public enum AutomationLogStatus { Success, Failed, Skipped }
```

**Indexes:**
- `IX_AutomationLogs_AutomationRuleId_CreatedAt`
- `IX_AutomationLogs_Status`

---

### 2.23 RequestForm

**Module:** Intake  
**Base:** `TenantEntity`

```csharp
public class RequestForm : TenantEntity, IAuditable
{
    public string Title { get; set; } = string.Empty;             // Required, max 200
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;              // URL-safe, unique per workspace

    public bool IsActive { get; set; } = true;
    public bool IsPublic { get; set; } = true;                    // Public submission without auth

    // Form schema (JSONB) — field definitions
    public JsonDocument FormSchema { get; set; } = null!;
    // Example: { "fields": [ { "name": "title", "type": "text", "required": true }, ... ] }

    public Guid? DefaultProjectId { get; set; }                   // Auto-assign submissions to project
    public Project? DefaultProject { get; set; }

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation
    public ICollection<RequestSubmission> Submissions { get; set; } = [];
}
```

**Indexes:**
- `IX_RequestForms_WorkspaceId_Slug` (unique composite)
- `IX_RequestForms_IsActive`

---

### 2.24 RequestSubmission

**Module:** Intake  
**Base:** `TenantEntity`

```csharp
public class RequestSubmission : TenantEntity
{
    public Guid RequestFormId { get; set; }
    public RequestForm RequestForm { get; set; } = null!;

    public JsonDocument Data { get; set; } = null!;               // Submitted form data (JSONB)

    public SubmissionStatus Status { get; set; } = SubmissionStatus.New;

    public string? SubmitterEmail { get; set; }                    // For public submissions
    public Guid? SubmitterUserId { get; set; }                     // For authenticated submissions
    public User? SubmitterUser { get; set; }

    // Triage
    public Guid? ConvertedToTaskId { get; set; }
    public TaskItem? ConvertedToTask { get; set; }

    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
}

public enum SubmissionStatus { New, InReview, Accepted, Rejected, ConvertedToTask }
```

**Indexes:**
- `IX_RequestSubmissions_RequestFormId_Status`
- `IX_RequestSubmissions_WorkspaceId_Status`

---

### 2.25 ProjectTemplate

**Module:** Projects  
**Base:** `TenantEntity`

```csharp
public class ProjectTemplate : TenantEntity, IAuditable
{
    public string Name { get; set; } = string.Empty;              // Required, max 200
    public string? Description { get; set; }
    public string? IconUrl { get; set; }

    // Template content (JSONB) — statuses, default tasks, etc.
    public JsonDocument TemplateData { get; set; } = null!;

    public bool IsSystemTemplate { get; set; }                     // Built-in vs user-created

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
```

---

### 2.26 Notification

**Module:** Notifications  
**Base:** `TenantEntity`

```csharp
public class Notification : TenantEntity
{
    public Guid RecipientId { get; set; }
    public User Recipient { get; set; } = null!;

    public string Type { get; set; } = string.Empty;              // e.g. "task.assigned", "comment.added"
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }

    // Link to source entity
    public string? EntityType { get; set; }                        // "task", "comment", "project", etc.
    public Guid? EntityId { get; set; }

    // Actor (who caused the notification)
    public Guid? ActorId { get; set; }
    public User? Actor { get; set; }

    // State
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsArchived { get; set; }

    // Delivery
    public bool EmailSent { get; set; }
    public DateTime? EmailSentAt { get; set; }
}
```

**Indexes:**
- `IX_Notifications_RecipientId_IsRead_CreatedAt`
- `IX_Notifications_WorkspaceId_RecipientId`
- `IX_Notifications_EntityType_EntityId`

---

### 2.27 NotificationPreference

**Module:** Notifications  
**Base:** `TenantEntity`

```csharp
public class NotificationPreference : TenantEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string EventType { get; set; } = string.Empty;         // e.g. "task.assigned"

    public bool InApp { get; set; } = true;
    public bool Email { get; set; } = true;
    public bool Push { get; set; } = false;
}
```

**Indexes:**
- `IX_NotificationPreferences_UserId_WorkspaceId_EventType` (unique composite)

---

### 2.28 Subscription

**Module:** Billing  
**Base:** `BaseEntity` (linked to Workspace, not tenant-scoped itself)

```csharp
public class Subscription : BaseEntity
{
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;

    public Guid PlanId { get; set; }
    public Plan Plan { get; set; } = null!;

    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    // Stripe
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }

    // Billing period
    public DateTime CurrentPeriodStart { get; set; }
    public DateTime CurrentPeriodEnd { get; set; }

    public DateTime? CancelledAt { get; set; }
    public DateTime? TrialEnd { get; set; }

    public int SeatCount { get; set; }                            // Paid seats
    public int SeatLimit { get; set; }                            // Max seats for plan
}

public enum SubscriptionStatus { Trialing, Active, PastDue, Cancelled, Expired }
```

**Indexes:**
- `IX_Subscriptions_WorkspaceId` (unique)
- `IX_Subscriptions_StripeSubscriptionId`
- `IX_Subscriptions_Status`

---

### 2.29 Plan

**Module:** Billing  
**Base:** `BaseEntity` (system-level, not tenant-scoped)

```csharp
public class Plan : BaseEntity
{
    public string Name { get; set; } = string.Empty;              // "Free", "Pro", "Business", "Enterprise"
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }

    public decimal MonthlyPricePerSeat { get; set; }
    public decimal AnnualPricePerSeat { get; set; }

    public string? StripePriceIdMonthly { get; set; }
    public string? StripePriceIdAnnual { get; set; }

    // Limits
    public int MaxMembers { get; set; }                           // 0 = unlimited
    public int MaxProjects { get; set; }                          // 0 = unlimited
    public long MaxStorageBytes { get; set; }                     // 0 = unlimited
    public int MaxAutomations { get; set; }

    // Feature gates (JSONB)
    public JsonDocument Features { get; set; } = null!;
    // Example: { "ai": true, "customFields": true, "advancedReporting": true, "sso": false }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
```

**Indexes:**
- `IX_Plans_Slug` (unique)
- `IX_Plans_IsActive`

---

### 2.30 UsageRecord

**Module:** Billing  
**Base:** `TenantEntity`

```csharp
public class UsageRecord : TenantEntity
{
    public string MetricName { get; set; } = string.Empty;        // "members", "projects", "storage_bytes", "ai_requests"
    public long Value { get; set; }
    public DateTime RecordedAt { get; set; }
    public string Period { get; set; } = string.Empty;            // "2025-01" (monthly aggregation)
}
```

**Indexes:**
- `IX_UsageRecords_WorkspaceId_MetricName_Period`

---

### 2.31 AIConversation

**Module:** AI  
**Base:** `TenantEntity`

```csharp
public class AIConversation : TenantEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string? Title { get; set; }                             // Auto-generated from first message
    public string Model { get; set; } = string.Empty;             // e.g. "gpt-4o", "claude-3.5-sonnet"

    public int MessageCount { get; set; }
    public int TotalTokensUsed { get; set; }

    // Navigation
    public ICollection<AIMessage> Messages { get; set; } = [];
}
```

**Indexes:**
- `IX_AIConversations_WorkspaceId_UserId_CreatedAt`

---

### 2.32 AIMessage

**Module:** AI  
**Base:** `TenantEntity`

```csharp
public class AIMessage : TenantEntity
{
    public Guid ConversationId { get; set; }
    public AIConversation Conversation { get; set; } = null!;

    public AIMessageRole Role { get; set; }                        // User, Assistant, System, Tool
    public string Content { get; set; } = string.Empty;

    public int? TokensUsed { get; set; }

    // Navigation
    public ICollection<AIToolInvocation> ToolInvocations { get; set; } = [];
}

public enum AIMessageRole { System, User, Assistant, Tool }
```

**Indexes:**
- `IX_AIMessages_ConversationId_CreatedAt`

---

### 2.33 AIToolInvocation

**Module:** AI  
**Base:** `TenantEntity`

```csharp
public class AIToolInvocation : TenantEntity
{
    public Guid MessageId { get; set; }
    public AIMessage Message { get; set; } = null!;

    public string ToolName { get; set; } = string.Empty;          // e.g. "query_tasks", "create_task"
    public JsonDocument Input { get; set; } = null!;              // Tool input (JSONB)
    public JsonDocument? Output { get; set; }                      // Tool output (JSONB)

    public AIToolInvocationStatus Status { get; set; }
    public TimeSpan? Duration { get; set; }
}

public enum AIToolInvocationStatus { Pending, Running, Completed, Failed }
```

---

### 2.34 AuditEvent

**Module:** Admin  
**Base:** `TenantEntity`

```csharp
public class AuditEvent : TenantEntity
{
    public Guid? ActorId { get; set; }
    public User? Actor { get; set; }

    public string Action { get; set; } = string.Empty;            // e.g. "task.created", "member.removed"
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }

    public JsonDocument? OldValues { get; set; }                   // Before state (JSONB)
    public JsonDocument? NewValues { get; set; }                   // After state (JSONB)

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
```

**Indexes:**
- `IX_AuditEvents_WorkspaceId_CreatedAt`
- `IX_AuditEvents_ActorId`
- `IX_AuditEvents_EntityType_EntityId`
- `IX_AuditEvents_Action`

---

### 2.35 FileAttachment

**Module:** Files  
**Base:** `TenantEntity`

```csharp
public class FileAttachment : TenantEntity, IAuditable
{
    public string FileName { get; set; } = string.Empty;          // Original file name
    public string StorageKey { get; set; } = string.Empty;        // S3 object key
    public string ContentType { get; set; } = string.Empty;       // MIME type
    public long SizeBytes { get; set; }

    public string? ThumbnailKey { get; set; }                      // S3 key for thumbnail

    public Guid UploadedBy { get; set; }
    public User Uploader { get; set; } = null!;

    // Audit
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
}
```

**Indexes:**
- `IX_FileAttachments_WorkspaceId_UploadedBy`
- `IX_FileAttachments_StorageKey` (unique)

---

### 2.36 FeatureFlag

**Module:** Admin  
**Base:** `BaseEntity` (system-level or per-workspace)

```csharp
public class FeatureFlag : BaseEntity
{
    public string Key { get; set; } = string.Empty;               // e.g. "ai_assistant", "time_tracking"
    public string? Description { get; set; }

    public bool IsEnabled { get; set; }

    // Optional workspace scoping (null = global)
    public Guid? WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }

    // Rollout percentage (0-100, null = binary on/off)
    public int? RolloutPercentage { get; set; }

    public JsonDocument? Conditions { get; set; }                  // JSONB for complex targeting rules
}
```

**Indexes:**
- `IX_FeatureFlags_Key_WorkspaceId` (unique composite)

---

## 3. System Events

| Event | Trigger | Consumers | Async |
|-------|---------|-----------|-------|
| `UserRegisteredEvent` | User completes registration | Notifications (welcome email), Analytics | Yes |
| `UserProfileUpdatedEvent` | User updates profile | Search (re-index) | Yes |
| `WorkspaceCreatedEvent` | Workspace created | Billing (create free sub), Admin (audit) | Yes |
| `WorkspaceDeletedEvent` | Workspace soft-deleted | Billing (cancel sub), Search (remove index) | Yes |
| `MemberInvitedEvent` | Invitation created | Notifications (invite email) | Yes |
| `MemberJoinedEvent` | User accepts invitation | Notifications (welcome), Admin (audit) | Yes |
| `MemberRemovedEvent` | Member removed from workspace | Notifications, Admin (audit) | Yes |
| `ProjectCreatedEvent` | Project created | Search (index), Admin (audit) | Yes |
| `ProjectStatusChangedEvent` | Project status updated | Goals (recalc progress), Notifications | Yes |
| `TaskCreatedEvent` | Task created | Search (index), Notifications (watchers), Automations | Yes |
| `TaskUpdatedEvent` | Task fields updated | Search (re-index), Automations | Yes |
| `TaskStatusChangedEvent` | Task status changed | Sprints (velocity), Goals (progress), Notifications, Automations, BoardHub | Sync (hub) + Async |
| `TaskAssignedEvent` | Task assigned to user | Notifications (assignee), Admin (audit) | Yes |
| `TaskCommentAddedEvent` | Comment added to task | Notifications (watchers), Search (index) | Yes |
| `SprintStartedEvent` | Sprint activated | Notifications (team), Admin (audit) | Yes |
| `SprintCompletedEvent` | Sprint marked complete | Analytics (velocity snapshot), Notifications | Yes |
| `GoalProgressUpdatedEvent` | Goal progress changes | Notifications (owner), Admin (audit) | Yes |
| `DocumentUpdatedEvent` | Document content changed | Search (re-index) | Yes |
| `TimeEntryCreatedEvent` | Time entry recorded | Analytics, Admin (audit) | Yes |
| `AutomationTriggeredEvent` | Automation rule fires | AutomationLog, Notifications (on failure) | Yes |
| `SubscriptionChangedEvent` | Plan upgrade/downgrade | Admin (audit), Notifications (owner) | Yes |
| `FileUploadedEvent` | File uploaded | Search (metadata index), Admin (audit) | Yes |
| `AIConversationCreatedEvent` | AI chat started | UsageRecord, Admin (audit) | Yes |

---

## 4. Ownership and Tenancy Rules

### Tenant-Scoped Entities (require `WorkspaceId`)

All data queries for these entities are automatically filtered by the current workspace context via EF Core global query filters:

- Membership, Invitation
- Project, ProjectFavorite, ProjectTemplate
- TaskItem, TaskComment, TaskWatcher, TaskDependency, TaskChecklistItem, TaskAttachment
- Goal, GoalProjectLink, Initiative, InitiativeMilestone
- Sprint
- CalendarItem
- Document
- TimeEntry
- AutomationRule, AutomationLog
- RequestForm, RequestSubmission
- Notification, NotificationPreference
- UsageRecord
- AIConversation, AIMessage, AIToolInvocation
- AuditEvent
- FileAttachment

### Global Entities (no `WorkspaceId`)

- **User** — global identity, linked to workspaces via Membership
- **Plan** — system-level billing plan definitions (seeded)

### Special Cases

- **Subscription** — has `WorkspaceId` but is not tenant-filtered in the traditional sense; it's accessed by workspace lookup, not by global filter.
- **FeatureFlag** — optional `WorkspaceId`; when null, applies globally. When set, applies to that specific workspace.

### Cascade Rules

| Parent | Child | On Delete |
|--------|-------|-----------|
| Workspace | All tenant entities | Cascade (soft delete propagation) |
| Project | TaskItem, Sprint, Document | Cascade (soft delete) |
| TaskItem | TaskComment, TaskChecklistItem, TaskWatcher, TaskDependency, TaskAttachment | Cascade |
| Goal | Initiative, GoalProjectLink | Cascade |
| Initiative | InitiativeMilestone | Cascade |
| AutomationRule | AutomationLog | Cascade |
| RequestForm | RequestSubmission | Cascade |
| AIConversation | AIMessage | Cascade |
| AIMessage | AIToolInvocation | Cascade |
| User | (memberships) | Restrict (cannot delete user with active memberships) |
