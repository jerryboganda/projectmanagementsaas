using FluentValidation;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Infrastructure.Persistence.Seeding;
using LinearPrecision.Api.Modules.Workspace.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using LinearPrecision.Shared.Extensions;
using Microsoft.EntityFrameworkCore;
using WorkspaceEntity = LinearPrecision.Api.Entities.Workspace;

namespace LinearPrecision.Api.Modules.Workspace.Endpoints;

public static partial class WorkspaceEndpoints
{
    private const int DefaultPageSize = 25;
    private const int MaxPageSize = 100;
    private const string DefaultTimezone = "America/Los_Angeles";
    private const string DefaultDateFormat = "MM/DD/YYYY";
    private const string DefaultTimeFormat = "12h";
    private const string DefaultWeekStartsOn = "Monday";

    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/workspaces")
            .WithTags("Workspaces");

        // Endpoints that don't require workspace context
        group.MapPost("/", CreateWorkspace)
            .WithName("CreateWorkspace")
            .RequireAuthorization();

        group.MapGet("/", ListWorkspaces)
            .WithName("ListWorkspaces")
            .RequireAuthorization();

        // Endpoints that require workspace membership
        group.MapGet("/{id:guid}", GetWorkspace)
            .WithName("GetWorkspace")
            .RequireAuthorization();

        group.MapGet("/{id:guid}/settings", GetSettings)
            .WithName("GetWorkspaceSettings")
            .RequireAuthorization();

        group.MapPut("/{id:guid}", UpdateWorkspace)
            .WithName("UpdateWorkspace")
            .RequireAuthorization();

        group.MapDelete("/{id:guid}", DeleteWorkspace)
            .WithName("DeleteWorkspace")
            .RequireAuthorization();

        group.MapGet("/{id:guid}/members", ListMembers)
            .WithName("ListWorkspaceMembers")
            .RequireAuthorization();

        group.MapPut("/{id:guid}/members/{userId:guid}", UpdateMemberRole)
            .WithName("UpdateWorkspaceMemberRole")
            .RequireAuthorization();

        group.MapDelete("/{id:guid}/members/{userId:guid}", RemoveMember)
            .WithName("RemoveWorkspaceMember")
            .RequireAuthorization();

        group.MapPost("/{id:guid}/invitations", InviteMember)
            .WithName("InviteWorkspaceMember")
            .RequireAuthorization();

        group.MapPut("/{id:guid}/settings", UpdateSettings)
            .WithName("UpdateWorkspaceSettings")
            .RequireAuthorization();
    }

    // ── POST /api/v1/workspaces ──
    private static async Task<IResult> CreateWorkspace(
        CreateWorkspaceRequest request,
        IValidator<CreateWorkspaceRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var slug = GenerateSlug(request.Name);

        // Check slug uniqueness; append random suffix if taken
        if (await db.Workspaces.AnyAsync(w => w.Slug == slug, ct))
        {
            slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
        }

        var workspace = new WorkspaceEntity
        {
            Id = GuidExtensions.NewSequentialGuid(),
            Name = request.Name,
            Slug = slug,
            Description = request.Description,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        db.Workspaces.Add(workspace);

        var membership = new Entities.Membership
        {
            WorkspaceId = workspace.Id,
            UserId = userId,
            Role = MembershipRole.Owner,
            IsActive = true,
            JoinedAt = DateTime.UtcNow
        };

        db.Memberships.Add(membership);
        await db.SaveChangesAsync(ct);

        await ProjectTemplateSeeder.SeedWorkspaceAsync(db, workspace.Id, ct);

        var response = new WorkspaceResponse(
            workspace.Id,
            workspace.Name,
            workspace.Slug,
            workspace.Description,
            workspace.LogoUrl,
            workspace.Domain,
            MembershipRole.Owner,
            1,
            workspace.CreatedAt);

        return Results.Created($"/api/v1/workspaces/{workspace.Id}", response);
    }

    // ── GET /api/v1/workspaces ──
    private static async Task<IResult> ListWorkspaces(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        int page = 1,
        int pageSize = DefaultPageSize)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        var effectivePageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var workspaces = await db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(m => m.UserId == userId && m.IsActive)
            .Join(
                db.Workspaces.AsNoTracking().Where(w => !w.IsDeleted),
                m => m.WorkspaceId,
                w => w.Id,
                (m, w) => new { Membership = m, Workspace = w })
            .OrderByDescending(x => x.Workspace.CreatedAt)
            .ThenBy(x => x.Workspace.Name)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(x => new WorkspaceResponse(
                x.Workspace.Id,
                x.Workspace.Name,
                x.Workspace.Slug,
                x.Workspace.Description,
                x.Workspace.LogoUrl,
                x.Workspace.Domain,
                (MembershipRole?)x.Membership.Role,
                db.Memberships.IgnoreQueryFilters()
                    .Count(mm => mm.WorkspaceId == x.Workspace.Id && mm.IsActive),
                x.Workspace.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(workspaces);
    }

    // ── GET /api/v1/workspaces/{id} ──
    private static async Task<IResult> GetWorkspace(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var authorizationResult = await RequireWorkspaceRoleAsync(
            id,
            MembershipRole.Guest,
            db,
            currentUser,
            ct);
        if (authorizationResult is not null)
        {
            return authorizationResult;
        }

        var workspace = await db.Workspaces
            .AsNoTracking()
            .Where(w => w.Id == id)
            .Select(w => new
            {
                w.Id,
                w.Name,
                w.Slug,
                w.Description,
                w.LogoUrl,
                w.Domain,
                w.CreatedAt,
                MemberCount = db.Memberships.IgnoreQueryFilters()
                    .Count(m => m.WorkspaceId == w.Id && m.IsActive)
            })
            .FirstOrDefaultAsync(ct);

        if (workspace is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Workspace with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        MembershipRole? currentUserRole = null;
        if (currentUser.UserId.HasValue)
        {
            currentUserRole = await db.Memberships
                .IgnoreQueryFilters()
                .Where(m => m.WorkspaceId == id && m.UserId == currentUser.UserId.Value && m.IsActive)
                .Select(m => (MembershipRole?)m.Role)
                .FirstOrDefaultAsync(ct);
        }

        var response = new WorkspaceResponse(
            workspace.Id,
            workspace.Name,
            workspace.Slug,
            workspace.Description,
            workspace.LogoUrl,
            workspace.Domain,
            currentUserRole,
            workspace.MemberCount,
            workspace.CreatedAt);

        return Results.Ok(response);
    }

    // ── GET /api/v1/workspaces/{id}/settings ──
    private static async Task<IResult> GetSettings(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var authorizationResult = await RequireWorkspaceRoleAsync(
            id,
            MembershipRole.Guest,
            db,
            currentUser,
            ct);
        if (authorizationResult is not null)
        {
            return authorizationResult;
        }

        var workspace = await db.Workspaces
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new
            {
                item.Id,
                item.Name,
                item.Slug,
                item.Description,
                item.LogoUrl,
                item.Domain,
                item.Settings
            })
            .FirstOrDefaultAsync(ct);

        if (workspace is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Workspace with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        MembershipRole? currentUserRole = null;
        if (currentUser.UserId.HasValue)
        {
            currentUserRole = await db.Memberships
                .IgnoreQueryFilters()
                .Where(membership => membership.WorkspaceId == id
                    && membership.UserId == currentUser.UserId.Value
                    && membership.IsActive)
                .Select(membership => (MembershipRole?)membership.Role)
                .FirstOrDefaultAsync(ct);
        }

        var response = new WorkspaceSettingsResponse(
            workspace.Id,
            workspace.Name,
            workspace.Slug,
            workspace.Description,
            workspace.LogoUrl,
            workspace.Domain,
            currentUserRole,
            ReadSetting(workspace.Settings, "timezone", DefaultTimezone),
            ReadSetting(workspace.Settings, "dateFormat", DefaultDateFormat),
            ReadSetting(workspace.Settings, "timeFormat", DefaultTimeFormat),
            ReadSetting(workspace.Settings, "weekStartsOn", DefaultWeekStartsOn));

        return Results.Ok(response);
    }

    // ── PUT /api/v1/workspaces/{id} ──
    private static async Task<IResult> UpdateWorkspace(
        Guid id,
        UpdateWorkspaceRequest request,
        IValidator<UpdateWorkspaceRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var authorizationResult = await RequireWorkspaceRoleAsync(
            id,
            MembershipRole.Admin,
            db,
            currentUser,
            ct);
        if (authorizationResult is not null)
        {
            return authorizationResult;
        }

        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var workspace = await db.Workspaces.FindAsync([id], ct);
        if (workspace is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Workspace with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        if (request.Name is not null) workspace.Name = request.Name;
        if (request.Description is not null) workspace.Description = request.Description;
        if (request.LogoUrl is not null) workspace.LogoUrl = request.LogoUrl;
        if (request.Domain is not null) workspace.Domain = request.Domain;

        await db.SaveChangesAsync(ct);

        var memberCount = await db.Memberships
            .IgnoreQueryFilters()
            .CountAsync(m => m.WorkspaceId == id && m.IsActive, ct);

        MembershipRole? currentUserRole = null;
        if (currentUser.UserId.HasValue)
        {
            currentUserRole = await db.Memberships
                .IgnoreQueryFilters()
                .Where(m => m.WorkspaceId == id && m.UserId == currentUser.UserId.Value && m.IsActive)
                .Select(m => (MembershipRole?)m.Role)
                .FirstOrDefaultAsync(ct);
        }

        var response = new WorkspaceResponse(
            workspace.Id,
            workspace.Name,
            workspace.Slug,
            workspace.Description,
            workspace.LogoUrl,
            workspace.Domain,
            currentUserRole,
            memberCount,
            workspace.CreatedAt);

        return Results.Ok(response);
    }

    // ── DELETE /api/v1/workspaces/{id} ──
    private static async Task<IResult> DeleteWorkspace(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var authorizationResult = await RequireWorkspaceRoleAsync(
            id,
            MembershipRole.Owner,
            db,
            currentUser,
            ct);
        if (authorizationResult is not null)
        {
            return authorizationResult;
        }

        var workspace = await db.Workspaces.FindAsync([id], ct);
        if (workspace is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Workspace with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        workspace.IsDeleted = true;
        workspace.DeletedAt = DateTime.UtcNow;
        workspace.DeletedBy = currentUser.UserId;

        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    // ── PUT /api/v1/workspaces/{id}/settings ──
    private static async Task<IResult> UpdateSettings(
        Guid id,
        UpdateSettingsRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var authorizationResult = await RequireWorkspaceRoleAsync(
            id,
            MembershipRole.Admin,
            db,
            currentUser,
            ct);
        if (authorizationResult is not null)
        {
            return authorizationResult;
        }

        var workspace = await db.Workspaces.FindAsync([id], ct);
        if (workspace is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Workspace with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        workspace.Settings = request.Settings;
        await db.SaveChangesAsync(ct);

        return Results.Ok(new { id = workspace.Id, settings = workspace.Settings });
    }
}
