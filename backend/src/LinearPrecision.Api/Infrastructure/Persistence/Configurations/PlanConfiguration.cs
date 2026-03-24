using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> builder)
    {
        // ── Property constraints ──
        builder.Property(p => p.Name).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Slug).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Description).HasMaxLength(500);
        builder.Property(p => p.MonthlyPricePerSeat).HasPrecision(10, 2);
        builder.Property(p => p.AnnualPricePerSeat).HasPrecision(10, 2);
        builder.Property(p => p.StripePriceIdMonthly).HasMaxLength(100);
        builder.Property(p => p.StripePriceIdAnnual).HasMaxLength(100);
        builder.Property(p => p.MaxMembers).HasDefaultValue(-1);
        builder.Property(p => p.MaxProjects).HasDefaultValue(-1);
        builder.Property(p => p.MaxStorageBytes).HasDefaultValue(-1L);
        builder.Property(p => p.MaxAutomations).HasDefaultValue(-1);
        builder.Property(p => p.Features).HasColumnType("jsonb");
        builder.Property(p => p.IsActive).HasDefaultValue(true);
        builder.Property(p => p.SortOrder).HasDefaultValue(0);

        // ── Indexes ──
        builder.HasIndex(p => p.Name)
            .IsUnique()
            .HasDatabaseName("ix_plans_name");

        builder.HasIndex(p => p.IsActive)
            .HasDatabaseName("ix_plans_is_active");
    }
}
