# Intent Brief — 0001 Early-access waitlist

**Status:** shipped (example)
**Tags:** #privacy #design-system
**Date opened:** 2026-08-14

## Expected outcome and measurement

- **Primary outcome:** confirmed waitlist signups per 100 unique landing-page visitors.
- **Baseline / denominator:** 0 confirmed signups; denominator is unique eligible visitors.
- **Observation window:** first 14 days after 100% rollout.
- **Minimum meaningful signal:** at least 5 confirmed signups per 100 visitors.
- **Guardrail:** complaint/spam rate below 0.5%; zero addresses retained after the stated deletion event.

This is an observational pre-launch measure; it does not prove later product adoption.

## Who this is for

A visitor who has heard about the product, is curious enough to give us an email
address, but cannot use anything yet because the product isn't live.

## Problem and why now

We have no way to capture interest before launch, so every conversation, post, or
mention leaks attention we can't recover. A waitlist converts pre-launch attention
into a launch-day audience. Why now: anything we ship next is worth more with an
audience waiting. Evidence: n/a (pre-launch judgment call — noted, not fabricated).

## What "done and correct" means

- A visitor on the landing page can join the waitlist with a single email field in under 10 seconds.
- Every submitted address receives a confirmation email within 2 minutes; unconfirmed addresses are deleted after 7 days.
- Duplicate signups are handled silently (no error, no duplicate row, no second email).
- Invalid emails get an inline, accessible error — the page never dead-ends.
- The stored record is email + timestamp + confirmation state, nothing else.
- I can export confirmed addresses as CSV with one command.

## Design intent

One centered card on the landing page: `Input.Email` + `Button.Primary` ("Join the
waitlist") from the design system. States: default, submitting (button spinner),
success (card swaps to confirmation message), error (inline `Text.Error` under input).
Tone: quiet confidence, no hype, no exclamation marks.

## Out of scope

Referral mechanics, position-in-line display, admin UI, analytics beyond a signup
counter, any second field (name, company).

## Risks and default-closed touchpoints

Collects personal data (email) → **default-closed**, #privacy: PRIV-01/02/03 in force.
Sends email to users → default-closed list item; single transactional confirm only.
Data inventory updated: `email — purpose: launch notification — retention: until
launch + 30 days or unsubscribe`.

## Chosen approach

Architect options: (A) third-party form service — fastest, but data leaves our control;
(B) own endpoint + hosted transactional email API — one evening more work, data stays
ours, PRIV-03 deletion trivial. **Chose B** for privacy posture. Rejected A: retention
control is worth an evening.

---

GATE 1: APPROVED — 2026-08-14T09:12-04:00 — IE
GATE 1 EVIDENCE: example only — production use requires an authenticated PR approval/check ID
