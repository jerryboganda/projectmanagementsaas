using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class ProjectFavorite : TenantEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int SortOrder { get; set; }
}
