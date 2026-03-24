using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class ProjectTemplateConfiguration : IEntityTypeConfiguration<ProjectTemplate>
{
    public void Configure(EntityTypeBuilder<ProjectTemplate> builder)
    {
        // ── Property constraints ──
        builder.Property(pt => pt.Name).IsRequired().HasMaxLength(100);
        builder.Property(pt => pt.Description).HasMaxLength(500);
        builder.Property(pt => pt.IconUrl).HasMaxLength(2048);
        builder.Property(pt => pt.TemplateData).IsRequired().HasColumnType("jsonb");
        builder.Property(pt => pt.IsSystemTemplate).HasDefaultValue(false);

        // ── Indexes ──
        builder.HasIndex(pt => pt.WorkspaceId)
            .HasDatabaseName("ix_project_templates_workspace_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (TenantEntity FK configured centrally or via Workspace nav; explicit here for clarity)

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(pt => pt.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(pt => pt.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
