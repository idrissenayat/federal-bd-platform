# Intent Brief — Issue 70 Governed signal-to-decision proposal

**Status:** draft

**Parent initiative:** GitHub issue #54

**Delivery candidate:** GitHub issue #70

**Tags:** #security #privacy #a11y #legal #reliability #design-system #money

**Date opened:** 2026-08-19

## Expected outcome and measurement

- Primary outcome: a human POD member can submit one imperfect free-text signal and receive a governed, evidence-labeled, decision-ready proposal or an explicit safe failure without authoring product-management fields.
- Baseline / denominator: the current creation form requires title, description, phase, priority, workflow, work type, assignee, next action, and optional engineering record; it creates an STR work item immediately and produces no server-side evidence-grounded proposal from the signal.
- Observation window: the first 20 frozen staging submissions covering normal, vague, misspelled, solution-biased, duplicate-looking, hostile, sensitive, and provider-failure inputs.
- Minimum meaningful signal: at least 18 of 20 eligible staging submissions reach a schema-valid proposal or the exact expected safe outcome within 60 seconds, with every expected field classified and every asserted fact bound to resolvable provenance.
- Guardrail measure: zero STR/work-item rows created; zero unsupported statements persisted as facts; zero cross-POD disclosure; zero secret or prohibited-data content sent to the model; zero automatic human-authority decisions.

## Who this is for

A human contributor who notices a problem or opportunity but does not know the product taxonomy, delivery process, correct priority, dependencies, acceptance criteria, or polished wording. The immediate downstream reader is a Product Lead who needs an answer-first, trustworthy proposal rather than an incomplete ticket.

## Problem and why now

The current interface treats imperfect contributor input as a work item and asks the contributor to perform Product Lead analysis. Client-side templates then produce low-confidence Value Hypothesis and Delivery Forecast records that can appear more authoritative than their inputs justify. The result is backlog noise, hidden assumptions, and repeated human effort before prioritization.

Issue #54 already records the broader signal-intake mission. Issue #53 and issue #62 record the need for explicit admission and agent-ready contracts. This candidate is deliberately narrower: it proves immutable signal capture and trustworthy proposal generation without changing admission policy or creating delivery work. It is the first necessary product slice because Product Lead decision quality cannot improve until the platform produces a reviewable proposal.

## What "done and correct" means

1. One free-text field accepts an imperfect 10–4,000 character public-data signal; no product-management field is required from the contributor.
2. The exact original is stored immutably with a SHA-256 digest, POD, submitter, retention metadata, lifecycle state, and append-only events.
3. The authoritative response immediately exposes the stored signal ID and processing state; idempotent replay cannot create a duplicate.
4. Signal capture or proposal generation never creates, updates, admits, assigns, gates, prioritizes, or dispatches an STR work item.
5. A bounded server-side generator returns a strict, versioned proposal containing corrected title/problem, beneficiary, outcome, urgency, scope, exclusions, terminal condition, priority recommendation, alternatives, dependencies, risks, evidence needs, readiness, confidence, and explicit facts/inferences/assumptions/unknowns.
6. Each asserted fact has a proposal-scoped source record with an authoritative reference, revision/digest, verification state, and retrieval time. Unresolvable claims are rejected or downgraded before persistence.
7. Each attempt records provider, model, prompt-contract version, implementation revision, input/output digests, timestamps, retry number, outcome, token usage, and cost when available without recording secrets or prohibited content.
8. A changed source creates a superseding proposal and makes the earlier proposal visibly stale; the original signal never changes.
9. Missing credentials, timeout, provider failure, malformed output, policy rejection, validation failure, and cost-budget exhaustion fail closed into a visible safe state with a bounded, idempotent retry path.
10. Secret and prohibited-data detection occurs before persistence of provider payload metadata and before any provider call; rejection preserves only the minimum safe audit facts.
11. All reads, writes, generation attempts, and retries are POD-scoped and require enrolled platform identity.
12. Intake and proposal surfaces are keyboard-operable, screen-reader understandable, focus-safe, WCAG AA, narrow-screen usable, and complete for empty, processing, ready, stale, conflict, permission, failure, and retry states.
13. The feature emits content-free success/failure, latency, retry, validation, safety, tokens, and estimated-cost telemetry.
14. Existing work-item creation, history, economics, decisions, reviews, dispatch, and completed-work behavior remain unchanged.

## Design intent

The existing site navigation and design system remain unchanged. “Create work item” becomes “Submit a signal” on the primary backlog entry surface.

The intake modal contains one prominent textarea labeled “What did you notice, need, or want to improve?”, a plain-language public-data warning, and one submit action. It does not expose phase, priority, workflow, work type, assignee, next action, or engineering-record fields.

After submission, a signal workspace opens on the authoritative record. The first viewport shows the original signal and a clear Processing, Ready, Stale, or Needs attention status. A ready proposal leads with the recommended disposition/priority, outcome, confidence, and readiness; evidence, assumptions, unknowns, risks, and provenance follow in expandable sections. Facts and AI judgments use text labels in addition to color.

The first target contains no admission or Gate button. Copy explicitly states that the proposal is advisory and that backlog admission will be implemented as a separately governed slice. Focus moves to the signal-workspace heading after submission, remains trapped in modal dialogs, and returns to the opener when a modal closes.

## Out of scope

- Product Lead admission, merge, archive, clarification, or no-new-work rulings.
- STR key allocation or authoritative work-item mutation from a signal.
- Automatic Gate approval, priority change, assignment, agent claim, or dispatch.
- Unrestricted web research, external communications, or external actions.
- Automatic mutation or merging of duplicate work.
- Work-item taxonomy redesign or Control/STEER treatment policy.
- CUI, FCI, classified, export-controlled, proprietary proposal, credential, health, financial, or other prohibited/sensitive input.
- Production deployment before Gate 3.

## Risks and default-closed touchpoints

This work adds free-text persistence, a new set of authenticated endpoints, new SQLite tables/triggers, a server-side model-provider call, usage/cost tracking, and a UI flow. It is default-closed because it changes stored data and can transmit user-provided text to a provider.

Threat model: a submitter may attempt prompt injection, cross-POD reference injection, source spoofing, secret exfiltration, oversized input, retry amplification, cost exhaustion, malicious markup, or generation of an unsupported claim. A provider or network failure may return partial, malformed, stale, or repeated output. Controls are strict input/output schemas, pre-provider sensitive-data screening, POD-scoped source retrieval, allowlisted source types, content escaping, immutable digests, idempotency, optimistic concurrency, timeout/retry/cost limits, content-free logging, append-only audit events, and fail-closed states. No proposal is authoritative work and no generated statement is a verified fact without resolvable provenance.

Privacy boundary: MVP accepts only public, unclassified work signals. The stored signal is retained for 90 days after terminal disposition unless a legal hold applies; provider-managed recovery copies may remain only for the configured recovery window, no longer than 30 days. Provider payloads are not stored separately from the governed signal; logs and telemetry contain identifiers and measures, not signal text. Deletion and recovery policy must reuse the active platform privacy ruling before Gate 3.

Cost boundary: one initial attempt and at most one user-requested retry per signal; the configured per-attempt input, output, and estimated-cost ceilings fail closed. The exact provider/model and numeric ceilings are runtime policy recorded in every attempt and frozen in the Exam before Gate 2.

## Chosen approach

Use the existing Sites/Worker/D1 application with a provider-neutral server-side generator contract, a deterministic test double, and one configured staging model adapter. Store immutable signals separately from `work_items`; validate a strict proposal schema and provenance manifest before persistence; present safe failure rather than template content when generation is unavailable.

Rejected alternatives: extending the current client-side Value Hypothesis templates would preserve unsupported precision; immediately creating an STR and enriching it later would preserve backlog noise; combining Product Lead admission and dispatch in this target would violate the agent-sized boundary and enlarge authority risk.

---

GATE 1:

GATE 1 EVIDENCE:
