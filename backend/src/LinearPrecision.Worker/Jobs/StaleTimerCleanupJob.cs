using Hangfire;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LinearPrecision.Worker.Jobs;

/// <summary>
/// Detects and auto-stops stale time tracking entries that have been running
/// for over 12 hours without activity, indicating the user forgot to stop the timer.
/// Creates a notification for each affected user.
/// </summary>
public class StaleTimerCleanupJob
{
    private const int CleanupBatchSize = 500;

    private readonly ILogger<StaleTimerCleanupJob> _logger;
    private readonly AppDbContext _db;
    private static readonly TimeSpan StaleThreshold = TimeSpan.FromHours(12);

    public StaleTimerCleanupJob(ILogger<StaleTimerCleanupJob> logger, AppDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    [AutomaticRetry(Attempts = 1)]
    [DisableConcurrentExecution(60 * 60)]
    [Queue("cleanup")]
    public async Task CleanupStaleTimersAsync()
    {
        _logger.LogInformation("Starting stale timer cleanup job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            var cutoff = DateTime.UtcNow - StaleThreshold;
            var totalStopped = 0;

            while (true)
            {
                var staleTimers = await _db.TimeEntries
                    .IgnoreQueryFilters()
                    .Where(te => te.EndTime == null && te.StartTime < cutoff)
                    .OrderBy(te => te.StartTime)
                    .Take(CleanupBatchSize)
                    .ToListAsync();

                if (staleTimers.Count == 0)
                {
                    if (totalStopped == 0)
                    {
                        _logger.LogInformation("No stale timers found. Skipping.");
                    }

                    break;
                }

                foreach (var timer in staleTimers)
                {
                    // Auto-stop: set EndTime to StartTime + 12h, calculate duration
                    timer.EndTime = timer.StartTime + StaleThreshold;
                    timer.DurationMinutes = (int)StaleThreshold.TotalMinutes; // 720

                    // Append auto-stop note to description
                    timer.Description = string.IsNullOrEmpty(timer.Description)
                        ? "[Auto-stopped: stale timer]"
                        : timer.Description + " [Auto-stopped: stale timer]";

                    // Create notification for the affected user
                    _db.Notifications.Add(new Notification
                    {
                        Id = Guid.CreateVersion7(),
                        WorkspaceId = timer.WorkspaceId,
                        RecipientId = timer.UserId,
                        Type = "timer_auto_stopped",
                        Title = "Timer auto-stopped",
                        Body = $"Your time entry running since {timer.StartTime:g} was automatically stopped after {StaleThreshold.TotalHours} hours.",
                        EntityType = "TimeEntry",
                        EntityId = timer.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                    });

                    _logger.LogDebug(
                        "Auto-stopped stale timer {TimerId} for user {UserId} in workspace {WorkspaceId}",
                        timer.Id, timer.UserId, timer.WorkspaceId);
                }

                await _db.SaveChangesAsync();
                totalStopped += staleTimers.Count;
                _db.ChangeTracker.Clear();

                if (staleTimers.Count < CleanupBatchSize)
                {
                    break;
                }
            }

            _logger.LogInformation(
                "Stale timer cleanup completed. Stopped {Count} stale timers", totalStopped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stale timer cleanup job failed");
            throw;
        }
    }
}
