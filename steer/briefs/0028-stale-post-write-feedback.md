# Intent Brief — 0028 Stale post-write feedback and action visibility

**Status:** draft
**Tags:** #a11y #reliability #design-system
**Date opened:** 2026-08-16
**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Workflow:** STEER
**Assignment:** STEER Scout; problem and evidence preparation only

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
- Related [issue #57](https://github.com/idrissenayat/federal-bd-platform/issues/57)
  describes a claimed stale-action-feedback hotfix and validation, but it remains
  open and is treated as corroborating engineering context rather than a separate
  user signal.

These controls frame the repair candidate; they do not establish demand, recurrence,
implementation readiness, or any Gate 1/2/3 approval. A future Exam must convert the
bounded controls into executable acceptance tests after human Gate 1 review.
