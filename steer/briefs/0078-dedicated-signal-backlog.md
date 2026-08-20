# Intent Brief — Issue 78 Dedicated Signal Backlog

**Status:** draft — Gate 1 pending

**Parent initiative:** GitHub issue #54

**Delivery candidate:** GitHub issue #78

**Depends on:** issue #70 release target `d1e3c60b1059a617a2a4a71a1f01b9f9d11c016e`, evidence revision `891e0f43b8ec55f554c062833d306a7897db1f51`, and independent Critic PASS `1e402889b863f163ee2e3dfdef81e9a5e4fa9146`; issue #77 implementation `bfb2178cfee32d3667c7a188209f4c7d83db5d65` and evidence `ec5cfddb4f903d11c42bffec64da30b9f66768c2` must be reconciled before staging.

**Tags:** #a11y #privacy #security #reliability #design-system

**Date opened:** 2026-08-20

## Expected outcome and measurement

- Primary outcome: an enrolled POD member can open one dedicated Signal Backlog and find every retained signal they are authorized to see, with an honest server-authored lifecycle group, without mistaking any signal for admitted delivery work.
- Baseline / denominator: the current bootstrap response returns only the newest 20 POD signals and the Product Backlog renders only the first eight of that partial set under “Recent contributor signals.” There is no dedicated signal route, complete register, search, lifecycle filter, authoritative group count, or continuation control.
- Observation window: a frozen owner-only staging dataset containing at least 31 signals so the verification crosses both the current 8-row UI truncation and 20-row API truncation boundaries, including every existing lifecycle state.
- Minimum meaningful signal: 100% of retained in-scope signals are discoverable exactly once through bounded pagination; server counts equal authoritative D1 counts for every lifecycle group; a newly captured signal becomes discoverable without creating a work item.
- Guardrails: zero `work_items` creation or mutation; zero STR key allocation; zero Product Backlog, WIP, decision, forecast, Gate, assignment, dispatch, or economics count changes caused by signal listing; zero cross-POD disclosure; zero signal-content telemetry.

## Who this is for

The primary user is a human contributor who needs confidence that an imperfect signal was captured and has not disappeared. The downstream user is the Product Lead who needs a trustworthy queue of signals prepared for later review, without asking contributors to create or prioritize work items.

## Problem and why now

Issue #70 established immutable signal capture, governed AI proposal generation, safe failure, retry, provenance, and a signal workspace. Its current UI embeds a partial “Recent contributor signals” list inside Product Backlog. That presentation hides older signals, mixes pre-admission input with delivery work, and cannot support a real signal-handling workflow.

The platform needs a separate system-of-record view before it adds duplicate analysis or Product Lead rulings. Otherwise later automation would operate on a queue that humans cannot completely inspect or reconcile. This candidate is intentionally the smallest next slice: make the signal population complete, navigable, and semantically separate before adding new AI judgment or human disposition authority.

## What “done and correct” means

1. The primary navigation contains a dedicated **Signal Backlog** destination. Product Backlog contains admitted work items only.
2. The Signal Backlog reads a POD-scoped server endpoint that returns a bounded page, an opaque continuation cursor, server-authored lifecycle presentation group, and authoritative counts generated from the same access scope.
3. Every retained, authorized signal can be discovered exactly once by following continuation cursors; the UI does not impose a hidden first-8, first-20, or other incomplete client subset.
4. The default order is stable and deterministic: newest `created_at` first, with `signal_id` as the tie-breaker. Pagination cannot skip or duplicate a record when multiple signals share a timestamp.
5. The server maps the existing issue #70 lifecycle states into presentation groups without changing lifecycle authority: `CAPTURED` is **New**, `PROCESSING` is **Screening**, `READY` is **Ready for review**, and `STALE` or `SAFE_FAILURE` is **Needs attention**. Raw lifecycle state remains available and visible.
6. Search is a server-side, POD-scoped match over the allowed signal identifier and original signal text. Lifecycle/group filters and result counts are server-authoritative, composable, and reflected in the accessible UI.
7. Refresh and pagination preserve the active query. Loading, empty, no-match, permission, malformed-cursor, stale-response, network-failure, and retry states are explicit; cached or partial data is never labeled complete.
8. Opening a row reuses the issue #70 signal workspace and exposes the immutable original, proposal state, provenance, attempts, events, safe failure, retry, and stale evidence already authorized there.
9. Submitting a signal reuses the issue #70 one-field intake and returns the user to the authoritative new signal/workspace. The signal becomes discoverable in the Signal Backlog after refresh without inserting or mutating a `work_items` row.
10. Signal counts and rows do not contribute to Product Backlog totals, WIP, Human Decisions, pull forecast, delivery economics, Gate state, assignment, dispatch, or completed-work reporting.
11. All reads require an enrolled identity and enforce the active POD scope on the server. Client-supplied POD, lifecycle label, count, or cursor content cannot widen authority.
12. The endpoint and UI emit only content-free operational telemetry for request outcome, page size, filter type, pagination, latency, and error class. Signal text, search text, personal data, and proposal content are excluded from logs and telemetry.
13. Navigation, filters, list/table semantics, pagination, refresh, rows, status labels, empty/error messages, and the reused workspace are keyboard-operable, screen-reader understandable, focus-safe, WCAG AA, usable at 320 CSS pixels and true 200% browser zoom, and do not rely on color alone.
14. Existing signal capture/generation, work-item, history, economics, decisions, reviews, dispatch, completed-work, issue #77 fixture-isolation, staging data, and production data remain unchanged except for the bounded read endpoint and presentation required here.

## Design intent

Add **Signal Backlog** as a first-class primary navigation item near Product Backlog. The page heading explains: “Signals are observations and requests awaiting platform screening. They are not delivery work until a governed admission creates a work item.”

The first viewport provides an answer-first summary with total signals and counts for **New**, **Screening**, **Ready for review**, and **Needs attention**. Counts are buttons or links that apply the corresponding server filter and expose an accessible selected state. A search field accepts a signal ID or ordinary words from the original signal. Search applies explicitly, can be cleared, and never performs an unbounded request per keystroke.

The result list leads with lifecycle group, a safely truncated plain-text excerpt, submitted time, proposal version, and attention reason where applicable. Every row is one keyboard-focusable action that opens the existing signal workspace. The full original remains in that workspace; the register does not expand arbitrary content into the page or render markup.

Use a bounded **Load more** continuation interaction for the first release. The page must announce appended result counts without moving focus unexpectedly. Refresh preserves the active filters and search and reports whether the complete current first page was refreshed. Product Backlog removes the embedded recent-signal panel and continues to show only work items.

## Authority and lifecycle boundary

This slice adds presentation and read authority, not workflow decision authority. The existing `signals.lifecycle_state` remains authoritative. Presentation groups are derived on the server and cannot be written by the client.

No action in the Signal Backlog may admit, prioritize, merge, archive, clarify, assign, Gate, dispatch, or create an STR. “Ready for review” means only that issue #70 has a schema-valid advisory proposal; it does not mean approved, admitted, or ready for delivery. Product Lead dispositions and atomic work-item admission require separately governed slices.

## Out of scope

- Semantic duplicate or related-work detection, similarity thresholds, cluster mutation, or automatic merging.
- Product Lead admit, merge, clarification, defer, archive, or no-new-work rulings.
- STR key allocation or any authoritative `work_items` mutation from a signal.
- Priority, work type, POD, workflow, Gate, owner, agent claim, or dispatch changes.
- Changes to the issue #70 model, prompt, proposal schema, provider call, retry/cost policy, retention period, deletion policy, privacy policy, or source retrieval.
- A new analytics dashboard or learning/calibration cohort.
- Production deployment before Gate 3.

## Risks and default-closed touchpoints

The principal risks are incomplete pagination, cross-POD disclosure, content leakage through search or telemetry, client-invented counts/state, misleading cached results, large-query denial of service, and accessibility regressions from the new navigation and queue controls.

Controls are server-enforced POD membership, opaque validated cursors, stable keyset pagination, bounded page/search limits, parameterized queries, server-derived groups/counts, plain-text rendering, explicit incomplete/error states, abort or sequence protection for stale client responses, content-free telemetry, and regression coverage for every existing signal and delivery authority boundary. Invalid filters or cursors fail closed with a typed response and do not silently fall back to a broader unfiltered query.

No new sensitive-data or provider boundary is introduced. The existing issue #70 public-data restriction, retention metadata, immutable original, privacy policy, and recovery controls remain authoritative and must not be weakened.

## Chosen approach

Extend the existing Sites/Worker/D1 application with one authenticated signal-list read contract and one dedicated page. Use keyset pagination over `(created_at, signal_id)`, server-side query/filter/count derivation, and the existing `signals` table and signal workspace. Remove only the partial signal register from Product Backlog; reuse the existing intake and workspace rather than duplicating them.

Rejected alternatives:

- Increasing `LIMIT 20` or changing `slice(0, 8)` would keep an incomplete, misleading register and would not separate signals from work.
- Loading every signal into bootstrap would create unbounded latency and payload growth.
- Client-side filtering would operate only on the fetched subset and produce false counts.
- Combining duplicate AI and Product Lead admission with this issue would enlarge authority and uncertainty beyond one agent-manageable slice.

## Delivery and verification boundary

The Gate 2 Exam must freeze the endpoint schema, cursor encoding/validation, allowed search grammar and length, page-size limits, lifecycle-to-group mapping, authoritative count semantics, accessibility state matrix, performance budgets, telemetry allowlist, test fixtures, rollback procedure, and exact reconciled base revisions.

Implementation is owner-only staging first. Verification must include at least 31 staged signals; same-timestamp pagination; all lifecycle groups; search/filter composition; new-capture discoverability; malformed/forged cursors; cross-POD reads; stale response ordering; network/retry/empty states; signal-workspace regression; keyboard, screen reader, contrast, 320-pixel, and true-200% coverage; full repository contract; protected-table before/after hashes; and rollback with an in-flight paginated view.

Production remains untouched until an independent Critic reviews the frozen Brief, Exam, implementation, staging runtime, hosted evidence, migration/non-migration boundary, and rollback evidence, and the Product Lead explicitly approves Gate 3, merge, production deployment, verification, Release, and closure.
