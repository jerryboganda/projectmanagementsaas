namespace LinearPrecision.Shared.Domain;

/// <summary>
/// Tenant-scoped entity — all queries filtered by WorkspaceId via EF Core global query filters.
/// </summary>
public abstract class TenantEntity : BaseEntity
{
    public Guid WorkspaceId { get; set; }
}
