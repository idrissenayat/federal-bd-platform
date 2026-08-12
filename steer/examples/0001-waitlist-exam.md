# Exam — 0001 Early-access waitlist

**Brief:** briefs/0001-waitlist-brief.md
**Guardrails in force:** CORE-01..06, PRIV-01..03, A11Y-01..03, DES-01..02, SEC-01, SEC-04

## Acceptance tests

1. Given the landing page, when a visitor submits a valid email, then a row (email,
   timestamp, state=unconfirmed) exists and a confirmation email is dispatched within 2 min.
2. Given an unconfirmed signup, when the confirm link is clicked, then state=confirmed
   and revisiting the link is idempotent.
3. Given an already-signed-up email, when it is submitted again, then no new row, no
   second email, and the UI shows the normal success state.
4. Given an invalid email ("a@b", "", "spaces in@it"), when submitted, then an inline
   error appears, focus moves to the input, and nothing is stored or sent.
5. Given an unconfirmed row older than 7 days, when the cleanup job runs, then the row is deleted.
6. Given the export command, when run, then a CSV of confirmed emails+dates is produced and nothing else.

## Edge cases and attacks (Critic findings)

- Email with plus-addressing and unicode domains → covered by test 1 fixtures.
- Rapid resubmission (double-click) → covered by test 3 (idempotency).
- Script tag in the email field → SEC-04; covered by test 4 fixture `<script>@x.com`.
- Confirm-link guessing → token must be unguessable (128-bit random); added to test 2.
- Cleanup job failing silently → REL-02: job emits success/failure telemetry (non-functional below).

## Non-functional checks

- PRIV-01: signup event in analytics carries a count only, never the address.
- PRIV-03: deletion path = cleanup job (unconfirmed) + export-and-delete command (confirmed).
- REL-02: telemetry events `waitlist.signup`, `waitlist.confirm`, `waitlist.cleanup.{ok,fail}`.
- REL-03: rollback = flag off; table is additive, no migration to reverse.
- A11Y-01..03: axe clean; form fully keyboard-operable; error announced via aria-live.

## Outcome instrumentation

- Record eligible unique landing-page visitors, waitlist submissions, confirmations, and deletions.
- Compute confirmed signups per 100 visitors without storing email in analytics (PRIV-01).
- Observe at day 14; monitor complaint/spam rate and deletion-job failures as guardrails.

## Human judgment checklist (Evaluate)

- [x] Copy tone matches design intent (quiet confidence, no hype).
- [x] The success state would make *me* trust this company with my email.
- [x] Only design-system components used (DES-01); all four states present (DES-02).
- [x] Would I ship this under my own name?

---

GATE 2: APPROVED — 2026-08-14T19:05-04:00 — IE (brief was signed in the morning)
GATE 2 EVIDENCE: example only — production use requires an authenticated PR approval/check ID

GATE 3: APPROVED — 2026-08-16T10:30-04:00 — IE (24h cooling-off: #privacy default-closed)
GATE 3 EVIDENCE: example only — production use requires release/PR approval and required-check IDs
