namespace CaptionBackend.Models;

public class TeamMemberInvite
{
    public Guid TeamMemberInviteId { get; set; }
    public Guid SessionId { get; set; }

    // Email (or user identifier) invited to join the session as a team member
    public string InvitedEmail { get; set; } = string.Empty;

    // Example roles: host, speaker, editor
    public string Role { get; set; } = "speaker";

    // Token used in invite link/code
    public string Code { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }

    public Session Session { get; set; } = null!;
}

