using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Identity.Endpoints;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Api.Modules.Identity.Services;
using LinearPrecision.Api.Modules.Workspace.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace LinearPrecision.Api.Modules.Workspace.Endpoints;

public static class InvitationEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/invitations")
            .WithTags("Invitations");

        group.MapGet("/{token}", GetInvitationAsync)
            .WithName("GetInvitation")
            .Produces<InvitationDetailsResponse>(200)
            .ProducesProblem(404)
            .AllowAnonymous();

        group.MapPost("/{token}/accept", AcceptInvitationAsync)
            .WithName("AcceptInvitation")
            .Produces<AuthSessionBodyResponse>(200)
            .ProducesProblem(401)
            .ProducesProblem(403)
            .ProducesProblem(404)
            .RequireAuthorization();
    }

    private static async Task<IResult> GetInvitationAsync(
        string token,
        AppDbContext db,
        CancellationToken ct)
    {
        // F-04: hash the inbound plaintext token before lookup so the DB only ever
        // sees the hashed form. Avoid exposing inviter / project / member counts —
        // we return the minimum the accept screen needs.
        var tokenHash = InvitationTokenHasher.Hash(token);
        var invitation = await db.Invitations
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(item => item.Token == tokenHash)
            .Join(
                db.Workspaces.AsNoTracking().IgnoreQueryFilters().Where(workspace => !workspace.IsDeleted),
                item => item.WorkspaceId,
                workspace => workspace.Id,
                (item, workspace) => new InvitationDetailsResponse(
                    workspace.Id,
                    workspace.Name,
                    item.Email,
                    item.Role,
                    item.Status,
                    item.ExpiresAt))
            .FirstOrDefaultAsync(ct);

        return invitation is null ? Results.NotFound() : Results.Ok(invitation);
    }

    private static async Task<IResult> AcceptInvitationAsync(
        string token,
        AppDbContext db,
        ICurrentUser currentUser,
        UserManager<User> userManager,
        ITokenService tokenService,
        IDistributedCache cache,
        HttpContext httpContext,
        CancellationToken ct)
    {
        if (currentUser.UserId is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        if (!await userManager.IsEmailConfirmedAsync(user))
        {
            return Results.Problem(
                title: "Email confirmation required",
                detail: "Confirm your email address before accepting invitations.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var tokenHash = InvitationTokenHasher.Hash(token);
        var invitation = await db.Invitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(item => item.Token == tokenHash, ct);

        if (invitation is null)
        {
            return Results.NotFound();
        }

        if (invitation.Status != InvitationStatus.Pending)
        {
            return Results.Problem(
                title: "Invitation unavailable",
                detail: "This invitation is no longer pending.",
                statusCode: StatusCodes.Status409Conflict);
        }

        if (invitation.ExpiresAt <= DateTime.UtcNow)
        {
            invitation.Status = InvitationStatus.Expired;
            await db.SaveChangesAsync(ct);

            return Results.Problem(
                title: "Invitation expired",
                detail: "This invitation has expired.",
                statusCode: StatusCodes.Status410Gone);
        }

        if (!string.Equals(invitation.Email, user.Email, StringComparison.OrdinalIgnoreCase))
        {
            return Results.Problem(
                title: ProblemTitles.Forbidden,
                detail: "This invitation belongs to a different email address.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var membership = await db.Memberships
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                item => item.WorkspaceId == invitation.WorkspaceId
                    && item.UserId == user.Id,
                ct);

        if (membership is null)
        {
            db.Memberships.Add(new Membership
            {
                WorkspaceId = invitation.WorkspaceId,
                UserId = user.Id,
                Role = invitation.Role,
                IsActive = true,
                JoinedAt = DateTime.UtcNow
            });
        }
        else
        {
            membership.IsActive = true;
            membership.Role = invitation.Role;
            membership.JoinedAt ??= DateTime.UtcNow;
            membership.LeftAt = null;
        }

        invitation.Status = InvitationStatus.Accepted;
        user.LastActiveWorkspaceId = invitation.WorkspaceId;
        await userManager.UpdateAsync(user);
        await db.SaveChangesAsync(ct);
        await cache.RemoveAsync(WorkspaceRoleAuthorizationHandler.RoleCacheKey(invitation.WorkspaceId, user.Id), ct);

        var session = await tokenService.GenerateTokenPairAsync(user, invitation.WorkspaceId);
        AuthCookieHelper.SetRefreshTokenCookie(httpContext, session.RefreshToken);
        return Results.Ok(AuthCookieHelper.SessionResponseBody(httpContext, session));
    }
}
