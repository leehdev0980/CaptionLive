namespace CaptionBackend.Models;

public class AudienceJoinCode
{
    public Guid AudienceJoinCodeId { get; set; }
    public Guid SessionId { get; set; }

    // Token that the audience scans.
    public string Code { get; set; } = string.Empty;

    // Example: "listener" for now
    public string Role { get; set; } = "listener";

    public DateTimeOffset ExpiresAt { get; set; }
    public int? MaxUses { get; set; }
    public int Uses { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }

    public Session Session { get; set; } = null!;
}

