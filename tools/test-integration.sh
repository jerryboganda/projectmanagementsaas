#!/usr/bin/env bash
# Runs the backend integration test suite, which self-provisions Postgres and
# Redis containers via Docker. See tools/test-integration.ps1 for full notes.
#
# Override host ports if 5439/6389 conflict locally:
#   export LP_TEST_POSTGRES_PORT=15439
#   export LP_TEST_REDIS_PORT=16389

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT="$REPO_ROOT/backend/tests/LinearPrecision.Integration.Tests/LinearPrecision.Integration.Tests.csproj"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker executable not found on PATH." >&2
  echo "       Install Docker (https://docs.docker.com/get-docker/) and re-run." >&2
  exit 2
fi

if ! docker info --format '{{.ServerVersion}}' >/dev/null 2>&1; then
  echo "error: Docker engine is not running. Start it and try again." >&2
  exit 2
fi

if [[ "${LP_SKIP_IMAGE_PULL:-0}" != "1" ]]; then
  echo "==> Ensuring postgres:16-alpine and redis:7-alpine images are present..."
  docker pull postgres:16-alpine >/dev/null
  docker pull redis:7-alpine     >/dev/null
fi

echo "==> dotnet test $PROJECT"
exec dotnet test "$PROJECT" --logger 'console;verbosity=normal' "$@"
