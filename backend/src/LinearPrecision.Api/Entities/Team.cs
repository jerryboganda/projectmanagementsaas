using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Entities;

public class Team : TenantEntity, ISoftDeletable, IAuditable
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }

    // IAuditable
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<TeamMembership> Members { get; set; } = [];
}
