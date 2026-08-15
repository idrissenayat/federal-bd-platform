# Intent Brief — 0024 Governed agent execution from STEER assignments

**Status:** draft
**Tags:** #security #privacy #a11y #reliability #design-system
**Date opened:** 2026-08-15
**Work item:** [STR-024 / issue #52](https://github.com/idrissenayat/federal-bd-platform/issues/52)
**Workflow:** STEER (frozen)
**Assignment:** STEER Scout; evidence preparation only

## Expected outcome and measurement

- **Primary outcome:** An authenticated human assignment produces one durable,
  reviewable agent run whose progress, blocker, terminal result, telemetry, and exact
  evidence are bound to the assigned work item and revision. A human can tell whether
  work is running, waiting, stopped, failed, or ready for review without relying on a
  chat transcript.
- **Value hypothesis:** If STEER Work Management remains the authority for assignment,
  state, priority, gates, forecasts, outcomes, and closure, while a bounded runtime
  owns execution, then the team will spend less time reconciling ambiguous or
  unreviewable agent activity and will see fewer duplicate, stale, or unauthorized
  transitions. This is a falsifiable hypothesis, not an observed result.
- **Baseline / denominator:** No STR-024 run baseline or concrete user-signal series is
  present in the checkout. Before rollout, record every authorized dispatch attempt in
  the first observation cohort, including duplicate/replayed attempts, claim result,
  time to review-ready or blocker, stale-lease recovery, human intervention, evidence
  completeness, and unauthorized-transition attempts. The denominator is all
  authorized dispatch attempts in that cohort; rejected unauthorized attempts are a
  separate guardrail denominator.
- **Observation window:** First 10–20 authorized runs, or 30 calendar days after
  release, whichever comes first; extend until at least 10 authorized runs exist. The
  observation window and cohort size must be frozen before Gate 1 approval.
- **Proposed minimum meaningful signal:** In the frozen cohort, at least 90% of
  authorized dispatches reach a terminal state or an explicit awaiting-human-review
  state with complete evidence, while 100% have exactly one durable run identity and
  assigned-worker authentication. The target is a proposal for human ruling, not a
  claim about current performance.
- **Guardrail measure:** Zero unauthorized agent claims or work-item authority changes;
  zero agent gate approvals, reprioritizations, reassignments, merges, releases, or
  closures; zero secret or restricted-data leakage into logs/evidence; and zero silent
  duplicate terminal effects. Any denominator shortfall or missing telemetry is
  reported rather than excluded.

## Who this is for

The primary user is a Product Lead or delivery owner who assigns a bounded work item
and must later make a human review or gate decision from trustworthy evidence. The
secondary users are an enrolled agent that needs a precise execution boundary, a Tech
Lead/Test/Critic reviewer who needs reproducible run evidence, and an operations owner
who needs to detect stale, failed, revoked, or degraded runtime activity.

## Problem and why now

STEER currently has an explicit separation between work authorization, communication,
engineering evidence, and bounded agent runtime, but the minimum durable execution
contract is not yet defined for this item. Without that contract, an authorized
assignment can be difficult to distinguish from a chat request, a retry can create an
untraceable duplicate, a lost worker can leave work appearing active, and a reviewer
may receive output without knowing which work-item revision, identity, provider, or
runtime produced it.

The evidence is narrow and must not be overstated:

- Issue [#52](https://github.com/idrissenayat/federal-bd-platform/issues/52) records the
  requested vertical slice: durable idempotent runs, assigned-agent claim, lease and
  heartbeat, progress, retry/backoff, stop/cancel, failure, telemetry, exact evidence
  return, explicit human review, Buzz mirroring, and server-side authority limits.
- The authenticated owner comment
  [STR-024 authoritative dispatch evidence](https://github.com/idrissenayat/federal-bd-platform/issues/52#issuecomment-5303465502)
  records the frozen STEER workflow, active state, Scout assignment, Gate 1 pending
  evidence-preparation hold cleared, accepted owner forecast, and implementation
  authority set to none. It authorizes this Brief and fresh Critic evidence only.
- Issue #52 states that the item originated after the STR-010 Builder handoff stopped
  because a matching governed Brief and Exam did not exist. That is process evidence of
  a missing contract, not evidence of customer demand or measured operational pain.
- The local [signals inbox](../signals/README.md) contains the intake rule but no
  concrete signal records in this checkout. The local
  [metrics definition](../operating-system/METRICS.md) provides the measurement
  framework but no current STR-024 observations. Demand and performance therefore
  remain unvalidated until the authorized pilot records them.

This item is now timely because the authorized handoff identifies a precise missing
control-plane contract and blocks implementation until the contract is written and
reviewed. It does not justify claims that governed execution is already faster, safer,
or preferred by users.

## What "done and correct" means

1. **Authority and identity:** A run can be created only from an authenticated STEER
   dispatch for a specific work-item key, project/POD scope where applicable, exact
   work-item revision, assigned agent identity, approved workflow, and cleared human
   hold. The worker identity is distinct from the human dispatcher and is checked on
   every consequential run mutation.
2. **Human/agent boundary:** Humans retain authority over assignment, priority,
   workflow, scope, gates, forecasts, outcomes, reprioritization, reassignment, merge,
   release, and closure. The assigned agent may execute only the bounded next action,
   report progress, return evidence, request clarification, stop when instructed, or
   surface a blocker. The agent cannot approve or record a human ruling or widen its
   own permissions.
3. **Durable lifecycle:** The contract names and durably records at least
   `AUTHORIZED`, `CREATED`, `CLAIMED`, `RUNNING`, `RETRY_WAIT`, `STOP_REQUESTED`,
   `STOPPED`, `FAILED_BLOCKED`, and `AWAITING_HUMAN_REVIEW`. Each transition records
   the authenticated actor, previous and next state, reason/code, monotonic event
   sequence, UTC time, work-item revision, and run id. A terminal result cannot be
   silently rewritten; a human review or later gate is a separate state transition.
4. **Idempotency:** The dispatch carries a stable idempotency key bound to the
   authorization event and work-item revision. Replaying the same authorized dispatch
   returns the existing run and emits an auditable replay event; it does not create a
   second active run or repeat a terminal side effect. A genuinely new revision or
   explicitly authorized retry has a new run/event identity and a visible relation to
   its predecessor.
5. **Claim and lease:** Only the exact assigned, authenticated worker can claim the
   run. A claim is conditional on the run still being claimable and records the worker,
   runtime, lease expiry, and claim event. Lease expiry makes the run visibly stale and
   eligible for the defined recovery/retry path; it does not silently transfer
   ownership or authorize a different agent.
6. **Heartbeat and progress:** Heartbeats are bounded, authenticated, monotonic, and
   associated with the run lease. Progress events state a safe plain-language phase,
   timestamp, and optional redacted evidence reference; they do not expose prompts,
   secrets, or restricted source content. Missing heartbeats surface a stale condition
   with an owner/action/dependency rather than presenting stale work as live.
7. **Retry and failure:** Transient failures use bounded, observable retry/backoff
   policy and preserve the original failure and attempt history. Non-retryable,
   exhausted, revoked, authorization, provider, validation, and evidence-binding
   failures become a visible blocker with owner, next action, dependency, and retry
   eligibility. Retry never bypasses a human hold or changes assignment.
8. **Stop and cancel:** An authenticated authorized human can request stop/cancel;
   the runtime acknowledges it, stops new work at the next safe boundary, records the
   result, and preserves already-created evidence. A worker cannot cancel another
   worker's run or convert stop into success. Races between stop, retry, lease expiry,
   and completion resolve by a documented precedence rule and remain auditable.
9. **Evidence return:** A review-ready return includes the work-item key and exact
   revision, run id, assigned and actual worker identities, lifecycle/event digest,
   terminal status, start/end times, provider/model/runtime and adapter versions,
   token/cost/time telemetry where available, changed artifact or evidence references
   with integrity digests, warnings/unknowns, and any blocker or retry history. It is
   stored or linked through the engineering evidence surface; Buzz mirrors the event
   but is never the authority. Missing evidence is an explicit failure, not an implied
   success.
10. **Provider and model portability:** Execution depends on a versioned runtime
    adapter contract (identity, tools, start/stop, activity, evidence, health, and
    revocation), not one provider or model. Provider/model changes are visible in
    telemetry and replay/evidence metadata. Secrets remain in approved secret storage
    and are never placed in prompts, logs, exports, or evidence links.
11. **Telemetry and learning:** Emit stable, privacy-reviewed events for dispatch,
    create, claim, heartbeat, progress, retry, stop/cancel, failure, evidence return,
    awaiting-human-review, and adapter health. Capture latency, retry count, stale
    recovery, human active minutes, token/cost/time telemetry, and guardrail failures
    with explicit denominators. Missing or impossible observations are marked as such.
12. **Accessibility and clarity:** The work-item view exposes current state, owner,
    next permitted action, blocker, lease freshness, and review status in plain text.
    Keyboard users can reach all controls; controls and live updates have accessible
    names and semantic status; focus is preserved on refresh; state is not conveyed by
    color alone; loading, empty, denied, stale, disconnected-adapter, retrying, and
    error states are actionable. A screen-reader user can distinguish agent progress
    from a human decision request.
13. **Security and privacy:** Server-side authorization is default-deny and scoped to
    organization/POD/project/work item as applicable. Replay, IDOR, forged worker
    identity, cross-item evidence binding, prompt injection in work fields, concurrent
    claims, stale-session races, provider outage, and compromised adapter credentials
    are treated as attacks. Only public, unclassified, or synthetic data is in scope;
    CUI, FCI, export-controlled, proprietary proposal, and classified material remain
    excluded. Run metadata is minimized, secrets and personal data are redacted, and
    a data inventory, retention period, deletion/revocation path, and access audit are
    required before implementation. No retention duration is guessed in this Brief.
14. **Rollout and rollback:** The implementation will use a reversible, observable
    rollout boundary defined in the future Exam: disabled or hold state leaves existing
    work and evidence intact; rollback stops new dispatch/run creation without deleting
    evidence or changing human decisions; recovery resumes only after adapter health,
    authorization, idempotency, and telemetry checks pass. No rollout, deployment, or
    release is authorized by this Brief.
15. **Falsifiable evaluation:** The final cohort records the proposed primary outcome,
    denominator, observation window, minimum signal, guardrails, first-pass/rework,
    escaped defects, human judgment time, operational cost, and missingness from
    `operating-system/METRICS.md`. It reports observed results and contrary cases; it
    does not claim universal STEER superiority from this item.

## Design intent

The Flight Board/work-item surface is the source of truth. A compact run panel should
answer “what was authorized, who owns it now, what happened, what is blocked, and what
may happen next?” before showing implementation detail. Use existing design-system
tokens and semantic status components. Make human-only actions visually and
semantically distinct from agent activity, and show the authority source and exact
revision beside consequential state.

The lifecycle should read as a durable event timeline, not a chat transcript:

```text
human dispatch → durable run → assigned worker claim → progress/heartbeat
       ├─ retry/backoff ────────────────┐
       ├─ stop/cancel → stopped         │
       ├─ lease loss → stale/recover    │
       └─ failure → visible blocker ────┘
                         ↓
             evidence return → awaiting human review
```

Every view has explicit loading, empty/no-run, denied, stale, disconnected-adapter,
retrying, and error states. A run that has no current heartbeat is not displayed as
healthy. Buzz receives concise claim, progress, blocker, completion, and human-review
mirrors with stable links back to Work Management and GitHub; a Buzz message cannot
create or alter authority.

## Out of scope

- Drafting or freezing the Exam; that is the next authorized Test/Architect sequence
  after human Gate 1.
- Implementation, schema/migration work, runtime deployment, release, merge, or gate
  approval under STR-024.
- Autonomous gate, bid/no-bid, forecast, priority, assignment, outcome, merge, release,
  closure, or external-communication decisions.
- Hidden or best-effort execution when Work Management, identity, adapter health, or
  evidence storage is unavailable.
- A provider-specific prompt/runtime design, model selection, model quality claim, or
  provider lock-in.
- Billing, paid-agent purchasing, or money movement.
- CUI, FCI, classified, export-controlled, proprietary proposal, or other restricted
  data handling; production multi-tenancy or broad plugin permissions.
- Unbounded crawling, external side effects, email/message blasts, or an assertion that
  process completion proves customer value.

## Risks and default-closed touchpoints

This brief is tagged #security, #privacy, #a11y, #reliability, and #design-system.
Authentication, authorization, session/lease handling, new personal-data telemetry,
evidence retention/deletion, and destructive data operations are default-closed. Gate 1
must name the authoritative state-transition contract, worker-authentication method,
data inventory and retention/deletion policy, and rollback owner before implementation
or an Exam is authorized. A typed line in this file is not itself gate evidence.

**Threat model:** An attacker or faulty adapter may forge/replay a dispatch, impersonate
an enrolled worker, claim the same run concurrently, bind evidence from another item,
inject instructions through work fields, replay a stale lease, exfiltrate provider
credentials through telemetry, or exploit a provider/network partition to create hidden
side effects. Server-side scoped authorization, stable idempotency keys, conditional
claims, lease fencing, append-only/auditable events, redaction, adapter revocation,
health holds, and explicit terminal-state rules are required mitigations. Residual
risk remains for provider compromise, bad human authorization, and unreviewed model
output; those risks stay with the human review boundary and must be visible rather than
silently inferred away.

**Privacy and data handling:** The proposed minimum record is work-item/run identity,
authorized scope, state events, safe progress, evidence references/digests, and
provider/model/token/cost/time metadata. Prompts, raw credentials, private keys, and
restricted source content are not required for this slice and must not enter shared
logs or Buzz. Exact retention, deletion, legal basis, and access-review cadence are
unanswered default-closed decisions; the implementation must stop at Gate 1/Exam
preparation until a human ruling and data-inventory entry exist.

## Proposed approach for Gate 1 framing

Keep STEER Work Management authoritative and define a narrow, versioned execution
adapter contract around durable run records, fenced claims/leases, append-only events,
redacted evidence references, and a communication mirror. Prefer the smallest
provider-neutral vertical slice that can prove authorization, idempotency, recovery,
evidence binding, and human review without introducing autonomous authority. The
Architect should compare concrete storage/queue/runtime options after Gate 1; this
Scout brief does not select an implementation, provider, schema, or deployment.

Rejected at this stage: treating Buzz as a queue or authority source; using chat history
as the run ledger; allowing a worker to self-assign or self-approve; silently retrying
side effects; storing secrets/raw prompts in evidence; or expanding to multi-provider,
multi-tenant, money, or restricted-data capability before the minimum contract is
verified.

---

GATE 1: PENDING — human Product Lead ruling required for this exact revision
GATE 1 EVIDENCE: PENDING — authenticated approval must link this revision and the
corresponding durable STEER Work Management record
