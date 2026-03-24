using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Admin.Models;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Admin.Endpoints;

public static class WorkspaceStatsEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin")
            .WithTags("Admin")
            .RequireAuthorization("WorkspaceOwner");

        group.MapGet("/workspace-stats", GetWorkspaceStats)
            .WithName("GetWorkspaceStats")
            .Produces<WorkspaceStatsResponse>(StatusCodes.Status200OK);
    }

    // ── GET /api/v1/admin/workspace-stats ──
    private static async Task<IResult> GetWorkspaceStats(
        AppDbContext db,
        CancellationToken ct)
    {
        var totalWorkspaces = await db.Workspaces
            .AsNoTracking()
            .IgnoreQueryFilters()
            .CountAsync(w => !w.IsDeleted, ct);

        var totalMembers = await db.Memberships
            .AsNoTracking()
            .IgnoreQueryFilters()
            .CountAsync(m => m.IsActive, ct);

        var totalProjects = await db.Projects
            .AsNoTracking()
            .IgnoreQueryFilters()
            .CountAsync(p => !p.IsDeleted, ct);

        var totalTasks = await db.TaskItems
            .AsNoTracking()
            .IgnoreQueryFilters()
            .CountAsync(t => !t.IsDeleted, ct);

        var totalDocuments = await db.Documents
            .AsNoTracking()
            .IgnoreQueryFilters()
            .CountAsync(d => !d.IsDeleted, ct);

        var totalFiles = await db.FileAttachments
            .AsNoTracking()
            .IgnoreQueryFilters()
            .CountAsync(ct);

        var totalStorageBytes = await db.FileAttachments
            .AsNoTracking()
            .IgnoreQueryFilters()
            .SumAsync(f => f.SizeBytes, ct);

        var activeSubscriptions = await db.Subscriptions
            .AsNoTracking()
            .CountAsync(s => s.Status == Shared.Domain.Enums.SubscriptionStatus.Active, ct);

        return Results.Ok(new WorkspaceStatsResponse(
            TotalWorkspaces: totalWorkspaces,
            TotalMembers: totalMembers,
            TotalProjects: totalProjects,
            TotalTasks: totalTasks,
            TotalDocuments: totalDocuments,
            TotalFiles: totalFiles,
            TotalStorageBytes: totalStorageBytes,
            ActiveSubscriptions: activeSubscriptions));
    }
}
