using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // ── Property constraints ──
        builder.Property(u => u.FullName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.DisplayName).HasMaxLength(50);
        builder.Property(u => u.AvatarUrl).HasMaxLength(2048);
        builder.Property(u => u.Timezone).HasMaxLength(50);
        builder.Property(u => u.Locale).HasMaxLength(10);
        builder.Property(u => u.JobTitle).HasMaxLength(100);
        builder.Property(u => u.IsActive).HasDefaultValue(true);
        builder.Property(u => u.LastActiveWorkspaceId).IsRequired(false);
        builder.Property(u => u.LastLoginIp).HasMaxLength(45);

        // ── Navigation: Memberships ──
        builder.HasMany(u => u.Memberships)
            .WithOne(m => m.User)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Navigation: Comments ──
        builder.HasMany(u => u.Comments)
            .WithOne(c => c.Author)
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── Navigation: TimeEntries ──
        builder.HasMany(u => u.TimeEntries)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
