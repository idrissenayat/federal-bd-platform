# Issue #70 Gate 3 closure packet — staging v25

## Exact target

- Amended Gate 2 Exam revision: `482a56abf5ecc262428d02613726a5c9f2c04d0d`
- Amended Gate 2 Exam SHA-256: `66a959826d327f8f4e7f69a95e438c93a76f48e45a9babc49b02708f3cfe98d5`
- Release-target commit: `d051ec93d700c6151e742c195eb2e40cfda51d8c`
- Staging source commit: `52f8e6d96a129acfc890f3ea0691509aa75fa0e1`
- Canonical staging project/version: `appgprj_6a83763dc1148191b439c0795aa86a1c`, version 25
- Restored Luna deployment: `appgdep_6a85f5f36a548191a21e353e6ef1c4ad`
- Final environment revision: 14
- Runtime model: `gpt-5.6-luna`
- Persisted implementation revision: `d051ec93d700c6151e742c195eb2e40cfda51d8c`

## Fresh verification result

The exact v25 target is ready for independent Gate 3 review. Build, typecheck, lint, repository-contract CI, and 146/146 local tests pass. The canonical staging site is owner-only and restored to Luna after the controlled failure case. No production deployment, migration, or signal table was created.

The exact hosted 20-case denominator passes 20/20. Fifteen authenticated browser submissions produced real Luna proposals, four unsafe submissions were rejected before provider invocation with the required bounded reason codes, and one controlled model-policy mismatch produced an honest `SAFE_FAILURE` with one enabled retry and no proposal or work item. Server telemetry measured capture p95 at 316 ms against the 750 ms limit and proposal completion p95 at 12,803 ms against the 60,000 ms limit. The 15 proposals bind the exact `d051ec9` implementation revision, model, attempt, proposal digest, contributor-source digest, and three-event lifecycle.

The pre/post invariant comparison read every row in 40 protected non-signal tables in five-row pages. Both snapshots contain 572 rows and compare byte-for-byte with `changed: []`. Unsupported-fact and work-item-side-effect counters are zero.

The accessibility matrix executes actual hosted empty, processing, ready, failure, retry-control, and shared conflict/permission rendering at 320 px. The safety-rejection test exposed an alert outside its open modal; commit `d051ec9` moved capture errors into the intake, preserved the draft, focused the alert once, and kept Dismiss inside the modal focus loop. The fixed exact target has zero axe violations in every hosted state, no horizontal overflow, predictable focus containment/restoration, named live status/alert semantics, and passing explicit WCAG AA contrast checks. The otherwise unreachable immutable-source stale branch is covered by a controlled exact-source render using the deployed workspace primitives and its source-bound `role=status`, `aria-live=polite`, and governed regeneration control.

## Prior Critic blockers closed

1. Repository contract: GitHub Actions run `32284114771`, job `96169529666`, passes on `d051ec9`.
2. Hosting target: the PR retains production project metadata; staging binding exists only in the pushed staging source commit.
3. Retention: governed hold/release, policy-bound service authorization, content-free run evidence, atomic eligible deletion, and append-only controls are implemented in migration `0022_signal_retention.sql` and covered by the green suite.
4. Accessibility: exact v25 matrix is preserved in `0070-hosted-accessibility-matrix-v25.json`.
5. Hosted denominator: exact v25 cohort is preserved in `0070-hosted-staging-cohort-v25.json`.

## Evidence digests

- `0070-hosted-staging-cohort-v25.json`: SHA-256 `0675cce0a378f4884e2a4093e29fc45dda92e23678d3f2533d4f927c82281bd4`
- `0070-hosted-accessibility-matrix-v25.json`: SHA-256 `062a7dadb100ec5bfd8e6f53433b1b7fb78469528bfb5db44c536b493d854dc7`

## Production non-mutation

The production project remains `appgprj_6a7ce092d7608191b97e3becd405c373`. Its newest saved version remains version 36 at source `8aa6e634c4b04f2198ec0941a7e8d5c7bee88d4f`; its D1 overview contains 34 tables and zero `signals`/`signal_*` tables. Issue #70 performed no production write or deployment.

One staging SIWC bypass token was exposed to the local tool transcript during earlier metadata inspection and was immediately rotated; the old token is invalid and no token or API credential is present in Git or this evidence packet.

GATE 3: PENDING INDEPENDENT CRITIC RULING AND PRODUCT LEAD APPROVAL.
