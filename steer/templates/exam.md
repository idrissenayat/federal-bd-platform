# Exam — [ID] [Title]

<!-- Copy to exams/NNNN-slug.md. Must be committed BEFORE the first build branch opens.
     Every "done and correct" line in the brief maps to at least one item here. -->

**Brief:** briefs/NNNN-slug.md
**Guardrails in force:** CORE-01..06 + <!-- add tagged-domain IDs, e.g. SEC-01..04, A11Y-01..03 -->

## Acceptance tests

<!-- Given/When/Then, one per behavior. These become automated tests (CORE-01).
     Number them so builds and reviews can reference them. -->

1. Given … when … then …
2.
3.

## Edge cases and attacks

<!-- Produced by pointing the Critic at the brief BEFORE building ("what's ambiguous,
     what breaks, what would a hostile user do?"). Each item is either covered by a
     test above, ruled out in DECISION-LOG.md, or added as a test here. -->

-
-

## Non-functional checks

<!-- Only what applies. Perf target (REL-01)? Telemetry events (REL-02)? Rollback path (REL-03)?
     Data retention (PRIV-02)? Write the concrete number/name, not "should be fast." -->

-

## Outcome instrumentation

<!-- Verify the primary outcome, exposure/denominator, and guardrail events named in the
     brief. State where the observation will be read and when. -->

-

## Human judgment checklist (Evaluate)

<!-- The things only a human can verify. Keep short — 3 to 5 items. -->

- [ ] Does this actually solve the brief's problem, as the named user?
- [ ] Would I ship this under my own name?
- [ ] Design intent honored — states, tone, system components?
- [ ]

---

GATE 2: <!-- APPROVED — ISO timestamp — initials/account. Different session than Gate 1. -->
GATE 2 EVIDENCE: <!-- PR/review URL or immutable approval/check ID tied to this exam revision. -->

GATE 3: <!-- APPROVED — ISO timestamp — initials/account. After cooling-off. List tagged-domain
             co-signs here when the team exists. -->
GATE 3 EVIDENCE: <!-- release/PR approval plus required-check IDs tied to the shipped commit. -->
