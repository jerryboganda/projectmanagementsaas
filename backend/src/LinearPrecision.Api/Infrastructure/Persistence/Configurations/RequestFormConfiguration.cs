using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class RequestFormConfiguration : IEntityTypeConfiguration<RequestForm>
{
    public void Configure(EntityTypeBuilder<RequestForm> builder)
    {
        // ── Property constraints ──
        builder.Property(rf => rf.Title).IsRequired().HasMaxLength(100);
        builder.Property(rf => rf.Description).HasMaxLength(500);
        builder.Property(rf => rf.Slug).IsRequired().HasMaxLength(50);
        builder.Property(rf => rf.IsActive).HasDefaultValue(true);
        builder.Property(rf => rf.IsPublic).HasDefaultValue(false);
        builder.Property(rf => rf.FormSchema).HasColumnType("jsonb");

        // ── Indexes ──
        builder.HasIndex(rf => new { rf.WorkspaceId, rf.Slug })
            .IsUnique()
            .HasDatabaseName("ix_request_forms_workspace_id_slug");

        builder.HasIndex(rf => new { rf.WorkspaceId, rf.IsActive })
            .HasDatabaseName("ix_request_forms_workspace_id_is_active");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(rf => rf.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rf => rf.DefaultProject)
            .WithMany()
            .HasForeignKey(rf => rf.DefaultProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(rf => rf.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(rf => rf.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Navigation collection ──
        builder.HasMany(rf => rf.Submissions)
            .WithOne(rs => rs.RequestForm)
            .HasForeignKey(rs => rs.RequestFormId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
