using System.Globalization;
using System.Text;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Modules.Analytics.Models;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Analytics.Endpoints;

public static class AnalyticsEndpoints
{
    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/analytics")
            .WithTags("Analytics")
            .RequireAuthorization(WorkspaceRoles.Member);

        group.MapGet("/velocity", GetVelocity)
            .WithName("GetVelocity");

        group.MapGet("/burndown", GetBurndown)
            .WithName("GetBurndown");

        group.MapGet("/workload", GetWorkload)
            .WithName("GetWorkload");

        group.MapGet("/export", ExportReport)
            .WithName("ExportReport")
            .Produces(StatusCodes.Status200OK, contentType: "text/csv")
            .Produces(StatusCodes.Status400BadRequest)
            .RequireAuthorization(WorkspaceRoles.Admin);
    }

    // ── GET /api/v1/analytics/velocity ──
    private static async Task<IResult> GetVelocity(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        Guid? projectId = null,
        int sprintCount = 5)
    {
        var query = db.Sprints.AsNoTracking()
            .Where(s => s.Status == SprintStatus.Completed);

        if (projectId.HasValue)
            query = query.Where(s => s.ProjectId == projectId.Value);

        var sprints = await query
            .OrderByDescending(s => s.EndDate)
            .Take(sprintCount)
            .Select(s => new VelocitySprintData(
                s.Id,
                s.Name,
                s.PlannedPoints,
                s.CompletedPoints,
                s.StartDate,
                s.EndDate))
            .ToListAsync(ct);

        var averageVelocity = sprints.Count > 0
            ? (decimal)sprints.Sum(s => s.CompletedPoints ?? 0) / sprints.Count
            : 0m;

        return Results.Ok(new VelocityResponse(projectId, sprints, Math.Round(averageVelocity, 2)));
    }

    // ── GET /api/v1/analytics/burndown ──
    private static async Task<IResult> GetBurndown(
        Guid sprintId,
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct)
    {
        var sprint = await db.Sprints.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sprintId, ct);

        if (sprint is null)
        {
            return Results.Problem(
                title: ProblemTitles.NotFound,
                detail: $"Sprint with id '{sprintId}' was not found.",
                statusCode: StatusCodes.Status404NotFound);
        }

        // Get task totals for the sprint
        var totalPoints = await db.TaskItems.AsNoTracking()
            .Where(t => t.SprintId == sprintId)
            .SumAsync(t => t.EstimatePoints ?? 0, ct);

        var completedPoints = await db.TaskItems.AsNoTracking()
            .Where(t => t.SprintId == sprintId && t.Status == TaskItemStatus.Done)
            .SumAsync(t => t.EstimatePoints ?? 0, ct);

        var remainingPoints = totalPoints - completedPoints;

        return Results.Ok(new BurndownResponse(
            sprint.Id,
            sprint.Name,
            sprint.StartDate,
            sprint.EndDate,
            totalPoints,
            completedPoints,
            remainingPoints));
    }

    // ── GET /api/v1/analytics/workload ──
    // Aggregates per-member task and time totals using set-based queries.
    // Previous implementation issued 4 DB round trips per member (N+1);
    // current implementation uses 3 round trips total regardless of member count.
    private static async Task<IResult> GetWorkload(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        Guid? projectId = null)
    {
        // 1) Active workspace members.
        var members = await db.Memberships.AsNoTracking()
            .Where(m => m.IsActive)
            .Select(m => new
            {
                m.UserId,
                m.User.FullName,
                m.User.AvatarUrl
            })
            .ToListAsync(ct);

        if (members.Count == 0)
            return Results.Ok(new WorkloadResponse(new List<WorkloadMember>()));

        var memberIds = members.Select(m => m.UserId).ToList();

        // 2) Task aggregates grouped by assignee in a single SQL round trip.
        var taskQuery = db.TaskItems.AsNoTracking()
            .Where(t => t.AssigneeId != null && memberIds.Contains(t.AssigneeId.Value));

        if (projectId.HasValue)
            taskQuery = taskQuery.Where(t => t.ProjectId == projectId.Value);

        var taskAggregates = (await taskQuery
            .GroupBy(t => t.AssigneeId!.Value)
            .Select(g => new
            {
                UserId = g.Key,
                Assigned = g.Count(),
                Completed = g.Count(t => t.Status == TaskItemStatus.Done),
                Points = g.Sum(t => (int?)t.EstimatePoints ?? 0)
            })
            .ToListAsync(ct))
            .ToDictionary(x => x.UserId);

        // 3) Time aggregates grouped by user in a single SQL round trip.
        var timeQuery = db.TimeEntries.AsNoTracking()
            .Where(te => memberIds.Contains(te.UserId));

        if (projectId.HasValue)
            timeQuery = timeQuery.Where(te => te.ProjectId == projectId.Value);

        var timeAggregates = (await timeQuery
            .GroupBy(te => te.UserId)
            .Select(g => new { UserId = g.Key, Minutes = g.Sum(te => te.DurationMinutes) })
            .ToListAsync(ct))
            .ToDictionary(x => x.UserId, x => x.Minutes);

        // 4) Stitch results in memory (cheap; bounded by member count).
        var result = members.Select(m =>
        {
            taskAggregates.TryGetValue(m.UserId, out var t);
            timeAggregates.TryGetValue(m.UserId, out var minutes);
            return new WorkloadMember(
                m.UserId,
                m.FullName,
                m.AvatarUrl,
                t?.Assigned ?? 0,
                t?.Completed ?? 0,
                t?.Points ?? 0,
                Math.Round((decimal)minutes / 60, 2));
        }).ToList();

        return Results.Ok(new WorkloadResponse(result));
    }

    // ── GET /api/v1/analytics/export ──
    private static async Task<IResult> ExportReport(
        AppDbContext db,
        ICurrentUser currentUser,
        ITenantContext tenantContext,
        CancellationToken ct,
        string format = "csv",
        string reportType = "tasks",
        Guid? projectId = null)
    {
        if (!format.Equals("csv", StringComparison.OrdinalIgnoreCase))
        {
            return Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: "Only 'csv' format is currently supported.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return reportType.ToLowerInvariant() switch
        {
            "tasks" => await ExportTasks(db, projectId, ct),
            "velocity" => await ExportVelocity(db, tenantContext, projectId, ct),
            "workload" => await ExportWorkload(db, tenantContext, projectId, ct),
            _ => Results.Problem(
                title: ProblemTitles.BadRequest,
                detail: "Unsupported report type. Supported values are 'tasks', 'velocity', and 'workload'.",
                statusCode: StatusCodes.Status400BadRequest),
        };
    }

    private static async Task<IResult> ExportTasks(AppDbContext db, Guid? projectId, CancellationToken ct)
    {
        var taskQuery = db.TaskItems.AsNoTracking();

        if (projectId.HasValue)
            taskQuery = taskQuery.Where(t => t.ProjectId == projectId.Value);

        var tasks = await taskQuery
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.Identifier,
                t.Title,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                t.EstimatePoints,
                t.DueDate,
                AssigneeName = t.Assignee != null ? t.Assignee.FullName : "",
                t.CreatedAt
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("Id,Identifier,Title,Status,Priority,EstimatePoints,DueDate,Assignee,CreatedAt");

        foreach (var t in tasks)
        {
            sb.AppendLine(string.Join(",",
                t.Id,
                EscapeCsv(t.Identifier),
                EscapeCsv(t.Title),
                t.Status,
                t.Priority,
                t.EstimatePoints?.ToString(CultureInfo.InvariantCulture) ?? "",
                t.DueDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "",
                EscapeCsv(t.AssigneeName),
                t.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture)));
        }

        var csvBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return Results.File(csvBytes, "text/csv", "tasks-report.csv");
    }

    private static async Task<IResult> ExportVelocity(
        AppDbContext db,
        ITenantContext tenantContext,
        Guid? projectId,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId;
        if (!workspaceId.HasValue)
            return Results.Problem(statusCode: 401, title: ProblemTitles.Unauthorized, detail: "Workspace context is required.");

        var sprintQuery = db.Sprints.AsNoTracking()
            .Where(s => s.WorkspaceId == workspaceId.Value && s.Status == SprintStatus.Completed);

        if (projectId.HasValue)
            sprintQuery = sprintQuery.Where(s => s.ProjectId == projectId.Value);

        var sprints = await sprintQuery
            .OrderByDescending(s => s.EndDate)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.StartDate,
                s.EndDate,
                s.PlannedPoints,
                s.CompletedPoints
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("Id,Name,StartDate,EndDate,PlannedPoints,CompletedPoints");

        foreach (var sprint in sprints)
        {
            sb.AppendLine(string.Join(",",
                sprint.Id,
                EscapeCsv(sprint.Name),
                sprint.StartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                sprint.EndDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                sprint.PlannedPoints,
                sprint.CompletedPoints?.ToString(CultureInfo.InvariantCulture) ?? ""));
        }

        var csvBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return Results.File(csvBytes, "text/csv", "velocity-report.csv");
    }

    private static async Task<IResult> ExportWorkload(
        AppDbContext db,
        ITenantContext tenantContext,
        Guid? projectId,
        CancellationToken ct)
    {
        var workspaceId = tenantContext.WorkspaceId;
        if (!workspaceId.HasValue)
            return Results.Problem(statusCode: 401, title: ProblemTitles.Unauthorized, detail: "Workspace context is required.");

        var members = await db.Memberships.AsNoTracking()
            .Where(m => m.WorkspaceId == workspaceId.Value)
            .Select(m => new
            {
                m.UserId,
                m.User.FullName
            })
            .ToListAsync(ct);

        var memberIds = members.Select(m => m.UserId).ToList();

        var taskQuery = db.TaskItems.AsNoTracking()
            .Where(t => t.AssigneeId.HasValue && memberIds.Contains(t.AssigneeId.Value));

        if (projectId.HasValue)
            taskQuery = taskQuery.Where(t => t.ProjectId == projectId.Value);

        var taskAggregates = (await taskQuery
            .GroupBy(t => t.AssigneeId!.Value)
            .Select(g => new
            {
                UserId = g.Key,
                AssignedTasks = g.Count(),
                CompletedTasks = g.Count(t => t.Status == TaskItemStatus.Done || t.Status == TaskItemStatus.Cancelled),
                TotalPoints = g.Sum(t => t.EstimatePoints ?? 0)
            })
            .ToListAsync(ct))
            .ToDictionary(x => x.UserId);

        var timeEntryQuery = db.TimeEntries.AsNoTracking()
            .Where(te => memberIds.Contains(te.UserId));

        if (projectId.HasValue)
            timeEntryQuery = timeEntryQuery.Where(te => te.ProjectId == projectId.Value);

        var timeAggregates = (await timeEntryQuery
            .GroupBy(te => te.UserId)
            .Select(g => new { UserId = g.Key, TotalMinutes = g.Sum(te => te.DurationMinutes) })
            .ToListAsync(ct))
            .ToDictionary(x => x.UserId, x => x.TotalMinutes);

        var sb = new StringBuilder();
        sb.AppendLine("UserId,FullName,AssignedTasks,CompletedTasks,TotalPoints,HoursLogged");

        foreach (var member in members)
        {
            taskAggregates.TryGetValue(member.UserId, out var taskAggregate);
            timeAggregates.TryGetValue(member.UserId, out var totalMinutes);
            var totalHoursLogged = Math.Round((decimal)totalMinutes / 60, 2);

            sb.AppendLine(string.Join(",",
                member.UserId,
                EscapeCsv(member.FullName),
                taskAggregate?.AssignedTasks ?? 0,
                taskAggregate?.CompletedTasks ?? 0,
                taskAggregate?.TotalPoints ?? 0,
                totalHoursLogged.ToString("0.##", CultureInfo.InvariantCulture)));
        }

        var csvBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return Results.File(csvBytes, "text/csv", "workload-report.csv");
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "";

        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";

        return value;
    }
}
