using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CaptionBackend.Hubs;
using CaptionBackend.Services;

namespace CaptionBackend.Controllers;

[ApiController]
[Route("api/audio")]
public class AudioController : ControllerBase
{
    private readonly IHubContext<CaptionHub> _hubContext;
    private readonly WhisperClient _whisperClient;

    // Both services are automatically provided by the DI container
    public AudioController(IHubContext<CaptionHub> hubContext, WhisperClient whisperClient)
    {
        _hubContext = hubContext;
        _whisperClient = whisperClient;
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
        var (english, swahili) = await _whisperClient.TranscribeAsync(bytes, translate);

        // Broadcast to all connected React clients via SignalR
        await _hubContext.Clients.All.SendAsync("ReceiveCaption", english, swahili);

        return Ok(new { english, swahili });
    }
}