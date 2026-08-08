using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CaptionBackend.Hubs;
using CaptionBackend.Models;
using CaptionBackend.Services;

namespace CaptionBackend.Controllers;

[ApiController]
[Route("api/audio")]
public class AudioController : ControllerBase
{
    private readonly IHubContext<CaptionHub> _hubContext;
    private readonly WhisperClient _whisperClient;
    private readonly CaptionService _captionService;

    public AudioController(
        IHubContext<CaptionHub> hubContext,
        WhisperClient whisperClient,
        CaptionService captionService)
    {
        _hubContext = hubContext;
        _whisperClient = whisperClient;
        _captionService = captionService;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<AudioUploadResponse>> UploadAudio(
        IFormFile audio,
        [FromForm] Guid? sessionId,
        [FromForm] string? sessionTitle,
        CancellationToken cancellationToken)
    {
        if (audio == null || audio.Length == 0)
            return BadRequest("No audio data");

        var resolvedSessionId = sessionId ?? Guid.NewGuid();

        try
        {
            // Read the uploaded file into memory
            using var ms = new MemoryStream();
            await audio.CopyToAsync(ms, cancellationToken);
            var bytes = ms.ToArray();

            // Call Python transcription service
            var englishText = await _whisperClient.TranscribeAsync(bytes, cancellationToken);
            Console.WriteLine($"Transcription: {englishText}");

            if (string.IsNullOrWhiteSpace(englishText))
            {
                await _captionService.EnsureSessionAsync(resolvedSessionId, sessionTitle, cancellationToken);

                // Always return 200 to keep the audio pipeline robust against decode failures.
                return Ok(new AudioUploadResponse(
                    resolvedSessionId,
                    string.Empty,
                    null));
            }

            var caption = await _captionService.SaveCaptionAsync(
                resolvedSessionId,
                englishText,
                sessionTitle: sessionTitle,
                cancellationToken: cancellationToken);

            // Broadcast the saved caption so clients receive the database id and timestamp.
            await _hubContext.Clients
                .Group(CaptionHub.GetSessionGroupName(resolvedSessionId))
                .SendAsync("ReceiveCaption", caption, cancellationToken);

            return Ok(new AudioUploadResponse(resolvedSessionId, caption.Text, caption));
        }
        catch (Exception ex)
        {
            // Never break the client-side pipeline: decode/transcribe should degrade to "no caption".
            Console.WriteLine($"UploadAudio error: {ex}");

            await _captionService.EnsureSessionAsync(resolvedSessionId, sessionTitle, cancellationToken);

            return Ok(new AudioUploadResponse(
                resolvedSessionId,
                string.Empty,
                null));
        }
    }
}
