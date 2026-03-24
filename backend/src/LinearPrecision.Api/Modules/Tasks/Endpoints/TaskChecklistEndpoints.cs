using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Hubs;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Tasks.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace LinearPrecision.Api.Modules.Tasks.Endpoints;

public static class TaskChecklistEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/tasks/{taskId:guid}/checklist")
            .WithTags("Tasks")
            .RequireAuthorization();

        group.MapGet("/", ListChecklistItems).WithName("ListChecklistItems").RequireAuthorization("WorkspaceGuest");
        group.MapPost("/", AddChecklistItem).WithName("AddChecklistItem").RequireAuthorization("WorkspaceMember");
        group.MapPut("/{itemId:guid}", UpdateChecklistItem).WithName("UpdateChecklistItem").RequireAuthorization("WorkspaceMember");
        group.MapPatch("/{itemId:guid}", UpdateChecklistItem).WithName("PatchChecklistItem").RequireAuthorization("WorkspaceMember");
        group.MapDelete("/{itemId:guid}", RemoveChecklistItem).WithName("RemoveChecklistItem").RequireAuthorization("WorkspaceMember");
    }

    private static async Task<IResult> ListChecklistItems(
        Guid taskId,
        AppDbContext db,
        CancellationToken ct)
    {
        var items = await db.TaskChecklistItems.AsNoTracking()
            .Where(item => item.TaskId == taskId)
            .OrderBy(item => item.SortOrder)
            .Select(item => new TaskChecklistListItemResponse(
                item.Id,
                item.Title,
                item.IsCompleted,
                item.SortOrder,
                item.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(items);
    }

    // ── POST /api/v1/tasks/{taskId}/checklist ──
    private static async Task<IResult> AddChecklistItem(
        Guid taskId,
        AddChecklistItemRequest request,
        IValidator<AddChecklistItemRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
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

        var sortOrder = request.SortOrder
            ?? (await db.TaskChecklistItems
                .Where(ci => ci.TaskId == taskId)
                .MaxAsync(ci => (int?)ci.SortOrder, ct) ?? 0) + 1;

        var item = new TaskChecklistItem
        {
            TaskId = taskId,
            Title = request.Title,
            IsCompleted = request.IsCompleted ?? false,
            CompletedAt = request.IsCompleted == true ? DateTime.UtcNow : null,
            CompletedBy = request.IsCompleted == true ? currentUser.UserId : null,
            SortOrder = sortOrder
        };

        db.TaskChecklistItems.Add(item);
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, projectId.Value, taskId, ct);

        return Results.Created($"/api/v1/tasks/{taskId}/checklist/{item.Id}", new ChecklistItemResponse(
            item.Id, item.TaskId, item.Title, item.IsCompleted, item.CompletedAt, item.SortOrder, item.CreatedAt));
    }

    // ── PUT /api/v1/tasks/{taskId}/checklist/{itemId} ──
    private static async Task<IResult> UpdateChecklistItem(
        Guid taskId,
        Guid itemId,
        UpdateChecklistItemRequest request,
        IValidator<UpdateChecklistItemRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var item = await db.TaskChecklistItems
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.TaskId == taskId, ct);

        if (item is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: "Checklist item was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (request.Title is not null) item.Title = request.Title;
        if (request.SortOrder.HasValue) item.SortOrder = request.SortOrder.Value;
        if (request.IsCompleted.HasValue)
        {
            item.IsCompleted = request.IsCompleted.Value;
            item.CompletedAt = request.IsCompleted.Value ? DateTime.UtcNow : null;
            item.CompletedBy = request.IsCompleted.Value ? currentUser.UserId : null;
        }

        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, db, taskId, ct);

        return Results.Ok(new ChecklistItemResponse(
            item.Id, item.TaskId, item.Title, item.IsCompleted, item.CompletedAt, item.SortOrder, item.CreatedAt));
    }

    // ── DELETE /api/v1/tasks/{taskId}/checklist/{itemId} ──
    private static async Task<IResult> RemoveChecklistItem(
        Guid taskId,
        Guid itemId,
        AppDbContext db,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var item = await db.TaskChecklistItems
            .FirstOrDefaultAsync(ci => ci.Id == itemId && ci.TaskId == taskId, ct);

        if (item is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: "Checklist item was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        db.TaskChecklistItems.Remove(item);
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, db, taskId, ct);
        return Results.NoContent();
    }
}
