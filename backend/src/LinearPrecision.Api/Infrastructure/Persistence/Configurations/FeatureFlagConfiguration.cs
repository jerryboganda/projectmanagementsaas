using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class FeatureFlagConfiguration : IEntityTypeConfiguration<FeatureFlag>
{
    public void Configure(EntityTypeBuilder<FeatureFlag> builder)
    {
        // ── Property constraints ──
        builder.Property(ff => ff.Key).IsRequired().HasMaxLength(100);
        builder.Property(ff => ff.Description).HasMaxLength(500);
        builder.Property(ff => ff.IsEnabled).HasDefaultValue(false);
        builder.Property(ff => ff.Conditions).HasColumnType("jsonb");

        // ── Indexes ──
        builder.HasIndex(ff => ff.Key)
            .IsUnique()
            .HasDatabaseName("ix_feature_flags_key");

        // ── FK: WorkspaceId -> Workspaces SetNull ──
        builder.HasOne(ff => ff.Workspace)
            .WithMany()
            .HasForeignKey(ff => ff.WorkspaceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
