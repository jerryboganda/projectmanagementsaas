using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class NotificationPreference : TenantEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string EventType { get; set; } = string.Empty;
    public bool InApp { get; set; } = true;
    public bool Email { get; set; } = true;
    public bool Push { get; set; } = false;
}
