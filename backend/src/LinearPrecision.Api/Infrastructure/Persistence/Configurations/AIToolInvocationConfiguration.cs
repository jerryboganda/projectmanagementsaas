using LinearPrecision.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LinearPrecision.Api.Infrastructure.Persistence.Configurations;

public sealed class AIToolInvocationConfiguration : IEntityTypeConfiguration<AIToolInvocation>
{
    public void Configure(EntityTypeBuilder<AIToolInvocation> builder)
    {
        builder.Property(ti => ti.ToolName).IsRequired().HasMaxLength(100);
        builder.Property(ti => ti.Input).HasColumnType("jsonb");
        builder.Property(ti => ti.Output).HasColumnType("jsonb");

        builder.Property(ti => ti.Status)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}
