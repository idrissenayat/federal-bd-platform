#!/usr/bin/env bash

set -euo pipefail

report_file=$(mktemp "${TMPDIR:-/tmp}/federal-bd-semgrep.XXXXXX")
cleanup() {
  rm -f "${report_file}"
}
trap cleanup EXIT

semgrep scan --config auto --json --exclude .venv . > "${report_file}"
finding_count=$(jq '.results | length' "${report_file}")

if (( finding_count > 0 )); then
  printf 'Semgrep found %d blocking finding(s):\n' "${finding_count}" >&2
  jq -r '.results[] | "- \(.path):\(.start.line) [\(.check_id)] \(.extra.message)"' \
    "${report_file}" >&2
  exit 1
fi

printf 'Semgrep found no blocking findings.\n'
