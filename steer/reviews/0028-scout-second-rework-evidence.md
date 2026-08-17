# Scout sixth-rework evidence — STR-028 Intent Brief 0028

**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Branch:** `scout/str-028-intent-brief`
**Parent revision:** `5943b2d5055bf4df7ec14735aaf4a74527acc31d`
**Review role:** Scout evidence for the sixth authorized Intent Brief rework; this
is not a Critic review, human gate ruling, Exam, implementation evidence, or release
decision
**Controlling decisions:** [Tech design decision #5310467779](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310467779), [supervisory Tech decision #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334), [supervisory Tech decision #5316551748](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316551748), [supervisory Tech decision #5316704687](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316704687), and [supervisory Tech decision #5316789932](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316789932)

## Authorized change

The authenticated Tech decision #5316789932 freezes the contracts that the previous
independent Critic found missing. This rework changes only the Intent Brief, this
Scout evidence file, and the project Decision Log, preserving the same claim and
branch from parent revision `5943b2d5055bf4df7ec14735aaf4a74527acc31d`. It does not
draft an Exam, change application or worker code, approve a gate, merge, deploy, or
release.

## Contract incorporated

- `dispatch_intent_id` is the SHA-256 of JCS-canonicalized
  `steer-dispatch-intent/v1` payload containing workspace/POD, work item, workflow,
  enrolled agent identity, authorization revision/audit event, immutable evidence,
  accepted forecast, canonical channel ID, and authorized Next-action hash.
- The uniqueness boundary is one claim/run for one intent ID across Work Management,
  outbox, Buzz, retries, routing corrections, and agent runtime. Material
  authorization, evidence, assignee, or scope changes create a new revision and
  supersede rather than delete the prior receipt.
- One transaction validates authorization and routing, reserves the unique intent,
  writes the immutable receipt, and creates exactly one outbox row before delivery.
  Delivery/retry cannot change item, gate, phase, assignee, decision, or downstream
  authorization state.
- The immutable receipt is an authorization snapshot only: it carries the required
  acknowledgement policy/required-binding fields, not mutable acknowledgement state
  or a future signature. The same initial transaction creates the unique receipt, one
  outbox identity, and `v0: QUEUED`; an append-only `dispatch_event` ledger keyed by
  intent uses the exact `steer-dispatch-event/v1` fields: intent/lineage IDs,
  event/expected versions, previous-event hash, event/prior/resulting states, UTC
  timestamp, authorized actor/service stable ID and key version, typed payload digest,
  receipt/routing/evidence bindings, and external references. Agent-readable status is
  receipt plus ordered ledger plus rebuildable current projection.
- Every transition appends one event and updates the projection in one transaction with
  compare-and-set on `expected_event_version`. `v0:QUEUED` is version 0 with expected
  version -1 and null prior hash; every next event is exactly
  `expected_event_version + 1`, and its prior hash is SHA-256 of exact preceding
  canonical bytes. Every event is signed by its authorized appending service key over
  the SHA-256 canonical payload; `ACKNOWLEDGED` also verifies the assigned-agent
  signature. Unknown schema/key, unauthorized actor, bad signature/hash, skipped/reused
  version, illegal transition, stale expected version, or binding mismatch is rejected
  before side effect and emits only a typed no-PII diagnostic. Exact signed-binding
  replay is idempotent; wrong-key/second acknowledgements cannot advance state. Privacy
  retention/deletion covers receipt, ledger, projection, outbox, signatures/key
  references, indexes, and replicas together.
- The authority matrix is fixed: Work Management authorization service appends
  `QUEUED`, `ACKNOWLEDGED` after exact agent-signature verification, `SUPERSEDED` in
  explicit human reauthorization, and `CANCELLED` from authenticated human
  cancellation/reassignment; the outbox delivery service appends `DELIVERED` after
  canonical-relay verification; outbox/reconciliation appends
  `RECONCILIATION_REQUIRED`; reconciliation appends `FAILED_RETRYABLE`/`FAILED_FINAL`;
  the outbox delivery service alone appends non-state `SEND_ATTEMPT_RESERVED` after
  CAS lease acquisition, and reconciliation alone appends signed `REQUEUED` from
  `FAILED_RETRYABLE` to `QUEUED` under the versioned retry policy;
  authorization/reconciliation append diagnostic-only `ACK_REJECTED`/
  `DELIVERY_BLOCKED_CONFIG_STALE`. No unsigned event is allowed.
- The executable delivery sequence is fixed: commit the immutable receipt, unique
  outbox row, and signed `v0:QUEUED`; commit one leased signed non-state
  `SEND_ATTEMPT_RESERVED` with unique intent/attempt and canonical relay bindings;
  perform exactly one external send; verify the durable relay event; then append
  signed `DELIVERED`. Timeout, unknown result, or crash without proof appends
  `RECONCILIATION_REQUIRED`; the same intent/attempt is queried before retry, and an
  absent delivery becomes `FAILED_RETRYABLE`. A retry requires signed `REQUEUED` by
  the reconciliation service under the versioned retry policy, then a new unique
  `SEND_ATTEMPT_RESERVED`; attempt numbers never repeat and stale leases, overlap,
  exhausted policy, or binding mismatch fail closed.
- The allowed lifecycle is frozen as `QUEUED -> DELIVERED -> ACKNOWLEDGED` only after
  reservation and verified send, with `RECONCILIATION_REQUIRED` for uncertain
  delivery, retry through `FAILED_RETRYABLE -> REQUEUED -> QUEUED` using the same
  intent, and terminal `FAILED_FINAL`, `SUPERSEDED`, or `CANCELLED` states.
  `SUPERSEDED` is pre-ack only with an explicitly linked successor;
  `ACKNOWLEDGED`, `FAILED_FINAL`, and `CANCELLED` close the lineage. Retries create no
  second receipt, outbox identity, claim, or run.
- The v1 cryptographic profile is fixed: RFC 8785 JCS, UTF-8 without BOM, and
  `SHA-256(UTF8(RFC8785(unsigned steer-dispatch-event/v1 payload)))`; BIP-340 Schnorr
  over secp256k1 on the 32-byte digest; 32-byte x-only lowercase-hex public keys and
  64-byte lowercase-hex signatures; and the same profile for the versioned
  `steer-dispatch-ack/v1` binding. `previous_event_sha256` hashes the exact canonical
  predecessor envelope including signatures. The audited Tech-owned
  `workspace.security.dispatch_event_signers` registry binds service roles and event
  types to key versions, validity intervals, and `ACTIVE|RETIRED|REVOKED` status;
  historical retired signatures may verify, but retired/revoked keys cannot sign new
  events, effective revocations fail closed, and registry rotation never rewrites
  history.
- Only the exact enrolled assigned-agent pubkey may sign an acknowledgement binding
  intent ID, authorization revision/evidence digest, canonical channel ID, delivered
  Buzz event ID, agent claim/run ID, and acknowledgement timestamp. Uncertain
  delivery reconciles against the canonical channel/relay before same-intent retry;
  downstream work remains blocked without one valid acknowledgement.
- `dispatch_claim_lineage_id` is the exact root formula
  `SHA-256(JCS({schema:"steer-dispatch-lineage/v1", originating_workspace_pod_id, work_item_stable_id, work_item_key, workflow:"STEER", root_human_authorization_audit_event_id}))`.
  Those five inputs are immutable; role, enrolled member/agent, evidence, scope, route,
  configuration, and individual authorization revision are intent/receipt inputs.
  Before acknowledgement, changed evidence/scope/route/config/relay/membership proof
  may use an explicitly authorized same-lineage successor only when originating
  workspace/POD, work item, workflow, root objective, role, and enrolled member/agent
  are unchanged. A role/assignee/workspace/work-item/workflow/root-objective change
  creates a new lineage with cross-lineage terminalization and mandatory new human
  authorization. `ACKNOWLEDGED`, `FAILED_FINAL`, and `CANCELLED` close a lineage;
  post-ack recovery requires new root authorization/new lineage/new run. Exactly one
  accepted claim/run is allowed per lineage.
- Stable member/agent-key/fingerprint, acknowledgement-signer, and human-actor
  references are pseudonymous personal data. The privacy contract is purpose-limited,
  minimizes stored identity and cryptographic material, prohibits PII in logs,
  requires inventory before implementation, retains identity-linked records for 90
  days after terminal state, defines auditable deletion and scoped time-bounded holds,
  and fails closed if inventory, retention, deletion, or logging controls are absent.
- Routing is sourced from audited Work Management workspace/POD key
  `workspace.routing.steer_agent_handoff.channel_id`, with the active audited
  configuration version as sole precedence and no fallback. Its current value is
  `10ac2fb4-f7fc-4dbc-bb73-8c545f31a470` (`#steer-team`). Missing, unknown,
  conflicting, mismatched, non-member, or competing routing inputs fail closed with
  no receipt, outbox row, send, state change, or existing-claim change.
- Measurement is pre-enrolled at exactly 20 non-production cases across four cases
  each for successful saves, successful dispatch authorizations, validation/conflict
  failures, delayed/out-of-order responses, and replay/concurrent/partial-dispatch
  recovery. The authoritative manifest is in the Brief as SAVE-01..04, DISP-01..04,
  FAIL-01..04, ORDER-01..04, and REC-01..04 with named seeds and mutations. The
  denominator is all enrolled cases; missing or unclassifiable results fail; the two
  production observations remain incident evidence outside the denominator. Each case
  records seed revision/config, action identity, expected authoritative and UI result,
  actual receipt/outbox/event/claim/run IDs, HTTP/error result, and pass/fail; no
  substitution or seed change is allowed after execution starts. The fixed security
  mappings are: `DISP-02` exact acknowledgement replay/no new event or run;
  `DISP-03` wrong-key rejection before one valid acknowledgement; `DISP-04` second
  acknowledgement rejection after valid ack; `REC-01` exact authorization and ack
  replay; `REC-02` concurrent dispatch and acknowledgement CAS plus unique active
  attempt reservation; `REC-03` hash/signature verification before uncertain-send
  backfill and no retry before requeue/reservation; `REC-04` v2 stale-config diagnostic,
  no send, explicit reauthorization, and same-lineage successor only when immutable
  inputs/role/assignee match; and `FAIL-03`/`FAIL-04` no event/projection/send/claim/run
  on rejected authority.

## Revision provenance

The authorized parent is `5943b2d5055bf4df7ec14735aaf4a74527acc31d`. A Git-tracked file
cannot contain the hash of the commit that contains itself, so this evidence records
the parent and binds the review target to the immutable commit named in the external
Buzz Critic request/result and its exact artifact URLs. No self-referential follow-up
commit is created merely to write its own hash.

## Evidence classification

The evidence matrix now classifies the authenticated owner/Tech issue comments,
including the receipt-schema/privacy ruling at [comment #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334), the immutable-event/routing/manifest ruling at [comment #5316551748](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316551748), the lineage/event-authority/security-case ruling at [comment #5316704687](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316704687), and the executable-sequence/cryptographic-profile ruling at [comment #5316789932](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316789932),
as **authenticated decision evidence**, separate from production observations, source
inspection, local/non-production execution, and not-run proof obligations.

## Validation boundary

- No live replay, concurrency, outbox-delivery, or partial-dispatch run was executed.
- No claim is made that the implementation already satisfies these contracts.
- This documentation revision adds no receipt records or identity-linked runtime data;
  it records the required pseudonymous-personal-data treatment for future governed
  implementation.
- The exact review target is intentionally supplied by the external Buzz Critic
  request/result rather than written self-referentially into this file.
- Gate 1 remains pending; a fresh independent Critic review must inspect the exact
  resulting revision before any named human Gate 1 decision.
