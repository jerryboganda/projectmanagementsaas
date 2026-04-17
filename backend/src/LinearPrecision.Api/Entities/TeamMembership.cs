using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class TeamMembership : TenantEntity
{
    public Guid TeamId { get; set; }
    public Team Team { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime AddedAt { get; set; }
}
