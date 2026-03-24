using System.IdentityModel.Tokens.Jwt;
using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Api.Modules.Identity.Services;
using LinearPrecision.Api.Modules.Workspace.Endpoints;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using LinearPrecision.Shared.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WorkspaceEntity = LinearPrecision.Api.Entities.Workspace;

namespace LinearPrecision.Api.Modules.Identity.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth").WithTags("Authentication");

        group.MapPost("/register", RegisterAsync)
            .WithName("Register")
            .Produces<AuthSessionResponse>(201)
            .ProducesValidationProblem()
            .AllowAnonymous();

        group.MapPost("/login", LoginAsync)
            .WithName("Login")
            .Produces<AuthSessionResponse>(200)
            .ProducesProblem(401)
            .AllowAnonymous();

        group.MapPost("/refresh", RefreshAsync)
            .WithName("RefreshToken")
            .Produces<AuthSessionResponse>(200)
            .ProducesProblem(401)
            .AllowAnonymous();

        group.MapPost("/forgot-password", ForgotPasswordAsync)
            .WithName("ForgotPassword")
            .Produces(202)
            .ProducesValidationProblem()
            .AllowAnonymous();

        group.MapPost("/reset-password", ResetPasswordAsync)
            .WithName("ResetPassword")
            .Produces(204)
            .ProducesValidationProblem()
            .AllowAnonymous();

        group.MapPost("/logout", LogoutAsync)
            .WithName("Logout")
            .Produces(204)
            .RequireAuthorization();

        return app;
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest request,
        IValidator<RegisterRequest> validator,
        UserManager<User> userManager,
        AppDbContext db,
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

        if (await userManager.FindByEmailAsync(request.Email) is not null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(RegisterRequest.Email)] = ["A user with this email already exists."]
            });
        }

        var user = new User
        {
            Email = request.Email,
            UserName = request.Email,
            FullName = request.FullName,
            IsActive = true,
            Timezone = "UTC",
            Locale = "en-US",
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow,
            LastLoginIp = httpContext.Connection.RemoteIpAddress?.ToString()
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors
                .GroupBy(error => error.Code)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.Description).ToArray());
            return Results.ValidationProblem(errors);
        }

        var workspaceName = $"{request.FullName}'s Workspace";
        var slug = WorkspaceEndpoints.GenerateSlug(workspaceName);
        if (await db.Workspaces.IgnoreQueryFilters().AnyAsync(workspace => workspace.Slug == slug, ct))
        {
            slug = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";
        }

        var workspace = new WorkspaceEntity
        {
            Id = GuidExtensions.NewSequentialGuid(),
            Name = workspaceName,
            Slug = slug,
            CreatedBy = user.Id,
            UpdatedBy = user.Id
        };

        db.Workspaces.Add(workspace);
        db.Memberships.Add(new Membership
        {
            WorkspaceId = workspace.Id,
            UserId = user.Id,
            Role = MembershipRole.Owner,
            IsActive = true,
            JoinedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);
        user.LastActiveWorkspaceId = workspace.Id;
        await userManager.UpdateAsync(user);

        var session = await tokenService.GenerateTokenPairAsync(user, workspace.Id);
        AuthCookieHelper.SetRefreshTokenCookie(httpContext, session.RefreshToken);

        return Results.Created($"/api/v1/users/{user.Id}", session);
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        IValidator<LoginRequest> validator,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ITokenService tokenService,
        HttpContext httpContext)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.ErrorMessage).ToArray());
            return Results.ValidationProblem(errors);
        }

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            return Results.Problem(
                title: "Invalid credentials",
                detail: "Email or password is incorrect.",
                statusCode: 401);
        }

        var signInResult = await signInManager.CheckPasswordSignInAsync(
            user, request.Password, lockoutOnFailure: true);

        if (signInResult.IsLockedOut)
        {
            return Results.Problem(
                title: "Account locked",
                detail: "Account is temporarily locked due to too many failed attempts.",
                statusCode: 401);
        }

        if (!signInResult.Succeeded)
        {
            return Results.Problem(
                title: "Invalid credentials",
                detail: "Email or password is incorrect.",
                statusCode: 401);
        }

        user.LastLoginAt = DateTime.UtcNow;
        user.LastLoginIp = httpContext.Connection.RemoteIpAddress?.ToString();
        await userManager.UpdateAsync(user);

        var session = await tokenService.GenerateTokenPairAsync(user);
        AuthCookieHelper.SetRefreshTokenCookie(httpContext, session.RefreshToken);
        return Results.Ok(session);
    }

    private static async Task<IResult> RefreshAsync(
        RefreshRequest? request,
        ITokenService tokenService,
        HttpContext httpContext)
    {
        var refreshToken = request?.RefreshToken;
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            httpContext.Request.Cookies.TryGetValue(AuthCookieHelper.RefreshCookieName, out refreshToken);
        }

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Results.Problem(
                title: "Invalid refresh token",
                detail: "A refresh token is required.",
                statusCode: 401);
        }

        var session = await tokenService.RefreshAsync(refreshToken);
        if (session is null)
        {
            return Results.Problem(
                title: "Invalid refresh token",
                detail: "The refresh token is invalid or expired.",
                statusCode: 401);
        }

        AuthCookieHelper.SetRefreshTokenCookie(httpContext, session.RefreshToken);
        return Results.Ok(session);
    }

    private static async Task<IResult> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        IValidator<ForgotPasswordRequest> validator,
        UserManager<User> userManager,
        IEmailService emailService,
        IConfiguration configuration,
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

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive || string.IsNullOrWhiteSpace(user.Email))
        {
            return Results.Accepted();
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var frontendBaseUrl = configuration["App:FrontendBaseUrl"] ?? "http://localhost:3000";
        var resetUrl =
            $"{frontendBaseUrl.TrimEnd('/')}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";

        await emailService.SendTemplatedAsync(
            user.Email,
            "password-reset",
            new
            {
                user.Email,
                resetUrl
            },
            ct);

        return Results.Accepted();
    }

    private static async Task<IResult> ResetPasswordAsync(
        ResetPasswordRequest request,
        IValidator<ResetPasswordRequest> validator,
        UserManager<User> userManager,
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

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(ResetPasswordRequest.Token)] = ["The password reset token is invalid."]
            });
        }

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors
                .GroupBy(error => error.Code)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.Description).ToArray());
            return Results.ValidationProblem(errors);
        }

        return Results.NoContent();
    }

    private static async Task<IResult> LogoutAsync(
        RefreshRequest? request,
        ITokenService tokenService,
        HttpContext httpContext)
    {
        var jti = httpContext.User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value
                  ?? string.Empty;

        var refreshToken = request?.RefreshToken;
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            httpContext.Request.Cookies.TryGetValue(AuthCookieHelper.RefreshCookieName, out refreshToken);
        }

        await tokenService.RevokeAsync(jti, refreshToken);
        httpContext.Response.Cookies.Delete(AuthCookieHelper.RefreshCookieName);
        return Results.NoContent();
    }
}
