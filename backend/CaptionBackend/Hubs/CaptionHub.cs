using CaptionBackend.Data;
using CaptionBackend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CaptionBackend.Hubs;

public class CaptionHub : Hub
{
    private readonly CaptionDbContext _dbContext;

    public CaptionHub(CaptionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public static string GetSessionGroupName(Guid sessionId)
    {
        return $"session:{sessionId:D}";
    }

    public async Task JoinSession(string sessionId, string? audienceCode)
    {
        if (!Guid.TryParse(sessionId, out var parsedSessionId))
        {
            throw new HubException("A valid session id is required.");
        }

        // Enforce audience join code when provided.
        if (!string.IsNullOrWhiteSpace(audienceCode))
        {
            var code = audienceCode.Trim();

            var entity = await _dbContext.AudienceJoinCodes
                .FirstOrDefaultAsync(x => x.Code == code && x.SessionId == parsedSessionId);

            if (entity is null)
                throw new HubException("Invalid audience code.");

            if (entity.RevokedAt is not null)
                throw new HubException("Audience code is revoked.");

            if (DateTimeOffset.UtcNow > entity.ExpiresAt)
                throw new HubException("Audience code is expired.");

            if (entity.MaxUses.HasValue && entity.Uses >= entity.MaxUses.Value)
                throw new HubException("Audience code max uses reached.");

            entity.Uses += 1;
            await _dbContext.SaveChangesAsync(Context.ConnectionAborted);
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GetSessionGroupName(parsedSessionId));
    }

    public async Task LeaveSession(string sessionId)
    {
        if (!Guid.TryParse(sessionId, out var parsedSessionId))
        {
            throw new HubException("A valid session id is required.");
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetSessionGroupName(parsedSessionId));
    }

    public async Task SendTestMessage(string message)
    {
        await Clients.All.SendAsync("ReceiveTestMessage", $"Echo: {message}");
    }
}
