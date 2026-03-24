using System.Text.Json;
using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Projects.Models;

// ── Response DTOs ──
public sealed record ProjectResponse(
    Guid Id,
    Guid WorkspaceId,
    string Name,
    string Identifier,
    string? Description,
    string? Color,
    string? IconUrl,
    ProjectStatus Status,
    ProjectVisibility Visibility,
    UserBriefResponse? Lead,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    int SortOrder,
    int TaskCount,
    int CompletedTaskCount,
    bool IsFavorited,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record ProjectDetailResponse(
    Guid Id,
    Guid WorkspaceId,
    string Name,
    string Identifier,
    string? Description,
    string? Color,
    string? IconUrl,
    ProjectStatus Status,
    ProjectVisibility Visibility,
    UserBriefResponse? Lead,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    int SortOrder,
    int TaskCount,
    int CompletedTaskCount,
    int OpenTaskCount,
    int MemberCount,
    bool IsFavorited,
    JsonDocument? Metadata,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserBriefResponse(
    Guid Id,
    string FullName,
    string? AvatarUrl);

public sealed record ProjectActivityResponse(
    Guid Id,
    string Action,
    string EntityType,
    Guid? EntityId,
    Guid? ActorId,
    string? ActorName,
    DateTime CreatedAt);

public sealed record ProjectMetricsResponse(
    Guid ProjectId,
    int TaskCount,
    int CompletedTaskCount,
    int OpenTaskCount,
    int OverdueTaskCount,
    int MemberCount);

public sealed record FavoriteToggleResponse(
    bool IsFavorited);

// ── Request DTOs ──
public sealed record CreateProjectRequest(
    string Name,
    string Identifier,
    string? Description,
    string? Color,
    string? IconUrl,
    ProjectStatus? Status,
    ProjectVisibility? Visibility,
    Guid? LeadId,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    JsonDocument? Metadata);

public sealed record UpdateProjectRequest(
    string Name,
    string Identifier,
    string? Description,
    string? Color,
    string? IconUrl,
    ProjectStatus Status,
    ProjectVisibility Visibility,
    Guid? LeadId,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    int? SortOrder,
    JsonDocument? Metadata);

public sealed record CreateFromTemplateRequest(
    Guid TemplateId,
    string Name,
    string Identifier,
    string? Description,
    Guid? LeadId,
    DateOnly? StartDate,
    DateOnly? TargetDate);
