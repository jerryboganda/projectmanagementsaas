using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Billing.Models;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Billing.Endpoints;

public static class PlanEndpoints
{
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
        CancellationToken ct)
    {
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

        return Results.Ok(plans);
    }

    // ── GET /api/v1/plans/{id} ──
    private static async Task<IResult> GetPlan(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
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
                title: "Not Found",
                detail: $"Plan with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(plan);
    }
}
