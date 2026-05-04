using Microsoft.AspNetCore.SignalR;

namespace CaptionBackend.Hubs;

public class CaptionHub : Hub
{
    public async Task SendTestMessage(string message)
    {
        await Clients.All.SendAsync("ReceiveTestMessage", $"Echo: {message}");
    }
}