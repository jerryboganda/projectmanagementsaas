using System.Security.Cryptography;
using System.Text;
using StackExchange.Redis;

namespace LinearPrecision.Api.Modules.Identity.Services;

/// <summary>
/// F-13 — Short-lived MFA challenge tokens issued after step-1 login when the
/// user has TOTP MFA enabled. Backed by Redis with a 5-minute TTL so the
/// challenge cannot be replayed indefinitely. The token is opaque to the
/// client and can only be redeemed by /api/v1/auth/login/verify-mfa.
/// </summary>
public sealed class MfaChallengeService
{
    private static readonly TimeSpan ChallengeTtl = TimeSpan.FromMinutes(5);
    private const string KeyPrefix = "mfa:challenge:";
    private readonly IConnectionMultiplexer _redis;

    public MfaChallengeService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<string> CreateAsync(Guid userId, CancellationToken ct = default)
    {
        var bytes = new byte[32];
        RandomNumberGenerator.Fill(bytes);
        var token = Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

        var db = _redis.GetDatabase();
        await db.StringSetAsync(KeyPrefix + token, userId.ToString("N"), ChallengeTtl);
        return token;
    }

    /// <summary>Returns the user id if the challenge is valid; null otherwise. Consumes the challenge.</summary>
    public async Task<Guid?> RedeemAsync(string token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;

        var db = _redis.GetDatabase();
        var key = KeyPrefix + token;
        var raw = await db.StringGetDeleteAsync(key);
        if (raw.IsNullOrEmpty) return null;

        return Guid.TryParseExact(raw.ToString(), "N", out var id) ? id : null;
    }
}
