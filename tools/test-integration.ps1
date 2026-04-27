#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Runs the backend integration test suite, which self-provisions Postgres
    and Redis containers via Docker.

.DESCRIPTION
    The integration tests under `backend/tests/LinearPrecision.Integration.Tests`
    use `DockerContainerSupport` to start ephemeral postgres:16-alpine and
    redis:7-alpine containers per run. This script:

      1. Verifies Docker is available and running.
      2. Optionally pre-pulls the images so the first run isn't slow.
      3. Invokes `dotnet test` against the integration test project.

    Override host ports via env vars if 5439/6389 conflict locally:
      $env:LP_TEST_POSTGRES_PORT = "15439"
      $env:LP_TEST_REDIS_PORT    = "16389"

.EXAMPLE
    pwsh ./tools/test-integration.ps1
#>
[CmdletBinding()]
param(
    [switch]$NoBuild,
    [switch]$SkipImagePull,
    [string]$Filter
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$solution = Join-Path $repoRoot 'backend/LinearPrecision.sln'
$project  = Join-Path $repoRoot 'backend/tests/LinearPrecision.Integration.Tests/LinearPrecision.Integration.Tests.csproj'

# 1. Docker availability -----------------------------------------------------
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Error @'
docker executable not found on PATH.

Install Docker Desktop (https://www.docker.com/products/docker-desktop/) or
ensure the docker CLI is on PATH, then re-run this script. The integration
tests cannot start postgres/redis containers without it.
'@
    exit 2
}

try {
    $null = & docker info --format '{{.ServerVersion}}' 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error 'Docker engine is not running. Start Docker Desktop (or your daemon) and try again.'
        exit 2
    }
} catch {
    Write-Error "Docker engine is not reachable: $_"
    exit 2
}

# 2. Optional pre-pull -------------------------------------------------------
if (-not $SkipImagePull) {
    Write-Host '==> Ensuring postgres:16-alpine and redis:7-alpine images are present...' -ForegroundColor Cyan
    & docker pull postgres:16-alpine | Out-Null
    & docker pull redis:7-alpine     | Out-Null
}

# 3. Run --------------------------------------------------------------------
$testArgs = @(
    'test',
    $project,
    '--logger', 'console;verbosity=normal'
)
if ($NoBuild)        { $testArgs += '--no-build' }
if ($Filter)         { $testArgs += @('--filter', $Filter) }

Write-Host "==> dotnet $($testArgs -join ' ')" -ForegroundColor Cyan
& dotnet @testArgs
exit $LASTEXITCODE
