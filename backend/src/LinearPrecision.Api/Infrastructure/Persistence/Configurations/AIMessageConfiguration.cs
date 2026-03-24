using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class AIMessageConfiguration : IEntityTypeConfiguration<AIMessage>
{
    public void Configure(EntityTypeBuilder<AIMessage> builder)
    {
        // ── Property constraints ──
        builder.Property(m => m.Role)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(m => m.Content).IsRequired().HasColumnType("text");

        // ── Indexes ──
        builder.HasIndex(m => new { m.ConversationId, m.CreatedAt })
            .HasDatabaseName("ix_ai_messages_conversation_id_created_at");

        builder.HasIndex(m => m.WorkspaceId)
            .HasDatabaseName("ix_ai_messages_workspace_id");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(m => m.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: ConversationId -> AIConversations CASCADE ──
        builder.HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Navigation: ToolInvocations ──
        builder.HasMany(m => m.ToolInvocations)
            .WithOne(ti => ti.Message)
            .HasForeignKey(ti => ti.MessageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
