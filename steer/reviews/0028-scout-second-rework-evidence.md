# Scout fourth-rework evidence — STR-028 Intent Brief 0028

**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Branch:** `scout/str-028-intent-brief`
**Parent revision:** `1ab5adae90ea55deb12900dd476468c087e2cc05`
**Review role:** Scout evidence for the fourth authorized Intent Brief rework; this
is not a Critic review, human gate ruling, Exam, implementation evidence, or release
decision
**Controlling decisions:** [Tech design decision #5310467779](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310467779), [supervisory Tech decision #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334), and [supervisory Tech decision #5316551748](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316551748)

## Authorized change

The authenticated Tech decisions freeze the contracts that the previous independent
Critic found missing. This rework changes only the Intent Brief, this Scout evidence
file, and the project Decision Log, preserving the same claim and branch from the
parent revision. It does not draft an Exam, change application or worker code, approve
a gate, merge, deploy, or release.

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
  intent records monotonic event version, type/state, timestamp, actor/service identity,
  prior-event hash, payload digest, and applicable signature. Agent-readable status is
  receipt plus ordered ledger plus rebuildable current projection.
- Every transition appends one event and updates the projection in one transaction with
  compare-and-set on `expected_event_version`. Enforce unique
  `(dispatch_intent_id,event_version)`, one outbox identity per intent, and at most one
  accepted `ACKNOWLEDGED` event. Stale versions fail without a second event or side
  effect. Acknowledgement submissions use the digest of their signed bindings: exact
  replay is idempotent; different/stale/forged/wrong-key/wrong-channel/wrong-evidence/
  wrong-run/second acknowledgements become typed security/reconciliation events without
  PII and cannot advance state or start work. External effects occur only after the
  event/projection transaction commits; uncertain delivery appends reconciliation
  required and reconciles before same-intent retry. Privacy retention/deletion covers
  receipt, ledger, projection, outbox, signatures/key references, indexes, and replicas
  together.
- The allowed lifecycle is frozen as `QUEUED -> DELIVERED -> ACKNOWLEDGED`, with
  `RECONCILIATION_REQUIRED` for uncertain delivery, retry through
  `FAILED_RETRYABLE -> QUEUED` using the same intent, and terminal
  `FAILED_FINAL`, `SUPERSEDED`, or `CANCELLED` states. Retries create no second
  receipt, outbox identity, claim, or run.
- Only the exact enrolled assigned-agent pubkey may sign an acknowledgement binding
  intent ID, authorization revision/evidence digest, canonical channel ID, delivered
  Buzz event ID, agent claim/run ID, and acknowledgement timestamp. Uncertain
  delivery reconciles against the canonical channel/relay before same-intent retry;
  downstream work remains blocked without one valid acknowledgement.
- A separate deterministic `dispatch_claim_lineage_id` binds workspace/POD, work-item
  stable ID/key, STEER workflow, assigned role, enrolled member ID, and root
  human-authorization lineage. At most one agent claim/run exists per lineage. Same-
  intent transport repair is legal only when active audited routing version, canonical
  channel ID, workspace/relay binding, and membership exactly equal the receipt; it
  reuses intent, receipt, outbox, lineage, claim, and run. A changed channel/config
  version/workspace-relay/membership authority/evidence/assignee/scope requires an
  explicitly authorized new intent referencing the lineage and `supersedes_intent_id`;
  the old intent is atomically superseded without a new runtime claim/run. Delivery and
  retry mismatch fails closed; uncertain old delivery is reconciled first, and a late
  acknowledgement for a superseded intent cannot authorize downstream work.
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
  substitution or seed change is allowed after execution starts.

## Revision provenance

The authorized parent is `1ab5adae90ea55deb12900dd476468c087e2cc05`. A Git-tracked file
cannot contain the hash of the commit that contains itself, so this evidence records
the parent and binds the review target to the immutable commit named in the external
Buzz Critic request/result and its exact artifact URLs. No self-referential follow-up
commit is created merely to write its own hash.

## Evidence classification

The evidence matrix now classifies the authenticated owner/Tech issue comments,
including the receipt-schema/privacy ruling at [comment #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334) and the immutable-event/routing/manifest ruling at [comment #5316551748](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316551748),
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
