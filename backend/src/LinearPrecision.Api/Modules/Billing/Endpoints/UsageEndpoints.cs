using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Billing.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Billing.Endpoints;

public static class UsageEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/billing/usage")
            .WithTags("Usage")
            .RequireAuthorization("WorkspaceMember");

        group.MapGet("/", ListUsageRecords)
            .WithName("ListUsageRecords")
            .Produces<List<UsageRecordResponse>>(StatusCodes.Status200OK);

        group.MapGet("/summary", GetUsageSummary)
            .WithName("GetUsageSummary")
            .Produces<UsageSummaryResponse>(StatusCodes.Status200OK);
    }

    // ── GET /api/v1/billing/usage ──
    private static async Task<IResult> ListUsageRecords(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        string? metricName = null,
        string? period = null)
    {
        var query = db.UsageRecords.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(metricName))
            query = query.Where(u => u.MetricName == metricName);

        if (!string.IsNullOrEmpty(period))
            query = query.Where(u => u.Period == period);

        var records = await query
            .OrderByDescending(u => u.RecordedAt)
            .Select(u => new UsageRecordResponse(
                u.Id,
                u.MetricName,
                u.Value,
                u.RecordedAt,
                u.Period))
            .ToListAsync(ct);

        return Results.Ok(records);
    }

    // ── GET /api/v1/billing/usage/summary ──
    private static async Task<IResult> GetUsageSummary(
        AppDbContext db,
        ITenantContext tenantContext,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId
            ?? throw new UnauthorizedAccessException("No workspace context.");

        // Get the current subscription to find plan limits
        var subscription = await db.Subscriptions.AsNoTracking()
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.WorkspaceId == workspaceId, ct);

        int maxMembers = subscription?.Plan.MaxMembers ?? 0;
        int maxProjects = subscription?.Plan.MaxProjects ?? 0;
        long maxStorageBytes = subscription?.Plan.MaxStorageBytes ?? 0;
        int maxAutomations = subscription?.Plan.MaxAutomations ?? 0;

        // Count current usage from workspace-scoped entities
        var currentMembers = await db.Memberships.AsNoTracking()
            .Where(m => m.IsActive)
            .CountAsync(ct);

        var currentProjects = await db.Projects.AsNoTracking()
            .CountAsync(ct);

        // Aggregate storage from usage records for current workspace
        var currentStorageBytes = await db.UsageRecords.AsNoTracking()
            .Where(u => u.MetricName == "storage_bytes")
            .OrderByDescending(u => u.RecordedAt)
            .Select(u => u.Value)
            .FirstOrDefaultAsync(ct);

        var currentAutomations = await db.AutomationRules.AsNoTracking()
            .CountAsync(ct);

        return Results.Ok(new UsageSummaryResponse(
            currentMembers,
            maxMembers,
            currentProjects,
            maxProjects,
            currentStorageBytes,
            maxStorageBytes,
            currentAutomations,
            maxAutomations));
    }
}
