using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Sprints.Models;

public sealed record CreateSprintRequest(
    string Name,
    string? Goal,
    DateOnly StartDate,
    DateOnly EndDate);

public sealed record UpdateSprintRequest(
    string Name,
    string? Goal,
    DateOnly StartDate,
    DateOnly EndDate);

public sealed record SprintResponse(
    Guid Id,
    Guid ProjectId,
    string Name,
    string? Goal,
    SprintStatus Status,
    DateOnly StartDate,
    DateOnly EndDate,
    int? PlannedPoints,
    int? CompletedPoints,
    int TaskCount,
    int CompletedTaskCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);
