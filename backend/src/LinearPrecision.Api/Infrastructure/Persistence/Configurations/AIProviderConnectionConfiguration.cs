using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class AIProviderConnectionConfiguration : IEntityTypeConfiguration<AIProviderConnection>
{
    public void Configure(EntityTypeBuilder<AIProviderConnection> builder)
    {
        builder.Property(connection => connection.ProviderName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(connection => connection.BaseUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(connection => connection.Model)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(connection => connection.ProtectedApiKey)
            .IsRequired()
            .HasColumnType("text");

        builder.HasIndex(connection => new { connection.WorkspaceId, connection.UserId })
            .IsUnique()
            .HasDatabaseName("ix_ai_provider_connections_workspace_id_user_id");

        builder.HasOne<Workspace>()
            .WithMany()
            .HasForeignKey(connection => connection.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(connection => connection.User)
            .WithMany()
            .HasForeignKey(connection => connection.UserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
