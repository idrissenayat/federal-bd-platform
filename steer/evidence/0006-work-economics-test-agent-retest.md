# Independent Test Agent retest — 0006 Work Economics

**Work item:** STR-017  
**Builder revision retested:** `bae7ebc04023f86fb18d04fc1aafb8549df9af4b`  
**Prior Test Agent evidence:** `b8f0ca379ee729c6b513d24a7ed16e4f1e50ccb2`  
**Controlling Exam:** `steer/exams/0006-work-economics.md` at `65c9dcb209a6`  
**Retest date:** 2026-08-14  
**Result:** **BLOCK GATE 3**. The rework resolves substantial parts of the first review, but the exact revision still fails multiple Exam acceptance tests and the required specialist/human rulings remain absent.

> The handoff named `bae7ebc04023f86fb18d04fc1aafb8549df9af4b1`, which is not a Git object because it contains one extra trailing character. The branch and pushed HEAD resolve to the 40-character revision tested above.

## Outcome first

The revised build, typecheck, lint, repository contract, migration/rollback, append-only trigger, axe, contrast, forecast, and projection tests are green. Independent live-boundary tests also confirmed that the Work Economics mutation endpoint now rejects a same-POD wrong owner and a cross-POD actor with the same `403`, appends payload-free denial events, scopes bootstrap reads by POD, suppresses unsafe legacy JSON, and writes role/provider projections for an authorized forecast.

Gate 3 cannot advance because broader item APIs still allow cross-POD mutation and dispatch, stale forecasts can still authorize execution, evidence and service-level claims remain client-asserted rather than server-verified, actual/outcome integrity has validation and queryability holes, and the AI proposal presentation does not cover every governed record. Automated accessibility improved materially, but the required Product Designer assistive-technology checks and named specialist rulings are still pending.

## Blocking findings

### 1. Cross-POD item mutation and dispatch remain possible — H-04, C-05, SEC-03/04

The Work Economics-specific endpoint correctly enforces POD and named-owner authority. However, `PATCH /api/items/:id` and `POST /api/items/:id/dispatch` load by numeric item ID without checking the caller's POD. In an in-memory dynamic API test, a `pod-b` Tech Lead:

- dispatched a `pod-a` item successfully (`200`); and
- changed that item's description successfully (`200`), with the new value persisted.

The general mutation did add a reforecast requirement, but that does not cure the IDOR: an actor outside the POD changed authoritative scope and execution state. Other item-ID routes use the same unscoped lookup pattern and require a complete authorization review. All item mutations and reads must select through caller POD membership before any state change or external handoff.

### 2. Stale/incomplete forecasts can authorize execution — C-05

`evaluateAgentDispatch` checks accepted actor, owner, dates, milestone, phase exit, basis, confidence, and absence of `reforecastRequiredReason`, but it does not use the exact schema or evaluate freshness/current state. A forecast whose completion range and milestone were already four days past still returned `authorized: true`. The existing authorization fixture also omits `updatedAt` yet is considered current.

Dispatch must use a schema-valid, named-owner-accepted forecast whose calculated state is not `unknown`, stale, or late. The safe bootstrap projection cannot compensate because dispatch evaluates the raw database JSON.

### 3. Evidence and monetary claims are client-asserted — B-02

The server validates evidence URL syntax and trusts the client-provided `evidenceStatus: "verified"`. A Value Hypothesis pointing to `https://definitely-does-not-resolve.invalid/evidence` was accepted by the live API (`200`) and then satisfied `gateOneValueReady`. No resolution, fingerprint, provenance, or authoritative verification occurred.

The monetary check recognizes only a narrow exact-unit regex. A revenue hypothesis with unit `US dollars`, no currency, and no measurement period passed validation. Currency/period/assumption rules need a governed value-type or monetary flag rather than free-text unit matching, and evidence verification must be stamped from a server-side resolution process rather than a client claim.

### 4. Comparable-history forecasts can be fabricated or crossed between PODs — C-03

The server accepts client-supplied service-level objects without comparing them to authoritative completed-item distributions or the current item's POD/work type. A forecast claiming `other-pod`, `Other`, and `sampleSize: 999` passed validation for an unrelated item.

The UI additionally searches only `entry.podId === "steer-flight-team"`, so a legitimate non-default POD cannot select its own computed distribution. The server must derive or bind the accepted cohort to the item POD/work type and exact sample; the UI must use `item.pod_id`.

### 5. Completion variance is not authoritative for the normal actuals-after-completion path — D-08

Variance is calculated only when an item changes to `complete` and Actual Economics already exists. If actuals are recorded after completion, the server accepts the client-supplied `completionAt` and `likelyVarianceMinutes` unchanged. Validation accepts invalid dates and arbitrary strings for these fields. The independent probe accepted `completionAt: "not-a-date"` and `likelyVarianceMinutes: "individual ranked first"`.

The server must stamp completion time from authoritative workflow events and calculate variance for both orderings: actuals-before-completion and actuals-after-completion. Clients must not provide the derived variance.

### 6. Actual-event validation and query projections remain incomplete — F-01, F-02

The normalized tables make human role totals, provider/model facts, and duration categories queryable. Rework, defect, and rollback events remain only inside opaque JSON, despite F-01 requiring them to remain separately queryable.

Validation checks allowed keys for those event arrays but not their required values. One record with negative rework minutes, negative defect count, blank rollback reason, invalid rollback timestamp, blank provider currency, invalid completion time, and an arbitrary derived variance passed validation. Conflict reasons are required in JSON but are dropped from the provider projection schema. Add normalized event tables/queries and strict numeric/date/currency/source validation; preserve conflict provenance in the queryable fact.

### 7. Verified outcome evidence/date validation is not complete — G-02

A `verified positive` outcome with `observationDate: "not-a-date"` and an unresolvable `.invalid` evidence URL passed validation. Named-owner enforcement and exact outcome states now work, but a verified result must be bound to a valid observation date and server-verified evidence before it becomes authoritative.

### 8. AI proposal coverage is incomplete — A-03, B-03

Value, forecast, and outcome records can carry an advisory and human acceptance state, but Actual Economics/correction has no advisory field or proposal/ruling state even though A-03 explicitly covers AI-proposed corrections. The drawer chooses only the first non-null advisory across Value, Forecast, and Outcome and renders it once above all four records. If more than one section has advice, the later sections' drivers, evidence, omissions, and acceptance state are not displayed adjacent to their claims.

Each record needs its own advisory block and editable proposal-versus-human result. Actual corrections need the same governed advisory contract.

## Prior finding disposition

| Prior finding | Retest disposition |
|---|---|
| Nested/value-based person or ranking payloads | **Resolved for tested payloads.** Recursive exact schemas rejected nested employee/ranking fields and email values; aggregate roles are allowlisted. Privacy/Legal must still approve retention and purpose. |
| Denials not audited; no Work Economics POD/owner check | **Resolved on the Work Economics endpoint.** Same-POD wrong-owner and cross-POD writes returned identical `403`; denial events had null prior/replacement payloads. Broader item-IDOR remains a new/expanded blocker. |
| Named forecast/outcome authority absent | **Resolved for Work Economics writes.** Delivery owner and outcome owner IDs are server-bound; Observe/Learn override remains explicit. Cross-POD dispatch bypass remains. |
| Material reforecast coverage incomplete | **Substantially resolved.** Scope, owner, phase/state/blocker, milestone/action, evidence, priority/workflow, gate, rework, resubmission, and code-review outcomes have hooks. Variance ordering remains blocked under D-08. |
| Compact views omit required forecast contract | **Resolved in static/rendered evidence.** Compact summary now shows value, effort, completion window/state/confidence, next milestone/time, last update, and outcome at 12 px. |
| AI versus human presentation absent | **Partially resolved.** Advisory and acceptance state exist, but not per record and not for actual corrections. |
| Per-role/provider model absent | **Partially resolved.** Human/provider/duration projections exist; rework/defect/rollback queryability and integrity remain blocked. |
| Gate 1/evidence/service-level fail-closed controls absent | **Partially resolved.** Missing Value Hypothesis blocks Gate 1 and expert judgment requires low confidence; evidence verification and comparable-history binding remain client-asserted. |
| Accessibility evidence/contrast absent | **Automated portion resolved.** Rendered axe scan reports zero serious/critical findings and action contrast is >=4.5:1. Human keyboard, screen-reader, timezone, narrow-screen, and 200% checks remain mandatory. |
| High/moderate dependency findings | **Disposition documented, not approved.** Audit remains 0 critical, 2 high, 4 moderate. Security must accept non-reachability or require remediation. |

## Exam acceptance matrix

`PASS` means the exact revision satisfies the tested automated/system behavior for that ID. `BLOCK` means the ID is not yet verified and prevents Gate 3. Specialist checks listed after the matrix remain mandatory even for automated passes.

| ID | Result | Independent retest evidence |
|---|---|---|
| A-01 | PASS | Four records remain separately stored/rendered; no composite score or automatic ordering found. |
| A-02 | PASS | Nullable migration, strict safe reads, unknown/not-due/unavailable states, and no missing-to-zero conversion. |
| A-03 | BLOCK | Per-record AI/human presentation is incomplete and Actual correction has no advisory/ruling contract. |
| A-04 | PASS | Prior/replacement/actor/reason/time append; D1 update/delete triggers abort; denial events are payload-free. Platform privilege review remains. |
| B-01 | PASS | Missing/incomplete/unaccepted Value Hypothesis returns `409` before Gate 1 approval. |
| B-02 | BLOCK | Unresolvable evidence and a monetary alias without currency/period pass and can satisfy Gate 1 readiness. |
| B-03 | BLOCK | One coalesced advisory is not adjacent to every section when multiple proposals exist. |
| C-01 | PASS | Exact schemas and fact projections support per-role effort and per-provider cost/attempt ranges. |
| C-02 | PASS | Completion range/timezone/confidence stay separate from active effort. |
| C-03 | BLOCK | Client can fabricate cross-POD/work-type distribution; non-default POD UI is hardcoded out. |
| C-04 | PASS | No story-point/date promise or cross-POD productivity conversion found. |
| C-05 | BLOCK | Named-owner match exists, but stale/incomplete raw forecasts and cross-POD dispatch still authorize execution. |
| D-01 | PASS | Every compact instance renders the complete forecast contract; surrounding cards show current owner. |
| D-02 | PASS | Phase-exit event/time are distinct from final completion. |
| D-03 | PASS | On-track/at-risk/late/unknown include textual reasons independent of color. |
| D-04 | PASS | All Exam-named material change categories have reforecast hooks and immutable events in reviewed code. |
| D-05 | PASS | Stale/missed forecast displays at-risk/late rather than green; dispatch use is separately blocked under C-05. |
| D-06 | PASS | Prior forecast survives; blocked-since, unblock owner/action, and explicit dependency are required on blocked forecast acceptance. |
| D-07 | PASS | Agent completion, human-decision target, gate wait, and overall range are separately modeled and displayed. |
| D-08 | BLOCK | History exists, but actuals recorded after completion can provide an arbitrary/non-numeric variance. |
| E-01 | PASS | Slot-opening range/item/confidence/freshness recomputes well under five seconds at dogfood scale. |
| E-02 | PASS | Missing owners stay visible and no date is invented. |
| E-03 | PASS | No queued committed-start field exists; active/blocked WIP remains authoritative. |
| E-04 | PASS | All contributing WIP items expose ranges, confidence, and state. |
| F-01 | BLOCK | Rework, defect, and rollback events are not normalized/queryable and invalid event values are accepted. |
| F-02 | BLOCK | Core provider provenance projects, but currency/event integrity and conflict reason projection are incomplete. |
| F-03 | PASS | Tested recursive person/ranking/email payloads fail; same-POD aggregate reads work and cross-POD bootstrap is empty. Privacy ruling remains. |
| G-01 | PASS | Item completion still does not synthesize realized value. |
| G-02 | BLOCK | Invalid observation date and unresolvable evidence can be stamped as verified. |
| G-03 | PASS | No ROI or incompatible-unit ratio calculation is exposed; monetary fail-closed defect is tracked under B-02. |
| H-01 | BLOCK | Automated axe/contrast/responsive/compact evidence passes, but required keyboard, screen-reader, timezone, narrow-screen, and 200% human checks are not recorded. |
| H-02 | PASS | Empty/stale/conflict/partial/permission/validation guidance names owners and safe actions in the tested UI. Product Designer review remains. |
| H-03 | PASS | Both migrations apply to an existing item, preserve unknown nulls, enforce append-only history, roll back, and retain original evidence. Platform backup approval remains. |
| H-04 | BLOCK | Economics writes are correctly scoped/audited, but cross-POD general item mutation and dispatch succeed by numeric ID. |

## Commands and exact results

From `flight-board/` unless noted:

- `npm test` — **62 passed, 0 failed**: production build, 10 JavaScript/static/security/UI tests, and 52 TypeScript/domain/migration/accessibility tests.
- `npm run typecheck` — **passed**.
- `npm run lint` — **passed**.
- `npm audit --audit-level=critical` — command passed at the configured critical threshold; report remains **0 critical, 2 high, 4 moderate**.
- From repository root, `uv run pytest tests/test_repository_contract.py -q` — **3 passed**.
- `git diff --check` — **passed** before adding this evidence file.
- Dynamic in-memory API boundary test:
  - same-POD wrong forecast owner: `403`;
  - cross-POD Work Economics writer: `403`;
  - authorized named owner: `200`;
  - both denial rows: `previous_json = NULL`, `replacement_json = NULL`;
  - nested person/ranking payload: `400`;
  - cross-POD bootstrap: target item absent;
  - unsafe legacy record: returned `null`; unsafe audit JSON: returned an `unavailable` safe projection;
  - role forecast projection: correct min/max row; provider projection: correct attempts/cost/currency row;
  - Gate 1 with missing Value Hypothesis: `409`;
  - unresolvable `.invalid` Value evidence with client `verified`: `200` (**failure**).
- Independent dispatch/IDOR probe:
  - stale forecast dispatch authorization: `true` (**failure**);
  - cross-POD dispatch: `200` (**failure**);
  - cross-POD general item patch: `200`, changed description persisted (**failure**).
- Independent integrity probes:
  - `US dollars` without currency/period: accepted (**failure**);
  - fabricated other-POD service level/sample: accepted (**failure**);
  - negative rework/defect facts, invalid rollback/completion dates, and arbitrary variance: accepted (**failure**);
  - verified outcome with invalid date and unresolvable evidence: accepted (**failure**).

## Required work before another independent retest

1. Apply caller-POD and action-role authorization to every item-ID route, including item update, dispatch, workflow, decision, code review, and notification mutations; add dynamic same-POD/cross-POD tests for each.
2. Make dispatch parse the exact Delivery Forecast schema and reject `unknown`, stale, at-risk-due-to-staleness, late, owner-mismatched, or reforecast-required records.
3. Replace client `evidenceStatus` trust with a server-attributed resolution/fingerprint record; govern monetary semantics independently of free-text unit aliases.
4. Derive and bind comparable-history distributions on the server from the current item POD/work type; remove the UI's hardcoded default POD.
5. Derive completion timestamps and variance from workflow events for either ordering of actuals and completion; reject client-written derived fields.
6. Strictly validate and normalize rework, defect, rollback, currency, conflict, and completion facts; keep conflict reasons and all event categories separately queryable.
7. Validate outcome observation dates and bind verified outcome evidence through the same server evidence mechanism.
8. Render an independent advisory/evidence/omission/human-acceptance block inside each of all four records, including Actual correction proposals.

## Mandatory non-Test-Agent conditions

Even after the blockers above pass, Gate 3 still requires named Security, Privacy/Legal, Product Designer, Platform/Ops, Product Lead, Tech Lead, and independent-reader findings/rulings; a fresh-context Critic over the final revision; Security disposition of the residual dependency findings; Platform/Ops backup and rollback approval; Product Designer keyboard/screen-reader/timezone/narrow-screen/200% verification; and the default-closed 24-hour cooling-off measured from the independently verified final build.

This Test Agent did not modify implementation code, deploy, merge, release, request Gate 3, or approve Gate 3.
