namespace LinearPrecision.Api.Modules.Analytics.Models;

public sealed record VelocitySprintData(
    Guid SprintId,
    string Name,
    int? PlannedPoints,
    int? CompletedPoints,
    DateOnly StartDate,
    DateOnly EndDate);

public sealed record VelocityResponse(
    Guid? ProjectId,
    List<VelocitySprintData> Sprints,
    decimal AverageVelocity);

public sealed record BurndownResponse(
    Guid SprintId,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    int TotalPoints,
    int CompletedPoints,
    int RemainingPoints);

public sealed record WorkloadMember(
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    int AssignedTasks,
    int CompletedTasks,
    int TotalPoints,
    decimal TotalHoursLogged);

public sealed record WorkloadResponse(List<WorkloadMember> Members);
