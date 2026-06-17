using System.Text.Json;

namespace CaptionBackend.Services;


public sealed record TranscriptionResult(
    string English,
    string Swahili,
    double Confidence,
    string Status,
    string RejectionReason,
    double ProcessingTimeSeconds,
    IReadOnlyList<SegmentTiming> Segments
);

public sealed record SegmentTiming(double Start, double End, string Text);


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

        // Some client-provided media types can contain non-ASCII characters.
        // Avoid propagating them into HTTP headers; Python does not require the exact media type.
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            // HttpClient header values must be ASCII only; file names may contain unicode.
            // Send a base64-encoded UTF-8 filename instead.
            var filenameUtf8 = System.Text.Encoding.UTF8.GetBytes(fileName);
            var filenameB64 = Convert.ToBase64String(filenameUtf8);
            content.Headers.Add("X-FilenameB64", filenameB64);
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

        var segments = new List<SegmentTiming>();
        if (root.TryGetProperty("segments", out var segsProp) && segsProp.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in segsProp.EnumerateArray())
            {
                var start = item.TryGetProperty("start", out var sp) && sp.TryGetDouble(out var s) ? s : 0;
                var end = item.TryGetProperty("end", out var ep) && ep.TryGetDouble(out var e) ? e : 0;
                var text = item.TryGetProperty("text", out var tp) ? tp.GetString() ?? "" : "";
                segments.Add(new SegmentTiming(start, end, text));
            }
        }

        return new TranscriptionResult(
            GetString(root, "english"),
            GetString(root, "swahili"),
            GetDouble(root, "confidence"),
            GetString(root, "status", "review"),
            GetString(root, "rejection_reason"),
            GetDouble(root, "processing_time_seconds"),
            segments
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
