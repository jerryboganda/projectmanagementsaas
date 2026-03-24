namespace LinearPrecision.Shared.Contracts;

/// <summary>
/// Provides the current tenant (workspace) context resolved from the request.
/// </summary>
public interface ITenantContext
{
    Guid? WorkspaceId { get; set; }
}
