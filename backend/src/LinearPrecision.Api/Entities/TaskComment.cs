using System.Text.Json;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class TaskComment : TenantEntity, ISoftDeletable, IAuditable
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public string Body { get; set; } = string.Empty;
    public bool IsEdited { get; set; }
    public Guid? ParentCommentId { get; set; }
    public TaskComment? ParentComment { get; set; }
    public JsonDocument? Reactions { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<TaskComment> Replies { get; set; } = [];
}
