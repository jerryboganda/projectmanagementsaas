using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class RequestSubmissionConfiguration : IEntityTypeConfiguration<RequestSubmission>
{
    public void Configure(EntityTypeBuilder<RequestSubmission> builder)
    {
        // ── Property constraints ──
        builder.Property(rs => rs.Data).HasColumnType("jsonb");

        builder.Property(rs => rs.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(Shared.Domain.Enums.SubmissionStatus.New);

        builder.Property(rs => rs.SubmitterEmail).HasMaxLength(254);
        builder.Property(rs => rs.ReviewNotes).HasMaxLength(2000);

        // ── Indexes ──
        builder.HasIndex(rs => new { rs.RequestFormId, rs.Status })
            .HasDatabaseName("ix_request_submissions_request_form_id_status");

        builder.HasIndex(rs => rs.WorkspaceId)
            .HasDatabaseName("ix_request_submissions_workspace_id");

        builder.HasIndex(rs => new { rs.WorkspaceId, rs.Status, rs.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("ix_request_submissions_workspace_id_status_created_at");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(rs => rs.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rs => rs.RequestForm)
            .WithMany(rf => rf.Submissions)
            .HasForeignKey(rs => rs.RequestFormId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(rs => rs.SubmitterUser)
            .WithMany()
            .HasForeignKey(rs => rs.SubmitterUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(rs => rs.ConvertedToTask)
            .WithMany()
            .HasForeignKey(rs => rs.ConvertedToTaskId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(rs => rs.ReviewedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
