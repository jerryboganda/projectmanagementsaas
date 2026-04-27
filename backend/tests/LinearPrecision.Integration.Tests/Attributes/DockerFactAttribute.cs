using System.ComponentModel;
using System.Diagnostics;

namespace LinearPrecision.Integration.Tests.Attributes;

[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public sealed class DockerFactAttribute : FactAttribute
{
    public DockerFactAttribute()
    {
        Skip = DockerAvailability.SkipReason;
    }
}

internal static class DockerAvailability
{
    private static readonly Lazy<string?> CachedSkipReason = new(
        CheckDockerAvailability,
        LazyThreadSafetyMode.ExecutionAndPublication);

    public static string? SkipReason => CachedSkipReason.Value;

    private static string? CheckDockerAvailability()
    {
        try
        {
            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "docker",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.StartInfo.ArgumentList.Add("version");
            process.StartInfo.ArgumentList.Add("--format");
            process.StartInfo.ArgumentList.Add("{{.Server.Version}}");

            process.Start();

            if (!process.WaitForExit((int)TimeSpan.FromSeconds(5).TotalMilliseconds))
            {
                TryKill(process);
                return "Docker-backed integration tests skipped because 'docker version' did not finish within 5 seconds.";
            }

            var standardError = process.StandardError.ReadToEnd().Trim();
            if (process.ExitCode == 0)
            {
                return null;
            }

            return string.IsNullOrWhiteSpace(standardError)
                ? $"Docker-backed integration tests skipped because Docker is not reachable. 'docker version' exited with code {process.ExitCode}."
                : $"Docker-backed integration tests skipped because Docker is not reachable. 'docker version' exited with code {process.ExitCode}: {standardError}";
        }
        catch (Exception ex) when (ex is Win32Exception or FileNotFoundException)
        {
            return "Docker-backed integration tests skipped because the 'docker' executable is unavailable on PATH.";
        }
    }

    private static void TryKill(Process process)
    {
        try
        {
            process.Kill(entireProcessTree: true);
        }
        catch (InvalidOperationException)
        {
        }
        catch (Win32Exception)
        {
        }
    }
}