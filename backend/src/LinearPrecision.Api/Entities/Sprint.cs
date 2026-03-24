using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class Sprint : TenantEntity, IAuditable
{
    public string Name { get; set; } = string.Empty;
    public string? Goal { get; set; }
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public SprintStatus Status { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int? PlannedPoints { get; set; }
    public int? CompletedPoints { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<TaskItem> Tasks { get; set; } = [];
}
