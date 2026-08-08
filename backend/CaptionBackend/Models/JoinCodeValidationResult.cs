namespace CaptionBackend.Models;

public sealed record JoinCodeValidationResult(
    bool IsValid,
    Guid? SessionId,
    string? Role
);

