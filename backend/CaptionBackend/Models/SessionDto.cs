namespace CaptionBackend.Models;

public sealed record SessionDto(
    Guid SessionId,
    string Title,
    DateTimeOffset StartTime,
    DateTimeOffset? EndTime,
    int CaptionCount);

public sealed record CreateSessionRequest(Guid? SessionId, string? Title);

public sealed record UpdateSessionRequest(string? Title);
