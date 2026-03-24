using System.Text.Json;
using LinearPrecision.Api.Infrastructure.Auth;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Shared.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LinearPrecision.Worker.Tests;

/// <summary>
/// Creates an in-memory AppDbContext for unit testing Worker jobs.
/// Worker ITenantContext has null WorkspaceId; jobs use IgnoreQueryFilters().
/// Configures JsonDocument value converters for InMemory compatibility.
/// </summary>
public static class TestDbContextFactory
{
    public static TestAppDbContext Create(string? dbName = null)
    {
        dbName ??= Guid.NewGuid().ToString();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        // Worker uses a null-workspace tenant context (cross-tenant access)
        ITenantContext tenantContext = new TenantContext();

        return new TestAppDbContext(options, tenantContext);
    }
}

/// <summary>
/// AppDbContext subclass that adds JsonDocument-to-string value converters
/// so the InMemory provider can handle jsonb columns used in production with Npgsql.
/// </summary>
public class TestAppDbContext : AppDbContext
{
    public TestAppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options, tenantContext)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // InMemory provider doesn't support JsonDocument natively.
        // Add a value converter for every JsonDocument property in the model.
        var jsonDocConverter = new ValueConverter<JsonDocument, string>(
            v => v.RootElement.GetRawText(),
            v => JsonDocument.Parse(v, default));

        // JsonDocument is a reference type, so typeof(JsonDocument?) == typeof(JsonDocument).
        // We apply the same converter to all JsonDocument properties (nullable or not).
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(JsonDocument))
                {
                    property.SetValueConverter(jsonDocConverter);
                }
            }
        }
    }
}
