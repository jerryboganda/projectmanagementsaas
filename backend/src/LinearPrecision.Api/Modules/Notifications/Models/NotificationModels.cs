namespace LinearPrecision.Api.Modules.Notifications.Models;

// ── Response DTOs ──
public sealed record NotificationResponse(
    Guid Id,
    Guid RecipientId,
    string Type,
    string Title,
    string? Body,
    string? EntityType,
    Guid? EntityId,
    UserBriefResponse? Actor,
    bool IsRead,
    DateTime? ReadAt,
    bool IsArchived,
    DateTime CreatedAt);

public sealed record UserBriefResponse(
    Guid Id,
    string FullName,
    string? AvatarUrl);

public sealed record MarkAllReadResponse(int UpdatedCount);

public sealed record NotificationPreferenceResponse(
    Guid Id,
    string EventType,
    bool InApp,
    bool Email,
    bool Push);

// ── Request DTOs ──
public sealed record UpdatePreferencesRequest(List<PreferenceItem> Preferences);

public sealed record PreferenceItem(
    string EventType,
    bool InApp,
    bool Email,
    bool Push);
