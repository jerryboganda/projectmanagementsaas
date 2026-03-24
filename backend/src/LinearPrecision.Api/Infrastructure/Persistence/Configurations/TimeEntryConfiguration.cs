using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class TimeEntryConfiguration : IEntityTypeConfiguration<TimeEntry>
{
    public void Configure(EntityTypeBuilder<TimeEntry> builder)
    {
        // ── Property constraints ──
        builder.Property(te => te.Description).HasMaxLength(500);
        builder.Property(te => te.DurationMinutes).HasDefaultValue(0);
        builder.Property(te => te.IsBillable).HasDefaultValue(false);
        builder.Property(te => te.HourlyRate).HasPrecision(10, 2);

        // ── Indexes ──
        builder.HasIndex(te => new { te.WorkspaceId, te.UserId, te.StartTime })
            .HasDatabaseName("ix_time_entries_workspace_id_user_id_start_time");

        builder.HasIndex(te => new { te.WorkspaceId, te.TaskId })
            .HasDatabaseName("ix_time_entries_workspace_id_task_id");

        builder.HasIndex(te => new { te.WorkspaceId, te.ProjectId })
            .HasDatabaseName("ix_time_entries_workspace_id_project_id");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(te => te.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(te => te.User)
            .WithMany()
            .HasForeignKey(te => te.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(te => te.Task)
            .WithMany()
            .HasForeignKey(te => te.TaskId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(te => te.Project)
            .WithMany()
            .HasForeignKey(te => te.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(te => te.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(te => te.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
