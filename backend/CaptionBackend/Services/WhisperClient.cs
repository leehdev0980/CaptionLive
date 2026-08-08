using System.Text.Json;
using Microsoft.Extensions.Options;

namespace CaptionBackend.Services;

public class WhisperClient
{
    private readonly HttpClient _httpClient;
    private readonly WhisperOptions _options;

    public WhisperClient(HttpClient httpClient, IOptions<WhisperOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    /// <summary>
    /// Sends audio bytes to Python and returns the English transcription.
    /// This method is intentionally defensive: decode/transcribe failures should not crash the ASP.NET endpoint.
    /// </summary>
    public async Task<string> TranscribeAsync(byte[] audioBytes, CancellationToken cancellationToken = default)
    {
        try
        {
            // Prepare the request body as raw bytes.
            // MediaRecorder produces opus-in-container bytes (webm/ogg), so don't force audio/wav content-type.
            using var content = new ByteArrayContent(audioBytes);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");

            var response = await _httpClient.PostAsync(_options.ProcessPath, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                // Consume the body to avoid socket exhaustion issues and return empty transcript.
                _ = await response.Content.ReadAsStringAsync(cancellationToken);
                return string.Empty;
            }

            var jsonString = await response.Content.ReadAsStringAsync(cancellationToken);

            // Parse the JSON to extract the "english" field
            using var doc = JsonDocument.Parse(jsonString);
            return doc.RootElement.TryGetProperty("english", out var englishElement)
                ? englishElement.GetString() ?? string.Empty
                : string.Empty;
        }
        catch (Exception ex) when (
            ex is HttpRequestException ||
            ex is TaskCanceledException ||
            ex is JsonException ||
            ex is InvalidOperationException)
        {
            Console.WriteLine($"WhisperClient error: {ex.Message}");
            return string.Empty;
        }
    }
}
