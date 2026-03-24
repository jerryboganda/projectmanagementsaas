using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class Notification : TenantEntity
{
    public Guid RecipientId { get; set; }
    public User Recipient { get; set; } = null!;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public Guid? ActorId { get; set; }
    public User? Actor { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsArchived { get; set; }
    public bool EmailSent { get; set; }
    public DateTime? EmailSentAt { get; set; }
}
