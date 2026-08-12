#!/usr/bin/env bash

set -euo pipefail

script_dir=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(CDPATH='' cd -- "${script_dir}/.." && pwd)
cd "${repo_root}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  printf 'This bootstrap currently supports macOS; use check-environment.sh for diagnostics.\n' >&2
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  printf 'Homebrew is required to install the local STEER toolchain.\n' >&2
  exit 1
fi

formulae=(uv gitleaks osv-scanner semgrep shellcheck actionlint)
commands=(uv gitleaks osv-scanner semgrep shellcheck actionlint)
missing_formulae=()

for index in "${!commands[@]}"; do
  if ! command -v "${commands[$index]}" >/dev/null 2>&1; then
    missing_formulae+=("${formulae[$index]}")
  fi
done

if (( ${#missing_formulae[@]} > 0 )); then
  brew install "${missing_formulae[@]}"
fi

uv python install 3.12
uv sync --locked
docker compose config --quiet
docker compose up -d --wait postgres

exec "${script_dir}/check-environment.sh"
