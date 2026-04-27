using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Calendar.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Calendar.Endpoints;

public static class CalendarEndpoints
{
    private const int MaxCalendarRangeDays = 366;

    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/calendar")
            .WithTags("Calendar")
            .RequireAuthorization();

        group.MapGet("/", ListCalendarItems).WithName("ListCalendarItems").RequireAuthorization(WorkspaceRoles.Member);
        group.MapPost("/", CreateCalendarItem).WithName("CreateCalendarItem").RequireAuthorization(WorkspaceRoles.Member);
        group.MapGet("/{id:guid}", GetCalendarItem).WithName("GetCalendarItem").RequireAuthorization(WorkspaceRoles.Guest);
        group.MapPut("/{id:guid}", UpdateCalendarItem).WithName("UpdateCalendarItem").RequireAuthorization(WorkspaceRoles.Member);
        group.MapDelete("/{id:guid}", DeleteCalendarItem).WithName("DeleteCalendarItem").RequireAuthorization(WorkspaceRoles.Member);
    }

    // ── GET /api/v1/calendar ──
    private static async Task<IResult> ListCalendarItems(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        DateTime? start = null,
        DateTime? end = null)
    {
        if (!start.HasValue || !end.HasValue)
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: "Both 'start' and 'end' query parameters are required.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (end.Value < start.Value)
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: "The 'end' query parameter must be greater than or equal to 'start'.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        if (end.Value - start.Value > TimeSpan.FromDays(MaxCalendarRangeDays))
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: $"Calendar range cannot exceed {MaxCalendarRangeDays} days.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var items = await db.CalendarItems.AsNoTracking()
            .Where(c => c.StartTime <= end.Value && c.EndTime >= start.Value)
            .OrderBy(c => c.StartTime)
            .Select(c => new CalendarItemResponse(
                c.Id,
                c.Title,
                c.Description,
                c.Type,
                c.Color,
                c.StartTime,
                c.EndTime,
                c.IsAllDay,
                c.RecurrenceRule,
                c.LinkedTaskId,
                c.LinkedProjectId,
                new UserBriefResponse(c.Creator.Id, c.Creator.FullName, c.Creator.AvatarUrl),
                c.CreatedAt,
                c.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(items);
    }

    // ── POST /api/v1/calendar ──
    private static async Task<IResult> CreateCalendarItem(
        CreateCalendarItemRequest request,
        IValidator<CreateCalendarItemRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var item = new CalendarItem
        {
            Title = request.Title,
            Description = request.Description,
            Type = request.Type,
            Color = request.Color,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsAllDay = request.IsAllDay ?? false,
            RecurrenceRule = request.RecurrenceRule,
            LinkedTaskId = request.LinkedTaskId,
            LinkedProjectId = request.LinkedProjectId,
            CreatorId = userId,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.CalendarItems.Add(item);
        await db.SaveChangesAsync(ct);

        var creator = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
            .FirstAsync(ct);

        var response = new CalendarItemResponse(
            item.Id, item.Title, item.Description, item.Type, item.Color,
            item.StartTime, item.EndTime, item.IsAllDay, item.RecurrenceRule,
            item.LinkedTaskId, item.LinkedProjectId,
            creator, item.CreatedAt, item.UpdatedAt);

        return Results.Created($"/api/v1/calendar/{item.Id}", response);
    }

    // ── GET /api/v1/calendar/{id} ──
    private static async Task<IResult> GetCalendarItem(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var item = await db.CalendarItems.AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CalendarItemResponse(
                c.Id,
                c.Title,
                c.Description,
                c.Type,
                c.Color,
                c.StartTime,
                c.EndTime,
                c.IsAllDay,
                c.RecurrenceRule,
                c.LinkedTaskId,
                c.LinkedProjectId,
                new UserBriefResponse(c.Creator.Id, c.Creator.FullName, c.Creator.AvatarUrl),
                c.CreatedAt,
                c.UpdatedAt))
            .FirstOrDefaultAsync(ct);

        if (item is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Calendar item with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(item);
    }

    // ── PUT /api/v1/calendar/{id} ──
    private static async Task<IResult> UpdateCalendarItem(
        Guid id,
        UpdateCalendarItemRequest request,
        IValidator<UpdateCalendarItemRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var item = await db.CalendarItems.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (item is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Calendar item with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        item.Title = request.Title;
        item.Description = request.Description;
        item.Type = request.Type;
        item.Color = request.Color;
        item.StartTime = request.StartTime;
        item.EndTime = request.EndTime;
        item.IsAllDay = request.IsAllDay ?? false;
        item.RecurrenceRule = request.RecurrenceRule;
        item.LinkedTaskId = request.LinkedTaskId;
        item.LinkedProjectId = request.LinkedProjectId;

        await db.SaveChangesAsync(ct);

        var creator = await db.Users.AsNoTracking()
            .Where(u => u.Id == item.CreatorId)
            .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
            .FirstAsync(ct);

        return Results.Ok(new CalendarItemResponse(
            item.Id, item.Title, item.Description, item.Type, item.Color,
            item.StartTime, item.EndTime, item.IsAllDay, item.RecurrenceRule,
            item.LinkedTaskId, item.LinkedProjectId,
            creator, item.CreatedAt, item.UpdatedAt));
    }

    // ── DELETE /api/v1/calendar/{id} ──
    private static async Task<IResult> DeleteCalendarItem(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var item = await db.CalendarItems.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (item is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Calendar item with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        db.CalendarItems.Remove(item);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }
}
