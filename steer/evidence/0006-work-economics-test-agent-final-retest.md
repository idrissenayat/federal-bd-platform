# Independent Test Agent final retest — 0006 Work Economics

**Work item:** STR-017

**Exact Builder revision retested:** `075dde884c1717c4d50482763345f90392497227`

**Prior Test Agent evidence:** `b8f0ca379ee729c6b513d24a7ed16e4f1e50ccb2`, `48a870379418c9bafee0ab5eb726f414c48726eb`

**Controlling Exam:** `steer/exams/0006-work-economics.md` at `65c9dcb209a6`

**Retest date:** 2026-08-14

**Result:** **BLOCK GATE 3**. The exact revision resolves most prior blockers, including the cross-POD IDOR, dispatch freshness, server evidence binding, completion variance, normalized delivery events, strict outcome validation, and per-record AI/human presentation. Four implementation acceptance gaps and all mandatory specialist/human conditions remain.

## Outcome first

The build, 72-test suite, typecheck, lint, repository contract, migration/rollback, append-only trigger, axe, contrast, responsive/static coverage, and local Semgrep scan are green. GitHub also reports `repository-contract` completed successfully for the exact tested SHA on draft PR #49.

Independent dynamic probes confirmed that every item-ID route tested is caller-POD scoped and that all cross-POD denial audit rows omit prior/replacement payloads. Stale, late, reforecast-required, and wrong-owner forecasts no longer authorize dispatch. Value and verified-outcome evidence are resolved, fingerprinted, and stamped by the server. Actual completion/variance is derived from workflow activity, and role/provider/duration/rework/defect/rollback projections are queryable.

Gate 3 must remain closed because monetary compatibility is not validated, service-level cohorts use workflow treatment as “work type,” the POD pulse omits required forecast timing/freshness, and a blocked owner can erase the blocker dependency contract through the API. Product Designer assistive-technology checks, specialist rulings, dependency disposition, fresh-context Critic review, and the 24-hour cooling-off also remain mandatory.

## Blocking findings

### 1. Monetary mode does not require a compatible native unit — B-02

The Value Hypothesis validator requires `valueMode: monetary`, a currency, period, assumptions, and server-verified evidence, but it never checks that the native unit is monetary or compatible with the currency. An otherwise valid monetary record with:

- outcome metric `Latency`;
- native unit `milliseconds`;
- currency `USD`; and
- period `monthly`

returned no validation error. B-02 explicitly requires incompatible monetary units to fail closed. A typed monetary-unit contract is required; the presence of a currency field beside an unrelated native unit is not compatibility.

### 2. Service-level cohorts conflate workflow treatment with work type — C-03

The server now rejects client-fabricated cohorts and derives history from the current POD. However, `authoritativeServiceLevel` queries `workflow = ?`, and `buildServiceLevelDistributions` assigns `workType = item.workflow`. In this platform, `workflow` is `STEER`, `Control`, `Setup / excluded`, or `Unassigned`; it is the experimental/process treatment, not the work type.

Consequently, five unrelated STEER items in one POD are treated as the same work type and can create a high-confidence cycle-time distribution. The schema has no authoritative work-type field. C-03 and the calibration non-functional check require comparable same-POD/**same-work-type** history, so this remains blocked even though the POD and sample are now server-derived.

### 3. The POD pulse does not show the complete active-item forecast contract — D-01

Backlog, Flight Board, My Work cards, and the drawer use the complete compact `ForecastSummary`. The separately named POD pulse does not. Its “Next expected event” shows event text and owner but omits that item’s:

- next-event target timestamp;
- likely completion window;
- forecast confidence; and
- last forecast update.

Its pull-forecast contributor details show completion ranges and confidence but still omit next milestone/target and last update. D-01 requires all of these fields when an active item is viewed in the POD pulse.

### 4. A blocked owner can erase the required blocker/reforecast contract — D-06

The general item transition correctly creates `blockedSince`, unblock owner/action, dependency text, and immutable reforecast evidence. But delivery-forecast acceptance validates those fields only when the client supplies a truthy `blockedSince`; it does not bind the requirement to the authoritative `work_items.state = blocked` and `work_items.blocked_since`.

In an independent in-memory API probe, the named Tech Lead for a blocked item submitted a valid replacement forecast with `blockedSince: null`, blank unblock owner/action, and blank `cannotForecastUntil`. `PATCH /api/items/:id/work-economics` returned `200` and replaced the governed forecast. The item remains visibly at risk and dispatch remains blocked, but the required blocker/dependency record has been erased. The server must stamp or require this contract from authoritative item state before clearing `reforecastRequiredReason`.

## Prior evidence disposition

| Prior finding | Final-retest disposition |
|---|---|
| Recursive person/ranking/email bypass | **Resolved for tested payloads.** Exact recursive schemas and role allowlists reject the attacks; Privacy/Legal ruling remains. |
| Work Economics denials unaudited / no POD scope | **Resolved.** Same-POD wrong owner and cross-POD callers fail with payload-free denial evidence. |
| Named forecast/outcome authority absent | **Resolved.** Named owner/POD authority is server enforced; agents cannot accept authoritative records. |
| Material reforecast coverage incomplete | **Substantially resolved.** Named mutation categories append reforecast evidence. The blocked-record erasure is separately blocked under D-06. |
| Compact forecast contract absent | **Resolved in cards/drawer; not in POD pulse.** D-01 remains blocked. |
| AI proposal/human state absent or coalesced | **Resolved.** All four records independently render advice, evidence, drivers, omissions, and accepted/edited state. |
| Per-role/provider/queryable actual model absent | **Resolved.** Current projections cover roles, providers/conflict provenance, durations, rework, defects, and rollbacks. |
| Gate 1/evidence/service-level controls absent | **Partially resolved.** Evidence and Gate 1 fail closed; service levels still confuse workflow with work type and monetary compatibility is incomplete. |
| Cross-POD general mutation and dispatch | **Resolved.** Independent all-route probes rejected cross-POD access and preserved target state. |
| Stale/late forecasts authorize dispatch | **Resolved.** Dispatch exact-parses the forecast and requires evaluated state `on track`. |
| Client-asserted evidence | **Resolved.** The server resolves approved GitHub text, binds a 40-character revision, fingerprints content, and overwrites client claims. |
| Client-asserted completion/variance | **Resolved.** Workflow completion activity wins whether actuals arrive before or after completion. |
| Invalid/query-opaque actual events | **Resolved.** Strict validation and normalized projections pass dynamic query checks. |
| Invalid outcome date/evidence | **Resolved.** Exact dates and server evidence provenance fail closed. |
| Dependency findings | **Documented, not cleared.** Audit remains 0 critical, 2 high, 4 moderate; authenticated Security disposition is still absent. |

## Exam acceptance matrix

`PASS` means the exact revision satisfies the independently tested automated/system behavior for that acceptance ID. `BLOCK` means implementation or required human evidence is incomplete. Specialist checks listed after the matrix remain mandatory even for automated passes.

| ID | Result | Independent final-retest evidence |
|---|---|---|
| A-01 | PASS | Four independently labeled/stored/rendered records; no composite productivity/value score or automatic ordering found. |
| A-02 | PASS | Nullable migration and safe reads preserve unknown/not-due/unavailable without missing-to-zero calculations. |
| A-03 | PASS | Each record has adjacent advisory/editable human state; named human roles/owners enforce acceptance server-side. |
| A-04 | PASS | Prior/replacement, actor, source role, reason, and time are retained; D1 update/delete triggers reject audit mutation. |
| B-01 | PASS | Exact schema requires the native-unit Value Hypothesis contract; Gate 1 returns `409` when it is absent/unaccepted. |
| B-02 | **BLOCK** | Server evidence/currency/period improved, but monetary `milliseconds` + `USD` is accepted as compatible. |
| B-03 | PASS | Per-value advisory shows confidence, drivers, evidence, omissions, and accepted/edited human state. |
| C-01 | PASS | Exact per-role effort and per-provider cost/attempt ranges are stored and projected. |
| C-02 | PASS | Earliest/likely/latest/timezone/confidence remain distinct from active effort. |
| C-03 | **BLOCK** | Cohort is current-POD/server-derived, but `workflow` is incorrectly used as work type. |
| C-04 | PASS | No story-point/date promise, synthetic score, or cross-POD productivity conversion found. |
| C-05 | PASS | Exact-schema, current, on-track, named-owner acceptance is required for dispatch; stale/late/reforecast/wrong-owner cases fail. |
| D-01 | **BLOCK** | Cards and drawer pass, but the separately named POD pulse omits target time and last forecast update. |
| D-02 | PASS | Next phase-exit event/time is modeled separately from the final completion range. |
| D-03 | PASS | On-track/at-risk/late/unknown include textual reasons and do not depend on color. |
| D-04 | PASS | Scope, owner, state/blocker, milestone, evidence/dependency/test, workflow/priority, gate, review, and resubmission hooks retain immutable reforecast evidence. |
| D-05 | PASS | Stale/missed-milestone/late records become at-risk or late and cannot dispatch. |
| D-06 | **BLOCK** | A blocked named owner can save a replacement forecast without blocker/unblock/dependency fields (`200`). |
| D-07 | PASS | Agent completion, human target, gate-wait reason, and overall window are distinct; missing targets create at-risk state and dispatch remains closed. |
| D-08 | PASS | Material history is retained and server completion variance works for actuals before or after completion without person scoring. |
| E-01 | PASS | Slot-opening range/item/confidence/freshness is computed from POD-scoped active work under the five-second budget. |
| E-02 | PASS | Unknown forecasts name owners and do not invent a date. |
| E-03 | PASS | Queued work receives no committed start date while WIP is full. |
| E-04 | PASS | Pull forecast exposes every contributing WIP item, range, confidence, and state. |
| F-01 | PASS | Role totals, provider duration, queue, blocked, gate wait, cycle, rework, defect, and rollback facts are separately queryable. |
| F-02 | PASS | Provider/model/event ID, attempts, optional tokens/cost, currency, duration, source, completeness, state, and conflict reason project with provenance. |
| F-03 | PASS | Recursive person/ranking/email payloads fail; normal views expose role/POD aggregates and bootstrap is POD-scoped. |
| G-01 | PASS | Closing work does not synthesize outcome realization. |
| G-02 | PASS | Exact states, valid observation date, named verifier, confidence/causal limits, and server-resolved evidence are required. |
| G-03 | PASS | No ROI or incompatible-unit ratio is calculated; monetary-contract incompatibility is tracked under B-02. |
| H-01 | **BLOCK** | Automated axe/contrast/responsive/12px coverage passes, but D-01 affects the POD pulse and required keyboard/screen-reader/timezone/narrow/200% human evidence is absent. |
| H-02 | PASS | Empty/stale/conflict/partial/permission/validation guidance names the owner and safe corrective action in tested states. |
| H-03 | PASS | Migrations 0005–0007 apply to existing work, preserve null unknowns and query facts, enforce append-only audit, roll back, and retain original fields. |
| H-04 | PASS | All tested item-ID routes are same-POD scoped; agents/nonnamed roles fail authoritative mutations; denial audit rows contain no submitted payload. |

## Commands and exact results

From `flight-board/` unless stated otherwise:

- `git rev-parse HEAD` — `075dde884c1717c4d50482763345f90392497227`.
- `npm test` — **72 passed, 0 failed**: production build, 11 JavaScript/static/security/UI checks, and 61 TypeScript/API/domain/migration/accessibility checks.
- `npm run typecheck` — **passed**.
- `npm run lint` — **passed**.
- From repository root, `./scripts/run-semgrep.sh` — **0 findings (0 blocking)**; 252 rules on 140 tracked files.
- From repository root, `uv run pytest tests/test_repository_contract.py -q` — **3 passed**.
- `npm audit --audit-level=critical` — command passed at the critical threshold; **0 critical, 2 high, 4 moderate** remain.
- `git diff --check` — **passed** before adding this evidence file.
- `gh pr view 49 --repo idrissenayat/federal-bd-platform --json ...` — draft PR #49 is open/clean at exact head `075dde...`; `repository-contract` is `COMPLETED/SUCCESS` ([run 31843254323](https://github.com/idrissenayat/federal-bd-platform/actions/runs/31843254323/job/94904415511)).
- Independent temporary in-memory API/validation probe, `node --import tsx --test tests/independent-str017-probe.test.ts` — 3 checks: payload-safe cross-POD all-route check passed; intentional fail-closed assertions exposed two failures:
  - incompatible monetary native unit: validator returned no error (**B-02 failure**);
  - blocked forecast missing blocker/dependency contract: API returned `200`, expected `400` (**D-06 failure**).
  The temporary probe was removed after execution and is not part of the implementation or evidence commit.
- Independent source/UI trace:
  - service distribution groups `workType` from `item.workflow` and queries `workflow = ?` (**C-03 failure**);
  - `FlowPulse` shows next event/owner and contributor ranges but not the next target and last forecast update (**D-01 failure**).

## Required correction before another Test Agent retest

1. Make monetary value a typed unit contract: monetary native unit/currency must be compatible, and incompatible units must be rejected or remain unverified.
2. Add an explicit governed work-type field/taxonomy. Derive service levels from exact current-POD/current-work-type history; never substitute STEER/Control treatment for work type.
3. Put owner, next milestone/event, target timestamp, likely completion window, confidence, and last update together in the POD pulse for the active item(s).
4. On delivery-forecast writes for an authoritatively blocked item, server-stamp/preserve `blockedSince` and require unblock owner/action plus revised window or dependency statement before clearing reforecast-required state.

## Mandatory non-Test-Agent conditions

Even after the four implementation blockers pass, Gate 3 still requires authenticated Security, Privacy/Legal, Product Designer, Platform/Ops, Product Lead, Tech Lead, and independent-reader findings/rulings; a fresh-context Critic over the final revision; Security disposition of the residual dependency findings; Platform/Ops backup and rollback approval; Product Designer keyboard, screen-reader, timezone, narrow-screen, and 200% zoom verification; and the default-closed 24-hour cooling-off measured from an independently verified final build.

This Test Agent changed only this evidence document. It did not modify implementation code, deploy, merge, release, request Gate 3, or approve Gate 3.
