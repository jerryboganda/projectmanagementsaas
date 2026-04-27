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
    private const int MaxRecipientsPerRun = 100;
    private const int MaxNotificationsPerRecipient = 100;

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
    [DisableConcurrentExecution(60 * 60)]
    [Queue("notifications")]
    public async Task SendDigestsAsync()
    {
        _logger.LogInformation("Starting notification digest job at {Time}", DateTimeOffset.UtcNow);

        try
        {
            var since = DateTime.UtcNow.AddHours(-24);
            var processedCount = 0;

            // 1. Identify users with email preference enabled AND resolve their email addresses
            var eligibleRecipients = await _db.NotificationPreferences
                .IgnoreQueryFilters()
                .Where(p => p.Email)
                .Select(p => p.UserId)
                .Distinct()
                .Join(_db.Users, id => id, u => u.Id, (id, u) => new { u.Id, u.Email })
                .Where(x => x.Email != null && x.Email != string.Empty)
                .ToDictionaryAsync(x => x.Id, x => x.Email);

            if (eligibleRecipients.Count == 0)
            {
                _logger.LogInformation("No users with email digest enabled or no email addresses. Skipping.");
                return;
            }

            // 2. Process a bounded recipient batch; each recipient gets a bounded notification batch.
            var recipientIds = eligibleRecipients.Keys.ToList();
            var pendingRecipientIds = await _db.Notifications
                .IgnoreQueryFilters()
                .Where(n => recipientIds.Contains(n.RecipientId)
                            && !n.IsRead
                            && !n.EmailSent
                            && n.CreatedAt >= since)
                .GroupBy(n => n.RecipientId)
                .OrderBy(g => g.Min(n => n.CreatedAt))
                .Select(g => g.Key)
                .Take(MaxRecipientsPerRun)
                .ToListAsync();

            if (pendingRecipientIds.Count == 0)
            {
                _logger.LogInformation("No pending digest notifications found. Skipping.");
                return;
            }

            // 4. Send one bounded digest per recipient.
            foreach (var userId in pendingRecipientIds)
            {
                if (!eligibleRecipients.TryGetValue(userId, out var email) || string.IsNullOrWhiteSpace(email))
                {
                    _logger.LogWarning("User {UserId} not found or has no email — skipping digest", userId);
                    continue;
                }

                var userNotifications = await _db.Notifications
                    .IgnoreQueryFilters()
                    .Where(n => n.RecipientId == userId
                                && !n.IsRead
                                && !n.EmailSent
                                && n.CreatedAt >= since)
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(MaxNotificationsPerRecipient)
                    .ToListAsync();

                if (userNotifications.Count == 0)
                {
                    continue;
                }

                var workspaceCount = userNotifications.Select(n => n.WorkspaceId).Distinct().Count();

                var rows = string.Join(string.Empty, userNotifications.Take(20).Select(n =>
                    $"<li style='margin-bottom:6px'>{System.Net.WebUtility.HtmlEncode(n.Title)}</li>"));

                var htmlBody = $"""
                    <html><body style="font-family:sans-serif;color:#111;max-width:600px">
                    <h2 style="color:#4f46e5">Your Daily Digest</h2>
                    <p>You have <strong>{userNotifications.Count}</strong> unread notification{(userNotifications.Count == 1 ? "" : "s")} across {workspaceCount} workspace{(workspaceCount == 1 ? "" : "s")}.</p>
                    <ul style="padding-left:20px">{rows}</ul>
                    {(userNotifications.Count > 20 ? $"<p>… and {userNotifications.Count - 20} more.</p>" : "")}
                    <p style="margin-top:24px"><a href="https://app.linearprecision.com/inbox" style="background:#4f46e5;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none">View all in Inbox</a></p>
                    <p style="font-size:12px;color:#888;margin-top:32px">Linear Precision &mdash; you're receiving this because you enabled email notifications.</p>
                    </body></html>
                    """;

                // 5. Send the digest email
                await _emailService.SendAsync(
                    email,
                    $"Linear Precision: {userNotifications.Count} unread notification{(userNotifications.Count == 1 ? "" : "s")}",
                    htmlBody);

                // 6. Mark this recipient's notifications as email-sent
                foreach (var notification in userNotifications)
                {
                    notification.EmailSent = true;
                    notification.EmailSentAt = DateTime.UtcNow;
                }

                processedCount++;

                _logger.LogDebug(
                    "Digest sent to user {UserId} — {Count} notifications across {Workspaces} workspace(s)",
                    userId, userNotifications.Count, workspaceCount);
            }

            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Notification digest job completed. Sent digests to {Count}/{Total} users",
                processedCount, eligibleRecipients.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Notification digest job failed");
            throw;
        }
    }
}
