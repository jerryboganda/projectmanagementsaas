using LinearPrecision.Api.Hubs;
using LinearPrecision.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace LinearPrecision.Api.Modules.Tasks.Endpoints;

internal static class TaskBoardRealtime
{
    public static Task NotifyTaskCreatedAsync(
        IHubContext<BoardHub> boardHub,
        Guid projectId,
        Guid taskId,
        CancellationToken ct) =>
        boardHub.Clients.Group(ProjectGroup(projectId))
            .SendAsync("TaskCreated", CreatePayload(taskId, projectId), ct);

    public static Task NotifyTaskUpdatedAsync(
        IHubContext<BoardHub> boardHub,
        Guid projectId,
        Guid taskId,
        CancellationToken ct) =>
        boardHub.Clients.Group(ProjectGroup(projectId))
            .SendAsync("TaskUpdated", CreatePayload(taskId, projectId), ct);

    public static Task NotifyTaskMovedAsync(
        IHubContext<BoardHub> boardHub,
        Guid projectId,
        Guid taskId,
        CancellationToken ct) =>
        boardHub.Clients.Group(ProjectGroup(projectId))
            .SendAsync("TaskMoved", CreatePayload(taskId, projectId), ct);

    public static Task NotifyTaskDeletedAsync(
        IHubContext<BoardHub> boardHub,
        Guid projectId,
        Guid taskId,
        CancellationToken ct) =>
        boardHub.Clients.Group(ProjectGroup(projectId))
            .SendAsync("TaskDeleted", taskId.ToString(), ct);

    public static async Task NotifyTaskUpdatedAsync(
        IHubContext<BoardHub> boardHub,
        AppDbContext db,
        Guid taskId,
        CancellationToken ct)
    {
        var projectId = await ResolveProjectIdAsync(db, taskId, ct);
        if (projectId is null)
        {
            return;
        }

        await NotifyTaskUpdatedAsync(boardHub, projectId.Value, taskId, ct);
    }

    public static async Task<Guid?> ResolveProjectIdAsync(
        AppDbContext db,
        Guid taskId,
        CancellationToken ct) =>
        await db.TaskItems.AsNoTracking()
            .Where(task => task.Id == taskId)
            .Select(task => (Guid?)task.ProjectId)
            .FirstOrDefaultAsync(ct);

    private static string ProjectGroup(Guid projectId) => $"board:{projectId}";

    private static object CreatePayload(Guid taskId, Guid projectId) => new
    {
        taskId,
        projectId,
    };
}
