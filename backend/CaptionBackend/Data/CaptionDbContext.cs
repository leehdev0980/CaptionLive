using CaptionBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace CaptionBackend.Data;

public class CaptionDbContext : DbContext
{
    public CaptionDbContext(DbContextOptions<CaptionDbContext> options)
        : base(options)
    {
    }

    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Caption> Captions => Set<Caption>();

    public DbSet<AudienceJoinCode> AudienceJoinCodes => Set<AudienceJoinCode>();
    public DbSet<TeamMemberInvite> TeamMemberInvites => Set<TeamMemberInvite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasKey(session => session.SessionId);

            entity.Property(session => session.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(session => session.StartTime)
                .IsRequired();

            entity.HasMany(session => session.Captions)
                .WithOne(caption => caption.Session)
                .HasForeignKey(caption => caption.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Caption>(entity =>
        {
            entity.HasKey(caption => caption.CaptionId);

            entity.Property(caption => caption.Language)
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(caption => caption.Text)
                .IsRequired();

            entity.Property(caption => caption.SpeakerId)
                .HasMaxLength(64);

            entity.HasIndex(caption => new { caption.SessionId, caption.Timestamp });
        });

        modelBuilder.Entity<AudienceJoinCode>(entity =>
        {
            entity.HasKey(x => x.AudienceJoinCodeId);

            entity.Property(x => x.Code)
                .HasMaxLength(64)
                .IsRequired();

            entity.Property(x => x.Role)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.ExpiresAt)
                .IsRequired();

            entity.HasOne(x => x.Session)
                .WithMany()
                .HasForeignKey(x => x.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.SessionId, x.Code })
                .IsUnique();
        });

        modelBuilder.Entity<TeamMemberInvite>(entity =>
        {
            entity.HasKey(x => x.TeamMemberInviteId);

            entity.Property(x => x.InvitedEmail)
                .HasMaxLength(320)
                .IsRequired();

            entity.Property(x => x.Role)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(x => x.Code)
                .HasMaxLength(64)
                .IsRequired();

            entity.Property(x => x.ExpiresAt)
                .IsRequired();

            entity.HasOne(x => x.Session)
                .WithMany()
                .HasForeignKey(x => x.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.SessionId, x.Code })
                .IsUnique();
        });
    }
}

