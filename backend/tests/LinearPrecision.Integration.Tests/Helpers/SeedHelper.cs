using Bogus;
using LinearPrecision.Api.Entities;

namespace LinearPrecision.Integration.Tests.Helpers;

/// <summary>
/// Provides Bogus-based seed data generators for integration tests.
/// </summary>
public static class SeedHelper
{
    private static readonly Faker Faker = new();

    public static User CreateTestUser(string? email = null, string? fullName = null)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Email = email ?? Faker.Internet.Email(),
            UserName = email ?? Faker.Internet.Email(),
            FullName = fullName ?? Faker.Name.FullName(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
    }

    public static Workspace CreateTestWorkspace(string? name = null, string? slug = null)
    {
        var workspaceName = name ?? Faker.Company.CompanyName();
        return new Workspace
        {
            Id = Guid.NewGuid(),
            Name = workspaceName,
            Slug = slug ?? workspaceName.ToLowerInvariant().Replace(" ", "-"),
            CreatedAt = DateTime.UtcNow,
        };
    }

    public static Project CreateTestProject(Guid workspaceId, string? name = null)
    {
        return new Project
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            Name = name ?? Faker.Commerce.ProductName(),
            Identifier = Faker.Random.AlphaNumeric(4).ToUpperInvariant(),
            CreatedAt = DateTime.UtcNow,
        };
    }
}
