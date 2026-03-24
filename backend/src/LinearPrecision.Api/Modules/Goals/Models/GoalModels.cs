using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Goals.Models;

// ── Request DTOs ──

public sealed record CreateGoalRequest(
    string Title,
    string? Description,
    GoalStatus? Status,
    GoalType? Type,
    int? ProgressPercent,
    GoalProgressSource? ProgressSource,
    Guid? OwnerId,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    Guid? ParentGoalId);

public sealed record UpdateGoalRequest(
    string Title,
    string? Description,
    GoalStatus Status,
    GoalType Type,
    int? ProgressPercent,
    GoalProgressSource? ProgressSource,
    Guid? OwnerId,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    Guid? ParentGoalId);

public sealed record LinkProjectRequest(Guid ProjectId);

public sealed record CreateInitiativeRequest(
    string Title,
    string? Description,
    InitiativeStatus? Status,
    Guid? OwnerId,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    int? ProgressPercent);

public sealed record UpdateInitiativeRequest(
    string Title,
    string? Description,
    InitiativeStatus Status,
    Guid? OwnerId,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    int? ProgressPercent);

// ── Response DTOs ──

public sealed record GoalResponse(
    Guid Id,
    Guid WorkspaceId,
    string Title,
    string? Description,
    GoalStatus Status,
    GoalType Type,
    int ProgressPercent,
    GoalProgressSource ProgressSource,
    UserBriefResponse? Owner,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    Guid? ParentGoalId,
    List<GoalResponse>? SubGoals,
    List<GoalProjectLinkResponse>? ProjectLinks,
    List<InitiativeResponse>? Initiatives,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserBriefResponse(Guid Id, string FullName, string? AvatarUrl);

public sealed record GoalProjectLinkResponse(Guid Id, Guid GoalId, Guid ProjectId, DateTime CreatedAt);

public sealed record InitiativeResponse(
    Guid Id,
    Guid GoalId,
    string Title,
    string? Description,
    InitiativeStatus Status,
    UserBriefResponse? Owner,
    DateOnly? StartDate,
    DateOnly? TargetDate,
    int ProgressPercent,
    DateTime CreatedAt,
    DateTime UpdatedAt);
