using System.Text.Json;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class Workspace : BaseEntity, ISoftDeletable, IAuditable
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? Domain { get; set; }
    public JsonDocument? Settings { get; set; }
    public Guid? SubscriptionId { get; set; }
    public Subscription? Subscription { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<Membership> Memberships { get; set; } = [];
    public ICollection<Project> Projects { get; set; } = [];
    public ICollection<Invitation> Invitations { get; set; } = [];
    public ICollection<Goal> Goals { get; set; } = [];
}
