#!/usr/bin/env bash

set -uo pipefail

mode="local"
if [[ ${1:-} == "--delivery" ]]; then
  mode="delivery"
elif [[ $# -gt 0 ]]; then
  printf 'Usage: %s [--delivery]\n' "$0" >&2
  exit 2
fi

script_dir=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(CDPATH='' cd -- "${script_dir}/.." && pwd)
cd "${repo_root}" || exit 1

pass_count=0
warn_count=0
fail_count=0

pass_check() {
  printf 'PASS  %s\n' "$1"
  pass_count=$((pass_count + 1))
}

warn_check() {
  printf 'WARN  %s\n' "$1"
  warn_count=$((warn_count + 1))
}

fail_check() {
  printf 'FAIL  %s\n' "$1"
  fail_count=$((fail_count + 1))
}

delivery_requirement() {
  if [[ ${mode} == "delivery" ]]; then
    fail_check "$1"
  else
    warn_check "$1"
  fi
}

require_command() {
  local command_name=$1
  if command -v "${command_name}" >/dev/null 2>&1; then
    pass_check "${command_name} is installed"
  else
    fail_check "${command_name} is missing"
  fi
}

printf 'STEER environment readiness (%s mode)\n' "${mode}"
printf 'Repository: %s\n\n' "${repo_root}"

if [[ -n ${BASH_VERSION:-} ]]; then
  pass_check "readiness gate is running under declared Bash"
else
  fail_check "readiness gate is not running under Bash"
fi

original_path=${PATH}
command_path=$(command -v git 2>/dev/null || true)
if [[ -n ${command_path} && ${PATH} == "${original_path}" ]]; then
  pass_check "tool discovery does not mutate PATH"
else
  fail_check "tool discovery changed PATH or could not find Git"
fi

for command_name in git gh rg jq curl uv docker gitleaks osv-scanner semgrep shellcheck actionlint codex claude; do
  require_command "${command_name}"
done

if uv python find 3.12 >/dev/null 2>&1; then
  pass_check "Python 3.12 runtime is available through uv"
else
  fail_check "Python 3.12 runtime is unavailable (run uv python install 3.12)"
fi

node_command=""
if [[ -x /opt/homebrew/opt/node@20/bin/node ]]; then
  node_command=/opt/homebrew/opt/node@20/bin/node
elif command -v node >/dev/null 2>&1; then
  node_command=$(command -v node)
fi
if [[ -n ${node_command} && $("${node_command}" --version 2>/dev/null) == v20.* ]]; then
  pass_check "pinned Node.js 20 runtime is available"
else
  fail_check "pinned Node.js 20 runtime is unavailable"
fi

if gh auth status >/dev/null 2>&1; then
  pass_check "GitHub CLI is authenticated"
else
  fail_check "GitHub CLI is not authenticated"
fi
if codex login status >/dev/null 2>&1; then
  pass_check "Codex CLI is authenticated"
else
  fail_check "Codex CLI is not authenticated"
fi
if claude auth status >/dev/null 2>&1; then
  pass_check "Claude Code is authenticated"
else
  fail_check "Claude Code is not authenticated"
fi

if docker info >/dev/null 2>&1; then
  pass_check "Docker engine is running"
else
  fail_check "Docker engine is unavailable"
fi
if docker compose version >/dev/null 2>&1; then
  pass_check "Docker Compose is available"
else
  fail_check "Docker Compose is unavailable"
fi
if docker compose config --quiet >/dev/null 2>&1; then
  pass_check "compose.yaml is valid"
else
  fail_check "compose.yaml is invalid"
fi
if docker compose exec -T postgres pg_isready -U federal_bd -d federal_bd >/dev/null 2>&1; then
  pass_check "project PostgreSQL is accepting connections"
else
  fail_check "project PostgreSQL is not ready (run scripts/bootstrap-environment.sh)"
fi

for source_url in \
  https://github.com \
  https://api.sam.gov/opportunities/v2/search \
  https://api.usaspending.gov/api/v2/; do
  http_code=$(curl -L -sS -o /dev/null --connect-timeout 10 --max-time 20 \
    -w '%{http_code}' "${source_url}" || true)
  if [[ ${http_code} != "000" && -n ${http_code} ]]; then
    pass_check "network/TLS reachability: ${source_url} (HTTP ${http_code})"
  else
    fail_check "network/TLS reachability failed: ${source_url}"
  fi
done

if git rev-parse --verify HEAD >/dev/null 2>&1; then
  pass_check "repository has a preserved baseline commit"
else
  delivery_requirement "repository has no baseline commit"
fi

if git remote get-url origin >/dev/null 2>&1; then
  pass_check "Git origin remote is configured"
  if [[ ${mode} == "delivery" ]]; then
    repo_name=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || true)
    if [[ -n ${repo_name} ]] && gh api "repos/${repo_name}/branches/main/protection" >/dev/null 2>&1; then
      pass_check "main branch protection is readable and enabled"
    else
      fail_check "main branch protection is not proven"
    fi
  fi
else
  delivery_requirement "Git origin remote is not configured"
fi

if [[ -f .env ]] && grep -Eq '^SAM_API_KEY=.+$' .env; then
  pass_check "SAM.gov credential is configured without being displayed"
elif [[ -n ${SAM_API_KEY:-} ]]; then
  pass_check "SAM.gov credential is present in the process environment"
else
  delivery_requirement "SAM.gov credential is not configured"
fi

if [[ -f .env ]] && ! git check-ignore --quiet .env; then
  fail_check ".env exists but is not ignored by Git"
else
  pass_check "local .env secrets are excluded from Git"
fi

if gitleaks dir . --no-banner --redact --exit-code 1 >/dev/null 2>&1; then
  pass_check "gitleaks found no repository secret"
else
  fail_check "gitleaks detected a potential secret"
fi

if scripts/prove-gauntlet-blocks.sh >/dev/null 2>&1; then
  pass_check "planted synthetic secret and failing test are blocked locally"
else
  fail_check "local gauntlet failed its planted-failure proof"
fi

if bash -n scripts/*.sh && shellcheck scripts/*.sh; then
  pass_check "environment scripts pass Bash syntax and ShellCheck"
else
  fail_check "environment scripts failed syntax or ShellCheck"
fi

if actionlint .github/workflows/*.yml; then
  pass_check "GitHub workflow passes actionlint"
else
  fail_check "GitHub workflow failed actionlint"
fi

printf '\nSummary: %d pass, %d warning, %d fail\n' "${pass_count}" "${warn_count}" "${fail_count}"
if (( fail_count > 0 )); then
  exit 1
fi
