# Intent Brief — 0028 Stale post-write feedback and action visibility

**Status:** draft
**Tags:** #security #privacy #a11y #reliability #design-system
**Date opened:** 2026-08-16
**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Workflow:** STEER
**Assignment:** STEER Scout; complete Gate-1-ready Intent Brief preparation only

## Review and claim governance

- **Single primary execution claim:** The STR-028 Work Management item has one
  primary execution claim/run, owned by the assigned `STEER Scout` under the frozen
  workflow and root authorization. Rework revisions preserve that claim, its lineage,
  and its idempotency boundary; a reviewer never acquires, replaces, or duplicates
  the primary claim/run.
- **Canonical non-owning review assignment:** A review handoff is a separate,
  stage-scoped Work Management assignment bound to the active
  `work_item_stable_id`/work-item key, `workflow`, unchanged `primary_claim_lineage_id`,
  unchanged primary owner role and enrolled member ID, `review_stage`, exact target
  commit SHA-256, exact artifact URLs, prior evidence/decision binding digests,
  reviewer role and enrolled member ID, explicit output contract and prohibitions, and
  authenticated `authorizing_actor_id`/`authorizing_event_id`. It grants review
  authority only; it cannot change the primary owner, workflow, lineage, scope, gate
  state, or implementation authority.
- **Append-only assignment, acknowledgement, and result:**
  `review_assignment_id = SHA-256(UTF8(RFC8785(steer-review-assignment/v1 payload)))`,
  using RFC 8785 JCS UTF-8 without BOM and the exact fields above, with artifact URLs
  and binding-digest arrays in their recorded canonical order. The Work Management
  authorization service alone appends the signed `REVIEW_ASSIGNED` record after
  authenticating the authorizing actor/event and checking the active item, unchanged
  primary owner/workflow/lineage, enrolled reviewer/stage authority, exact target and
  prior bindings, output/prohibitions, and configured canonical route. Only the
  enrolled reviewer identity appends signed `REVIEW_ACKNOWLEDGED` and
  `REVIEW_RESULT_RECORDED`, each binding the assignment ID, exact target, reviewer,
  source request, and predecessor receipt; no unsigned record is allowed.
- **JCS-SHA-256 idempotency and mismatch handling:**
  `review_idempotency_key = SHA-256(UTF8(RFC8785({schema:"steer-review-idempotency/v1", review_assignment_id})))`.
  Work Management stores immutable request, acknowledgement, and result receipts with
  the assignment ID, idempotency key, exact revision/URLs, stage, identities,
  authorizing actor/event, prior bindings, output/prohibitions, timestamps, and
  disposition. An exact replay returns the existing receipt/result without a new
  append, review run, or primary claim. Any duplicate with a changed field, missing
  binding, wrong reviewer, wrong authorizer, stale item/workflow/lineage, or mismatched
  target is rejected before append or side effect and cannot fall back to a new key.
- **Temporary approved-setup bootstrap:** Until the authoritative Work Management
  `review_assignments[]` store exists, one externally authenticated approved-setup
  event may seed the complete assignment payload above. The bootstrap receipt records
  the authorizing actor/event, exact target/URLs, primary owner/workflow/lineage,
  reviewer, stage, output/prohibitions, and idempotency key, and is independently
  auditable. It is a temporary compatibility path only; once `review_assignments[]`
  exists, bootstrap writes are rejected. No override, project-channel fallback, or
  alternate authorizer is accepted unless the configured canonical route or a frozen
  decision explicitly allows it.
- **Review-record privacy:** Review assignment, acknowledgement, result, bootstrap,
  authorizer, reviewer, and receipt references are pseudonymous personal data. Apply
  `PRIV-01`, `PRIV-02`, and `PRIV-03`, purpose limitation/minimization, no identity or
  PII in logs, inventory before implementation, 90-day terminal retention, auditable
  deletion and scoped time-bounded holds, and deletion across receipts, indexes,
  replicas, and backups. Missing inventory, retention, deletion, or logging controls
  blocks review assignment/acknowledgement/result creation while preserving the
  primary claim identity.
- **Stage-specific Critic inputs:**

  | Review stage | Required Critic inputs | Boundary |
  |---|---|---|
  | `PRE_GATE_1_BRIEF` | Exact Intent Brief revision, Scout evidence, Decision Log, governing gates/guardrails, signals/metrics limits, and the authenticated Work Management review assignment/ack/result receipts | No Exam prerequisite; the Exam is downstream of human Gate 1. Review evidence is not a Gate 1 ruling, implementation authorization, or primary claim. |
  | `GATE_2_EXAM` | Exact human-approved Brief revision, exact Exam revision, applicable guardrails, and the assigned Exam/Test evidence | Do not substitute a pre-gate Brief review for Exam review; no implementation or release authority. |
  | `GATE_3_BUILD` | Exact Brief and frozen Exam revisions, implementation diff, test/CI evidence, and prior stage receipts/results | Review the verified build only; no merge, deployment, release, or human gate signature by the Critic. |

## Expected outcome and measurement

- **Primary outcome:** An authenticated operator never has to infer whether a drawer
  mutation took effect. Each action ends in an authoritative saved-state display, an
  actionable inline failure with preserved input, or an explicit pending/blocked
  state; a transient client-only value is not treated as success.
- **Baseline / denominator:** The preserved incident evidence contains one STR-027
  session with two durable `200` writes and a later `409`, with the accepted state
  visible only after hard refresh. A second production observation records one
  attempted `Next action` edit that appeared in the drawer, reverted after reload,
  and emitted no activity event. This is incident evidence only, not a demand-series
  denominator; broader frequency remains unmeasured.
- **Observation window and denominator:** Before execution, pre-enroll exactly 20
  non-production cases: 4 successful Work Economics saves, 4 successful dispatch
  authorizations, 4 server validation/conflict failures including HTTP `409`, 4
  delayed or out-of-order bootstrap/reconciliation responses, and 4 replay,
  concurrent-retry, or partial-dispatch recovery cases. One observation is one
  pre-registered case ID executed once from its specified seed state. The denominator
  is all 20 enrolled cases; no post-start exclusions are allowed, and missing or
  unclassifiable results count as failures. The two production observations remain
  incident evidence and are excluded from this denominator.
- **Minimum meaningful signal:** All 8 successful mutations expose authoritative
  saved state and a success announcement immediately; all 4 failure cases preserve
  inputs, show actionable inline errors, place or restore keyboard focus correctly,
  and announce failure; all 4 ordering cases prevent older data from overwriting the
  confirmed mutation; all 4 dispatch-recovery cases produce exactly one receipt,
  outbox identity, agent claim, and run; and there are zero duplicate audit events,
  skipped gates, unauthorized state changes, or unresolved critical recurrences.
  These are bounded proposed acceptance thresholds for human Gate 1 review, not
  observed results.
- **Guardrail measure:** zero unauthorized routing or dispatch, zero human-gate
  transitions by an agent, zero lost user input after failure, zero duplicate activity
  records, no accessibility blocker, and no secret or unauthorized leakage of
  pseudonymous personal data.

## Who this is for

The primary actor is an authenticated Work Management operator who edits or authorizes
an item from its open drawer and needs to know what the server accepted. The secondary
actor is the assigned agent, which must be able to verify a durable authorization receipt
without an interactive human UI session. The flow is: initiate one drawer action → show
pending state → receive the authoritative result or typed failure → reconcile the drawer
and activity state → confirm the same result after reload.

## Problem and why now

The Flight Board can acknowledge an authoritative mutation while leaving the open
work-item drawer showing the earlier state. On STR-027, humans could not tell from
the open surface whether a forecast acceptance or agent dispatch had taken effect;
they had to hard-refresh before the durable result was visible. A later validation
conflict returned `409`, but its explanation was rendered only in a page-level
banner, outside the initiating drawer action. This creates an ambiguous success/failure
boundary: a human may repeat a ruling or authorization, or conclude that agent work
has not started.

The current source contains the reported path: mutation handlers await the write and
then call an unguarded `load()` (`flight-board/app/page.tsx:517-525,548-564,728-740`),
while errors are stored in one page-level state and rendered at
`flight-board/app/page.tsx:808`. The open drawer is a fixed `.drawer-scrim` at
`flight-board/app/globals.css:110`, so the global error can be visually unavailable
while the action surface remains open. The issue is therefore a candidate for a
governed reliability/accessibility repair, not evidence that a broader product demand
series has been established.

## Evidence

- [STR-028 / GitHub issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
  is the authoritative incident record. It records the STR-027 observation on
  2026-08-15, two durable `200` writes (`work-economics` and `dispatch`), a later
  `409`, and persistence visible only after hard refresh. It also records the user
  impact and the requested boundary: Sense-stage analysis and governed repair
  planning only; no implementation, gate approval, deployment, merge, or release.
- The authenticated supervisory mirror at [issue comment
  #5310322900](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310322900)
  records the current Work Management handoff as `STR-028`, `STEER`, `In Progress`,
  assigned to `Scout`, with the accepted forecast and authorized handoff timestamps.
  It binds the sole claim to branch `scout/str-028-intent-brief` at revision
  `256591644b49cb5ff6d8aae2fb59228688669f7f`, identifies `#steer-team`
  (`10ac2fb4-f7fc-4dbc-bb73-8c545f31a470`) as canonical, and explicitly says the
  mirror is not a gate ruling. The current Buzz authorization event is
  `354e0ed8117ff6009837b7c27e294471b448a8535a2a7132794b9172a55c4538` in that
  channel, and repeats the single-run/no-duplicate constraint.
- The Buzz handoff for this item is event
  `ee8c2edb3347377c6a343ecc2a6c09e3c01fae6a95509d2a218db112d4ed04d3` in channel
  `c44eff40-c669-4c18-b6e8-46604af44668`; it identifies STR-028 as In Progress,
  assigns the Scout to reproduce the stale state and hidden `409`, and requests
  Gate 1 after evidence publication.
- Local implementation evidence is preserved in the assigned repository revision
  `d9dcb53398da166aea972eb678e3cfff058a10c6`: the mutation paths are in
  `flight-board/app/page.tsx:517-561` and `728-740`; the page-level error surface is
  at `:808`; the drawer is mounted at `:847-890`; and the fixed drawer overlay is
  styled at `flight-board/app/globals.css:110`.
- The local signals inbox (`steer/signals/`) contains only its intake README, and
  the metrics register (`steer/operating-system/METRICS.md`) has no STR-028 row.
  Relay search returned the STR-028 handoff but no independent repeated-signal
  series. Frequency is therefore **unmeasured**; this brief makes no demand or
  recurrence claim.
- [Supervisor-confirmed dispatch root cause](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310332219)
  records read-only source inspection showing that the dispatch worker hard-codes
  `#project-federal-bd-pilot`, stores the outbox channel as generic `Block Buzz`,
  uses `dispatch-${itemId}-${now}` as its dedupe key, and emits free-text activity
  without a receipt ID, authorization revision, canonical channel ID, or
  acknowledgement reference. These are source-backed defect findings, not an
  implementation authorization.
- The same source record identifies the bounded controls that a governed repair
  must make testable: a durable agent-readable receipt containing the work-item key,
  workflow/state, assigned role identity, allowed/prohibited scope, exact evidence
  revision, accepted-forecast and human-authorization timestamps/audit identity,
  canonical channel ID, and idempotency key; no dependency on a signed-in human UI;
  authoritative-channel resolution with fail-closed mismatch handling; one
  claim/run per work-item/role/authorization revision across retries and channels;
  outbox states for queued, delivered, acknowledged, failed, and retry with Buzz/GitHub
  reconciliation; routing correction that resumes the existing claim; and coverage
  for wrong-channel configuration, inaccessible authorization UI, replay, concurrent
  retries, delayed or out-of-order acknowledgements, and partial-dispatch recovery.
- The authenticated human scope decision at [issue comment
  #5310403354](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310403354)
  expands this Scout run to a complete, bounded Gate-1-ready Intent Brief. It requires
  the saved-state, stale-response, inline-error, input-preservation, duplicate-action,
  audit-reconciliation, focus/announcement, routing/receipt/outbox, replay/concurrency,
  `#security`, and evidence-matrix contracts recorded below. It does not authorize an
  Exam, code, gate ruling, merge, deployment, or release.
- The authenticated routing decision at [issue comment
  #5310397551](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310397551)
  makes `#steer-team` (`10ac2fb4-f7fc-4dbc-bb73-8c545f31a470`) canonical for this
  governed handoff, rejects `#project-federal-bd-pilot` as authority, and requires
  missing or mismatched channel configuration to fail closed while preserving the
  existing claim.
- The authenticated Tech design decision at [issue comment
  #5310467779](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310467779)
  freezes the bounded dispatch identity, receipt/outbox lifecycle, acknowledgement
  authority, partial-dispatch recovery, routing source and precedence, Gate-1 case
  matrix, and evidence classifications recorded below. It is a design decision, not
  a Gate 1/2 ruling, Exam, or implementation authorization.
- The supervisory Tech decision at [issue comment
  #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334)
  freezes the self-contained versioned receipt schema and durable, non-interactive
  audit-reference resolution contract. It classifies the stable member, agent-key,
  acknowledgement-signer, and human-actor references as pseudonymous personal data,
  requires `#privacy` treatment under PRIV-01/02/03, and fixes purpose/minimization,
  90-day terminal retention, deletion/hold handling, inventory, no-PII-in-logs, and
  default-closed behavior. It is authenticated decision evidence only, not a Gate 1/2/3
  ruling, Exam, implementation authorization, merge, deployment, or release.
- The supervisory Tech decision at [issue comment
  #5316551748](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316551748)
  supersedes only conflicting wording in the prior design decisions and freezes the
  immutable receipt plus append-only lifecycle/acknowledgement ledger, versioned
  compare-and-set and replay rules, `dispatch_claim_lineage_id` supersession model,
  stale-configuration fail-closed behavior, exact 20-case manifest, and external
  revision-binding provenance below. It is authenticated design decision evidence only,
  not a Gate 1/2/3 ruling, Exam, implementation authorization, merge, deployment, or
  release.
- The same ruling freezes revision provenance: a Git-tracked file cannot contain the
  hash of the commit that contains itself, so Scout evidence records the authorized
  parent and identifies the review target as the immutable commit named in the external
  Buzz Critic request/result. Those external events bind the exact commit and artifact
  URLs; no self-referential follow-up commit is created merely to write its own hash.
- The supervisory Tech decision at [issue comment
  #5316704687](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316704687)
  supersedes only conflicting lineage and event wording in the prior decisions and
  freezes the canonical root-authorization lineage formula and closure rules, exact
  signed event schema and append authority matrix, and named manifest mappings for
  replay, wrong-key, second-ack, stale-config, and supersession proof. It is
  authenticated design decision evidence only, not a Gate 1/2/3 ruling, Exam,
  implementation authorization, merge, deployment, or release.
- The supervisory Tech decision at [issue comment
  #5316789932](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316789932)
  supersedes only conflicting delivery-order and event-verification wording and
  freezes the executable queued/send-reservation/delivery sequence, uncertain-send
  reconciliation, signed `REQUEUED` authority and retry-attempt uniqueness, and the
  RFC 8785 UTF-8/SHA-256/BIP-340 event and audited signer-registry trust profile. It
  is authenticated design evidence only, not a Gate 1/2/3 ruling, Exam,
  implementation authorization, merge, deployment, or release.
- A fresh production observation at [issue comment
  #5310415277](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310415277)
  records a signed-in human editing `Next action`: the drawer showed the new text,
  no inline result appeared, hard reload restored the old text, and no activity event
  was recorded. This is production evidence of ambiguous post-write state, not proof
  that the proposed repair works.
- No live replay, concurrency, outbox-delivery, or partial-dispatch recovery run was
  executed for this Scout handoff. The evidence supports a bounded repair candidate
  and its required proof obligations, not a claim that those controls already work.
- Gate state remains **Gate 1 pending**. The current artifacts contain no authenticated
  human Gate 1 ruling, and this brief does not approve Gate 1, Gate 2, implementation,
  deployment, merge, or release.
- Related [issue #57](https://github.com/idrissenayat/federal-bd-platform/issues/57)
  describes a claimed stale-action-feedback hotfix and validation, but it remains
  open and is treated as corroborating engineering context rather than a separate
  user signal.

These controls frame the repair candidate; they do not establish demand, recurrence,
implementation readiness, or any Gate 1/2/3 approval. A future Exam must convert the
bounded controls into executable acceptance tests after human Gate 1 review.

## Bounded dispatch, routing, and measurement contract

- **Deterministic identity:** `dispatch_intent_id` is
  `SHA-256(JCS(steer-dispatch-intent/v1 payload))`. The payload contains the
  workspace/POD ID, work-item stable ID and key, STEER workflow, assigned agent's
  stable enrolled member ID and pubkey, authorization revision and immutable human
  authorization audit-event ID, exact evidence URL plus immutable revision/digest,
  accepted-forecast audit-event ID, canonical Buzz channel ID, and hash of the
  authorized Next action. The uniqueness boundary is one claim/run for one intent ID
  across Work Management, its outbox, Buzz, retries, routing corrections, and the
  agent runtime. Same-intent transport repair and retry reuse that identity only when
  the immutable receipt bindings remain exact. A material authorization, evidence,
  assignee, scope, channel, configuration, workspace/relay, or membership-authority
  change creates a new revision and new intent under the lineage contract below; it
  supersedes without deleting the prior receipt.
- **Canonical claim lineage and routing correction:**
  `dispatch_claim_lineage_id = SHA-256(JCS({schema:"steer-dispatch-lineage/v1", originating_workspace_pod_id, work_item_stable_id, work_item_key, workflow:"STEER", root_human_authorization_audit_event_id}))`.
  Those five inputs are immutable for the lineage. Assigned role, enrolled
  member/agent, evidence, scope, route/channel/configuration, and individual
  authorization revision are intent inputs and receipt fields, not lineage inputs.
  Before a valid acknowledgement, changed evidence, scope, routing channel/config
  version, relay binding, or membership proof may create an explicitly human-authorized
  superseding intent on the same lineage only when originating workspace/POD, work-item
  identity, workflow, root authorization objective, assigned role, and enrolled
  member/agent are unchanged. The old intent becomes `SUPERSEDED` atomically with its
  successor; no runtime claim/run is restarted, and if no claim exists the successor is
  the only intent allowed to create it.

  A role change, assignee/enrolled-member change, originating workspace/POD migration,
  work-item identity change, workflow change, or new root authorization objective
  creates a new lineage. The prior pre-ack intent/lineage becomes `CANCELLED` or
  `SUPERSEDED` with a cross-lineage reference in the same authorization transaction;
  new human authorization is mandatory, and a new claim/run is allowed only on the new
  lineage. A valid `ACKNOWLEDGED` event terminalizes both the intent and its lineage
  for that authorization objective; no same-lineage successor is allowed afterward.
  Any post-ack material change requires new root authorization, new lineage, and—only
  if authorized—a new run. `ACKNOWLEDGED`, `FAILED_FINAL`, and `CANCELLED` close the
  lineage; `SUPERSEDED` keeps it open only for its explicitly linked pre-ack successor.
  Recovery after a closed lineage requires new root authorization/new lineage. Exactly
  one accepted claim/run is permitted per lineage. Same-intent retry or transport
  repair is legal only when the active audited routing-configuration version, canonical
  channel ID, workspace/relay binding, and assigned-agent membership exactly equal the
  immutable receipt values; otherwise fail closed before any side effect.
- **Atomic receipt/outbox creation:** Before external delivery, one database
  transaction validates the current authorization revision and routing configuration,
  reserves the unique intent ID, writes the immutable authorization receipt, and
  creates exactly one outbox row referencing that receipt. No external message is
  sent unless the transaction commits, and delivery or retry cannot change item
  phase, assignee, decision state, gate state, or downstream authorization.
- **Immutable receipt and append-only operational history:** The immutable receipt is
  a versioned, agent-readable authorization snapshot containing the receipt schema
  version, receipt ID, `dispatch_intent_id`, workspace/POD ID, work-item stable ID/key,
  authorization revision and receipt-created timestamp; STEER workflow and
  authoritative item state at human authorization; assigned role, enrolled agent
  member ID, enrolled key ID/version, and public-key fingerprint; structured
  `allowed_scope` and `prohibited_scope`; exact evidence URL plus immutable
  revision/digest; accepted-forecast timestamp and immutable audit-event ID;
  human-authorization timestamp, stable actor ID, and immutable audit-event ID;
  canonical Buzz channel ID and authoritative routing-configuration version;
  authorized Next-action hash; and acknowledgement policy/required-binding fields.
  It does not contain mutable current acknowledgement state or a future signature.
  Audit-event IDs are corroborating pointers, not the only readable source: their
  material authorization fields remain in the receipt, and each pointer resolves
  through a durable, append-only, non-interactive, agent-readable audit API using the
  enrolled agent service identity. Unavailable, missing, stale, or mismatched
  resolution fails closed with no delivery, acknowledgement, retry-created identity,
  downstream work, or item/gate/phase/assignee/decision mutation; the existing claim
  identity is preserved.
- **Append-only lifecycle and acknowledgement ledger:** In the initial transaction,
  create the unique receipt, exactly one outbox identity, and signed lifecycle event
  `v0: QUEUED`. Before any external call, the outbox delivery service acquires one
  leased attempt with CAS on the current event version and commits a signed,
  non-state `SEND_ATTEMPT_RESERVED` event containing the intent ID, attempt number,
  lease ID/expiry, `reservation_fence`, canonical channel/configuration bindings, and
  relay idempotency key equal to `dispatch_intent_id`. Enforce unique
  `(dispatch_intent_id,attempt_number)` and one active lease; no external call occurs
  before this reservation commits. Immediately before the relay call, the service
  must serialize a CAS `SEND_ATTEMPT_STARTED` append against the same current event
  version and `reservation_fence`, rechecking that the lease is active, the intent is
  non-terminal, no signed `TERMINALIZATION_REQUESTED` has won the ordering, the
  routing/configuration bindings still match, and no unresolved reconciliation exists.
  A failed or stale pre-call CAS permits no send. The service performs exactly one
  external send only after `SEND_ATTEMPT_STARTED` commits, with the same
  intent/attempt/idempotency bindings. Cancellation, supersession, and configuration
  invalidation use the same serialization domain and a signed
  `TERMINALIZATION_REQUESTED`: if that request wins before `SEND_ATTEMPT_STARTED`,
  the reservation fence is invalidated and no send occurs; if `SEND_ATTEMPT_STARTED`
  wins first, terminalization waits for the attempt to resolve. When the canonical
  relay returns a durable event ID, verify its channel, publisher, intent ID, attempt
  ID, payload digest, and NIP-01 publisher signature, then CAS-append signed state
  event `DELIVERED` and update the projection in one transaction. `DELIVERED` is
  monotonic: a stale reconciliation observed after a verified `DELIVERED` is an
  idempotent no-op and cannot regress state. If the send times out, is unknown, or the
  worker crashes before durable delivery can be proven, append
  `RECONCILIATION_REQUIRED` and query the canonical relay for the same intent/attempt
  before retry; append `DELIVERED` only after a verified match, or append
  `FAILED_RETRYABLE` only after the bounded check finds no delivery, the lease is
  released, and reconciliation is resolved. No failure or requeue is permitted while
  an active lease or unresolved reconciliation remains. Downstream authorization
  remains blocked until committed `ACKNOWLEDGED`.

  The authoritative operational history is an append-only `dispatch_event` ledger
  keyed by `dispatch_intent_id`, with the exact `steer-dispatch-event/v1` payload:
  `dispatch_intent_id`, `dispatch_claim_lineage_id`, `event_version`,
  `expected_event_version`, `previous_event_sha256`, event type, prior state,
  resulting state, UTC timestamp, authorized actor/service stable ID and key version,
  typed payload digest, receipt/routing/evidence revision bindings, and external
  event/reference IDs when applicable. The agent-readable status envelope is immutable
  receipt plus ordered event ledger plus current projection; the projection is
  rebuildable and is not independent evidence. Every transition or non-state event
  appends exactly one event and uses compare-and-set on `expected_event_version`.
  `v0:QUEUED` uses `event_version=0`, `expected_event_version=-1`, and null prior hash.
  Every next event satisfies `event_version = expected_event_version + 1`.

  JCS means RFC 8785 JSON Canonicalization Scheme; canonical JSON is UTF-8 with no
  BOM. The event payload excludes signature fields and its digest is
  `SHA-256(UTF8(RFC8785(unsigned steer-dispatch-event/v1 payload)))`. Service and
  agent signatures use BIP-340 Schnorr over secp256k1 on the 32-byte digest; public
  keys are 32-byte x-only lowercase hex and signatures are 64-byte lowercase hex.
  The assigned-agent acknowledgement signs the separately versioned
  `steer-dispatch-ack/v1` JCS/UTF-8/SHA-256 binding payload with the same profile.
  The stored envelope contains the unsigned payload, service key ID/version, service
  signature, and only for `ACKNOWLEDGED` the assigned-agent key ID/version and
  acknowledgement signature. `previous_event_sha256` hashes the exact UTF-8 RFC 8785
  canonical predecessor envelope including its signatures. There is no unsigned
  event. Enforce unique `(dispatch_intent_id,event_version)`, one outbox identity per
  intent, and at most one accepted `ACKNOWLEDGED` event per intent.

  The authoritative audited signer registry is
  `workspace.security.dispatch_event_signers`, versioned and Tech-owned. It maps
  service role and allowed event types to key ID/version, x-only public key, validity
  interval, and `ACTIVE|RETIRED|REVOKED` status. The receipt binds the registry version
  used at authorization and each append checks the active registry. A key must be
  authorized for the exact event type and active at the server-recorded append time;
  payload timestamps do not establish validity. Retired keys verify historical events
  appended while active but cannot sign new events; revoked keys cannot sign new events.
  Events at or after effective revocation are rejected. Earlier events signed by a
  subsequently revoked key remain preserved but fail closed for downstream
  authorization pending an explicit audited security ruling. Missing registry/version,
  unknown key/schema/algorithm, invalid encoding/digest/signature, unauthorized event
  type, retired/revoked new signer, registry mismatch, or untrusted relay signature is
  rejected before append/projection/side effect. Registry rotation never rewrites old
  events and records actor, reason, timestamp, old/new key versions, effective
  interval, and any incident/hold reference.

  The durable relay proof is the NIP-01 publisher-signed event itself: verify the
  canonical event ID, publisher public key, signature, kind/tags/content, channel,
  intent/attempt bindings, and payload digest. Publisher trust is resolved through
  the versioned, Tech-owned `workspace.security.relay_event_signers` registry, which
  records publisher key ID/version, validity interval, and
  `ACTIVE|RETIRED|REVOKED` status. Missing or mismatched registry/version, unknown or
  unauthorized publisher, invalid NIP-01 serialization/signature, retired/revoked
  new signer, or binding mismatch is rejected before `DELIVERED`, projection, or any
  downstream side effect. Registry rotation/revocation records the actor, reason,
  timestamp, old/new key versions, and effective interval; historical events remain
  preserved and are verified under the registry's effective-time rules, while a
  retired or revoked key cannot publish a new event.

- **Event append authority:**

  | Event | Sole append authority |
  |---|---|
  | `QUEUED` | Work Management authorization service, inside receipt/outbox transaction |
  | non-state `SEND_ATTEMPT_RESERVED` | Outbox delivery service after CAS lease acquisition |
  | non-state `SEND_ATTEMPT_STARTED` | Outbox delivery service immediately before one external send, using serialized CAS on the active reservation fence |
  | `DELIVERED` | Outbox delivery service after one send and durable canonical-relay event ID is verified |
  | `RECONCILIATION_REQUIRED` | Outbox delivery or reconciliation service after typed uncertain-delivery condition |
  | `FAILED_RETRYABLE`, `FAILED_FINAL` | Reconciliation service under the versioned retry/error policy |
  | `REQUEUED` (`FAILED_RETRYABLE -> QUEUED`) | Reconciliation service under the versioned retry policy |
  | `ACKNOWLEDGED` | Work Management authorization service after exact assigned-agent signature verification |
  | `SUPERSEDED` | Work Management authorization service inside explicit human-reauthorization transaction |
  | `CANCELLED` | Work Management authorization service from an authenticated human cancellation/reassignment ruling |
  | non-state `TERMINALIZATION_REQUESTED` | Work Management terminalization coordinator after authenticated cancellation/supersession or audited configuration invalidation, serialized with `SEND_ATTEMPT_STARTED` |
  | non-state `ACK_REJECTED`, `DELIVERY_BLOCKED_CONFIG_STALE` | Authorization/reconciliation service respectively; diagnostic only and cannot advance state |

  External delivery/retry occurs only after committed `QUEUED` or `REQUEUED` plus
  `SEND_ATTEMPT_RESERVED` and the serialized pre-call `SEND_ATTEMPT_STARTED`; no
  `DELIVERED` event is pre-created. Terminalization requests and pre-call starts have
  one total order on the intent fence. No failure or requeue may append while a lease
  is active or reconciliation is unresolved. Accepted acknowledgement remains unique
  per intent while claim/run remains unique per lineage.
- **Lifecycle and terminals:** The only allowed transitions are
  `QUEUED -> DELIVERED -> ACKNOWLEDGED` only after a committed
  `SEND_ATTEMPT_RESERVED`, serialized `SEND_ATTEMPT_STARTED`, and verified external
  send; `QUEUED -> RECONCILIATION_REQUIRED` for uncertain delivery;
  `QUEUED|RECONCILIATION_REQUIRED -> FAILED_RETRYABLE -> REQUEUED ->
  QUEUED` using the same intent ID; and
  `QUEUED|DELIVERED|RECONCILIATION_REQUIRED|FAILED_RETRYABLE -> FAILED_FINAL`,
  `SUPERSEDED`, or `CANCELLED`. `ACKNOWLEDGED`, `FAILED_FINAL`, `SUPERSEDED`, and
  `CANCELLED` are terminal. `SUPERSEDED` is permitted only before
  `ACKNOWLEDGED`, with an explicitly linked pre-ack successor; no post-ack successor
  or lineage reopening is permitted. `ACKNOWLEDGED`, `FAILED_FINAL`, and `CANCELLED`
  close the lineage. A retry requires signed `REQUEUED` under the versioned retry
  policy and a new `SEND_ATTEMPT_RESERVED`; its attempt number is prior maximum plus
  one and never repeats. `DELIVERED` cannot regress; a reconciliation or delivery
  result older than the committed `DELIVERED` is an idempotent no-op. Stale leases,
  overlapping reservations, active leases, unresolved reconciliation, exhausted retry
  policy, binding/configuration mismatch, or discovered delivery fail closed without
  another send; exhausted policy appends `FAILED_FINAL` only after no active lease or
  unresolved reconciliation remains. A retry creates no second receipt, outbox
  identity, claim, or run.
- **Acknowledgement and recovery:** Only the exact enrolled assigned-agent pubkey
  may sign a valid acknowledgement. It must bind the intent ID, authorization
  revision and evidence digest, canonical channel ID, delivered Buzz event ID,
  agent claim/run ID, and acknowledgement timestamp. Human messages, channel names,
  another agent/channel, or a stale revision cannot acknowledge. After a possible send
  with unknown durable delivery state, the state becomes
  `RECONCILIATION_REQUIRED` only while the current state is not already
  `DELIVERED`; the canonical channel/relay is queried for the same intent ID and
  attempt before retry. If found and verified, existing state is backfilled with
  `DELIVERED`; if the state is already `DELIVERED`, the reconciliation is a stale
  idempotent no-op; if absent after the bounded check, append `FAILED_RETRYABLE` only
  after the lease is released and reconciliation is resolved. Only a signed
  `REQUEUED` followed by a new
  `SEND_ATTEMPT_RESERVED` permits a same-intent resend, and both Buzz and the runtime
  deduplicate it. An acknowledgement submission is keyed by the digest
  of its required signed bindings. An exact replay returns the existing accepted event
  idempotently. A different, stale, forged, wrong-key, wrong-channel, wrong-evidence,
  wrong-run, or second acknowledgement is rejected and recorded as a typed
  security/reconciliation event without PII; it cannot advance state or start work.
  Delivery, retry, and reconciliation side effects occur only after the event and
  projection transaction commits. Downstream work stays blocked until one valid
  acknowledgement exists.
- **Authoritative routing:** The key is
  `workspace.routing.steer_agent_handoff.channel_id` in audited Work Management
  workspace/POD configuration. The Tech Lead owns changes, each version records an
  immutable version, actor, timestamp, and reason, and the active audited
  configuration version has precedence with no fallback. Its current value is
  `10ac2fb4-f7fc-4dbc-bb73-8c545f31a470` (`#steer-team`). Repository prose, UI label,
  environment default, channel name, or hard-coded constant is never authoritative.
  A missing key, unknown/deleted channel, name/ID disagreement, relay/workspace
  mismatch, assigned-agent non-membership, or competing source causes a fail-closed
  conflict: no new receipt/outbox row, send, item/gate/phase/assignee/decision
  change, or change to an existing claim. The UI exposes the exact mismatch and
  current config version beside the dispatch action. “Routing correction resumes the
  existing claim” means unchanged binding gets same-intent transport repair; changed
  binding requires an explicitly authorized superseding intent on the same unique
  lineage and never starts a duplicate run.

### Authoritative 20-case pre-enrollment manifest

The Intent Brief itself is the authoritative pre-enrollment manifest. Each ID executes
once from the named seed; all 20 remain in the denominator and missing or
unclassifiable results fail.

| ID | Seed / mutation |
|---|---|
| SAVE-01 | revision r1, empty optional economics fields → valid populated Work Economics save |
| SAVE-02 | revision r1, existing economics values → valid replacement save |
| SAVE-03 | revision r1, valid lower-bound numeric values → save |
| SAVE-04 | revision r1, valid upper-bound/long permitted values at narrow viewport → save |
| DISP-01 | authorized r1, matching route v1, no prior receipt → deliver + valid ack |
| DISP-02 | authorized r1, matching route v1, receipt visible after reload → no duplicate dispatch |
| DISP-03 | authorized r1, matching route v1, agent service reads without human UI → deliver + valid ack |
| DISP-04 | authorized r1, matching route v1, assistive-tech/narrow UI → exactly one dispatch and local status |
| FAIL-01 | stale mutation revision r0 against server r1 → HTTP 409 |
| FAIL-02 | invalid Work Economics field set at r1 → validation failure |
| FAIL-03 | authorized r1 with missing canonical routing key → fail closed |
| FAIL-04 | authorized r1 with noncanonical/mismatched channel, relay, or membership → fail closed |
| ORDER-01 | old bootstrap response arrives after successful save response |
| ORDER-02 | two explicit saves; older response arrives after newer confirmed response |
| ORDER-03 | stale activity/receipt projection arrives after newer lifecycle event |
| ORDER-04 | delayed old failure arrives after a later authoritative success |
| REC-01 | exact authorization replay after receipt creation |
| REC-02 | two concurrent dispatch submissions with the same authorization/expected version |
| REC-03 | external send may have succeeded but response is lost; reconciliation finds existing delivery/ack |
| REC-04 | receipt/outbox committed but no durable Buzz delivery; reconcile absent, then same-intent retry |

The fixed cases also carry these named security assertions; no case is added or
substituted:

- `DISP-02`: reload/re-read the same receipt and replay the exact accepted
  acknowledgement; return the original acknowledgement event with no new event/run.
- `DISP-03`: attempt a wrong-key acknowledgement before the valid assigned-agent
  acknowledgement; reject it, then accept exactly one valid acknowledgement.
- `DISP-04`: after one valid acknowledgement, attempt a different second
  acknowledgement; reject it and keep the lineage terminal with one run.
- `REC-01`: replay the exact authorization and exact signed acknowledgement; both
  resolve idempotently to the original receipt/events.
- `REC-02`: submit two concurrent dispatch requests and two concurrent valid
  acknowledgement submissions with the same expected version; CAS permits one
  accepted transition/event and one run. Race cancellation, supersession, or config
  invalidation against the reservation and serialized pre-call
  `SEND_ATTEMPT_STARTED`; assert one total order on `reservation_fence`, no stale
  send after `TERMINALIZATION_REQUESTED`, and no failure/requeue while a lease is
  active or reconciliation is unresolved.
- `REC-03`: preserve the uncertain-send reconciliation case and verify discovered
  delivery/ack event hashes and signatures before backfill, including the NIP-01
  publisher proof against the Tech-owned `relay_event_signers` registry; assert the
  relay query is for the same intent and attempt, that a stale reconciliation after
  `DELIVERED` is an idempotent no-op, and that no retry occurs before requeue and a
  new send-attempt reservation.
- `REC-04`: after receipt commit under route/config v1 but before send, activate v2 or
  a mismatched binding; first append signed non-state
  `TERMINALIZATION_REQUESTED` and invalidate the reservation fence in the serialized
  terminalization domain, then append the typed diagnostic
  `DELIVERY_BLOCKED_CONFIG_STALE`. These are allowed non-state/audit records; “no
  lifecycle event” means no state-transition event and no current-state projection
  change. Send nothing and require explicit human reauthorization. When immutable
  lineage inputs, role, and assignee are unchanged, create one successor intent on the
  same lineage, atomically supersede the old intent, and permit only the existing/sole
  claim-run path.
- `FAIL-03` and `FAIL-04`: retain missing/noncanonical route failures and additionally
  assert signed non-state `TERMINALIZATION_REQUESTED` and reservation-fence
  invalidation precede the typed diagnostic for the stale or mismatched route. Those
  audit records are permitted; “no lifecycle event” means no state-transition event or
  current-state projection change. Assert no external send, claim, or run is produced
  by the rejected authority, and no failure/requeue occurs while a lease or unresolved
  reconciliation remains. Include rejection of an untrusted/retired/revoked relay
  publisher or registry mismatch before `DELIVERED`.
- `DISP-01`: assert the initial signed `QUEUED`/outbox commit, one committed
  `SEND_ATTEMPT_RESERVED`, exactly one relay send, relay verification, and only then
  the signed `DELIVERED` event before the valid acknowledgement.
- `REC-02`: include the active-lease and unique-attempt constraints so concurrent
  submissions cannot reserve or send the same intent/attempt twice; include the
  reservation fence and serialized pre-call start ordering.

For each case, record seed revision/config, action identity, expected authoritative
state and local UI/focus/announcement result, actual receipt/outbox/event/claim/run
IDs, HTTP/error result, and pass/fail. No case substitution or seed change is allowed
after execution starts; a required amendment creates a new manifest revision and
requires renewed Gate 1 consideration. The production observations remain incident
evidence only; recurrence frequency remains unmeasured.

## What "done and correct" means

- A successful mutation renders the authoritative server response in the initiating
  drawer and the reconciled activity state; reopening or reloading does not revert it.
- Every mutation is associated with an action/revision identity. A delayed or
  out-of-order response cannot overwrite a newer confirmed response, and an explicit
  retry cannot create a second durable mutation or handoff for the same identity.
- A `409`, validation error, transport failure, or blocked authorization is rendered
  beside the initiating control with an actionable explanation; the user's input is
  preserved and retry is explicit rather than automatic.
- Authorized dispatch emits exactly one durable, agent-readable receipt and outbox row
  for the versioned `dispatch_intent_id`; the receipt is a self-contained versioned
  snapshot with the complete fields above, including structured allowed/prohibited
  scope, authoritative item state, evidence revision/digest, both authorization
  timestamps and audit references, routing-config version, and acknowledgement
  policy/required-binding fields. Current acknowledgement truth is the ordered
  append-only event ledger plus rebuildable projection, not a mutation of the receipt;
  at most one accepted acknowledgement event exists per intent.
- A missing, stale, forged, replayed, or mismatched channel/authorization revision
  fails closed before dispatch or state change. A routing correction resumes the
  existing claim only when the receipt bindings remain exact and repair is same-intent;
  a changed binding requires an explicitly authorized superseding intent on the same
  `dispatch_claim_lineage_id`, and never creates a second run. Uncertain delivery
  reconciles before retry and reuses the same intent ID when bindings match.
- The outbox and append-only event ledger follow only the bounded lifecycle above,
  expose terminal state, and reconcile with Buzz and GitHub evidence. Compare-and-set
  and uniqueness rules reject stale transitions, duplicate events, and acknowledgement
  replays; activity and audit history contain no duplicate accepted event; downstream
  work remains blocked until a valid signed acknowledgement exists.
- Keyboard focus remains on or returns to the initiating control after completion;
  success and failure are announced through named status/error regions, including on
  narrow screens and for screen-reader users. Global banners are supplementary, not
  the only action result.

## Design intent

The open work-item drawer remains the action surface. Each mutation control gets a
local pending indicator, an inline success/error region, and an explicit retry path.
The server response is the state authority; the client may show pending but must not
present optimistic text as durable success. A stale response is ignored and leaves the
newer confirmed state visible. On success, the status region names the saved result;
on failure, it names the conflict/error and preserves input. Focus stays with the
initiating control or moves to the inline error only when needed to make the failure
perceivable, then returns to the control for retry.

Loading, empty, and error states are explicit: the drawer shows a pending state while
the action is in flight, does not fabricate a value when the authoritative item is
unavailable, and keeps the action-local error visible when the page-level request also
fails. Status and error regions have accessible names and live announcements; the
drawer remains usable at its existing narrow-screen width.

## Out of scope

- Drafting the 0028 Exam, changing application or worker code, changing schemas,
  deploying, merging, releasing, or retroactively mutating a human ruling.
- Selecting a provider/model, changing the broader Work Management authorization
  model, or changing the human Gate 1/2/3 authority rules.
- Claiming product demand, recurrence, or causal impact from the two incident
  observations; the signal series and frequency remain unmeasured.
- Treating the temporary `#steer-team` operating decision as proof that the permanent
  configuration-backed routing implementation already exists. Repository guidance
  and code constants are follow-on governed changes.

## Risks and default-closed touchpoints

This item is tagged `#security` because it touches authorization, agent dispatch,
cross-channel routing, durable receipts, acknowledgements, and replay/idempotency. It
is tagged `#privacy` because the required stable member/agent-key/fingerprint,
acknowledgement-signer, and human-authorization actor references are pseudonymous
personal data under the supervisory Tech ruling; `PRIV-01`, `PRIV-02`, and `PRIV-03`
apply. It is also tagged for accessibility, reliability, and design-system review. The
threat model is: an attacker or faulty integration may forge or replay a receipt,
route an authorized handoff to the wrong channel, forge an acknowledgement, reuse a
stale authorization revision, create duplicate work across retries, bypass a human
gate, or expose identity-linked authorization data through logs or an unresolved audit
pointer. The bounded response is to bind every receipt and outbox transition to the
exact work-item/role/authorization/evidence revision, deterministic intent ID, signed
acknowledgement bindings, and immutable channel ID; resolve the channel from the
active audited configuration version with no fallback; fail closed on absence or
mismatch; reconcile before retry; reject replay and stale revisions; keep gate
mutations human-only; and resolve audit pointers through the durable agent-readable
API. Verification failure must never degrade into a guessed route or optimistic
success.

The privacy contract is purpose-limited to authorization enforcement, provenance,
single-run/idempotency control, delivery reconciliation, and bounded security/audit
investigation. Store only stable internal references and minimum cryptographic
verification material; do not copy display names, email addresses, message bodies,
secrets, unrelated PII, or free-form scope beyond the authorized structured scope.
Receipt/outbox/review-assignment logs and telemetry contain only intent/receipt IDs,
review-assignment/ack/result IDs, lifecycle state, timestamps, and typed error
codes—not actor/member IDs, key material, authorization
text, or scope text. Before implementation, the data inventory must record each
identity-linked field, purpose, source, controller/workspace, 90-day terminal
retention, deletion owner/path, and any explicit hold. Retain identity-linked
receipt/outbox/acknowledgement/review-assignment/review-result records while nonterminal
and for 90 days after
`ACKNOWLEDGED`, `FAILED_FINAL`, `SUPERSEDED`, or `CANCELLED`, with no silent extension;
any legal/security hold must be explicit, scoped, time-bounded, and audited. At expiry
or eligible workspace/work-item deletion, delete receipts, outbox rows,
acknowledgements, review assignments/acknowledgements/results, identity mappings,
indexes, and replicas/backups under the normal
deletion schedule, retaining only non-identifying aggregate counts; a subject request
removes the subject-directory linkage and eligible records through the same auditable
cascade. Missing privacy inventory, missing or version-mismatched retention policy,
unavailable deletion path, or attempted PII logging blocks receipt/outbox/review-record
creation and dispatch while preserving the existing claim identity.

## Chosen approach

At the Intent level, choose authoritative-response reconciliation plus action-local
status and focus, with the versioned deterministic identity, immutable authorization
receipt, append-only lifecycle/acknowledgement ledger, compare-and-set transitions,
lineage-bound routing supersession, reconciliation-before-retry, and audited
configuration-backed routing contract above. This accepts a visible pending or
fail-closed result when authority is unavailable in exchange for avoiding false
success, duplicate work, and hidden errors.
The rejected alternatives are a global banner plus eventual reload, client-only
optimistic text, a hard-coded channel, or timestamp-based deduplication; each is
inconsistent with the incident evidence and the human routing decision.

## Evidence matrix

| Claim or scenario | Evidence classification | Exact reference | Status |
|---|---|---|---|
| Two durable `200` writes, later `409`, stale drawer until hard refresh | Production observation | [Issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56) | Observed; not a broader series |
| `Next action` appears saved, reverts after reload, no activity event | Production observation | [Comment #5310415277](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310415277) | Observed; not a repair pass |
| Unguarded post-write `load()`, page-level error, fixed drawer overlay | Source inspection | [page.tsx at d9dcb53](https://github.com/idrissenayat/federal-bd-platform/blob/d9dcb53398da166aea972eb678e3cfff058a10c6/flight-board/app/page.tsx#L517-L561) and [globals.css](https://github.com/idrissenayat/federal-bd-platform/blob/d9dcb53398da166aea972eb678e3cfff058a10c6/flight-board/app/globals.css#L110) | Confirmed in source |
| Hard-coded wrong channel, generic outbox channel, timestamp dedupe, free-text activity | Source inspection | [Comment #5310332219](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310332219), [authorization.ts](https://github.com/idrissenayat/federal-bd-platform/blob/d9dcb53398da166aea972eb678e3cfff058a10c6/flight-board/worker/authorization.ts#L104-L120), [api.ts](https://github.com/idrissenayat/federal-bd-platform/blob/d9dcb53398da166aea972eb678e3cfff058a10c6/flight-board/worker/api.ts#L492-L523) | Confirmed in source |
| `#steer-team` canonical route and fail-closed mismatch policy | Authenticated decision evidence | [Comment #5310397551](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310397551) | Decision recorded; implementation absent |
| Gate-1-ready brief scope expansion | Authenticated decision evidence | [Comment #5310403354](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310403354) | Decision recorded; Gate 1 pending |
| Deterministic dispatch identity, atomic receipt/outbox, signed acknowledgement, routing precedence, 20-case measurement | Authenticated decision evidence | [Comment #5310467779](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310467779) | Contract recorded; execution not run |
| Self-contained receipt schema, durable audit resolution, pseudonymous personal-data classification, privacy lifecycle/default-closed controls | Authenticated decision evidence | [Comment #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334) | Contract recorded; implementation not authorized |
| Immutable receipt, append-only lifecycle/ack ledger, CAS and replay rules, claim lineage/routing supersession, exact 20-case manifest, external revision provenance | Authenticated decision evidence | [Comment #5316551748](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316551748) | Contract recorded; implementation not authorized |
| Canonical root lineage formula/lifetime, signed event schema and authority matrix, exact replay/wrong-key/second-ack/stale-config/supersession mappings | Authenticated decision evidence | [Comment #5316704687](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316704687) | Contract recorded; implementation not authorized |
| Executable queued/send-reservation/delivery order, uncertain-send reconciliation, signed requeue authority, retry-attempt uniqueness, and v1 cryptographic/key-trust profile | Authenticated decision evidence | [Comment #5316789932](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316789932) | Contract recorded; implementation not authorized |
| Reservation fencing and serialized pre-call start, terminalization ordering, monotonic delivery/reconciliation, NIP-01 publisher trust, and fixed REC-02/REC-03/FAIL-03/FAIL-04 mappings | Authenticated decision evidence | [Comment #5316881629](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316881629) | Contract recorded; implementation not authorized |
| Exact-revision non-owning review assignments/receipts/idempotency, single primary claim separation, and stage-specific Critic inputs including the `PRE_GATE_1_BRIEF` no-Exam prerequisite | Authenticated decision evidence | [Comment #5316966355](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316966355) | Contract recorded; review only; Gate 1 pending |
| Complete append-only review assignment/acknowledgement/result receipts, RFC 8785 JCS-SHA-256 idempotency, authenticated append authority and bootstrap, canonical `#steer-team` route with no project fallback, privacy coverage, and aligned REC-04/FAIL-03/FAIL-04 terminalization assertions | Authenticated decision evidence | [Comment #5317059006](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5317059006) | Contract recorded; review only; Gate 1 pending |
| Local replay, concurrency, outbox delivery, partial-dispatch recovery | Not run | This Scout handoff did not execute live repair or integration paths | No pass/fail claim |
| Local reproduction of stale `Next action`/hidden `409` | Not run | Production observations above; no local live run claimed | No pass/fail claim |
| Independent repeated-signal frequency | Not run | `steer/signals/README.md`; `steer/operating-system/METRICS.md` | Unmeasured |

GATE 1: PENDING — no authenticated human Gate 1 ruling
GATE 1 EVIDENCE: PENDING — present this exact revision and a fresh independent Critic review to the named human
