using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace LinearPrecision.Api.Infrastructure.Persistence.Interceptors;

public sealed class TenantInterceptor : SaveChangesInterceptor
{
    private readonly ITenantContext _tenantContext;

    public TenantInterceptor(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
            return base.SavingChangesAsync(eventData, result, cancellationToken);

        var entries = eventData.Context.ChangeTracker.Entries<TenantEntity>()
            .Where(e => e.State == EntityState.Added && e.Entity.WorkspaceId == Guid.Empty);

        foreach (var entry in entries)
        {
            if (_tenantContext.WorkspaceId.HasValue)
                entry.Entity.WorkspaceId = _tenantContext.WorkspaceId.Value;
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
