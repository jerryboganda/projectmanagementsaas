using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain;
using LinearPrecision.Shared.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace LinearPrecision.Api.Infrastructure.Persistence.Interceptors;

// F-07 — When an AuditEvent writer is wired up here, it MUST route OldValues
// and NewValues through LinearPrecision.Api.Infrastructure.Persistence.Auditing.AuditRedactor
// so password hashes, MFA secrets, refresh tokens, and API keys are never
// persisted in plaintext audit logs. See SensitiveFieldRegistry for the
// canonical list of redacted property names.
public sealed class AuditInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUser _currentUser;

    public AuditInterceptor(ICurrentUser currentUser)
    {
        _currentUser = currentUser;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
            return base.SavingChangesAsync(eventData, result, cancellationToken);

        var utcNow = DateTime.UtcNow;
        var entries = eventData.Context.ChangeTracker.Entries();

        foreach (var entry in entries)
        {
            if (entry.Entity is BaseEntity baseEntity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        if (baseEntity.Id == Guid.Empty)
                            baseEntity.Id = GuidExtensions.NewSequentialGuid();

                        baseEntity.CreatedAt = utcNow;
                        baseEntity.UpdatedAt = utcNow;

                        if (entry.Entity is IAuditable addedAuditable)
                            addedAuditable.CreatedBy = _currentUser.UserId;

                        break;

                    case EntityState.Modified:
                        baseEntity.UpdatedAt = utcNow;

                        if (entry.Entity is IAuditable modifiedAuditable)
                            modifiedAuditable.UpdatedBy = _currentUser.UserId;

                        break;
                }
            }

            // Handle User entity separately — it extends IdentityUser, not BaseEntity
            if (entry.Entity is Entities.User user)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        if (user.Id == Guid.Empty)
                            user.Id = GuidExtensions.NewSequentialGuid();

                        user.CreatedAt = utcNow;
                        user.UpdatedAt = utcNow;
                        user.CreatedBy = _currentUser.UserId;
                        break;

                    case EntityState.Modified:
                        user.UpdatedAt = utcNow;
                        user.UpdatedBy = _currentUser.UserId;
                        break;
                }
            }
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
