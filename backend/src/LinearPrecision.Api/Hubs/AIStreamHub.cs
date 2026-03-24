using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace LinearPrecision.Api.Hubs;

[Authorize]
public class AIStreamHub : Hub
{
    public async Task JoinConversation(string conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"ai:{conversationId}");
    }

    public async Task LeaveConversation(string conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"ai:{conversationId}");
    }

    // Server pushes streaming tokens: Clients.Group($"ai:{conversationId}").SendAsync("TokenReceived", token)
    // Server signals completion: Clients.Group($"ai:{conversationId}").SendAsync("StreamCompleted", messageId)
}
