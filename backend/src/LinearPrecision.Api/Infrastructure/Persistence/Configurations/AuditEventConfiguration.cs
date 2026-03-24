using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class AuditEventConfiguration : IEntityTypeConfiguration<AuditEvent>
{
    public void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        // ── Property constraints ──
        builder.Property(ae => ae.Action).IsRequired().HasMaxLength(50);
        builder.Property(ae => ae.EntityType).IsRequired().HasMaxLength(50);
        builder.Property(ae => ae.OldValues).HasColumnType("jsonb");
        builder.Property(ae => ae.NewValues).HasColumnType("jsonb");
        builder.Property(ae => ae.IpAddress).HasMaxLength(45);
        builder.Property(ae => ae.UserAgent).HasMaxLength(500);

        // ── Indexes ──
        builder.HasIndex(ae => new { ae.WorkspaceId, ae.EntityType, ae.EntityId })
            .HasDatabaseName("ix_audit_events_workspace_id_entity_type_entity_id");

        builder.HasIndex(ae => new { ae.WorkspaceId, ae.ActorId, ae.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("ix_audit_events_workspace_id_actor_id_created_at");

        builder.HasIndex(ae => ae.CreatedAt)
            .HasDatabaseName("ix_audit_events_created_at");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(ae => ae.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: ActorId -> Users SetNull ──
        builder.HasOne(ae => ae.Actor)
            .WithMany()
            .HasForeignKey(ae => ae.ActorId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
