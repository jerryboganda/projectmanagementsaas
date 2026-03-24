using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class Membership : TenantEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public MembershipRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public string? WorkspaceDisplayName { get; set; }
    public string? WorkspaceAvatarUrl { get; set; }
}
