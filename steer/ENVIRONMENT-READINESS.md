# Environment Readiness Gate

**Purpose:** prove that the shared STEER delivery environment works before product
implementation begins. An installed tool is not evidence; its executable check is.

## Readiness levels

| Level | Meaning | Required evidence |
|---|---|---|
| L0 — workstation | Required runtimes, container engine, agent CLIs, and security tools execute | `scripts/check-environment.sh` tool and authentication checks |
| L1 — local delivery | Pinned runtimes resolve, isolated PostgreSQL is healthy, source endpoints are reachable, repository contract tests and local gauntlet pass | `scripts/bootstrap-environment.sh`, then `scripts/gauntlet.sh` |
| L2 — governed repository | Private/shared Git origin exists, PR-only protected `main` is enforced, and the workflow passes remotely | `scripts/check-environment.sh --delivery` plus a green GitHub Actions run and rejected direct-push proof |
| L3 — staged release | Preview/staging, feature flag, rollback, telemetry, and synthetic fixtures pass the tracer-bullet exam | Brief/exam `0002` and its preserved evidence |

Product implementation may not start merely because L1 passes. The assigned workflow,
Gate 1, Gate 2, and item-specific prerequisites still govern. The first live SAM.gov
adapter additionally requires a SAM API key in the local secret environment and GitHub
Actions secret store; the key must never be pasted into a brief, log, or chat.

## Current baseline — 2026-08-12

| Area | Result | Evidence / disposition |
|---|---|---|
| Host | Ready | macOS 26.6, Apple Silicon, adequate free disk |
| Git + GitHub CLI | Local ready | Git installed; `gh` authenticated; initial baseline commit preserved |
| Agent fleet | Ready for minimum fleet | Codex and Claude Code CLIs installed and authenticated; fresh-context role behavior remains a live STEER proof |
| Python | Ready | Python 3.12.13 installed by `uv`; repository pin is `3.12` |
| Node | Ready, not active in first backend slice | Node 20 is installed and repository-pinned; global Node 25 is intentionally not treated as the project runtime |
| Containers | Ready | Docker engine and Compose execute; project Postgres is isolated on `127.0.0.1:55432` |
| Security tools | Ready | gitleaks, Semgrep, osv-scanner, ShellCheck, and actionlint execute locally |
| Official-source network | Reachable | GitHub, SAM.gov, and USAspending completed DNS/TLS/HTTP handshakes; unauthenticated API responses are not treated as semantic API proof |
| Secrets | Local safe, credential pending | `.env` is ignored and no secret was detected; SAM API key is not configured |
| Governed remote | Blocked pending owner choice | No Git origin, remote CI result, or branch-protection proof exists yet |
| Staging/telemetry/flags | Not started | Required for L3, not for workstation bootstrap |

The dated executable evidence and tool inventory are preserved in
[`evidence/environment-readiness-2026-08-12.md`](evidence/environment-readiness-2026-08-12.md).

## One-command paths

```bash
./scripts/bootstrap-environment.sh
./scripts/gauntlet.sh
./scripts/check-environment.sh --delivery
```

The bootstrap is macOS-specific and idempotent. It installs only the adopted local
formulae that are missing, installs the pinned Python runtime, syncs the locked
development environment, validates Compose, and starts only this project's PostgreSQL
service. The check never prints credential values.

## Known setup failures retained as learning

Two initial inventory probes ran in zsh and used the names `path` and `status`. Both are
special zsh variables; assigning to the first mutated `PATH`, while assigning to the
second stopped the probe. No machine tool was actually missing. The permanent fix is to
declare Bash in every setup script, avoid shell-special generic variable names, run
`bash -n` plus ShellCheck, and assert that tool discovery leaves `PATH` unchanged.
