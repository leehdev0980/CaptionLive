namespace CaptionBackend.Models;

public sealed record AudioUploadResponse(
    Guid SessionId,
    string Text,
    CaptionDto? Caption);
