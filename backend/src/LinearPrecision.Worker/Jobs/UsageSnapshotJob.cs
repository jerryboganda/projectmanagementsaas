using Hangfire;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LinearPrecision.Worker.Jobs;

/// <summary>
/// Aggregates workspace usage metrics for billing enforcement and dashboard reporting.
/// Records counts of members, projects, tasks, storage used, and automations
/// into UsageRecord entries per workspace per day.
/// </summary>
public class UsageSnapshotJob
{
    private readonly ILogger<UsageSnapshotJob> _logger;
    private readonly AppDbContext _db;

    public UsageSnapshotJob(ILogger<UsageSnapshotJob> logger, AppDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [AutomaticRetry(Attempts = 2)]
    [Queue("default")]
    public async Task AggregateUsageAsync()
    {
        _logger.LogInformation("Starting usage snapshot job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            var today = DateTime.UtcNow.Date;
            var period = today.ToString("yyyy-MM-dd");

            // Query all non-deleted workspaces (cross-tenant, bypassing soft-delete filter)
            var workspaces = await _db.Workspaces
                .IgnoreQueryFilters()
                .Where(w => !w.IsDeleted)
                .Select(w => new { w.Id })
                .ToListAsync();

            var processedCount = 0;

            foreach (var workspace in workspaces)
            {
                var wsId = workspace.Id;

                // Compute metrics for this workspace
                var memberCount = await _db.Memberships
                    .IgnoreQueryFilters()
                    .CountAsync(m => m.WorkspaceId == wsId);

                var projectCount = await _db.Projects
                    .IgnoreQueryFilters()
                    .CountAsync(p => p.WorkspaceId == wsId && !p.IsDeleted);

                var taskCount = await _db.TaskItems
                    .IgnoreQueryFilters()
                    .CountAsync(t => t.WorkspaceId == wsId && !t.IsDeleted);

                var storageBytes = await _db.FileAttachments
                    .IgnoreQueryFilters()
                    .Where(f => f.WorkspaceId == wsId)
                    .SumAsync(f => f.SizeBytes);

                var automationCount = await _db.AutomationRules
                    .IgnoreQueryFilters()
                    .CountAsync(a => a.WorkspaceId == wsId);

                // Upsert usage records per metric
                await UpsertUsageRecordAsync(wsId, "members", memberCount, period, today);
                await UpsertUsageRecordAsync(wsId, "projects", projectCount, period, today);
                await UpsertUsageRecordAsync(wsId, "tasks", taskCount, period, today);
                await UpsertUsageRecordAsync(wsId, "storage_bytes", storageBytes, period, today);
                await UpsertUsageRecordAsync(wsId, "automations", automationCount, period, today);

                processedCount++;
            }

            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Usage snapshot job completed. Processed {Count} workspaces", processedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Usage snapshot job failed");
            throw;
        }
    }

    private async Task UpsertUsageRecordAsync(
        Guid workspaceId, string metricName, long value, string period, DateTime recordedAt)
    {
        var existing = await _db.UsageRecords
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r =>
                r.WorkspaceId == workspaceId
                && r.MetricName == metricName
                && r.Period == period);

        if (existing is not null)
        {
            existing.Value = value;
            existing.RecordedAt = recordedAt;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.UsageRecords.Add(new UsageRecord
            {
                Id = Guid.CreateVersion7(),
                WorkspaceId = workspaceId,
                MetricName = metricName,
                Value = value,
                Period = period,
                RecordedAt = recordedAt,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }
    }
}
