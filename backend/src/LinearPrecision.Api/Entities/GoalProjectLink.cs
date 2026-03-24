using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class GoalProjectLink : TenantEntity
{
    public Guid GoalId { get; set; }
    public Goal Goal { get; set; } = null!;
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
}
