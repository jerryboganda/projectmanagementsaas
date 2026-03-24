using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Hubs;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Tasks.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace LinearPrecision.Api.Modules.Tasks.Endpoints;

public static class TaskWatcherEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/tasks/{taskId:guid}/watchers")
            .WithTags("Tasks");

        group.MapGet("/", ListWatchers).WithName("ListTaskWatchers").RequireAuthorization("WorkspaceGuest");
        group.MapPost("/", AddWatcher).WithName("AddTaskWatcher").RequireAuthorization("WorkspaceMember");
        group.MapDelete("/{userId:guid}", RemoveWatcher).WithName("RemoveTaskWatcher").RequireAuthorization("WorkspaceMember");
    }

    private static async Task<IResult> ListWatchers(
        Guid taskId,
        AppDbContext db,
        CancellationToken ct)
    {
        var watchers = await db.TaskWatchers.AsNoTracking()
            .Where(watcher => watcher.TaskId == taskId)
            .OrderBy(watcher => watcher.CreatedAt)
            .Select(watcher => new TaskWatcherListItemResponse(
                watcher.UserId,
                TaskEndpointFormatting.DisplayName(watcher.User.DisplayName, watcher.User.FullName),
                TaskEndpointFormatting.Initials(watcher.User.FullName),
                watcher.User.AvatarUrl,
                watcher.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(watchers);
    }

    // ── POST /api/v1/tasks/{taskId}/watchers ──
    private static async Task<IResult> AddWatcher(
        Guid taskId,
        AddWatcherRequest request,
        IValidator<AddWatcherRequest> validator,
        AppDbContext db,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var projectId = await TaskBoardRealtime.ResolveProjectIdAsync(db, taskId, ct);
        if (projectId is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Task with id '{taskId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Check uniqueness on (TaskId, UserId)
        if (await db.TaskWatchers.AnyAsync(w => w.TaskId == taskId && w.UserId == request.UserId, ct))
        {
            return Results.Problem(
                title: "Conflict",
                detail: "User is already watching this task.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var watcher = new TaskWatcher
        {
            TaskId = taskId,
            UserId = request.UserId
        };

        db.TaskWatchers.Add(watcher);
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, projectId.Value, taskId, ct);

        return Results.Created($"/api/v1/tasks/{taskId}/watchers/{request.UserId}",
            new WatcherResponse(watcher.Id, watcher.TaskId, watcher.UserId, watcher.CreatedAt));
    }

    // ── DELETE /api/v1/tasks/{taskId}/watchers/{userId} ──
    private static async Task<IResult> RemoveWatcher(
        Guid taskId,
        Guid userId,
        AppDbContext db,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var watcher = await db.TaskWatchers
            .FirstOrDefaultAsync(w => w.TaskId == taskId && w.UserId == userId, ct);

        if (watcher is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: "Watcher was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        db.TaskWatchers.Remove(watcher);
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, db, taskId, ct);
        return Results.NoContent();
    }
}
