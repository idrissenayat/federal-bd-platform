# Exam — 0028 Stale post-write feedback and action visibility

**Brief:** `steer/briefs/0028-stale-post-write-feedback.md` at approved Gate-1 target `0f83de8248771d35292ee57b56186493b5b71b1a`
**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Workflow:** STEER
**Gate-1 authority:** Human receipt `#5317465104`; the exact approved Brief revision is the sole product/design authority for this Exam.
**Exam stage:** `GATE_2_EXAM`; design and proof obligations only. This file does not authorize implementation, deployment, release, or a human gate ruling.
**Guardrails in force:** CORE-01..11, SEC-01..05, PRIV-01..03, A11Y-01..03, REL-01..04, DES-01..02

## 1. Frozen authority and boundaries

This Exam turns the approved Brief into falsifiable acceptance oracles. It does not
re-interpret the Brief, change its scope, add a case to its denominator, or claim that
any implementation or live delivery path has already passed.

- The primary outcome is authoritative saved-state feedback in the initiating drawer:
  success, actionable failure with preserved input, or explicit pending/blocked state.
- The production STR-027 and `Next action` observations remain incident evidence only;
  they are not denominator observations and do not prove this Exam passes.
- The observation matrix is exactly the 20 Brief case IDs. A missing, unclassifiable,
  substituted, or excluded result is a failure. Each case is executed once from its
  named seed. `FAIL-03`, `FAIL-04`, and `REC-04` reset to an isolated copy of their
  named seed for every mandatory substep; substeps do not become new case IDs.
- The canonical route is the audited Work Management value
  `workspace.routing.steer_agent_handoff.channel_id`; the current design-evidence
  value is `10ac2fb4-f7fc-4dbc-bb73-8c545f31a470` (`#steer-team`). A project channel,
  UI label, environment default, repository prose, or hard-coded constant cannot be
  used as a fallback or authority.
- Agent actions cannot create, approve, or impersonate a human gate. A Critic result
  is non-owning review evidence; only the authorized human Tech Lead may record Gate 2.

## 2. Test harness and immutable observation contract

### 2.1 Synthetic fixture requirements

The Builder/Test lane must use isolated non-production fixtures and deterministic
clock, response-order, routing, signer-registry, relay, and membership controls. No
production receipt, actor, member, message body, credential, or secret may enter a
fixture, log, screenshot, telemetry payload, or review packet. The harness must be
able to expose authoritative server state, the initiating drawer, activity state,
keyboard focus, accessible announcements, and the append-only dispatch ledger in one
observation.

Each fixture names the Work Management revision, routing-configuration version, relay
binding, workspace/POD binding, enrolled-agent membership, signer-registry version,
and the exact authorization/evidence revision. Fixtures use the approved Brief's
schemas and event authority; they may not replace signed receipts or ledger events
with client-only markers.

### 2.2 Required case ledger

Every one of the 20 cases records these fields before it is marked pass or fail:

| Field | Requirement |
|---|---|
| `case_id` | One of the exact 20 IDs in §3; no aliases or new denominator IDs. |
| `seed_revision` / `seed_config` | The named seed, authorization revision, route/config version, and isolated-substep variant when applicable. |
| `action_identity` | The deterministic mutation or `dispatch_intent_id` under test; no timestamp-only dedupe. |
| `expected_authority` | Expected server state, lifecycle/diagnostic events, receipt/outbox/claim/run count, and forbidden side effects. |
| `expected_ui` | Drawer state, activity reconciliation, inline status/error, focus target, and announcement. |
| `actual_evidence` | Receipt, outbox, event, attempt, claim, run, external-event, and error identifiers where applicable; IDs only, never identity-linked display data. |
| `transport_result` | HTTP/status and typed error or diagnostic code, including conflict/transport outcome. |
| `telemetry` | Required bounded outcome and reconciliation signals, with no PII or high-cardinality labels. |
| `result` | `pass` only when every required oracle passes; `fail` for any missing, stale, unclassifiable, or contradictory observation. |

An isolated substep ledger carries `parent_case_id` and the frozen substep ID (for
example `F03-A` or `R04-F`). It is measurement detail, not a new case. The R04
substeps may produce six telemetry observations under `REC-04`, but the denominator
remains 20 and the parent case receives one pass/fail result only after all six
substeps pass.

### 2.3 Universal event and evidence oracles

Unless a test below explicitly permits a diagnostic-only record, pass requires:

1. authoritative server state, the drawer, and activity state agree after the result;
2. an older response, stale projection, retry, or reload cannot regress a confirmed
   result or create a second durable action;
3. the append-only event sequence uses CAS, consecutive versions, exact predecessor
   hashes, authorized signers, and the frozen lifecycle/authority matrix;
4. no state, gate, phase, assignee, decision, downstream authorization, claim, run,
   receipt, outbox identity, or external send occurs when the case forbids it; and
5. the case emits one terminal UI feedback observation and the expected bounded
   telemetry, or it fails as missing/unclassifiable.

## 3. Frozen 20-case manifest

This is a verbatim semantic mapping of the Brief's authoritative manifest. The list is
closed at 20 IDs and must be pre-enrolled before execution:

| ID | Frozen seed / mutation |
|---|---|
| `SAVE-01` | Revision r1, empty optional economics fields → valid populated Work Economics save. |
| `SAVE-02` | Revision r1, existing economics values → valid replacement save. |
| `SAVE-03` | Revision r1, valid lower-bound numeric values → save. |
| `SAVE-04` | Revision r1, valid upper-bound/long permitted values at narrow viewport → save. |
| `DISP-01` | Authorized r1, matching route v1, no prior receipt → deliver + valid acknowledgement. |
| `DISP-02` | Authorized r1, matching route v1, receipt visible after reload → no duplicate dispatch. |
| `DISP-03` | Authorized r1, matching route v1, agent service reads without human UI → deliver + valid acknowledgement. |
| `DISP-04` | Authorized r1, matching route v1, assistive-tech/narrow UI → exactly one dispatch and local status. |
| `FAIL-01` | Stale mutation revision r0 against server r1 → HTTP 409. |
| `FAIL-02` | Invalid Work Economics field set at r1 → validation failure. |
| `FAIL-03` | Pre-receipt authorized r1 with every `F03-A..F03-F` route-binding conflict → typed diagnostic only. |
| `FAIL-04` | Post-receipt/pre-send authorized r1 with one reservation fence and every `F04-A..F04-E` binding mismatch → terminalize/fence/diagnostic only. |
| `ORDER-01` | Old bootstrap response arrives after successful save response. |
| `ORDER-02` | Two explicit saves; older response arrives after newer confirmed response. |
| `ORDER-03` | Stale activity/receipt projection arrives after newer lifecycle event. |
| `ORDER-04` | Delayed old failure arrives after later authoritative success. |
| `REC-01` | Exact authorization replay after receipt creation. |
| `REC-02` | Two concurrent dispatch submissions with the same authorization/expected version. |
| `REC-03` | External send may have succeeded but response is lost; reconciliation finds existing delivery/acknowledgement. |
| `REC-04` | Same post-receipt/pre-send seed as `FAIL-04`, no durable delivery and absent reconciliation, then every `R04-A..R04-F` stale/mismatched binding. |

## 4. Acceptance tests

Each test is a release-blocking oracle. The Test lane must attach the case ledger and
the exact evidence required by the test; a prose assertion without the named evidence
does not pass.

### Authoritative drawer feedback and ordering

**AT-01 — Successful mutation is authoritative and visible.**

Given each `SAVE-01..SAVE-04` seed, when the operator submits the Work Economics
mutation, then the authoritative response is rendered in the initiating drawer and
the reconciled activity state, the drawer remains correct after reopen and reload,
the success status is announced immediately, and focus remains on or returns to the
initiating control. All four cases must pass; optimistic text alone is not evidence.

**AT-02 — Conflict and validation failures are local and recoverable.**

Given `FAIL-01` or `FAIL-02`, when the stale revision or invalid field set is submitted,
then the initiating control shows an actionable inline error with the typed HTTP/error
result, the user's input is preserved, the server's prior state is not overwritten,
focus is placed on the initiating control or perceivable inline error, failure is
announced, and retry is explicit rather than automatic. A page-level banner may
supplement this result but cannot be its only surface.

**AT-03 — Older responses cannot overwrite newer authority.**

Given each `ORDER-01..ORDER-04` seed, when the named delayed bootstrap, older save,
stale projection, or old failure arrives after a newer authoritative result, then the
newer saved state remains visible in the drawer and activity surface, the stale result
is suppressed or reconciled as a typed no-op, no duplicate activity event is written,
and one terminal UI feedback observation is recorded. A delayed response must not
revert the result or present a false failure.

**AT-04 — Pending, unavailable, and narrow-drawer states are explicit.**

Given an action in flight, an unavailable authoritative item, a failed page-level
reload, and the existing narrow drawer viewport, when the operator observes the action
surface, then pending, empty/unavailable, and error states are explicit; no fabricated
durable value is shown; the action-local error remains visible when a page-level load
also fails; the drawer remains usable at narrow width; and the named status/error
regions have accessible names and live announcements.

### Dispatch identity, receipt, ledger, and recovery

**AT-05 — Authorized dispatch has one complete receipt-to-acknowledgement sequence.**

Given `DISP-01` with authorized r1, matching route v1, and no prior receipt, when the
dispatch is submitted, then one transaction commits the immutable versioned receipt,
exactly one outbox identity, and signed `v0:QUEUED`; one leased
`SEND_ATTEMPT_RESERVED` commits with unique intent/attempt and reservation fence;
serialized `SEND_ATTEMPT_STARTED` commits only after revalidation; exactly one relay
send occurs; the NIP-01 publisher event is verified against channel, publisher,
intent, attempt, payload digest, and signer registry; then signed `DELIVERED` and one
valid assigned-agent `ACKNOWLEDGED` follow in order. The receipt contains the complete
Brief-required authorization snapshot, including work-item/workflow/state, role and
enrolled-key references, structured allowed/prohibited scope, evidence revision/digest,
forecast and human-authorization audit references, canonical channel/config version,
authorized action hash, and acknowledgement policy. The mutable acknowledgement
truth is the ordered ledger plus rebuildable projection, not a receipt mutation.

**AT-06 — Reload and exact acknowledgement replay are idempotent.**

Given `DISP-02`, when the same receipt is re-read after reload and the exact accepted
acknowledgement is replayed, then the original receipt and acknowledgement event are
returned, no new receipt/outbox/event/claim/run/send is created, and the drawer/activity
state remains authoritative. A changed field, stale revision, wrong run, wrong channel,
or different signed binding is rejected before side effect.

**AT-07 — Non-interactive agent read and acknowledgement are sufficient.**

Given `DISP-03`, when the enrolled agent service reads the receipt without a signed-in
human UI session, then it can resolve the immutable receipt and ordered status envelope
through the durable agent-readable API; only the exact enrolled assigned-agent pubkey
can produce the valid acknowledgement binding intent, authorization revision/evidence
digest, canonical channel, delivered event ID, claim/run ID, and timestamp. A missing,
stale, forged, wrong-key, wrong-channel, or wrong-run acknowledgement is rejected
with a typed no-PII diagnostic and cannot start downstream work.

**AT-08 — Assistive-tech dispatch remains one dispatch with local feedback.**

Given `DISP-04`, when the operator uses keyboard and assistive technology at the
narrow viewport, then the dispatch control has an accessible name, exposes pending
and final status through a named live region, preserves focus, and produces exactly
one receipt/outbox/claim/run. After one valid acknowledgement, a different second
acknowledgement is rejected and the lineage remains terminal with one accepted run.

**AT-09 — Exact authorization replay does not reopen work.**

Given `REC-01`, when the exact authorization and exact signed acknowledgement are
submitted again, then both resolve idempotently to their original receipt/event IDs;
there is no second append, outbox identity, claim, run, send, or state/gate mutation.
The replay key is the exact JCS-SHA-256 idempotency binding, not a timestamp or UI
request ID.

**AT-10 — CAS and reservation fencing win concurrent races safely.**

Given `REC-02`, when two dispatch submissions and two valid acknowledgement submissions
race with the same expected version, then CAS accepts one transition/event and one run;
unique intent/attempt and one active lease prevent duplicate reservation or send;
event versions are consecutive; and a race with cancellation, supersession, or config
invalidation yields one serialized reservation-fence order. If
`TERMINALIZATION_REQUESTED` wins before `SEND_ATTEMPT_STARTED`, the fence is invalidated
and no send occurs; if the start wins first, terminalization waits for resolution. No
failure or requeue is appended while a lease or unresolved reconciliation is active.

**AT-11 — Uncertain delivery reconciles before retry.**

Given `REC-03`, when the external send may have succeeded but its response is lost,
then `RECONCILIATION_REQUIRED` is recorded only from a non-`DELIVERED` state; the
canonical relay is queried for the same intent and attempt; discovered event IDs,
hashes, signatures, channel, publisher, and payload bindings are verified against the
Tech-owned signer registry; a discovered delivery/ack is backfilled without a resend;
a stale reconciliation after `DELIVERED` is an idempotent no-op; and an absent result
can become `FAILED_RETRYABLE` only after lease release and resolved reconciliation,
then signed `REQUEUED` and a new unique reservation. No retry creates a second receipt,
outbox identity, claim, or run.

### Default-closed routing and security cases

**AT-12 — FAIL-03 rejects every pre-receipt route conflict without side effects.**

Given an isolated authorized-r1 seed with no receipt, outbox row, reservation, attempt,
or delivery, run each of the six mandatory substeps exactly once:

| Substep | Conflict |
|---|---|
| `F03-A` | `workspace.routing.steer_agent_handoff.channel_id` is missing. |
| `F03-B` | Configured canonical channel ID is unknown or deleted. |
| `F03-C` | Configured channel ID and resolved channel identity disagree. |
| `F03-D` | Relay URL and workspace/POD binding disagree. |
| `F03-E` | Assigned agent is not a member of the canonical channel. |
| `F03-F` | A competing routing source exists beside the active audited configuration. |

For each substep, reject before append or side effect, emit exactly one typed no-PII
diagnostic naming the mismatch and active config version, and emit no receipt, outbox,
reservation, attempt, delivery, lifecycle/state event, terminalization request, fence
invalidation, state/current-projection change, claim, or run. The absence of a fence is
observable; no post-receipt terminalization behavior may be substituted.

**AT-13 — FAIL-04 terminalizes an existing reservation, not a pre-receipt failure.**

Given an isolated authorized-r1 seed under canonical route/config v1 with a committed
receipt, one outbox row, and exactly one `SEND_ATTEMPT_RESERVED` fence before
`SEND_ATTEMPT_STARTED`, run each substep exactly once:

| Substep | Binding invalidation |
|---|---|
| `F04-A` | Canonical channel ID is replaced by a noncanonical or mismatched channel. |
| `F04-B` | Relay URL binding changes or disagrees with the receipt. |
| `F04-C` | Workspace/POD binding changes or disagrees with the receipt. |
| `F04-D` | Assigned-agent channel membership becomes absent or unauthorized. |
| `F04-E` | Publisher key is unknown, retired, revoked, or mismatched to the signer registry. |

Before `SEND_ATTEMPT_STARTED`, append signed non-state
`TERMINALIZATION_REQUESTED`, invalidate the existing reservation fence, and append
the typed `DELIVERY_BLOCKED_CONFIG_STALE` or equivalent diagnostic. Do not start, send,
advance lifecycle/current projection, create a claim/run, append failure, or requeue.
The signed control records are allowed; “no lifecycle event” means no state-transition
event or current-state projection change. Untrusted, retired, or revoked publisher
proof is rejected before `DELIVERED`.

**AT-14 — REC-04 freezes stale recovery and successor lineage.**

Given the same post-receipt/pre-send seed as `AT-13`, with no durable Buzz delivery and
reconciliation proving absence, run each mandatory substep exactly once:

| Substep | Stale or mismatched binding |
|---|---|
| `R04-A` | Audited routing configuration advances from v1 to v2. |
| `R04-B` | Canonical channel ID becomes noncanonical or mismatched. |
| `R04-C` | Relay URL binding becomes stale or mismatched. |
| `R04-D` | Workspace/POD binding becomes stale or mismatched. |
| `R04-E` | Assigned-agent membership becomes absent or unauthorized. |
| `R04-F` | Publisher key becomes unknown, retired, revoked, or mismatched to the signer registry. |

Before `SEND_ATTEMPT_STARTED`, append signed non-state
`TERMINALIZATION_REQUESTED`, invalidate the existing fence, and append
`DELIVERY_BLOCKED_CONFIG_STALE`. Send nothing; do not change state/current projection,
create a claim/run, append failure, or requeue. The observation boundary is the
blocked branch after the diagnostic: the original intent is terminalized as the old
pre-send intent, with an explicit old-intent → successor ledger relation recorded only
when a human explicitly reauthorizes. Without that reauthorization, retry is rejected.
With it, exactly one same-lineage successor is permitted only when workspace/POD,
work-item, workflow, root authorization objective, assigned role, and enrolled
agent/member remain unchanged; changed role, assignee, workspace, work item, workflow,
or root objective requires a new lineage and new human authorization. The old intent
and successor never create two runs. All six substeps must pass as one `REC-04` case.

### Cryptographic, authorization, privacy, and governance controls

**AT-15 — Signed event and authority matrix is enforced.**

Given valid and adversarial event envelopes, when the system appends or verifies a
receipt, lifecycle event, acknowledgement, or relay delivery, then it enforces all of
the following:

- RFC 8785 JCS, UTF-8 without BOM, exact SHA-256 digest, BIP-340 Schnorr over
  secp256k1, 32-byte x-only lowercase-hex public keys, and 64-byte lowercase-hex
  signatures for service events and the versioned acknowledgement binding;
- exact `steer-dispatch-event/v1` fields, consecutive `event_version`/
  `expected_event_version`, predecessor hash, typed payload digest, receipt/routing/
  evidence bindings, and unique `(dispatch_intent_id,event_version)`;
- the Tech-owned, versioned `dispatch_event_signers` and `relay_event_signers`
  registries, validity intervals, and `ACTIVE|RETIRED|REVOKED` rules; retired/revoked
  keys cannot sign new events, and registry mismatch or invalid signatures fail closed;
- the sole append authorities from the Brief: Work Management for `QUEUED`, valid
  `ACKNOWLEDGED`, human-authorized `SUPERSEDED`/`CANCELLED`; outbox delivery for
  reservation/start/`DELIVERED`; reconciliation for retry/final failure/requeue;
  terminalization coordinator for `TERMINALIZATION_REQUESTED`; and diagnostic-only
  `ACK_REJECTED`/`DELIVERY_BLOCKED_CONFIG_STALE` authorities; and
- unknown schema/algorithm/key, forged or wrong-key acknowledgement, stale expected
  version, illegal transition, reused attempt, wrong publisher, bad predecessor hash,
  or unauthorized actor is rejected before append, projection, claim/run, or external
  side effect with only the typed no-PII diagnostic. Agents cannot mutate gate or human
  authorization state.

**AT-16 — Privacy inventory, retention, deletion, and logging are default-closed.**

Given every identity-linked receipt, outbox, acknowledgement, ledger, review-assignment,
review-result, key-reference, index, and replica path, when the implementation is
examined and its deletion/hold behavior is exercised with synthetic pseudonymous data,
then the inventory records each field's purpose, source, controller/workspace, owner,
90-day terminal retention, deletion path, and explicit scoped time-bounded hold; logs,
telemetry, and error reports contain no actor/member IDs, key material, authorization
text, scope text, display names, email, message bodies, secrets, or unrelated PII; and
eligible deletion cascades through receipts, outbox, acknowledgements, review
assignments/acknowledgements/results, identity mappings, indexes, replicas, and
backups, retaining only non-identifying aggregates. Missing inventory, retention,
deletion, or no-PII enforcement blocks record/review creation and dispatch while
preserving the existing claim identity. A privacy control that is merely documented
but not observable does not pass.

### Accessibility, reliability, observability, and rollback

**AT-17 — Keyboard, screen-reader, focus, and visual accessibility pass.**

Given the changed drawer action surface at desktop and narrow viewport, when a keyboard
and screen-reader user completes success, validation failure, conflict, transport
failure, blocked authorization, pending, empty, and reload states, then every control
has an accessible name, all actions are keyboard-operable, focus remains on or returns
to the initiating control (or moves to the perceivable inline error when needed),
success/error regions have useful names and live announcements, no critical result is
only a page-level banner, contrast meets WCAG 2.2 AA, and the changed pages pass axe-core.

**AT-18 — Reliability budgets and bounded telemetry are measured, not asserted.**

Given the fixed 20-case non-production matrix, when every case is executed, then every
case emits its expected outcome and exactly one terminal UI feedback observation; the
histograms `steer_work_item_save_feedback_latency_ms` and
`steer_agent_handoff_feedback_latency_ms` measure from authoritative response receipt
to visible local result and each has p95 <=250 ms over the matrix; and the following
signals are present with bounded typed labels only:

- `steer_work_item_save_outcome_total{outcome=success|validation|conflict|transport}`;
- `steer_post_write_reconciliation_total{result=fresh|stale_suppressed|authoritative_reload|error}`;
- `steer_agent_handoff_outcome_total{outcome=queued|delivered|blocked|duplicate_suppressed|error}`;
- `steer_stale_ui_recurrence_total{severity=critical|noncritical}`; and
- `steer_duplicate_dispatch_total`.

The case IDs and bounded substep labels may identify the fixed matrix; work-item,
actor/member, message, or other high-cardinality/PII labels may not. The acceptance
oracle is zero hidden validation/conflict errors, stale-response overwrites, duplicate
dispatches, and unresolved critical recurrences. Pre-release observation is the fixed
matrix; any later release observation is the first 100 eligible operations or 30 days,
whichever is later, with immediate alerts on critical stale-view recurrence or
duplicate dispatch and on a 15-minute p95 breach with at least 20 eligible samples.

**AT-19 — Rollback is reversible and preserves evidence.**

Before implementation begins, the Builder must name the reversible release/configuration
mechanism and its operator-visible rollback command or procedure. In a non-production
rollback rehearsal, when the new feedback/dispatch behavior is disabled or reverted,
then prior authoritative server state remains intact; receipt/event/outbox history is
not rewritten or deleted; any in-flight ambiguous operation fails closed rather than
sending or mutating state; the rollback does not create a duplicate receipt, outbox
identity, claim, run, or audit event; and the post-rollback smoke flow proves the
initiating drawer still exposes an honest pending/success/failure result. If the
implementation touches data or infrastructure, the rehearsal must also show a backed-up,
reversible path with documented recovery point and recovery time targets. A rollback
that hides evidence, guesses a route, or re-enables optimistic success fails.

## 5. Edge cases and adversarial attacks

The following attacks are covered by the acceptance tests above and must be explicitly
included in the Test/Critic packet: forged or replayed receipt; wrong authorization or
evidence revision; wrong channel, relay, workspace/POD, membership, publisher, or
signer-registry binding; historical project-channel event presented as authority;
wrong-key, stale, second, concurrent, and delayed acknowledgement; duplicate request
with a new timestamp key; active-lease cancellation; terminalization/start race;
unknown-send reconciliation; stale projection after `DELIVERED`; retry during active
lease; skipped/reused event version; invalid predecessor hash; revoked signer;
unavailable audit-reference resolution; missing privacy inventory; deletion during a
hold; keyboard-only operation; narrow viewport; and page-level reload failure while
the drawer-local result is visible.

## 6. Non-functional checks and evidence packet

The exact Gate-2 implementation handoff must include:

1. the immutable human-approved Brief revision and this exact Exam revision;
2. the pre-enrolled 20-case ledger, including all mandatory F03/F04/R04 substeps and
   the explicit `REC-04` observation boundary/count/linkage;
3. signed receipt/event examples using synthetic data, append-authority and signer-
   registry verification, and negative proof that forbidden side effects did not occur;
4. accessibility results including keyboard/screen-reader notes, axe-core output,
   focus assertions, status/error announcements, and narrow-viewport evidence;
5. telemetry definitions and measured p95 values for both latency histograms, with
   bounded-label inspection and missingness/denominator accounting;
6. privacy inventory, retention/hold/deletion rehearsal, and no-PII log/telemetry
   inspection; and
7. rollback rehearsal output, recovery targets when applicable, and the exact commit,
   branch, and artifact URLs. No claim may be made for a live production or release
   observation that was not actually executed.

The fresh `GATE_2_EXAM` Critic must receive the exact approved Brief, this exact Exam,
applicable guardrails, and assigned Exam/Test evidence through the canonical Work
Management two-phase review handoff. Its output is severity-sorted, capped at three
blocker/should-fix findings, and is advisory evidence only. A request before exact
assignment persistence and reload verification is invalid.

## 7. Human judgment checklist (Evaluate)

- [ ] Do these tests express the authoritative saved-state outcome for the named operator rather than optimistic client success?
- [ ] Are the 20 case IDs, frozen seeds, substep resets, REC-04 observation boundary, and one-run/one-lineage rules complete and falsifiable?
- [ ] Are default-closed authorization, cryptographic, routing, privacy, deletion, and no-PII controls executable rather than descriptive?
- [ ] Are accessibility, telemetry/reliability budgets, missingness, and rollback evidence sufficient for a safe implementation decision?
- [ ] Does this Exam preserve the Brief's incident-only evidence boundary and leave all Gate 2/Gate 3 authority with the named human approvers?

GATE 2: PENDING — human Tech Lead approval must bind this exact Exam revision after a fresh independent Critic review.
GATE 2 EVIDENCE: PENDING — no approval is recorded in this file.

GATE 3: PENDING — requires the frozen Exam, implementation evidence, required checks, tagged-domain evidence, and human approval after cooling-off.
GATE 3 EVIDENCE: PENDING
