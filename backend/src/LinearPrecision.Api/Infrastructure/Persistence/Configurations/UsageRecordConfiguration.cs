using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class UsageRecordConfiguration : IEntityTypeConfiguration<UsageRecord>
{
    public void Configure(EntityTypeBuilder<UsageRecord> builder)
    {
        // ── Property constraints ──
        builder.Property(ur => ur.MetricName).IsRequired().HasMaxLength(50);
        builder.Property(ur => ur.Period).IsRequired().HasMaxLength(20);

        // ── Indexes ──
        builder.HasIndex(ur => new { ur.WorkspaceId, ur.MetricName, ur.Period })
            .HasDatabaseName("ix_usage_records_workspace_id_metric_name_period");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(ur => ur.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
