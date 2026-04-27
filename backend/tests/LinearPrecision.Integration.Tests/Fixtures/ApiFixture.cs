using LinearPrecision.Shared.Contracts;
using LinearPrecision.Api.Modules.AI.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using NSubstitute;

namespace LinearPrecision.Integration.Tests.Fixtures;

/// <summary>
/// WebApplicationFactory-based test fixture with Testcontainers for PostgreSQL and Redis.
/// Provides a fully configured HttpClient for integration testing.
/// </summary>
public class ApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private DockerContainerHandle? _postgres;
    private DockerContainerHandle? _redis;

    public IEmailService EmailService { get; } = Substitute.For<IEmailService>();

    public ApiFixture()
    {
        EmailService.SendAsync(
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        EmailService.SendTemplatedAsync(
                Arg.Any<string>(),
                Arg.Any<string>(),
                Arg.Any<object>(),
                Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);
    }

    private string PostgresConnectionString =>
        _postgres?.ConnectionString
        ?? throw new InvalidOperationException("PostgreSQL test container has not been started.");

    private string RedisConnectionString =>
        _redis?.ConnectionString
        ?? throw new InvalidOperationException("Redis test container has not been started.");

    public async Task InitializeAsync()
    {
        _postgres = await DockerContainerSupport.StartPostgresAsync();
        _redis = await DockerContainerSupport.StartRedisAsync();
    }

    public new async Task DisposeAsync()
    {
        await DockerContainerSupport.StopContainerAsync(_postgres);
        await DockerContainerSupport.StopContainerAsync(_redis);
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.UseSetting(
            "ConnectionStrings:DefaultConnection",
            PostgresConnectionString);

        builder.UseSetting(
            "ConnectionStrings:Redis",
            RedisConnectionString);

        builder.UseSetting("Jwt:Key", "test-jwt-signing-key-that-is-at-least-32-bytes-long!!");
        builder.UseSetting("Jwt:Issuer", "https://test.linearprecision.com");
        builder.UseSetting("Jwt:Audience", "linear-precision-test");

        builder.ConfigureServices(services =>
        {
            // Replace IEmailService with a no-op stub to avoid real SMTP connections
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IEmailService));
            if (descriptor is not null) services.Remove(descriptor);
            services.AddSingleton(_ => EmailService);

            var storageDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IStorageService));
            if (storageDescriptor is not null) services.Remove(storageDescriptor);

            services.AddScoped(_ =>
            {
                var storage = Substitute.For<IStorageService>();
                storage.GetPresignedUploadUrlAsync(Arg.Any<string>(), Arg.Any<TimeSpan>(), Arg.Any<CancellationToken>())
                    .Returns(callInfo => Task.FromResult($"https://storage.test/upload/{callInfo.ArgAt<string>(0)}"));
                storage.GetPresignedUrlAsync(Arg.Any<string>(), Arg.Any<TimeSpan>(), Arg.Any<CancellationToken>())
                    .Returns(callInfo => Task.FromResult($"https://storage.test/download/{callInfo.ArgAt<string>(0)}"));
                storage.DeleteAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
                    .Returns(Task.CompletedTask);
                return storage;
            });

            var aiDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IAIChatCompletionService));
            if (aiDescriptor is not null) services.Remove(aiDescriptor);

            services.AddScoped(_ =>
            {
                var chatService = Substitute.For<IAIChatCompletionService>();
                chatService.CompleteAsync(
                        Arg.Any<LinearPrecision.Api.Entities.AIProviderConnection>(),
                        Arg.Any<IReadOnlyList<AIChatMessageInput>>(),
                        Arg.Any<string>(),
                        Arg.Any<CancellationToken>())
                    .Returns(callInfo =>
                    {
                        var messages = callInfo.ArgAt<IReadOnlyList<AIChatMessageInput>>(1);
                        var latestUserMessage = messages.LastOrDefault(message => message.Role == "user")?.Content
                            ?? "No user message supplied.";
                        return Task.FromResult(new AIChatCompletionResult(
                            $"Test provider reply for: {latestUserMessage}",
                            42));
                    });
                return chatService;
            });
        });
    }
}

/// <summary>
/// Collection definition so all integration tests share a single Testcontainers instance.
/// </summary>
[CollectionDefinition("Api")]
public class ApiCollection : ICollectionFixture<ApiFixture>
{
}
