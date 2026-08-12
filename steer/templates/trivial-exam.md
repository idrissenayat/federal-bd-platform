# Standing Exam — the Trivial Class

<!-- Copy once to exams/trivial.md and sign. This is the ONLY standing exam:
     it defines a CLASS of changes exempt from per-item exams (SOLO-MODE rule 2).
     Membership in the class is the entire question — when in doubt, it's not trivial. -->

## The class

A change qualifies as trivial if ALL of the following hold:

- Copy, comments, or documentation only — no behavior change of any kind
- No new dependencies, no config changes, no data touched
- Not on any surface tagged default-closed
- The whole diff is readable in under two minutes

Typo fixes, docs corrections, and copy tweaks qualify. A "tiny" logic change never does.

## Checks for every trivial change

1. Full gauntlet green (all AUTO guardrails run regardless).
2. Critic pass on the diff confirming class membership — a trivial-classed diff that
   changes behavior is a blocker finding, not a note.
3. Rendered/displayed output eyeballed where copy changed (no broken layout, no
   truncation).

## Gates

Trivial-classed changes ship under ◆3 alone, same-day, no cooling-off.
The Critic's class-membership check (item 2) is the gate's integrity — if it
flags, the change exits the class and takes the normal loop.

---

GATE 2 (for the class, signed once): <!-- APPROVED — timestamp — initials/account -->
GATE 2 EVIDENCE: <!-- immutable approval/check ID tied to this standing exam revision -->
