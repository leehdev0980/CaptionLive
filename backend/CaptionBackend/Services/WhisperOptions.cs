namespace CaptionBackend.Services;

public class WhisperOptions
{
    public string BaseUrl { get; set; } = "http://localhost:5001";
    public string ProcessPath { get; set; } = "/process";
    public int TimeoutSeconds { get; set; } = 30;
}
