# Signal-to-Decision delivery plan

**Parent:** GitHub issue #54, Add AI-assisted signal intake and governed work-item creation

**Mission:** A human contributes an imperfect signal in ordinary language. Platform AI turns it into a decision-ready proposal. The Product Lead reviews the result and is the only actor who may admit, merge, clarify, defer, or archive it.

**Planning status:** proposed decomposition; no product-code authority

**Production boundary:** staging first; production only after Gate 3

## 1. Product contract

The platform accepts incomplete language, spelling mistakes, uncertain framing, and solution-biased requests as normal input. It does not require the contributor to complete product-management fields.

The platform must:

1. preserve the original signal byte-for-byte;
2. produce a corrected, outcome-oriented proposal without changing the original;
3. distinguish verified facts, cited platform facts, inferences, assumptions, and unknowns;
4. recommend a disposition and priority with reasons and confidence;
5. identify material missing information and ask at most one essential clarification question at a time;
6. show the exact sources, revisions, generator identity, and Critic result used for the proposal;
7. keep every proposal advisory until an authenticated Product Lead rules;
8. allocate an STR key only after backlog admission; and
9. invalidate or supersede a proposal when its signal or evidence changes.

The human contributor's responsibility ends after submitting the signal unless Platform AI identifies a material ambiguity that no authorized source can resolve. The Product Lead's responsibility is to review the prepared proposal and record a decision, not to author the analysis from scratch.

## 2. Lifecycle

```text
CAPTURED
  -> PROCESSING
  -> READY_FOR_PRODUCT_LEAD
  -> ADMITTED | MERGED | CLARIFICATION_REQUIRED | ARCHIVED | NO_NEW_WORK

PROCESSING
  -> SAFE_FAILURE
  -> RETRYING | HUMAN_ATTENTION_REQUIRED

READY_FOR_PRODUCT_LEAD
  -> STALE
  -> PROCESSING
```

- `CAPTURED` stores the immutable original signal and submitter context.
- `PROCESSING` is visible and never creates a placeholder STR work item.
- `READY_FOR_PRODUCT_LEAD` requires a schema-valid proposal, provenance, confidence, unknowns, and Critic disposition.
- `ADMITTED` atomically creates the authoritative STR work item from the exact reviewed proposal and records the Product Lead ruling.
- `MERGED`, `ARCHIVED`, and `NO_NEW_WORK` retain the signal and reasoning without creating delivery work.
- `CLARIFICATION_REQUIRED` contains one material question and explains why the answer changes the decision.
- `SAFE_FAILURE` exposes a retryable, non-fabricated state; rule-based template values must not masquerade as model analysis.

## 3. Decision-ready proposal contract

Every ready proposal contains:

- corrected title and concise problem statement;
- named beneficiary and affected situation;
- expected observable outcome and initial measurement approach;
- urgency and a specific `why now` rationale;
- suggested scope, exclusions, and terminal condition;
- recommended work type, POD, agent-sized decomposition, dependencies, and next action;
- recommended `Now`, `Next`, `Later`, or `Hold` priority with confidence;
- alternatives, including doing nothing;
- security, privacy, accessibility, legal, reliability, money, and design-system risk signals;
- evidence needed before Gate 1 and evidence already found;
- related open work, completed capability, or duplicate candidates with resolvable references;
- delivery range and its basis when a defensible forecast is available;
- readiness result and the exact blockers when not ready;
- explicit facts, inferences, assumptions, and unknowns;
- generator provider/model, prompt-contract version, implementation revision, input revisions, timestamps, cost/usage, and output digest; and
- independent Critic recommendation, findings, and exact reviewed digest.

## 4. Trust and authority controls

### Source discipline

- The original signal is immutable and content-addressed.
- Internal work-item facts cite authoritative record IDs and revisions.
- External claims require an allowed, resolvable source; search snippets and model output are never systems of record.
- Unverified evidence is labeled and cannot become a verified fact through repetition.
- Sensitive or prohibited content is rejected or redacted before model submission and before persistence.

### Model discipline

- The generator receives a bounded, versioned input envelope and returns a strict schema.
- The response is validated for size, field allowlists, citations, unsupported claims, and prohibited content.
- Facts without resolvable provenance are downgraded to inference or assumption.
- Provider timeout, malformed output, policy failure, or unavailable credentials produces `SAFE_FAILURE`; it never silently falls back to invented content.
- A separate Critic evaluates the frozen proposal and input manifest.

### Human authority

- Contributors and agents may submit signals.
- Platform AI may propose, compare, and recommend.
- Only an authenticated Product Lead may admit, merge, archive, or record `NO_NEW_WORK`.
- Admission binds the human decision to the exact proposal digest and creates an immutable audit event.
- Admission does not approve Gate 1, dispatch an agent, merge code, deploy, or authorize external action.

## 5. Agent-sized delivery slices

### Slice A — Governed signal and proposal foundation

**Observable outcome:** A contributor submits one free-text signal and sees its immutable original, processing status, and eventual governed proposal record; no STR key is created.

In scope:

- `signals`, `signal_events`, `signal_proposals`, and proposal-input manifest persistence;
- immutable original text plus SHA-256 digest;
- lifecycle transitions, idempotent submission, POD scoping, retention metadata, and append-only audit events;
- one-prompt intake UI with processing, safe-failure, retry, permission, and narrow-screen states;
- a provider-neutral generator interface and deterministic test double;
- no production model call until the provider secret and privacy boundary are approved.

Terminal condition: a persisted signal can move from `CAPTURED` to a schema-valid proposed packet or explicit `SAFE_FAILURE`, with no authoritative STR record created.

### Slice B — Evidence-grounded AI proposal

**Observable outcome:** Platform AI converts the signal into the complete decision-ready proposal contract using authorized internal sources and records full provenance.

In scope:

- production model adapter with versioned prompt/output schema;
- internal backlog, completed-work, work-economics, capacity, and dependency context retrieval;
- facts/inferences/assumptions/unknowns classification;
- bounded duplicate/related-work candidate ranking;
- redaction, content policy, provider timeout, retry budget, token/cost ceiling, and telemetry;
- independent Critic pass over the frozen proposal digest.

Terminal condition: a normal signal reaches `READY_FOR_PRODUCT_LEAD`, or the system exposes one material clarification question or a safe failure with no fabricated fields.

### Slice C — Product Lead decision and atomic admission

**Observable outcome:** The Product Lead reviews the proposal in under two minutes and records one governed disposition.

In scope:

- answer-first Product Lead Decision Packet UI;
- editable AI proposal with visible change tracking;
- admit, merge, clarify, archive, and no-new-work rulings;
- exact-digest decision binding, optimistic concurrency, authorization, and audit trail;
- atomic STR creation only on `ADMITTED`;
- delivery treatment assigned by policy, never by the ordinary contributor;
- no automatic Gate 1 approval or agent dispatch.

Terminal condition: each ruling is durable, attributable, and tied to the exact proposal; only admission creates one STR work item.

### Slice D — Learning, quality, and prioritization calibration

**Observable outcome:** The platform measures whether AI preparation reduces Product Lead effort without increasing unsupported claims or poor admissions.

In scope:

- time-to-ready, Product Lead active minutes, edit distance, disposition, clarification frequency, duplicate precision, unsupported-claim escapes, and cost;
- proposal-quality sampling and outcome feedback;
- model/prompt version comparison under a frozen rubric;
- dashboard/readout for the documented measures.

Terminal condition: the Product Lead can see quality, effort, safety, and cost for a frozen observation cohort.

## 6. First build target

The first build target combines the smallest user-visible path from Slice A with the schema-validation boundary required by Slice B:

1. Replace the current multi-field creation form with one primary signal field and a public-data warning.
2. Persist the exact original signal as a non-STR record.
3. Show `Processing` immediately from the authoritative response.
4. Run the generator behind a provider-neutral contract.
5. Persist and display either a schema-valid draft packet or explicit safe failure.
6. Display provenance, assumptions, unknowns, confidence, and readiness.
7. Prevent admission, Gate movement, assignment, or dispatch in this first target.

This target proves the essential promise—imperfect signal in, reviewable analysis out—without combining backlog admission, duplicate mutation, agent dispatch, or Gate approval into the same implementation.

## 7. First-target acceptance manifest

1. A human POD member can submit a 10–4,000 character free-text signal with spelling or grammar errors and no other product-management fields.
2. The authoritative response returns the stored original, digest, lifecycle state, and signal identifier; repeated idempotent submission does not duplicate the signal.
3. The original text cannot be updated or deleted through application endpoints.
4. No submission or generation path inserts a `work_items` row or allocates an STR key.
5. The generated packet conforms to the closed schema and visibly separates facts, inferences, assumptions, and unknowns.
6. Every asserted fact contains a resolvable provenance entry or is rejected/downgraded before persistence.
7. The packet records generator identity/version, input digest, output digest, timestamps, usage/cost when available, and implementation revision.
8. A changed signal is a new immutable signal; changed evidence creates a superseding proposal and marks the prior proposal stale.
9. Timeout, provider error, malformed output, missing credential, policy rejection, and budget exhaustion each produce a visible safe-failure state with a bounded retry path.
10. Secrets and prohibited data patterns are blocked before the provider call and are not persisted in provider payload audit fields.
11. Cross-POD reads and writes fail closed; only enrolled humans and agents may submit within their POD.
12. Keyboard, screen-reader, focus, loading, error, conflict, retry, empty, and narrow-screen states pass the accessibility contract.
13. Success/failure, latency, tokens, estimated cost, retries, safety rejection, and proposal-validation outcomes are emitted without signal content or personal data.
14. Existing work-item creation, decisions, reviews, dispatch, completed history, staging data, and production data remain unchanged.

## 8. Technical shape

### Persistence

- `signals`: identity, POD, submitter, immutable original, digest, classification, retention, lifecycle, timestamps.
- `signal_events`: append-only lifecycle and authority events.
- `signal_proposals`: versioned proposal JSON, schema version, input/output digests, confidence, readiness, generator metadata, Critic binding, state, timestamps.
- `signal_sources`: proposal-scoped source references, type, authoritative revision, digest, verification state, retrieval time.
- `signal_generation_attempts`: provider/model, prompt version, start/end, outcome, usage/cost, retry number, error code; never raw secret or prohibited content.

SQLite triggers protect immutable originals and append-only events. Logical declarations remain in the existing Sites project; migrations are staging-first and require rollback evidence.

### API

- `POST /api/signals` — capture immutable signal with idempotency key.
- `GET /api/signals/:id` — POD-scoped authoritative signal, proposal, sources, and events.
- `POST /api/signals/:id/generate` — start or idempotently replay bounded generation.
- `POST /api/signals/:id/retry` — retry only a retryable safe failure within policy limits.
- Later Slice C endpoints record Product Lead dispositions and perform atomic admission.

### UI

- Signal intake modal: one primary textarea, public-data warning, submit.
- Signal workspace: original signal, processing/failure status, answer-first proposal, confidence, evidence, assumptions/unknowns, and provenance drawer.
- The initial target contains no admission button; it explicitly says Product Lead admission arrives in Slice C.

## 9. Verification strategy

- Unit tests: normalization contract, schema, provenance downgrade, redaction, digests, lifecycle, idempotency, retry budget.
- API tests: authorization, POD isolation, immutability triggers, no-STR invariant, concurrency, provider failures, content limits.
- Integration tests: captured -> processing -> ready and every safe-failure branch using a deterministic provider double.
- Accessibility: automated axe plus agent-operated keyboard and screen-reader matrix on intake and proposal workspace.
- Security/privacy: hostile text, prompt injection, secrets, prohibited-data patterns, oversized payloads, source injection, error/log redaction.
- Reliability: bounded latency, retry/backoff, cost ceiling, telemetry, rollback, and in-flight generation behavior.
- Regression: existing work-item, Gate, decision, review, dispatch, backlog, and history suites remain green.
- Independent verification: Test evidence followed by a fresh-context Critic against the frozen Brief, Exam, implementation, migration, and staging evidence.

## 10. Release sequence

1. Approve the agent-ready admission contract dependency or record a narrow ruling that this first target is permitted without changing backlog-admission policy.
2. Admit the first target as one bounded Delivery Work Item and record its assigned workflow.
3. Freeze and approve its Intent Brief at Gate 1.
4. Freeze and approve its Exam at Gate 2 in a different session.
5. Implement on a dedicated branch; do not change production.
6. Build and migrate the single canonical staging environment.
7. Run the full acceptance manifest, accessibility, security/privacy, rollback, regression, Test, and Critic checks.
8. Product Lead reviews the working staging experience and exact evidence at Gate 3.
9. Merge and deploy the exact approved revision to the single production environment.
10. Verify production, record Release, Observe the frozen cohort, and close or create bounded follow-up items from new findings.

## 11. Explicit non-goals for the first target

- automatic STR admission;
- automatic Gate approval;
- automatic agent assignment or dispatch;
- mutation or merging of existing work items;
- unrestricted web research;
- external communications or actions;
- accepting CUI, FCI, classified, export-controlled, proprietary proposal, credential, or other prohibited data;
- replacing human Product Lead authority; or
- redesigning the entire work-item taxonomy under one delivery item.

## 12. Decisions required before implementation

1. Product Lead confirms the first build target is the highest-priority bounded child of issue #54.
2. Product Lead/Tech Lead resolve the recorded dependency on issue #53/#62: approve the required contract first, or issue a narrow ruling permitting only non-admitting signal/proposal work.
3. The approved Brief names the model/provider boundary, data policy, cost ceiling, timeout, and retention.
4. Gate 1 and Gate 2 bind the exact Brief and Exam revisions before product code changes.
