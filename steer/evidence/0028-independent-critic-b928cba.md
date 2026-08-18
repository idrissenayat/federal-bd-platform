# STR-028 independent Gate 3 Critic review — target `b928cba`

## Outcome

**BLOCK Gate 3. Production must remain untouched.**

The implementation target is internally green: build, 154 tests, typecheck, lint, and
production-dependency audit pass; the exact Git object, all 20 target artifacts, manifest,
and enrolled Test-Agent verification signature independently reproduce. The prior
privacy-policy activation and self-asserted `REVIEW_TARGET_READY` blockers are corrected,
and agent-operated hosted accessibility evidence is sufficient without asking the human
to repeat the test.

Two evidence-contract blockers remain:

1. **AT-18 is not an executed end-to-end 20-case ledger.** Genuine server/unit oracles
   pass, but the ledger generator disconnects each oracle from a separately fabricated
   client feedback render, starts latency at render rather than authoritative response
   receipt, and hard-codes outcomes, authority assertions, substep results, and zero
   counters.
2. **AT-19 lacks the frozen rollback smoke and full no-duplicate/in-flight proof.** The
   exact Sites v18 → v17 → v18 deployment and the recorded table snapshots are credible,
   but the evidence does not execute post-rollback pending/success/failure action flows
   and does not snapshot the receipt/outbox/event/attempt/claim/run/audit identities that
   the Exam expressly requires preserved and nonduplicated.

This Critic result is non-owning review evidence. It does not approve Gate 3 or authorize
merge, production deployment, release, closure, or a human ruling.

## Exact scope and independent fingerprints

- implementation: `b928cba7e9d486c9f30f212c452814185f8025da`
- reviewed evidence branch head: `5fa69aa32c60b697bf70358203db17ade979a2eb`
- approved Brief: `0f83de8248771d35292ee57b56186493b5b71b1a`, content SHA-256
  `4776f295226a75ad17651efafb86b698825bdde2c177ed07a231903d52c0f7af`
- frozen Exam: `1be1182774071b4be7ba42f6ec3027f0f0b30e9a`, content SHA-256
  `d29c3922d3ed0e6dd1f3ee736c10d5db4a4ec806028614422bbb00042283d7b8`
- complete inventory: `4dd787ca1eb9b9d8a841bb48cffca9502eaa8c14`, content SHA-256
  `c97bab72124018569f7be917a36b98cce9a064f8795c83d4ae2790bd0844919d`
- provider-recovery ruling: `d9dbe0b70e812f680ae23fad2ce4ffafc6e65229`, content SHA-256
  `12522b22dca4ade812288a2bf47cb6c71405e89275a0db234d20ed8decafe83d`
- review packet SHA-256: `b09c5bfa02385da53a0d29e6d69b731fdab4488d854eedfdb0700843cd375f11`
- case-ledger SHA-256: `8efcd4f8068e7e33b37264fbca4e879751e22489e6b0c0ed66b591284c441a46`
- rework record SHA-256: `2d409b99f1749569a848fec79708b6976cf4a93b026f90bfe748f3759df54ad7`
- staging-agent record SHA-256: `afb265e064be553482e0f54c7f9d8a6e92631b85ee7a4e8e9afd9150cef4608e`
- reconstructed target commit-object SHA-256:
  `340d47a1f7825eec0c5e9b727d98f9afdf8b809d867f7f1d80273cb59b7f73a0`
- recomputed 20-artifact manifest SHA-256:
  `3082e2a318f2a8c035217db677d3c12c52b91a1d3d0ba4c80d54e85b744150b3`
- production baseline remains Sites version 34/source
  `9c245083a8101de0c631c9dc92937765e12d39aa`

## Acceptance mapping

`PASS` means the numbered behavior has independently sufficient implementation and
focused evidence. Where the frozen single-observation ledger is still missing, the
behavioral test is marked PASS and its release-evidence dependency is explicitly carried
by AT-18 rather than counted as a third defect.

| Exam item | Result | Independent mapping |
|---|---|---|
| AT-01 | **PASS behavior; AT-18 evidence dependency** | SAVE-01..04 genuine server fixtures cover accepted values, audit, and authority; local feedback, focus, reload, and narrow behavior pass focused client tests. The missing connected observation is Blocker 1. |
| AT-02 | **PASS behavior; AT-18 evidence dependency** | FAIL-01/02 produce typed conflict/validation responses, preserve prior authority and input, expose a focused assertive inline error, and require explicit retry. |
| AT-03 | **PASS behavior; AT-18 evidence dependency** | Deterministic ORDER-01..04 tests suppress older bootstrap/save/projection/failure results. The ledger's separately fabricated terminal UI row is not accepted as measurement. |
| AT-04 | **PASS** | Pending, unavailable, action-local failure, page reload failure, named live regions, and narrow containment are implemented and tested; hosted 320×800 measurement reports 290px client/scroll width and zero overflowing descendants. |
| AT-05 | **PASS** | Isolated D1/relay fixture exercises one immutable receipt/outbox, reservation/start, verified delivery, signed ordered ledger, and acknowledgement with full authorization bindings. |
| AT-06 | **PASS** | Exact receipt/ack replay returns original identities; changed bindings reject before duplicate append/send/claim/run. |
| AT-07 | **PASS** | Signed noninteractive assigned-agent read/ack works without a human session; stale, forged, wrong-key/channel/run bindings fail closed. |
| AT-08 | **PASS behavior; AT-18 evidence dependency** | Hosted keyboard/accessibility-tree/narrow checks plus dispatch accessibility and lineage tests cover local feedback, focus, one lineage, and second-ack rejection. The disconnected case-ledger row is not treated as measured evidence. |
| AT-09 | **PASS** | JCS-SHA-256 authorization and acknowledgement replays reuse the original receipt/event with no second durable action. |
| AT-10 | **PASS** | Concurrent CAS, unique identity, reservation fence, lease, acknowledgement, and terminalization/start ordering tests pass. |
| AT-11 | **PASS** | The uncertain-send fixture verifies relay discovery and bindings, backfills delivery without resend, and preserves one lineage. |
| AT-12 | **PASS** | F03-A..F03-F execute isolated pre-receipt rejection branches with typed no-PII diagnostics and forbidden-side-effect assertions. |
| AT-13 | **PASS** | F04-A..F04-E exercise post-receipt/pre-send terminalization, fence invalidation, diagnostic append, and no start/send/state/run/requeue. |
| AT-14 | **PASS** | R04-A..R04-F cover stale recovery, explicit reauthorization, same-lineage successor rules, and no duplicate run. |
| AT-15 | **PASS** | JCS/SHA-256/BIP-340 signing, version/hash chains, signer registries, exact authorities, relay proof, and adversarial failures are exercised. |
| AT-16 | **PASS** | Inventory and tests cover the governed data paths, 90-day live deletion, 30-day configured recovery, holds, cascades, and no-PII constraints. Staging policy v2 is immutable ACTIVE and exact-ruling bound; the test bypass is absent. |
| AT-17 | **PASS** | Agent-operated real Chrome/macOS keyboard and accessibility-tree evidence covers drawer entry, forward/reverse focus containment, Escape/return, dialog semantics, names, visible 3px focus, and hosted 320px layout. The executable eight-state matrix passes with no serious/critical axe findings and separate contrast assertions. No VoiceOver audio is claimed or required from the human. |
| AT-18 | **BLOCK** | The 20 rows are generated from passing but disconnected test processes plus a separately constructed JSDOM result. Latency and counters do not originate from the required authoritative-response-to-visible-result observation. |
| AT-19 | **BLOCK** | Exact v18→v17→v18 deployment IDs and 10.002s/9.115s RTOs are recorded, with zero loss for selected tables, but no post-rollback pending/success/failure action smoke and no complete in-flight/duplicate lineage snapshot are attached. |

## Material findings, severity ordered

### Blocker 1 — AT-18's ledger reports composed assertions, not one executed observation

The frozen Exam requires the non-production harness to expose authoritative server
state, initiating drawer, activity, focus, announcement, and append-only ledger in one
observation (Exam lines 34–48); each case must record actual receipt/outbox/event/attempt/
claim/run/error IDs where applicable (lines 50–64); and latency must run from authoritative
response receipt to visible local result (lines 359–380).

`flight-board/scripts/measure-str028-case-ledger.ts:22-43` hard-codes each outcome,
authority string, HTTP code, reconciliation label, and substep list. Lines 45–66 map
multiple nominal cases to the same test (`DISP-01`/`DISP-03`, `DISP-02`/`REC-01`, and
`ORDER-02`/`ORDER-04`). Lines 81–89 only establish that the selected test process
passes. Lines 91–120 then construct a new typed `InlineActionFeedback` unrelated to the
server result and start the timer immediately before render. Lines 131–156 write the
hard-coded authority prose and transport result rather than actual durable identifiers,
and mark substeps/result pass from process exit plus focus. Lines 173–179 hard-code the
four summary zeros. The stored ledger accordingly contains `d1_authority_assertions`
prose, not the required IDs/counts.

The genuine lower-level fixtures remain valuable proof of implementation behavior, but
joining their exit code to a separately invented client state is not the immutable
observation contract and cannot establish the measured p95 boundary.

**Shortest falsifiable remediation:** change only the non-production measurement harness.
For each of the exact 20 case IDs (and every frozen isolated substep), run a case-specific
fixture once through the real handler/client action boundary. Capture
`authoritative_response_received_at`; render that exact returned typed result through the
actual initiating-drawer update path; capture the next painted named local status/error,
focus, announcement, reconciled activity, and `visible_at`; query the same fixture D1 for
actual receipt/outbox/event/attempt/claim/run/error IDs and forbidden-side-effect counts.
Compute latency as `visible_at - authoritative_response_received_at`; derive outcomes,
substep results, duplicates, stale overwrites, hidden failures, terminal-observation count,
and p95 only from captured values. Missing or contradictory evidence must fail the case
and exit nonzero. This is a local/owner-only staging oracle and requires no production.

### Blocker 2 — AT-19 does not prove the required post-rollback action truth or lineage invariants

The Sites rehearsal itself is exact and reversible: evidence records v18→v17 deployment
`appgdep_6a84a1e2b62881919d677f32aaab96ff` in 10.002s and v17→v18 deployment
`appgdep_6a84a221395c81918504d9c1f8c0247c` in 9.115s. The Sites source/version metadata
matches, and work items, review assignments/events, privacy-policy versions, and the
telemetry prefix were preserved (`0028-staging-v18-agent-evidence.json:99-149`).

That record's sole post-restore UI assertion is that the drawer opened with dialog
semantics (line 114). The frozen AT-19 oracle instead requires a post-rollback action
smoke showing honest pending, success, and failure; fail-closed handling of an in-flight
ambiguous operation; preservation of receipt/event/outbox history; and zero duplicate
receipt/outbox/claim/run/audit (`Exam:382-394`). The before/during/after snapshot set omits
dispatch receipts, outbox rows, dispatch events/attempts, claims/runs, and audit/activity
identities, so those assertions are not falsifiable from the supplied record.

**Shortest falsifiable remediation:** no production rehearsal is needed. On owner-only
staging, capture sorted ID/state/hash snapshots immediately before rollback, on v17, and
after restoring v18 for: dispatch receipts, outbox, events, attempts/reservations,
claims/runs, authorization/work-economics audit, activity/notifications, review lineage,
and privacy-policy versions. Include one seeded or identified in-flight ambiguous action
and prove the reverted version returns a typed fail-closed outcome with no send or durable
mutation. After rollback (and again after restore), drive the actual initiating drawer
through one pending→success flow and one failure flow, recording local role/text, focus,
response identity, final authority, and zero duplicate deltas. Bind the raw snapshots,
deployment IDs/timestamps, RPO/RTO, and smoke observations into one immutable evidence
artifact. Existing deployment timing may be reused if an exact post-rehearsal evidence
run can bind these missing oracles to those deployments.

## Prior blockers closed

- **Privacy activation: PASS.** The authenticated activation endpoint resolves and binds
  the immutable inventory/ruling and records immutable ACTIVE v2 with 90/30 controls.
- **Review target authority: PASS.** The request now requires an enrolled Test-Agent
  `steer-target-verification/v1` receipt whose target exactly matches the requested target;
  the server verifies its key/version/signature before append, binds its receipt digest
  into `REVIEW_TARGET_READY`, rejects a target/receipt mismatch with zero side effects,
  and append-only supersedes older active assignments. Staging has one exact REQUESTED
  assignment (`a84a6e...`) and three SUPERSEDED predecessors; the preliminary rehearsal
  is transparently retained and is not parallel authority.
- **Immutable-ruling fixture: PASS, test-only correction.** The server-control test now
  reads the inventory at immutable commit `4dd787c...` and ruling at immutable commit
  `d9dbe0b...` rather than reading a mutable working-tree evidence file. This fixes
  reproducibility; it does not change product privacy behavior.
- **Accessibility: PASS.** Agent-operated evidence replaces the former request for a human
  rerun. No human VoiceOver audio session is claimed.

## Checks independently reproduced

- Reconstructed `commit <size>\0<content>` for `b928cba...`; SHA-256 matches
  `340d47a1...`.
- Re-read all 20 target artifact bytes from Git; every size/SHA-256 matches; recomputed
  canonical manifest is `3082e2a...`.
- Verified the packet receipt target is byte-for-byte equivalent to the requested target
  and its BIP-340 signature validates under enrolled Test-Agent public key
  `692f22559c40755774615c070956134867995f07f54c1f2507b905d3b9bb0a52`.
- Confirmed staging packaging commit `b704d84...` differs from the target under
  `flight-board/` only by the staging project ID in `.openai/hosting.json`.
- Fresh branch-head verification: build PASS; JavaScript 30/30; TypeScript 124/124;
  aggregate 154/154; typecheck PASS; lint PASS; production dependency audit reports zero
  vulnerabilities.
- Fresh independent ledger execution completed 20/20 subprocesses and painted rows; a
  fresh run reported save p95 23ms and handoff p95 19ms. This reproduces the generator,
  but does not cure its disconnected/hard-coded measurement method.
- Read-only Sites verification confirmed custom owner-only staging v18, exact saved v17,
  succeeded rollback/restore deployments, environment revision 2, and no test privacy
  bypass.
- Read-only staging inspection confirmed immutable ACTIVE privacy policy v2, exact review
  assignment/manifest, one active assignment, and append-only supersession of predecessors.
- Read-only production inspection confirmed version 34/source `9c245083...`; production
  does not contain the STR-028 schema. No production write, deployment, or mutation was
  performed.

## Residual risks and required human decisions

- The human Product Lead retains Gate 3 authority after both evidence blockers are
  corrected and independently reviewed. This report makes no gate decision.
- A future production privacy activation and release remain separately authorized
  operations; staging ACTIVE state confers no production authority.
- The three superseded rehearsal assignments and one queued staging dispatch are valid
  immutable non-production history. Their retention is not a blocker, but release
  operators should not mistake them for production work.
- Agent-operated accessibility is sufficient for this Gate 3 packet under the supplied
  instruction not to require a human repeat. VoiceOver audio remains unclaimed.

## Required next action

Keep production unchanged. Replace the AT-18 composed ledger with the connected executed
oracle above, append the bounded AT-19 snapshot/smoke evidence above, rerun the green
suite, and request a fresh independent Critic review. Recommendation: **BLOCK**.
