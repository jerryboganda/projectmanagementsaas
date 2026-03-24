using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class TaskCommentConfiguration : IEntityTypeConfiguration<TaskComment>
{
    public void Configure(EntityTypeBuilder<TaskComment> builder)
    {
        // ── Property constraints ──
        builder.Property(c => c.Body).IsRequired().HasColumnType("text");
        builder.Property(c => c.IsEdited).HasDefaultValue(false);
        builder.Property(c => c.Reactions).HasColumnType("jsonb");
        builder.Property(c => c.IsDeleted).HasDefaultValue(false);

        // ── Indexes ──
        builder.HasIndex(c => new { c.TaskId, c.CreatedAt })
            .HasDatabaseName("ix_task_comments_task_id_created_at");

        builder.HasIndex(c => c.ParentCommentId)
            .HasDatabaseName("ix_task_comments_parent_comment_id");

        builder.HasIndex(c => c.WorkspaceId)
            .HasDatabaseName("ix_task_comments_workspace_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (Configured from Workspace side or by convention)

        // ── FK: TaskId -> TaskItems CASCADE ──
        // (Configured from TaskItem side via HasMany)

        // ── FK: AuthorId -> Users Restrict ──
        builder.HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // ── FK: ParentCommentId -> TaskComments CASCADE (self-ref) ──
        builder.HasOne(c => c.ParentComment)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: DeletedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(c => c.DeletedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(c => c.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(c => c.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
