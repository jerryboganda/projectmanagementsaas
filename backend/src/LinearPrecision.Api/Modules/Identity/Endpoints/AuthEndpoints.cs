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
            .Produces<RegistrationPendingResponse>(201)
            .ProducesValidationProblem()
            .AllowAnonymous()
            .RequireRateLimiting("auth");

        group.MapPost("/confirm-email", ConfirmEmailAsync)
            .WithName("ConfirmEmail")
            .Produces(204)
            .ProducesValidationProblem()
            .AllowAnonymous()
            .RequireRateLimiting("auth");

        group.MapPost("/resend-confirmation", ResendConfirmationAsync)
            .WithName("ResendEmailConfirmation")
            .Produces(202)
            .ProducesValidationProblem()
            .AllowAnonymous()
            .RequireRateLimiting("auth");

        group.MapPost("/login", LoginAsync)
            .WithName("Login")
            .Produces<AuthSessionBodyResponse>(200)
            .Produces<MfaChallengeResponse>(200)
            .ProducesProblem(401)
            .ProducesProblem(403)
            .AllowAnonymous()
            .RequireRateLimiting("auth");

        // F-13 — Step-2 of MFA-enabled login: redeem the challenge token + TOTP code.
        group.MapPost("/login/verify-mfa", VerifyMfaLoginAsync)
            .WithName("VerifyMfaLogin")
            .Produces<AuthSessionBodyResponse>(200)
            .ProducesProblem(401)
            .ProducesProblem(403)
            .AllowAnonymous()
            .RequireRateLimiting("auth");

        group.MapPost("/refresh", RefreshAsync)
            .WithName("RefreshToken")
            .Produces<AuthSessionBodyResponse>(200)
            .ProducesProblem(401)
            .AllowAnonymous()
            .RequireRateLimiting("auth");

        group.MapPost("/forgot-password", ForgotPasswordAsync)
            .WithName("ForgotPassword")
            .Produces(202)
            .ProducesValidationProblem()
            .AllowAnonymous()
            .RequireRateLimiting("auth");

        group.MapPost("/reset-password", ResetPasswordAsync)
            .WithName("ResetPassword")
            .Produces(204)
            .ProducesValidationProblem()
            .AllowAnonymous()
            .RequireRateLimiting("auth");

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
        IEmailService emailService,
        IConfiguration configuration,
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

        await SendEmailConfirmationAsync(user, userManager, emailService, configuration, ct);

        return Results.Created(
            $"/api/v1/users/{user.Id}",
            new RegistrationPendingResponse(
                user.Email ?? request.Email,
                RequiresEmailConfirmation: true,
                Message: "Registration created. Confirm your email address before signing in."));
    }

    private static async Task<IResult> ConfirmEmailAsync(
        ConfirmEmailRequest request,
        IValidator<ConfirmEmailRequest> validator,
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
        if (user is null || !user.IsActive)
        {
            return InvalidEmailConfirmationToken();
        }

        var result = await userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded)
        {
            return InvalidEmailConfirmationToken();
        }

        return Results.NoContent();
    }

    private static async Task<IResult> ResendConfirmationAsync(
        ResendConfirmationRequest request,
        IValidator<ResendConfirmationRequest> validator,
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
        if (user is not null && user.IsActive && !await userManager.IsEmailConfirmedAsync(user))
        {
            await SendEmailConfirmationAsync(user, userManager, emailService, configuration, ct);
        }

        return Results.Accepted();
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest request,
        IValidator<LoginRequest> validator,
        UserManager<User> userManager,
        ITokenService tokenService,
        MfaChallengeService mfaChallenge,
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

        if (await userManager.IsLockedOutAsync(user))
        {
            return Results.Problem(
                title: "Account locked",
                detail: "Account is temporarily locked due to too many failed attempts.",
                statusCode: 401);
        }

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            if (userManager.SupportsUserLockout && await userManager.GetLockoutEnabledAsync(user))
            {
                await userManager.AccessFailedAsync(user);
                if (await userManager.IsLockedOutAsync(user))
                {
                    return Results.Problem(
                        title: "Account locked",
                        detail: "Account is temporarily locked due to too many failed attempts.",
                        statusCode: 401);
                }
            }

            return Results.Problem(
                title: "Invalid credentials",
                detail: "Email or password is incorrect.",
                statusCode: 401);
        }

        if (userManager.SupportsUserLockout)
        {
            await userManager.ResetAccessFailedCountAsync(user);
        }

        if (!await userManager.IsEmailConfirmedAsync(user))
        {
            return EmailConfirmationRequired();
        }

        // F-13 — If the user has TOTP MFA enabled, do NOT mint a session yet.
        // Hand back a short-lived challenge token; client must call
        // /api/v1/auth/login/verify-mfa with the authenticator code to complete login.
        if (await userManager.GetTwoFactorEnabledAsync(user))
        {
            var mfaToken = await mfaChallenge.CreateAsync(user.Id);
            return Results.Ok(new MfaChallengeResponse(
                MfaRequired: true,
                MfaToken: mfaToken,
                ChallengeType: "totp"));
        }

        user.LastLoginAt = DateTime.UtcNow;
        user.LastLoginIp = httpContext.Connection.RemoteIpAddress?.ToString();
        await userManager.UpdateAsync(user);

        var session = await tokenService.GenerateTokenPairAsync(user);
        AuthCookieHelper.SetRefreshTokenCookie(httpContext, session.RefreshToken);
        return Results.Ok(AuthCookieHelper.SessionResponseBody(httpContext, session));
    }

    private static async Task<IResult> VerifyMfaLoginAsync(
        VerifyMfaLoginRequest request,
        UserManager<User> userManager,
        ITokenService tokenService,
        MfaChallengeService mfaChallenge,
        HttpContext httpContext)
    {
        if (string.IsNullOrWhiteSpace(request.MfaToken) || string.IsNullOrWhiteSpace(request.Code))
        {
            return Results.Problem(
                title: "Invalid MFA challenge",
                detail: "Both mfaToken and code are required.",
                statusCode: 401);
        }

        var userId = await mfaChallenge.RedeemAsync(request.MfaToken);
        if (userId is null)
        {
            return Results.Problem(
                title: "Invalid MFA challenge",
                detail: "MFA challenge is invalid or has expired. Please log in again.",
                statusCode: 401);
        }

        var user = await userManager.FindByIdAsync(userId.Value.ToString());
        if (user is null || !user.IsActive)
        {
            return Results.Problem(
                title: "Invalid credentials",
                detail: "Account is unavailable.",
                statusCode: 401);
        }

        if (!await userManager.IsEmailConfirmedAsync(user))
        {
            return EmailConfirmationRequired();
        }

        var code = (request.Code ?? string.Empty).Replace(" ", string.Empty, StringComparison.Ordinal);
        var ok = await userManager.VerifyTwoFactorTokenAsync(user, "Authenticator", code);
        if (!ok)
        {
            // Lockout-on-failure for MFA codes is delegated to the standard
            // password lockout window already configured on the user.
            await userManager.AccessFailedAsync(user);
            return Results.Problem(
                title: "Invalid MFA code",
                detail: "Authenticator code is incorrect or expired.",
                statusCode: 401);
        }

        await userManager.ResetAccessFailedCountAsync(user);
        user.LastLoginAt = DateTime.UtcNow;
        user.LastLoginIp = httpContext.Connection.RemoteIpAddress?.ToString();
        await userManager.UpdateAsync(user);

        var session = await tokenService.GenerateTokenPairAsync(user);
        AuthCookieHelper.SetRefreshTokenCookie(httpContext, session.RefreshToken);
        return Results.Ok(AuthCookieHelper.SessionResponseBody(httpContext, session));
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
        return Results.Ok(AuthCookieHelper.SessionResponseBody(httpContext, session));
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
        ITokenService tokenService,
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

        await tokenService.RevokeAllRefreshTokensForUserAsync(user.Id);
        return Results.NoContent();
    }

    private static async Task SendEmailConfirmationAsync(
        User user,
        UserManager<User> userManager,
        IEmailService emailService,
        IConfiguration configuration,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            return;
        }

        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var frontendBaseUrl = configuration["App:FrontendBaseUrl"] ?? "http://localhost:3000";
        var confirmationUrl =
            $"{frontendBaseUrl.TrimEnd('/')}/confirm-email?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";

        await emailService.SendTemplatedAsync(
            user.Email,
            "email-confirmation",
            new
            {
                user.Email,
                confirmationUrl
            },
            ct);
    }

    private static IResult InvalidEmailConfirmationToken() =>
        Results.ValidationProblem(new Dictionary<string, string[]>
        {
            [nameof(ConfirmEmailRequest.Token)] = ["The email confirmation token is invalid."]
        });

    private static IResult EmailConfirmationRequired() =>
        Results.Problem(
            title: "Email confirmation required",
            detail: "Confirm your email address before signing in.",
            statusCode: StatusCodes.Status403Forbidden);

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
        AuthCookieHelper.DeleteRefreshTokenCookie(httpContext);
        return Results.NoContent();
    }
}
