using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class InitiativeMilestoneConfiguration : IEntityTypeConfiguration<InitiativeMilestone>
{
    public void Configure(EntityTypeBuilder<InitiativeMilestone> builder)
    {
        // ── Property constraints ──
        builder.Property(m => m.Title).IsRequired().HasMaxLength(200);
        builder.Property(m => m.IsCompleted).HasDefaultValue(false);
        builder.Property(m => m.SortOrder).HasDefaultValue(0);

        // ── Indexes ──
        builder.HasIndex(m => new { m.InitiativeId, m.SortOrder })
            .HasDatabaseName("ix_initiative_milestones_initiative_id_sort_order");

        builder.HasIndex(m => m.WorkspaceId)
            .HasDatabaseName("ix_initiative_milestones_workspace_id");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(m => m.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Initiative)
            .WithMany(i => i.Milestones)
            .HasForeignKey(m => m.InitiativeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
