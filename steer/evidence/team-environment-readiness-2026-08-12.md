# Team Environment Readiness Evidence — 2026-08-12

## Decision

**Workstation and local delivery environment: PASS.**  
**Shared STEER team environment: PARTIAL / DEFAULT-CLOSED.**

The coding, testing, documentation, work-capture, and asynchronous communication
surfaces are established. Two platform controls remain unproven: enforced branch
protection for a private repository and the GitHub Projects flight board. Product work
does not receive a delivery-ready claim until those gaps are resolved or an explicitly
approved equivalent control is installed.

SAM.gov credentials are deliberately excluded from this decision; they are a live-source
prerequisite, not a team-environment prerequisite.

## Shared systems established

| Capability | Evidence | Result |
|---|---|---|
| Source of truth | Private `idrissenayat/federal-bd-platform` repository | Pass |
| Backlog capture | GitHub Issues, four STEER issue forms, setup/tracer and comparative-pilot milestones | Pass |
| Initial backlog | Issues for L2 setup, tracer `0002`, cohort freeze, and slice `0003` | Pass |
| Workflow visibility | STEER/Control/Setup labels; seven phase labels; three pending-gate labels; blocked state | Pass |
| Durable documentation | Repository docs map, contribution contract, team environment, communication policy, signals and reviews directories | Pass |
| Change review | Pull-request evidence template and CODEOWNERS | Pass; enforcement pending account capability |
| Communication | GitHub Discussions enabled; team huddle and signals inbox created | Pass |
| Security | Private repository, vulnerability alerts, automated security fixes, security policy, private-advisory route | Pass |
| Coding | Pinned Python/Node, `uv`, Docker Compose/Postgres, bootstrap, branch/worktree conventions | Pass |
| Testing | Local gauntlet, negative controls, CI workflow, immutable action pins, Dependabot cooldown | Local pass; corrected GitHub runner passed; verified-binary run passed in 47s |

## Live defects and constraints found

1. The first GitHub Actions run failed because gitleaks `v8.30.1` still declares the Go
   module path `github.com/zricethezav/gitleaks/v8`. The workflow used the newer
   organization name. The setup branch corrects the module path and upgrades the
   official GitHub actions to immutable Node 24-compatible release SHAs.
   The corrected runner passed all jobs. Scanner installation was then changed from
   repeated Go compilation to checksum-verified official release binaries to reduce the
   4m34s feedback cycle. The checksum-verified revision passed the complete GitHub runner
   in 47 seconds on pull request `#7`.
4. A documentation-only rerun then failed before checks because the anonymous GitHub
   release CDN returned HTTP 503 for actionlint across all curl retries. Tool downloads
   now use the workflow's read-only GitHub token through `gh release download`, while
   preserving SHA-256 verification.
2. GitHub rejected branch protection for the private repository with HTTP 403 and the
   explicit requirement to upgrade the personal account to GitHub Pro or make the
   repository public. The repository remains private; visibility was not weakened.
3. GitHub Projects API access requires `read:project` and `project` scopes not present in
   the current CLI token. The signed-in browser fallback was unavailable because the
   in-app GitHub session is logged out.

## Remaining L2 proofs

- Merge the green setup pull request through the PR path.
- Upgrade/enable private-repository branch protection or approve and implement an
  equivalent enforceable repository control; then prove direct push rejection.
- Authorize GitHub Projects access or sign in to GitHub in the in-app browser; create and
  link `STEER Flight Board`.
- Run the fresh-context Critic readiness proof and preserve its PR review evidence.
- Tie a sample Gate approval to an authenticated GitHub identity and exact revision.

The infrastructure tracer `0002` remains the proof for staging, flags, telemetry,
rollback, and zero manual infrastructure work. Those are L3, not silently included here.
