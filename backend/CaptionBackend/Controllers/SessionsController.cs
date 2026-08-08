using CaptionBackend.Models;
using CaptionBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace CaptionBackend.Controllers;

[ApiController]
[Route("api/sessions")]
public class SessionsController : ControllerBase
{
    private readonly CaptionService _captionService;

    public SessionsController(CaptionService captionService)
    {
        _captionService = captionService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SessionDto>>> GetSessions(
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var sessions = await _captionService.GetSessionsAsync(limit, cancellationToken);
        return Ok(sessions);
    }

    [HttpGet("{sessionId:guid}")]
    public async Task<ActionResult<SessionDto>> GetSession(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var session = await _captionService.GetSessionAsync(sessionId, cancellationToken);

        if (session is null)
        {
            return NotFound();
        }

        return Ok(session);
    }

    [HttpPost]
    public async Task<ActionResult<SessionDto>> CreateSession(
        CreateSessionRequest request,
        CancellationToken cancellationToken)
    {
        var session = await _captionService.CreateSessionAsync(
            request.SessionId,
            request.Title,
            cancellationToken);

        return CreatedAtAction(
            nameof(GetSession),
            new { sessionId = session.SessionId },
            session);
    }

    [HttpPatch("{sessionId:guid}")]
    public async Task<ActionResult<SessionDto>> UpdateSession(
        Guid sessionId,
        UpdateSessionRequest request,
        CancellationToken cancellationToken)
    {
        var session = await _captionService.UpdateSessionAsync(
            sessionId,
            request.Title,
            cancellationToken);

        if (session is null)
        {
            return NotFound();
        }

        return Ok(session);
    }

    [HttpPatch("{sessionId:guid}/end")]
    public async Task<ActionResult<SessionDto>> EndSession(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var session = await _captionService.EndSessionAsync(sessionId, cancellationToken);

        if (session is null)
        {
            return NotFound();
        }

        return Ok(session);
    }

    [HttpGet("{sessionId:guid}/captions")]
    public async Task<ActionResult<IReadOnlyList<CaptionDto>>> GetCaptions(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var captions = await _captionService.GetCaptionsAsync(sessionId, cancellationToken);
        return Ok(captions);
    }
}
