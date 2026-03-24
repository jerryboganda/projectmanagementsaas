using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Notifications.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Notifications.Endpoints;

public static class NotificationPreferenceEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/notifications/preferences")
            .WithTags("Notification Preferences")
            .RequireAuthorization();

        group.MapGet("/", GetPreferences)
            .WithName("GetNotificationPreferences")
            .Produces<List<NotificationPreferenceResponse>>(StatusCodes.Status200OK);

        group.MapPut("/", UpdatePreferences)
            .WithName("UpdateNotificationPreferences")
            .Produces<List<NotificationPreferenceResponse>>(StatusCodes.Status200OK);
    }

    // ── GET /api/v1/notifications/preferences ──
    private static async Task<IResult> GetPreferences(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var preferences = await db.NotificationPreferences.AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.EventType)
            .Select(p => new NotificationPreferenceResponse(
                p.Id,
                p.EventType,
                p.InApp,
                p.Email,
                p.Push))
            .ToListAsync(ct);

        return Results.Ok(preferences);
    }

    // ── PUT /api/v1/notifications/preferences ──
    private static async Task<IResult> UpdatePreferences(
        UpdatePreferencesRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var existingPreferences = await db.NotificationPreferences
            .Where(p => p.UserId == userId)
            .ToListAsync(ct);

        var existingByEventType = existingPreferences.ToDictionary(p => p.EventType);

        foreach (var item in request.Preferences)
        {
            if (existingByEventType.TryGetValue(item.EventType, out var existing))
            {
                // Update existing preference
                existing.InApp = item.InApp;
                existing.Email = item.Email;
                existing.Push = item.Push;
            }
            else
            {
                // Insert new preference
                db.NotificationPreferences.Add(new NotificationPreference
                {
                    UserId = userId,
                    EventType = item.EventType,
                    InApp = item.InApp,
                    Email = item.Email,
                    Push = item.Push
                });
            }
        }

        await db.SaveChangesAsync(ct);

        // Return all preferences for the user
        var preferences = await db.NotificationPreferences.AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.EventType)
            .Select(p => new NotificationPreferenceResponse(
                p.Id,
                p.EventType,
                p.InApp,
                p.Email,
                p.Push))
            .ToListAsync(ct);

        return Results.Ok(preferences);
    }
}
