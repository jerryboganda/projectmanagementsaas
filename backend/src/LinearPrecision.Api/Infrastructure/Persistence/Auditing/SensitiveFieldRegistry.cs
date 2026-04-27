using System.Text.Json;
using LinearPrecision.Shared.Domain;

namespace LinearPrecision.Api.Infrastructure.Persistence.Auditing;

/// <summary>
/// F-07 — Central registry of property names whose values must be redacted in
/// audit JSON before being persisted to the <c>AuditEvent</c> store.
///
/// Today no code path writes <see cref="Entities.AuditEvent"/> rows, but when
/// an audit writer is wired up it MUST route OldValues / NewValues through
/// <see cref="AuditRedactor.Redact"/> so password hashes, MFA secrets, refresh
/// tokens, API keys and similar fields never land in plaintext audit logs.
/// </summary>
public static class SensitiveFieldRegistry
{
    /// <summary>Property names treated as sensitive (case-insensitive).</summary>
    public static readonly HashSet<string> RedactedPropertyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        // Passwords
        "PasswordHash",
        "Password",
        "PasswordResetToken",

        // Multi-factor authentication
        "AuthenticatorKey",
        "TwoFactorSecret",
        "RecoveryCodes",
        "ConcurrencyStamp",
        "SecurityStamp",

        // Refresh / session tokens
        "RefreshToken",
        "AccessToken",
        "JwtId",

        // Invitation / reset tokens
        "Token",

        // External provider credentials
        "ApiKey",
        "ProtectedApiKey",
        "ClientSecret",
        "WebhookSecret",
        "StripeSecretKey",
        "StripeWebhookSecret",

        // PII that audit consumers don't need verbatim
        "LastLoginIp",
    };

    /// <summary>Constant placeholder written in place of redacted values.</summary>
    public const string RedactedPlaceholder = "***REDACTED***";
}
