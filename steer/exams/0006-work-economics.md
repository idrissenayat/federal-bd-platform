# Exam — 0006 STEER Work Economics and value realization

**Brief:** `steer/briefs/0006-work-economics.md` at approved revision `21d5e0bbd0e420413b7dce0d0c8b57b3d4e5d0e0`

**Engineering record:** [GitHub issue #48](https://github.com/idrissenayat/federal-bd-platform/issues/48)

**STEER work item:** STR-017

**Guardrails in force:** CORE-01..11, SEC-01..05, PRIV-01..03, A11Y-01..03, REL-01..04, LEGAL-01..02, DES-01..02

**Gate boundary:** the authenticated Interim Tech Lead approved Gate 2 against exact Exam revision `65c9dcb209a6ef2e6045025be5ad760d5ecc8d48`. That ruling authorized implementation and testing only; release, financial claims, person-level reporting, and Gate 3 remain blocked.

## Acceptance tests

### A. Four separate records and authority

1. **A-01 — Records never collapse into one score.** Given an eligible work item, when Work Economics is displayed or exported, then Value hypothesis, Delivery forecast, Actual delivery economics, and Realized outcome remain separately labeled and no synthetic productivity/value score combines them.
2. **A-02 — Missing is not zero.** Given any required field is absent, stale, unavailable, or not yet due, when displayed or calculated, then it is labeled `unknown`, `not yet due`, or `unavailable` and is never treated as zero.
3. **A-03 — Authority is explicit.** Given AI proposes a value, forecast, correction, or outcome interpretation, when displayed, then it is labeled advisory and editable; only the named human authority can accept the applicable record or gate.
4. **A-04 — Audit is immutable.** Given an accepted forecast or audited actual is corrected, when saved, then the prior value, actor, time, source, reason, and replacement remain reconstructable.

### B. Value hypothesis

5. **B-01 — Native-unit value contract.** Given a new or materially revised item, when Gate 1 is prepared, then it names primary value type, beneficiary, outcome metric, baseline, target, native unit, observation date, outcome owner, impact, time criticality, strategic alignment, confidence, and evidence.
6. **B-02 — Unsupported value fails closed.** Given a value or ROI claim lacks evidence, compatible monetary units, currency/period, or visible assumptions, when reviewed, then the claim is blocked or shown as unverified rather than used for prioritization.
7. **B-03 — Advisory confidence is explainable.** Given AI proposes Low/Medium/High value confidence, when shown, then the recorded drivers, evidence, omissions, and human acceptance state are adjacent.

### C. Initial effort and delivery forecast

8. **C-01 — Forecast is a range.** Given execution is being authorized, when the Delivery forecast is accepted, then it records size band `XS`–`XL`, human active-time min/max by role, agent/provider cost min/max, expected attempts, complexity/uncertainty/coordination bands, and the basis or comparable items.
9. **C-02 — Calendar forecast is separate from effort.** Given an accepted effort forecast, when a delivery forecast is shown, then earliest, likely, and latest completion timestamps plus timezone and confidence are recorded separately from active effort.
10. **C-03 — Service-level basis.** Given insufficient comparable evidence, when an owner forecasts completion, then the basis is labeled expert judgment with low confidence; given enough same-POD/same-work-type history, the platform shows the applicable cycle-time service-level distribution and sample size.
11. **C-04 — Story points are not a date promise.** Given size, complexity, or story-point-like inputs, when estimating completion, then the platform never converts them alone into a guaranteed date or cross-POD productivity comparison.
12. **C-05 — Owner acceptance before execution.** Given AI or another role proposes a forecast, when execution authorization is attempted, then the assigned delivery owner must accept or edit the range, completion window, confidence, basis, and first expected milestone.

### D. In-progress forecast and next expected event

13. **D-01 — Every active item answers “what next and when.”** Given an item enters `active`, when viewed in My Work, Flight Board, Backlog, item details, or the POD pulse, then it shows current owner, next expected milestone/event, target timestamp, likely completion window, forecast confidence, and last forecast update.
14. **D-02 — Phase-exit forecast is explicit.** Given an active item is in Frame, Engineer, Evaluate, or another phase, when its forecast is shown, then it distinguishes the next phase exit (for example, “Exam ready,” “moving to Evaluate/QA,” or “Gate 3 evidence ready”) from final completion.
15. **D-03 — Forecast state is understandable.** Given current time and the accepted forecast, when status is calculated, then it is one of `on track`, `at risk`, `late`, or `unknown`; status includes the reason and does not rely on color alone.
16. **D-04 — Material changes require reforecast.** Given scope, dependency, owner, complexity, test result, gate decision, blocker, or expected milestone changes materially, when the item changes, then the owner is prompted to update earliest/likely/latest completion, confidence, next milestone/time, and reason.
17. **D-05 — Silence cannot remain green.** Given an active item passes its next-event target or the configured forecast-freshness interval without an update, when viewed, then forecast state becomes stale/attention-needed or unknown rather than remaining on track.
18. **D-06 — Blocked time moves the forecast honestly.** Given an item becomes blocked, when the owner records the blocker, then the platform preserves the prior forecast, records blocked-since and unblock owner/action, and requires a revised window or an explicit `cannot forecast until <dependency>` statement.
19. **D-07 — Gate waiting is distinguishable.** Given work is ready for a human gate, when forecasted, then agent work completion, human decision target, and overall completion window are shown separately; agent execution is not reported as still working while waiting on a human.
20. **D-08 — Forecast history supports learning.** Given an item completes, when actual timestamps are known, then the platform retains every material reforecast and reason and calculates variance against the accepted likely window without scoring the individual.

### E. WIP and pull forecast

21. **E-01 — “When can we pull next?” is computed from active work.** Given a POD has a WIP limit and active items with completion windows, when the team-flow pulse is viewed, then it shows the earliest/likely/latest time a WIP slot is expected to open, the item expected to release it, forecast confidence, and data freshness.
22. **E-02 — Unknown forecasts remain visible.** Given one or more active items lack a valid completion window, when the pull forecast is calculated, then the UI explains that the date is incomplete, names the owners who must update forecasts, and does not invent a date.
23. **E-03 — Queue promises respect WIP.** Given WIP is full, when a queued item is considered, then it is not given a committed start date earlier than the forecast slot unless the team explicitly stops, pauses, or completes an active item with an audited reason.
24. **E-04 — Portfolio range is probabilistic.** Given multiple candidate active items could free a slot, when the pull forecast is shown, then it uses ranges/confidence and exposes contributing items rather than presenting one deterministic date.

### F. Actual delivery economics

25. **F-01 — Work and waiting stay separate.** Given a completed item, when actuals are calculated, then human active minutes by role, agent execution duration, queue time, blocked time, gate wait, cycle time, rework, defects, and rollback events remain separately queryable.
26. **F-02 — Agent telemetry keeps provenance.** Given provider telemetry exists, when actuals are recorded, then provider, model, attempts, available input/output tokens, metered cost, execution duration, source, and completeness are present; missing data is labeled missing.
27. **F-03 — Person-level data is restricted.** Given routine portfolio or backlog access, when actuals are viewed, then human effort is aggregated by role/POD; person-level raw activity requires a permitted purpose, role, retention rule, and access log.

### G. Realized outcome

28. **G-01 — Completion is not value realization.** Given an item closes, when outcome is displayed, then it remains `not due` or `pending evidence` until the observation owner records evidence and a human verifies the result.
29. **G-02 — Outcome states are exact.** Given the observation point arrives, when verified, then status is one of `verified positive`, `verified neutral`, `verified negative`, or `inconclusive` with native-unit result, evidence, verifier, confidence, and causal limitations.
30. **G-03 — Like-unit variance only.** Given forecast and actual use compatible units, when variance is shown, then assumptions and provenance are visible; incompatible units appear side by side without a fabricated ratio.

### H. Experience, reliability, and migration

31. **H-01 — Compact views remain actionable.** Given backlog, My Work, or Flight Board, when Work Economics renders, then value hypothesis, effort range, likely completion window, next milestone/time, forecast status/confidence, and outcome state remain readable on desktop, narrow screens, keyboard, screen reader, and 200% zoom.
32. **H-02 — Complete system states.** Given empty, stale, conflicting, unavailable, permission-denied, validation-error, migration, or partial-telemetry conditions, when viewed, then the state, responsible owner, and safe corrective action are explicit.
33. **H-03 — Schema migration preserves existing work.** Given existing work items have no Work Economics fields, when the migration runs and rolls back in test, then all existing work/activity/decision evidence remains intact and new fields appear as unknown rather than fabricated defaults.
34. **H-04 — Authorization is server-side.** Given an unauthorized user or agent changes value, forecast acceptance, actual correction, outcome verification, or restricted person-level data through UI or API, when attempted, then the server rejects it and records an evidence-safe audit event.

## Edge cases and attacks

- An owner supplies a precise completion date without a basis or narrows the range to appear on track.
- A scope change occurs after the latest forecast but the UI continues to show green/on-track.
- An agent reports “still working” repeatedly without changing the next milestone or completion window.
- A gate wait is counted as agent work, or blocked/queue time is hidden inside active effort.
- Two timezones make an apparently valid target already expired.
- An item changes owner and silently inherits a forecast the new owner has not accepted.
- A likely date passes while earliest/latest are edited to erase the miss.
- A paused item continues consuming WIP or is presented as actively executing.
- A queued item receives a committed start date even though no WIP slot is forecast to open.
- Small or cherry-picked historical samples create false confidence; cross-POD or different-work-type data is used without disclosure.
- Tokens, hours, attempts, response speed, estimate accuracy, or closed-item count are used to rank a person.
- Provider cost or token telemetry arrives late, duplicates, conflicts, or disappears and is treated as zero.
- A malicious client edits accepted forecasts, outcome evidence, or person-level telemetry without authority.
- Monetary and non-monetary values are combined into an unsupported ROI claim.

## Non-functional checks

- **Forecast freshness:** every active item must have a next-event target and forecast update timestamp; the configurable freshness interval defaults to one working day and may be stricter by POD/work type.
- **Pull forecast latency:** recomputing the POD slot-opening forecast after a relevant item change completes within 5 seconds at the first dogfood scale and does not block the authoritative mutation.
- **Accessibility:** zero serious/critical axe findings; keyboard, screen reader, non-color status, timezone, narrow-screen, 200% zoom, loading, stale, error, and permission states pass.
- **Privacy/data inventory:** every personal or role-level field has purpose, authority, source, retention, deletion, and audit-access rules before Gate 3.
- **Security:** API authorization, IDOR, input validation, audit integrity, restricted exports, and person-level access tests pass; no sensitive timing or cost data enters ordinary error logs.
- **Reliability:** migration and rollback tests preserve existing records; forecast recalculation is idempotent; stale/partial telemetry never silently overwrites accepted or audited values.
- **Calibration:** forecast accuracy is reported by POD/work type/size band with sample size and range; it is never used for individual performance scoring.

## Outcome instrumentation

- Capture forecast created/accepted/changed/staled timestamps, actor type/role, size/work type, earliest/likely/latest windows, confidence, basis, next event/time, and change reason.
- Capture phase transitions, execution start/end, queue, blocked, gate wait, rework, completion, observation, and outcome-verification timestamps from authoritative events.
- Report the percentage of active items with fresh forecasts, completion-window hit rate, median/range of variance, calibration by comparable cohort, and percentage of WIP-full periods with a valid slot-opening forecast.
- Measure whether a Product Lead can answer “what is next, when should it finish, what is at risk, and when can we pull another item?” in under one minute.
- Record missing/incompatible telemetry and contrary cases; never drop killed, stopped, late, blocked, or inconclusive items from denominators.
- Read the first dogfood result after 10 completed items or 30 days, whichever is later, and continue outcome verification through declared observation dates.

## Human judgment checklist (Evaluate)

- [ ] Can I tell what each active item is doing next, when that event is expected, and its earliest/likely/latest completion window without opening every activity record?
- [ ] Can I tell when a WIP slot is likely to open and why the forecast may be wrong?
- [ ] Are effort, elapsed time, cost, and business value visibly separate, with uncertainty and evidence close to every claim?
- [ ] Do late, stale, blocked, gate-waiting, partial-data, and permission states make the safe next action obvious without blaming an individual?
- [ ] Do Security, Privacy/Legal, Product Design, Platform/Ops, Product Lead, and Tech Lead accept the data, authorization, migration, accessibility, financial-claim, and anti-gaming controls?

## Required Gate 3 evidence

- Builder evidence mapping every acceptance-test ID to an automated test, system test, or named human check.
- Test Agent evidence covering authorization, migration/rollback, forecast updates, stale/late logic, WIP pull forecasting, telemetry provenance, responsive/accessibility states, and anti-ranking controls.
- Data inventory and retention/deletion evidence for forecast, timing, cost, audit, and any person-level fields.
- Fresh-context Critic review of approved brief, approved exam, final diff, telemetry evidence, and derived tags.
- Named Security, Privacy/Legal, Product Designer, Platform/Ops, Product Lead, Tech Lead, and independent-reader findings and rulings.
- Minimum 24-hour default-closed cooling-off after the verified build before final Gate 3 approval.

---

GATE 2: APPROVED — authenticated Interim Tech Lead ruling recorded in STEER on 2026-08-14 at 3:24 PM America/New_York, bound to exact approved Exam revision `65c9dcb209a6ef2e6045025be5ad760d5ecc8d48`

GATE 2 EVIDENCE: Critic review #26; authenticated ruling by Idriss Enayat — “I approve Gate 2 for STR-017 — Define STEER Work Economics and value-realization model based on the exact linked evidence at revision 65c9dcb209a6. The current Critic Agent review found no automatic hard stop. No automatic hard stop was found, but 1 material concern should shape the human review. I considered the highlighted concern (Default-closed controls apply) and accept it as mandatory downstream controls that remain required at the named later gates. This approval authorizes implementation only against the signed brief and exam; it does not authorize release or Gate 3.”

DOCUMENTATION RECONCILIATION: The approval remains bound to exact Exam revision `65c9dcb209a6ef2e6045025be5ad760d5ecc8d48`. This later status correction does not change or reapprove the frozen acceptance criteria. See `steer/evidence/0006-work-economics-documentation-reconciliation.md`.

GATE 3: BLOCKED — implementation, verification, specialist review, independent review, outcome controls, and cooling-off are incomplete

GATE 3 EVIDENCE: PENDING
