namespace LinearPrecision.Integration.Tests.Fixtures;

/// <summary>
/// Standalone database fixture for tests that only need PostgreSQL
/// without the full API pipeline.
/// </summary>
public class DatabaseFixture : IAsyncLifetime
{
    private DockerContainerHandle? _postgres;

    public string ConnectionString =>
        _postgres?.ConnectionString
        ?? throw new InvalidOperationException("PostgreSQL test container has not been started.");

    public async Task InitializeAsync()
    {
        _postgres = await DockerContainerSupport.StartPostgresAsync();
    }

    public async Task DisposeAsync()
    {
        await DockerContainerSupport.StopContainerAsync(_postgres);
    }
}
