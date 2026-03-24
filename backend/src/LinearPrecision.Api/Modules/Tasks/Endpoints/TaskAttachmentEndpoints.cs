using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Hubs;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Tasks.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace LinearPrecision.Api.Modules.Tasks.Endpoints;

public static class TaskAttachmentEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/tasks/{taskId:guid}/attachments")
            .WithTags("Tasks");

        group.MapGet("/", ListAttachments).WithName("ListTaskAttachments").RequireAuthorization("WorkspaceGuest");
        group.MapPost("/upload", CreateAttachmentUpload).WithName("CreateTaskAttachmentUpload").RequireAuthorization("WorkspaceMember");
        group.MapDelete("/{attachmentId:guid}", DeleteAttachment).WithName("DeleteTaskAttachment").RequireAuthorization("WorkspaceMember");
    }

    private static async Task<IResult> ListAttachments(
        Guid taskId,
        AppDbContext db,
        IStorageService storage,
        CancellationToken ct)
    {
        var attachments = await db.TaskAttachments.AsNoTracking()
            .Where(attachment => attachment.TaskId == taskId)
            .OrderByDescending(attachment => attachment.CreatedAt)
            .Select(attachment => new
            {
                AttachmentId = attachment.Id,
                attachment.CreatedAt,
                attachment.FileAttachment.FileName,
                attachment.FileAttachment.ContentType,
                FileSizeBytes = attachment.FileAttachment.SizeBytes,
                attachment.FileAttachment.UploadedBy,
                UploadedByName = TaskEndpointFormatting.DisplayName(
                    attachment.FileAttachment.Uploader.DisplayName,
                    attachment.FileAttachment.Uploader.FullName),
                attachment.FileAttachment.StorageKey,
            })
            .ToListAsync(ct);

        var response = await Task.WhenAll(attachments.Select(async attachment =>
        {
            var downloadUrl = await storage.GetPresignedUrlAsync(
                attachment.StorageKey,
                TimeSpan.FromHours(1),
                ct);

            return new TaskAttachmentListItemResponse(
                attachment.AttachmentId,
                attachment.FileName,
                attachment.ContentType,
                attachment.FileSizeBytes,
                attachment.UploadedBy,
                attachment.UploadedByName,
                attachment.CreatedAt,
                downloadUrl);
        }));

        return Results.Ok(response);
    }

    private static async Task<IResult> CreateAttachmentUpload(
        Guid taskId,
        TaskAttachmentUploadRequest request,
        IValidator<TaskAttachmentUploadRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        IStorageService storage,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var task = await db.TaskItems
            .AsNoTracking()
            .Where(item => item.Id == taskId)
            .Select(item => new { item.Id, item.WorkspaceId, item.ProjectId })
            .FirstOrDefaultAsync(ct);

        if (task is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Task with id '{taskId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var storageKey = $"tasks/{taskId:N}/{Guid.NewGuid():N}/{request.FileName}";

        var file = new FileAttachment
        {
            WorkspaceId = task.WorkspaceId,
            FileName = request.FileName,
            StorageKey = storageKey,
            ContentType = request.ContentType,
            SizeBytes = request.FileSizeBytes,
            UploadedBy = userId,
            CreatedBy = userId,
            UpdatedBy = userId,
        };

        var attachment = new TaskAttachment
        {
            WorkspaceId = task.WorkspaceId,
            TaskId = taskId,
            FileAttachment = file,
            UploadedBy = userId,
        };

        db.TaskAttachments.Add(attachment);
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, task.ProjectId, taskId, ct);

        var uploadUrl = await storage.GetPresignedUploadUrlAsync(storageKey, TimeSpan.FromMinutes(15), ct);

        return Results.Ok(new TaskAttachmentUploadResponse(attachment.Id, uploadUrl));
    }

    private static async Task<IResult> DeleteAttachment(
        Guid taskId,
        Guid attachmentId,
        AppDbContext db,
        IStorageService storage,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var projectId = await TaskBoardRealtime.ResolveProjectIdAsync(db, taskId, ct);
        var attachment = await db.TaskAttachments
            .Include(item => item.FileAttachment)
            .FirstOrDefaultAsync(item => item.Id == attachmentId && item.TaskId == taskId, ct);

        if (attachment is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: "Attachment was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        await storage.DeleteAsync(attachment.FileAttachment.StorageKey, ct);
        db.TaskAttachments.Remove(attachment);
        db.FileAttachments.Remove(attachment.FileAttachment);
        await db.SaveChangesAsync(ct);
        if (projectId is not null)
        {
            await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, projectId.Value, taskId, ct);
        }

        return Results.NoContent();
    }
}
