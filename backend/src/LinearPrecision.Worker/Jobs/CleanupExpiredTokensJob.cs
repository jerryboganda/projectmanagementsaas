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
    [Queue("cleanup")]
    public async Task CleanupAsync()
    {
        _logger.LogInformation("Starting cleanup job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            var totalCleaned = 0;

            // ── Step 1: Mark expired invitations ──
            var expiredInvitations = await _db.Invitations
                .IgnoreQueryFilters()
                .Where(i => i.Status == InvitationStatus.Pending && i.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();

            foreach (var invitation in expiredInvitations)
            {
                invitation.Status = InvitationStatus.Expired;
            }

            if (expiredInvitations.Count > 0)
            {
                await _db.SaveChangesAsync();
                totalCleaned += expiredInvitations.Count;
                _logger.LogInformation("Marked {Count} expired invitations", expiredInvitations.Count);
            }

            // ── Step 2: Purge audit events older than 1 year ──
            var auditCutoff = DateTime.UtcNow.AddYears(-1);
            var staleAudits = await _db.AuditEvents
                .IgnoreQueryFilters()
                .Where(a => a.CreatedAt < auditCutoff)
                .ToListAsync();

            if (staleAudits.Count > 0)
            {
                _db.AuditEvents.RemoveRange(staleAudits);
                await _db.SaveChangesAsync();
            }

            totalCleaned += staleAudits.Count;
            _logger.LogInformation("Purged {Count} audit events older than 1 year", staleAudits.Count);

            // ── Step 3: Hard-delete soft-deleted records past 90-day retention ──
            var retentionCutoff = DateTime.UtcNow.AddDays(-90);

            var staleTasks = await _db.TaskItems
                .IgnoreQueryFilters()
                .Where(t => t.IsDeleted && t.DeletedAt != null && t.DeletedAt < retentionCutoff)
                .ToListAsync();
            _db.TaskItems.RemoveRange(staleTasks);
            var tasksDeleted = staleTasks.Count;

            var staleProjects = await _db.Projects
                .IgnoreQueryFilters()
                .Where(p => p.IsDeleted && p.DeletedAt != null && p.DeletedAt < retentionCutoff)
                .ToListAsync();
            _db.Projects.RemoveRange(staleProjects);
            var projectsDeleted = staleProjects.Count;

            var staleComments = await _db.TaskComments
                .IgnoreQueryFilters()
                .Where(c => c.IsDeleted && c.DeletedAt != null && c.DeletedAt < retentionCutoff)
                .ToListAsync();
            _db.TaskComments.RemoveRange(staleComments);
            var commentsDeleted = staleComments.Count;

            var staleGoals = await _db.Goals
                .IgnoreQueryFilters()
                .Where(g => g.IsDeleted && g.DeletedAt != null && g.DeletedAt < retentionCutoff)
                .ToListAsync();
            _db.Goals.RemoveRange(staleGoals);
            var goalsDeleted = staleGoals.Count;

            var staleInitiatives = await _db.Initiatives
                .IgnoreQueryFilters()
                .Where(i => i.IsDeleted && i.DeletedAt != null && i.DeletedAt < retentionCutoff)
                .ToListAsync();
            _db.Initiatives.RemoveRange(staleInitiatives);
            var initiativesDeleted = staleInitiatives.Count;

            var staleDocs = await _db.Documents
                .IgnoreQueryFilters()
                .Where(d => d.IsDeleted && d.DeletedAt != null && d.DeletedAt < retentionCutoff)
                .ToListAsync();
            _db.Documents.RemoveRange(staleDocs);
            var docsDeleted = staleDocs.Count;

            var staleWorkspaces = await _db.Workspaces
                .IgnoreQueryFilters()
                .Where(w => w.IsDeleted && w.DeletedAt != null && w.DeletedAt < retentionCutoff)
                .ToListAsync();
            _db.Workspaces.RemoveRange(staleWorkspaces);
            var workspacesDeleted = staleWorkspaces.Count;

            if (tasksDeleted + projectsDeleted + commentsDeleted + goalsDeleted
                + initiativesDeleted + docsDeleted + workspacesDeleted > 0)
            {
                await _db.SaveChangesAsync();
            }

            var retentionTotal = tasksDeleted + projectsDeleted + commentsDeleted
                                 + goalsDeleted + initiativesDeleted + docsDeleted + workspacesDeleted;
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
}
