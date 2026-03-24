using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class GoalProjectLinkConfiguration : IEntityTypeConfiguration<GoalProjectLink>
{
    public void Configure(EntityTypeBuilder<GoalProjectLink> builder)
    {
        // ── Indexes ──
        builder.HasIndex(gpl => new { gpl.GoalId, gpl.ProjectId })
            .IsUnique()
            .HasDatabaseName("ix_goal_project_links_goal_id_project_id");

        builder.HasIndex(gpl => gpl.WorkspaceId)
            .HasDatabaseName("ix_goal_project_links_workspace_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (Configured from Workspace side or by convention)

        // ── FK: GoalId -> Goals CASCADE ──
        // (Configured from Goal side via HasMany)

        // ── FK: ProjectId -> Projects CASCADE ──
        builder.HasOne(gpl => gpl.Project)
            .WithMany()
            .HasForeignKey(gpl => gpl.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
