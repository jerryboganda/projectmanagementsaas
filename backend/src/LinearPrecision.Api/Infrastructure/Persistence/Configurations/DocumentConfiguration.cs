using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        // ── Property constraints ──
        builder.Property(d => d.Title).IsRequired().HasMaxLength(200);
        builder.Property(d => d.Content).HasColumnType("text");
        builder.Property(d => d.ContentFormat).IsRequired().HasMaxLength(50).HasDefaultValue("tiptap-json");
        builder.Property(d => d.IsPublished).HasDefaultValue(false);
        builder.Property(d => d.SortOrder).HasDefaultValue(0);
        builder.Property(d => d.IsDeleted).HasDefaultValue(false);

        // ── Indexes ──
        builder.HasIndex(d => new { d.WorkspaceId, d.ProjectId })
            .HasDatabaseName("ix_documents_workspace_id_project_id");

        builder.HasIndex(d => new { d.WorkspaceId, d.ProjectId, d.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("ix_documents_workspace_id_project_id_created_at");

        builder.HasIndex(d => d.ParentDocumentId)
            .HasDatabaseName("ix_documents_parent_document_id");

        builder.HasIndex(d => new { d.ParentDocumentId, d.IsDeleted, d.SortOrder })
            .HasDatabaseName("ix_documents_parent_document_id_is_deleted_sort_order");

        builder.HasIndex(d => new { d.WorkspaceId, d.IsDeleted })
            .HasDatabaseName("ix_documents_workspace_id_is_deleted");

        builder.HasIndex(d => d.DeletedAt)
            .HasDatabaseName("ix_documents_deleted_at")
            .HasFilter("is_deleted = true");

        // ── Foreign keys ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(d => d.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Project)
            .WithMany()
            .HasForeignKey(d => d.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(d => d.ParentDocument)
            .WithMany(d => d.ChildDocuments)
            .HasForeignKey(d => d.ParentDocumentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(d => d.Creator)
            .WithMany()
            .HasForeignKey(d => d.CreatorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(d => d.DeletedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(d => d.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(d => d.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
