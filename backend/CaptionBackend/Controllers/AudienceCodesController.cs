using CaptionBackend.Data;
using CaptionBackend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CaptionBackend.Controllers;

[ApiController]
[Route("api/audience-codes")]
public class AudienceCodesController : ControllerBase
{
    private readonly CaptionDbContext _dbContext;

    public AudienceCodesController(CaptionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public sealed record GenerateAudienceCodeRequest(string? Role, int? MaxUses);

    public sealed record GenerateAudienceCodeResponse(
        Guid SessionId,
        string Code,
        DateTimeOffset ExpiresAt,
        int? MaxUses
    );

    private async Task<AudienceJoinCode?> GetByCodeAsync(string code, CancellationToken cancellationToken)
    {
        return await _dbContext.AudienceJoinCodes
            .FirstOrDefaultAsync(x => x.Code == code, cancellationToken);
    }

    private static string GenerateCode()
    {
        return Convert.ToHexString(Guid.NewGuid().ToByteArray())
            .Replace("-", "")
            .Substring(0, 16);
    }

    [HttpPost("generate")]
    public async Task<ActionResult<GenerateAudienceCodeResponse>> Generate(
        [FromQuery] Guid sessionId,
        [FromBody] GenerateAudienceCodeRequest request,
        CancellationToken cancellationToken)

    {
        var sessionExists = await _dbContext.Sessions
            .AsNoTracking()
            .AnyAsync(s => s.SessionId == sessionId, cancellationToken);

        if (!sessionExists)
            return NotFound($"Session '{sessionId}' not found.");

        // basic token format; not cryptographically secure — replace if needed later
        var code = GenerateCode();


        var role = string.IsNullOrWhiteSpace(request.Role) ? "listener" : request.Role.Trim();
        var expiresAt = DateTimeOffset.UtcNow.AddHours(8);

        var entity = new AudienceJoinCode
        {
            AudienceJoinCodeId = Guid.NewGuid(),
            SessionId = sessionId,
            Code = code,
            Role = role,
            ExpiresAt = expiresAt,
            MaxUses = request.MaxUses,
            Uses = 0,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.AudienceJoinCodes.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new GenerateAudienceCodeResponse(sessionId, code, expiresAt, request.MaxUses));
    }

    [HttpGet("validate/{code}")]
    public async Task<ActionResult> Validate(
        [FromRoute] string code,
        CancellationToken cancellationToken)
    {
        var entity = await GetByCodeAsync(code, cancellationToken);
        if (entity is null)
            return NotFound(new { valid = false });

        if (entity.RevokedAt is not null)
            return Ok(new { valid = false, reason = "revoked" });

        if (DateTimeOffset.UtcNow > entity.ExpiresAt)
            return Ok(new { valid = false, reason = "expired" });

        if (entity.MaxUses.HasValue && entity.Uses >= entity.MaxUses.Value)
            return Ok(new { valid = false, reason = "max_uses_reached" });

        return Ok(new { valid = true, sessionId = entity.SessionId, role = entity.Role });
    }

    public sealed record JoinFromCodeResponse(Guid SessionId, string Role);

    [HttpPost("join/{code}")]
    public async Task<ActionResult<JoinFromCodeResponse>> JoinFromCode(
        [FromRoute] string code,
        CancellationToken cancellationToken)
    {
        var entity = await _dbContext.AudienceJoinCodes
            .FirstOrDefaultAsync(x => x.Code == code, cancellationToken);

        if (entity is null)
            return NotFound(new { error = "invalid_code" });

        if (entity.RevokedAt is not null)
            return BadRequest(new { error = "revoked" });

        if (DateTimeOffset.UtcNow > entity.ExpiresAt)
            return BadRequest(new { error = "expired" });

        if (entity.MaxUses.HasValue && entity.Uses >= entity.MaxUses.Value)
            return BadRequest(new { error = "max_uses_reached" });

        entity.Uses += 1;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new JoinFromCodeResponse(entity.SessionId, entity.Role));
    }
}

