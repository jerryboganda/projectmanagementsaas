using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class TaskWatcherConfiguration : IEntityTypeConfiguration<TaskWatcher>
{
    public void Configure(EntityTypeBuilder<TaskWatcher> builder)
    {
        // ── Indexes ──
        builder.HasIndex(tw => new { tw.TaskId, tw.UserId })
            .IsUnique()
            .HasDatabaseName("ix_task_watchers_task_id_user_id");

        builder.HasIndex(tw => tw.WorkspaceId)
            .HasDatabaseName("ix_task_watchers_workspace_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (Configured from Workspace side or by convention)

        // ── FK: TaskId -> TaskItems CASCADE ──
        // (Configured from TaskItem side via HasMany)

        // ── FK: UserId -> Users CASCADE ──
        builder.HasOne(tw => tw.User)
            .WithMany()
            .HasForeignKey(tw => tw.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
