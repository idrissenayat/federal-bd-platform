#!/usr/bin/env bash

set -euo pipefail

script_dir=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(CDPATH='' cd -- "${script_dir}/.." && pwd)
cd "${repo_root}"

temp_root=$(mktemp -d "${TMPDIR:-/tmp}/federal-bd-lanes.XXXXXX")
lane_a="${temp_root}/builder-a"
lane_b="${temp_root}/builder-b"
branch_a="proof/builder-a-$$"
branch_b="proof/builder-b-$$"

cleanup() {
  git worktree remove --force "${lane_a}" >/dev/null 2>&1 || true
  git worktree remove --force "${lane_b}" >/dev/null 2>&1 || true
  git branch -D "${branch_a}" >/dev/null 2>&1 || true
  git branch -D "${branch_b}" >/dev/null 2>&1 || true
  rm -rf "${temp_root}"
}
trap cleanup EXIT

git worktree add --quiet -b "${branch_a}" "${lane_a}" HEAD
git worktree add --quiet -b "${branch_b}" "${lane_b}" HEAD

printf 'builder-a-uncommitted\n' > "${lane_a}/.lane-proof"
printf 'builder-b-uncommitted\n' > "${lane_b}/.lane-proof"

if [[ $(<"${lane_a}/.lane-proof") != "builder-a-uncommitted" ]]; then
  printf 'FAIL  builder A marker changed unexpectedly\n' >&2
  exit 1
fi
if [[ $(<"${lane_b}/.lane-proof") != "builder-b-uncommitted" ]]; then
  printf 'FAIL  builder B marker changed unexpectedly\n' >&2
  exit 1
fi

printf 'PASS  two builder branches and worktrees preserve isolated uncommitted state\n'
