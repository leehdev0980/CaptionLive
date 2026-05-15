using System.Net.Http;
using System.Text.Json;

namespace CaptionBackend.Services;

public class WhisperClient
{
    private readonly HttpClient _httpClient;

    // HttpClient is injected via constructor (typed client)
    public WhisperClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    /// <summary>
    /// Sends audio bytes to Python and returns the English transcription.
    /// </summary>
    public async Task<(string English, string Swahili)> TranscribeAsync(byte[] audioBytes, bool translate = false)
    {
        // Prepare the request body as raw bytes with the correct MIME type
        using var content = new ByteArrayContent(audioBytes);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/wav");
        if (translate)
        {
            content.Headers.Add("X-Translate", "true");
        }

        // Call the Python microservice
        var response = await _httpClient.PostAsync("http://localhost:5001/process", content);
        response.EnsureSuccessStatusCode(); // throws if not 2xx

        var jsonString = await response.Content.ReadAsStringAsync();
        
        // Parse the JSON to extract the "english" field
        using var doc = JsonDocument.Parse(jsonString);
        string english = doc.RootElement.GetProperty("english").GetString() ?? "";
        string swahili = "";
        if (doc.RootElement.TryGetProperty("swahili", out var swProp))
            swahili = swProp.GetString() ?? "";

        return (english, swahili);
    }
}