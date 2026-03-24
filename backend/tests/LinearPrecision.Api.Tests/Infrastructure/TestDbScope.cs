using System.Text.Json;
using LinearPrecision.Api.Entities;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Api.Infrastructure.Persistence.Interceptors;
using LinearPrecision.Shared.Contracts;
using LinearPrecision.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace LinearPrecision.Api.Tests.Infrastructure;

internal sealed class TestTenantContext : ITenantContext
{
    public Guid? WorkspaceId { get; set; }
}

internal sealed class TestCurrentUser : ICurrentUser
{
    public TestCurrentUser(Guid userId, string fullName = "Test User", string email = "test@linearprecision.dev")
    {
        UserId = userId;
        FullName = fullName;
        Email = email;
    }

    public Guid? UserId { get; }
    public string? Email { get; }
    public string? FullName { get; }
    public bool IsAuthenticated => true;
    public IReadOnlyList<string> Roles { get; } = [];
}

internal sealed class TestDbScope : IAsyncDisposable
{
    public TestDbScope(
        AppDbContext context,
        TestTenantContext tenantContext,
        TestCurrentUser currentUser)
    {
        Context = context;
        TenantContext = tenantContext;
        CurrentUser = currentUser;
    }

    public AppDbContext Context { get; }
    public TestTenantContext TenantContext { get; }
    public TestCurrentUser CurrentUser { get; }

    public async ValueTask DisposeAsync()
    {
        await Context.DisposeAsync();
    }
}

internal static class TestDbFactory
{
    public static async Task<TestDbScope> CreateAsync(Guid workspaceId, Guid userId)
    {
        var databaseRoot = new InMemoryDatabaseRoot();
        var databaseName = $"linearprecision-api-tests-{workspaceId:N}-{userId:N}";

        var tenantContext = new TestTenantContext { WorkspaceId = workspaceId };
        var currentUser = new TestCurrentUser(userId);

        var seedOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName, databaseRoot)
            .Options;

        await using (var seedContext = new AppDbContext(seedOptions, tenantContext))
        {
            await seedContext.Database.EnsureCreatedAsync();

            var now = DateTime.UtcNow;
            var user = new User
            {
                Id = userId,
                Email = currentUser.Email,
                NormalizedEmail = currentUser.Email!.ToUpperInvariant(),
                UserName = currentUser.Email,
                NormalizedUserName = currentUser.Email.ToUpperInvariant(),
                FullName = currentUser.FullName ?? "Test User",
                DisplayName = "Test",
                EmailConfirmed = true,
                IsActive = true,
                Timezone = "UTC",
                Locale = "en-US",
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString(),
                CreatedAt = now,
                UpdatedAt = now
            };

            var workspace = new Workspace
            {
                Id = workspaceId,
                Name = "Test Workspace",
                Slug = "test-workspace",
                Settings = JsonDocument.Parse("""{}"""),
                CreatedAt = now,
                UpdatedAt = now
            };

            var membership = new Membership
            {
                WorkspaceId = workspaceId,
                UserId = userId,
                Role = MembershipRole.Owner,
                IsActive = true,
                JoinedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            seedContext.Users.Add(user);
            seedContext.Workspaces.Add(workspace);
            seedContext.Memberships.Add(membership);
            await seedContext.SaveChangesAsync();
        }

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName, databaseRoot)
            .AddInterceptors(
                new AuditInterceptor(currentUser),
                new TenantInterceptor(tenantContext))
            .Options;

        var context = new AppDbContext(options, tenantContext);

        return new TestDbScope(context, tenantContext, currentUser);
    }
}
