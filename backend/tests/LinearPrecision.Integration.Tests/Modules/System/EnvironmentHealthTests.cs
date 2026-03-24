using System.Net;
using FluentAssertions;
using LinearPrecision.Api.Infrastructure.Persistence;
using LinearPrecision.Integration.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace LinearPrecision.Integration.Tests.Modules.System;

[Collection("Api")]
public class EnvironmentHealthTests
{
    private readonly ApiFixture _fixture;

    public EnvironmentHealthTests(ApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Ready_health_check_should_report_healthy_and_database_should_be_migrated()
    {
        var client = _fixture.CreateClient();

        var response = await client.GetAsync("/health/ready");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        await using var scope = _fixture.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var appliedMigrations = await db.Database.GetAppliedMigrationsAsync();

        appliedMigrations.Should().NotBeEmpty();
    }
}
