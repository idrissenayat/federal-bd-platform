# Issue 70 independent Critic review — BLOCK

**Reviewed at:** 2026-08-19T16:46:24Z

**Issue branch target:** `549b834a66129f15f4c6f655f114dc43bb4d3a76`

**Deployed staging source:** `c5a0e92ad85cbf65e08b2cdc29168cb673620a8f`

**Amended Gate 2 target:** `482a56abf5ecc262428d02613726a5c9f2c04d0d`

**Amended Exam SHA-256:** `66a959826d327f8f4e7f69a95e438c93a76f48e45a9babc49b02708f3cfe98d5`

## Recommendation

**BLOCK Gate 3.** The implementation is substantially fail-closed and the deterministic suite is green, but the exact target is not releasable yet. Five bounded gaps remain: the required repository check is red, the merge target points at the staging Sites project, the promised signal-retention deletion/hold path does not exist, the frozen accessibility matrix was not executed across all required states, and the 20-case denominator is an isolated mocked-D1 ledger rather than the approved staging cohort.

## Findings

### 1. Required repository contract is red

PR #71 check `repository-contract` failed in Actions run `32277270474`. The failing gitleaks step reports four `generic-api-key` findings in committed `flight-board/tests/signal-api.test.ts` idempotency-key fixtures. These appear to be detector false positives rather than credentials, but CORE-01/CORE-03 and the repository contract require a green result before Gate 3.

Bounded remediation: rewrite the four fixture values so they do not match the generic-key detector, or add a narrowly justified fingerprint-level allowlist; rerun the exact required check to green without weakening secret scanning.

### 2. The PR merge target rewires hosting from production to staging

Base `main` binds `flight-board/.openai/hosting.json` to production project `appgprj_6a7ce092d7608191b97e3becd405c373`, while issue target `549b834` binds it to staging project `appgprj_6a83763dc1148191b439c0795aa86a1c`. The file SHA-256 changes from `d1bfc5a14223781cc99a635337b8441c23733c49254e9293e926a8fdd82b5e0f` to `ecff9175dd239e82fc388a473995ad5d3e03e967fb0c9afea5cea2603e064969`. Merging this exact PR would make the repository's canonical hosting metadata target staging, contrary to the stated staging-to-production release boundary and CORE-05.

Bounded remediation: remove the staging-only hosting metadata change from the issue branch. Keep the staging project binding only in the staging source/deployment path, then build and bind fresh evidence to the corrected release target.

### 3. The 90-day privacy rule has metadata but no governed deletion path

Capture writes `retention_delete_after`, but the implementation has no signal retention run, retention authorization, or signal legal-hold store. The `signals`, `signal_events`, `signal_proposals`, and `signal_sources` delete triggers instead reject every delete unconditionally. That does not satisfy the Brief's 90-day deletion/hold promise or PRIV-03's required deletion path.

Bounded remediation: implement a POD-scoped, authorized signal-retention path that checks expiry and active holds, deletes the full linked signal record set atomically, records content-free run evidence, and is covered by hold/release/eligible/not-yet-eligible/cross-POD tests. Reuse the approved provider-recovery ruling without weakening immutability outside that path.

### 4. Acceptance test 12 is not closed across the frozen state matrix

The durable hosted evidence records one Ready workspace keyboard/axe observation and describes an earlier safe-failure view. The committed automated checks are a small JSDOM focus-cycle test, static source assertions, and explicit color-pair calculations. There is no durable automated-axe plus agent-operated keyboard/focus/accessibility-tree/320 px result for every required state: empty, processing, ready, stale, conflict, permission, failure, and retry. The evidence therefore cannot support its current "complete" accessibility claim.

Bounded remediation: execute and preserve the exact eight-state accessibility matrix on the exact staging target, including automated axe, keyboard order/trap/restoration, one-time live announcements, accessibility-tree reading order, contrast, and 320 px layout. Fix any finding and rerun the full matrix.

### 5. The approved 20-case staging denominator is not the submitted ledger

`0070-case-ledger-c5a0e92.json` is internally consistent and reproducible, but its runner invokes `handleApi` against isolated in-memory D1 stores and mocked provider outcomes. It is not the Brief's "first 20 frozen staging submissions." The hosted evidence contains a credential failure, one connected Luna proposal, and one rollback/in-flight proposal, not the approved 20-case staging cohort or the required 18-of-20 outcome measurement.

Bounded remediation: run the frozen denominator through the canonical staging deployment and preserve case-level request/result, attempt/proposal/source digests, latency, usage/cost, content-free telemetry, and protected-table projections. Provider-fault cases may use an explicit non-production controlled adapter only if the exact staged service path and its default-off isolation are demonstrated. Otherwise, obtain a new exact Gate 2 ruling before changing the measurement method.

## Positive independent checks

- The amended Exam bytes at `482a56a` independently hash to the approved SHA-256 above; Gate 1 and amended Gate 2 bindings resolve exactly.
- Fresh local validation at issue target `549b834`: production build PASS; 145/145 tests PASS; TypeScript PASS; ESLint PASS; production dependency audit reports 0 vulnerabilities.
- Fresh ledger execution against implementation revision `c5a0e92`: 20/20 PASS, capture p95 2 ms, controlled generation p95 15 ms, content-free telemetry true, and protected-table hashes unchanged. Fresh-run artifact SHA-256 was `9f1f2af9d55a8eb1dc6960c8b2d1935fa447e37a022b05543b128143f1d16403`.
- The committed ledger SHA-256 is `29c3bc25a7448194744da511745513cc722dc90b0e2197978c4c549e4065dcbe`; rollback evidence SHA-256 is `442a56b93fed79b744719e8efdb9b7d82b875bfe14f2ebedb4c5e767dd8b4e04`; staging narrative SHA-256 is `0f6b05b84f3b557e8601b4c8277fba75456a004bb6bf908e51397994aaf289f0`.
- Sites inspection confirms staging version 22 is bound to exact source `c5a0e92` and is owner-only. Its D1 contains the six signal tables.
- Current production inspection confirms project `appgprj_6a7ce092d7608191b97e3becd405c373` has no signal tables and was last updated before issue 70 staging work. No production mutation was performed by this review.
- The implementation enforces POD scoping, strict input/output allowlists, pre-provider safety rejection, one bounded retry, source classification/downgrade, immutable originals/events, content-free telemetry, and zero work-item/decision/review/dispatch/economics mutations in the controlled ledger.
- The declared tags cover the final diff domains; no additional Critic tag is required.

This report does not authorize merge, production deployment, Release, closure, or Gate 3.
