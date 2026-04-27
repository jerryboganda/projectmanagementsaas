using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Goals.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Goals.Endpoints;

public static class GoalEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/goals")
            .WithTags("Goals")
            .RequireAuthorization();

        group.MapGet("/", ListGoals).WithName("ListGoals").RequireAuthorization(WorkspaceRoles.Member);
        group.MapPost("/", CreateGoal).WithName("CreateGoal").RequireAuthorization(WorkspaceRoles.Member);
        group.MapGet("/{id:guid}", GetGoal).WithName("GetGoal").RequireAuthorization(WorkspaceRoles.Guest);
        group.MapPut("/{id:guid}", UpdateGoal).WithName("UpdateGoal").RequireAuthorization(WorkspaceRoles.Member);
        group.MapDelete("/{id:guid}", DeleteGoal).WithName("DeleteGoal").RequireAuthorization(WorkspaceRoles.Admin);
        group.MapPost("/{id:guid}/projects", LinkProject).WithName("LinkGoalProject").RequireAuthorization(WorkspaceRoles.Member);
    }

    // ── GET /api/v1/goals ──
    private static async Task<IResult> ListGoals(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        string? status = null,
        string? type = null,
        Guid? ownerId = null,
        int pageSize = 25,
        int page = 1,
        string sortBy = "createdAt",
        string sortOrder = "desc")
    {
        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var offset = (int)Math.Min((long)(Math.Max(page, 1) - 1) * effectivePageSize, int.MaxValue);
        var query = db.Goals.AsNoTracking().Where(g => !g.IsDeleted);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<GoalStatus>(status, true, out var gs))
            query = query.Where(g => g.Status == gs);
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<GoalType>(type, true, out var gt))
            query = query.Where(g => g.Type == gt);
        if (ownerId.HasValue)
            query = query.Where(g => g.OwnerId == ownerId.Value);

        query = sortBy.ToLowerInvariant() switch
        {
            "title" => sortOrder == "asc" ? query.OrderBy(g => g.Title) : query.OrderByDescending(g => g.Title),
            "status" => sortOrder == "asc" ? query.OrderBy(g => g.Status) : query.OrderByDescending(g => g.Status),
            _ => sortOrder == "asc" ? query.OrderBy(g => g.CreatedAt) : query.OrderByDescending(g => g.CreatedAt)
        };

        var goals = await query.Skip(offset).Take(effectivePageSize)
            .Select(g => new GoalResponse(
                g.Id,
                g.WorkspaceId,
                g.Title,
                g.Description,
                g.Status,
                g.Type,
                g.ProgressPercent,
                g.ProgressSource,
                g.Owner != null ? new UserBriefResponse(g.Owner.Id, g.Owner.FullName, g.Owner.AvatarUrl) : null,
                g.StartDate,
                g.TargetDate,
                g.ParentGoalId,
                null,
                null,
                null,
                g.CreatedAt,
                g.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(goals);
    }

    // ── POST /api/v1/goals ──
    private static async Task<IResult> CreateGoal(
        CreateGoalRequest request,
        IValidator<CreateGoalRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var goal = new Goal
        {
            Title = request.Title,
            Description = request.Description,
            Status = request.Status ?? GoalStatus.OnTrack,
            Type = request.Type ?? GoalType.Objective,
            ProgressPercent = request.ProgressPercent ?? 0,
            ProgressSource = request.ProgressSource ?? GoalProgressSource.Manual,
            OwnerId = request.OwnerId,
            StartDate = request.StartDate,
            TargetDate = request.TargetDate,
            ParentGoalId = request.ParentGoalId,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.Goals.Add(goal);
        await db.SaveChangesAsync(ct);

        var response = new GoalResponse(
            goal.Id,
            goal.WorkspaceId,
            goal.Title,
            goal.Description,
            goal.Status,
            goal.Type,
            goal.ProgressPercent,
            goal.ProgressSource,
            null,
            goal.StartDate,
            goal.TargetDate,
            goal.ParentGoalId,
            null,
            null,
            null,
            goal.CreatedAt,
            goal.UpdatedAt);

        return Results.Created($"/api/v1/goals/{goal.Id}", response);
    }

    // ── GET /api/v1/goals/{id} ──
    private static async Task<IResult> GetGoal(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var goal = await db.Goals.AsNoTracking()
            .Where(g => g.Id == id && !g.IsDeleted)
            .Select(g => new GoalResponse(
                g.Id,
                g.WorkspaceId,
                g.Title,
                g.Description,
                g.Status,
                g.Type,
                g.ProgressPercent,
                g.ProgressSource,
                g.Owner != null ? new UserBriefResponse(g.Owner.Id, g.Owner.FullName, g.Owner.AvatarUrl) : null,
                g.StartDate,
                g.TargetDate,
                g.ParentGoalId,
                g.SubGoals.Where(s => !s.IsDeleted).Select(s => new GoalResponse(
                    s.Id,
                    s.WorkspaceId,
                    s.Title,
                    s.Description,
                    s.Status,
                    s.Type,
                    s.ProgressPercent,
                    s.ProgressSource,
                    s.Owner != null ? new UserBriefResponse(s.Owner.Id, s.Owner.FullName, s.Owner.AvatarUrl) : null,
                    s.StartDate,
                    s.TargetDate,
                    s.ParentGoalId,
                    null, null, null,
                    s.CreatedAt,
                    s.UpdatedAt)).ToList(),
                g.ProjectLinks.Select(pl => new GoalProjectLinkResponse(
                    pl.Id,
                    pl.GoalId,
                    pl.ProjectId,
                    pl.CreatedAt)).ToList(),
                g.Initiatives.Where(i => !i.IsDeleted).Select(i => new InitiativeResponse(
                    i.Id,
                    i.GoalId,
                    i.Title,
                    i.Description,
                    i.Status,
                    i.Owner != null ? new UserBriefResponse(i.Owner.Id, i.Owner.FullName, i.Owner.AvatarUrl) : null,
                    i.StartDate,
                    i.TargetDate,
                    i.ProgressPercent,
                    i.CreatedAt,
                    i.UpdatedAt)).ToList(),
                g.CreatedAt,
                g.UpdatedAt))
            .FirstOrDefaultAsync(ct);

        if (goal is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Goal with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(goal);
    }

    // ── PUT /api/v1/goals/{id} ──
    private static async Task<IResult> UpdateGoal(
        Guid id,
        UpdateGoalRequest request,
        IValidator<UpdateGoalRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var goal = await db.Goals.FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted, ct);
        if (goal is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Goal with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        goal.Title = request.Title;
        goal.Description = request.Description;
        goal.Status = request.Status;
        goal.Type = request.Type;
        goal.ProgressPercent = request.ProgressPercent ?? goal.ProgressPercent;
        goal.ProgressSource = request.ProgressSource ?? goal.ProgressSource;
        goal.OwnerId = request.OwnerId;
        goal.StartDate = request.StartDate;
        goal.TargetDate = request.TargetDate;
        goal.ParentGoalId = request.ParentGoalId;
        goal.UpdatedBy = userId;

        await db.SaveChangesAsync(ct);
        return Results.Ok(new { goal.Id });
    }

    // ── DELETE /api/v1/goals/{id} ──
    private static async Task<IResult> DeleteGoal(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var goal = await db.Goals.FirstOrDefaultAsync(g => g.Id == id && !g.IsDeleted, ct);
        if (goal is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Goal with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        goal.IsDeleted = true;
        goal.DeletedAt = DateTime.UtcNow;
        goal.DeletedBy = currentUser.UserId;
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    // ── POST /api/v1/goals/{id}/projects ──
    private static async Task<IResult> LinkProject(
        Guid id,
        LinkProjectRequest request,
        IValidator<LinkProjectRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        if (!await db.Goals.AnyAsync(g => g.Id == id && !g.IsDeleted, ct))
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Goal with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (!await db.Projects.AnyAsync(p => p.Id == request.ProjectId && !p.IsDeleted, ct))
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Project with id '{request.ProjectId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (await db.GoalProjectLinks.AnyAsync(l => l.GoalId == id && l.ProjectId == request.ProjectId, ct))
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: "This project is already linked to the goal.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var link = new GoalProjectLink
        {
            GoalId = id,
            ProjectId = request.ProjectId
        };

        db.GoalProjectLinks.Add(link);
        await db.SaveChangesAsync(ct);

        var response = new GoalProjectLinkResponse(link.Id, link.GoalId, link.ProjectId, link.CreatedAt);
        return Results.Created($"/api/v1/goals/{id}/projects", response);
    }
}
