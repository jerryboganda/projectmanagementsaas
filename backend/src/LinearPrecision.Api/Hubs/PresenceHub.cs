using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace LinearPrecision.Api.Hubs;

/// <summary>
/// Tracks user online/offline presence and typing indicators.
/// Uses SignalR groups — all connections join the "presence" group on connect.
/// For multi-instance deployments the Redis backplane (already registered in Program.cs)
/// propagates group membership and broadcast messages across instances automatically.
/// </summary>
[Authorize]
public class PresenceHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (userId is not null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "presence");
            await Clients.Group("presence").SendAsync("UserOnline", userId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (userId is not null)
        {
            await Clients.Group("presence").SendAsync("UserOffline", userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task StartTyping(string channel)
    {
        var userId = Context.UserIdentifier;
        await Clients.Group(channel).SendAsync("UserTyping", userId, channel);
    }

    public async Task StopTyping(string channel)
    {
        var userId = Context.UserIdentifier;
        await Clients.Group(channel).SendAsync("UserStoppedTyping", userId, channel);
    }
}
