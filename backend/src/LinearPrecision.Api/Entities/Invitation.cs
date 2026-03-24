using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Entities;

public class Invitation : TenantEntity
{
    public string Email { get; set; } = string.Empty;
    public MembershipRole Role { get; set; }
    public InvitationStatus Status { get; set; }
    public Guid InvitedBy { get; set; }
    public User InvitedByUser { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public List<Guid>? ProjectIds { get; set; }
}
