# Intent Brief — 0007 Completed-work visibility

**Work item:** STR-029 / GitHub issue #59
**Status:** draft
**Workflow:** Setup / excluded
**Tags:** #a11y #design-system #reliability
**Date opened:** 2026-08-17

## Expected outcome and measurement

- Primary outcome: a teammate can see that a work item reached Release, Observe,
  Learn, and completion without mistaking completed history for active work in progress.
- Baseline: the Flight Board currently removes every `state=complete` item from all
  seven lanes. STR-002 therefore disappeared immediately after completion even though
  its release and learning evidence remained valid.
- Minimum meaningful signal: in a moderated check, a teammate can find a recently
  completed item, identify its final phase and completion state, and open its evidence
  in under 15 seconds without counting it as active WIP.
- Observation window: the first seven calendar days after deployment, covering every
  completed item shown by the board during that period. If fewer than three completed
  items exist, extend observation until three items or 30 days, whichever comes first.
- Guardrail measures: active lane counts remain unchanged by completed history; zero
  completed items become dispatchable; zero activity, gate, or evidence records are
  rewritten or deleted.

## Who this is for

Product and Technology leads, delivery contributors, and agents who need to understand
whether work is moving and whether an apparently missing card was released or lost.

## Problem and why now

The seven-phase model is visually credible only when movement remains inspectable.
Today every lane filters out completed items. A fast Release → Observe → Learn sequence
can happen correctly yet look like no movement occurred. This creates avoidable status
questions, encourages reopening completed work, and makes Release, Observe, and Learn
appear decorative rather than operational.

STR-002 exposed the defect directly: it completed the standard flow and disappeared
from the Flight Board as soon as its state became `complete`.

## What “done and correct” means

1. The board keeps all seven STEER lanes.
2. By default, each lane includes active work plus completed cards closed within the
   previous seven calendar days.
3. A clear **Show completed** control reveals older completed cards that match the
   current search; turning it off returns to the seven-day recent view.
4. Lane headers show active WIP as the primary count and completed history as a
   separately labelled secondary count. Completed cards never inflate WIP.
5. Completed cards have a distinct, accessible Completed treatment, cannot move between
   lanes, and cannot authorize or dispatch agent work. They remain openable for evidence
   and audit review.
6. The item drawer shows a compact phase timeline derived from existing activity,
   creation, and completion records. It distinguishes observed transitions from phases
   that have no preserved transition event; it never fabricates missing history.
7. Release, Observe, and Learn display explicit exit criteria:
   - **Release:** human Gate 3 ruling, protected delivery, required checks, smoke
     verification, and rollback readiness.
   - **Observe:** the declared observation window and actual behavior/evidence.
   - **Learn:** Learning Review, follow-up ownership, and completion decision.
8. Search, responsive behavior, keyboard operation, authenticated writes, and durable
   audit data continue to work.

## Design intent

Completed history should feel present but quiet. Active work remains visually dominant;
completed cards use lower emphasis, a check-mark state label, and no movement controls.
The default recent window gives a stable sense of delivery without turning the board
into an archive. The Show completed control is explicit, keyboard reachable, and reports
how many older records it reveals.

The phase timeline is evidence-oriented rather than celebratory: phase name, observed
entry time when available, final completion time, and a visible “not recorded” state for
missing historical transitions. Raw activity remains available below it.

Empty lanes distinguish “no active work” from “recently completed work.” Loading and
error behavior continue to use the board’s existing patterns.

## Chosen approach

- Keep authoritative state in D1; use existing `work_items` and `activity` records.
- Derive recent completion and phase-timeline presentation in application code.
- Use `closed_at` when available and fall back to the latest completion-state activity
  only when that timestamp is already part of the returned authoritative record.
- Add no destructive migration and no browser storage as a source of truth. The Show
  completed choice is a non-authoritative view preference and may remain in component
  state.
- Add pure helper functions for visibility, lane counts, and timeline derivation so the
  behavior is covered without brittle visual-only tests.

## Out of scope

- Changing the seven STEER phases or gate authority.
- Automatically advancing work or enforcing elapsed-time dwell periods.
- Reconstructing historical transitions that were never recorded.
- Changing WIP limits, priority, workflow treatment, or Work Economics.
- Adding notifications, analytics vendors, a second archive database, or destructive
  cleanup of old records.
- Repairing unrelated Gate 3 transition behavior; that remains separately recorded in
  the STR-002 Learning Review.

## Risks and controls

- **Visual overload:** default to seven days, visually de-emphasize completed cards, and
  keep active counts primary.
- **False WIP:** compute active and completed counts separately and test the boundary.
- **False history:** render only preserved events and label missing transitions.
- **Accidental redispatch:** hide movement controls and keep server authorization’s
  existing `state !== complete` requirement covered by regression tests.
- **Accessibility regression:** use native labelled controls, visible focus, non-color
  Completed text, and keyboard-operable cards and filters.
- **Performance:** filter and derive the small board collection already returned by the
  existing API; add no per-card network call.

## Rollout and rollback

Release through the existing protected site workflow. Verify with at least one recent
completed item (STR-002), one older completed item, and one active item. Rollback is a
revert of the UI/helper commit and redeployment of the prior site version; D1 data and
audit history are unchanged, so rollback requires no data repair.

---

GATE 1: PENDING
GATE 1 EVIDENCE: PENDING — authenticated Product Lead approval tied to this revision
