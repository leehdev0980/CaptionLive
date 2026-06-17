using Microsoft.AspNetCore.SignalR;

namespace CaptionBackend.Hubs;

public class CaptionHub : Hub
{
    public async Task SendTestMessage(string message)
    {
        // Prevent cross-tab/session leakage: do not broadcast to Clients.All.
        await Clients.Caller.SendAsync("ReceiveTestMessage", $"Echo: {message}");
    }
}
