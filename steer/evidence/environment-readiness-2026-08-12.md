# Environment Readiness Evidence — 2026-08-12

## Decision

**L1 local delivery environment: PASS.**  
**L2 governed repository: BLOCKED.** No Git origin or enforced branch-protection proof
exists.  
**Live SAM adapter: BLOCKED.** No SAM.gov API credential is configured.

This result clears local setup work only. It does not approve brief `0002` or `0003`,
does not substitute for Gates 1–3, and does not count as a comparative STEER outcome.

## Preserved baseline

- Pre-hardening repository commit: `3abf612`
- Baseline secret scan: no findings
- Environment hardening is intentionally maintained as a later revision so the initial
  state and the reason for each change remain inspectable.

## Frozen local tool inventory

| Tool | Verified version |
|---|---|
| Git | 2.39.5 (Apple Git-154) |
| GitHub CLI | 2.83.0; authenticated |
| uv | 0.12.3 |
| Project Python | CPython 3.12.13 |
| Project Node.js | 20.19.4 |
| Docker Engine | 29.6.1 |
| Docker Compose | 5.3.0 |
| PostgreSQL | 16.14, containerized on `127.0.0.1:55432` |
| gitleaks | 8.30.1 |
| osv-scanner | 2.5.0 |
| Semgrep | 1.172.0 |
| ShellCheck | 0.11.0 |
| actionlint | 1.7.12 |
| Codex CLI | 0.145.0; authenticated |
| Claude Code | 2.1.128; authenticated |

## Executed proofs

| Proof | Result |
|---|---|
| Bash-declared readiness gate and PATH immutability regression | Pass |
| Required tool discovery and agent authentication | Pass |
| Docker engine, Compose validation, and project PostgreSQL health | Pass |
| GitHub, SAM.gov, and USAspending DNS/TLS/HTTP reachability | Pass; SAM and USAspending returned expected unauthenticated/bare-route HTTP 404 responses, which prove transport only |
| Repository contract tests | 3 passed |
| Ruff | Pass, zero findings |
| mypy strict mode | Pass, zero findings |
| gitleaks repository scan | Pass, zero findings |
| Planted synthetic secret blocked by gitleaks | Pass |
| Planted failing test blocked by pytest | Pass |
| osv-scanner against `uv.lock` | Pass, zero known vulnerabilities |
| Semgrep community rules | Pass after remediation, zero findings |
| ShellCheck and Bash syntax | Pass, zero findings |
| actionlint | Pass, zero findings |

## Defects found by the readiness exercise

| Defect | Detection | Correction |
|---|---|---|
| zsh `path` assignment silently mutated `PATH` in the initial inventory | Tool paths appeared missing after the assignment | Declared Bash and added a PATH immutability check |
| zsh `status` is read-only | Connectivity probe stopped early | Avoided shell-special variable names and moved checks to Bash |
| Empty `$@` expansion failed under macOS Bash 3.2 with nounset | First gauntlet launch stopped before checks | Added an explicit zero-argument branch |
| Script path idiom failed ShellCheck portability rules | Static check | Replaced with portable `CDPATH=''` form and checked `cd` failure |
| Ruff rejected repository test import spacing | Local gauntlet | Applied deterministic Ruff fix |
| GitHub Actions used mutable action tags | Semgrep blocking finding | Pinned action references to full commit SHAs |
| uv dependency resolution had no publication cooldown | Semgrep blocking finding | Added `exclude-newer = "7 days"` and refreshed the lockfile |

## Open evidence required for L2/L3

1. Create or select the GitHub repository and configure `origin`.
2. Push the hardening revision and obtain a green `Environment readiness` workflow run.
3. Enforce PR-only `main`, required checks, and prove a direct push is rejected.
4. Configure the SAM.gov key locally and as a least-privilege GitHub secret without
   displaying its value.
5. Execute brief/exam `0002` to prove staging, flags, telemetry, rollback, Critic
   separation, and zero manual infrastructure work.
