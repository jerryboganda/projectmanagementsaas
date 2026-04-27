using System.Net;
using System.Text;
using FluentValidation;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Modules.Identity.Models;
using LinearPrecision.Api.Modules.Identity.Services;
using LinearPrecision.Shared.Contracts;
using Microsoft.AspNetCore.Identity;

namespace LinearPrecision.Api.Modules.Identity.Endpoints;

/// <summary>
/// F-13 — TOTP MFA endpoints. Backed by ASP.NET Core Identity's built-in
/// authenticator token provider (registered via AddDefaultTokenProviders).
///
/// Flow:
///   1. /mfa/setup            (auth) → returns shared key + otpauth:// URI
///   2. user enters code in app, calls /mfa/verify-setup → enables MFA
///   3. login: /auth/login    (anon) → if MFA enabled, returns MfaChallengeResponse
///   4.        /auth/login/verify-mfa (anon) → exchanges challenge + code for session
///   5. /mfa/disable          (auth) → re-confirms password + code, disables MFA
/// </summary>
public static class MfaEndpoints
{
    private const string AuthenticatorProvider = "Authenticator";

    public static IEndpointRouteBuilder MapMfaEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth/mfa")
            .WithTags("Authentication")
            .RequireAuthorization()
            .RequireRateLimiting("auth");

        group.MapPost("/setup", SetupAsync).WithName("MfaSetup")
            .Produces<SetupMfaResponse>(200)
            .ProducesValidationProblem()
            .ProducesProblem(401)
            .ProducesProblem(409);

        group.MapPost("/verify-setup", VerifySetupAsync).WithName("MfaVerifySetup")
            .Produces(204)
            .ProducesValidationProblem();

        group.MapPost("/disable", DisableAsync).WithName("MfaDisable")
            .Produces(204)
            .ProducesProblem(401)
            .ProducesValidationProblem();

        return app;
    }

    private static async Task<IResult> SetupAsync(
        SetupMfaRequest request,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ICurrentUser currentUser,
        IConfiguration configuration,
        CancellationToken ct)
    {
        if (currentUser.UserId is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        if (await userManager.GetTwoFactorEnabledAsync(user))
        {
            return Results.Problem(
                title: "MFA already enabled",
                detail: "Disable MFA before regenerating an authenticator key.",
                statusCode: StatusCodes.Status409Conflict);
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["password"] = ["Password is required."]
            });
        }

        var passwordResult = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (passwordResult.IsLockedOut)
        {
            return Results.Problem(
                title: "Account locked",
                detail: "Account is temporarily locked due to too many failed attempts.",
                statusCode: 401);
        }

        if (!passwordResult.Succeeded)
        {
            return Results.Problem(
                title: "Invalid credentials",
                detail: "Password is incorrect.",
                statusCode: 401);
        }

        // Reset (clears any half-finished setup) then read.
        await userManager.ResetAuthenticatorKeyAsync(user);
        var sharedKey = await userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(sharedKey))
        {
            return Results.Problem(
                title: "Internal Server Error",
                detail: "Failed to generate authenticator key.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var issuer = configuration["Jwt:Issuer"] ?? "LinearPrecision";
        var label = WebUtility.UrlEncode($"{issuer}:{user.Email}");
        var secret = sharedKey.ToUpperInvariant();
        var otpAuthUri = $"otpauth://totp/{label}?secret={secret}&issuer={WebUtility.UrlEncode(issuer)}&digits=6&period=30";

        return Results.Ok(new SetupMfaResponse(secret, otpAuthUri));
    }

    private static async Task<IResult> VerifySetupAsync(
        VerifyMfaSetupRequest request,
        UserManager<User> userManager,
        ITokenService tokenService,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        if (currentUser.UserId is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        var code = (request.Code ?? string.Empty).Replace(" ", string.Empty, StringComparison.Ordinal);
        if (code.Length is < 6 or > 8)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["code"] = ["Code must be 6-8 digits."]
            });
        }

        var ok = await userManager.VerifyTwoFactorTokenAsync(user, AuthenticatorProvider, code);
        if (!ok)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["code"] = ["Invalid authenticator code."]
            });
        }

        await userManager.SetTwoFactorEnabledAsync(user, true);
        await tokenService.RevokeAllRefreshTokensForUserAsync(user.Id);
        return Results.NoContent();
    }

    private static async Task<IResult> DisableAsync(
        DisableMfaRequest request,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ITokenService tokenService,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        if (currentUser.UserId is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        var user = await userManager.FindByIdAsync(currentUser.UserId.Value.ToString());
        if (user is null)
        {
            return Results.Problem(title: ProblemTitles.Unauthorized, statusCode: 401);
        }

        // Require BOTH a fresh password and a current TOTP code so a stolen
        // session token alone cannot turn MFA off.
        var passwordResult = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (passwordResult.IsLockedOut)
        {
            return Results.Problem(
                title: "Account locked",
                detail: "Account is temporarily locked due to too many failed attempts.",
                statusCode: 401);
        }

        if (!passwordResult.Succeeded)
        {
            return Results.Problem(
                title: "Invalid credentials",
                detail: "Password is incorrect.",
                statusCode: 401);
        }

        var code = (request.Code ?? string.Empty).Replace(" ", string.Empty, StringComparison.Ordinal);
        var codeOk = await userManager.VerifyTwoFactorTokenAsync(user, AuthenticatorProvider, code);
        if (!codeOk)
        {
            await userManager.AccessFailedAsync(user);
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["code"] = ["Invalid authenticator code."]
            });
        }

        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.ResetAuthenticatorKeyAsync(user);
        await userManager.ResetAccessFailedCountAsync(user);
        await tokenService.RevokeAllRefreshTokensForUserAsync(user.Id);
        return Results.NoContent();
    }
}
