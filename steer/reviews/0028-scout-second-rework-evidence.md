# Scout second-rework evidence — STR-028 Intent Brief 0028

**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Branch:** `scout/str-028-intent-brief`
**Parent revision:** `d9a2a0cc1855407ec9fb8f1a036177258bd987c6`
**Review role:** Scout evidence for the second authorized Intent Brief rework; this
is not a Critic review, human gate ruling, Exam, implementation evidence, or release
decision
**Controlling decision:** [Tech design decision #5310467779](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310467779)

## Authorized change

The authenticated Tech decision freezes the contracts that the previous independent
Critic found missing. This rework changes only the Intent Brief and this Scout
evidence file, preserving the same claim and branch from the parent revision. It does
not draft an Exam, change application or worker code, approve a gate, merge, deploy,
or release.

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

The evidence matrix now classifies the authenticated owner/Tech issue comments as
**authenticated decision evidence**, separate from production observations, source
inspection, local/non-production execution, and not-run proof obligations.

## Validation boundary

- No live replay, concurrency, outbox-delivery, or partial-dispatch run was executed.
- No claim is made that the implementation already satisfies these contracts.
- Gate 1 remains pending; a fresh independent Critic review must inspect the exact
  resulting revision before any named human Gate 1 decision.
