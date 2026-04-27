using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Teams.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Teams.Endpoints;

public static class TeamEndpoints
{
    private const int DefaultPageSize = 50;
    private const int MaxPageSize = 100;

    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/teams")
            .WithTags("Teams")
            .RequireAuthorization();

        group.MapGet("/", ListTeams).WithName("ListTeams").RequireAuthorization(WorkspaceRoles.Member);
        group.MapPost("/", CreateTeam).WithName("CreateTeam").RequireAuthorization(WorkspaceRoles.Member);
        group.MapGet("/{id:guid}", GetTeam).WithName("GetTeam").RequireAuthorization(WorkspaceRoles.Member);
        group.MapPut("/{id:guid}", UpdateTeam).WithName("UpdateTeam").RequireAuthorization(WorkspaceRoles.Member);
        group.MapDelete("/{id:guid}", DeleteTeam).WithName("DeleteTeam").RequireAuthorization(WorkspaceRoles.Member);
        group.MapPut("/{id:guid}/members", SetMembers).WithName("SetTeamMembers").RequireAuthorization(WorkspaceRoles.Member);
        group.MapPost("/{id:guid}/members/{userId:guid}", AddMember).WithName("AddTeamMember").RequireAuthorization(WorkspaceRoles.Member);
        group.MapDelete("/{id:guid}/members/{userId:guid}", RemoveMember).WithName("RemoveTeamMember").RequireAuthorization(WorkspaceRoles.Member);
    }

    // ── GET /api/v1/teams ──
    private static async Task<IResult> ListTeams(
        AppDbContext db,
        ITenantContext tenant,
        CancellationToken ct,
        int page = 1,
        int pageSize = DefaultPageSize)
    {
        var workspaceId = tenant.WorkspaceId
            ?? throw new InvalidOperationException("Workspace context is required.");

        var effectivePageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var teams = await db.Teams
            .AsNoTracking()
            .Where(t => t.WorkspaceId == workspaceId && !t.IsDeleted)
            .OrderBy(t => t.Name)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                t.Color,
                t.CreatedAt,
                t.UpdatedAt
            })
            .ToListAsync(ct);

        if (teams.Count == 0)
        {
            return Results.Ok(new List<TeamResponse>());
        }

        var teamIds = teams.Select(t => t.Id).ToList();
        var memberRows = await db.TeamMemberships
            .AsNoTracking()
            .Where(m => teamIds.Contains(m.TeamId))
            .Join(db.Users, m => m.UserId, u => u.Id, (m, u) => new
            {
                m.TeamId,
                Member = new TeamMemberResponse(
                    u.Id,
                    u.FullName,
                    u.Email!,
                    u.AvatarUrl)
            })
            .ToListAsync(ct);

        var membersByTeam = memberRows
            .GroupBy(row => row.TeamId)
            .ToDictionary(group => group.Key, group => group.Select(row => row.Member).ToList());

        var response = teams.Select(t =>
        {
            var members = membersByTeam.TryGetValue(t.Id, out var teamMembers)
                ? teamMembers
                : new List<TeamMemberResponse>();

            return new TeamResponse(
                t.Id,
                t.Name,
                t.Description,
                t.Color,
                members.Count,
                members,
                t.CreatedAt,
                t.UpdatedAt);
        }).ToList();

        return Results.Ok(response);
    }

    // ── GET /api/v1/teams/{id} ──
    private static async Task<IResult> GetTeam(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var team = await LoadTeamAsync(db, id, ct);
        return team is null
            ? Results.Problem(title: ProblemTitles.NotFound, statusCode: StatusCodes.Status404NotFound)
            : Results.Ok(team);
    }

    // ── POST /api/v1/teams ──
    private static async Task<IResult> CreateTeam(
        CreateTeamRequest request,
        IValidator<CreateTeamRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        ITenantContext tenant,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var workspaceId = tenant.WorkspaceId
            ?? throw new InvalidOperationException("Workspace context is required.");

        var name = request.Name.Trim();

        var nameTaken = await db.Teams
            .AnyAsync(t => !t.IsDeleted && t.Name.ToLowerInvariant() == name.ToLowerInvariant(), ct);
        if (nameTaken)
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: $"A team named '{name}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var team = new Team
        {
            Name = name,
            Description = request.Description?.Trim(),
            Color = request.Color?.Trim(),
            CreatedBy = currentUser.UserId,
            UpdatedBy = currentUser.UserId
        };

        db.Teams.Add(team);

        if (request.MemberIds is { Count: > 0 })
        {
            var validUserIds = await db.Memberships
                .Where(m => m.IsActive && request.MemberIds.Contains(m.UserId))
                .Select(m => m.UserId)
                .ToListAsync(ct);

            foreach (var userId in validUserIds.Distinct())
            {
                db.TeamMemberships.Add(new TeamMembership
                {
                    TeamId = team.Id,
                    UserId = userId,
                    AddedAt = DateTime.UtcNow
                });
            }
        }

        await db.SaveChangesAsync(ct);

        var response = await LoadTeamAsync(db, team.Id, ct);
        return Results.Created($"/api/v1/teams/{team.Id}", response);
    }

    // ── PUT /api/v1/teams/{id} ──
    private static async Task<IResult> UpdateTeam(
        Guid id,
        UpdateTeamRequest request,
        IValidator<UpdateTeamRequest> validator,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (team is null)
        {
            return Results.Problem(title: ProblemTitles.NotFound, statusCode: StatusCodes.Status404NotFound);
        }

        var name = request.Name.Trim();
        if (!string.Equals(team.Name, name, StringComparison.OrdinalIgnoreCase))
        {
            var nameTaken = await db.Teams
                .AnyAsync(t => !t.IsDeleted && t.Id != id && t.Name.ToLowerInvariant() == name.ToLowerInvariant(), ct);
            if (nameTaken)
            {
                return Results.Problem(
                    title: ProblemTitles.Conflict,
                    detail: $"A team named '{name}' already exists.",
                    statusCode: StatusCodes.Status409Conflict);
            }
        }

        team.Name = name;
        team.Description = request.Description?.Trim();
        team.Color = request.Color?.Trim();
        team.UpdatedBy = currentUser.UserId;

        await db.SaveChangesAsync(ct);

        var response = await LoadTeamAsync(db, team.Id, ct);
        return Results.Ok(response);
    }

    // ── DELETE /api/v1/teams/{id} ──
    private static async Task<IResult> DeleteTeam(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (team is null)
        {
            return Results.Problem(title: ProblemTitles.NotFound, statusCode: StatusCodes.Status404NotFound);
        }

        team.IsDeleted = true;
        team.DeletedAt = DateTime.UtcNow;
        team.DeletedBy = currentUser.UserId;

        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    // ── PUT /api/v1/teams/{id}/members ── (replace full member list)
    private static async Task<IResult> SetMembers(
        Guid id,
        SetTeamMembersRequest request,
        AppDbContext db,
        CancellationToken ct)
    {
        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (team is null)
        {
            return Results.Problem(title: ProblemTitles.NotFound, statusCode: StatusCodes.Status404NotFound);
        }

        var requestedIds = request.UserIds?.Distinct().ToList() ?? [];

        var validUserIds = requestedIds.Count == 0
            ? new List<Guid>()
            : await db.Memberships
                .Where(m => m.IsActive && requestedIds.Contains(m.UserId))
                .Select(m => m.UserId)
                .ToListAsync(ct);

        var current = await db.TeamMemberships
            .Where(m => m.TeamId == id)
            .ToListAsync(ct);

        var toRemove = current.Where(m => !validUserIds.Contains(m.UserId)).ToList();
        db.TeamMemberships.RemoveRange(toRemove);

        var existingIds = current.Select(m => m.UserId).ToHashSet();
        foreach (var userId in validUserIds.Where(u => !existingIds.Contains(u)))
        {
            db.TeamMemberships.Add(new TeamMembership
            {
                TeamId = id,
                UserId = userId,
                AddedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync(ct);

        var response = await LoadTeamAsync(db, id, ct);
        return Results.Ok(response);
    }

    // ── POST /api/v1/teams/{id}/members/{userId} ──
    private static async Task<IResult> AddMember(
        Guid id,
        Guid userId,
        AppDbContext db,
        CancellationToken ct)
    {
        var team = await db.Teams.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, ct);
        if (team is null)
        {
            return Results.Problem(title: ProblemTitles.NotFound, statusCode: StatusCodes.Status404NotFound);
        }

        var isWorkspaceMember = await db.Memberships
            .AnyAsync(m => m.UserId == userId && m.IsActive, ct);
        if (!isWorkspaceMember)
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: "User is not a member of this workspace.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var exists = await db.TeamMemberships.AnyAsync(m => m.TeamId == id && m.UserId == userId, ct);
        if (!exists)
        {
            db.TeamMemberships.Add(new TeamMembership
            {
                TeamId = id,
                UserId = userId,
                AddedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync(ct);
        }

        var response = await LoadTeamAsync(db, id, ct);
        return Results.Ok(response);
    }

    // ── DELETE /api/v1/teams/{id}/members/{userId} ──
    private static async Task<IResult> RemoveMember(
        Guid id,
        Guid userId,
        AppDbContext db,
        CancellationToken ct)
    {
        var membership = await db.TeamMemberships
            .FirstOrDefaultAsync(m => m.TeamId == id && m.UserId == userId, ct);
        if (membership is null)
        {
            return Results.NoContent();
        }

        db.TeamMemberships.Remove(membership);
        await db.SaveChangesAsync(ct);

        var response = await LoadTeamAsync(db, id, ct);
        return Results.Ok(response);
    }

    private static async Task<TeamResponse?> LoadTeamAsync(
        AppDbContext db,
        Guid id,
        CancellationToken ct)
    {
        var team = await db.Teams
            .AsNoTracking()
            .Where(t => t.Id == id && !t.IsDeleted)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                t.Color,
                t.CreatedAt,
                t.UpdatedAt,
                Members = db.TeamMemberships
                    .Where(m => m.TeamId == t.Id)
                    .Join(db.Users, m => m.UserId, u => u.Id, (m, u) => new TeamMemberResponse(
                        u.Id,
                        u.FullName,
                        u.Email!,
                        u.AvatarUrl))
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (team is null) return null;

        return new TeamResponse(
            team.Id,
            team.Name,
            team.Description,
            team.Color,
            team.Members.Count,
            team.Members,
            team.CreatedAt,
            team.UpdatedAt);
    }
}
