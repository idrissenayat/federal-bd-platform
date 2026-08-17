# Fresh Critic evidence — STR-028 Intent Brief 0028

**Review target:** `steer/briefs/0028-stale-post-write-feedback.md` at
`2fae0aafafc2a8ca15d7815aefef81eaacf2f228` on branch
`scout/str-028-intent-brief`
**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Review role:** fresh independent pre-Gate-1 challenge of the problem/evidence
brief; this is not a human gate ruling, an Exam, implementation evidence, or a
release decision
**Review basis:** exact brief revision, issue #56, authenticated handoff mirror
[#5310322900](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310322900),
dispatch root-cause evidence
[#5310332219](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310332219),
the local source revision cited by the brief, `steer/operating-system/GATES.md`,
`GUARDRAIL-LIBRARY.md`, `DECISION-LOG.md`, `METRICS.md`,
`PROJECT-GUARDRAILS.md`, and `steer/signals/README.md`

## Coverage checked

- The STR-027 stale-state and hidden-`409` incident, user impact, and narrow
  Sense/Frame boundary.
- Canonical `#steer-team` routing and the corrected-vs-recorded channel mismatch.
- The required durable, agent-readable authorization receipt and its evidence
  binding, human-authorization identity, scope, timestamps, channel, and
  idempotency fields.
- Fail-closed handling for wrong or missing channel configuration, outbox
  queued/delivered/acknowledged/failed/retry states, and Buzz/GitHub reconciliation.
- Replay, concurrent retry, delayed/out-of-order acknowledgement, partial-dispatch
  recovery, and the single claim/run invariant.
- Thin-signal limits, the absence of live replay/concurrency execution, Gate 1
  status, and the prohibition on drafting an Exam or implementing code.

## Findings

### SHOULD-FIX 1 — Keep the receipt and routing controls as explicit future proof obligations

**Concern:** The source evidence shows the current failure modes, but the current
brief cannot prove that a production dispatch already emits the requested receipt,
resolves `#steer-team` from authoritative configuration, or reconciles every outbox
state. The local source still hard-codes `#project-federal-bd-pilot` in
`flight-board/worker/authorization.ts:106`, writes generic `Block Buzz` notification
rows and a timestamp-based dedupe key in `flight-board/worker/api.ts:492-515`, and
records free-text activity at `:507`. Treating the GitHub mirror as the product's
receipt would overstate the evidence.

**Required action:** Preserve the brief's distinction between observed defect and
future control. At Gate 1/Exam preparation, the human and Tech owner should freeze
the receipt schema, authoritative channel source, mismatch failure behavior, outbox
state machine, acknowledgement identity, and reconciliation authority before any
implementation begins.

### SHOULD-FIX 2 — Make the single-run invariant cover correction, replay, and races

**Concern:** The brief names the invariant and the required negative cases, but no
live replay, concurrent retry, delayed acknowledgement, or partial-dispatch recovery
run has been executed. The issue evidence specifically reports
`dispatch-${itemId}-${now}` as a dedupe key, so a retry can receive a new key and
escape deduplication. A routing correction must therefore be proven to resume the
existing claim rather than create a new claim/run.

**Required action:** The future Exam must bind one deterministic identity to the
work-item/role/authorization revision and test replay, concurrency, acknowledgement
reordering, partial delivery, retry, and corrected routing with fail-closed outcomes
and no duplicate durable work.

### SHOULD-FIX 3 — Do not convert one incident into demand or recurrence

**Concern:** `steer/signals/` contains only its intake README, `METRICS.md` has no
STR-028 row, and relay search found no independent repeated-signal series. The brief
correctly labels frequency unmeasured. Issue #57 is engineering corroboration, not
an independent user signal.

**Required action:** Keep any Gate 1 reasoning explicitly bounded to one observed
incident and a repair hypothesis. If the product owner wants an outcome claim later,
they must record the denominator, observation window, minimum meaningful signal, and
guardrail measure before observation begins; missingness must remain visible.

### SHOULD-FIX 4 — Preserve the human gate boundary and exact revision binding

**Concern:** The mirror authorizes the Scout handoff but explicitly does not rule on
Gate 1 or Gate 2. The reviewed brief records Gate 1 as pending and contains no
authenticated human ruling. The current evidence is therefore suitable for a human
Gate 1 decision, not a Gate 1 approval or an Exam/implementation handoff.

**Required action:** A human Product Lead must make the Gate 1 decision in the
authenticated Work Management flow against the exact brief revision and this fresh
review. Any later Exam or implementation must remain blocked until that ruling and
the required next gate evidence are recorded.

## Notes

- The defect evidence is concrete and internally consistent: the issue records the
  durable `200`/`409` sequence; the brief cites the stale reload/error surface; and
  the supervisory comments identify wrong-channel routing, generic outbox channel
  storage, timestamp dedupe, and missing receipt identity.
- The brief is appropriately limited to problem and evidence preparation. It does
  not invent a demand series, claim that controls already work, draft the 0028 Exam,
  change application code, or approve a gate.
- The corrected canonical route is `#steer-team`, channel
  `10ac2fb4-f7fc-4dbc-bb73-8c545f31a470`; the historical
  `#project-federal-bd-pilot` destination remains defect evidence and must not be
  silently reused.

## Disposition

**Pre-Gate-1 recommendation:** present the exact brief and this review to the human
Product Lead. Keep Gate 1 pending until the human rules on the bounded repair
hypothesis and records the authenticated decision. No implementation, Exam drafting,
deployment, merge, release, or agent-recorded gate action is authorized by this
review.
