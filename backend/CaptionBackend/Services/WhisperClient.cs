using System.Text.Json;

namespace CaptionBackend.Services;

public sealed record TranscriptionResult(
    string English,
    string Swahili,
    double Confidence,
    string Status,
    string RejectionReason,
    double ProcessingTimeSeconds
);

public class WhisperClient
{
    private readonly HttpClient _httpClient;

    // HttpClient is injected via constructor (typed client)
    public WhisperClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    /// <summary>
    /// Sends audio bytes to Python and returns transcription text plus quality metadata.
    /// </summary>
    public async Task<TranscriptionResult> TranscribeAsync(byte[] audioBytes, bool translate = false, string? fileName = null, string contentType = "audio/wav")
    {
        using var content = new ByteArrayContent(audioBytes);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            content.Headers.Add("X-Filename", fileName);
        }
        if (translate)
        {
            content.Headers.Add("X-Translate", "true");
        }

        var response = await _httpClient.PostAsync("http://localhost:5001/process", content);
        response.EnsureSuccessStatusCode();

        var jsonString = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonString);
        var root = doc.RootElement;

        return new TranscriptionResult(
            GetString(root, "english"),
            GetString(root, "swahili"),
            GetDouble(root, "confidence"),
            GetString(root, "status", "review"),
            GetString(root, "rejection_reason"),
            GetDouble(root, "processing_time_seconds")
        );
    }

    private static string GetString(JsonElement root, string propertyName, string fallback = "")
    {
        return root.TryGetProperty(propertyName, out var prop) ? prop.GetString() ?? fallback : fallback;
    }

    private static double GetDouble(JsonElement root, string propertyName)
    {
        return root.TryGetProperty(propertyName, out var prop) && prop.TryGetDouble(out var value) ? value : 0;
    }
}
