using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class AIConversationConfiguration : IEntityTypeConfiguration<AIConversation>
{
    public void Configure(EntityTypeBuilder<AIConversation> builder)
    {
        // ── Property constraints ──
        builder.Property(c => c.Title).HasMaxLength(200);
        builder.Property(c => c.Model).IsRequired().HasMaxLength(50);
        builder.Property(c => c.MessageCount).HasDefaultValue(0);
        builder.Property(c => c.TotalTokensUsed).HasDefaultValue(0);

        // ── Indexes ──
        builder.HasIndex(c => new { c.WorkspaceId, c.UserId, c.CreatedAt })
            .IsDescending(false, false, true)
            .HasDatabaseName("ix_ai_conversations_workspace_id_user_id_created_at");

        // ── FK: WorkspaceId -> Workspaces CASCADE ──
        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(c => c.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── FK: UserId -> Users Restrict/NoAction ──
        builder.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        // ── Navigation: Messages ──
        builder.HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
