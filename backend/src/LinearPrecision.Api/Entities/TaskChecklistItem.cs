using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class TaskChecklistItem : TenantEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? CompletedBy { get; set; }
    public int SortOrder { get; set; }
}
