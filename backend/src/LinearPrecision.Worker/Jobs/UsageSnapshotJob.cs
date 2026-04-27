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
    [DisableConcurrentExecution(60 * 60)]
    [Queue("default")]
    public async Task AggregateUsageAsync()
    {
        _logger.LogInformation("Starting usage snapshot job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            var today = DateTime.UtcNow.Date;
            var period = today.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);

            // Query all non-deleted workspaces (cross-tenant, bypassing soft-delete filter)
            var workspaces = await _db.Workspaces
                .IgnoreQueryFilters()
                .Where(w => !w.IsDeleted)
                .Select(w => w.Id)
                .ToListAsync();

            var processedCount = 0;

            if (workspaces.Count == 0)
            {
                _logger.LogInformation("No workspaces found for usage snapshot. Skipping.");
                return;
            }

            // Gather aggregated metrics in set-based queries (one per metric type)
            var memberCounts = await _db.Memberships
                .IgnoreQueryFilters()
                .Where(m => workspaces.Contains(m.WorkspaceId))
                .GroupBy(m => m.WorkspaceId)
                .Select(g => new { WorkspaceId = g.Key, Count = g.LongCount() })
                .ToDictionaryAsync(g => g.WorkspaceId, g => g.Count);

            var projectCounts = await _db.Projects
                .IgnoreQueryFilters()
                .Where(p => workspaces.Contains(p.WorkspaceId) && !p.IsDeleted)
                .GroupBy(p => p.WorkspaceId)
                .Select(g => new { WorkspaceId = g.Key, Count = g.LongCount() })
                .ToDictionaryAsync(g => g.WorkspaceId, g => g.Count);

            var taskCounts = await _db.TaskItems
                .IgnoreQueryFilters()
                .Where(t => workspaces.Contains(t.WorkspaceId) && !t.IsDeleted)
                .GroupBy(t => t.WorkspaceId)
                .Select(g => new { WorkspaceId = g.Key, Count = g.LongCount() })
                .ToDictionaryAsync(g => g.WorkspaceId, g => g.Count);

            var storageSums = await _db.FileAttachments
                .IgnoreQueryFilters()
                .Where(f => workspaces.Contains(f.WorkspaceId))
                .GroupBy(f => f.WorkspaceId)
                .Select(g => new { WorkspaceId = g.Key, Sum = g.Sum(x => (long?)x.SizeBytes) ?? 0L })
                .ToDictionaryAsync(g => g.WorkspaceId, g => g.Sum);

            var automationCounts = await _db.AutomationRules
                .IgnoreQueryFilters()
                .Where(a => workspaces.Contains(a.WorkspaceId))
                .GroupBy(a => a.WorkspaceId)
                .Select(g => new { WorkspaceId = g.Key, Count = g.LongCount() })
                .ToDictionaryAsync(g => g.WorkspaceId, g => g.Count);

            // Load existing usage records for this period to avoid per-record queries
            var existingRecords = await _db.UsageRecords
                .IgnoreQueryFilters()
                .Where(r => r.Period == period && workspaces.Contains(r.WorkspaceId))
                .ToListAsync();

            var updatedAt = DateTime.UtcNow;
            var existingDict = new Dictionary<(Guid WorkspaceId, string MetricName), UsageRecord>();
            var duplicateRecords = new List<UsageRecord>();

            foreach (var group in existingRecords.GroupBy(r => (r.WorkspaceId, r.MetricName)))
            {
                var orderedRecords = group
                    .OrderByDescending(r => r.UpdatedAt)
                    .ThenByDescending(r => r.CreatedAt)
                    .ThenByDescending(r => r.Id)
                    .ToList();

                existingDict[group.Key] = orderedRecords[0];
                duplicateRecords.AddRange(orderedRecords.Skip(1));
            }

            if (duplicateRecords.Count > 0)
            {
                _db.UsageRecords.RemoveRange(duplicateRecords);
                _logger.LogWarning(
                    "Removed {Count} duplicate usage records for period {Period}",
                    duplicateRecords.Count,
                    period);
            }

            foreach (var wsId in workspaces)
            {
                memberCounts.TryGetValue(wsId, out var memberCount);
                projectCounts.TryGetValue(wsId, out var projectCount);
                taskCounts.TryGetValue(wsId, out var taskCount);
                storageSums.TryGetValue(wsId, out var storageBytes);
                automationCounts.TryGetValue(wsId, out var automationCount);

                void upsert(string metricName, long value)
                {
                    var key = (WorkspaceId: wsId, MetricName: metricName);
                    if (existingDict.TryGetValue(key, out var rec))
                    {
                        rec.Value = value;
                        rec.RecordedAt = today;
                        rec.UpdatedAt = updatedAt;
                    }
                    else
                    {
                        var nr = new UsageRecord
                        {
                            Id = Guid.CreateVersion7(),
                            WorkspaceId = wsId,
                            MetricName = metricName,
                            Value = value,
                            Period = period,
                            RecordedAt = today,
                            CreatedAt = updatedAt,
                            UpdatedAt = updatedAt
                        };
                        _db.UsageRecords.Add(nr);
                    }
                }

                upsert("members", memberCount);
                upsert("projects", projectCount);
                upsert("tasks", taskCount);
                upsert("storage_bytes", storageBytes);
                upsert("automations", automationCount);

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

}
