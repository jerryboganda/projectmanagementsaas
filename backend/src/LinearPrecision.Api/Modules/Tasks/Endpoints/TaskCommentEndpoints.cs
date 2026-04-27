using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Hubs;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Tasks.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace LinearPrecision.Api.Modules.Tasks.Endpoints;

public static class TaskCommentEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/tasks/{taskId:guid}/comments")
            .WithTags("Tasks")
            .RequireAuthorization();

        group.MapGet("/", ListComments).WithName("ListTaskComments").RequireAuthorization(WorkspaceRoles.Guest);
        // F-06: comment writes require WorkspaceMember (Guests are read-only). Edit/delete
        // also require WorkspaceMember; the existing handler-level owner check still applies.
        group.MapPost("/", AddComment).WithName("AddTaskComment").RequireAuthorization(WorkspaceRoles.Member);
        group.MapPut("/{commentId:guid}", EditComment).WithName("EditTaskComment").RequireAuthorization(WorkspaceRoles.Member);
        group.MapDelete("/{commentId:guid}", DeleteComment).WithName("DeleteTaskComment").RequireAuthorization(WorkspaceRoles.Member);
    }

    private static async Task<IResult> ListComments(
        Guid taskId,
        AppDbContext db,
        CancellationToken ct,
        int page = 1,
        int pageSize = 25)
    {
        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var comments = await db.TaskComments.AsNoTracking()
            .Where(comment => comment.TaskId == taskId)
            .OrderBy(comment => comment.CreatedAt)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(comment => new TaskCommentListItemResponse(
                comment.Id,
                comment.Body,
                comment.AuthorId,
                TaskEndpointFormatting.DisplayName(comment.Author.DisplayName, comment.Author.FullName),
                TaskEndpointFormatting.Initials(comment.Author.FullName),
                comment.Author.AvatarUrl,
                comment.CreatedAt,
                comment.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(comments);
    }

    // ── POST /api/v1/tasks/{taskId}/comments ──
    private static async Task<IResult> AddComment(
        Guid taskId,
        AddCommentRequest request,
        IValidator<AddCommentRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var projectId = await TaskBoardRealtime.ResolveProjectIdAsync(db, taskId, ct);
        if (projectId is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Task with id '{taskId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var comment = new TaskComment
        {
            TaskId = taskId,
            AuthorId = userId,
            Body = request.Body,
            ParentCommentId = request.ParentCommentId,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.TaskComments.Add(comment);
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, projectId.Value, taskId, ct);

        return Results.Created($"/api/v1/tasks/{taskId}/comments/{comment.Id}", new { comment.Id });
    }

    // ── PUT /api/v1/tasks/{taskId}/comments/{commentId} ──
    private static async Task<IResult> EditComment(
        Guid taskId,
        Guid commentId,
        EditCommentRequest request,
        IValidator<EditCommentRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var comment = await db.TaskComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TaskId == taskId, ct);

        if (comment is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: "Comment was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (comment.AuthorId != currentUser.UserId)
        {
            return Results.Problem(
                title: ProblemTitles.Forbidden,
                detail: "You can only edit your own comments.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        comment.Body = request.Body;
        comment.IsEdited = true;
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, db, taskId, ct);

        return Results.Ok(new { comment.Id });
    }

    // ── DELETE /api/v1/tasks/{taskId}/comments/{commentId} ──
    private static async Task<IResult> DeleteComment(
        Guid taskId,
        Guid commentId,
        AppDbContext db,
        ICurrentUser currentUser,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var comment = await db.TaskComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TaskId == taskId, ct);

        if (comment is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: "Comment was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Author or Admin can delete
        if (comment.AuthorId != currentUser.UserId && !currentUser.Roles.Contains("Admin"))
        {
            return Results.Problem(
                title: ProblemTitles.Forbidden,
                detail: "You can only delete your own comments.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        comment.IsDeleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        comment.DeletedBy = currentUser.UserId;
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, db, taskId, ct);

        return Results.NoContent();
    }
}
