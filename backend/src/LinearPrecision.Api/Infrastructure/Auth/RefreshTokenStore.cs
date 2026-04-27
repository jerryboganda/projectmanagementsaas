using System.Text.Json;
using StackExchange.Redis;

namespace LinearPrecision.Api.Infrastructure.Auth;

public sealed class RefreshTokenStore
{
    private readonly IConnectionMultiplexer _redis;
    private const string KeyPrefix = "refresh_tokens:";
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromDays(7);

    public RefreshTokenStore(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task StoreAsync(string tokenHash, RefreshTokenData data, TimeSpan? expiry = null)
    {
        var db = _redis.GetDatabase();
        var json = JsonSerializer.Serialize(data);
        await db.StringSetAsync($"{KeyPrefix}{tokenHash}", json, expiry ?? DefaultExpiry);

        // Also maintain a set of tokens per user for revocation
        await db.SetAddAsync($"{KeyPrefix}user:{data.UserId}", tokenHash);
        await db.KeyExpireAsync($"{KeyPrefix}user:{data.UserId}", expiry ?? DefaultExpiry);
    }

    public async Task<RefreshTokenData?> GetAsync(string tokenHash)
    {
        var db = _redis.GetDatabase();
        var json = await db.StringGetAsync($"{KeyPrefix}{tokenHash}");
        if (json.IsNullOrEmpty) return null;
        return JsonSerializer.Deserialize<RefreshTokenData>((string)json!);
    }

    public async Task RevokeAsync(string tokenHash)
    {
        var db = _redis.GetDatabase();
        var data = await GetAsync(tokenHash);
        await db.KeyDeleteAsync($"{KeyPrefix}{tokenHash}");
        if (data is not null)
        {
            await db.SetRemoveAsync($"{KeyPrefix}user:{data.UserId}", tokenHash);
        }
    }

    public async Task RevokeAllForUserAsync(Guid userId)
    {
        var db = _redis.GetDatabase();
        var userKey = $"{KeyPrefix}user:{userId}";
        var tokenHashes = await db.SetMembersAsync(userKey);
        foreach (var hash in tokenHashes)
        {
            await db.KeyDeleteAsync($"{KeyPrefix}{hash}");
        }
        await db.KeyDeleteAsync(userKey);
    }

    public async Task<bool> ExistsAsync(string tokenHash)
    {
        var db = _redis.GetDatabase();
        return await db.KeyExistsAsync($"{KeyPrefix}{tokenHash}");
    }
}

public sealed record RefreshTokenData(
    Guid UserId,
    string DeviceId,
    DateTime IssuedAt,
    DateTime ExpiresAt
);
