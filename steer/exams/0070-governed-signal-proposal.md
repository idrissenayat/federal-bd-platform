# Exam — Issue 70 Governed signal-to-decision proposal

**Brief:** `steer/briefs/0070-governed-signal-proposal.md`

**Guardrails in force:** CORE-01..11, SEC-01..05, PRIV-01..03, A11Y-01..03, REL-01..04, LEGAL-01..02, DES-01..02, SRC-01..04, REV-01..02, AI-01..03, HUM-01..02, DATA-01..02, EXT-01

## Frozen runtime policy

- Staging provider/model: OpenAI Responses API, exact model `gpt-5.6-luna`
- Request policy: `reasoning.effort: low`, standard service tier, no model tools, no web search, and `store: false`
- Prompt-contract/schema version: `signal-proposal-v1`
- Maximum signal length: 4,000 characters
- Maximum provider input: 12,000 tokens, enforced before the request
- Maximum provider output: 4,000 tokens, including reasoning and visible output
- Maximum estimated cost per attempt: USD 0.10; the request is rejected before provider invocation when the configured price calculation exceeds the ceiling
- Provider timeout: 45 seconds
- Automatic retries: zero
- Human-requested retries: one per immutable signal
- Terminal signal retention: 90 days unless legal hold applies
- Provider recovery window: no more than 30 days under the active privacy ruling
- p95 capture response: at most 750 ms, excluding generation
- p95 proposal completion: at most 60 seconds for eligible staging cases

The amended model choice uses the cost-sensitive GPT-5.6 tier for this bounded, schema-constrained workload and preserves the same quality and safety acceptance threshold rather than lowering it. Official OpenAI documentation identifies `gpt-5.6-luna` as optimized for cost-sensitive workloads, confirms Responses API and Structured Outputs support, and lists standard short-context pricing of USD 0.20 per million input tokens and USD 1.20 per million output tokens as of 2026-08-19. The 12,000/4,000 token caps imply a nominal maximum of USD 0.0072 before any applicable regional uplift, leaving headroom under the unchanged USD 0.10 ceiling. Source: [GPT-5.6 Luna model contract](https://developers.openai.com/api/docs/models/gpt-5.6-luna).

## Acceptance tests

1. Given an enrolled human POD member submits a 10–4,000 character imperfect public-data signal, when capture succeeds, then the response and signal workspace contain the exact original text, signal ID, SHA-256 digest, submitter/POD, `CAPTURED` or `PROCESSING` state, retention metadata, and first append-only event without requiring any product-management field.
2. Given the same POD, actor, idempotency key, and body are replayed, when capture repeats, then the existing signal is returned and exactly one signal row and one initial event exist; given the key is reused with different bytes, the request fails with a conflict and neither version is overwritten.
3. Given any capture, generation, retry, stale-source, or failure path, when database effects are compared, then no `work_items`, decisions, reviews, dispatch, economics, or Gate row is inserted or updated and no STR key is allocated.
4. Given a normal eligible signal and deterministic provider output, when generation completes, then the persisted proposal validates against the exact v1 allowlist and contains every field named in Brief condition 5, with no additional provider-controlled keys.
5. Given proposed statements with valid, invalid, absent, cross-POD, stale, or mismatched sources, when validation runs, then only valid POD-scoped resolvable sources may support `fact`; other statements are rejected or stored as inference/assumption/unknown with the reason, and source revision/digest/retrieval metadata is preserved.
6. Given one completed attempt, when the audit record is read, then it contains provider/model, prompt/schema version, implementation revision, input/output digests, start/end, retry, outcome, usage/cost when available, and no credential, authorization header, raw provider payload, prohibited content, or signal text in telemetry/log fields.
7. Given a source revision changes after a ready proposal, when reconciliation runs, then the old proposal is marked `STALE`, a new proposal version references it as superseded, and the original signal row/digest remain unchanged.
8. Given each of missing credential, timeout, provider 4xx, provider 5xx, malformed JSON, unknown field, missing required field, invalid citation, policy rejection, and budget exhaustion, when generation runs, then it produces the named visible safe-failure code, no fabricated proposal, no work-item effect, and no automatic retry.
9. Given a retryable safe failure, when one authorized retry is requested twice concurrently or replayed, then at most one new attempt is created and both callers reconcile to it; a second distinct retry request fails closed at the retry limit.
10. Given a signal containing enrolled secret patterns, prohibited-data indicators, prompt-injection instructions, markup/script payloads, or oversized content, when submitted or generated, then the exact policy outcome occurs before a provider call, rendered content remains inert, and only minimum content-free audit metadata persists for rejected input.
11. Given identities from another POD, unenrolled identities, agents, humans, and role changes, when signal endpoints are exercised, then POD reads/writes fail closed, unenrolled access is denied, enrolled human/agent capture follows policy, and no actor can obtain Product Lead admission authority through these endpoints.
12. Given intake and signal workspaces in every specified state, when automated axe plus agent-operated keyboard, focus, screen-reader, contrast, and 320 px narrow-screen checks run, then all controls are named/operable, focus movement/restoration is predictable, status changes are announced once, content order remains understandable, and no WCAG AA violation is found.
13. Given success, validation failure, safety rejection, provider failure, retry, and completion cases, when telemetry is queried, then content-free counters/histograms record outcome, latency, retries, validation, safety, tokens, and estimated cost with bounded labels and no signal text or person-level content.
14. Given the exact target commit, when the complete existing and new suites run and staging is compared with the pre-migration snapshot, then work-item creation, backlog/history, economics, decision, review, dispatch, completed-work, staging data, and production data invariants remain unchanged.

## Edge cases and attacks

- Unicode normalization, emoji, right-to-left text, whitespace-only content, repeated punctuation, spelling errors, grammar errors, and solution-only statements.
- Concurrent capture with the same and different idempotency keys.
- Prompt instructions that attempt to reveal system text, source records, other POD data, environment values, credentials, or provider responses.
- A model that cites nonexistent work, turns an assumption into a fact, returns HTML/script, exceeds bounds, or produces semantically contradictory fields.
- A source that changes during generation or disappears before persistence.
- Provider completion after the request timed out; late results must not overwrite a terminal/superseded attempt.
- Deployment rollback while one generation is in flight; restored code must fail closed or reconcile without duplicate proposal versions.
- Exhausted cost budget and repeated retry clicks.
- Stale browser response after a newer proposal version becomes authoritative.
- Database-level attempt to update the original signal or mutate/delete an append-only event.

## Non-functional checks

- Capture p95 is no more than 750 ms across 20 staging cases; eligible proposal completion p95 is no more than 60 seconds.
- Request body, persisted JSON, source count, statement count, string length, retry, label-cardinality, and model-cost limits are enforced server-side.
- New dependencies have compatible licenses and no critical vulnerability; provider/model use is isolated behind the generator contract.
- Migration rollback is demonstrated from the exact staging target with before/during/after hashes of existing tables and an in-flight generation case.
- Production source, deployment, and D1 remain unchanged until exact Gate 3 authorization.

## Outcome instrumentation

- `steer_signal_capture_total{outcome}` and `steer_signal_capture_latency_ms`.
- `steer_signal_generation_total{outcome}` and `steer_signal_generation_latency_ms`.
- `steer_signal_validation_total{outcome}` and `steer_signal_safety_rejection_total{reason_code}`.
- `steer_signal_retry_total{outcome}`.
- `steer_signal_provider_tokens_total{direction}` and `steer_signal_provider_estimated_cost_micros_total`.
- `steer_signal_unsupported_fact_total` must remain zero for the frozen staging cohort.
- `steer_signal_work_item_side_effect_total` must remain zero.
- The frozen 20-case ledger records input class, expected/actual state, attempt ID, proposal/source digests, timing, usage/cost, telemetry deltas, database projections, and pass/fail oracle without storing signal text in telemetry.

## Human judgment checklist (Evaluate)

The Test and Critic agents perform the interaction, accessibility, safety, and evidence checks. The Product Lead confirms their exact-target result rather than manually repeating the tests.

- [ ] The agent-tested proposal reads like useful decision preparation, not a polished restatement of the contributor's sentence.
- [ ] Facts, AI judgments, assumptions, unknowns, confidence, and sources are understandable without technical knowledge.
- [ ] The experience clearly stops before admission, Gate approval, assignment, or dispatch.
- [ ] Safe failure is honest and actionable; it never displays template content as completed AI analysis.
- [ ] The exact staging evidence supports the Brief outcome and guardrails.

---

GATE 2: APPROVED — 2026-08-19T14:08:11Z — idrissenayat

GATE 2 EVIDENCE: Tech Lead/solo operator approval [PR #71 comment](https://github.com/idrissenayat/federal-bd-platform/pull/71#issuecomment-5343303386), bound to pre-signature commit `d394941439fe90ceca64a2c1e1f914612da88c83` and Exam SHA-256 `33346e7308706a25c0c6a208a12904551f9b3ef0b21df08da71bb1d841ec7375`.

MODEL AMENDMENT AUTHORIZATION: APPROVED — 2026-08-19T14:41:02Z — idrissenayat

MODEL AMENDMENT SCOPE: Replace only the frozen provider model from `gpt-5.6-terra` to `gpt-5.6-luna`; preserve every other Gate 2 control and rerun the complete approved Exam. The amended Exam requires an exact revision and SHA-256 binding before staging deployment.

AMENDED GATE 2: APPROVED — 2026-08-19T14:47:22Z — idrissenayat

AMENDED GATE 2 EVIDENCE: Product Lead approval [PR #71 comment](https://github.com/idrissenayat/federal-bd-platform/pull/71#issuecomment-5343795115), bound to pre-signature commit `482a56abf5ecc262428d02613726a5c9f2c04d0d` and Exam SHA-256 `66a959826d327f8f4e7f69a95e438c93a76f48e45a9babc49b02708f3cfe98d5`.

GATE 3:

GATE 3 EVIDENCE:
