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
            .RequireAuthorization("WorkspaceMember");

        group.MapGet("/velocity", GetVelocity)
            .WithName("GetVelocity");

        group.MapGet("/burndown", GetBurndown)
            .WithName("GetBurndown");

        group.MapGet("/workload", GetWorkload)
            .WithName("GetWorkload");

        group.MapGet("/export", ExportReport)
            .WithName("ExportReport")
            .RequireAuthorization("WorkspaceAdmin");
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
                title: "Not Found",
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
    private static async Task<IResult> GetWorkload(
        AppDbContext db,
        ICurrentUser currentUser,
        CancellationToken ct,
        Guid? projectId = null)
    {
        // Get all active workspace members with their user info
        var members = await db.Memberships.AsNoTracking()
            .Where(m => m.IsActive)
            .Select(m => new
            {
                m.UserId,
                m.User.FullName,
                m.User.AvatarUrl
            })
            .ToListAsync(ct);

        var result = new List<WorkloadMember>();

        foreach (var member in members)
        {
            var taskQuery = db.TaskItems.AsNoTracking()
                .Where(t => t.AssigneeId == member.UserId);

            if (projectId.HasValue)
                taskQuery = taskQuery.Where(t => t.ProjectId == projectId.Value);

            var assignedTasks = await taskQuery.CountAsync(ct);

            var completedTasks = await taskQuery
                .Where(t => t.Status == TaskItemStatus.Done)
                .CountAsync(ct);

            var totalPoints = await taskQuery
                .SumAsync(t => t.EstimatePoints ?? 0, ct);

            var timeQuery = db.TimeEntries.AsNoTracking()
                .Where(te => te.UserId == member.UserId);

            if (projectId.HasValue)
                timeQuery = timeQuery.Where(te => te.ProjectId == projectId.Value);

            var totalMinutes = await timeQuery
                .SumAsync(te => te.DurationMinutes, ct);

            var totalHoursLogged = Math.Round((decimal)totalMinutes / 60, 2);

            result.Add(new WorkloadMember(
                member.UserId,
                member.FullName,
                member.AvatarUrl,
                assignedTasks,
                completedTasks,
                totalPoints,
                totalHoursLogged));
        }

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
                title: "Bad Request",
                detail: "Only 'csv' format is currently supported.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        return reportType.ToLowerInvariant() switch
        {
            "tasks" => await ExportTasks(db, ct, projectId),
            "velocity" => await ExportVelocity(db, tenantContext, ct, projectId),
            "workload" => await ExportWorkload(db, tenantContext, ct, projectId),
            _ => Results.Problem(
                title: "Bad Request",
                detail: "Unsupported report type. Supported values are 'tasks', 'velocity', and 'workload'.",
                statusCode: StatusCodes.Status400BadRequest),
        };
    }

    private static async Task<IResult> ExportTasks(AppDbContext db, CancellationToken ct, Guid? projectId)
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
                t.EstimatePoints?.ToString() ?? "",
                t.DueDate?.ToString("yyyy-MM-dd") ?? "",
                EscapeCsv(t.AssigneeName),
                t.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")));
        }

        var csvBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return Results.File(csvBytes, "text/csv", "tasks-report.csv");
    }

    private static async Task<IResult> ExportVelocity(
        AppDbContext db,
        ITenantContext tenantContext,
        CancellationToken ct,
        Guid? projectId)
    {
        var workspaceId = tenantContext.WorkspaceId;
        if (!workspaceId.HasValue)
            return Results.Problem(statusCode: 401, title: "Unauthorized", detail: "Workspace context is required.");

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
                sprint.StartDate.ToString("yyyy-MM-dd"),
                sprint.EndDate.ToString("yyyy-MM-dd"),
                sprint.PlannedPoints,
                sprint.CompletedPoints?.ToString() ?? ""));
        }

        var csvBytes = Encoding.UTF8.GetBytes(sb.ToString());
        return Results.File(csvBytes, "text/csv", "velocity-report.csv");
    }

    private static async Task<IResult> ExportWorkload(
        AppDbContext db,
        ITenantContext tenantContext,
        CancellationToken ct,
        Guid? projectId)
    {
        var workspaceId = tenantContext.WorkspaceId;
        if (!workspaceId.HasValue)
            return Results.Problem(statusCode: 401, title: "Unauthorized", detail: "Workspace context is required.");

        var members = await db.Memberships.AsNoTracking()
            .Where(m => m.WorkspaceId == workspaceId.Value)
            .Select(m => new
            {
                m.UserId,
                m.User.FullName
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("UserId,FullName,AssignedTasks,CompletedTasks,TotalPoints,HoursLogged");

        foreach (var member in members)
        {
            var taskQuery = db.TaskItems.AsNoTracking()
                .Where(t => t.AssigneeId == member.UserId);

            if (projectId.HasValue)
                taskQuery = taskQuery.Where(t => t.ProjectId == projectId.Value);

            var assignedTasks = await taskQuery.CountAsync(ct);
            var completedTasks = await taskQuery.CountAsync(
                t => t.Status == TaskItemStatus.Done ||
                     t.Status == TaskItemStatus.Cancelled,
                ct);
            var totalPoints = await taskQuery.SumAsync(t => t.EstimatePoints ?? 0, ct);

            var timeEntryQuery = db.TimeEntries.AsNoTracking()
                .Where(te => te.UserId == member.UserId);

            if (projectId.HasValue)
            {
                timeEntryQuery = timeEntryQuery.Where(te => te.Task != null && te.Task.ProjectId == projectId.Value);
            }

            var totalMinutes = await timeEntryQuery.SumAsync(te => te.DurationMinutes, ct);
            var totalHoursLogged = Math.Round((decimal)totalMinutes / 60, 2);

            sb.AppendLine(string.Join(",",
                member.UserId,
                EscapeCsv(member.FullName),
                assignedTasks,
                completedTasks,
                totalPoints,
                totalHoursLogged.ToString("0.##")));
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
