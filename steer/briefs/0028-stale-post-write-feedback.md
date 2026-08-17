# Intent Brief — 0028 Stale post-write feedback and action visibility

**Status:** draft
**Tags:** #security #a11y #reliability #design-system
**Date opened:** 2026-08-16
**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Workflow:** STEER
**Assignment:** STEER Scout; complete Gate-1-ready Intent Brief preparation only

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
- **Observation window:** Proposed Gate-2 validation plus the first 20 representative
  non-production drawer mutations after implementation, including success, `409`,
  explicit retry, refresh, out-of-order response, dispatch, routing, keyboard, and
  screen-reader cases. Missing observations and exclusions remain visible.
- **Minimum meaningful signal:** 100% of accepted mutations expose the authoritative
  saved state before completion; 100% of failures expose an inline actionable result;
  zero stale responses overwrite a newer confirmed state; and zero duplicate durable
  claims, audit events, or outbox handoffs are created for one authorization revision.
  These are proposed acceptance thresholds for human Gate 1 review, not observed
  results.
- **Guardrail measure:** zero unauthorized routing or dispatch, zero human-gate
  transitions by an agent, zero lost user input after failure, zero duplicate activity
  records, no accessibility blocker, and no secret or new personal-data leakage.

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

## What "done and correct" means

- A successful mutation renders the authoritative server response in the initiating
  drawer and the reconciled activity state; reopening or reloading does not revert it.
- Every mutation is associated with an action/revision identity. A delayed or
  out-of-order response cannot overwrite a newer confirmed response, and an explicit
  retry cannot create a second durable mutation or handoff for the same identity.
- A `409`, validation error, transport failure, or blocked authorization is rendered
  beside the initiating control with an actionable explanation; the user's input is
  preserved and retry is explicit rather than automatic.
- Authorized dispatch emits one durable, agent-readable receipt bound to the work-item
  key, workflow/state, assigned role identity, allowed/prohibited scope, exact evidence
  revision, accepted forecast, human authorization identity/timestamp, canonical
  channel name and immutable channel ID, authorization revision, and idempotency key.
- A missing, stale, forged, replayed, or mismatched channel/authorization revision
  fails closed before dispatch or state change. A routing correction resumes the
  existing claim; it never creates a second run.
- The outbox exposes and reconciles `queued`, `delivered`, `acknowledged`, `failed`,
  and `retry` states with Buzz and GitHub evidence, including acknowledgement identity
  and durable receipt reference. Activity and audit history contain no duplicate event.
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
is also tagged for accessibility, reliability, and design-system review. The threat
model is: an attacker or faulty integration may forge or replay a receipt, route an
authorized handoff to the wrong channel, forge an acknowledgement, reuse a stale
authorization revision, create duplicate work across retries, or bypass a human gate.
The bounded response is to bind every receipt and outbox transition to the exact
work-item/role/authorization/evidence revision and immutable channel ID, resolve the
channel from authoritative configuration, fail closed on absence or mismatch, reject
replay and stale revisions, keep gate mutations human-only, and retain actor/time/audit
references. Verification failure must never degrade into a guessed route or optimistic
success. No secret or new personal-data field is introduced by this brief; any future
receipt retention or identity expansion requires its own recorded ruling.

## Chosen approach

At the Intent level, choose authoritative-response reconciliation plus action-local
status and focus, with configuration-backed routing and a durable receipt/outbox
contract. This accepts a visible pending or fail-closed result when authority is
unavailable in exchange for avoiding false success, duplicate work, and hidden errors.
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
| `#steer-team` canonical route and fail-closed mismatch policy | Source inspection (authenticated human decision) | [Comment #5310397551](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310397551) | Decision recorded; implementation absent |
| Gate-1-ready brief scope expansion | Source inspection (authenticated human decision) | [Comment #5310403354](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310403354) | Decision recorded; Gate 1 pending |
| Local replay, concurrency, outbox delivery, partial-dispatch recovery | Not run | This Scout handoff did not execute live repair or integration paths | No pass/fail claim |
| Local reproduction of stale `Next action`/hidden `409` | Not run | Production observations above; no local live run claimed | No pass/fail claim |
| Independent repeated-signal frequency | Not run | `steer/signals/README.md`; `steer/operating-system/METRICS.md` | Unmeasured |

GATE 1: PENDING — no authenticated human Gate 1 ruling
GATE 1 EVIDENCE: PENDING — present this exact revision and a fresh independent Critic review to the named human
