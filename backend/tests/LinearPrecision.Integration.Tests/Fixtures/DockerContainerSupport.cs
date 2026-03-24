using System.Diagnostics;
using Npgsql;

namespace LinearPrecision.Integration.Tests.Fixtures;

internal sealed record DockerContainerHandle(
    string Name,
    string Id,
    string ConnectionString);

internal static class DockerContainerSupport
{
    private const int DefaultPostgresPort = 5439;
    private const int DefaultRedisPort = 6389;

    public static async Task<DockerContainerHandle> StartPostgresAsync(CancellationToken ct = default)
    {
        var hostPort = GetPortOverride("LP_TEST_POSTGRES_PORT", DefaultPostgresPort);
        var name = $"lp-int-postgres-{Guid.NewGuid():N}";
        var id = await RunDockerAsync(
            $"run -d --rm --name {name} -e POSTGRES_DB=linearprecision_test -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -p {hostPort}:5432 postgres:16-alpine",
            ct);

        var connectionString = new NpgsqlConnectionStringBuilder
        {
            Host = "127.0.0.1",
            Port = hostPort,
            Database = "linearprecision_test",
            Username = "test",
            Password = "test"
        }.ConnectionString;

        try
        {
            await WaitForContainerCommandAsync(
                name,
                "pg_isready -U test -d linearprecision_test",
                "accepting connections",
                ct);
            await WaitForPostgresAsync(connectionString, ct);

            return new DockerContainerHandle(name, id, connectionString);
        }
        catch
        {
            await StopContainerAsync(new DockerContainerHandle(name, id, connectionString), ct);
            throw;
        }
    }

    public static async Task<DockerContainerHandle> StartRedisAsync(CancellationToken ct = default)
    {
        var hostPort = GetPortOverride("LP_TEST_REDIS_PORT", DefaultRedisPort);
        var name = $"lp-int-redis-{Guid.NewGuid():N}";
        var id = await RunDockerAsync(
            $"run -d --rm --name {name} -p {hostPort}:6379 redis:7-alpine",
            ct);

        var connectionString = $"127.0.0.1:{hostPort}";

        try
        {
            await WaitForContainerCommandAsync(name, "redis-cli ping", "PONG", ct);
            return new DockerContainerHandle(name, id, connectionString);
        }
        catch
        {
            await StopContainerAsync(new DockerContainerHandle(name, id, connectionString), ct);
            throw;
        }
    }

    public static async Task StopContainerAsync(
        DockerContainerHandle? handle,
        CancellationToken ct = default)
    {
        if (handle is null)
        {
            return;
        }

        await RunDockerIgnoringErrorsAsync($"rm -f {handle.Name}", ct);
    }

    private static async Task WaitForPostgresAsync(
        string connectionString,
        CancellationToken ct)
    {
        const int maxAttempts = 20;
        Exception? lastException = null;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            ct.ThrowIfCancellationRequested();

            try
            {
                await using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync(ct);
                await connection.CloseAsync();
                return;
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                lastException = ex;
                await Task.Delay(TimeSpan.FromSeconds(1), ct);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Failed to connect to PostgreSQL test container using connection string '{connectionString}'.",
                    ex);
            }
        }

        throw new InvalidOperationException(
            $"Failed to connect to PostgreSQL test container using connection string '{connectionString}'.",
            lastException);
    }

    private static async Task WaitForContainerCommandAsync(
        string containerName,
        string command,
        string expectedOutput,
        CancellationToken ct)
    {
        const int maxAttempts = 20;
        CommandResult? lastResult = null;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            ct.ThrowIfCancellationRequested();

            var result = await RunProcessAsync(
                "docker",
                $"exec {containerName} sh -lc \"{command}\"",
                ct);

            if (result.ExitCode == 0
                && result.StdOut.Contains(expectedOutput, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            lastResult = result;
            await Task.Delay(TimeSpan.FromSeconds(1), ct);
        }

        throw new InvalidOperationException(
            $"Container '{containerName}' did not report readiness for command '{command}'. Last stdout: '{lastResult?.StdOut}'. Last stderr: '{lastResult?.StdErr}'.");
    }

    private static async Task<string> RunDockerAsync(string arguments, CancellationToken ct)
    {
        var result = await RunProcessAsync("docker", arguments, ct);
        if (result.ExitCode == 0)
        {
            return result.StdOut.Trim();
        }

        throw new InvalidOperationException(
            $"Docker command 'docker {arguments}' failed with exit code {result.ExitCode}. Stdout: '{result.StdOut}'. Stderr: '{result.StdErr}'.");
    }

    private static async Task RunDockerIgnoringErrorsAsync(string arguments, CancellationToken ct)
    {
        await RunProcessAsync("docker", arguments, ct);
    }

    private static async Task<CommandResult> RunProcessAsync(
        string fileName,
        string arguments,
        CancellationToken ct)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync(ct);
        var stderrTask = process.StandardError.ReadToEndAsync(ct);

        await process.WaitForExitAsync(ct);

        return new CommandResult(
            process.ExitCode,
            await stdoutTask,
            await stderrTask);
    }

    private static int GetPortOverride(string environmentVariable, int defaultValue)
    {
        var rawValue = Environment.GetEnvironmentVariable(environmentVariable);
        return int.TryParse(rawValue, out var port) ? port : defaultValue;
    }

    private sealed record CommandResult(int ExitCode, string StdOut, string StdErr);
}
