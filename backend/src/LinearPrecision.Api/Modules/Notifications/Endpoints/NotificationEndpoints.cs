using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Notifications.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Notifications.Endpoints;

public static class NotificationEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/notifications")
            .WithTags("Notifications")
            .RequireAuthorization();

        group.MapGet("/", ListNotifications)
            .WithName("ListNotifications")
            .Produces<List<NotificationResponse>>(StatusCodes.Status200OK);

        group.MapPut("/{id:guid}/read", MarkNotificationRead)
            .WithName("MarkNotificationRead")
            .Produces<NotificationResponse>(StatusCodes.Status200OK);

        group.MapPut("/{id:guid}/archive", ArchiveNotification)
            .WithName("ArchiveNotification")
            .Produces<NotificationResponse>(StatusCodes.Status200OK);

        group.MapPut("/read-all", MarkAllRead)
            .WithName("MarkAllNotificationsRead")
            .Produces<MarkAllReadResponse>(StatusCodes.Status200OK);
    }

    // ── GET /api/v1/notifications ──
    private static async Task<IResult> ListNotifications(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        bool? isRead = null,
        bool isArchived = false,
        string? type = null,
        int page = 1,
        int pageSize = 25)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var query = db.Notifications.AsNoTracking()
            .Where(n => n.RecipientId == userId && n.IsArchived == isArchived);

        if (isRead.HasValue)
            query = query.Where(n => n.IsRead == isRead.Value);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(n => n.Type == type);

        var effectivePageSize = Math.Min(pageSize, 100);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(n => ToResponse(
                n,
                n.Actor != null
                    ? new UserBriefResponse(n.Actor.Id, n.Actor.FullName, n.Actor.AvatarUrl)
                    : null))
            .ToListAsync(ct);

        return Results.Ok(notifications);
    }

    // ── PUT /api/v1/notifications/{id}/read ──
    private static async Task<IResult> MarkNotificationRead(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var notification = await db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientId == userId, ct);

        if (notification is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Notification with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        // Reload actor for response
        UserBriefResponse? actor = null;
        if (notification.ActorId.HasValue)
        {
            actor = await db.Users.AsNoTracking()
                .Where(u => u.Id == notification.ActorId.Value)
                .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
                .FirstOrDefaultAsync(ct);
        }

        return Results.Ok(ToResponse(notification, actor));
    }

    // ── PUT /api/v1/notifications/{id}/archive ──
    private static async Task<IResult> ArchiveNotification(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var notification = await db.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientId == userId, ct);

        if (notification is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Notification with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        notification.IsArchived = true;
        notification.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        UserBriefResponse? actor = null;
        if (notification.ActorId.HasValue)
        {
            actor = await db.Users.AsNoTracking()
                .Where(u => u.Id == notification.ActorId.Value)
                .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
                .FirstOrDefaultAsync(ct);
        }

        return Results.Ok(ToResponse(notification, actor));
    }

    // ── PUT /api/v1/notifications/read-all ──
    private static async Task<IResult> MarkAllRead(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var now = DateTime.UtcNow;

        var updatedCount = await db.Notifications
            .Where(n => n.RecipientId == userId && !n.IsArchived && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, now), ct);

        return Results.Ok(new MarkAllReadResponse(updatedCount));
    }

    private static NotificationResponse ToResponse(
        LinearPrecision.Api.Entities.Notification notification,
        UserBriefResponse? actor)
    {
        return new NotificationResponse(
            notification.Id,
            notification.RecipientId,
            notification.Type,
            notification.Title,
            notification.Body,
            notification.EntityType,
            notification.EntityId,
            actor,
            notification.IsRead,
            notification.ReadAt,
            notification.IsArchived,
            notification.CreatedAt);
    }
}
