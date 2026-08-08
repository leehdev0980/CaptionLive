using CaptionBackend.Data;
using CaptionBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CaptionBackend.Controllers;

[ApiController]
[Route("api/invites")]
public class InvitesController : ControllerBase
{
    private readonly CaptionDbContext _dbContext;

    public InvitesController(CaptionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public sealed record CreateInviteRequest(
        Guid SessionId,
        string InvitedEmail,
        string? Role,
        int ExpiresHours = 24);

    public sealed record CreateInviteResponse(
        Guid InviteId,
        Guid SessionId,
        string Code,
        DateTimeOffset ExpiresAt);

    [HttpPost]
    public async Task<ActionResult<CreateInviteResponse>> Create(
        [FromBody] CreateInviteRequest request,
        CancellationToken cancellationToken)
    {
        var sessionExists = await _dbContext.Sessions
            .AsNoTracking()
            .AnyAsync(s => s.SessionId == request.SessionId, cancellationToken);

        if (!sessionExists)
            return NotFound($"Session '{request.SessionId}' not found.");

        var code = Convert.ToHexString(Guid.NewGuid().ToByteArray())
            .Replace("-", "")
            .Substring(0, 16);

        var role = string.IsNullOrWhiteSpace(request.Role) ? "speaker" : request.Role.Trim();
        var expiresAt = DateTimeOffset.UtcNow.AddHours(Math.Clamp(request.ExpiresHours, 1, 168));

        var entity = new TeamMemberInvite
        {
            TeamMemberInviteId = Guid.NewGuid(),
            SessionId = request.SessionId,
            InvitedEmail = request.InvitedEmail.Trim(),
            Role = role,
            Code = code,
            ExpiresAt = expiresAt,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.TeamMemberInvites.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new CreateInviteResponse(entity.TeamMemberInviteId, entity.SessionId, entity.Code, entity.ExpiresAt));
    }

    public sealed record AcceptInviteResponse(Guid SessionId, string Role, string InvitedEmail);

    [HttpPost("accept/{code}")]
    public async Task<ActionResult<AcceptInviteResponse>> Accept(
        [FromRoute] string code,
        CancellationToken cancellationToken)
    {
        var entity = await _dbContext.TeamMemberInvites
            .FirstOrDefaultAsync(x => x.Code == code, cancellationToken);

        if (entity is null)
            return NotFound(new { error = "invalid_code" });

        if (entity.RevokedAt is not null)
            return BadRequest(new { error = "revoked" });

        if (entity.AcceptedAt is not null)
            return BadRequest(new { error = "already_accepted" });

        if (DateTimeOffset.UtcNow > entity.ExpiresAt)
            return BadRequest(new { error = "expired" });

        entity.AcceptedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new AcceptInviteResponse(entity.SessionId, entity.Role, entity.InvitedEmail));
    }
}

