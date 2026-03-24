using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        // ── Property constraints ──
        builder.Property(n => n.Type).IsRequired().HasMaxLength(50);
        builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Body).HasMaxLength(500);
        builder.Property(n => n.EntityType).HasMaxLength(50);
        builder.Property(n => n.IsRead).HasDefaultValue(false);
        builder.Property(n => n.IsArchived).HasDefaultValue(false);
        builder.Property(n => n.EmailSent).HasDefaultValue(false);

        // ── Indexes ──
        builder.HasIndex(n => new { n.RecipientId, n.IsRead, n.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("ix_notifications_recipient_id_is_read_created_at");

        builder.HasIndex(n => n.WorkspaceId)
            .HasDatabaseName("ix_notifications_workspace_id");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(n => n.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Recipient)
            .WithMany()
            .HasForeignKey(n => n.RecipientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Actor)
            .WithMany()
            .HasForeignKey(n => n.ActorId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
