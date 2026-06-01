using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CaptionBackend.Hubs;
using CaptionBackend.Services;

namespace CaptionBackend.Controllers;

[ApiController]
[Route("api/audio")]
public class AudioController : ControllerBase
{
    private static readonly HashSet<string> SupportedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".wav", ".mp3", ".webm", ".mp4", ".m4a", ".ogg"
    };

    private readonly IHubContext<CaptionHub> _hubContext;
    private readonly WhisperClient _whisperClient;
    private readonly IHttpClientFactory _httpClientFactory;

    // Both services are automatically provided by the DI container
    public AudioController(IHubContext<CaptionHub> hubContext, WhisperClient whisperClient, IHttpClientFactory httpClientFactory)
    {
        _hubContext = hubContext;
        _whisperClient = whisperClient;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadAudio(IFormFile audio, [FromQuery] bool translate = false)
    {
         if (audio == null || audio.Length == 0)
            return BadRequest("No audio data");

        // Read the uploaded file into memory
        using var ms = new MemoryStream();
        await audio.CopyToAsync(ms);
        var bytes = ms.ToArray();

        // Call Python transcription service
        try
        {
            var result = await _whisperClient.TranscribeAsync(bytes, translate, audio.FileName, audio.ContentType);

            // Broadcast to all connected React clients via SignalR
            await _hubContext.Clients.All.SendAsync("ReceiveCaption", result.English, result.Swahili, ToClientMetadata(result, audio.FileName));

            return Ok(ToApiResponse(result, audio.FileName));
        }
        catch (TimeoutException)
        {
            return StatusCode(504, "Transcription timed out. Try again or use a shorter audio clip.");
        }
        catch (TaskCanceledException)
        {
            // HttpClient.Timeout manifests as TaskCanceledException
            return StatusCode(504, "Transcription timed out (request canceled). Try again or use a shorter audio clip.");
        }
    }

    [HttpPost("import-file")]
    public async Task<IActionResult> ImportFile(IFormFile media, [FromQuery] bool translate = false)
    {
        if (media == null || media.Length == 0)
            return BadRequest("No media file was uploaded.");

        if (!IsSupportedMediaName(media.FileName))
            return BadRequest("Unsupported media type. Use .wav, .mp3, .webm, .mp4, .m4a, or .ogg.");

        using var ms = new MemoryStream();
        await media.CopyToAsync(ms);
        var bytes = ms.ToArray();

        try
        {
            var result = await _whisperClient.TranscribeAsync(bytes, translate, media.FileName, media.ContentType);
            await _hubContext.Clients.All.SendAsync("ReceiveCaption", result.English, result.Swahili, ToClientMetadata(result, media.FileName));

            return Ok(ToApiResponse(result, media.FileName));
        }
        catch (TimeoutException)
        {
            return StatusCode(504, "Transcription timed out. Try again or use a shorter audio clip.");
        }
        catch (TaskCanceledException)
        {
            return StatusCode(504, "Transcription timed out (request canceled). Try again or use a shorter audio clip.");
        }
    }

    [HttpPost("import-url")]
    public async Task<IActionResult> ImportUrl([FromBody] MediaUrlRequest request, [FromQuery] bool translate = false)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Url))
            return BadRequest("A direct media URL is required.");

        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return BadRequest("Enter a valid http or https media URL.");

        if (!IsSupportedMediaName(uri.AbsolutePath))
            return BadRequest("Unsupported URL. Use a direct media link ending in .wav, .mp3, .webm, .mp4, .m4a, or .ogg.");

        var client = _httpClientFactory.CreateClient("MediaImport");
        using var response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead);
        if (!response.IsSuccessStatusCode)
            return BadRequest($"Could not download media URL. Remote server returned {(int)response.StatusCode}.");

        var contentLength = response.Content.Headers.ContentLength;
        if (contentLength.HasValue && contentLength.Value > 100 * 1024 * 1024)
            return BadRequest("Media file is too large for this demo import. Keep it under 100 MB.");

        var bytes = await response.Content.ReadAsByteArrayAsync();
        var fileName = Path.GetFileName(uri.LocalPath);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";

        try
        {
            var result = await _whisperClient.TranscribeAsync(bytes, translate, fileName, contentType);
            await _hubContext.Clients.All.SendAsync("ReceiveCaption", result.English, result.Swahili, ToClientMetadata(result, request.Url));

            return Ok(ToApiResponse(result, request.Url));
        }
        catch (TimeoutException)
        {
            return StatusCode(504, "Transcription timed out. Try again or use a shorter audio clip.");
        }
        catch (TaskCanceledException)
        {
            return StatusCode(504, "Transcription timed out (request canceled). Try again or use a shorter audio clip.");
        }
    }

    private static bool IsSupportedMediaName(string name)
    {
        var extension = Path.GetExtension(name);
        return !string.IsNullOrWhiteSpace(extension) && SupportedExtensions.Contains(extension);
    }

    private static object ToClientMetadata(TranscriptionResult result, string source)
    {
        return new
        {
            confidence = result.Confidence,
            status = result.Status,
            rejectionReason = result.RejectionReason,
            processingTimeSeconds = result.ProcessingTimeSeconds,
            source
        };
    }

    private static object ToApiResponse(TranscriptionResult result, string source)
    {
        return new
        {
            english = result.English,
            swahili = result.Swahili,
            confidence = result.Confidence,
            status = result.Status,
            rejectionReason = result.RejectionReason,
            processingTimeSeconds = result.ProcessingTimeSeconds,
            source
        };
    }
}

public sealed record MediaUrlRequest(string Url);
