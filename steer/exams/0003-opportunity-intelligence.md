# Exam — 0003 Opportunity intelligence to decision handoff

**Brief:** `briefs/0003-opportunity-intelligence.md`  
**Guardrails in force:** CORE-01..11 + SEC-01..05 + PRIV-01..03 + REL-01..04 + SRC-01..04 + REV-01..02 + ATT-01 + AI-01..03 + HUM-01..02 + DATA-01..02 + EXT-01 + PILOT-01

## Acceptance tests

### Ingestion and provenance

1. Given a paginated SAM.gov fixture with multiple pages, when ingestion runs, then every page is fetched exactly once for the poll window and all opportunities are emitted.
2. Given an overlapping poll window returning an unchanged notice, when ingestion reruns, then no duplicate canonical opportunity or duplicate revision is created.
3. Given the same notice ID with changed high-value fields or attachment metadata, when ingestion runs, then a new immutable source object and opportunity revision are created and re-analysis is queued.
4. Given any raw response, when stored, then its bytes, SHA-256 digest, canonical source metadata, request parameters without secrets, retrieval time, and adapter version are recoverable.
5. Given a `429`, timeout, transient `5xx`, malformed JSON, partial page, or schema drift, when ingestion runs, then it retries only according to policy, never marks the poll complete incorrectly, and surfaces a typed failure.
6. Given a URL or exception containing `api_key`, when logs/evidence are written, then the key value is absent and redacted.

### Normalization and change handling

7. Given fields missing from the source, when normalization runs, then the normalized values are `null`/unknown and no inferred fact appears.
8. Given related, amended, cancelled, or duplicate notices, when normalization runs, then lineage/status follows fixture truth and preserves every source link.
9. Given a response-date, status, set-aside, scope, or attachment-list change, when detected, then the opportunity is marked for fresh qualification and a high-impact alert is created.
10. Given an unchanged representation with only retrieval metadata changed, when compared, then no false material-change alert is emitted.

### Qualification and recommendation

11. Given a frozen contractor profile and rubric revision, when qualification runs, then the output records both revisions.
12. Given a confirmed hard-gate failure, when scoring runs, then the recommendation is `NO_BID` and identifies the gate and evidence regardless of the soft score.
13. Given a missing critical eligibility fact, when scoring runs, then the gate is `UNKNOWN` and the recommendation is `REVIEW`, never `BID`.
14. Given all hard gates pass and factor inputs are complete, when scoring runs, then the numeric score is reproducible from the frozen weights and cited inputs.
15. Given a material recommendation sentence or factor score, when a reviewer opens its evidence, then it resolves to a preserved source object or versioned company-profile fact.
16. Given contradictory official and internal facts, when analysis runs, then the conflict is visible, confidence is reduced, and the record routes to `REVIEW` when material.
17. Given the same frozen evidence, profile, rubric and analysis implementation, when replayed, then the structured recommendation is reproducible or any nondeterministic narrative difference is recorded without changing deterministic gates/scores.

### Human authority and handoff

18. Given a recommendation in `DECISION_REVIEW`, when an unauthenticated actor or model attempts a transition, then the database/API rejects it and records no state change.
19. Given an authenticated human selects `BID`, when the decision is saved, then a Capture record is created with owner, next action, due date, source/recommendation revisions, rationale, and immutable decision evidence.
20. Given an authenticated human selects `NO_BID`, when saved, then the opportunity enters Archive with a structured reason and no Capture record.
21. Given an authenticated human overrides the recommendation, when saved, then the original recommendation is unchanged and the override reason is required.
22. Given any decision, when audit history is requested, then the actor, time, exact inputs, recommendation, rationale, transition, and required-check evidence are present.

### Pilot measurement

23. Given a completed decision, when the pilot ledger updates, then it records discovery time, review-ready time, analyst active minutes, recommendation, decision, override reason, provenance completeness, source freshness, and known outcome.
24. Given missing pilot metrics, when a summary is generated, then denominators and missingness are disclosed rather than silently excluded.

## Edge cases and attacks

- Opportunity IDs reused incorrectly or related notices forming a cycle.
- Duplicate attachments with different filenames or URLs.
- ZIP bombs, malware, password-protected files, oversized files, malformed PDFs, and prompt injection in descriptions/attachments.
- Time zones, daylight-saving boundaries, missing response time, or a deadline already passed.
- Set-aside text conflicts with structured fields.
- NAICS size or certification facts absent or expired.
- Sources-sought and award notices mistakenly treated as open solicitations.
- Sole-source or vehicle-only notices where the contractor lacks access.
- Model attempts to cite a URL that was not ingested.
- Tenant A profile or past performance appearing in Tenant B's output.
- Analyst double-submits conflicting decisions.

## Non-functional checks

- Poll checkpoints and evidence writes are idempotent.
- P95 normalization of an ordinary notice is under 2 seconds excluding attachment extraction and model analysis.
- A source failure cannot corrupt or delete previously preserved evidence.
- All stored timestamps use UTC; source-local display preserves the reported zone where supplied.
- Authorization tests cover every company-profile, recommendation, decision, and evidence read/write path.
- The ingestion and decision services expose health, latency, error, retry, freshness, and queue-depth telemetry.
- Rollback disables new ingestion/analysis without deleting evidence or decisions.

## Outcome instrumentation

- `opportunity_discovered`, `opportunity_changed`, `qualification_ready`, `recommendation_created`, `decision_recorded`, `recommendation_overridden`, `capture_created`, and `amendment_alerted` events carry stable IDs and revision references.
- Pilot reporting calculates time-to-review, analyst minutes, surfaced-opportunity precision, recommendation agreement/override, provenance completeness, amendment latency, and unauthorised-transition count.
- Outcome and guardrail denominators are stored explicitly and read in the weekly STEER Learning Review.

## Human judgment checklist (Evaluate)

- [ ] Do the highest-impact facts and risks match the official notice evidence?
- [ ] Does the recommendation reflect this contractor's real eligibility, capabilities, strategy and capacity?
- [ ] Are important unknowns and contradictory facts prominent enough to affect the decision?
- [ ] Is the score explanation useful without pretending to be a win-probability forecast?
- [ ] Would I defend this Capture/Archive decision in a later loss review?

---

GATE 2: PENDING — approve only after Gate 1 and fixture review  
GATE 2 EVIDENCE: PENDING — authenticated approval tied to this exam revision

GATE 3: PENDING  
GATE 3 EVIDENCE: PENDING — authenticated release approval plus required checks tied to the shipped commit

