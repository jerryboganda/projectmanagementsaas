using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class WorkspaceConfiguration : IEntityTypeConfiguration<Workspace>
{
    public void Configure(EntityTypeBuilder<Workspace> builder)
    {
        // ── Property constraints ──
        builder.Property(w => w.Name).IsRequired().HasMaxLength(100);
        builder.Property(w => w.Slug).IsRequired().HasMaxLength(50);
        builder.Property(w => w.Description).HasMaxLength(500);
        builder.Property(w => w.LogoUrl).HasMaxLength(2048);
        builder.Property(w => w.Domain).HasMaxLength(253);
        builder.Property(w => w.Settings).HasColumnType("jsonb");
        builder.Property(w => w.IsDeleted).HasDefaultValue(false);

        // ── Indexes ──
        builder.HasIndex(w => w.Slug)
            .IsUnique()
            .HasFilter("NOT is_deleted")
            .HasDatabaseName("ix_workspaces_slug");

        builder.HasIndex(w => w.IsDeleted)
            .HasDatabaseName("ix_workspaces_is_deleted");

        builder.HasIndex(w => w.CreatedAt)
            .IsDescending()
            .HasDatabaseName("ix_workspaces_created_at");

        // ── FK: Subscription (one-to-one) ──
        builder.HasOne(w => w.Subscription)
            .WithOne(s => s.Workspace)
            .HasForeignKey<Subscription>(s => s.WorkspaceId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: DeletedBy, CreatedBy, UpdatedBy -> Users ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(w => w.DeletedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(w => w.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(w => w.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Navigation collections ──
        builder.HasMany(w => w.Memberships)
            .WithOne()
            .HasForeignKey(m => m.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Projects)
            .WithOne()
            .HasForeignKey(p => p.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Invitations)
            .WithOne()
            .HasForeignKey(i => i.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.Goals)
            .WithOne()
            .HasForeignKey(g => g.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
