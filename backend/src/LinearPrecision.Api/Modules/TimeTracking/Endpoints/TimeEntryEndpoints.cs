using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.TimeTracking.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.TimeTracking.Endpoints;

public static class TimeEntryEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/time-entries")
            .WithTags("TimeTracking")
            .RequireAuthorization();

        group.MapGet("/", ListTimeEntries).WithName("ListTimeEntries").RequireAuthorization("WorkspaceMember");
        group.MapPost("/", CreateTimeEntry).WithName("CreateTimeEntry").RequireAuthorization("WorkspaceMember");
        group.MapPut("/{id:guid}", UpdateTimeEntry).WithName("UpdateTimeEntry").RequireAuthorization("WorkspaceMember");
        group.MapDelete("/{id:guid}", DeleteTimeEntry).WithName("DeleteTimeEntry").RequireAuthorization("WorkspaceMember");
        group.MapPost("/start", StartTimer).WithName("StartTimer").RequireAuthorization("WorkspaceMember");
        group.MapPost("/{id:guid}/stop", StopTimer).WithName("StopTimer").RequireAuthorization("WorkspaceMember");
    }

    // ── GET /api/v1/time-entries ──
    private static async Task<IResult> ListTimeEntries(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        Guid? userId = null,
        Guid? taskId = null,
        Guid? projectId = null,
        DateTime? startedAfter = null,
        DateTime? startedBefore = null,
        bool? isBillable = null)
    {
        var query = db.TimeEntries.AsNoTracking().AsQueryable();

        if (userId.HasValue)
            query = query.Where(t => t.UserId == userId.Value);
        if (taskId.HasValue)
            query = query.Where(t => t.TaskId == taskId.Value);
        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);
        if (startedAfter.HasValue)
            query = query.Where(t => t.StartTime >= startedAfter.Value);
        if (startedBefore.HasValue)
            query = query.Where(t => t.StartTime <= startedBefore.Value);
        if (isBillable.HasValue)
            query = query.Where(t => t.IsBillable == isBillable.Value);

        var entries = await query
            .OrderByDescending(t => t.StartTime)
            .Select(t => new TimeEntryResponse(
                t.Id,
                new UserBriefResponse(t.User.Id, t.User.FullName, t.User.AvatarUrl),
                t.TaskId,
                t.ProjectId,
                t.Description,
                t.StartTime,
                t.EndTime,
                t.DurationMinutes,
                t.IsBillable,
                t.HourlyRate,
                t.CreatedAt,
                t.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(entries);
    }

    // ── POST /api/v1/time-entries ──
    private static async Task<IResult> CreateTimeEntry(
        CreateTimeEntryRequest request,
        IValidator<CreateTimeEntryRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var durationMinutes = request.DurationMinutes
            ?? (request.EndTime.HasValue
                ? (int)(request.EndTime.Value - request.StartTime).TotalMinutes
                : 0);

        var entry = new TimeEntry
        {
            UserId = userId,
            TaskId = request.TaskId,
            ProjectId = request.ProjectId,
            Description = request.Description,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            DurationMinutes = durationMinutes,
            IsBillable = request.IsBillable ?? false,
            HourlyRate = request.HourlyRate,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.TimeEntries.Add(entry);
        await db.SaveChangesAsync(ct);

        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
            .FirstAsync(ct);

        var response = new TimeEntryResponse(
            entry.Id, user, entry.TaskId, entry.ProjectId, entry.Description,
            entry.StartTime, entry.EndTime, entry.DurationMinutes,
            entry.IsBillable, entry.HourlyRate, entry.CreatedAt, entry.UpdatedAt);

        return Results.Created($"/api/v1/time-entries/{entry.Id}", response);
    }

    // ── PUT /api/v1/time-entries/{id} ──
    private static async Task<IResult> UpdateTimeEntry(
        Guid id,
        UpdateTimeEntryRequest request,
        IValidator<UpdateTimeEntryRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var entry = await db.TimeEntries.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entry is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Time entry with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Only own entries or admin+ can update
        var isAdmin = currentUser.Roles.Contains("WorkspaceAdmin") || currentUser.Roles.Contains("WorkspaceOwner");
        if (entry.UserId != userId && !isAdmin)
        {
            return Results.Problem(
                title: "Forbidden",
                detail: "You can only update your own time entries.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        entry.TaskId = request.TaskId;
        entry.ProjectId = request.ProjectId;
        entry.Description = request.Description;
        entry.StartTime = request.StartTime;
        entry.EndTime = request.EndTime;
        entry.DurationMinutes = request.DurationMinutes
            ?? (request.EndTime.HasValue
                ? (int)(request.EndTime.Value - request.StartTime).TotalMinutes
                : entry.DurationMinutes);
        entry.IsBillable = request.IsBillable ?? entry.IsBillable;
        entry.HourlyRate = request.HourlyRate;

        await db.SaveChangesAsync(ct);

        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == entry.UserId)
            .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
            .FirstAsync(ct);

        return Results.Ok(new TimeEntryResponse(
            entry.Id, user, entry.TaskId, entry.ProjectId, entry.Description,
            entry.StartTime, entry.EndTime, entry.DurationMinutes,
            entry.IsBillable, entry.HourlyRate, entry.CreatedAt, entry.UpdatedAt));
    }

    // ── DELETE /api/v1/time-entries/{id} ──
    private static async Task<IResult> DeleteTimeEntry(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var entry = await db.TimeEntries.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entry is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Time entry with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Only own entries or admin+ can delete
        var isAdmin = currentUser.Roles.Contains("WorkspaceAdmin") || currentUser.Roles.Contains("WorkspaceOwner");
        if (entry.UserId != userId && !isAdmin)
        {
            return Results.Problem(
                title: "Forbidden",
                detail: "You can only delete your own time entries.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        db.TimeEntries.Remove(entry);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    // ── POST /api/v1/time-entries/start ──
    private static async Task<IResult> StartTimer(
        StartTimerRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        // Only one running timer per user
        var hasRunningTimer = await db.TimeEntries
            .AnyAsync(t => t.UserId == userId && t.EndTime == null, ct);

        if (hasRunningTimer)
        {
            return Results.Problem(
                title: "Conflict",
                detail: "You already have a running timer. Stop it before starting a new one.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var entry = new TimeEntry
        {
            UserId = userId,
            TaskId = request.TaskId,
            ProjectId = request.ProjectId,
            Description = request.Description,
            StartTime = DateTime.UtcNow,
            EndTime = null,
            DurationMinutes = 0,
            IsBillable = request.IsBillable ?? false,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.TimeEntries.Add(entry);
        await db.SaveChangesAsync(ct);

        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
            .FirstAsync(ct);

        var response = new TimeEntryResponse(
            entry.Id, user, entry.TaskId, entry.ProjectId, entry.Description,
            entry.StartTime, entry.EndTime, entry.DurationMinutes,
            entry.IsBillable, entry.HourlyRate, entry.CreatedAt, entry.UpdatedAt);

        return Results.Created($"/api/v1/time-entries/{entry.Id}", response);
    }

    // ── POST /api/v1/time-entries/{id}/stop ──
    private static async Task<IResult> StopTimer(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var entry = await db.TimeEntries.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entry is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Time entry with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (entry.UserId != userId)
        {
            return Results.Problem(
                title: "Forbidden",
                detail: "You can only stop your own timer.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        if (entry.EndTime.HasValue)
        {
            return Results.Problem(
                title: "Bad Request",
                detail: "This timer has already been stopped.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        entry.EndTime = DateTime.UtcNow;
        entry.DurationMinutes = (int)(entry.EndTime.Value - entry.StartTime).TotalMinutes;

        await db.SaveChangesAsync(ct);

        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
            .FirstAsync(ct);

        return Results.Ok(new TimeEntryResponse(
            entry.Id, user, entry.TaskId, entry.ProjectId, entry.Description,
            entry.StartTime, entry.EndTime, entry.DurationMinutes,
            entry.IsBillable, entry.HourlyRate, entry.CreatedAt, entry.UpdatedAt));
    }
}
