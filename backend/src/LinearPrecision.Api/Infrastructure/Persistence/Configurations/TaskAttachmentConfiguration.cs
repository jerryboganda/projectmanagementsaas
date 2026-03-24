using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class TaskAttachmentConfiguration : IEntityTypeConfiguration<TaskAttachment>
{
    public void Configure(EntityTypeBuilder<TaskAttachment> builder)
    {
        // ── Indexes ──
        builder.HasIndex(ta => ta.TaskId)
            .HasDatabaseName("ix_task_attachments_task_id");

        builder.HasIndex(ta => ta.FileAttachmentId)
            .HasDatabaseName("ix_task_attachments_file_attachment_id");

        builder.HasIndex(ta => ta.WorkspaceId)
            .HasDatabaseName("ix_task_attachments_workspace_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (Configured from Workspace side or by convention)

        // ── FK: TaskId -> TaskItems CASCADE ──
        // (Configured from TaskItem side via HasMany)

        // ── FK: FileAttachmentId -> FileAttachments CASCADE ──
        builder.HasOne(ta => ta.FileAttachment)
            .WithMany()
            .HasForeignKey(ta => ta.FileAttachmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: UploadedBy -> Users Restrict ──
        builder.HasOne(ta => ta.Uploader)
            .WithMany()
            .HasForeignKey(ta => ta.UploadedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
