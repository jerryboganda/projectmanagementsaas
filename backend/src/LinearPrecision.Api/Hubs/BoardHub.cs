using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace LinearPrecision.Api.Hubs;

[Authorize]
public class BoardHub : Hub
{
    // Client joins a project board channel
    public async Task JoinBoard(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"board:{projectId}");
    }

    public async Task LeaveBoard(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"board:{projectId}");
    }

    // Server-side methods called by backend services to push updates:
    // Clients listen for: TaskCreated, TaskUpdated, TaskMoved, TaskDeleted
    public async Task NotifyTaskCreated(string projectId, object taskData)
    {
        await Clients.Group($"board:{projectId}").SendAsync("TaskCreated", taskData);
    }

    public async Task NotifyTaskUpdated(string projectId, object taskData)
    {
        await Clients.Group($"board:{projectId}").SendAsync("TaskUpdated", taskData);
    }

    public async Task NotifyTaskMoved(string projectId, object moveData)
    {
        await Clients.Group($"board:{projectId}").SendAsync("TaskMoved", moveData);
    }

    public async Task NotifyTaskDeleted(string projectId, string taskId)
    {
        await Clients.Group($"board:{projectId}").SendAsync("TaskDeleted", taskId);
    }
}
