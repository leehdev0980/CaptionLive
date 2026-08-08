namespace CaptionBackend.Models;

public class Caption
{
    public long CaptionId { get; set; }
    public Guid SessionId { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string Language { get; set; } = "en";
    public string Text { get; set; } = string.Empty;
    public double? Confidence { get; set; }
    public string? SpeakerId { get; set; }

    public Session? Session { get; set; }
}
