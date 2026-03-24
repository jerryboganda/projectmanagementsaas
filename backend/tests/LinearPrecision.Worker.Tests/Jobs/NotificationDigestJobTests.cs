using FluentAssertions;
using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Worker.Jobs;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace LinearPrecision.Worker.Tests.Jobs;

public class NotificationDigestJobTests
{
    [Fact]
    public async Task SendDigestsAsync_should_complete_without_error_when_no_preferences()
    {
        using var db = TestDbContextFactory.Create();
        var logger = Substitute.For<ILogger<NotificationDigestJob>>();
        var emailService = Substitute.For<IEmailService>();
        var job = new NotificationDigestJob(logger, db, emailService);

        var action = () => job.SendDigestsAsync();
        await action.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SendDigestsAsync_should_mark_notifications_as_email_sent()
    {
        using var db = TestDbContextFactory.Create();
        var logger = Substitute.For<ILogger<NotificationDigestJob>>();
        var emailService = Substitute.For<IEmailService>();

        var userId = Guid.CreateVersion7();
        var wsId = Guid.CreateVersion7();

        // Seed a user so the digest job can look up their email
        db.Users.Add(new User
        {
            Id = userId,
            UserName = "testuser",
            Email = "test@example.com",
            NormalizedUserName = "TESTUSER",
            NormalizedEmail = "TEST@EXAMPLE.COM",
            FullName = "Test User",
        });

        // Seed a notification preference with email enabled
        db.NotificationPreferences.Add(new NotificationPreference
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = wsId,
            UserId = userId,
            EventType = "task_assigned",
            Email = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });

        // Seed an unread, un-emailed notification from within the last 24h
        var notificationId = Guid.CreateVersion7();
        db.Notifications.Add(new Notification
        {
            Id = notificationId,
            WorkspaceId = wsId,
            RecipientId = userId,
            Type = "task_assigned",
            Title = "You were assigned a task",
            IsRead = false,
            EmailSent = false,
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            UpdatedAt = DateTime.UtcNow.AddHours(-1),
        });

        await db.SaveChangesAsync();

        var job = new NotificationDigestJob(logger, db, emailService);
        await job.SendDigestsAsync();

        var notification = await db.Notifications.FindAsync(notificationId);
        notification!.EmailSent.Should().BeTrue();
        notification.EmailSentAt.Should().NotBeNull();

        // Verify email was actually sent
        await emailService.Received(1).SendAsync(
            "test@example.com",
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }
}
