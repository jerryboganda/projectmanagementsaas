using Hangfire;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LinearPrecision.Worker.Jobs;

/// <summary>
/// Sends daily email digests to users based on their notification preferences.
/// Aggregates unread notifications from the last 24 hours and groups them by workspace.
/// </summary>
public class NotificationDigestJob
{
    private readonly ILogger<NotificationDigestJob> _logger;
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;

    public NotificationDigestJob(
        ILogger<NotificationDigestJob> logger,
        AppDbContext db,
        IEmailService emailService)
    {
        _logger = logger;
        _db = db;
        _emailService = emailService;
    }

    [AutomaticRetry(Attempts = 1)]
    [Queue("notifications")]
    public async Task SendDigestsAsync()
    {
        _logger.LogInformation("Starting notification digest job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            // 1. Find users with email digest preferences enabled (cross-tenant)
            var usersWithEmailEnabled = await _db.NotificationPreferences
                .IgnoreQueryFilters()
                .Where(p => p.Email)
                .Select(p => new { p.UserId })
                .Distinct()
                .ToListAsync();

            if (usersWithEmailEnabled.Count == 0)
            {
                _logger.LogInformation("No users with email digest enabled. Skipping.");
                return;
            }

            var since = DateTime.UtcNow.AddHours(-24);
            var processedCount = 0;

            foreach (var record in usersWithEmailEnabled)
            {
                var userId = record.UserId;

                // 2. Fetch unread, un-emailed notifications from last 24h for this user
                var notifications = await _db.Notifications
                    .IgnoreQueryFilters()
                    .Where(n => n.RecipientId == userId
                                && !n.IsRead
                                && !n.EmailSent
                                && n.CreatedAt >= since)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                if (notifications.Count == 0)
                    continue;

                // 3. Look up user email
                var user = await _db.Users.FindAsync(userId);
                if (user is null || string.IsNullOrWhiteSpace(user.Email))
                {
                    _logger.LogWarning("User {UserId} not found or has no email — skipping digest", userId);
                    continue;
                }

                // 4. Build HTML digest body grouped by workspace
                var grouped = notifications.GroupBy(n => n.WorkspaceId).ToList();

                var rows = string.Join(string.Empty, notifications.Take(20).Select(n =>
                    $"<li style='margin-bottom:6px'>{System.Net.WebUtility.HtmlEncode(n.Title)}</li>"));

                var htmlBody = $"""
                    <html><body style="font-family:sans-serif;color:#111;max-width:600px">
                    <h2 style="color:#4f46e5">Your Daily Digest</h2>
                    <p>You have <strong>{notifications.Count}</strong> unread notification{(notifications.Count == 1 ? "" : "s")} across {grouped.Count} workspace{(grouped.Count == 1 ? "" : "s")}.</p>
                    <ul style="padding-left:20px">{rows}</ul>
                    {(notifications.Count > 20 ? $"<p>… and {notifications.Count - 20} more.</p>" : "")}
                    <p style="margin-top:24px"><a href="https://app.linearprecision.com/inbox" style="background:#4f46e5;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none">View all in Inbox</a></p>
                    <p style="font-size:12px;color:#888;margin-top:32px">Linear Precision &mdash; you're receiving this because you enabled email notifications.</p>
                    </body></html>
                    """;

                // 5. Send the digest email
                await _emailService.SendAsync(
                    user.Email,
                    $"Linear Precision: {notifications.Count} unread notification{(notifications.Count == 1 ? "" : "s")}",
                    htmlBody);

                // 6. Mark notifications as email-sent
                foreach (var notification in notifications)
                {
                    notification.EmailSent = true;
                    notification.EmailSentAt = DateTime.UtcNow;
                }

                processedCount++;

                _logger.LogDebug(
                    "Digest sent to user {UserId} — {Count} notifications across {Workspaces} workspace(s)",
                    userId, notifications.Count, grouped.Count);
            }

            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Notification digest job completed. Sent digests to {Count}/{Total} users",
                processedCount, usersWithEmailEnabled.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Notification digest job failed");
            throw;
        }
    }
}
