using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Caching;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Admin.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace LinearPrecision.Api.Modules.Admin.Endpoints;

public static class FeatureFlagEndpoints
{
    private static readonly TimeSpan FeatureFlagCacheTtl = TimeSpan.FromMinutes(2);

    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/feature-flags")
            .WithTags("FeatureFlags")
            .RequireAuthorization(WorkspaceRoles.Admin);

        group.MapGet("/", ListFeatureFlags)
            .WithName("ListFeatureFlags")
            .Produces<List<FeatureFlagResponse>>(StatusCodes.Status200OK);

        group.MapPost("/", CreateFeatureFlag)
            .WithName("CreateFeatureFlag")
            .Produces<FeatureFlagResponse>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/{id:guid}", UpdateFeatureFlag)
            .WithName("UpdateFeatureFlag")
            .Produces<FeatureFlagResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", DeleteFeatureFlag)
            .WithName("DeleteFeatureFlag")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);
    }

    // ── GET /api/v1/admin/feature-flags ──
    private static async Task<IResult> ListFeatureFlags(
        AppDbContext db,
        IDistributedCache cache,
        ICurrentUser currentUser,
        CancellationToken ct,
        bool? isEnabled = null)
    {
        var cacheKey = FeatureFlagsCacheKey(isEnabled);
        var cachedFlags = await cache.GetJsonAsync<List<FeatureFlagResponse>>(cacheKey, ct);
        if (cachedFlags is not null)
        {
            return Results.Ok(cachedFlags);
        }

        var query = db.FeatureFlags.AsNoTracking().AsQueryable();

        if (isEnabled.HasValue)
            query = query.Where(f => f.IsEnabled == isEnabled.Value);

        var flags = await query
            .OrderBy(f => f.Key)
            .Select(f => new FeatureFlagResponse(
                f.Id,
                f.Key,
                f.Description,
                f.IsEnabled,
                f.WorkspaceId,
                f.RolloutPercentage,
                f.Conditions,
                f.CreatedAt,
                f.UpdatedAt))
            .ToListAsync(ct);

        await cache.SetJsonAsync(cacheKey, flags, FeatureFlagCacheTtl, ct);

        return Results.Ok(flags);
    }

    // ── POST /api/v1/admin/feature-flags ──
    private static async Task<IResult> CreateFeatureFlag(
        CreateFeatureFlagRequest request,
        AppDbContext db,
        IDistributedCache cache,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Key) || request.Key.Length > 100)
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: "Key is required and must be 100 characters or fewer.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // Check uniqueness
        var keyExists = await db.FeatureFlags.AsNoTracking()
            .AnyAsync(f => f.Key == request.Key, ct);

        if (keyExists)
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: $"A feature flag with key '{request.Key}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var now = DateTime.UtcNow;

        var flag = new FeatureFlag
        {
            Id = Guid.CreateVersion7(),
            Key = request.Key,
            Description = request.Description,
            IsEnabled = request.IsEnabled ?? false,
            WorkspaceId = request.WorkspaceId,
            RolloutPercentage = request.RolloutPercentage,
            Conditions = request.Conditions,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.FeatureFlags.Add(flag);
        await db.SaveChangesAsync(ct);
        await InvalidateFeatureFlagListCacheAsync(cache, ct);

        var response = new FeatureFlagResponse(
            flag.Id,
            flag.Key,
            flag.Description,
            flag.IsEnabled,
            flag.WorkspaceId,
            flag.RolloutPercentage,
            flag.Conditions,
            flag.CreatedAt,
            flag.UpdatedAt);

        return Results.Created($"/api/v1/admin/feature-flags/{flag.Id}", response);
    }

    // ── PUT /api/v1/admin/feature-flags/{id} ──
    private static async Task<IResult> UpdateFeatureFlag(
        Guid id,
        UpdateFeatureFlagRequest request,
        AppDbContext db,
        IDistributedCache cache,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Key) || request.Key.Length > 100)
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: "Key is required and must be 100 characters or fewer.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var flag = await db.FeatureFlags
            .FirstOrDefaultAsync(f => f.Id == id, ct);

        if (flag is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Feature flag with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Check key uniqueness if changed
        if (!flag.Key.Equals(request.Key, StringComparison.Ordinal))
        {
            var keyExists = await db.FeatureFlags.AsNoTracking()
                .AnyAsync(f => f.Key == request.Key && f.Id != id, ct);

            if (keyExists)
            {
                return Results.Problem(
                    title: ProblemTitles.Conflict,
                    detail: $"A feature flag with key '{request.Key}' already exists.",
                    statusCode: StatusCodes.Status409Conflict);
            }
        }

        flag.Key = request.Key;
        flag.Description = request.Description;
        flag.IsEnabled = request.IsEnabled ?? flag.IsEnabled;
        flag.WorkspaceId = request.WorkspaceId;
        flag.RolloutPercentage = request.RolloutPercentage;
        flag.Conditions = request.Conditions;
        flag.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        await InvalidateFeatureFlagListCacheAsync(cache, ct);

        var response = new FeatureFlagResponse(
            flag.Id,
            flag.Key,
            flag.Description,
            flag.IsEnabled,
            flag.WorkspaceId,
            flag.RolloutPercentage,
            flag.Conditions,
            flag.CreatedAt,
            flag.UpdatedAt);

        return Results.Ok(response);
    }

    // ── DELETE /api/v1/admin/feature-flags/{id} ──
    private static async Task<IResult> DeleteFeatureFlag(
        Guid id,
        AppDbContext db,
        IDistributedCache cache,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var flag = await db.FeatureFlags
            .FirstOrDefaultAsync(f => f.Id == id, ct);

        if (flag is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Feature flag with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        db.FeatureFlags.Remove(flag);
        await db.SaveChangesAsync(ct);
        await InvalidateFeatureFlagListCacheAsync(cache, ct);

        return Results.NoContent();
    }

    private static string FeatureFlagsCacheKey(bool? isEnabled)
        => isEnabled.HasValue
            ? $"admin:feature-flags:enabled:{isEnabled.Value}"
            : "admin:feature-flags:all";

    private static Task InvalidateFeatureFlagListCacheAsync(IDistributedCache cache, CancellationToken ct)
        => Task.WhenAll(
            cache.RemoveAsync(FeatureFlagsCacheKey(null), ct),
            cache.RemoveAsync(FeatureFlagsCacheKey(true), ct),
            cache.RemoveAsync(FeatureFlagsCacheKey(false), ct));
}
