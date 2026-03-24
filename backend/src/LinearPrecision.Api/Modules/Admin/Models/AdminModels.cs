using System.Text.Json;

namespace LinearPrecision.Api.Modules.Admin.Models;

public sealed record AuditEventResponse(
    Guid Id,
    Guid? ActorId,
    string? ActorName,
    string Action,
    string EntityType,
    Guid? EntityId,
    JsonDocument? OldValues,
    JsonDocument? NewValues,
    string? IpAddress,
    string? UserAgent,
    DateTime CreatedAt);

public sealed record CreateFeatureFlagRequest(
    string Key,
    string? Description,
    bool? IsEnabled,
    Guid? WorkspaceId,
    int? RolloutPercentage,
    JsonDocument? Conditions);

public sealed record UpdateFeatureFlagRequest(
    string Key,
    string? Description,
    bool? IsEnabled,
    Guid? WorkspaceId,
    int? RolloutPercentage,
    JsonDocument? Conditions);

public sealed record FeatureFlagResponse(
    Guid Id,
    string Key,
    string? Description,
    bool IsEnabled,
    Guid? WorkspaceId,
    int? RolloutPercentage,
    JsonDocument? Conditions,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record WorkspaceStatsResponse(
    int TotalWorkspaces,
    int TotalMembers,
    int TotalProjects,
    int TotalTasks,
    int TotalDocuments,
    int TotalFiles,
    long TotalStorageBytes,
    int ActiveSubscriptions);
