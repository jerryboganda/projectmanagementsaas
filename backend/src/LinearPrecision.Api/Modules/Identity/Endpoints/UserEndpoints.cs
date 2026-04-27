using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Api.Modules.Identity.Services;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Identity.Endpoints;

public static class UserEndpoints
{
    private static readonly string[] AllowedHubPaths =
    [
        "/hubs/board",
        "/hubs/notifications",
        "/hubs/presence",
        "/hubs/ai-stream",
    ];

    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/users")
            .RequireAuthorization()
            .WithTags("Users");

        group.MapGet("/me", GetMeAsync)
            .WithName("GetCurrentUser")
            .Produces<UserResponse>(200)
            .ProducesProblem(404);

        group.MapPut("/me", UpdateMeAsync)
            .WithName("UpdateCurrentUser")
            .Produces<UserResponse>(200)
            .ProducesValidationProblem()
            .ProducesProblem(404);

        group.MapPut("/me/password", ChangePasswordAsync)
            .WithName("ChangeCurrentUserPassword")
            .Produces(204)
            .ProducesValidationProblem()
            .ProducesProblem(404)
            .RequireRateLimiting("auth");

        group.MapGet("/me/workspaces", GetMyWorkspacesAsync)
            .WithName("GetCurrentUserWorkspaces")
            .Produces<List<UserWorkspaceResponse>>(200);

        group.MapPut("/me/active-workspace", SetActiveWorkspaceAsync)
            .WithName("SetCurrentUserActiveWorkspace")
            .Produces<AuthSessionBodyResponse>(200)
            .ProducesValidationProblem()
            .ProducesProblem(401)
            .ProducesProblem(403);

        group.MapPost("/me/hub-token", CreateHubTokenAsync)
            .WithName("CreateCurrentUserHubToken")
            .Produces<HubTokenResponse>(200)
            .ProducesValidationProblem()
            .ProducesProblem(401)
            .ProducesProblem(403)
            .RequireRateLimiting("auth");

        return app;
    }

    private static async Task<IResult> GetMeAsync(
        ICurrentUser currentUser,
        UserManager<User> userManager)
    {
        if (currentUser.UserId is null)
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null)
            return Results.NotFound();

        return Results.Ok(MapToUserResponse(user));
    }

    private static async Task<IResult> UpdateMeAsync(
        UpdateProfileRequest request,
        IValidator<UpdateProfileRequest> validator,
        ICurrentUser currentUser,
        UserManager<User> userManager)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
            return Results.ValidationProblem(errors);
        }

        if (currentUser.UserId is null)
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null)
            return Results.NotFound();

        if (request.FullName is not null) user.FullName = request.FullName;
        if (request.DisplayName is not null) user.DisplayName = request.DisplayName;
        if (request.AvatarUrl is not null) user.AvatarUrl = request.AvatarUrl;
        if (request.Timezone is not null) user.Timezone = request.Timezone;
        if (request.Locale is not null) user.Locale = request.Locale;
        if (request.JobTitle is not null) user.JobTitle = request.JobTitle;

        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = currentUser.UserId;

        await userManager.UpdateAsync(user);

        return Results.Ok(MapToUserResponse(user));
    }

    private static async Task<IResult> ChangePasswordAsync(
        ChangePasswordRequest request,
        ICurrentUser currentUser,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ITokenService tokenService)
    {
        if (currentUser.UserId is null)
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null)
            return Results.NotFound();

        var passwordResult = await signInManager.CheckPasswordSignInAsync(
            user, request.CurrentPassword, lockoutOnFailure: true);

        if (passwordResult.IsLockedOut)
        {
            return Results.Problem(
                title: "Account locked",
                detail: "Account is temporarily locked due to too many failed attempts.",
                statusCode: 401);
        }

        if (!passwordResult.Succeeded)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(ChangePasswordRequest.CurrentPassword)] = ["Current password is incorrect."]
            });
        }

        var result = await userManager.ChangePasswordAsync(
            user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = result.Errors
                .GroupBy(e => e.Code)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.Description).ToArray());
            return Results.ValidationProblem(errors);
        }

        await tokenService.RevokeAllRefreshTokensForUserAsync(user.Id);
        return Results.NoContent();
    }

    private static async Task<IResult> GetMyWorkspacesAsync(
        ICurrentUser currentUser,
        AppDbContext db,
        CancellationToken ct)
    {
        if (currentUser.UserId is null)
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);

        var userId = currentUser.UserId.Value;

        var workspaces = await db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(m => m.UserId == userId && m.IsActive)
            .Join(
                db.Workspaces.AsNoTracking().IgnoreQueryFilters().Where(w => !w.IsDeleted),
                m => m.WorkspaceId,
                w => w.Id,
                (m, w) => new UserWorkspaceResponse(
                    w.Id,
                    w.Name,
                    w.Slug,
                    w.LogoUrl,
                    m.Role,
                    w.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(workspaces);
    }

    private static async Task<IResult> SetActiveWorkspaceAsync(
        SetActiveWorkspaceRequest request,
        IValidator<SetActiveWorkspaceRequest> validator,
        ICurrentUser currentUser,
        AppDbContext db,
        UserManager<User> userManager,
        ITokenService tokenService,
        HttpContext httpContext,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.ErrorMessage).ToArray());
            return Results.ValidationProblem(errors);
        }

        if (currentUser.UserId is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        if (!await userManager.IsEmailConfirmedAsync(user))
        {
            return Results.Problem(
                title: "Email confirmation required",
                detail: "Confirm your email address before requesting a new session.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var isMember = await db.Memberships
            .IgnoreQueryFilters()
            .AnyAsync(
                membership => membership.UserId == user.Id
                    && membership.WorkspaceId == request.WorkspaceId
                    && membership.IsActive,
                ct);

        if (!isMember)
        {
            return Results.Problem(
                title: ProblemTitles.Forbidden,
                detail: "You do not have access to this workspace.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        user.LastActiveWorkspaceId = request.WorkspaceId;
        await userManager.UpdateAsync(user);

        var session = await tokenService.GenerateTokenPairAsync(user, request.WorkspaceId);
        AuthCookieHelper.SetRefreshTokenCookie(httpContext, session.RefreshToken);
        return Results.Ok(AuthCookieHelper.SessionResponseBody(httpContext, session));
    }

    private static async Task<IResult> CreateHubTokenAsync(
        HubTokenRequest request,
        ICurrentUser currentUser,
        AppDbContext db,
        UserManager<User> userManager,
        JwtTokenGenerator jwtTokenGenerator,
        CancellationToken ct)
    {
        if (currentUser.UserId is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        if (string.IsNullOrWhiteSpace(request.HubPath)
            || !AllowedHubPaths.Contains(request.HubPath, StringComparer.OrdinalIgnoreCase)
            || request.WorkspaceId == Guid.Empty)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(HubTokenRequest.HubPath)] = ["A supported hub path and workspace id are required."]
            });
        }

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null || !user.IsActive)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        if (!await userManager.IsEmailConfirmedAsync(user))
        {
            return Results.Problem(
                title: "Email confirmation required",
                detail: "Confirm your email address before requesting hub tokens.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var role = await db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(membership =>
                membership.UserId == user.Id
                && membership.WorkspaceId == request.WorkspaceId
                && membership.IsActive)
            .Select(membership => (MembershipRole?)membership.Role)
            .FirstOrDefaultAsync(ct);

        if (!role.HasValue)
        {
            return Results.Problem(
                title: ProblemTitles.Forbidden,
                detail: "You do not have access to this workspace.",
                statusCode: StatusCodes.Status403Forbidden);
        }

        var token = jwtTokenGenerator.GenerateHubAccessToken(
            user,
            role.Value,
            request.WorkspaceId,
            request.HubPath);

        return Results.Ok(new HubTokenResponse(token, ExpiresIn: 60, TokenType: "Bearer"));
    }

    private static UserResponse MapToUserResponse(User user) => new(
        Id: user.Id,
        Email: user.Email ?? string.Empty,
        FullName: user.FullName,
        DisplayName: user.DisplayName,
        AvatarUrl: user.AvatarUrl,
        Timezone: user.Timezone,
        Locale: user.Locale,
        JobTitle: user.JobTitle,
        IsActive: user.IsActive,
        CreatedAt: user.CreatedAt);
}
