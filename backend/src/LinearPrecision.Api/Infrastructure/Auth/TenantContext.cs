using LinearPrecision.Shared.Contracts;

namespace LinearPrecision.Api.Infrastructure.Auth;

public sealed class TenantContext : ITenantContext
{
    public Guid? WorkspaceId { get; set; }
}
