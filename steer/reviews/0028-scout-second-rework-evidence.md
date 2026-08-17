# Scout second-rework evidence — STR-028 Intent Brief 0028

**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Branch:** `scout/str-028-intent-brief`
**Parent revision:** `5881f77ed5be8fff4bea028ac7c993e8fb7a3f00`
**Review role:** Scout evidence for the third authorized Intent Brief rework; this
is not a Critic review, human gate ruling, Exam, implementation evidence, or release
decision
**Controlling decisions:** [Tech design decision #5310467779](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310467779) and [supervisory Tech decision #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334)

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
- The immutable receipt is a self-contained versioned, agent-readable snapshot with
  receipt and intent identifiers, workspace/POD and work-item identity, authorization
  revision and timestamp, workflow/state, assigned role, enrolled member/key
  ID/version and public-key fingerprint, structured allowed/prohibited scope, exact
  evidence URL/revision/digest, accepted-forecast and human-authorization timestamps
  plus audit-event IDs, canonical channel and routing-config version, Next-action
  hash, acknowledgement state, and signed acknowledgement bindings. Audit-event IDs
  resolve through a durable append-only agent-readable audit API using the enrolled
  service identity; missing, stale, unavailable, or mismatched resolution fails closed
  and preserves the existing claim identity.
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
  recovery. The denominator is all enrolled cases; missing or unclassifiable results
  fail; the two production observations remain incident evidence outside the
  denominator.

## Evidence classification

The evidence matrix now classifies the authenticated owner/Tech issue comments,
including the receipt-schema/privacy ruling at [comment #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334),
as **authenticated decision evidence**, separate from production observations, source
inspection, local/non-production execution, and not-run proof obligations.

## Validation boundary

- No live replay, concurrency, outbox-delivery, or partial-dispatch run was executed.
- No claim is made that the implementation already satisfies these contracts.
- This documentation revision adds no receipt records or identity-linked runtime data;
  it records the required pseudonymous-personal-data treatment for future governed
  implementation.
- Gate 1 remains pending; a fresh independent Critic review must inspect the exact
  resulting revision before any named human Gate 1 decision.
