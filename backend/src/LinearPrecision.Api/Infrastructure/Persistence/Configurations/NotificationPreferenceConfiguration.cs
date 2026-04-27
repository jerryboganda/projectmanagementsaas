using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class NotificationPreferenceConfiguration : IEntityTypeConfiguration<NotificationPreference>
{
    public void Configure(EntityTypeBuilder<NotificationPreference> builder)
    {
        // ── Property constraints ──
        builder.Property(np => np.EventType).IsRequired().HasMaxLength(50);
        builder.Property(np => np.InApp).HasDefaultValue(true);
        builder.Property(np => np.Email).HasDefaultValue(true);
        builder.Property(np => np.Push).HasDefaultValue(false);

        // ── Indexes ──
        builder.HasIndex(np => new { np.UserId, np.WorkspaceId, np.EventType })
            .IsUnique()
            .HasDatabaseName("ix_notification_preferences_user_id_workspace_id_event_type");

        // Index to quickly find users with email digests enabled
        builder.HasIndex(np => np.UserId)
            .HasDatabaseName("ix_notification_preferences_user_id_email_enabled")
            .HasFilter("email = true");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(np => np.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(np => np.User)
            .WithMany()
            .HasForeignKey(np => np.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
