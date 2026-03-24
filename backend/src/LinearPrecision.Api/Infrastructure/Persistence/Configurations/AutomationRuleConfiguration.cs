using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class AutomationRuleConfiguration : IEntityTypeConfiguration<AutomationRule>
{
    public void Configure(EntityTypeBuilder<AutomationRule> builder)
    {
        // ── Property constraints ──
        builder.Property(ar => ar.Name).IsRequired().HasMaxLength(100);
        builder.Property(ar => ar.Description).HasMaxLength(500);
        builder.Property(ar => ar.IsActive).HasDefaultValue(true);
        builder.Property(ar => ar.Trigger).HasColumnType("jsonb");
        builder.Property(ar => ar.Action).HasColumnType("jsonb");
        builder.Property(ar => ar.ExecutionCount).HasDefaultValue(0);

        // ── Indexes ──
        builder.HasIndex(ar => new { ar.WorkspaceId, ar.IsActive })
            .HasDatabaseName("ix_automation_rules_workspace_id_is_active");

        builder.HasIndex(ar => new { ar.WorkspaceId, ar.ProjectId })
            .HasDatabaseName("ix_automation_rules_workspace_id_project_id");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(ar => ar.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ar => ar.Project)
            .WithMany()
            .HasForeignKey(ar => ar.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(ar => ar.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(ar => ar.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
