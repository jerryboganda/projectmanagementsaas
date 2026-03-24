using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Sprints.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Sprints.Endpoints;

public static class SprintEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var projectGroup = app.MapGroup("/api/v1/projects/{projectId:guid}/sprints")
            .WithTags("Sprints")
            .RequireAuthorization();

        projectGroup.MapGet("/", ListSprints).WithName("ListSprints").RequireAuthorization("WorkspaceMember");
        projectGroup.MapPost("/", CreateSprint).WithName("CreateSprint").RequireAuthorization("WorkspaceMember");

        var group = app.MapGroup("/api/v1/sprints")
            .WithTags("Sprints")
            .RequireAuthorization();

        group.MapGet("/{id:guid}", GetSprint).WithName("GetSprint").RequireAuthorization("WorkspaceGuest");
        group.MapPut("/{id:guid}", UpdateSprint).WithName("UpdateSprint").RequireAuthorization("WorkspaceMember");
        group.MapPost("/{id:guid}/start", StartSprint).WithName("StartSprint").RequireAuthorization("WorkspaceMember");
        group.MapPost("/{id:guid}/complete", CompleteSprint).WithName("CompleteSprint").RequireAuthorization("WorkspaceMember");
        group.MapDelete("/{id:guid}", DeleteSprint).WithName("DeleteSprint").RequireAuthorization("WorkspaceAdmin");
    }

    // ── GET /api/v1/projects/{projectId}/sprints ──
    private static async Task<IResult> ListSprints(
        Guid projectId,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        string? status = null)
    {
        var query = db.Sprints.AsNoTracking()
            .Where(s => s.ProjectId == projectId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<SprintStatus>(status, true, out var ss))
            query = query.Where(s => s.Status == ss);

        var sprints = await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SprintResponse(
                s.Id,
                s.ProjectId,
                s.Name,
                s.Goal,
                s.Status,
                s.StartDate,
                s.EndDate,
                s.PlannedPoints,
                s.CompletedPoints,
                s.Tasks.Count(t => !t.IsDeleted),
                s.Tasks.Count(t => !t.IsDeleted && t.Status == TaskItemStatus.Done),
                s.CreatedAt,
                s.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(sprints);
    }

    // ── POST /api/v1/projects/{projectId}/sprints ──
    private static async Task<IResult> CreateSprint(
        Guid projectId,
        CreateSprintRequest request,
        IValidator<CreateSprintRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        if (!await db.Projects.AnyAsync(p => p.Id == projectId, ct))
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Project with id '{projectId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var sprint = new Sprint
        {
            Name = request.Name,
            Goal = request.Goal,
            ProjectId = projectId,
            Status = SprintStatus.Planned,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.Sprints.Add(sprint);
        await db.SaveChangesAsync(ct);

        var response = new SprintResponse(
            sprint.Id, sprint.ProjectId, sprint.Name, sprint.Goal,
            sprint.Status, sprint.StartDate, sprint.EndDate,
            sprint.PlannedPoints, sprint.CompletedPoints,
            0, 0, sprint.CreatedAt, sprint.UpdatedAt);

        return Results.Created($"/api/v1/sprints/{sprint.Id}", response);
    }

    // ── GET /api/v1/sprints/{id} ──
    private static async Task<IResult> GetSprint(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var sprint = await db.Sprints.AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new SprintResponse(
                s.Id,
                s.ProjectId,
                s.Name,
                s.Goal,
                s.Status,
                s.StartDate,
                s.EndDate,
                s.PlannedPoints,
                s.CompletedPoints,
                s.Tasks.Count(t => !t.IsDeleted),
                s.Tasks.Count(t => !t.IsDeleted && t.Status == TaskItemStatus.Done),
                s.CreatedAt,
                s.UpdatedAt))
            .FirstOrDefaultAsync(ct);

        if (sprint is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Sprint with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(sprint);
    }

    // ── PUT /api/v1/sprints/{id} ──
    private static async Task<IResult> UpdateSprint(
        Guid id,
        UpdateSprintRequest request,
        IValidator<UpdateSprintRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var sprint = await db.Sprints.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (sprint is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Sprint with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        sprint.Name = request.Name;
        sprint.Goal = request.Goal;
        sprint.StartDate = request.StartDate;
        sprint.EndDate = request.EndDate;

        await db.SaveChangesAsync(ct);

        return Results.Ok(new SprintResponse(
            sprint.Id, sprint.ProjectId, sprint.Name, sprint.Goal,
            sprint.Status, sprint.StartDate, sprint.EndDate,
            sprint.PlannedPoints, sprint.CompletedPoints,
            await db.TaskItems.CountAsync(t => t.SprintId == id && !t.IsDeleted, ct),
            await db.TaskItems.CountAsync(t => t.SprintId == id && !t.IsDeleted && t.Status == TaskItemStatus.Done, ct),
            sprint.CreatedAt, sprint.UpdatedAt));
    }

    // ── POST /api/v1/sprints/{id}/start ──
    private static async Task<IResult> StartSprint(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var sprint = await db.Sprints.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (sprint is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Sprint with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (sprint.Status != SprintStatus.Planned)
        {
            return Results.Problem(
                title: "Bad Request",
                detail: "Only planned sprints can be started.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // Validate only one active sprint per project
        var hasActiveSprint = await db.Sprints
            .AnyAsync(s => s.ProjectId == sprint.ProjectId && s.Status == SprintStatus.Active, ct);

        if (hasActiveSprint)
        {
            return Results.Problem(
                title: "Conflict",
                detail: "The project already has an active sprint. Complete it before starting a new one.",
                statusCode: StatusCodes.Status409Conflict);
        }

        sprint.Status = SprintStatus.Active;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { sprint.Id, Status = sprint.Status.ToString() });
    }

    // ── POST /api/v1/sprints/{id}/complete ──
    private static async Task<IResult> CompleteSprint(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var sprint = await db.Sprints.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (sprint is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Sprint with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (sprint.Status != SprintStatus.Active)
        {
            return Results.Problem(
                title: "Bad Request",
                detail: "Only active sprints can be completed.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // Calculate completed points from tasks in this sprint
        var completedPoints = await db.TaskItems
            .Where(t => t.SprintId == id && !t.IsDeleted && t.Status == TaskItemStatus.Done)
            .SumAsync(t => t.EstimatePoints ?? 0, ct);

        sprint.Status = SprintStatus.Completed;
        sprint.CompletedPoints = completedPoints;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { sprint.Id, Status = sprint.Status.ToString(), sprint.CompletedPoints });
    }

    // ── DELETE /api/v1/sprints/{id} ──
    private static async Task<IResult> DeleteSprint(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var sprint = await db.Sprints.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (sprint is null)
        {
            return Results.Problem(
                title: "Not Found",
                detail: $"Sprint with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Unlink tasks from this sprint
        var tasksInSprint = await db.TaskItems
            .Where(t => t.SprintId == id)
            .ToListAsync(ct);

        foreach (var task in tasksInSprint)
            task.SprintId = null;

        db.Sprints.Remove(sprint);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }
}
