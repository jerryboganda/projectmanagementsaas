namespace LinearPrecision.Api.Modules.Identity.Models;

/// <summary>
/// F-13 — Returned by /api/v1/auth/login when the user has TOTP MFA enabled.
/// The frontend prompts for an authenticator code, then calls
/// /api/v1/auth/login/verify-mfa with this token + the 6-digit code.
/// </summary>
public sealed record MfaChallengeResponse(
    bool MfaRequired,
    string MfaToken,
    string ChallengeType);

/// <summary>F-13 — Step-2 login: redeem the MFA challenge with a TOTP code.</summary>
public sealed record VerifyMfaLoginRequest(string MfaToken, string Code);

/// <summary>F-13 — /auth/mfa/setup response: shared key for the authenticator app.</summary>
public sealed record SetupMfaResponse(string SharedKey, string AuthenticatorUri);

/// <summary>F-13 — Start MFA setup. Requires the current password before rotating the authenticator key.</summary>
public sealed record SetupMfaRequest(string Password);

/// <summary>F-13 — Confirm a code from the authenticator app to enable MFA.</summary>
public sealed record VerifyMfaSetupRequest(string Code);

/// <summary>F-13 — Disable MFA. Requires the current password to confirm intent.</summary>
public sealed record DisableMfaRequest(string Password, string Code);
