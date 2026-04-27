using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace LinearPrecision.Api.Infrastructure.Caching;

public static class DistributedCacheJsonExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task<T?> GetJsonAsync<T>(this IDistributedCache cache, string key, CancellationToken ct)
    {
        var json = await cache.GetStringAsync(key, ct);
        return string.IsNullOrWhiteSpace(json) ? default : JsonSerializer.Deserialize<T>(json, JsonOptions);
    }

    public static Task SetJsonAsync<T>(this IDistributedCache cache, string key, T value, TimeSpan ttl, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(value, JsonOptions);
        return cache.SetStringAsync(
            key,
            json,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl },
            ct);
    }
}