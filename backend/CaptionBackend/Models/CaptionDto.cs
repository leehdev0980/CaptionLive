namespace CaptionBackend.Models;

public sealed record CaptionDto(
    long CaptionId,
    Guid SessionId,
    DateTimeOffset Timestamp,
    string Language,
    string Text,
    double? Confidence,
    string? SpeakerId);
