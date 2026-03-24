using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Hubs;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Tasks.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace LinearPrecision.Api.Modules.Tasks.Endpoints;

public static class TaskEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/tasks")
            .WithTags("Tasks")
            .RequireAuthorization();

        group.MapGet("/", ListTasks).WithName("ListTasks").RequireAuthorization("WorkspaceGuest");
        group.MapPost("/", CreateTask).WithName("CreateTask").RequireAuthorization("WorkspaceMember");
        group.MapGet("/{id:guid}", GetTask).WithName("GetTask").RequireAuthorization("WorkspaceGuest");
        group.MapPut("/{id:guid}", UpdateTask).WithName("UpdateTask").RequireAuthorization("WorkspaceMember");
        group.MapPatch("/{id:guid}/status", UpdateTaskStatus).WithName("UpdateTaskStatus").RequireAuthorization("WorkspaceMember");
        group.MapDelete("/{id:guid}", DeleteTask).WithName("DeleteTask").RequireAuthorization("WorkspaceMember");
    }

    // ── GET /api/v1/tasks ──
    private static async Task<IResult> ListTasks(
        AppDbContext db,
        CancellationToken ct,
        Guid? projectId = null,
        Guid? sprintId = null,
        Guid? assigneeId = null,
        string? status = null,
        string? priority = null,
        int pageSize = 25,
        string sortBy = "createdAt",
        string sortOrder = "desc")
    {
        var query = db.TaskItems.AsNoTracking().AsQueryable();

        if (projectId.HasValue) query = query.Where(t => t.ProjectId == projectId.Value);
        if (sprintId.HasValue) query = query.Where(t => t.SprintId == sprintId.Value);
        if (assigneeId.HasValue) query = query.Where(t => t.AssigneeId == assigneeId.Value);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<TaskItemStatus>(status, true, out var s))
            query = query.Where(t => t.Status == s);
        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<TaskPriority>(priority, true, out var p))
            query = query.Where(t => t.Priority == p);

        query = sortBy.ToLowerInvariant() switch
        {
            "title" => sortOrder == "asc" ? query.OrderBy(t => t.Title) : query.OrderByDescending(t => t.Title),
            "status" => sortOrder == "asc" ? query.OrderBy(t => t.Status) : query.OrderByDescending(t => t.Status),
            "priority" => sortOrder == "asc" ? query.OrderBy(t => t.Priority) : query.OrderByDescending(t => t.Priority),
            "duedate" => sortOrder == "asc" ? query.OrderBy(t => t.DueDate) : query.OrderByDescending(t => t.DueDate),
            "sortorder" => sortOrder == "asc" ? query.OrderBy(t => t.SortOrder) : query.OrderByDescending(t => t.SortOrder),
            _ => sortOrder == "asc" ? query.OrderBy(t => t.CreatedAt) : query.OrderByDescending(t => t.CreatedAt)
        };

        var tasks = await query.Take(Math.Min(pageSize, 100))
            .Select(t => new TaskResponse(
                t.Id,
                t.ProjectId,
                t.Identifier,
                t.Title,
                t.Description,
                t.Status,
                t.Priority,
                t.TaskType,
                t.Labels,
                t.Assignee != null
                    ? new UserBriefResponse(t.Assignee.Id, t.Assignee.FullName, t.Assignee.AvatarUrl)
                    : null,
                t.Creator != null
                    ? new UserBriefResponse(t.Creator.Id, t.Creator.FullName, t.Creator.AvatarUrl)
                    : null,
                t.ParentTaskId,
                t.SprintId,
                t.StartDate,
                t.DueDate,
                t.CompletedAt,
                t.EstimatePoints,
                t.EstimateHours,
                t.SortOrder,
                t.Comments.Count,
                t.Attachments.Count,
                t.ChecklistItems.Count,
                t.ChecklistItems.Count(ci => ci.IsCompleted),
                t.Watchers.Count,
                t.CreatedAt,
                t.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(tasks);
    }

    // ── POST /api/v1/tasks ──
    private static async Task<IResult> CreateTask(
        CreateTaskRequest request,
        IValidator<CreateTaskRequest> validator,
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

        var project = await db.Projects.AsNoTracking()
            .Where(p => p.Id == request.ProjectId)
            .Select(p => new { p.Id, p.Identifier })
            .FirstOrDefaultAsync(ct);

        if (project is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: "Project was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Generate task identifier: PROJECT-NNN
        var taskCount = await db.TaskItems.IgnoreQueryFilters()
            .CountAsync(t => t.ProjectId == request.ProjectId, ct);
        var identifier = $"{project.Identifier}-{taskCount + 1}";

        var task = new TaskItem
        {
            Title = request.Title,
            Description = request.Description,
            Identifier = identifier,
            ProjectId = request.ProjectId,
            Status = request.Status ?? TaskItemStatus.Backlog,
            Priority = request.Priority ?? TaskPriority.None,
            TaskType = request.TaskType,
            Labels = request.Labels ?? [],
            ParentTaskId = request.ParentTaskId,
            AssigneeId = request.AssigneeId,
            CreatorId = userId,
            StartDate = request.StartDate,
            DueDate = request.DueDate,
            EstimatePoints = request.EstimatePoints,
            EstimateHours = request.EstimateHours,
            SprintId = request.SprintId,
            CustomFields = request.CustomFields,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.TaskItems.Add(task);
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskCreatedAsync(boardHub, task.ProjectId, task.Id, ct);

        return Results.Created($"/api/v1/tasks/{task.Id}", new { task.Id, task.Identifier });
    }

    // ── GET /api/v1/tasks/{id} ──
    private static async Task<IResult> GetTask(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var task = await db.TaskItems.AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new TaskResponse(
                t.Id,
                t.ProjectId,
                t.Identifier,
                t.Title,
                t.Description,
                t.Status,
                t.Priority,
                t.TaskType,
                t.Labels,
                t.Assignee != null
                    ? new UserBriefResponse(t.Assignee.Id, t.Assignee.FullName, t.Assignee.AvatarUrl)
                    : null,
                t.Creator != null
                    ? new UserBriefResponse(t.Creator.Id, t.Creator.FullName, t.Creator.AvatarUrl)
                    : null,
                t.ParentTaskId,
                t.SprintId,
                t.StartDate,
                t.DueDate,
                t.CompletedAt,
                t.EstimatePoints,
                t.EstimateHours,
                t.SortOrder,
                t.Comments.Count,
                t.Attachments.Count,
                t.ChecklistItems.Count,
                t.ChecklistItems.Count(ci => ci.IsCompleted),
                t.Watchers.Count,
                t.CreatedAt,
                t.UpdatedAt))
            .FirstOrDefaultAsync(ct);

        if (task is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Task with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(task);
    }

    // ── PUT /api/v1/tasks/{id} ──
    private static async Task<IResult> UpdateTask(
        Guid id,
        UpdateTaskRequest request,
        IValidator<UpdateTaskRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var task = await db.TaskItems.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Task with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        task.Title = request.Title;
        task.Description = request.Description;
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.TaskType = request.TaskType;
        task.Labels = request.Labels ?? [];
        task.AssigneeId = request.AssigneeId;
        task.ParentTaskId = request.ParentTaskId;
        task.SprintId = request.SprintId;
        task.StartDate = request.StartDate;
        task.DueDate = request.DueDate;
        task.EstimatePoints = request.EstimatePoints;
        task.EstimateHours = request.EstimateHours;
        task.CustomFields = request.CustomFields;
        if (request.SortOrder.HasValue) task.SortOrder = request.SortOrder.Value;
        task.UpdatedBy = currentUser.UserId;

        if (request.Status == TaskItemStatus.Done || request.Status == TaskItemStatus.Cancelled)
        {
            task.CompletedAt ??= DateTime.UtcNow;
        }
        else
        {
            task.CompletedAt = null;
        }

        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskUpdatedAsync(boardHub, task.ProjectId, task.Id, ct);
        return Results.Ok(new { task.Id });
    }

    // ── PATCH /api/v1/tasks/{id}/status ──
    private static async Task<IResult> UpdateTaskStatus(
        Guid id,
        UpdateTaskStatusRequest request,
        IValidator<UpdateTaskStatusRequest> validator,
        AppDbContext db,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var task = await db.TaskItems.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Task with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        task.Status = request.Status;
        if (request.Status == TaskItemStatus.Done || request.Status == TaskItemStatus.Cancelled)
        {
            task.CompletedAt ??= DateTime.UtcNow;
        }
        else
        {
            task.CompletedAt = null;
        }

        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskMovedAsync(boardHub, task.ProjectId, task.Id, ct);
        return Results.Ok(new { task.Id, task.Status });
    }

    // ── DELETE /api/v1/tasks/{id} ──
    private static async Task<IResult> DeleteTask(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        IHubContext<BoardHub> boardHub,
        CancellationToken ct)
    {
        var task = await db.TaskItems.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Task with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var projectId = task.ProjectId;
        task.IsDeleted = true;
        task.DeletedAt = DateTime.UtcNow;
        task.DeletedBy = currentUser.UserId;
        await db.SaveChangesAsync(ct);
        await TaskBoardRealtime.NotifyTaskDeletedAsync(boardHub, projectId, id, ct);
        return Results.NoContent();
    }
}
