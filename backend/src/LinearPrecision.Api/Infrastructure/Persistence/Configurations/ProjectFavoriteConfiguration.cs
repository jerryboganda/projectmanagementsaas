using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class ProjectFavoriteConfiguration : IEntityTypeConfiguration<ProjectFavorite>
{
    public void Configure(EntityTypeBuilder<ProjectFavorite> builder)
    {
        // ── Property constraints ──
        builder.Property(f => f.SortOrder).HasDefaultValue(0);

        // ── Indexes ──
        builder.HasIndex(f => new { f.WorkspaceId, f.ProjectId, f.UserId })
            .IsUnique()
            .HasDatabaseName("ix_project_favorites_workspace_id_project_id_user_id");

        builder.HasIndex(f => new { f.UserId, f.SortOrder })
            .HasDatabaseName("ix_project_favorites_user_id_sort_order");

        // ── FK: WorkspaceId -> Workspaces CASCADE (configured from Workspace side via Projects) ──

        // ── FK: ProjectId -> Projects CASCADE (configured from Project side) ──

        // ── FK: UserId -> Users CASCADE ──
        builder.HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
