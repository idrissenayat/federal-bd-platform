# STR-028 independent Gate 3 Critic review — target `d704024`

## Outcome

**BLOCK Gate 3.** Production must remain untouched.

The exact implementation target builds and its 143-test target suite passes, and the
privacy-policy activation boundary is now concretely implemented and exercised in
owner-only staging. However, the complete Gate 3 result is **implementation FAIL / Gate
3 BLOCK** for two independently reproduced release blockers:

1. the required 20-case AT-18 ledger was synthesized from hard-coded expected values
   and static server rendering rather than produced by executing the frozen cases from
   authoritative response receipt through visible client feedback; and
2. Work Management can sign `REVIEW_TARGET_READY` with `clean_target_verified: true`
   without resolving or recomputing the Git commit object or artifact bytes. Staging
   proves the gap because it accepted the known-wrong preliminary commit-object digest
   as a second live `REQUESTED` assignment.

The final evidence commit also does not reproduce its claimed green suite and lacks
complete state-specific AT-17 and raw AT-19 evidence. These evidence defects are
separate from the now-PASS privacy activation behavior.

This is advisory Critic evidence only. It is not a human Gate 3 ruling and grants no
merge, deployment, release, closure, or production authority.

## Exact reviewed scope and fingerprint

- implementation: `d7040249d2f9d2e01f49b0cd944a2a547dc578f5`
- evidence commit: `9c1609bbcb6440d5a67dfcaaa12d1b2c2218fd01`
- approved Brief: `0f83de8248771d35292ee57b56186493b5b71b1a`, SHA-256
  `4776f295226a75ad17651efafb86b698825bdde2c177ed07a231903d52c0f7af`
- frozen Exam: `1be1182774071b4be7ba42f6ec3027f0f0b30e9a`, SHA-256
  `d29c3922d3ed0e6dd1f3ee736c10d5db4a4ec806028614422bbb00042283d7b8`
- complete inventory: `4dd787ca1eb9b9d8a841bb48cffca9502eaa8c14`, SHA-256
  `c97bab72124018569f7be917a36b98cce9a064f8795c83d4ae2790bd0844919d`
- review packet SHA-256:
  `caf073808cc225d08bfb8a8c9a2d1a772f1c4e122739a6a3bb924595c00bf99b`
- measured-ledger SHA-256:
  `f490e5388d2afcf0e371d2d80740f965df9aaa23b37cf6aca51430b9da1f3331`
- staging version 15 archive SHA-256:
  `765ee2b41fcbdd6bd2cd2a7d893668bf8099d2c1f198ceb480983ebb63f723e8`
- production baseline: version 34, source
  `9c245083a8101de0c631c9dc92937765e12d39aa`
- canonical scope-manifest fingerprint (SHA-256 over the newline-delimited scope
  values above):
  `07df4698af8e3efb7dad9aa57ba9903b35d2dfad02ddb7dacbebe32edca6af7e`

## Acceptance mapping

`PASS` below means the implementation/evidence for that numbered oracle was
independently sufficient. `BLOCK` means the frozen oracle or its required evidence was
not satisfied; passing lower-level tests are noted rather than treated as a substitute.

| Exam item | Result | Independent mapping |
|---|---|---|
| AT-01 | **BLOCK (evidence)** | Genuine server fixtures cover SAVE-01..04 and staged SAVE-01/02 showed authoritative persistence, but the final ledger does not execute or observe all four initiating-drawer, activity, reload, announcement, and focus oracles. |
| AT-02 | **PASS** | FAIL-01 and FAIL-02 server fixtures preserve authority; staging observations record typed 409/validation feedback, preserved attempted input, focused inline error, and no overwrite. |
| AT-03 | **BLOCK (evidence)** | Deterministic ordering-unit tests cover ORDER-01..04, but the required terminal UI observation for each case is only hard-coded in the ledger, not captured from executed client flows. |
| AT-04 | **PASS** | Source/tests expose pending, missing-item, reload-error, and action-local status regions; 320x800 staging measurements report drawer containment after the final source correction. |
| AT-05 | **PASS (isolated fixture)** | Dispatch fixture exercises one receipt/outbox, reservation/start, verified relay delivery, signed DELIVERED and ACKNOWLEDGED order, and complete receipt bindings. The live staging row intentionally remains QUEUED and is not substituted for the synthetic full lifecycle. |
| AT-06 | **PASS** | Exact dispatch/ack replay returns the original identity and rejects changed bindings without a second durable lineage. |
| AT-07 | **PASS** | Signed service read and exact enrolled-agent acknowledgement work without a human UI session; wrong-key/binding cases fail closed. |
| AT-08 | **BLOCK (evidence)** | Accessible control/live-region code, contrast/axe checks, narrow containment, and generic human keyboard/VoiceOver wording exist, but the single named DISP-04 assistive-tech execution with its exact receipt/outbox/claim/run and second-ack oracles is not durably recorded. |
| AT-09 | **PASS** | JCS-SHA-256 authorization and acknowledgement replay reuse the original receipt/event and create no second action. |
| AT-10 | **PASS** | CAS, unique identity, reservation fencing, concurrent submission, active-lease, and terminalization/start ordering are exercised in isolated database fixtures. |
| AT-11 | **PASS** | The uncertain-send fixture verifies relay discovery, signature/bindings, backfill without resend, and one lineage. |
| AT-12 | **PASS** | F03-A..F03-F reset isolated seeds and assert typed diagnostic-only rejection with zero receipt/outbox/attempt/send/run. |
| AT-13 | **PASS** | F04-A..F04-E exercise post-receipt reservation invalidation, signed terminalization/diagnostic, and no start/send/state/run/requeue. |
| AT-14 | **PASS** | R04-A..R04-F exercise isolated stale-binding branches, explicit reauthorization, one same-lineage successor, and no duplicate run. |
| AT-15 | **PASS for dispatch signing** | Dispatch lifecycle tests cover JCS/SHA-256/BIP-340 envelopes, key/status rules, predecessors, versions, authorities, relay proof, and adversarial rejection. The separate review-target-ready authority defect is governed by the Brief and Exam evidence-handoff contract and remains a Gate 3 blocker even though it is not the dispatch-event AT-15 oracle. |
| AT-16 | **PASS** | The immutable inventory now covers dispatch/review/policy records, deletion, holds, replica/backup recovery, and no-PII constraints. Staging policy v2 is ACTIVE through the authenticated endpoint and binds the exact inventory/ruling; environment revision 2 contains no test privacy bypass. Retention/hold/deletion fixtures pass at the exact target. |
| AT-17 | **BLOCK (evidence)** | Axe, contrast, semantic markup, narrow layout, and a human keyboard/VoiceOver statement exist. The human statement does not separately exercise success, validation, conflict, transport, blocked, pending, empty, and reload states as frozen, and static source/SSR checks are not equivalent screen-reader observations. |
| AT-18 | **BLOCK** | The ledger generator hard-codes outcomes, transport, zero side effects, substep PASS, terminal count, and recurrence counts, then times `renderToStaticMarkup`; it does not execute the 20 frozen cases or measure authoritative-response receipt to painted client feedback. Staging telemetry contains named rows for only SAVE-01, SAVE-02, FAIL-01, and FAIL-02. |
| AT-19 | **BLOCK (evidence)** | Sites confirms saved versions 14/15 and the final restored version-15 deployment; current D1 rows corroborate preserved identities. The packet provides only prose totals/timings, no raw rollback/restore deployment receipts or before/during/after snapshots, and no post-rollback drawer pending/success/failure smoke required by the frozen oracle. |

## Material findings, severity ordered

### Blocker 1 — AT-18's “measured” ledger does not execute or measure the frozen cases

`flight-board/scripts/measure-str028-case-ledger.ts:19-40` defines each expected
outcome and transport result. At `:55-83`, the generator only renders
`InlineActionFeedback` through React's server-side `renderToStaticMarkup`, uses that SSR
duration as feedback latency, and unconditionally writes `forbidden_side_effect_count:
0`, one terminal observation, every substep `pass`, and case `result: pass`. At
`:86-103`, it derives p95 from those SSR timings and hard-codes all error/duplicate
counters to zero. `flight-board/tests/str028-case-ledger.test.ts:8-48` then verifies the
shape and those asserted values; it does not execute the underlying cases.

This contradicts Exam lines 50-84 and AT-18 at lines 359-380: latency must begin when
the authoritative response is received and end when the local result is visibly
rendered, with actual IDs/counts, side effects, telemetry, and exactly one terminal
observation from every executed case. The staging database independently contains
case-labelled telemetry for only SAVE-01, SAVE-02, FAIL-01, and FAIL-02, not the fixed
20-case denominator.

**Shortest falsifiable remediation:** run the existing genuine server/dispatch fixtures
through one non-production browser-and-D1 harness for the exact frozen seeds. For each
case, reset its isolated database, submit the real client action, capture the response
receipt timestamp and the next painted named local status/error, query actual receipt,
outbox, event, attempt, claim/run and forbidden-side-effect counts, and capture focus and
announcement state. Write the ledger only from those captured assertions; any missing
field or failed oracle must make the case fail and the command exit nonzero. Persist and
query the bounded telemetry so all 20 case IDs have exactly one terminal observation
and the two p95 values are computed from the client boundary. This needs no production
data or deployment.

### Blocker 2 — `REVIEW_TARGET_READY` is a self-attested clean claim

`flight-board/lib/review-lifecycle.ts:61-76` validates OID/hash syntax, URL shape,
artifact ordering, and the manifest's self-consistency, but never resolves the commit
or recomputes the commit-object/artifact bytes. `flight-board/worker/api.ts:2060-2094`
accepts that client packet and signs `REVIEW_TARGET_READY` with
`clean_target_verified: true`. The server test itself supplies an arbitrary
`"b".repeat(64)` commit-object digest (`work-economics-server-controls.test.ts:151-163`)
and successfully creates the assignment (`:1059-1078`).

The staging database is direct negative proof: the wrong-header digest created
assignment `f4a525...`, three signed events, and `REQUESTED` state, followed by corrected
assignment `ccd80c...`, also `REQUESTED`. Both target-ready events claim
`clean_target_verified: true`; neither assignment has an application-level superseded
or rejected disposition. Immutable retention of the rehearsal is correct, but calling
it non-authoritative in prose does not revoke its live signed request.

This violates Brief lines 26-50 and 88-98 and the Exam's exact two-phase handoff
contract: the target must be independently verified before `REVIEW_TARGET_READY`, and a
mismatch must be rejected before append or side effect.

**Shortest falsifiable remediation:** before the assignment transaction, have Work
Management resolve the exact repository commit and artifact bytes and recompute the Git
object-header SHA-256, sizes, artifact SHA-256 values, URLs, and canonical manifest; or
verify an independently signed target-verifier receipt containing those recomputed
values from a trusted, enrolled verifier. Bind that verifier receipt digest and exact
values into `REVIEW_TARGET_READY` instead of a boolean clean assertion. Add a negative
test using the known header-omitting digest and assert a typed rejection plus zero
assignment, events, activity, or notification. Append an explicit rejected/superseded
event/state to the preliminary staging assignment without deleting history, then prove
only the corrected assignment is review-authoritative.

### Blocker 3 — Final evidence is not fully reproducible and omits frozen AT-17/AT-19 observations

The exact implementation target independently passes 29 JavaScript plus 114 TypeScript
tests. The final evidence commit does not: it reproduces 29/29 JavaScript and 113/114
TypeScript tests because `work-economics-server-controls.test.ts:22-27` loads the mutable
current case-evidence file while expecting the immutable `d9dbe0b...` digest; activation
then returns `PRIVACY_POLICY_EVIDENCE_UNRESOLVED`. This is a fixture/evidence-binding
failure, not a failure of the staged ACTIVE policy.

Separately, the human accessibility sentence in case evidence lines 92-95 is generic
and does not record all eight AT-17 states. The rollback assertion at lines 60-66 gives
timings and invariant totals but no raw transition receipts/snapshots and does not record
the required post-rollback pending/success/failure drawer smoke. Sites metadata confirms
that versions 14 and 15 exist and that final version 15 is live, but cannot independently
establish the asserted intermediate deployments, timings, or smoke observations from
the packet supplied.

**Shortest falsifiable remediation:** make the privacy test load the exact ruling bytes
from immutable commit `d9dbe0b...` (or a checked-in immutable fixture whose digest is
verified) rather than the evolving case-evidence path, then record a clean evidence-
commit run. Add a state-by-state keyboard/VoiceOver table for the eight frozen outcomes.
Attach the rollback and restore deployment IDs/timestamps plus before/during/after D1
identity/hash snapshots and a post-rollback pending/success/failure drawer smoke record.

## Checks independently reproduced

- Reconstructed the target Git commit object with the `commit <length>\0` header:
  SHA-256 `346f45060d7f7815c115e28b9700e0de6f595f7e3b6971aff728021b9fb192f5`.
- Recomputed all 20 target artifact sizes/SHA-256 values and the RFC-8785-style
  canonical manifest:
  `99a5f291a1ad24cbd41047115f2391afadec952a42dd03c03328ed733c93ff48`.
- Confirmed evidence commit `9c1609b...` is the immediate child of target `d704024...`
  and changes only two tests and three evidence artifacts.
- Confirmed staging packaging commit `ac142b7...` matches every target artifact; its
  only `flight-board/` difference from the target is the staging project ID in
  `.openai/hosting.json`.
- Recomputed packet, ledger, approved Brief, frozen Exam, inventory, ruling, and prior
  binding digests. The corrected assignment/manifest hashes are exact.
- Exact target suite: build PASS; 29/29 JavaScript and 114/114 TypeScript PASS.
- Final evidence commit suite: build PASS; 29/29 JavaScript PASS; 113/114 TypeScript
  PASS; privacy fixture FAIL as described above.
- Typecheck PASS; lint PASS; production dependency audit PASS with zero vulnerabilities.
- Sites read-only verification: staging is custom owner-only, version 15/archive/file
  count/packaging commit match the packet, deployment succeeded at environment revision
  2, and the test privacy bypass is absent.
- Staging D1 read-only verification: policy v2 ACTIVE binds the exact inventory and
  ruling; one dispatch receipt, one QUEUED outbox row, and one signed v0 event exist;
  two REQUESTED review assignments and six signed events exist; case-labelled telemetry
  is not a 20-case set.
- Production read-only verification: version 34/source `9c245083...` remains current;
  production has no STR-028 dispatch/review/privacy schema tables. No production write,
  deployment, or mutation was performed.

## Residual risks and required human decisions

- The authenticated provider-recovery ruling and staging ACTIVE activation no longer
  require a new product decision. A future production activation remains a separately
  authorized release operation and must not occur while Gate 3 is blocked.
- A human owner must decide the governance treatment of the preliminary staging review
  request, but the safe technical default is append-only rejection/supersession rather
  than deletion; until then, two signed live `REQUESTED` authorities remain ambiguous.
- Human keyboard/VoiceOver evidence is still required for the exact eight-state AT-17
  matrix; automated semantics/axe/contrast do not replace that judgment.
- Rollback/recovery timing and smoke evidence needs human/operator attestation bound to
  raw deployment and D1 snapshots.
- Gate 3 remains human-owned after all blockers are corrected and a new independent
  Critic review is performed against a newly exact-bound target/evidence packet.

## Required next action

Keep production unchanged. Replace the synthetic AT-18 generator with an executed
non-production case harness and ledger; implement independently verifiable
`REVIEW_TARGET_READY` plus append-only invalid-assignment disposition; fix the immutable
ruling test fixture; complete AT-17 and AT-19 raw evidence; rerun the exact target and
evidence suite; then request a fresh independent Gate 3 Critic review. Recommendation:
**BLOCK**.
