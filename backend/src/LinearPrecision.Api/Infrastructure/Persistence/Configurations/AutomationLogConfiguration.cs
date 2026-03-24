using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class AutomationLogConfiguration : IEntityTypeConfiguration<AutomationLog>
{
    public void Configure(EntityTypeBuilder<AutomationLog> builder)
    {
        // ── Property constraints ──
        builder.Property(al => al.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(Shared.Domain.Enums.AutomationLogStatus.Success);

        builder.Property(al => al.TriggerData).HasColumnType("text");
        builder.Property(al => al.ActionResult).HasColumnType("text");
        builder.Property(al => al.ErrorMessage).HasColumnType("text");

        builder.Property(al => al.ExecutionDuration)
            .HasConversion(
                v => (int)v.TotalMilliseconds,
                v => TimeSpan.FromMilliseconds((double)v))
            .HasColumnType("integer");

        // ── Indexes ──
        builder.HasIndex(al => new { al.AutomationRuleId, al.CreatedAt })
            .IsDescending(false, true)
            .HasDatabaseName("ix_automation_logs_automation_rule_id_created_at");

        builder.HasIndex(al => al.WorkspaceId)
            .HasDatabaseName("ix_automation_logs_workspace_id");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(al => al.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(al => al.AutomationRule)
            .WithMany()
            .HasForeignKey(al => al.AutomationRuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
