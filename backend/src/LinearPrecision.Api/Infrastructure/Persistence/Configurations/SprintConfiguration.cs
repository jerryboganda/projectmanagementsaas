using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class SprintConfiguration : IEntityTypeConfiguration<Sprint>
{
    public void Configure(EntityTypeBuilder<Sprint> builder)
    {
        // ── Property constraints ──
        builder.Property(s => s.Name).IsRequired().HasMaxLength(100);
        builder.Property(s => s.Goal).HasMaxLength(500);

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(SprintStatus.Planned);

        // ── Indexes ──
        builder.HasIndex(s => new { s.WorkspaceId, s.ProjectId, s.Status })
            .HasDatabaseName("ix_sprints_workspace_id_project_id_status");

        builder.HasIndex(s => new { s.WorkspaceId, s.Status })
            .HasDatabaseName("ix_sprints_workspace_id_status");

        // Partial unique: at most one Active sprint per project
        builder.HasIndex(s => s.ProjectId)
            .IsUnique()
            .HasFilter("status = 'Active'")
            .HasDatabaseName("ix_sprints_project_id_active");

        // ── Check constraint: EndDate > StartDate ──
        builder.ToTable(t => t.HasCheckConstraint("chk_sprint_dates", "end_date > start_date"));

        // ── FK: WorkspaceId -> Workspaces CASCADE (TenantEntity) ──

        // ── FK: ProjectId -> Projects CASCADE ──
        builder.HasOne(s => s.Project)
            .WithMany(p => p.Sprints)
            .HasForeignKey(s => s.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(s => s.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(s => s.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Navigation: Tasks ──
        builder.HasMany(s => s.Tasks)
            .WithOne(t => t.Sprint)
            .HasForeignKey(t => t.SprintId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
