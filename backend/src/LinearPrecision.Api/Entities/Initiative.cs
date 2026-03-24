using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class Initiative : TenantEntity, ISoftDeletable, IAuditable
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid GoalId { get; set; }
    public Goal Goal { get; set; } = null!;
    public InitiativeStatus Status { get; set; }
    public Guid? OwnerId { get; set; }
    public User? Owner { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? TargetDate { get; set; }
    public int ProgressPercent { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<InitiativeMilestone> Milestones { get; set; } = [];
}
