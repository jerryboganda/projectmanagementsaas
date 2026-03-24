using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class CalendarItemConfiguration : IEntityTypeConfiguration<CalendarItem>
{
    public void Configure(EntityTypeBuilder<CalendarItem> builder)
    {
        // ── Property constraints ──
        builder.Property(ci => ci.Title).IsRequired().HasMaxLength(200);
        builder.Property(ci => ci.Description).HasMaxLength(2000);
        builder.Property(ci => ci.Color).HasMaxLength(7);
        builder.Property(ci => ci.RecurrenceRule).HasMaxLength(500);
        builder.Property(ci => ci.IsAllDay).HasDefaultValue(false);

        builder.Property(ci => ci.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        // ── Indexes ──
        builder.HasIndex(ci => new { ci.WorkspaceId, ci.StartTime, ci.EndTime })
            .HasDatabaseName("ix_calendar_items_workspace_id_start_time_end_time");

        builder.HasIndex(ci => new { ci.WorkspaceId, ci.CreatorId })
            .HasDatabaseName("ix_calendar_items_workspace_id_creator_id");

        builder.HasIndex(ci => ci.LinkedTaskId)
            .HasDatabaseName("ix_calendar_items_linked_task_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE (TenantEntity) ──

        // ── FK: LinkedProjectId -> Projects SetNull ──
        builder.HasOne<Project>()
            .WithMany()
            .HasForeignKey(ci => ci.LinkedProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: LinkedTaskId -> TaskItems SetNull ──
        builder.HasOne<TaskItem>()
            .WithMany()
            .HasForeignKey(ci => ci.LinkedTaskId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: CreatorId -> Users Restrict/NoAction ──
        builder.HasOne(ci => ci.Creator)
            .WithMany()
            .HasForeignKey(ci => ci.CreatorId)
            .OnDelete(DeleteBehavior.NoAction);

        // ── FK: CreatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(ci => ci.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // ── FK: UpdatedBy -> Users SetNull ──
        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(ci => ci.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
