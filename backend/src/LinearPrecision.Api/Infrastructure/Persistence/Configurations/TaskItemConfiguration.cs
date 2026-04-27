using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        // ── Property constraints ──
        builder.Property(t => t.Title).IsRequired().HasMaxLength(500);
        builder.Property(t => t.Description).HasColumnType("text");
        builder.Property(t => t.Identifier).IsRequired().HasMaxLength(20);
        builder.Property(t => t.TaskType).HasMaxLength(50);
        builder.Property(t => t.Labels).HasColumnType("jsonb");
        builder.Property(t => t.CustomFields).HasColumnType("jsonb");
        builder.Property(t => t.SortOrder).HasDefaultValue(0);
        builder.Property(t => t.IsDeleted).HasDefaultValue(false);
        builder.Property(t => t.EstimateHours).HasPrecision(8, 2);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(t => t.Priority)
            .HasConversion<string>()
            .HasMaxLength(20);

        // ── Indexes ──
        builder.HasIndex(t => new { t.WorkspaceId, t.Identifier })
            .IsUnique()
            .HasDatabaseName("ix_task_items_workspace_id_identifier");

        builder.HasIndex(t => new { t.WorkspaceId, t.ProjectId, t.Status })
            .HasDatabaseName("ix_task_items_workspace_id_project_id_status");

        builder.HasIndex(t => new { t.WorkspaceId, t.AssigneeId })
            .HasDatabaseName("ix_task_items_workspace_id_assignee_id");

        builder.HasIndex(t => new { t.WorkspaceId, t.SprintId })
            .HasDatabaseName("ix_task_items_workspace_id_sprint_id");

        builder.HasIndex(t => new { t.WorkspaceId, t.DueDate })
            .HasDatabaseName("ix_task_items_workspace_id_due_date");

        builder.HasIndex(t => new { t.WorkspaceId, t.IsDeleted })
            .HasDatabaseName("ix_task_items_workspace_id_is_deleted");

        builder.HasIndex(t => t.ParentTaskId)
            .HasDatabaseName("ix_task_items_parent_task_id");

        builder.HasIndex(t => new { t.WorkspaceId, t.ProjectId, t.SortOrder })
            .HasDatabaseName("ix_task_items_workspace_id_project_id_sort_order");

        builder.HasIndex(t => t.DeletedAt)
            .HasDatabaseName("ix_task_items_deleted_at")
            .HasFilter("is_deleted = true");

        // Hot-order indexes for task listings and feeds
        builder.HasIndex(t => new { t.WorkspaceId, t.ProjectId, t.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("ix_task_items_workspace_id_project_id_created_at");

        builder.HasIndex(t => new { t.WorkspaceId, t.AssigneeId, t.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("ix_task_items_workspace_id_assignee_id_created_at");

        // ── FK: WorkspaceId -> Workspaces CASCADE (configured from Workspace side) ──

        // ── FK: ProjectId -> Projects CASCADE ──
        builder.HasOne(t => t.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: AssigneeId -> Users SetNull ──
        builder.HasOne(t => t.Assignee)
            .WithMany()
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: CreatorId -> Users SetNull ──
        builder.HasOne(t => t.Creator)
            .WithMany()
            .HasForeignKey(t => t.CreatorId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: SprintId -> Sprints SetNull ──
        builder.HasOne(t => t.Sprint)
            .WithMany(s => s.Tasks)
            .HasForeignKey(t => t.SprintId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: ParentTaskId -> TaskItems SetNull (self-ref) ──
        builder.HasOne(t => t.ParentTask)
            .WithMany(t => t.SubTasks)
            .HasForeignKey(t => t.ParentTaskId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: DeletedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(t => t.DeletedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(t => t.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(t => t.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Collection navigations ──
        builder.HasMany(t => t.Comments)
            .WithOne(c => c.Task)
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.ChecklistItems)
            .WithOne(c => c.Task)
            .HasForeignKey(c => c.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Watchers)
            .WithOne(w => w.Task)
            .HasForeignKey(w => w.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.DependsOn)
            .WithOne(d => d.Task)
            .HasForeignKey(d => d.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.DependedOnBy)
            .WithOne(d => d.DependsOnTask)
            .HasForeignKey(d => d.DependsOnTaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Attachments)
            .WithOne(a => a.Task)
            .HasForeignKey(a => a.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.TimeEntries)
            .WithOne(te => te.Task)
            .HasForeignKey(te => te.TaskId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
