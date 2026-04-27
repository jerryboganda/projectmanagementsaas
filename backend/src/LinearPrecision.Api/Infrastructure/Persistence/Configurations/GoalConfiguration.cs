using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class GoalConfiguration : IEntityTypeConfiguration<Goal>
{
    public void Configure(EntityTypeBuilder<Goal> builder)
    {
        // ── Property constraints ──
        builder.Property(g => g.Title).IsRequired().HasMaxLength(200);
        builder.Property(g => g.Description).HasMaxLength(2000);
        builder.Property(g => g.ProgressPercent).HasDefaultValue(0);
        builder.Property(g => g.IsDeleted).HasDefaultValue(false);

        builder.Property(g => g.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(g => g.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(g => g.ProgressSource)
            .HasConversion<string>()
            .HasMaxLength(20);

        // ── Indexes ──
        builder.HasIndex(g => new { g.WorkspaceId, g.Status })
            .HasDatabaseName("ix_goals_workspace_id_status");

        builder.HasIndex(g => new { g.WorkspaceId, g.OwnerId })
            .HasDatabaseName("ix_goals_workspace_id_owner_id");

        builder.HasIndex(g => g.ParentGoalId)
            .HasDatabaseName("ix_goals_parent_goal_id");

        builder.HasIndex(g => new { g.WorkspaceId, g.IsDeleted })
            .HasDatabaseName("ix_goals_workspace_id_is_deleted");

        builder.HasIndex(g => new { g.WorkspaceId, g.Title })
            .HasDatabaseName("ix_goals_workspace_id_title");

        builder.HasIndex(g => new { g.WorkspaceId, g.CreatedAt })
            .IsDescending(false, true)
            .HasDatabaseName("ix_goals_workspace_id_created_at");

        builder.HasIndex(g => g.DeletedAt)
            .HasDatabaseName("ix_goals_deleted_at")
            .HasFilter("is_deleted = true");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (Configured from Workspace side)

        // ── FK: OwnerId -> Users SetNull ──
        builder.HasOne(g => g.Owner)
            .WithMany()
            .HasForeignKey(g => g.OwnerId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: ParentGoalId -> Goals SetNull (self-ref) ──
        builder.HasOne(g => g.ParentGoal)
            .WithMany(g => g.SubGoals)
            .HasForeignKey(g => g.ParentGoalId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: DeletedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(g => g.DeletedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(g => g.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(g => g.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Collection navigations ──
        builder.HasMany(g => g.ProjectLinks)
            .WithOne(gl => gl.Goal)
            .HasForeignKey(gl => gl.GoalId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.Initiatives)
            .WithOne(i => i.Goal)
            .HasForeignKey(i => i.GoalId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
