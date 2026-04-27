using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Automations.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Automations.Endpoints;

public static class AutomationLogEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/automations/{automationId:guid}/logs")
            .WithTags("Automation Logs")
            .RequireAuthorization();

        group.MapGet("/", ListLogs)
            .WithName("ListAutomationLogs")
            .Produces<List<AutomationLogResponse>>(StatusCodes.Status200OK)
            .RequireAuthorization(WorkspaceRoles.Admin);
    }

    // ── GET /api/v1/automations/{automationId}/logs ──
    private static async Task<IResult> ListLogs(
        Guid automationId,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        string? status = null,
        int page = 1,
        int pageSize = 25)
    {
        // Verify the automation rule exists
        var ruleExists = await db.AutomationRules
            .AnyAsync(r => r.Id == automationId, ct);

        if (!ruleExists)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Automation rule with id '{automationId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var query = db.AutomationLogs.AsNoTracking()
            .Where(l => l.AutomationRuleId == automationId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AutomationLogStatus>(status, true, out var logStatus))
            query = query.Where(l => l.Status == logStatus);

        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(l => new AutomationLogResponse(
                l.Id,
                l.AutomationRuleId,
                l.Status,
                l.TriggerData,
                l.ActionResult,
                l.ErrorMessage,
                l.ExecutionDuration,
                l.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(logs);
    }
}
