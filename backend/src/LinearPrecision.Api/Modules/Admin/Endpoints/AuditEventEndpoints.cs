using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Admin.Models;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Admin.Endpoints;

public static class AuditEventEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin/audit-events")
            .WithTags("AuditEvents")
            .RequireAuthorization(WorkspaceRoles.Admin);

        group.MapGet("/", ListAuditEvents)
            .WithName("ListAuditEvents")
            .Produces<List<AuditEventResponse>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", GetAuditEvent)
            .WithName("GetAuditEvent")
            .Produces<AuditEventResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);
    }

    // ── GET /api/v1/admin/audit-events ──
    private static async Task<IResult> ListAuditEvents(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        string? action = null,
        string? entityType = null,
        Guid? actorId = null,
        int page = 1,
        int pageSize = 25)
    {
        var query = db.AuditEvents.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(action))
            query = query.Where(e => e.Action == action);

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(e => e.EntityType == entityType);

        if (actorId.HasValue)
            query = query.Where(e => e.ActorId == actorId.Value);

        var effectivePageSize = Math.Clamp(pageSize, 1, 100);
        var offset = (Math.Max(page, 1) - 1) * effectivePageSize;

        var events = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip(offset)
            .Take(effectivePageSize)
            .Select(e => new AuditEventResponse(
                e.Id,
                e.ActorId,
                e.Actor != null ? e.Actor.FullName : null,
                e.Action,
                e.EntityType,
                e.EntityId,
                e.OldValues,
                e.NewValues,
                e.IpAddress,
                e.UserAgent,
                e.CreatedAt))
            .ToListAsync(ct);

        return Results.Ok(events);
    }

    // ── GET /api/v1/admin/audit-events/{id} ──
    private static async Task<IResult> GetAuditEvent(
        Guid id,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var auditEvent = await db.AuditEvents.AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => new AuditEventResponse(
                e.Id,
                e.ActorId,
                e.Actor != null ? e.Actor.FullName : null,
                e.Action,
                e.EntityType,
                e.EntityId,
                e.OldValues,
                e.NewValues,
                e.IpAddress,
                e.UserAgent,
                e.CreatedAt))
            .FirstOrDefaultAsync(ct);

        if (auditEvent is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Audit event with id '{id}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(auditEvent);
    }
}
