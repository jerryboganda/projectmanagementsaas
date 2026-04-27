using Hangfire;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace LinearPrecision.Worker.Jobs;

/// <summary>
/// Daily cleanup job that purges expired invitations, stale audit logs,
/// soft-deleted records past retention, and provides Redis blocklist info.
/// </summary>
public class CleanupExpiredTokensJob
{
    private const int DeleteBatchSize = 1000;

    private readonly ILogger<CleanupExpiredTokensJob> _logger;
    private readonly AppDbContext _db;
    private readonly IConnectionMultiplexer _redis;

    public CleanupExpiredTokensJob(
        ILogger<CleanupExpiredTokensJob> logger,
        AppDbContext db,
        IConnectionMultiplexer redis)
    {
        _logger = logger;
        _db = db;
        _redis = redis;
    }

    [AutomaticRetry(Attempts = 1)]
    [DisableConcurrentExecution(60 * 60)]
    [Queue("cleanup")]
    public async Task CleanupAsync()
    {
        _logger.LogInformation("Starting cleanup job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            var totalCleaned = 0;
            var needsSaveChanges = false;

            // ── Step 1: Mark expired invitations (set-based update) ──
            var expiredInvitationsCount = await MarkExpiredInvitationsAsync(DateTime.UtcNow);
            needsSaveChanges |= !_db.Database.IsRelational() && expiredInvitationsCount > 0;

            if (expiredInvitationsCount > 0)
            {
                totalCleaned += expiredInvitationsCount;
                _logger.LogInformation("Marked {Count} expired invitations", expiredInvitationsCount);
            }

            // ── Step 2: Purge audit events older than 1 year ──
            var auditCutoff = DateTime.UtcNow.AddYears(-1);
            var staleAuditsCount = await DeleteOrRemoveRangeAsync(_db.AuditEvents
                .IgnoreQueryFilters()
                .Where(a => a.CreatedAt < auditCutoff));
            needsSaveChanges |= !_db.Database.IsRelational() && staleAuditsCount > 0;

            totalCleaned += staleAuditsCount;
            _logger.LogInformation("Purged {Count} audit events older than 1 year", staleAuditsCount);

            // ── Step 3: Hard-delete soft-deleted records past 90-day retention ──
            var retentionCutoff = DateTime.UtcNow.AddDays(-90);

            var tasksDeleted = await DeleteOrRemoveRangeAsync(_db.TaskItems
                .IgnoreQueryFilters()
                .Where(t => t.IsDeleted && t.DeletedAt != null && t.DeletedAt < retentionCutoff));

            var projectsDeleted = await DeleteOrRemoveRangeAsync(_db.Projects
                .IgnoreQueryFilters()
                .Where(p => p.IsDeleted && p.DeletedAt != null && p.DeletedAt < retentionCutoff));

            var commentsDeleted = await DeleteOrRemoveRangeAsync(_db.TaskComments
                .IgnoreQueryFilters()
                .Where(c => c.IsDeleted && c.DeletedAt != null && c.DeletedAt < retentionCutoff));

            var goalsDeleted = await DeleteOrRemoveRangeAsync(_db.Goals
                .IgnoreQueryFilters()
                .Where(g => g.IsDeleted && g.DeletedAt != null && g.DeletedAt < retentionCutoff));

            var initiativesDeleted = await DeleteOrRemoveRangeAsync(_db.Initiatives
                .IgnoreQueryFilters()
                .Where(i => i.IsDeleted && i.DeletedAt != null && i.DeletedAt < retentionCutoff));

            var docsDeleted = await DeleteOrRemoveRangeAsync(_db.Documents
                .IgnoreQueryFilters()
                .Where(d => d.IsDeleted && d.DeletedAt != null && d.DeletedAt < retentionCutoff));

            var workspacesDeleted = await DeleteOrRemoveRangeAsync(_db.Workspaces
                .IgnoreQueryFilters()
                .Where(w => w.IsDeleted && w.DeletedAt != null && w.DeletedAt < retentionCutoff));

            var retentionTotal = tasksDeleted + projectsDeleted + commentsDeleted
                                 + goalsDeleted + initiativesDeleted + docsDeleted + workspacesDeleted;
            needsSaveChanges |= !_db.Database.IsRelational() && retentionTotal > 0;

            if (needsSaveChanges)
            {
                await _db.SaveChangesAsync();
            }

            totalCleaned += retentionTotal;

            _logger.LogInformation(
                "Hard-deleted {Total} soft-deleted records past 90-day retention " +
                "(Tasks={Tasks}, Projects={Projects}, Comments={Comments}, Goals={Goals}, " +
                "Initiatives={Initiatives}, Documents={Docs}, Workspaces={Workspaces})",
                retentionTotal, tasksDeleted, projectsDeleted, commentsDeleted,
                goalsDeleted, initiativesDeleted, docsDeleted, workspacesDeleted);

            // ── Step 4: Redis blocklist info (informational) ──
            // Access token blocklist keys ("blocklist:at:*") and refresh token keys ("rt:*")
            // use Redis TTL for automatic expiry. This step is informational logging only.
            var redisDb = _redis.GetDatabase();
            _logger.LogInformation(
                "Redis blocklist cleanup: keys auto-expire via TTL. No manual action needed.");

            _logger.LogInformation("Cleanup job completed. Total records cleaned: {Count}", totalCleaned);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cleanup job failed");
            throw;
        }
    }

    private async Task<int> MarkExpiredInvitationsAsync(DateTime now)
    {
        var query = _db.Invitations
            .IgnoreQueryFilters()
            .Where(i => i.Status == InvitationStatus.Pending && i.ExpiresAt < now);

        if (_db.Database.IsRelational())
        {
            return await query.ExecuteUpdateAsync(u => u.SetProperty(i => i.Status, InvitationStatus.Expired));
        }

        var expiredInvitations = await query.ToListAsync();
        foreach (var invitation in expiredInvitations)
        {
            invitation.Status = InvitationStatus.Expired;
        }

        return expiredInvitations.Count;
    }

    private async Task<int> DeleteOrRemoveRangeAsync<TEntity>(IQueryable<TEntity> query)
        where TEntity : class
    {
        if (_db.Database.IsRelational())
        {
            return await query.ExecuteDeleteAsync();
        }

        var totalDeleted = 0;

        while (true)
        {
            var entities = await query.Take(DeleteBatchSize).ToListAsync();
            if (entities.Count == 0)
                return totalDeleted;

            _db.Set<TEntity>().RemoveRange(entities);
            totalDeleted += entities.Count;
            await _db.SaveChangesAsync();

            if (entities.Count < DeleteBatchSize)
                return totalDeleted;
        }
    }
}
