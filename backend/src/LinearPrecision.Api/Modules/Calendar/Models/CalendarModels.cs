using LinearPrecision.Shared.Domain.Enums;

namespace LinearPrecision.Api.Modules.Calendar.Models;

public sealed record CreateCalendarItemRequest(
    string Title,
    string? Description,
    CalendarItemType Type,
    string? Color,
    DateTime StartTime,
    DateTime EndTime,
    bool? IsAllDay,
    string? RecurrenceRule,
    Guid? LinkedTaskId,
    Guid? LinkedProjectId);

public sealed record UpdateCalendarItemRequest(
    string Title,
    string? Description,
    CalendarItemType Type,
    string? Color,
    DateTime StartTime,
    DateTime EndTime,
    bool? IsAllDay,
    string? RecurrenceRule,
    Guid? LinkedTaskId,
    Guid? LinkedProjectId);

public sealed record CalendarItemResponse(
    Guid Id,
    string Title,
    string? Description,
    CalendarItemType Type,
    string? Color,
    DateTime StartTime,
    DateTime EndTime,
    bool IsAllDay,
    string? RecurrenceRule,
    Guid? LinkedTaskId,
    Guid? LinkedProjectId,
    UserBriefResponse Creator,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record UserBriefResponse(
    Guid Id,
    string FullName,
    string? AvatarUrl);
