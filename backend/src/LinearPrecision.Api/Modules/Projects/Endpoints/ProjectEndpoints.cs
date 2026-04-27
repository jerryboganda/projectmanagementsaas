using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Projects.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Projects.Endpoints;

public static class ProjectEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/projects")
            .WithTags("Projects")
            .RequireAuthorization();

        group.MapGet("/", ListProjects)
            .WithName("ListProjects")
            .Produces<List<ProjectResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapPost("/", CreateProject)
            .WithName("CreateProject")
            .Produces<ProjectResponse>(StatusCodes.Status201Created)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapGet("/templates", ListTemplates)
            .WithName("ListProjectTemplates")
            .Produces<List<ProjectTemplateResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Guest);

        group.MapGet("/{id:guid}", GetProject)
            .WithName("GetProject")
            .Produces<ProjectDetailResponse>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Guest);

        group.MapPut("/{id:guid}", UpdateProject)
            .WithName("UpdateProject")
            .Produces<ProjectResponse>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapDelete("/{id:guid}", DeleteProject)
            .WithName("DeleteProject")
            .Produces(StatusCodes.Status204NoContent)
            .RequireAuthorization(WorkspaceRoles.Admin);

        group.MapPost("/{id:guid}/favorite", ToggleFavorite)
            .WithName("ToggleProjectFavorite")
            .Produces<FavoriteToggleResponse>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapPost("/from-template", CreateFromTemplate)
            .WithName("CreateProjectFromTemplate")
            .Produces<ProjectResponse>(StatusCodes.Status201Created)
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapGet("/{id:guid}/activity", GetProjectActivity)
            .WithName("GetProjectActivity")
            .Produces<List<ProjectActivityResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Guest);

        group.MapGet("/{id:guid}/metrics", GetProjectMetrics)
            .WithName("GetProjectMetrics")
            .Produces<ProjectMetricsResponse>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Member);
    }

    // ── GET /api/v1/projects ──
    private static async Task<IResult> ListProjects(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        string? status = null,
        Guid? leadId = null,
        int pageSize = 25,
        int page = 1,
        string sortBy = "createdAt",
        string sortOrder = "desc")
    {
        var userId = currentUser.UserId;
        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var offset = (int)Math.Min((long)(Math.Max(page, 1) - 1) * effectivePageSize, int.MaxValue);
        var query = db.Projects.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ProjectStatus>(status, true, out var ps))
            query = query.Where(p => p.Status == ps);
        if (leadId.HasValue)
            query = query.Where(p => p.LeadId == leadId.Value);

        query = sortBy.ToLowerInvariant() switch
        {
            "name" => sortOrder == "asc" ? query.OrderBy(p => p.Name) : query.OrderByDescending(p => p.Name),
            "status" => sortOrder == "asc" ? query.OrderBy(p => p.Status) : query.OrderByDescending(p => p.Status),
            "sortorder" => sortOrder == "asc" ? query.OrderBy(p => p.SortOrder) : query.OrderByDescending(p => p.SortOrder),
            _ => sortOrder == "asc" ? query.OrderBy(p => p.CreatedAt) : query.OrderByDescending(p => p.CreatedAt)
        };

        var projects = await query.Skip(offset).Take(effectivePageSize)
            .Select(p => new ProjectResponse(
                p.Id,
                p.WorkspaceId,
                p.Name,
                p.Identifier,
                p.Description,
                p.Color,
                p.IconUrl,
                p.Status,
                p.Visibility,
                p.Lead != null
                    ? new UserBriefResponse(p.Lead.Id, p.Lead.FullName, p.Lead.AvatarUrl)
                    : null,
                p.StartDate,
                p.TargetDate,
                p.SortOrder,
                p.Tasks.Count(t => !t.IsDeleted),
                p.Tasks.Count(t => !t.IsDeleted && t.Status == TaskItemStatus.Done),
                userId.HasValue && p.Favorites.Any(f => f.UserId == userId.Value),
                p.CreatedAt,
                p.UpdatedAt))
            .ToListAsync(ct);

        return Results.Ok(projects);
    }

    // ── POST /api/v1/projects ──
    private static async Task<IResult> CreateProject(
        CreateProjectRequest request,
        IValidator<CreateProjectRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        // Check identifier uniqueness within workspace (global query filter scopes to workspace)
        if (await db.Projects.AnyAsync(p => p.Identifier == request.Identifier, ct))
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: $"A project with identifier '{request.Identifier}' already exists in this workspace.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var project = new Project
        {
            Name = request.Name,
            Identifier = request.Identifier,
            Description = request.Description,
            Color = request.Color,
            IconUrl = request.IconUrl,
            Status = request.Status ?? ProjectStatus.Active,
            Visibility = request.Visibility ?? ProjectVisibility.Workspace,
            LeadId = request.LeadId,
            StartDate = request.StartDate,
            TargetDate = request.TargetDate,
            Metadata = request.Metadata,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync(ct);

        var response = new ProjectResponse(
            project.Id,
            project.WorkspaceId,
            project.Name,
            project.Identifier,
            project.Description,
            project.Color,
            project.IconUrl,
            project.Status,
            project.Visibility,
            null, // Lead not loaded for newly created project
            project.StartDate,
            project.TargetDate,
            project.SortOrder,
            0,
            0,
            false,
            project.CreatedAt,
            project.UpdatedAt);

        return Results.Created($"/api/v1/projects/{project.Id}", response);
    }

    // ── GET /api/v1/projects/{id} ──
    private static async Task<IResult> GetProject(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId;

        var proj = await db.Projects.AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.WorkspaceId,
                p.Name,
                p.Identifier,
                p.Description,
                p.Color,
                p.IconUrl,
                p.Status,
                p.Visibility,
                Lead = p.Lead != null
                    ? new UserBriefResponse(p.Lead.Id, p.Lead.FullName, p.Lead.AvatarUrl)
                    : null,
                p.StartDate,
                p.TargetDate,
                p.SortOrder,
                TaskCount = p.Tasks.Count(t => !t.IsDeleted),
                CompletedTaskCount = p.Tasks.Count(t => !t.IsDeleted && t.Status == TaskItemStatus.Done),
                OpenTaskCount = p.Tasks.Count(t => !t.IsDeleted && t.Status != TaskItemStatus.Done && t.Status != TaskItemStatus.Cancelled),
                IsFavorited = userId.HasValue && p.Favorites.Any(f => f.UserId == userId.Value),
                p.Metadata,
                p.CreatedAt,
                p.UpdatedAt
            })
            .FirstOrDefaultAsync(ct);

        if (proj is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Project with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Count active workspace members — global query filter already scopes to the current workspace
        var memberCount = await db.Memberships.CountAsync(ct);

        return Results.Ok(new ProjectDetailResponse(
            proj.Id,
            proj.WorkspaceId,
            proj.Name,
            proj.Identifier,
            proj.Description,
            proj.Color,
            proj.IconUrl,
            proj.Status,
            proj.Visibility,
            proj.Lead,
            proj.StartDate,
            proj.TargetDate,
            proj.SortOrder,
            proj.TaskCount,
            proj.CompletedTaskCount,
            proj.OpenTaskCount,
            memberCount,
            proj.IsFavorited,
            proj.Metadata,
            proj.CreatedAt,
            proj.UpdatedAt));
    }

    // ── PUT /api/v1/projects/{id} ──
    private static async Task<IResult> UpdateProject(
        Guid id,
        UpdateProjectRequest request,
        IValidator<UpdateProjectRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (project is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Project with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // If identifier changed, check uniqueness
        if (!string.Equals(project.Identifier, request.Identifier, StringComparison.Ordinal))
        {
            if (await db.Projects.AnyAsync(p => p.Identifier == request.Identifier && p.Id != id, ct))
            {
                return Results.Problem(
                    title: ProblemTitles.Conflict,
                    detail: $"A project with identifier '{request.Identifier}' already exists in this workspace.",
                    statusCode: StatusCodes.Status409Conflict);
            }
        }

        project.Name = request.Name;
        project.Identifier = request.Identifier;
        project.Description = request.Description;
        project.Color = request.Color;
        project.IconUrl = request.IconUrl;
        project.Status = request.Status;
        project.Visibility = request.Visibility;
        project.LeadId = request.LeadId;
        project.StartDate = request.StartDate;
        project.TargetDate = request.TargetDate;
        project.Metadata = request.Metadata;
        project.UpdatedBy = userId;

        if (request.SortOrder.HasValue)
            project.SortOrder = request.SortOrder.Value;

        await db.SaveChangesAsync(ct);

        // Reload lead info for response
        UserBriefResponse? lead = null;
        if (project.LeadId.HasValue)
        {
            lead = await db.Users.AsNoTracking()
                .Where(u => u.Id == project.LeadId.Value)
                .Select(u => new UserBriefResponse(u.Id, u.FullName, u.AvatarUrl))
                .FirstOrDefaultAsync(ct);
        }

        var taskCounts = await db.TaskItems.AsNoTracking()
            .Where(t => t.ProjectId == id && !t.IsDeleted)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Completed = g.Count(t => t.Status == TaskItemStatus.Done)
            })
            .FirstOrDefaultAsync(ct);

        var response = new ProjectResponse(
            project.Id,
            project.WorkspaceId,
            project.Name,
            project.Identifier,
            project.Description,
            project.Color,
            project.IconUrl,
            project.Status,
            project.Visibility,
            lead,
            project.StartDate,
            project.TargetDate,
            project.SortOrder,
            taskCounts?.Total ?? 0,
            taskCounts?.Completed ?? 0,
            await db.ProjectFavorites.AnyAsync(
                favorite => favorite.ProjectId == project.Id && favorite.UserId == userId,
                ct),
            project.CreatedAt,
            project.UpdatedAt);

        return Results.Ok(response);
    }

    // ── DELETE /api/v1/projects/{id} ──
    private static async Task<IResult> DeleteProject(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (project is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Project with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        project.IsDeleted = true;
        project.DeletedAt = DateTime.UtcNow;
        project.DeletedBy = currentUser.UserId;

        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    // ── POST /api/v1/projects/{id}/favorite ──
    private static async Task<IResult> ToggleFavorite(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        if (!await db.Projects.AnyAsync(p => p.Id == id, ct))
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Project with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var existing = await db.ProjectFavorites
            .FirstOrDefaultAsync(f => f.ProjectId == id && f.UserId == userId, ct);

        if (existing is not null)
        {
            db.ProjectFavorites.Remove(existing);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new FavoriteToggleResponse(false));
        }

        db.ProjectFavorites.Add(new ProjectFavorite
        {
            ProjectId = id,
            UserId = userId,
            SortOrder = 0
        });
        await db.SaveChangesAsync(ct);

        return Results.Ok(new FavoriteToggleResponse(true));
    }

    // ── POST /api/v1/projects/from-template ──
    private static async Task<IResult> CreateFromTemplate(
        CreateFromTemplateRequest request,
        IValidator<CreateFromTemplateRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var template = await db.ProjectTemplates.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId, ct);

        if (template is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: "Project template was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Check identifier uniqueness within workspace
        if (await db.Projects.AnyAsync(p => p.Identifier == request.Identifier, ct))
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: $"A project with identifier '{request.Identifier}' already exists in this workspace.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var response = await ProjectTemplateService.CreateProjectFromTemplateAsync(
            db,
            currentUser,
            template,
            request,
            ct);

        return Results.Created($"/api/v1/projects/{response.Id}", response);
    }

    // â”€â”€ GET /api/v1/projects/templates â”€â”€
    private static async Task<IResult> ListTemplates(
        AppDbContext db,
        CancellationToken ct)
    {
        var templates = await ProjectTemplateService.ListProjectTemplatesAsync(db, ct);
        return Results.Ok(templates);
    }

    // ── GET /api/v1/projects/{id}/activity ──
    private static async Task<IResult> GetProjectActivity(
        Guid id,
        AppDbContext db,
        CancellationToken ct,
        int pageSize = 25)
    {
        if (!await db.Projects.AnyAsync(p => p.Id == id, ct))
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Project with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var activity = await db.AuditEvents
            .AsNoTracking()
            .Where(a => a.EntityType == "Project" && a.EntityId == id)
            .OrderByDescending(a => a.CreatedAt)
            .Take(Math.Clamp(pageSize, 1, 100))
            .Select(a => new ProjectActivityResponse(
                a.Id,
                a.Action,
                a.EntityType,
                a.EntityId,
                a.ActorId,
                a.Actor != null ? a.Actor.FullName : null,
                a.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(activity);
    }

    // ── GET /api/v1/projects/{id}/metrics ──
    private static async Task<IResult> GetProjectMetrics(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        if (!await db.Projects.AnyAsync(p => p.Id == id, ct))
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Project with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var metrics = await db.TaskItems.AsNoTracking()
            .Where(t => t.ProjectId == id && !t.IsDeleted)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TaskCount = g.Count(),
                CompletedTaskCount = g.Count(t => t.Status == TaskItemStatus.Done),
                OpenTaskCount = g.Count(t => t.Status != TaskItemStatus.Done && t.Status != TaskItemStatus.Cancelled),
                OverdueTaskCount = g.Count(t => t.DueDate.HasValue
                    && t.DueDate.Value < today
                    && t.Status != TaskItemStatus.Done
                    && t.Status != TaskItemStatus.Cancelled),
                MemberCount = g.Where(t => t.AssigneeId.HasValue)
                    .Select(t => t.AssigneeId!.Value)
                    .Distinct()
                    .Count()
            })
            .FirstOrDefaultAsync(ct);

        return Results.Ok(new ProjectMetricsResponse(
            id,
            metrics?.TaskCount ?? 0,
            metrics?.CompletedTaskCount ?? 0,
            metrics?.OpenTaskCount ?? 0,
            metrics?.OverdueTaskCount ?? 0,
            metrics?.MemberCount ?? 0));
    }
}
