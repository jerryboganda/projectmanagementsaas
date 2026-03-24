using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class Goal : TenantEntity, ISoftDeletable, IAuditable
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public GoalStatus Status { get; set; }
    public GoalType Type { get; set; }
    public int ProgressPercent { get; set; }
    public GoalProgressSource ProgressSource { get; set; }
    public Guid? OwnerId { get; set; }
    public User? Owner { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? TargetDate { get; set; }
    public Guid? ParentGoalId { get; set; }
    public Goal? ParentGoal { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<Goal> SubGoals { get; set; } = [];
    public ICollection<GoalProjectLink> ProjectLinks { get; set; } = [];
    public ICollection<Initiative> Initiatives { get; set; } = [];
}
