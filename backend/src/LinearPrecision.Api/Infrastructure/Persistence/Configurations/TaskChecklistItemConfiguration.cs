using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class TaskChecklistItemConfiguration : IEntityTypeConfiguration<TaskChecklistItem>
{
    public void Configure(EntityTypeBuilder<TaskChecklistItem> builder)
    {
        // ── Property constraints ──
        builder.Property(ci => ci.Title).IsRequired().HasMaxLength(500);
        builder.Property(ci => ci.IsCompleted).HasDefaultValue(false);
        builder.Property(ci => ci.SortOrder).HasDefaultValue(0);

        // ── Indexes ──
        builder.HasIndex(ci => new { ci.TaskId, ci.SortOrder })
            .HasDatabaseName("ix_task_checklist_items_task_id_sort_order");

        builder.HasIndex(ci => ci.WorkspaceId)
            .HasDatabaseName("ix_task_checklist_items_workspace_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (Configured from Workspace side or by convention)

        // ── FK: TaskId -> TaskItems CASCADE ──
        // (Configured from TaskItem side via HasMany)

        // ── FK: CompletedBy -> Users SetNull (bare FK, no navigation) ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(ci => ci.CompletedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
