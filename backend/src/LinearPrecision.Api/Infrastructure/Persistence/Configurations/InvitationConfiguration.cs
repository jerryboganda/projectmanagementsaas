using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        // ── Property constraints ──
        builder.Property(i => i.Email).IsRequired().HasMaxLength(254);
        builder.Property(i => i.Token).IsRequired().HasMaxLength(64);
        builder.Property(i => i.ProjectIds).HasColumnType("jsonb");

        builder.Property(i => i.Role)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(i => i.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(InvitationStatus.Pending);

        // ── Indexes ──
        builder.HasIndex(i => i.Token)
            .IsUnique()
            .HasDatabaseName("ix_invitations_token");

        builder.HasIndex(i => new { i.WorkspaceId, i.Email, i.Status })
            .HasDatabaseName("ix_invitations_workspace_id_email_status");

        builder.HasIndex(i => i.ExpiresAt)
            .HasDatabaseName("ix_invitations_expires_at");

        // Index to support fast pending-invitation expiry scans
        builder.HasIndex(i => new { i.Status, i.ExpiresAt })
            .HasDatabaseName("ix_invitations_status_expires_at");

        // ── FK: WorkspaceId -> Workspaces CASCADE (configured from Workspace side) ──

        // ── FK: InvitedBy -> Users (NoAction/Restrict) ──
        builder.HasOne(i => i.InvitedByUser)
            .WithMany()
            .HasForeignKey(i => i.InvitedBy)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
