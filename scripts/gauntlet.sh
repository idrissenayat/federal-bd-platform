#!/usr/bin/env bash

set -euo pipefail

script_dir=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(CDPATH='' cd -- "${script_dir}/.." && pwd)
cd "${repo_root}"

if (( $# > 0 )); then
  "${script_dir}/check-environment.sh" "$@"
else
  "${script_dir}/check-environment.sh"
fi
uv sync --locked
uv run ruff check .
uv run mypy tests
uv run pytest -q
gitleaks dir . --no-banner --redact --exit-code 1
osv-scanner scan source --lockfile uv.lock .
semgrep scan --config auto --error --exclude .venv .
