using System.Text.Json;
using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class TaskItem : TenantEntity, ISoftDeletable, IAuditable
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Identifier { get; set; } = string.Empty;
    public TaskItemStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public string? TaskType { get; set; }
    public List<string> Labels { get; set; } = [];
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid? ParentTaskId { get; set; }
    public TaskItem? ParentTask { get; set; }
    public Guid? AssigneeId { get; set; }
    public User? Assignee { get; set; }
    public Guid? CreatorId { get; set; }
    public User? Creator { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? EstimatePoints { get; set; }
    public decimal? EstimateHours { get; set; }
    public Guid? SprintId { get; set; }
    public Sprint? Sprint { get; set; }
    public int SortOrder { get; set; }
    public JsonDocument? CustomFields { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<TaskComment> Comments { get; set; } = [];
    public ICollection<TaskChecklistItem> ChecklistItems { get; set; } = [];
    public ICollection<TaskWatcher> Watchers { get; set; } = [];
    public ICollection<TaskDependency> DependsOn { get; set; } = [];
    public ICollection<TaskDependency> DependedOnBy { get; set; } = [];
    public ICollection<TaskAttachment> Attachments { get; set; } = [];
    public ICollection<TaskItem> SubTasks { get; set; } = [];
    public ICollection<TimeEntry> TimeEntries { get; set; } = [];
}
