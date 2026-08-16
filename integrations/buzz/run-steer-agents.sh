#!/usr/bin/env bash

set -Eeuo pipefail

readonly acp_executable="${BUZZ_ACP_EXECUTABLE:-/usr/local/bin/buzz-acp}"
readonly configured_roles="${STEER_AGENT_ROLES:-}"
readonly worker_home="${STEER_WORKER_HOME:-${HOME:-/var/lib/buzz-worker}}"

architect_git_ssh_command=""

configure_architect_git() {
  if [[ -z "${STEER_ARCHITECT_GITHUB_SSH_PRIVATE_KEY:-}" ]]; then
    echo "STEER agent supervisor: Architect GitHub write capability is not configured"
    return
  fi

  local ssh_directory="${worker_home}/.ssh"
  local private_key_path="${ssh_directory}/architect_deploy_key"
  umask 077
  mkdir -p "${ssh_directory}"
  printf '%s\n' "${STEER_ARCHITECT_GITHUB_SSH_PRIVATE_KEY}" > "${private_key_path}"
  chmod 700 "${ssh_directory}"
  chmod 600 "${private_key_path}"
  architect_git_ssh_command="ssh -p 443 -i ${private_key_path} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
  echo "STEER agent supervisor: Architect repo-scoped GitHub transport configured"
}

if [[ -z "${configured_roles}" ]]; then
  echo "STEER agent supervisor: legacy single-identity mode"
  exec "${acp_executable}"
fi

declare -a child_pids=()

stop_children() {
  local child_pid
  for child_pid in "${child_pids[@]:-}"; do
    kill -TERM "${child_pid}" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap stop_children EXIT INT TERM

require_value() {
  local variable_name="$1"
  local variable_value="$2"
  if [[ -z "${variable_value}" ]]; then
    echo "STEER agent supervisor: ${variable_name} is required" >&2
    exit 64
  fi
}

launch_agent() {
  local role="$1"
  local private_key="$2"
  local system_prompt="$3"
  local model="$4"
  local git_ssh_command="${5:-}"

  require_value "${role} private key" "${private_key}"
  require_value "${role} system prompt" "${system_prompt}"
  require_value "${role} model" "${model}"

  echo "STEER agent supervisor: starting ${role} (${BUZZ_AGENT_PROVIDER:-openai}/${model})"
  if [[ -n "${git_ssh_command}" ]]; then
    env \
      BUZZ_PRIVATE_KEY="${private_key}" \
      BUZZ_AGENT_SYSTEM_PROMPT="${system_prompt}" \
      OPENAI_COMPAT_MODEL="${model}" \
      BUZZ_ACP_AGENTS="${STEER_AGENT_PROCESS_COUNT:-1}" \
      GIT_SSH_COMMAND="${git_ssh_command}" \
      STEER_GIT_REMOTE_URL="${STEER_GIT_REMOTE_URL:-ssh://git@ssh.github.com:443/idrissenayat/federal-bd-platform.git}" \
      STEER_AGENT_GIT_NAME="${STEER_ARCHITECT_GIT_NAME:-STEER Architect Agent}" \
      STEER_AGENT_GIT_EMAIL="${STEER_ARCHITECT_GIT_EMAIL:-steer-architect-agent@users.noreply.github.com}" \
      "${acp_executable}" &
  else
    env \
      BUZZ_PRIVATE_KEY="${private_key}" \
      BUZZ_AGENT_SYSTEM_PROMPT="${system_prompt}" \
      OPENAI_COMPAT_MODEL="${model}" \
      BUZZ_ACP_AGENTS="${STEER_AGENT_PROCESS_COUNT:-1}" \
      "${acp_executable}" &
  fi
  child_pids+=("$!")
}

configure_architect_git
IFS=',' read -r -a roles <<< "${configured_roles}"
for role in "${roles[@]}"; do
  case "${role}" in
    builder)
      launch_agent \
        "builder" \
        "${BUZZ_PRIVATE_KEY:-}" \
        "${BUZZ_AGENT_SYSTEM_PROMPT:-}" \
        "${OPENAI_COMPAT_MODEL:-gpt-5.6-luna}"
      ;;
    architect)
      launch_agent \
        "architect" \
        "${STEER_ARCHITECT_BUZZ_PRIVATE_KEY:-}" \
        "${STEER_ARCHITECT_SYSTEM_PROMPT:-}" \
        "${STEER_ARCHITECT_MODEL:-gpt-5.6-sol}" \
        "${architect_git_ssh_command}"
      ;;
    *)
      echo "STEER agent supervisor: unsupported role '${role}'" >&2
      exit 64
      ;;
  esac
done

if [[ "${#child_pids[@]}" -eq 0 ]]; then
  echo "STEER agent supervisor: no agent roles were configured" >&2
  exit 64
fi

child_status=0
while true; do
  for child_pid in "${child_pids[@]}"; do
    if ! kill -0 "${child_pid}" 2>/dev/null; then
      set +e
      wait "${child_pid}"
      child_status=$?
      set -e
      break 2
    fi
  done
  sleep 1
done

echo "STEER agent supervisor: an agent process exited with status ${child_status}; stopping the shared worker" >&2
if [[ "${child_status}" -eq 0 ]]; then
  exit 1
fi
exit "${child_status}"
