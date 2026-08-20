# Exam — Issue 78 Dedicated Signal Backlog

**Brief:** `steer/briefs/0078-dedicated-signal-backlog.md`

**Gate 1 authority:** pre-signature Brief revision `f6e309f344ab96084f524df6d54f4c031f6ceb54`, SHA-256 `45eba1fe5908cfebd1820b8ec5eacbf1c2e9066a134bd1a434d30dea6a77fd3b`

**Guardrails in force:** CORE-01..11, SEC-01..05, PRIV-01..03, A11Y-01..03, REL-01..04, LEGAL-01..02, DES-01..02, SRC-01..04, REV-01..02, HUM-01..02, DATA-01..02, EXT-01

**Status:** draft — Gate 2 pending

## Frozen delivery boundary

- This target adds one read-only Signal Backlog API contract, one dedicated Signal Backlog page, navigation, and the minimum additive index required for stable bounded reads.
- It reuses issue #70 signal capture, proposal generation, signal workspace, lifecycle, privacy, retention, provider/model, and telemetry controls without changing them.
- It removes the partial recent-signal panel from Product Backlog. Product Backlog remains a work-item-only view.
- It does not add semantic duplicate analysis, Product Lead disposition, STR admission, priority, assignment, Gate, dispatch, or any other signal write transition.
- The implementation target must contain issue #70 runtime revision `d1e3c60b1059a617a2a4a71a1f01b9f9d11c016e` and issue #77 runtime revision `bfb2178cfee32d3667c7a188209f4c7d83db5d65`. The staging evidence target must also preserve issue #70 evidence revision `891e0f43b8ec55f554c062833d306a7897db1f51`, Critic PASS revision `1e402889b863f163ee2e3dfdef81e9a5e4fa9146`, and issue #77 evidence revision `ec5cfddb4f903d11c42bffec64da30b9f66768c2` in its ancestry or a content-identical reconciled evidence manifest.
- Any reconciliation conflict is implementation work under this Exam and must receive focused regression evidence; it may not silently choose one predecessor behavior.
- Owner-only staging is the only deployment authorized by Gate 2. Production source, environment, deployment, data, and hosting binding remain unchanged until Gate 3.

## Frozen API contract

### Request

`GET /api/signals?limit=<n>&cursor=<opaque>&group=<group>&q=<literal>`

- Authentication: the existing enrolled platform identity is required. The server derives the active POD from enrolled membership; no POD request parameter is accepted.
- `limit`: optional decimal integer; default 25, minimum 1, maximum 50. Repeated, signed, fractional, empty, or out-of-range values return `400 INVALID_SIGNAL_PAGE_LIMIT`.
- `group`: optional and exactly one of `ALL`, `NEW`, `SCREENING`, `READY_FOR_REVIEW`, or `NEEDS_ATTENTION`; default `ALL`. Unknown, repeated, or empty values return `400 INVALID_SIGNAL_GROUP`.
- `q`: optional after Unicode NFKC normalization and outer-whitespace trim; 1–100 Unicode scalar values when present. It is a literal ASCII-case-insensitive substring over `signal_id` or `original_text`; SQL wildcard characters are escaped and have no wildcard meaning. Empty-after-trim, repeated, oversized, control-character, or NUL-containing values return `400 INVALID_SIGNAL_QUERY`.
- `cursor`: optional opaque base64url canonical-JSON v1 payload containing only `v`, `snapshot_at`, `last_created_at`, `last_signal_id`, and `query_sha256`. Maximum encoded length is 1,024 bytes. Unknown keys/version, invalid base64/JSON/types/timestamps/identifier, or a query digest that does not match the normalized `group`, `q`, and `limit` return `400 INVALID_SIGNAL_CURSOR`.
- The cursor is a position token, not an authority token. Every cursor request repeats enrolled-membership and POD enforcement. A syntactically valid altered position may change only the position inside the caller's authorized frozen result; it cannot change POD, query, group, page size, or snapshot.
- Unknown query parameters fail with `400 INVALID_SIGNAL_LIST_PARAMETER`; they are not ignored.

### Read snapshot, ordering, and pagination

- The first request freezes server `snapshot_at`. All item and count queries include `created_at <= snapshot_at`. Continuation cursors preserve that exact snapshot until refresh or a new query starts.
- Results order by `created_at DESC, signal_id DESC`.
- Continuation uses the strict keyset predicate `created_at < last_created_at OR (created_at = last_created_at AND signal_id < last_signal_id)` inside the same POD, snapshot, group, and literal-search boundary.
- The server fetches at most `limit + 1` rows, returns at most `limit`, and derives `has_more`/`next_cursor` from the extra row. It never uses offset pagination.
- Counts and page rows are read in one D1 batch/read boundary. Counts apply to the frozen POD/snapshot and normalized `q` and ignore the selected `group`. `total` equals the sum of the four presentation-group counts. Changing a group starts a new first-page snapshot; continuation preserves the snapshot and counts returned for its originating query.
- Refresh discards the old snapshot/cursor and starts a new authoritative first page while preserving the visible `group`, `q`, and `limit` inputs.

### Server-authored presentation mapping

| Raw lifecycle state | Presentation group | Visible label | Attention reason |
|---|---|---|---|
| `CAPTURED` | `NEW` | New | `null` |
| `PROCESSING` | `SCREENING` | Screening | `null` |
| `READY` | `READY_FOR_REVIEW` | Ready for review | `null` |
| `STALE` | `NEEDS_ATTENTION` | Needs attention | `SOURCE_CHANGED` |
| `SAFE_FAILURE` | `NEEDS_ATTENTION` | Needs attention | latest allowlisted issue #70 attempt error code, otherwise `SAFE_FAILURE` |

Any unknown persisted lifecycle state fails the request with `500 SIGNAL_STATE_CONTRACT_VIOLATION`, emits content-free contract telemetry, and does not guess a presentation group.

### Response

Successful response status is `200` with this closed JSON shape:

```json
{
  "ok": true,
  "generated_at": "RFC3339 UTC",
  "query": { "group": "ALL", "q": null, "limit": 25, "snapshot_at": "RFC3339 UTC" },
  "counts": { "total": 0, "new": 0, "screening": 0, "ready_for_review": 0, "needs_attention": 0 },
  "items": [{
    "signal_id": "string",
    "lifecycle_state": "CAPTURED|PROCESSING|READY|STALE|SAFE_FAILURE",
    "presentation_group": "NEW|SCREENING|READY_FOR_REVIEW|NEEDS_ATTENTION",
    "presentation_label": "string",
    "excerpt": "plain text, at most 240 Unicode scalar values",
    "current_proposal_version": 0,
    "attention_reason": null,
    "created_at": "RFC3339 UTC",
    "updated_at": "RFC3339 UTC"
  }],
  "page": { "has_more": false, "next_cursor": null, "returned": 0 }
}
```

- No submitter identifier, POD identifier, retention metadata, source, proposal content, provider metadata, event body, or full original signal is returned by the list endpoint.
- `excerpt` is produced server-side from the immutable original, rendered by React as text, preserves meaning, and appends a visible ellipsis only when truncated. The full original remains available only through the existing authorized signal workspace endpoint.
- Typed errors use the existing content-free error envelope, include a stable code and retryability, and never echo `q`, cursor bytes, signal content, SQL, or identity details.

## Frozen persistence and query plan

- No new signal or work-item table is authorized.
- One additive index is required: `idx_signals_pod_created_id` over `signals(pod_id, created_at DESC, signal_id DESC)`. Its migration is idempotent and contains no row insert, update, delete, trigger change, or table rebuild.
- Search remains a bounded literal scan within the enrolled POD and frozen snapshot for this slice. The query plan, page cap, query-length cap, and latency budget must pass before release; FTS, embeddings, or an external search service are out of scope.
- Listing, filtering, counting, pagination, and refresh are read-only. Before/after hashes for `signals`, all issue #70 signal tables, `work_items`, activity, decisions, reviews, economics, dispatch, Gate, membership, and retention-policy stores must match for read-only cases.
- The existing issue #70 capture case is the only acceptance case allowed to create a new signal. Its ledger separately records the expected append-only signal effects and proves zero work-item/authority effects.

## Acceptance tests

1. **SB-01 Navigation separation.** Given an enrolled member opens the application, Signal Backlog is a named primary navigation destination; Product Backlog contains no signal panel, signal row, signal count, or signal lifecycle label and retains its exact work-item totals.
2. **SB-02 Complete register.** Given at least 31 retained same-POD signals and page size 7, following every hosted continuation cursor returns every expected signal exactly once in the frozen snapshot, in exact `(created_at DESC, signal_id DESC)` order, with no first-8 or first-20 truncation.
3. **SB-03 Same-time boundary.** Given at least five signals with the same `created_at` spanning a page boundary, pagination returns all five exactly once in descending `signal_id` order without skip or duplication.
4. **SB-04 Concurrent capture snapshot.** Given a signal is captured after page 1 freezes its snapshot, it does not appear in that continuation chain and does appear exactly once after Refresh starts a new snapshot.
5. **SB-05 Counts.** For `q` absent and for each frozen search cohort, response counts match independent POD-scoped D1 projections; group counts sum to total, remain stable through continuation, and the selected group page contains only its mapped states.
6. **SB-06 Lifecycle mapping.** Each raw issue #70 lifecycle state maps to exactly the frozen group/label/reason table. A mapping-unit and isolated API fixture with an unknown state fail closed and emit the contract signal rather than presenting a guessed group.
7. **SB-07 Literal search.** Signal ID and ordinary-text matches return the expected frozen rows. Mixed case, Unicode, emoji, composed/decomposed forms, `%`, `_`, quotes, backslashes, markup, RTL text, SQL fragments, and prompt-injection text remain literal, inert, POD-scoped, and bounded.
8. **SB-08 Input rejection.** Every invalid/repeated/unknown limit, group, q, cursor, and parameter case returns the exact typed `400`; the response and telemetry contain no submitted search/cursor content and no broader fallback result.
9. **SB-09 Cursor binding and authorization.** A cursor replay under changed q/group/limit, another POD, an unenrolled identity, expired/changed membership, or malformed/altered fields fails closed or yields only the independently authorized result; zero cross-POD signal identifier, count, excerpt, or timing-derived record presence is disclosed.
10. **SB-10 Existing workspace.** Opening each group row loads the authoritative issue #70 signal workspace for the exact ID. Original, proposal, provenance, attempts, events, stale state, safe failure, and retry behavior match the predecessor contract; the list excerpt is never substituted for the original.
11. **SB-11 Capture discoverability.** Using the existing hosted one-field intake creates one immutable signal and initial event; it creates no work item or authority row. The returned workspace opens, the old snapshot remains honest, and Refresh shows the new signal in New or Screening exactly once.
12. **SB-12 Stale client responses.** When first-page, search, filter, refresh, load-more, and workspace requests resolve out of order, aborted or lower-sequence responses cannot replace or append to the current query. The UI announces one current result and never mixes snapshots.
13. **SB-13 Honest states.** Empty POD, no search match, first load, filter load, refresh, load more, malformed query, permission denial, network failure, server contract failure, and retry each display their designed state. Partial cached rows are marked stale/incomplete during an error and are never relabeled as the complete result.
14. **SB-14 Operational separation.** Across every read case, Product Backlog, Flight Board, WIP, Human Decisions, pull forecast, delivery economics, completed history, review, Gate, assignment, dispatch, and STR-key projections and UI counts remain byte-for-byte or semantically identical as frozen by their authoritative contracts.
15. **SB-15 Telemetry privacy.** Success, empty, filtered, paginated, validation error, auth denial, network error, stale response, and contract violation emit only the frozen metrics/allowlisted labels. Signal text, excerpt, q, cursor, signal ID, user ID, POD ID, proposal content, and personal data are absent from logs and telemetry.
16. **SB-16 Accessibility.** The complete eight-state hosted matrix—initial loading, populated/all groups, selected group, no-match, appended page, permission failure, network/retry failure, and empty POD—passes automated axe plus agent-operated keyboard, focus, screen-reader, contrast, 320 CSS-pixel, and true 200% browser-zoom checks. Status/count changes are announced once; focus remains predictable after filter, refresh, append, workspace close, and error retry; no control relies on color alone.
17. **SB-17 Performance and bounds.** Thirty real owner-only staging requests spanning first page, each group, search, continuation, and refresh have p95 server response at most 750 ms and p95 visible result at most 1,500 ms. Maximum response is 128 KiB, maximum returned rows is 50, query count is bounded, and the required D1 index/query plan is recorded.
18. **SB-18 Concurrency.** One hundred concurrent hosted reads across at least 100 request identities and the frozen mix of queries return internally consistent snapshot/count/page contracts; they create zero database rows/events, emit bounded telemetry, and do not cause an unbounded retry or request loop.
19. **SB-19 Reconciled regression.** From the exact implementation target containing issue #70 and #77 revisions, build, typecheck, lint, dependency/security checks, complete repository tests, issue #70 signal suite, and issue #77 fixture-isolation suite pass repeatedly with no shared-fixture mutation or order dependence.
20. **SB-20 Rollback.** The exact staging target is deployed, an active continuation/search/workspace view is captured, the prior staging version is restored, and then the exact target is restored. While old code is live, the removed endpoint/UI fails honestly without data/authority mutation; after restoration, the same authorized records and counts return. Before/during/after table hashes, index/schema inventory, deployment IDs/statuses, client outcomes, and production non-mutation are durable.

## Edge cases and attacks

- Thirty-one, zero, one, 25, 26, 50, and 51 matching rows.
- Multiple equal timestamps, clock skew, RFC3339 fractional seconds, and a signal inserted between every pair of page requests.
- Cursor from an older deployment, cursor replay after membership/POD change, oversized cursor, JSON nesting, duplicate JSON keys, unknown cursor keys, and query-digest collision fixture.
- Search containing only spaces, combining characters, emoji sequences, RTL overrides, percent/underscore, quotes, SQL comment syntax, HTML/script, prompt injection, 101 characters, control characters, and NUL.
- Long original text where the 240-scalar boundary crosses an emoji or combining sequence; no broken surrogate or unsafe markup is emitted.
- Unknown lifecycle state, missing latest attempt for `SAFE_FAILURE`, proposal version zero/nonzero, and a state transition while an old snapshot remains open.
- Double-click Load more, rapid filter switching, refresh during append, navigation away mid-request, workspace close/reopen, offline transition, and late response after retry.
- Contributor, Product Lead, agent, unenrolled user, removed member, changed role, same-POD member, and different-POD member.
- Database/index unavailable, D1 timeout, malformed D1 row, response larger than budget, and a restored old application version that does not recognize the endpoint.

## Accessibility and interaction record

The implementation evidence must contain, for each SB-16 state, the exact staging deployment/source/environment revision, route/query, timestamp, viewport, zoom method, browser, automated result, keyboard path, focus sequence, screen-reader announcement transcript, computed foreground/background contrast, result, and artifact digest. Screenshots supplement but do not replace the structured record. The tester is an agent; the Product Lead confirms the agent result and is not required to manually operate the matrix.

The design must include visible focus, a real heading, named result region, accessible selected-filter state, explicit result/count copy, one polite atomic status region, non-modal error recovery, semantic buttons/links, and opener focus restoration from the existing signal workspace. Load more appends without forcing focus; the status announces the number added and remaining availability.

## Outcome instrumentation

- `steer_signal_backlog_request_total{outcome}`
- `steer_signal_backlog_request_latency_ms`
- `steer_signal_backlog_visible_latency_ms`
- `steer_signal_backlog_page_total{kind}` where `kind` is only `first`, `continuation`, or `refresh`
- `steer_signal_backlog_returned_total`
- `steer_signal_backlog_validation_total{reason_code}`
- `steer_signal_backlog_stale_response_total`
- `steer_signal_backlog_contract_violation_total{reason_code}`
- `steer_signal_backlog_cross_pod_disclosure_total` must remain zero
- `steer_signal_backlog_work_item_side_effect_total` must remain zero
- `steer_signal_backlog_duplicate_row_total` and `steer_signal_backlog_missing_row_total` must remain zero for the frozen cohort

Allowed labels are fixed enums named above; no signal, search, cursor, identity, POD, free text, or unbounded value is a label. The hosted evidence ledger records per-case request identity, normalized parameter classes (not q/cursor bytes), response/D1 digests, count/page oracle, latency, telemetry deltas, protected-table projections, UI state, accessibility artifact references, and PASS/FAIL.

## Hosted staging evidence contract

- Evidence exercises the canonical owner-only staging site and its real authenticated Worker/D1 endpoint, not a synthetic evaluator, mocked D1, static render, or caller-supplied server clock/state.
- The frozen cohort contains at least 31 real retained signals visible to the owner POD and every existing lifecycle state. Evidence records IDs/digests privately but does not publish original signal text.
- All continuation chains, 30-case latency sample, 100-concurrency sample, capture/refresh case, and eight UI states execute against the exact staging target. Local isolated fixtures may cover destructive/unknown-state cases but cannot replace hosted acceptance evidence.
- The ledger freezes `started_at` before the first case and `completed_at` at or after the maximum authoritative response/client-completion timestamp. Each result binds the actual request, authoritative response, D1 projection where applicable, UI observation, telemetry delta, and implementation revision.
- Protected table/schema hashes are captured before and after read-only cases. The capture case has a separate allowed-delta manifest. Production deployment, environment revision, D1 schema/table inventory, and protected hashes are inspected read-only before and after and must match.

## Rollback contract

- Record exact target, prior, rollback, and restoration deployment IDs, source commits, environment revisions, timestamps, and provider statuses from Sites.
- While the exact prior version is live, execute a real first-page/continuation/search request or observe the expected endpoint absence, open Product Backlog, and attempt to resume the target client's in-flight continuation. The result must be an honest recoverable error or old UI, never a broader query or mutation.
- Capture per-table canonical projections and SHA-256 hashes for every issue #70 signal table and all protected work/authority tables before target, during prior-version rollback, and after target restoration. Boolean equality without the underlying bounded projection/digest is insufficient.
- After restoration, rerun populated first page, one continuation, one filter, one search, one workspace open/close, and compare the frozen authorized ID/count projections.
- The additive index may disappear with schema rollback only if the prior migration boundary requires it; no signal or work-item row may disappear or change. If the production migration sequence makes index rollback unsafe, application rollback must remain compatible with the additive index and the evidence must state that explicitly.

## Human judgment checklist (Evaluate)

The Test and Critic agents perform all interaction, accessibility, security, performance, data-integrity, and rollback checks. The Product Lead confirms their exact-target result rather than manually repeating tests.

- [ ] Signal Backlog clearly feels like an intake/screening queue, not a second Product Backlog.
- [ ] A contributor can confirm that an older signal still exists and understand its current state.
- [ ] A Product Lead can find a signal by ID or ordinary words without seeing hidden partial-result behavior.
- [ ] “Ready for review” is clearly advisory and cannot be mistaken for admitted or delivery-ready work.
- [ ] Product Backlog contains only work items and all operational counts remain understandable.
- [ ] Errors and partial results are honest, recoverable, and do not suggest that missing signals were deleted.
- [ ] The exact staging evidence supports the Brief outcome and every zero-authority guardrail.

---

GATE 2: APPROVED — 2026-08-20T15:50:11Z — idrissenayat

GATE 2 EVIDENCE: Product Lead/solo operator approval in the governed Codex task, bound to pre-signature Exam revision `6cc3aa9818a72b10995095e32a643c6784c94b65` and Exam SHA-256 `256b594ab0aa1465d4de04b1e4c67fa24452599e6c5d067acb921dceaf96f10e`. Authorized scope is implementation and owner-only staging verification against the approved Brief and Exam. This does not authorize merge, production deployment, Release, closure, or Gate 3.
