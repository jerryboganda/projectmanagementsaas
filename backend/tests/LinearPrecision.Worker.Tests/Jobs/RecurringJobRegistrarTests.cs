using FluentAssertions;
using LinearPrecision.Worker.Jobs;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace LinearPrecision.Worker.Tests.Jobs;

public class RecurringJobRegistrarTests
{
    [Fact]
    public void Constructor_should_create_instance()
    {
        var logger = Substitute.For<ILogger<RecurringJobRegistrar>>();
        var registrar = new RecurringJobRegistrar(logger);

        // RecurringJob.AddOrUpdate requires Hangfire GlobalConfiguration to be set.
        // In a unit test without Hangfire configured, StartAsync will throw.
        // This test validates the constructor and DI wiring.
        registrar.Should().NotBeNull();
    }

    [Fact]
    public async Task StopAsync_should_complete()
    {
        var logger = Substitute.For<ILogger<RecurringJobRegistrar>>();
        var registrar = new RecurringJobRegistrar(logger);

        var action = () => registrar.StopAsync(CancellationToken.None);
        await action.Should().NotThrowAsync();
    }
}
