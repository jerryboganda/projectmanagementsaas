using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class MembershipConfiguration : IEntityTypeConfiguration<Membership>
{
    public void Configure(EntityTypeBuilder<Membership> builder)
    {
        // ── Property constraints ──
        builder.Property(m => m.Role)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(m => m.IsActive).HasDefaultValue(true);
        builder.Property(m => m.JoinedAt).HasDefaultValueSql("now()");
        builder.Property(m => m.WorkspaceDisplayName).HasMaxLength(100);
        builder.Property(m => m.WorkspaceAvatarUrl).HasMaxLength(2048);

        // ── Indexes ──
        builder.HasIndex(m => new { m.WorkspaceId, m.UserId })
            .IsUnique()
            .HasDatabaseName("ix_memberships_workspace_id_user_id");

        builder.HasIndex(m => new { m.WorkspaceId, m.Role })
            .HasDatabaseName("ix_memberships_workspace_id_role");

        builder.HasIndex(m => m.UserId)
            .HasDatabaseName("ix_memberships_user_id");

        // FK: WorkspaceId -> Workspaces CASCADE (configured from Workspace side)
        // FK: UserId -> Users CASCADE (configured from User side)
    }
}
