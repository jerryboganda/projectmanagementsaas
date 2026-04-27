using LinearPrecision.Api.Infrastructure.Caching;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Billing.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace LinearPrecision.Api.Modules.Billing.Endpoints;

public static class PlanEndpoints
{
    private static readonly TimeSpan PlanCacheTtl = TimeSpan.FromMinutes(10);

    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/plans")
            .WithTags("Plans");

        group.MapGet("/", ListPlans)
            .WithName("ListPlans")
            .AllowAnonymous()
            .Produces<List<PlanResponse>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", GetPlan)
            .WithName("GetPlan")
            .AllowAnonymous()
            .Produces<PlanResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);
    }

    // ── GET /api/v1/plans ──
    private static async Task<IResult> ListPlans(
        AppDbContext db,
        IDistributedCache cache,
        CancellationToken ct)
    {
        const string cacheKey = "billing:plans:active";
        var cachedPlans = await cache.GetJsonAsync<List<PlanResponse>>(cacheKey, ct);
        if (cachedPlans is not null)
        {
            return Results.Ok(cachedPlans);
        }

        var plans = await db.Plans.AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .Select(p => new PlanResponse(
                p.Id,
                p.Name,
                p.Slug,
                p.Description,
                p.MonthlyPricePerSeat,
                p.AnnualPricePerSeat,
                p.MaxMembers,
                p.MaxProjects,
                p.MaxStorageBytes,
                p.MaxAutomations,
                p.IsActive,
                p.SortOrder,
                p.CreatedAt))
            .ToListAsync(ct);

        await cache.SetJsonAsync(cacheKey, plans, PlanCacheTtl, ct);

        return Results.Ok(plans);
    }

    // ── GET /api/v1/plans/{id} ──
    private static async Task<IResult> GetPlan(
        Guid id,
        AppDbContext db,
        IDistributedCache cache,
        CancellationToken ct)
    {
        var cacheKey = $"billing:plans:{id:N}";
        var cachedPlan = await cache.GetJsonAsync<PlanResponse>(cacheKey, ct);
        if (cachedPlan is not null)
        {
            return Results.Ok(cachedPlan);
        }

        var plan = await db.Plans.AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PlanResponse(
                p.Id,
                p.Name,
                p.Slug,
                p.Description,
                p.MonthlyPricePerSeat,
                p.AnnualPricePerSeat,
                p.MaxMembers,
                p.MaxProjects,
                p.MaxStorageBytes,
                p.MaxAutomations,
                p.IsActive,
                p.SortOrder,
                p.CreatedAt))
            .FirstOrDefaultAsync(ct);

        if (plan is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Plan with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        await cache.SetJsonAsync(cacheKey, plan, PlanCacheTtl, ct);

        return Results.Ok(plan);
    }
}
