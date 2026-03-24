using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class InitiativeConfiguration : IEntityTypeConfiguration<Initiative>
{
    public void Configure(EntityTypeBuilder<Initiative> builder)
    {
        // ── Property constraints ──
        builder.Property(i => i.Title).IsRequired().HasMaxLength(200);
        builder.Property(i => i.Description).HasMaxLength(2000);
        builder.Property(i => i.ProgressPercent).HasDefaultValue(0);
        builder.Property(i => i.IsDeleted).HasDefaultValue(false);

        builder.Property(i => i.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        // ── Indexes ──
        builder.HasIndex(i => new { i.WorkspaceId, i.GoalId })
            .HasDatabaseName("ix_initiatives_workspace_id_goal_id");

        builder.HasIndex(i => new { i.WorkspaceId, i.Status })
            .HasDatabaseName("ix_initiatives_workspace_id_status");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (Configured from Workspace side or by convention)

        // ── FK: GoalId -> Goals CASCADE ──
        // (Configured from Goal side via HasMany)

        // ── FK: OwnerId -> Users SetNull ──
        builder.HasOne(i => i.Owner)
            .WithMany()
            .HasForeignKey(i => i.OwnerId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: DeletedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(i => i.DeletedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(i => i.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(i => i.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Collection navigations ──
        builder.HasMany(i => i.Milestones)
            .WithOne(m => m.Initiative)
            .HasForeignKey(m => m.InitiativeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
