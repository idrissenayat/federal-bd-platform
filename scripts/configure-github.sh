#!/usr/bin/env bash

set -euo pipefail

script_dir=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(CDPATH='' cd -- "${script_dir}/.." && pwd)
cd "${repo_root}"

repo_name=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
owner_name=${repo_name%%/*}

gh repo edit "${repo_name}" --enable-issues --enable-discussions

create_label() {
  gh label create "$1" --repo "${repo_name}" --color "$2" --description "$3" --force
}

create_label "kind/candidate" "1d76db" "Evidence-backed candidate awaiting framing"
create_label "kind/signal" "5319e7" "Observation awaiting triage"
create_label "kind/defect" "d73a4a" "Product, process, or gauntlet defect"
create_label "kind/escalation" "b60205" "Consequential question requiring a human ruling"
create_label "workflow/steer" "0e8a16" "Assigned to the STEER treatment"
create_label "workflow/control" "fbca04" "Assigned to the control workflow"
create_label "workflow/setup-excluded" "c5def5" "Setup work excluded from comparative results"
create_label "state/blocked" "b60205" "Cannot progress without a named ruling or dependency"
create_label "gate/1-pending" "f9d0c4" "Intent brief awaiting Gate 1"
create_label "gate/2-pending" "fef2c0" "Exam awaiting Gate 2"
create_label "gate/3-pending" "d4c5f9" "Verified build awaiting release decision"
create_label "phase/sense" "dbeafe" "STEER phase 1: Sense"
create_label "phase/frame" "bfdbfe" "STEER phase 2: Frame"
create_label "phase/engineer" "a7f3d0" "STEER phase 3: Engineer"
create_label "phase/evaluate" "fde68a" "STEER phase 4: Evaluate"
create_label "phase/release" "fed7aa" "STEER phase 5: Release"
create_label "phase/observe" "ddd6fe" "STEER phase 6: Observe"
create_label "phase/learn" "fbcfe8" "STEER phase 7: Learn"

configuration_errors=0

if gh api --method PUT "repos/${repo_name}/branches/main/protection" \
  --input .github/branch-protection.json >/dev/null 2>&1; then
  printf 'Configured protected main branch.\n'
else
  printf 'BLOCKED: private-repository branch protection is unavailable for this account.\n' >&2
  configuration_errors=$((configuration_errors + 1))
fi

if owner_id=$(gh api graphql -f query="query(\$login:String!){user(login:\$login){id}}" \
  -f login="${owner_name}" --jq .data.user.id 2>/dev/null) && \
  project_json=$(gh api graphql \
    -f query="query(\$login:String!){user(login:\$login){projectsV2(first:100){nodes{id number title url}}}}" \
    -f login="${owner_name}" 2>/dev/null); then
  project_id=$(jq -r '.data.user.projectsV2.nodes[] | select(.title == "STEER Flight Board") | .id' \
    <<<"${project_json}" | head -n 1)

  if [[ -z ${project_id} ]]; then
    project_result=$(gh api graphql \
      -f query="mutation(\$owner:ID!){createProjectV2(input:{ownerId:\$owner,title:\"STEER Flight Board\"}){projectV2{id number title url}}}" \
      -f owner="${owner_id}")
    project_id=$(jq -r .data.createProjectV2.projectV2.id <<<"${project_result}")
  fi

  repository_id=$(gh api "repos/${repo_name}" --jq .node_id)
  gh api graphql \
    -f query="mutation(\$project:ID!,\$repository:ID!){linkProjectV2ToRepository(input:{projectId:\$project,repositoryId:\$repository}){repository{id}}}" \
    -f project="${project_id}" -f repository="${repository_id}" >/dev/null
  printf 'Configured and linked STEER Flight Board.\n'
else
  printf 'BLOCKED: GitHub CLI needs read:project and project scopes.\n' >&2
  configuration_errors=$((configuration_errors + 1))
fi

printf 'Applied all available GitHub configuration for %s\n' "${repo_name}"
if (( configuration_errors > 0 )); then
  exit 1
fi
