using CaptionBackend.Data;
using CaptionBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace CaptionBackend.Services;

public class CaptionService
{
    private readonly CaptionDbContext _dbContext;

    public CaptionService(CaptionDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<SessionDto>> GetSessionsAsync(
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 200);

        return await _dbContext.Sessions
            .AsNoTracking()
            .OrderByDescending(session => session.StartTime)
            .Take(safeLimit)
            .Select(session => new SessionDto(
                session.SessionId,
                session.Title,
                session.StartTime,
                session.EndTime,
                session.Captions.Count))
            .ToListAsync(cancellationToken);
    }

    public async Task<SessionDto?> GetSessionAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Sessions
            .AsNoTracking()
            .Where(session => session.SessionId == sessionId)
            .Select(session => new SessionDto(
                session.SessionId,
                session.Title,
                session.StartTime,
                session.EndTime,
                session.Captions.Count))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<SessionDto> CreateSessionAsync(
        Guid? sessionId = null,
        string? title = null,
        CancellationToken cancellationToken = default)
    {
        var session = await EnsureSessionAsync(sessionId ?? Guid.NewGuid(), title, cancellationToken);
        return await ToSessionDtoAsync(session, cancellationToken);
    }

    public async Task<Session> EnsureSessionAsync(
        Guid sessionId,
        string? title = null,
        CancellationToken cancellationToken = default)
    {
        var existingSession = await _dbContext.Sessions
            .FirstOrDefaultAsync(session => session.SessionId == sessionId, cancellationToken);

        if (existingSession is not null)
        {
            return existingSession;
        }

        var session = new Session
        {
            SessionId = sessionId,
            Title = NormalizeTitle(sessionId, title),
            StartTime = DateTimeOffset.UtcNow
        };

        _dbContext.Sessions.Add(session);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return session;
    }

    public async Task<SessionDto?> UpdateSessionAsync(
        Guid sessionId,
        string? title,
        CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.Sessions
            .FirstOrDefaultAsync(existingSession => existingSession.SessionId == sessionId, cancellationToken);

        if (session is null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(title))
        {
            session.Title = NormalizeTitle(sessionId, title);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await ToSessionDtoAsync(session, cancellationToken);
    }

    public async Task<SessionDto?> EndSessionAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await _dbContext.Sessions
            .FirstOrDefaultAsync(existingSession => existingSession.SessionId == sessionId, cancellationToken);

        if (session is null)
        {
            return null;
        }

        session.EndTime ??= DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return await ToSessionDtoAsync(session, cancellationToken);
    }

    public async Task<CaptionDto> SaveCaptionAsync(
        Guid sessionId,
        string text,
        string language = "en",
        double? confidence = null,
        string? speakerId = null,
        string? sessionTitle = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureSessionAsync(sessionId, sessionTitle, cancellationToken);

        var caption = new Caption
        {
            SessionId = sessionId,
            Timestamp = DateTimeOffset.UtcNow,
            Language = TrimToMax(string.IsNullOrWhiteSpace(language) ? "en" : language.Trim(), 10),
            Text = text.Trim(),
            Confidence = confidence,
            SpeakerId = string.IsNullOrWhiteSpace(speakerId) ? null : TrimToMax(speakerId.Trim(), 64)
        };

        _dbContext.Captions.Add(caption);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDto(caption);
    }

    public async Task<IReadOnlyList<CaptionDto>> GetCaptionsAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Captions
            .AsNoTracking()
            .Where(caption => caption.SessionId == sessionId)
            .OrderBy(caption => caption.Timestamp)
            .Select(caption => new CaptionDto(
                caption.CaptionId,
                caption.SessionId,
                caption.Timestamp,
                caption.Language,
                caption.Text,
                caption.Confidence,
                caption.SpeakerId))
            .ToListAsync(cancellationToken);
    }

    public static CaptionDto ToDto(Caption caption)
    {
        return new CaptionDto(
            caption.CaptionId,
            caption.SessionId,
            caption.Timestamp,
            caption.Language,
            caption.Text,
            caption.Confidence,
            caption.SpeakerId);
    }

    private async Task<SessionDto> ToSessionDtoAsync(
        Session session,
        CancellationToken cancellationToken = default)
    {
        var captionCount = await _dbContext.Captions
            .CountAsync(caption => caption.SessionId == session.SessionId, cancellationToken);

        return new SessionDto(
            session.SessionId,
            session.Title,
            session.StartTime,
            session.EndTime,
            captionCount);
    }

    private static string NormalizeTitle(Guid sessionId, string? title)
    {
        var normalizedTitle = string.IsNullOrWhiteSpace(title)
            ? $"Session {sessionId:N}"[..20]
            : title.Trim();

        return TrimToMax(normalizedTitle, 200);
    }

    private static string TrimToMax(string value, int maxLength)
    {
        return value.Length <= maxLength ? value : value[..maxLength];
    }
}
