# Exam — 0007 Buzz POD live operations and blocker escalation

**Brief:** `steer/briefs/0007-buzz-pod-live-operations.md` at approved revision `fcf674b573204ab72447af40cf0df9890409cc38`

**Engineering record:** [GitHub issue #50](https://github.com/idrissenayat/federal-bd-platform/issues/50)

**Guardrails in force:** CORE-01..11, SEC-01..05, PRIV-01..03, A11Y-01..03, REL-01..04, LEGAL-01..02, DES-01..02

**Gate boundary:** this Exam may authorize implementation only after an authenticated Gate 2 approval tied to its exact revision. Until then, no provider credential, database, production channel, or deployed behavior may be changed.

## Acceptance tests

### A. Authority and identity

1. **A-01 — STEER remains authoritative.** Given an authenticated human or agent uses ordinary Buzz chat to assign, unassign, reprioritize, change state/workflow, record a gate, or close an item, when the message is received, then no authoritative STEER field changes and the user is directed to the exact STEER control.
2. **A-02 — Authorized event production.** Given an enrolled agent identity is assigned to an active item with all Flight Board authorization checks satisfied, when it emits an allowed operational event for that item, then the event is accepted with the enrolled identity and work authorization references.
3. **A-03 — Unauthorized event rejection.** Given an agent is unassigned, paused, removed, expired, or assigned to another item, when it attempts to emit an operational event, then the request is denied, no feed event is delivered, and an evidence-safe audit entry records the denial.
4. **A-04 — Human, agent, and service provenance.** Given the same event type is produced by a human, an agent, and a service projection, when rendered in Buzz and STEER, then each identity type and role is distinguishable without relying on color alone.
5. **A-05 — Membership enforced twice.** Given an actor can create an event but the destination membership changes before delivery, when delivery is attempted, then server-side organization/POD/project authorization is re-evaluated and unauthorized delivery is stopped.

### B. Canonical event contract

6. **B-01 — Required versioned fields.** Given any supported event type, when it is accepted, then the canonical payload contains a unique immutable event ID, schema version, occurrence time, source sequence, organization ID, POD ID, optional project ID, work-item key/link, actor type/ID/role, material change, next expected event, next owner, target time or `unknown`, authoritative state/gate references, and delivery/trace metadata with no secret.
7. **B-02 — Allowed type validation.** Given an event type outside `AUTHORIZED`, `STARTED`, `PROGRESS`, `BLOCKED`, `HELP_NEEDED`, `ESCALATED`, `WAITING_FOR_HUMAN`, `WAITING_FOR_AGENT`, `HANDOFF`, `GATE_READY`, `GATE_RULED`, `COMPLETED`, `STOPPED`, and `INCIDENT`, when submitted, then schema validation rejects it and no delivery is queued.
8. **B-03 — Append-only correction.** Given a visible event contains an error, when an authorized correction is recorded, then the original remains immutable and the correction references the superseded event with a reason.
9. **B-04 — Untrusted text safety.** Given event source text contains markup, scripts, prompt/tool instructions, hidden text, control characters, or oversized input, when validated and rendered, then it is bounded and escaped or safely summarized without execution or data disclosure.

### C. Project/POD routing — explicit regression for the current defect

10. **C-01 — No hard-coded project destination.** Given the application has multiple projects, when any handoff or feed event is routed, then the destination is resolved from authenticated organization/POD/project configuration and is never a hard-coded `#project-federal-bd-pilot` or other display name.
11. **C-02 — Platform/POD work routes to the POD channel.** Given STR-018 or another cross-project STEER platform item has no project scope, when an `AUTHORIZED`, `BLOCKED`, `GATE_READY`, `GATE_RULED`, `HANDOFF`, `INCIDENT`, or portfolio event is delivered, then the full operational event goes to the configured STEER Flight Team POD channel displayed as `#steer-team`.
12. **C-03 — Project execution routes to its project channel.** Given a Federal BD work item carries the authorized Federal BD project ID, when project-specific execution detail is delivered, then it goes only to that project's configured channel displayed as `#project-federal-bd-pilot`, while the POD channel receives at most the concise cross-project event or pulse entry specified by policy.
13. **C-04 — Cross-project isolation.** Given members of Project A are not members of Project B, when Project B detail is routed, linked, replayed, or included in the pulse, then Project A members cannot receive or resolve it.
14. **C-05 — Missing or ambiguous routing fails closed.** Given a project-scoped event has no valid project-channel mapping, duplicate mappings, or a destination belonging to another POD, when delivery is planned, then project delivery is blocked, an operator-visible failure names the safe corrective action, and the event is not silently rerouted.
15. **C-06 — Display-name changes do not affect authority.** Given a Buzz channel display name changes while its stable authorized channel ID is unchanged, when new events are delivered, then routing remains correct; given only a matching display name exists without an authorized ID, delivery is denied.
16. **C-07 — Specialist thread containment.** Given a specialist discussion is required, when the event creates or links a thread/specialist destination, then it remains within the authorized POD/project boundary and links back to the authoritative STEER item.

### D. Blockers, progress, and escalation

17. **D-01 — Actionable blocker fields.** Given `BLOCKED`, `HELP_NEEDED`, or `ESCALATED`, when accepted, then severity, blocked-since/age, affected item/phase/impact, safe description, unblock owner, requested action, acknowledgement deadline, escalation deadline/destination, and eventual resolution or accepted-risk reference are present.
18. **D-02 — Critical stop and escalation.** Given a suspected security/privacy breach, unauthorized action, destructive failure, or production incident, when classified critical, then affected execution stops and the POD plus named authority are notified immediately without exposing protected content.
19. **D-03 — High and normal deadline policy.** Given high or normal blockers, when acknowledgement/escalation deadlines are computed, then configured operating windows and stricter POD policy are honored, critical escalation cannot be disabled, and required owner/action fields cannot be removed.
20. **D-04 — One escalation transition.** Given a blocker misses its deadline, when escalation runs repeatedly, then exactly one visible escalation transition is emitted for the applicable level unless a later material state change warrants another event.
21. **D-05 — Material progress only.** Given an unchanged heartbeat or “still working” update, when processed, then staleness metadata may refresh but no visible `PROGRESS` message is posted; a changed milestone, forecast, dependency, next event, or risk creates one material event.
22. **D-06 — Staleness is not surveillance.** Given two expected heartbeats are missed or the next-event time passes, when the item becomes stale, then the UI says attention is needed, does not claim inactivity or poor performance, and names the next owner/action.

### E. POD pulse and experience

23. **E-01 — Pulse answers the operational questions.** Given active work across at least two projects, blockers, human/agent waits, upcoming handoffs, completed/stopped work, and stale work, when the POD pulse is rebuilt, then it groups active work by project and shows owner, last material event, blocker severity/age/action, next expected event/time, recent completion/stop, staleness, and integration health.
24. **E-02 — Pulse is a projection.** Given the pulse is deleted, stale, or corrupted, when rebuilt from authoritative STEER state and canonical events, then it returns to the same current view without using Buzz messages as authoritative state.
25. **E-03 — Explicit system states.** Given empty, loading, delayed, reconnecting, permission-denied, partial-data, delivery-failure, dead-letter, and recovery conditions, when viewed, then each uses plain language, identifies whether STEER state remains safe, and gives an authorized next action without implying silence means success.
26. **E-04 — Accessible responsive presentation.** Given keyboard-only, screen-reader, 200% zoom, and narrow-screen use, when event cards, the pulse, and recovery controls are operated, then event order, severity, ownership, blocker action, timestamps/timezone, links, and controls remain perceivable and operable with no clipped owner or next-event content and WCAG AA contrast.
27. **E-05 — Low-noise rendering.** Given repeated, duplicate, unchanged, superseded, or out-of-order events, when projected, then they do not create repeated channel messages; critical severity is distinct without repetition or color-only meaning.

### F. Delivery durability and recovery

28. **F-01 — Atomic outbox.** Given a committed STEER mutation eligible for communication, when the transaction succeeds, then the canonical event and outbox record commit atomically; when it fails, neither partially commits.
29. **F-02 — Idempotent ordered delivery.** Given duplicate attempts and out-of-order provider responses, when processed, then one visible event is produced, per-item order is preserved, and delivery receipts reference the idempotency and trace IDs.
30. **F-03 — Buzz outage safety.** Given Buzz is unavailable before, during, or after a STEER mutation, when bounded retries/backoff and reconnection occur, then STEER state remains committed and correct, missing events replay in order without flooding, and the pulse can rebuild independently.
31. **F-04 — Observable delivery lifecycle.** Given delivery moves through `pending`, `delivered`, `retrying`, `failed`, `dead-letter`, or `superseded`, when an authorized operator inspects STEER, then the current state, last safe error, attempt count, next retry/recovery action, and trace reference are visible.
32. **F-05 — Controlled replay/drop.** Given a dead-letter event, when an authorized operator replays or drops it, then re-authentication/authorization applies, a reason is required, the action is immutable in audit, and replay remains idempotent.
33. **F-06 — Secret and evidence redaction.** Given provider credentials, tokens, private membership, protected evidence, request bodies, or sensitive decision text are present upstream, when payloads, logs, metrics, errors, dead letters, or UI messages are produced, then the protected values are absent and automated secret/redaction checks pass.
34. **F-07 — Provider disable and rollback.** Given unsafe delivery behavior or a provider incident, when the Platform/Ops authority disables the adapter, then future delivery stops without blocking STEER work, queued events remain recoverable, and the documented rollback/re-enable path is auditable.

### G. Measurement and anti-surveillance

35. **G-01 — Outcome telemetry.** Given eligible material events, when the observation window runs, then event eligibility/delivery counts, end-to-end latency, duplicate suppression, routing correctness, retry/dead-letter rate, blocker acknowledgement/resolution time, stale-item count, and clarity feedback are queryable by event type, POD, and integration.
36. **G-02 — No individual productivity scoring.** Given any analytics, pulse, export, or API response, when inspected, then it does not rank or score people by message count, online presence, response time, heartbeat frequency, event volume, active minutes, token use, estimate accuracy, or closed-item count.
37. **G-03 — Purpose-limited audit access.** Given person-level event history is accessed, when authorization is evaluated, then a legitimate work-audit or incident purpose, permitted role, retention policy, and access log are required.
38. **G-04 — Retention and deletion.** Given membership expires or a configured retention period ends, when policy enforcement runs, then future delivery stops immediately and retained STEER/Buzz records are deleted or preserved exactly according to the approved purpose, legal hold, and provider capability with an auditable result.

## Edge cases and attacks

- A forged event reuses another agent's ID, work item, source sequence, or idempotency key.
- A valid member is removed between enqueue and delivery, or changes projects/PODs during retry.
- Two projects use the same channel display name, or a channel is renamed/deleted/recreated with a new ID.
- A project event omits its project ID or claims a project outside its POD.
- An attacker embeds secrets, links, mentions, scripts, tool instructions, bidirectional text, or oversized payloads in titles, blocker descriptions, next actions, or provider errors.
- Reconnect returns old events, provider acknowledgements arrive out of order, or a retry races a manual replay/drop.
- The pulse is stale while the chronological feed is current, or vice versa.
- A critical blocker floods repeated escalations or a normal blocker is falsely upgraded to bypass operating windows.
- A user interprets stale heartbeats as employee inactivity or uses exports to reconstruct prohibited productivity rankings.
- Buzz accepts delivery but the receipt is lost; STEER must retry safely without a duplicate visible message.
- The provider is online but authentication, membership lookup, or a single channel fails.
- A correction attempts to erase rather than supersede an earlier event.

## Non-functional checks

- **Latency:** at least 95% of eligible material events reach the correct channel within 60 seconds during the dogfood window; report p50, p95, and maximum separately for immediate and replay delivery.
- **Duplicates:** fewer than 1% of eligible events produce more than one visible message, with every duplicate traceable to a recorded defect.
- **Blocker completeness:** 100% of visible blocker events contain unblock owner and requested action.
- **Pulse usability:** representative Product, Technology, Platform, Security, and specialist users can identify active work, blockers, and next expected events in under one minute.
- **Reliability:** provider outage and reconnection tests show zero lost canonical events, zero corrupted STEER mutations, and bounded retry/backoff with visible dead letters.
- **Security:** dependency audit, secret scan, authorization/IDOR tests, membership-at-delivery tests, replay/forgery tests, input validation/escaping, rate-limit tests, and provider-scope review pass.
- **Privacy/legal:** event data inventory records field, purpose, lawful/organizational basis, audience, retention, deletion, provider location/terms, and monitoring disclosure; named Privacy/Legal authority approves before Gate 3.
- **Accessibility:** automated axe scan has zero serious/critical issues on changed surfaces; keyboard, screen reader, 200% zoom, narrow-screen, non-color severity, focus, and timezone checks pass.
- **Performance:** pulse and feed reads must not block authoritative STEER mutations; define and verify a pre-Gate-3 p95 read/render budget from dogfood baseline, and record any exception rather than inventing a threshold now.
- **Rollback:** disabling the Buzz adapter is documented and tested without disabling STEER; event backlog, replay decision, provider credential rotation, and pulse recovery steps name the Platform/Ops authority.

## Outcome instrumentation

- Record a canonical `event_eligible` counter and delivery lifecycle timestamps for every eligible event; derive delivery rate/latency and duplicates without relying on Buzz message volume as a productivity measure.
- Record `routing_resolved`, `routing_blocked`, and `routing_mismatch_prevented` with organization/POD/project/destination IDs that are access-controlled and do not expose channel membership.
- Record blocker created, acknowledged, escalated, resolved, or accepted-risk timestamps plus severity and ownership completeness.
- Record pulse rebuild time, source watermark, integration-health state, stale/partial flags, and user-opened work-item links.
- Collect a short voluntary clarity check after representative dogfood sessions: could the member identify active work, blockers, and next expected events in under one minute?
- Read the observation in the STEER operator view and a versioned dogfood report after the first 20 active items or 30 days, whichever is later. Report missing data and contrary cases.
- Verify zero chat-only assignments/gate rulings, zero protected-content leakage, and zero prohibited person-level productivity rankings for the full window.

## Human judgment checklist (Evaluate)

- [ ] As a POD member, can I understand current work, blockers, unblock ownership, and next handoffs in under one minute without treating Buzz as the backlog?
- [ ] Does platform/POD work visibly route to `#steer-team`, project work to its configured project channel, and neither depend on a hard-coded display name?
- [ ] Are messages calm and material rather than noisy, repetitive, or surveillance-oriented?
- [ ] Do critical, delayed, stale, partial, permission-denied, and failed-delivery states make the safe next action obvious on keyboard, screen reader, and small screens?
- [ ] Do Security, Privacy/Legal, Product Design, and Platform/Ops reviewers accept the identity, routing, retention, accessibility, provider, recovery, and anti-surveillance controls?

## Required Gate 3 evidence

- Builder evidence mapping every acceptance-test ID to an automated test, operator test, or named human check.
- Test Agent evidence including routing isolation, membership-at-delivery, replay/duplicate/order, outage/reconnect, redaction, accessibility, and rollback results.
- Fresh-context Critic review of the approved brief, approved exam, final diff, test evidence, provider configuration boundaries, and derived tags.
- Named Security, Privacy/Legal, Product Designer, and Platform/Ops findings and rulings.
- Product Lead and Tech Lead approvals plus an independent reader who authored neither brief nor exam.
- A minimum 24-hour default-closed cooling-off after the verified build before the final Gate 3 ruling.

---

GATE 2: PENDING — Interim Tech Lead must review this exact Exam revision in a session separate from Gate 1

GATE 2 EVIDENCE: PENDING — authenticated approval must be tied to this exact revision and a fresh Critic review

GATE 3: BLOCKED — implementation, verification, tagged-domain review, independent review, and cooling-off are incomplete

GATE 3 EVIDENCE: PENDING
