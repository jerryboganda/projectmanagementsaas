using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class FileAttachmentConfiguration : IEntityTypeConfiguration<FileAttachment>
{
    public void Configure(EntityTypeBuilder<FileAttachment> builder)
    {
        // ── Property constraints ──
        builder.Property(fa => fa.FileName).IsRequired().HasMaxLength(255);
        builder.Property(fa => fa.StorageKey).IsRequired().HasMaxLength(500);
        builder.Property(fa => fa.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(fa => fa.ThumbnailKey).HasMaxLength(500);

        // ── Indexes ──
        builder.HasIndex(fa => new { fa.WorkspaceId, fa.UploadedBy })
            .HasDatabaseName("ix_file_attachments_workspace_id_uploaded_by");

        builder.HasIndex(fa => fa.StorageKey)
            .HasDatabaseName("ix_file_attachments_storage_key");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(fa => fa.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: UploadedBy -> Users Restrict/NoAction ──
        builder.HasOne(fa => fa.Uploader)
            .WithMany()
            .HasForeignKey(fa => fa.UploadedBy)
            .OnDelete(DeleteBehavior.NoAction);

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(fa => fa.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(fa => fa.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
