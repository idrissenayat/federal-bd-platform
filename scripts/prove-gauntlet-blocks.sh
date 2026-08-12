#!/usr/bin/env bash

set -euo pipefail

temp_root=$(mktemp -d "${TMPDIR:-/tmp}/federal-bd-gauntlet.XXXXXX")
cleanup() {
  rm -rf "${temp_root}"
}
trap cleanup EXIT

key_prefix='AKIA'
key_suffix='ABCDEFGHIJKLMNOP'
printf 'AWS_ACCESS_KEY_ID=%s%s\n' "${key_prefix}" "${key_suffix}" > "${temp_root}/planted.env"

if gitleaks dir "${temp_root}" --no-banner --redact --exit-code 1 >/dev/null 2>&1; then
  printf 'FAIL  gitleaks allowed a planted synthetic secret\n' >&2
  exit 1
fi

printf 'def test_planted_failure() -> None:\n    assert False\n' > "${temp_root}/test_planted.py"
if uv run pytest -q "${temp_root}/test_planted.py" >/dev/null 2>&1; then
  printf 'FAIL  pytest allowed a planted failing test\n' >&2
  exit 1
fi

printf 'PASS  planted synthetic secret and failing test were blocked\n'
