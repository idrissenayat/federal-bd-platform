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
- Related [issue #57](https://github.com/idrissenayat/federal-bd-platform/issues/57)
  describes a claimed stale-action-feedback hotfix and validation, but it remains
  open and is treated as corroborating engineering context rather than a separate
  user signal.
