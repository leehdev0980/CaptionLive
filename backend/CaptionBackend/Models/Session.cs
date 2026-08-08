namespace CaptionBackend.Models;

public class Session
{
    public Guid SessionId { get; set; }
    public string Title { get; set; } = "Untitled session";
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }

    public ICollection<Caption> Captions { get; set; } = new List<Caption>();
}
