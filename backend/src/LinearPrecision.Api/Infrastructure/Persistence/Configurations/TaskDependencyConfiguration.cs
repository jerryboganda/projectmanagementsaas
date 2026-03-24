using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class TaskDependencyConfiguration : IEntityTypeConfiguration<TaskDependency>
{
    public void Configure(EntityTypeBuilder<TaskDependency> builder)
    {
        // ── Property constraints ──
        builder.Property(td => td.Type)
            .HasConversion<string>()
            .HasMaxLength(30);

        // ── Indexes ──
        builder.HasIndex(td => new { td.TaskId, td.DependsOnTaskId })
            .IsUnique()
            .HasDatabaseName("ix_task_dependencies_task_id_depends_on_task_id");

        builder.HasIndex(td => td.DependsOnTaskId)
            .HasDatabaseName("ix_task_dependencies_depends_on_task_id");

        builder.HasIndex(td => td.WorkspaceId)
            .HasDatabaseName("ix_task_dependencies_workspace_id");

        // ── Check constraint: no self-dependency ──
        builder.ToTable(t => t.HasCheckConstraint(
            "chk_no_self_dependency",
            "task_id <> depends_on_task_id"));

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        // (Configured from Workspace side or by convention)

        // ── FK: TaskId -> TaskItems CASCADE ──
        builder.HasOne(td => td.Task)
            .WithMany(t => t.DependsOn)
            .HasForeignKey(td => td.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: DependsOnTaskId -> TaskItems CASCADE ──
        builder.HasOne(td => td.DependsOnTask)
            .WithMany(t => t.DependedOnBy)
            .HasForeignKey(td => td.DependsOnTaskId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
