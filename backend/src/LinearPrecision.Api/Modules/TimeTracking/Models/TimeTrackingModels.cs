namespace LinearPrecision.Api.Modules.TimeTracking.Models;

public sealed record CreateTimeEntryRequest(
    Guid? TaskId,
    Guid? ProjectId,
    string? Description,
    DateTime StartTime,
    DateTime? EndTime,
    int? DurationMinutes,
    bool? IsBillable,
    decimal? HourlyRate);

public sealed record UpdateTimeEntryRequest(
    Guid? TaskId,
    Guid? ProjectId,
    string? Description,
    DateTime StartTime,
    DateTime? EndTime,
    int? DurationMinutes,
    bool? IsBillable,
    decimal? HourlyRate);

public sealed record StartTimerRequest(
    Guid? TaskId,
    Guid? ProjectId,
    string? Description,
    bool? IsBillable);

public sealed record TimeEntryResponse(
    Guid Id,
    UserBriefResponse User,
    Guid? TaskId,
    Guid? ProjectId,
    string? Description,
    DateTime StartTime,
    DateTime? EndTime,
    int DurationMinutes,
    bool IsBillable,
    decimal? HourlyRate,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserBriefResponse(
    Guid Id,
    string FullName,
    string? AvatarUrl);
