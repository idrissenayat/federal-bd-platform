# Exam — 0007 Completed-work visibility

**Work item:** STR-029 / GitHub issue #59  
**Approved Brief:** `steer/briefs/0007-completed-work-visibility.md` at
`43409c2c4d4f0a334da89e0bc9ee6327a6d9d30e`  
**Guardrails in force:** CORE-01..11 + A11Y-01..03 + REL-01..04 + DES-01..02

## Scope ruling carried from Gate 1

The Product Lead ruled the Critic's security signal outside the actual change scope:
this work introduces no authentication, credential, authorization-policy, endpoint, or
security-policy change. The existing complete-state dispatch barrier remains in scope as
a regression invariant because presenting completed cards must never make them eligible
for agent work. This invariant does not expand the approved Brief into security work.

## Acceptance tests

### Visibility, filtering, and counts

1. Given an item whose authoritative completion time is within the previous seven
   calendar days, when the board loads with **Show completed** off, then the item appears
   in its final recorded lane with an explicit Completed label.
2. Given an item completed more than seven calendar days ago, when the board loads with
   **Show completed** off, then the item is hidden; when the control is turned on, it
   appears; when the control is turned off again, it is hidden.
3. Given completion times immediately before, exactly at, and immediately after the
   seven-day cutoff, when visibility is derived from a frozen `now`, then the exact-cutoff
   and newer items are recent and the older item is not. Invalid, missing, or future
   completion times are not presented as recently completed; they may appear only in the
   explicit completed-history view and must not display a fabricated time.
4. Given a search query, when active work and visible completed history are filtered,
   then the same case-insensitive title/identifier matching rules apply to both sets and
   no nonmatching completed card leaks into the result.
5. Given a lane with active and completed items, when counts render, then the primary WIP
   count equals active items only and a separately labelled history count equals the
   completed cards currently visible in that lane.
6. Given no active work in a lane, when zero or more recent completed cards are visible,
   then the lane distinguishes clear active airspace from completed history instead of
   implying that the completed cards are active.

### Completed-card behavior

7. Given a completed card, when it renders in any visual mode, then visible text conveys
   Completed status without relying on color alone and the card remains keyboard
   reachable and openable.
8. Given a completed card, when a user opens or focuses it, then no phase-move control is
   available and no board interaction can invoke the move handler for that item.
9. Given a completed card, when it is opened, then its drawer, evidence links, decision
   history, and preserved activity remain reviewable.
10. Given a completed item that otherwise has an assignee, approved gates, and a valid
    next action, when dispatch authorization is evaluated, then authorization remains
    false with the complete-state reason. Existing active-item authorization behavior
    remains unchanged.

### Evidence-based phase timeline

11. Given creation, activity details of the form `phase → <Phase>`, and completion
    records, when the timeline is derived, then it presents observed phase entries in
    timestamp order and identifies the completion time from authoritative evidence.
12. Given duplicate or out-of-order activity rows, when the timeline is derived, then
    equivalent phase entries are collapsed deterministically, ordering follows parsed
    timestamps, and no additional phase is inferred.
13. Given a legacy item with missing phase-transition activity, when the timeline
    renders, then affected phases say **Not recorded**; the current/final phase may be
    identified as current evidence but is not assigned an invented entry time.
14. Given a keyboard or assistive-technology user, when the drawer opens, then the
    timeline is exposed as a labelled ordered/list structure with readable phase names,
    statuses, and available timestamps.

### Operational final lanes

15. Given the Release lane or an item in Release, when its phase guidance is read, then
    it names human Gate 3 approval, protected delivery, required checks, smoke
    verification, and rollback readiness as the exit criteria.
16. Given the Observe lane or an item in Observe, when its phase guidance is read, then
    it names the declared observation window and inspection of actual behavior/evidence
    as the exit criteria.
17. Given the Learn lane or an item in Learn, when its phase guidance is read, then it
    names a Learning Review, follow-up ownership, and a completion decision as the exit
    criteria. Existing guidance for Sense through Evaluate remains present.

## Edge cases and attacks

- UTC timestamps crossing a local calendar-day or daylight-saving boundary.
- An exact seven-day cutoff, invalid date, missing completion time, or future timestamp.
- A completed item whose recorded final phase is not Learn.
- A legacy completed item with no activity or only a creation record.
- Duplicate, malformed, unknown, and out-of-order phase-transition details.
- Search with no matches, whitespace-only search, and mixed-case identifiers.
- A lane containing active work and both recent and older completed history.
- Repeated keyboard activation of a completed card or its evidence links.
- A client-crafted attempt to dispatch a completed item despite its visible history.

## Non-functional checks

- Visibility, count, and timeline rules are implemented as deterministic pure helpers
  with boundary-focused automated tests using a frozen clock.
- The view toggle performs no D1 write, schema migration, audit rewrite, or browser
  storage write as authoritative state.
- The board uses the collection already returned by bootstrap and adds no per-card
  network request.
- Existing protected write behavior and active-card movement continue to pass their
  regression tests.
- Build, lint, type checks, repository tests, gauntlet, gitleaks, OSV-Scanner, and Semgrep
  pass at the shipped revision, or any environment-level exception is explicitly
  evidenced for Gate 3.
- Manual responsive checks cover a narrow mobile viewport and the existing desktop
  layout. Keyboard checks cover the Show completed control, completed cards, drawer
  close action, timeline, and evidence links.
- Automated accessibility inspection is run when available; regardless, there is no
  color-only status, missing control label, or focus regression.
- Filtering and timeline derivation remain local and linear over the existing small
  bootstrap collection; no obvious interaction delay is introduced.
- Rollback is verified as a UI/helper revert plus redeployment of the prior site version;
  D1 records and audit history require no rollback or repair.

## Outcome instrumentation and observation

- During the first seven calendar days after deployment, inspect every completed item
  shown by the board. If fewer than three exist, continue until three items or 30 days,
  whichever occurs first.
- Run a moderated findability check: a teammate must locate a recently completed item,
  identify its final phase and completion state, and open its evidence in under 15
  seconds without including it in active WIP.
- Record active WIP counts before and after rollout for the exercised lanes; they must
  remain unchanged solely because completed history became visible.
- Review dispatch decisions during the window; the required result is zero completed
  items authorized or dispatched.
- The Learning Review records observed items, findability time, count correctness,
  accessibility defects, dispatch regressions, follow-up owner, and the decision to
  keep, adjust, or revert the presentation.

## Human judgment checklist (Evaluate)

- [ ] Does completed history make movement understandable without dominating active work?
- [ ] Can a teammate distinguish active WIP from completed history at a glance?
- [ ] Does the timeline remain honest where old transition evidence is incomplete?
- [ ] Are Release, Observe, and Learn exit criteria specific enough to guide action?
- [ ] Can every completed card still be audited without exposing a move or dispatch path?
- [ ] Is the seven-day default useful at the actual volume on the board?

---

GATE 2: APPROVED — 2026-08-17T16:29-04:00 by authenticated Interim Tech Lead
GATE 2 EVIDENCE: GitHub issue #59 approval and Flight Board Critic review #49 bound to
Exam revision `b6b6bc6af8a96b12258e4b10579a10774b0f2ffa`:
https://github.com/idrissenayat/federal-bd-platform/issues/59#issuecomment-5319868989

GATE 3: PENDING  
GATE 3 EVIDENCE: PENDING — authenticated release approval plus required checks tied to
the shipped commit
