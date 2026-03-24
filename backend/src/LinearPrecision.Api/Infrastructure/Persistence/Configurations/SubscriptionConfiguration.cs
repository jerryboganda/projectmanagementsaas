using LinearPrecision.Api.Entities;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        // ── Property constraints ──
        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(s => s.StripeCustomerId).HasMaxLength(100);
        builder.Property(s => s.StripeSubscriptionId).HasMaxLength(100);

        // ── Indexes ──
        builder.HasIndex(s => s.WorkspaceId)
            .IsUnique()
            .HasDatabaseName("ix_subscriptions_workspace_id");

        builder.HasIndex(s => s.StripeCustomerId)
            .HasDatabaseName("ix_subscriptions_stripe_customer_id");

        builder.HasIndex(s => s.StripeSubscriptionId)
            .HasDatabaseName("ix_subscriptions_stripe_subscription_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        builder.HasOne(s => s.Workspace)
            .WithOne()
            .HasForeignKey<Subscription>(s => s.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: PlanId -> Plans Restrict/NoAction ──
        builder.HasOne(s => s.Plan)
            .WithMany()
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
