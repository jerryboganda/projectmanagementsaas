using FluentAssertions;
using LinearPrecision.Api.Entities;
using LinearPrecision.Worker.Jobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace LinearPrecision.Worker.Tests.Jobs;

public class StaleTimerCleanupJobTests
{
    [Fact]
    public async Task CleanupStaleTimersAsync_should_complete_without_error_when_no_timers()
    {
        using var db = TestDbContextFactory.Create();
        var logger = Substitute.For<ILogger<StaleTimerCleanupJob>>();
        var job = new StaleTimerCleanupJob(logger, db);

        var action = () => job.CleanupStaleTimersAsync();
        await action.Should().NotThrowAsync();
    }

    [Fact]
    public async Task CleanupStaleTimersAsync_should_auto_stop_stale_timer_and_create_notification()
    {
        using var db = TestDbContextFactory.Create();
        var logger = Substitute.For<ILogger<StaleTimerCleanupJob>>();

        var userId = Guid.CreateVersion7();
        var wsId = Guid.CreateVersion7();
        var timerId = Guid.CreateVersion7();

        // Seed a running timer started 15 hours ago (stale: > 12h threshold)
        db.TimeEntries.Add(new TimeEntry
        {
            Id = timerId,
            WorkspaceId = wsId,
            UserId = userId,
            StartTime = DateTime.UtcNow.AddHours(-15),
            EndTime = null, // Still running
            DurationMinutes = 0,
            IsBillable = false,
            CreatedAt = DateTime.UtcNow.AddHours(-15),
            UpdatedAt = DateTime.UtcNow.AddHours(-15),
        });

        await db.SaveChangesAsync();

        var job = new StaleTimerCleanupJob(logger, db);
        await job.CleanupStaleTimersAsync();

        // Verify timer was auto-stopped
        var timer = await db.TimeEntries
            .IgnoreQueryFilters()
            .FirstAsync(t => t.Id == timerId);
        timer.EndTime.Should().NotBeNull();
        timer.DurationMinutes.Should().Be(720); // 12 hours
        timer.Description.Should().Contain("[Auto-stopped: stale timer]");

        // Verify notification was created
        var notification = await db.Notifications
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(n => n.RecipientId == userId && n.Type == "timer_auto_stopped");
        notification.Should().NotBeNull();
        notification!.EntityId.Should().Be(timerId);
    }
}
