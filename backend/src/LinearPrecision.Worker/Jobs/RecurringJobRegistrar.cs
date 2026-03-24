using Hangfire;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace LinearPrecision.Worker.Jobs;

/// <summary>
/// Hosted service that registers all recurring Hangfire jobs on startup.
/// This runs once when the Worker service starts and configures the
/// cron-based schedules for all periodic background jobs.
/// </summary>
public class RecurringJobRegistrar : IHostedService
{
    private readonly ILogger<RecurringJobRegistrar> _logger;

    public RecurringJobRegistrar(ILogger<RecurringJobRegistrar> logger)
    {
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Registering recurring Hangfire jobs...");

        // Notification digest — daily at 08:00 UTC
        RecurringJob.AddOrUpdate<NotificationDigestJob>(
            "notification-digest",
            job => job.SendDigestsAsync(),
            Cron.Daily(8, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        // Cleanup expired tokens & stale data — daily at 03:00 UTC
        RecurringJob.AddOrUpdate<CleanupExpiredTokensJob>(
            "cleanup-expired-tokens",
            job => job.CleanupAsync(),
            Cron.Daily(3, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        // Usage snapshot for billing — daily at 02:00 UTC
        RecurringJob.AddOrUpdate<UsageSnapshotJob>(
            "usage-snapshot",
            job => job.AggregateUsageAsync(),
            Cron.Daily(2, 0),
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        // Stale timer cleanup — every 6 hours
        RecurringJob.AddOrUpdate<StaleTimerCleanupJob>(
            "stale-timer-cleanup",
            job => job.CleanupStaleTimersAsync(),
            "0 */6 * * *",
            new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        _logger.LogInformation("All recurring jobs registered successfully");

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("RecurringJobRegistrar stopping");
        return Task.CompletedTask;
    }
}
