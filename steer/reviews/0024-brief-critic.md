# Fresh Critic evidence — STR-024 Intent Brief 0024

**Review target:** `steer/briefs/0024-governed-agent-execution.md`
**Work item:** [STR-024 / issue #52](https://github.com/idrissenayat/federal-bd-platform/issues/52)
**Review basis:** exact branch revision at review time; no implementation diff and no
Exam was reviewed or created
**Review role:** fresh pre-Gate-1 challenge of the Brief; this is not a human gate
ruling, Gate 1 evidence, an Exam, or Gate 3 independent-reader evidence
**Sources checked:** issue #52, [authenticated dispatch evidence](https://github.com/idrissenayat/federal-bd-platform/issues/52#issuecomment-5303465502),
`steer/operating-system/GUARDRAIL-LIBRARY.md`, `GATES.md`, `DECISION-LOG.md`,
`METRICS.md`, `PROJECT-GUARDRAILS.md`, `docs/steer/TOOL-ADAPTERS.md`,
`docs/steer/REFERENCE-ARCHITECTURE.md`, and `steer/signals/README.md`.

## Coverage checked

- Outcome/value hypothesis, current evidence limits, denominator, observation window,
  proposed signal, and guardrails.
- Human/agent authority boundary and Work Management/Buzz/GitHub separation.
- Authenticated run creation, claim, lease fencing, heartbeat, progress, retry,
  stop/cancel, failure, terminal states, idempotency, and evidence binding.
- Provider/model portability, token/cost/time telemetry, accessibility states, threat
  model, public/unclassified data boundary, privacy, rollout/rollback, and exclusions.
- Scope discipline: no Exam, implementation, deployment, merge, release, or gate
  approval is included.

## Findings

### SHOULD-FIX 1 — Freeze the source-of-truth and state-transition contract before Gate 1

**Concern:** The Brief names Work Management as authoritative and proposes lifecycle
states, but it cannot yet point to the exact durable state machine, run-record revision,
or human ruling that will implement the transitions. If those remain implicit, the
future Exam may test a runtime that can diverge from the Flight Board.

**Required action:** Product/Tech owners should attach or approve the exact Work
Management run contract at Gate 1/Exam preparation, including authoritative IDs,
allowed transitions, lease fencing, and which adapter writes each event. Do not infer
these details during implementation.

### SHOULD-FIX 2 — Make the data inventory and retention/deletion ruling a Gate 1 precondition

**Concern:** Run events necessarily contain authenticated worker identity, timestamps,
scope, provider/model metadata, and possibly cost information. The repository decision
log does not set a retention period or deletion/revocation policy for this new record.
This is a default-closed privacy boundary, not a documentation nicety.

**Required action:** Human owner records the minimum fields, purpose, access scope,
retention duration, deletion/revocation path, and audit owner before implementation.
Until then, the Brief correctly prohibits choosing a duration silently.

### SHOULD-FIX 3 — Calibrate the proposed outcome threshold against an observed baseline

**Concern:** The checkout has no concrete STR-024 signals or current run metrics, so the
proposed 90% review-ready/terminal threshold is a falsifiable planning hypothesis but
not yet a validated meaningful-signal threshold. Treating it as an observed baseline
would invent demand or performance.

**Required action:** Before rollout, freeze the cohort, denominator, observation window,
and threshold with the human owner, and report missingness, contrary cases, guardrail
failures, human minutes, and cost alongside the primary result. If the owner cannot
provide a credible baseline, label the item feasibility evidence rather than a product
success claim.

## NOTES

- The evidence is sufficient to frame a missing control-plane contract, not to claim
  customer demand, speed improvement, safety improvement, or STEER superiority.
- The Brief explicitly excludes Exam drafting and implementation, matching the
  authenticated dispatch boundary.
- The proposed state set covers ordinary, recovery, stop, and review paths; the future
  Exam must test race ordering among completion, stop, retry, revocation, and lease
  expiry rather than accepting only the happy path.
- Provider portability is expressed as an adapter contract and telemetry requirement;
  no provider/model is selected or endorsed.
- Accessibility is specified as observable status and interaction behavior, including
  denied/stale/disconnected/error states; the future Exam must name the exact UI surface
  and automated/manual checks.
- No Gate 1, Gate 2, or Gate 3 approval is implied by this review. A human must rule on
  the Brief through the authenticated STEER Work Management flow.

## Disposition

**Pre-Gate-1 recommendation:** return to human Product Lead/Tech owner for the three
should-fix decisions above, then obtain the authenticated Gate 1 ruling against the
exact Brief revision. No implementation, Exam, deployment, merge, release, or gate
action is authorized by this artifact.
