#!/usr/bin/env bash

set -uo pipefail

script_dir=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(CDPATH='' cd -- "${script_dir}/.." && pwd)
cd "${repo_root}" || exit 1

pass_count=0
fail_count=0

pass_check() {
  printf 'PASS  %s\n' "$1"
  pass_count=$((pass_count + 1))
}

fail_check() {
  printf 'FAIL  %s\n' "$1"
  fail_count=$((fail_count + 1))
}

for required_file in \
  CONTRIBUTING.md SECURITY.md docs/README.md \
  steer/TEAM-ENVIRONMENT.md steer/TEAM-COMMUNICATION.md \
  .github/CODEOWNERS .github/pull_request_template.md \
  .github/ISSUE_TEMPLATE/candidate.yml .github/ISSUE_TEMPLATE/escalation.yml; do
  if [[ -f ${required_file} ]]; then
    pass_check "${required_file} exists"
  else
    fail_check "${required_file} is missing"
  fi
done

if ! gh auth status >/dev/null 2>&1; then
  fail_check "GitHub CLI is not authenticated"
  exit 1
fi

repo_name=$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || true)
if [[ -z ${repo_name} ]]; then
  fail_check "GitHub repository cannot be resolved"
  exit 1
fi
pass_check "GitHub repository resolves as ${repo_name}"

repo_state=$(gh repo view --json isPrivate,hasIssuesEnabled,hasDiscussionsEnabled)
if [[ $(jq -r .isPrivate <<<"${repo_state}") == "true" ]]; then
  pass_check "repository is private"
else
  fail_check "repository is not private"
fi
if [[ $(jq -r .hasIssuesEnabled <<<"${repo_state}") == "true" ]]; then
  pass_check "GitHub Issues is enabled"
else
  fail_check "GitHub Issues is disabled"
fi
if [[ $(jq -r .hasDiscussionsEnabled <<<"${repo_state}") == "true" ]]; then
  pass_check "GitHub Discussions is enabled"
else
  fail_check "GitHub Discussions is disabled"
fi

if gh api "repos/${repo_name}/branches/main/protection" >/dev/null 2>&1; then
  pass_check "main branch protection is enabled"
else
  fail_check "main branch protection is unavailable"
fi

owner_name=${repo_name%%/*}
project_count=$(gh api graphql \
  -f query="query(\$login:String!){user(login:\$login){projectsV2(first:100){nodes{title}}}}" \
  -f login="${owner_name}" \
  --jq '[.data.user.projectsV2.nodes[] | select(.title == "STEER Flight Board")] | length' \
  2>/dev/null || printf '0')
if [[ ${project_count} == "1" ]]; then
  pass_check "STEER Flight Board exists"
else
  fail_check "STEER Flight Board is missing or duplicated"
fi

for label_name in workflow/steer workflow/control workflow/setup-excluded state/blocked \
  gate/1-pending gate/2-pending gate/3-pending phase/sense phase/learn; do
  if gh label list --repo "${repo_name}" --search "${label_name}" --json name \
    --jq ".[] | select(.name == \"${label_name}\") | .name" | rg -q .; then
    pass_check "label ${label_name} exists"
  else
    fail_check "label ${label_name} is missing"
  fi
done

workflow_state=$(gh api "repos/${repo_name}/actions/workflows" \
  --jq '.workflows[] | select(.path == ".github/workflows/environment-readiness.yml") | .state' \
  2>/dev/null || true)
if [[ ${workflow_state} == "active" ]]; then
  pass_check "environment readiness workflow is active"
else
  fail_check "environment readiness workflow is not active"
fi

printf '\nSummary: %d pass, %d fail\n' "${pass_count}" "${fail_count}"
if (( fail_count > 0 )); then
  exit 1
fi
