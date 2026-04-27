using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        // ── Property constraints ──
        builder.Property(p => p.Name).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Identifier).IsRequired().HasMaxLength(10);
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.Property(p => p.IconUrl).HasMaxLength(2048);
        builder.Property(p => p.Color).HasMaxLength(7);
        builder.Property(p => p.SortOrder).HasDefaultValue(0);
        builder.Property(p => p.Metadata).HasColumnType("jsonb");
        builder.Property(p => p.IsDeleted).HasDefaultValue(false);

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ProjectStatus.Active);

        builder.Property(p => p.Visibility)
            .HasConversion<string>()
            .HasMaxLength(20);

        // ── Indexes ──
        builder.HasIndex(p => new { p.WorkspaceId, p.Identifier })
            .IsUnique()
            .HasFilter("NOT is_deleted")
            .HasDatabaseName("ix_projects_workspace_id_identifier");

        builder.HasIndex(p => new { p.WorkspaceId, p.Status })
            .HasDatabaseName("ix_projects_workspace_id_status");

        builder.HasIndex(p => new { p.WorkspaceId, p.IsDeleted })
            .HasDatabaseName("ix_projects_workspace_id_is_deleted");

        builder.HasIndex(p => new { p.WorkspaceId, p.Name })
            .HasDatabaseName("ix_projects_workspace_id_name");

        builder.HasIndex(p => new { p.WorkspaceId, p.SortOrder })
            .HasDatabaseName("ix_projects_workspace_id_sort_order");

        builder.HasIndex(p => p.DeletedAt)
            .HasDatabaseName("ix_projects_deleted_at")
            .HasFilter("is_deleted = true");

        builder.HasIndex(p => p.LeadId)
            .HasDatabaseName("ix_projects_lead_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE (configured from Workspace side) ──

        // ── FK: LeadId -> Users SetNull ──
        builder.HasOne(p => p.Lead)
            .WithMany()
            .HasForeignKey(p => p.LeadId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: DeletedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(p => p.DeletedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(p => p.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(p => p.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Navigation collections ──
        builder.HasMany(p => p.Tasks)
            .WithOne(t => t.Project)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Sprints)
            .WithOne(s => s.Project)
            .HasForeignKey(s => s.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Documents)
            .WithOne(d => d.Project)
            .HasForeignKey(d => d.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.Favorites)
            .WithOne(f => f.Project)
            .HasForeignKey(f => f.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.GoalLinks)
            .WithOne(gl => gl.Project)
            .HasForeignKey(gl => gl.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
