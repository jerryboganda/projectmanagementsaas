using System.Security.Cryptography;
using FluentValidation;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Workspace.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace LinearPrecision.Api.Modules.Workspace.Endpoints;

public static partial class WorkspaceEndpoints
{
    // ── GET /api/v1/workspaces/{id}/members ──
    private static async Task<IResult> ListMembers(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        int page = 1,
        int pageSize = DefaultPageSize)
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

        var effectivePageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var members = await db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(m => m.WorkspaceId == id)
            .OrderBy(m => m.JoinedAt)
            .ThenBy(m => m.User.FullName)
            .ThenBy(m => m.User.Email)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(m => new MemberResponse(
                m.Id,
                m.UserId,
                m.User.Email ?? string.Empty,
                m.User.FullName,
                m.User.AvatarUrl,
                m.Role,
                m.IsActive,
                m.JoinedAt))
            .ToListAsync(ct);

        return Results.Ok(members);
    }

    // ── PUT /api/v1/workspaces/{id}/members/{userId} ──
    private static async Task<IResult> UpdateMemberRole(
        Guid id,
        Guid userId,
        UpdateMemberRoleRequest request,
        AppDbContext db,
        IDistributedCache cache,
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

        var membership = await db.Memberships
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(m => m.WorkspaceId == id && m.UserId == userId && m.IsActive, ct);

        if (membership is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Member with user id '{userId}' was not found in this workspace.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Prevent demoting the last Owner
        if (membership.Role == MembershipRole.Owner && request.Role != MembershipRole.Owner)
        {
            var ownerCount = await db.Memberships
                .IgnoreQueryFilters()
                .CountAsync(m => m.WorkspaceId == id && m.Role == MembershipRole.Owner && m.IsActive, ct);

            if (ownerCount <= 1)
            {
                return Results.Problem(
                    title: ProblemTitles.Forbidden,
                    detail: "Cannot change the role of the last workspace owner.",
                    statusCode: StatusCodes.Status403Forbidden);
            }
        }

        membership.Role = request.Role;
        await db.SaveChangesAsync(ct);
        await cache.RemoveAsync(WorkspaceRoleAuthorizationHandler.RoleCacheKey(id, userId), ct);

        var user = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Email, u.FullName, u.AvatarUrl })
            .FirstAsync(ct);

        var response = new MemberResponse(
            membership.Id,
            membership.UserId,
            user.Email ?? string.Empty,
            user.FullName,
            user.AvatarUrl,
            membership.Role,
            membership.IsActive,
            membership.JoinedAt);

        return Results.Ok(response);
    }

    // ── DELETE /api/v1/workspaces/{id}/members/{userId} ──
    private static async Task<IResult> RemoveMember(
        Guid id,
        Guid userId,
        AppDbContext db,
        IDistributedCache cache,
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

        var membership = await db.Memberships
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(m => m.WorkspaceId == id && m.UserId == userId && m.IsActive, ct);

        if (membership is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Member with user id '{userId}' was not found in this workspace.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Prevent removing the last Owner
        if (membership.Role == MembershipRole.Owner)
        {
            var ownerCount = await db.Memberships
                .IgnoreQueryFilters()
                .CountAsync(m => m.WorkspaceId == id && m.Role == MembershipRole.Owner && m.IsActive, ct);

            if (ownerCount <= 1)
            {
                return Results.Problem(
                    title: ProblemTitles.Forbidden,
                    detail: "Cannot remove the last workspace owner.",
                    statusCode: StatusCodes.Status403Forbidden);
            }
        }

        membership.IsActive = false;
        membership.LeftAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await cache.RemoveAsync(WorkspaceRoleAuthorizationHandler.RoleCacheKey(id, userId), ct);

        return Results.NoContent();
    }

    // ── POST /api/v1/workspaces/{id}/invitations ──
    private static async Task<IResult> InviteMember(
        Guid id,
        InviteMemberRequest request,
        IValidator<InviteMemberRequest> validator,
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

        var userId = currentUser.UserId
            ?? throw new UnauthorizedAccessException("User is not authenticated.");

        // Check if user is already a member
        var isMember = await db.Memberships
            .IgnoreQueryFilters()
            .AnyAsync(m => m.WorkspaceId == id
                && m.User.NormalizedEmail == request.Email.ToUpperInvariant()
                && m.IsActive, ct);

        if (isMember)
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: "A user with this email is already a member of the workspace.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // Check if invitation already pending
        var hasPendingInvitation = await db.Invitations
            .IgnoreQueryFilters()
            .AnyAsync(i => i.WorkspaceId == id
                && i.Email == request.Email
                && i.Status == InvitationStatus.Pending, ct);

        if (hasPendingInvitation)
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: "A pending invitation already exists for this email.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // F-04: generate a cryptographically secure token. The plaintext value is
        // sent to the invitee via email; only the SHA-256 hash is persisted, so a
        // read-only DB leak does not expose usable invitation links.
        var tokenBytes = new byte[48]; // 48 bytes → 64 base64 chars
        RandomNumberGenerator.Fill(tokenBytes);
        var token = Convert.ToBase64String(tokenBytes);
        var tokenHash = InvitationTokenHasher.Hash(token);

        var invitation = new Entities.Invitation
        {
            WorkspaceId = id,
            Email = request.Email,
            Role = request.Role,
            InvitedBy = userId,
            Token = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Status = InvitationStatus.Pending
        };

        db.Invitations.Add(invitation);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/v1/workspaces/{id}/invitations/{invitation.Id}", new { invitation.Id });
    }
}
