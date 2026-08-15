# Final independent Test retest — STR-024 Gate 2 Exam

**Exam design result:** `PASS` — 41/41 acceptance IDs pass independent design review.

**Critic `414f297` result:** `PASS` — all three narrowed blockers have deterministic
design dispositions in the exact corrected target.

**Gate 2 readiness recommendation:** `BLOCK` — the prepared evidence remains unsigned/
unratified and one final fresh Critic review plus the authorized human decision remain.
This Test evidence does not approve Gate 1 or Gate 2.

**Review role:** independent STEER Test Agent, final retest

**Review time:** 2026-08-15T21:27:46Z / 2026-08-15T17:27:46-04:00

**Exact corrected Architect target:** `254226bbb99a07844262d609b11d1b0b36281f9f`

**Exam blob / SHA-256:** `e801b4224282b318571fc2de07261021b1ef8924` /
`f958004b4255827115ae45e236794ce49a91a8cc8b232a12cff776b1b5ee422e`

**Critic recheck:** `414f297932643f76e7435195b93b035e9bee5b07`

**Prior independent retest:** `82c2fe5b4538bb2906038f8f1e56db5d4db9bc06`

**Corrected supervisor boundary:** `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`

**Frozen Brief:** `5c0db389d1b0e9fa492a33930febcf4d1c067cb0`

**Receipt template blob / SHA-256:** `bc344db6fea26cbb103ee9e4f1794ef0b318c671` /
`be39cb98598751e4e1c0e3f16acf12732d1c0c3a2f83e71a2fab8d2fdae9851d`

**Test branch:** `codex/str024-final-independent-retest-20260815212426`

**Authority boundary:** evidence-only retest. No Brief, Exam, receipt template,
operating-model document, implementation, app data, gate state, deployment, merge,
release, closure, or PR was changed or authorized.

## Identity and pre-implementation boundary

The fresh worktree began at the exact target. The execution surface identifies this as a
dedicated Codex test-agent task acting in the STEER Test role, but exposes no durable
STEER `run_id`, distinct platform-agent credential, exact model/provider identifier,
instruction digest, or tool-policy snapshot. Those fields remain explicitly unavailable
and are not invented.

This limitation does not invalidate Gate 2 design review. The measured workload,
attestation verifier, immutable event store, actual signing-oracle test, implementation
tests, bootstrap/load/restore/canary/accessibility traces, and adapter conformance must be
proved against the future build before Gate 3. Existing un-attested Architect/Test/
Critic artifacts remain excluded from agent-performance claims and cannot be backfilled.

Local tools: Git 2.39.5, uv 0.12.3, Python 3.12.13, Node 20.19.4, npm 10.8.2,
gitleaks 8.30.1, OSV-Scanner 2.5.0, and Semgrep 1.172.0.

## Integrity and ancestry

| Check | Result | Independent evidence |
|---|---|---|
| Exact target and remote | PASS | Initial `HEAD` and `origin/codex/str024-architect` both resolve to `254226bbb99a07844262d609b11d1b0b36281f9f`. |
| Frozen Brief bytes | PASS | Target and `5c0db389...` both use blob `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`, full SHA-256 `6a5dcf65e1ef6930c7964374d1aaf0220a0810c8d99022c2936c2cb1607c065c`, and 17,786 bytes. No Brief byte changed. |
| Frozen substantive body | PASS | Exact bytes before `GATE 1:` reproduce SHA-256 `cf6e63a869375415ba4013c675bf99a0cf298e19e8db46a3cd26680f8ffadc1a`, matching the receipt template. |
| Critic `414f297` preservation | PASS | Target file blob `5f64a03cd92b04e8bbe697497527a7c956a8c7d1` is byte-identical to the source Critic recheck. Equivalent content enters target history through `6469054`; the source sibling is not misrepresented as ancestry. |
| Prior Test `82c2fe5` preservation | PASS | Target file blob `56d9cdc02aa669f7576634c0f9dcf628ddb4290e` is byte-identical to the prior retest. Equivalent content enters through `f59f385`. |
| Exact `bcf4856` ancestry | PASS | `git merge-base --is-ancestor bcf4856f... 254226b...` succeeds; merge base is exactly `bcf4856f...`; merge commit `9d0beda` has `bcf4856f...` as its second parent. |
| Corrected boundary content | PASS | All seven files changed from the boundary branch base through `bcf4856f...` have byte-identical blobs at the target: AGENTS, CONTRIBUTING, OPERATING-MODEL, TEAM-COMMUNICATION, TEAM-ONBOARDING, agent roles, and Docs evidence. No post-merge operating-boundary file changed. |
| Target correction scope | PASS | After boundary incorporation, `254226b` changes only the STR-024 Exam, Architect evidence, and new pending Gate 1 receipt template. |
| Current acceptance inventory | PASS | 41 definition headings, 41 unique IDs, no duplicate definition: AUTH 7, LIFE 9, EVID 7, BOOT 5, UX 4, MET 4, NFR 5. |

## Critic `414f297` three-blocker retest

| Critic blocker | Design verdict | Verification |
|---|---|---|
| 1. Agent-scoped signer endorsement did not prove measured named-agent generation; holdout transport contradicted isolation | PASS | `AgentExecutionManifest/v1` is the only executable input. A separately administered hardware-backed measured workload binds root/boot/runtime/harness/config/ephemeral-key/manifest/nonce claims, disables debug/stdin/shared mounts/env overrides/unapproved network, decrypts one HPKE input, traces model/provider/tool/output digests, and signs only a sealed internal final buffer. The independent verifier rejects unmeasured channels, known bytes supplied through the legitimate workload/finalizer, arbitrary signing, replay, missing trace and post-sign edits. The claim is correctly limited to measured-workload generation and recorded provider response, not human-like model authorship. |
| 2. Corrected authority rule was not effective; detached receipt did not satisfy in-file policy | PASS design / BLOCK pending human evidence | Exact `bcf4856f...` is now unchanged ancestry and its narrow content is operative. The receipt template matches GATES/SOLO: signed platform export, authenticated Idriss Enayat countersignature, then a separately authorized signature-only Brief descendant changing only the Gate 1 audit/evidence field while preserving the frozen substantive-body hash. The target correctly leaves the original frozen Brief untouched and the template explicitly pending/non-authoritative. |
| 3. Fence timing, eligibility and scoring remained contradictory/selectable | PASS | Fence and write authority expire at 120 seconds, old writes fail immediately, UI becomes `stale — recovery pending`, 120–150 is expressly no-write same-agent recovery grace, and 150 without a new attempt commits `FAILED_BLOCKED/LEASE_STALE`. Pilot eligibility includes every predeclared cohort `AUTHORIZED` run with no analytic exclusions. Benchmark denominator is the first authorized run for each B01–B12; missing/failed/contaminated cases remain and score zero. `str024.scoring-manifest.v1` has fixed cases, assertions, points, hard-fails, principals, JCS digest and dual signatures with no selectable case/weight/exclusion/runtime field. |

**Critic `414f297` result: 3/3 design blockers closed.** The actual receipt signatures,
RAT decisions and signed scoring-manifest/ciphertext/oracle digests remain intentionally
external evidence rather than Architect-authored substitutes.

## Focused contract proofs

### Measured provenance and signing-oracle negative path

- PASS: Work Management signs exact run/agent/config/instruction/input/model/provider/
  tool/fence/destination/nonce/expiry claims.
- PASS: independent remote attestation gates credential/key release on ratified hardware,
  boot/runtime, harness and configuration measurements.
- PASS: plaintext, keys and semantic channels are unavailable to Codex/host/adapter;
  provider calls and any approved tool results are bound into the sealed trace.
- PASS: the finalizer has no caller-byte/digest signing API and signs only the traced
  internal output buffer.
- PASS: STR024-BOOT-001A explicitly sends known bytes through the legitimate workload/
  signing path and opens host channels; quote/workload/finalizer/verifier must reject.
- PASS: mixed human/supervisor patches remain separately signed and never untouched
  agent output.

### Holdout principal and one-way delivery isolation

- PASS: owner, fixture custodian `steer-test-fixture-custodian-v1`, evaluator
  `steer-test-evaluator-v1`, transport, and measured workload/evaluated agent are distinct
  principals; no evaluated agent is a custodian/evaluator/transport principal.
- PASS: evaluator verifies the workload quote and encrypts fixed-size padded input
  directly to the ephemeral workload key; Codex/transport relay only signed ciphertext.
- PASS: workload output is encrypted directly to the evaluator; oracle and scoring
  assertions never enter workload/runtime transport.
- PASS: plaintext, decrypted tokens, unpadded length or semantic summary exposed to any
  host/transport/prompt/tool/runtime principal is contamination and a hard fail.
- PASS: scoring starts only after committed output/trace; feedback releases only after
  signed final score; contaminated evaluations remain visible and rotate under a new
  signed manifest.

### Exact lifecycle timing

| Time from last accepted heartbeat | Required result |
|---:|---|
| 30 seconds | Heartbeat target. |
| 60 seconds | Warning begins; current fence remains subject to the 120-second expiry. |
| 120 seconds | Lease/write fence expires; old writes fail; UI is stale; control plane enters `RETRY_WAIT`. |
| 120–150 seconds | No-write recovery grace; only same assigned, valid agent under unchanged authorization and remaining budget may start a higher-fence attempt. |
| 150 seconds without retry | Control plane commits `FAILED_BLOCKED/LEASE_STALE`. |

PASS: there is no longer a 120-versus-150 write-authority ambiguity.

### Exhaustive eligibility and fixed scoring

- PASS: pilot eligibility is set before authorization by purpose/cohort/version and every
  resulting authorized run remains in lifecycle, useful-output and first-pass
  denominators. Failed, stopped, contaminated, rolled-back, retried, touched, edited and
  telemetry-incomplete runs cannot be removed after the fact.
- PASS: unauthorized requests remain attempt-level guardrails and transport replays map
  to one run. Benchmark/pilot/operations purposes cannot be retrospectively relabeled.
- PASS: benchmark denominator is exactly 12 first case-runs, B01–B12. Diagnostic reruns
  cannot replace them; missing/invalid/contaminated runs score zero.
- PASS: point totals independently reproduce: Functional 30, Contract 30, Evidence 25,
  Clarity 15, total 100. All 12 case identifiers appear at least once in the fixed Boolean
  rubric. Overall ≥90, each dimension ≥80%, complete evidence and zero hard-fails are
  mandatory.
- PASS: canonical RFC 8785 JCS manifest bytes bind exact Exam/candidate/principals,
  ciphertext/oracle/assertion digests and fixed points; owner and custodian sign them;
  optional cases, weights, exclusions and runtime selection are structurally absent.

### Gate 1 receipt/body/Brief compliance

- PASS template: exact Brief commit, blob, full SHA-256, substantive-body SHA-256,
  workflow, recorded approver/role/time/scope and all `steer.gate-receipt.v1` actor/
  sequence/session/batch/issuer/key/signature/verification fields are present.
- PASS default-closed: every unavailable field is `PENDING_PLATFORM_EXPORT`; the file
  states it is not authority, Codex/agents cannot fill it, and no gate is implied.
- PASS policy sequence: platform signs canonical receipt; Idriss Enayat authenticates,
  rereads and countersigns; a separate human-authorized signature-only descendant then
  records the in-file Gate 1 audit/evidence lines and passes CORE-11/session/batch checks.
- PASS integrity: target Brief is still the exact frozen blob. A future authorized
  descendant changes the audit/evidence field only and must retain body SHA-256
  `cf6e63a...`; it does not rewrite the immutable approved commit or substantive content.
- BLOCK current effectiveness: no platform export, countersignature or in-file approval
  descendant exists yet; the receipt correctly remains only a template.

## Current per-ID design matrix

Legend: completeness (`C`), falsifiability (`F`), authority separation (`A`), negative
paths (`N`), evidence requirements (`E`), and Brief/guardrail traceability (`T`). `P`
means the exact corrected Exam adequately specifies that dimension. Implementation proof
that properly follows Gate 2 is not treated as a design blocker.

| Acceptance ID | C | F | A | N | E | T | Design verdict | Final retest oracle |
|---|---:|---:|---:|---:|---:|---:|---|---|
| STR024-AUTH-001 | P | P | P | P | P | P | PASS | Exact authorized creation and default-deny transition table. |
| STR024-AUTH-002 | P | P | P | P | P | P | PASS | Forged/stale/cross-scope/held/Buzz denial before effects with audit. |
| STR024-AUTH-003 | P | P | P | P | P | P | PASS | Concurrent/delayed replay produces one run/effect with visible attempts. |
| STR024-AUTH-004 | P | P | P | P | P | P | PASS | Exact revision invalidation, fencing and digest-neutral exception. |
| STR024-AUTH-005 | P | P | P | P | P | P | PASS | Named governance/external powers remain human-only in every layer. |
| STR024-AUTH-006 | P | P | P | P | P | P | PASS | Principal ID/type and scoped credential defeat name/prompt/session confusion. |
| STR024-AUTH-007 | P | P | P | P | P | P | PASS | Immutable complete execution/config/tool/input snapshot with exclusions. |
| STR024-LIFE-001 | P | P | P | P | P | P | PASS | Exact assigned measured agent wins claim/fence; other agents/Codex denied. |
| STR024-LIFE-002 | P | P | P | P | P | P | PASS | Exact 60 warning, 120 fence/stale/retry, 120–150 no-write grace, 150 block. |
| STR024-LIFE-003 | P | P | P | P | P | P | PASS | Exact heartbeat cadence/rate/size/order/skew/content rules. |
| STR024-LIFE-004 | P | P | P | P | P | P | PASS | Safe progress cannot mutate authority or imply judgment/success. |
| STR024-LIFE-005 | P | P | P | P | P | P | PASS | Exact retry codes/count/delays/jitter and side-effect receipt. |
| STR024-LIFE-006 | P | P | P | P | P | P | PASS | Canonical taxonomy/owners and unknown-code safe stop. |
| STR024-LIFE-007 | P | P | P | P | P | P | PASS | Human/pre-claim stop, boundaries, deadlines, preservation and CAS races. |
| STR024-LIFE-008 | P | P | P | P | P | P | PASS | Exact health/revocation thresholds and human recovery authorization. |
| STR024-LIFE-009 | P | P | P | P | P | P | PASS | Terminal immutability and separate later human records. |
| STR024-EVID-001 | P | P | P | P | P | P | PASS | Exact run/revision/digest/snapshot/history/telemetry package; fail closed. |
| STR024-EVID-002 | P | P | P | P | P | P | PASS | Measured-workload manifest/quote/trace/finalizer proof; signer/relabel rejected. |
| STR024-EVID-003 | P | P | P | P | P | P | PASS | Exact usage/rate-card/unknown and server-time latency boundaries. |
| STR024-EVID-004 | P | P | P | P | P | P | PASS | Feedback binds human/run/attempt/output/evidence/agent/config/time/category. |
| STR024-EVID-005 | P | P | P | P | P | P | PASS | Distinct principals, signed fixed manifest, HPKE holdout/output and no oracle delivery. |
| STR024-EVID-006 | P | P | P | P | P | P | PASS | Immutable correction successors cannot rewrite prior results. |
| STR024-EVID-007 | P | P | P | P | P | P | PASS | Exact first B01–B12 denominator, promotion, contamination, canary and rollback. |
| STR024-BOOT-001 | P | P | P | P | P | P | PASS | Measured agent accepts one signed/encrypted manifest and emits sealed traced output. |
| STR024-BOOT-001A | P | P | P | P | P | P | PASS | Known bytes through legitimate signer plus host/channel/replay/edit attacks rejected. |
| STR024-BOOT-002 | P | P | P | P | P | P | PASS | Codex output cannot become review-ready/useful/quality/agent evidence. |
| STR024-BOOT-003 | P | P | P | P | P | P | PASS | Separate human-authorized intervention; source sealed; named successor only. |
| STR024-BOOT-004 | P | P | P | P | P | P | PASS | Unauthorized intervention denied/audited; platform repair separately scoped. |
| STR024-UX-001 | P | P | P | P | P | P | PASS | Field/target audience recheck, revocation, preview safety, ordering and outage. |
| STR024-UX-002 | P | P | P | P | P | P | PASS | Exact panel/states/text/control/principal/server-enforcement oracle. |
| STR024-UX-003 | P | P | P | P | P | P | PASS | Exact axe/focus/name/contrast/motion/live-region/browser/AT/viewport proof. |
| STR024-UX-004 | P | P | P | P | P | P | PASS | Injection/confusable/secret/mention/link content cannot trigger tools/authority. |
| STR024-MET-001 | P | P | P | P | P | P | PASS | Full versioned event set, ordering, denominators, missingness and minimization. |
| STR024-MET-002 | P | P | P | P | P | P | PASS | Exhaustive pilot eligibility and exact run/case metric denominators. |
| STR024-MET-003 | P | P | P | P | P | P | PASS | Stops/failures/touches/missingness remain; no survivor relabeling. |
| STR024-MET-004 | P | P | P | P | P | P | PASS | Exact unique-run cohort, lifecycle/useful result, replay guardrail and feasibility. |
| STR024-NFR-001 | P | P | P | P | P | P | PASS | Exact full load/p95/error/drop/provider/CI budget proposal. |
| STR024-NFR-002 | P | P | P | P | P | P | PASS | Exact threat/data/access/retention/deletion/export/dependency exception semantics. |
| STR024-NFR-003 | P | P | P | P | P | P | PASS | Exact integrity/availability/telemetry/RPO/RTO/restore/reconciliation/rollback. |
| STR024-NFR-004 | P | P | P | P | P | P | PASS | Public/synthetic boundary covers every run/test/evidence/export surface. |
| STR024-NFR-005 | P | P | P | P | P | P | PASS | Versioned conformance, fake migration, hard-control floor and honest portability. |

**Per-ID result: 41 `PASS`, 0 `BLOCK` for Exam design.** No regression was found in
the 38 IDs outside the three Critic focus areas.

## Repository, fixture, dependency, and application verification

| Check | Result |
|---|---|
| `./scripts/gauntlet.sh` | PASS in 11 seconds against the staged evidence tree: readiness 35 pass / 1 expected missing-SAM-key warning / 0 fail; Ruff pass; mypy pass; pytest 3 pass; gitleaks clean; `uv.lock` OSV clean; Semgrep 252 rules / 136 tracked files / 0 finding. |
| `./scripts/prove-gauntlet-blocks.sh` | PASS; planted secret and failing test were blocked. |
| `npm ci && npm run lint && npm test` in `flight-board/` | PASS; build successful, lint clean, render 1/1 and TypeScript tests 27/27. |
| Production npm audit | PASS; zero vulnerabilities. |
| Full npm audit / explicit OSV | QUALIFIED exactly per RAT-DEPS proposal: npm 2 high + 4 moderate dev/build nodes; OSV 2 high + 1 medium advisories across two dev packages; zero critical and zero production vulnerabilities. |
| Bootstrap hashes | PASS: instruction `4c039263...`, input `5181a165...`, output `ff89bcb4...` independently reproduce with the specified LF rules. |
| Scoring arithmetic/case coverage | PASS: 30/30/25/15 = 100 and all B01–B12 are represented. |
| Receipt hash checks | PASS: commit/blob/full/body hashes reproduce; template remains pending and unsigned. |

The SAM.gov credential warning is expected for this documentation-only offline review;
no credential or secret was requested, displayed, or added.

## Exact residual human/platform actions

Only these three action packages remain before an authorized human can decide Gate 2:

1. **Gate 1 evidence package:** the Work Management platform owner exports and signs all
   canonical `steer.gate-receipt.v1` fields; Idriss Enayat verifies the public key and
   receipt and countersigns through an authenticated repository action; then an
   authenticated human authorizes the signature-only Brief descendant required by
   GATES/SOLO. Automated checks must prove only the Gate 1 audit/evidence field changed,
   the body hash stayed `cf6e63a...`, session/batch/sequence rules pass, and no Gate 2 is
   implied.
2. **Exact-revision ratification/evaluation package:** Idriss Enayat and any necessary
   qualified identity/security, runtime/Ops, privacy/data, reliability, Test,
   accessibility/design and security co-ratifiers record `RATIFIED` or `REVISE` for
   RAT-IDENTITY, RAT-LIFECYCLE, RAT-PRIVACY, RAT-SLO, RAT-EVAL, RAT-CANARY, RAT-A11Y and
   RAT-DEPS against exact Exam `254226b...`. The owner/custodian must attach the signed
   RFC-8785 B01–B12 scoring manifest, aggregate digest, input/oracle/assertion ciphertext
   digests and custody/access evidence. Silence or this Test report cannot ratify.
3. **Final independent/human cycle:** a new fresh-context Critic reviews exact
   `254226b...` and challenges these three dispositions. Only after that Critic, this
   Test evidence, the receipt package and ratifications are complete may the authorized
   Product/Tech human record a Gate 2 decision in the required separate session.

Implementation of the measured workload/attestation/event/control-plane system and its
negative/load/restore/canary/accessibility/adapter proofs is future build/Gate 3 evidence,
not an additional Gate 2 design decision.

## Final recommendation

**Exam design: PASS. Critic `414f297` blockers: PASS 3/3. Gate 2 readiness: BLOCK pending
the three exact human/platform packages above.** The frozen Brief and substantive body
are intact, `bcf4856f...` is true unchanged ancestry, the receipt is compliant but
deliberately ineffective while pending, all 41 IDs pass, and checks are green or exactly
match the proposed dependency exception. This evidence remains advisory only.
