using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Modules.Billing.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Billing.Endpoints;

public static class SubscriptionEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/billing/subscription")
            .WithTags("Subscriptions")
            .RequireAuthorization();

        group.MapGet("/", GetSubscription)
            .WithName("GetSubscription")
            .RequireAuthorization(WorkspaceRoles.Member)
            .Produces<SubscriptionResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateSubscription)
            .WithName("CreateSubscription")
            .RequireAuthorization(WorkspaceRoles.Admin)
            .Produces<SubscriptionResponse>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/", UpdateSubscription)
            .WithName("UpdateSubscription")
            .RequireAuthorization(WorkspaceRoles.Admin)
            .Produces<SubscriptionResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/", CancelSubscription)
            .WithName("CancelSubscription")
            .RequireAuthorization("WorkspaceOwner")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);
    }

    // ── GET /api/v1/billing/subscription ──
    private static async Task<IResult> GetSubscription(
        AppDbContext db,
        ITenantContext tenantContext,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId
            ?? throw new UnauthorizedAccessException("No workspace context.");

        var subscription = await db.Subscriptions.AsNoTracking()
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.WorkspaceId == workspaceId, ct);

        if (subscription is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: "No subscription found for the current workspace.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(MapToResponse(subscription));
    }

    // ── POST /api/v1/billing/subscription ──
    private static async Task<IResult> CreateSubscription(
        CreateSubscriptionRequest request,
        AppDbContext db,
        ITenantContext tenantContext,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId
            ?? throw new UnauthorizedAccessException("No workspace context.");

        // Check if a subscription already exists
        var existing = await db.Subscriptions.AsNoTracking()
            .AnyAsync(s => s.WorkspaceId == workspaceId, ct);

        if (existing)
        {
            return Results.Problem(
                title: ProblemTitles.Conflict,
                detail: "A subscription already exists for this workspace. Use PUT to update.",
                statusCode: StatusCodes.Status409Conflict);
        }

        // Validate plan exists
        var plan = await db.Plans.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PlanId && p.IsActive, ct);

        if (plan is null)
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: $"Plan with id '{request.PlanId}' was not found or is inactive.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var now = DateTime.UtcNow;
        var periodEnd = request.BillingCycle.Equals("annual", StringComparison.OrdinalIgnoreCase)
            ? now.AddYears(1)
            : now.AddMonths(1);

        var subscription = new Subscription
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = workspaceId,
            PlanId = plan.Id,
            Status = SubscriptionStatus.Active,
            CurrentPeriodStart = now,
            CurrentPeriodEnd = periodEnd,
            SeatCount = 1,
            SeatLimit = plan.MaxMembers,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Subscriptions.Add(subscription);
        await db.SaveChangesAsync(ct);

        // Reload with plan navigation
        var created = await db.Subscriptions.AsNoTracking()
            .Include(s => s.Plan)
            .FirstAsync(s => s.Id == subscription.Id, ct);

        return Results.Created($"/api/v1/billing/subscription", MapToResponse(created));
    }

    // ── PUT /api/v1/billing/subscription ──
    private static async Task<IResult> UpdateSubscription(
        UpdateSubscriptionRequest request,
        AppDbContext db,
        ITenantContext tenantContext,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId
            ?? throw new UnauthorizedAccessException("No workspace context.");

        var subscription = await db.Subscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.WorkspaceId == workspaceId, ct);

        if (subscription is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: "No subscription found for the current workspace.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Validate new plan
        var plan = await db.Plans.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.PlanId && p.IsActive, ct);

        if (plan is null)
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: $"Plan with id '{request.PlanId}' was not found or is inactive.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var now = DateTime.UtcNow;
        var periodEnd = request.BillingCycle.Equals("annual", StringComparison.OrdinalIgnoreCase)
            ? now.AddYears(1)
            : now.AddMonths(1);

        subscription.PlanId = plan.Id;
        subscription.CurrentPeriodStart = now;
        subscription.CurrentPeriodEnd = periodEnd;
        subscription.SeatLimit = plan.MaxMembers;
        subscription.UpdatedAt = now;

        await db.SaveChangesAsync(ct);

        // Reload with updated plan navigation
        var updated = await db.Subscriptions.AsNoTracking()
            .Include(s => s.Plan)
            .FirstAsync(s => s.Id == subscription.Id, ct);

        return Results.Ok(MapToResponse(updated));
    }

    // ── DELETE /api/v1/billing/subscription ──
    private static async Task<IResult> CancelSubscription(
        AppDbContext db,
        ITenantContext tenantContext,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId
            ?? throw new UnauthorizedAccessException("No workspace context.");

        var subscription = await db.Subscriptions
            .FirstOrDefaultAsync(s => s.WorkspaceId == workspaceId, ct);

        if (subscription is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: "No subscription found for the current workspace.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var now = DateTime.UtcNow;
        subscription.Status = SubscriptionStatus.Cancelled;
        subscription.CancelledAt = now;
        subscription.UpdatedAt = now;

        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    private static SubscriptionResponse MapToResponse(Subscription s) => new(
        s.Id,
        s.WorkspaceId,
        new PlanResponse(
            s.Plan.Id,
            s.Plan.Name,
            s.Plan.Slug,
            s.Plan.Description,
            s.Plan.MonthlyPricePerSeat,
            s.Plan.AnnualPricePerSeat,
            s.Plan.MaxMembers,
            s.Plan.MaxProjects,
            s.Plan.MaxStorageBytes,
            s.Plan.MaxAutomations,
            s.Plan.IsActive,
            s.Plan.SortOrder,
            s.Plan.CreatedAt),
        s.Status,
        s.CurrentPeriodStart,
        s.CurrentPeriodEnd,
        s.CancelledAt,
        s.TrialEnd,
        s.SeatCount,
        s.SeatLimit,
        s.CreatedAt);
}
