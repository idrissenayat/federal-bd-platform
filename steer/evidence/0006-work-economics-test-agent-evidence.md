# Independent Test Agent evidence — 0006 Work Economics

**Work item:** STR-017

**Builder revision tested:** `1a06ae48dd003d4e0f0986f3d266ae6a0b5324d1`

**Controlling Exam:** `steer/exams/0006-work-economics.md` at revision `65c9dcb209a6`

**Test date:** 2026-08-14
**Gate recommendation:** **BLOCK GATE 3**. Do not deploy, release, merge, or approve until the blocker findings below are corrected and independently retested.

## Independent result

The Builder revision compiles, lints, preserves existing rows through the tested migration and rollback, and passes its 49 automated checks. The pure pull-forecast calculation is comfortably inside the five-second budget at dogfood scale. Those green checks do not satisfy the complete Exam: independent review found security/privacy bypasses and multiple unimplemented acceptance requirements.

### Blocker findings

1. **Person-level and ranking data can bypass validation (F-03, H-04, PRIV-01..03).** `validateWorkEconomics` checks only top-level key names. A valid Actual Economics payload containing `metadata: { employeeName: "Alice", rankingScore: 99 }` is accepted, as is `humanRole: "alice@example.com"`. Unknown fields are retained in the JSON and then returned to every authenticated member through `/api/bootstrap`, including prior and replacement audit JSON. This contradicts the claimed role-only storage boundary and makes restricted-person-data authorization, purpose, retention, deletion, and access logging unenforced.
2. **Unauthorized attempts are not audited (H-04).** The Work Economics mutation returns `403` for a disallowed member role, but does not append the evidence-safe denial event required by H-04. There is also no tenant/item membership check; authorization is based on a global member role and numeric item ID.
3. **Owner authority is not enforced end to end (A-03, C-05, G-02).** Any human whose role string contains Product Lead, Tech Lead, Delivery, Observe, or Learn as applicable can accept the corresponding record for any item. The server does not bind forecast acceptance to the assigned delivery owner, nor outcome verification to the named outcome owner. The dispatch parser checks that `acceptedBy` exists, not that it is the current authorized owner.
4. **Material reforecast coverage is incomplete (D-04, D-06, D-08).** `materialForecastChange` deliberately treats title/description changes as non-material, while the Exam requires scope changes to force a reforecast. Gate decisions, code-review failures, dependency/test-result changes, and several blocker transitions mutate the item outside this hook. Blocked work has no explicit unblock owner/action or `cannot forecast until <dependency>` contract. Completion variance against the accepted likely window is not calculated.
5. **Required decision information is absent from compact views (D-01, H-01).** Flight Board and Backlog call `ForecastSummary` in compact mode, which omits the next milestone/time, completion window, and last forecast update. Compact text is styled at 9 px. This does not meet the Exam requirement that every named active-work view remain actionable at narrow widths and 200% zoom.
6. **Required AI/human authority presentation is missing (A-03, B-03).** Work Economics renders editable human forms, but no AI proposal/recommendation, omissions, advisory label, or proposal-versus-human-acceptance state. The server overwrites Value Hypothesis `advisory` to `false`, and the UI never renders that field.
7. **The accepted data model cannot represent several required economics facts (C-01, F-01, F-02).** Delivery forecast and actuals each store one `humanRole` string and one provider/model record, rather than separately queryable role ranges/totals and provider/model attempts. Actuals are an opaque JSON record, not queryable event facts. There is no ingestion, deduplication, conflict, or late-arrival handling for provider telemetry.
8. **Gate/value and evidence controls do not fail closed (B-01, B-02, C-03).** Gate 1 approval does not require an accepted Value Hypothesis. Value evidence is validated only as a non-empty string, so unsupported text passes the API. Expert-judgment forecasts are not forced to low confidence, and no same-POD/work-type service-level distribution or sample size is calculated when history becomes available.
9. **Accessibility is not release-ready (H-01, A11Y-01..03).** The revision contains no route-level axe result or keyboard/screen-reader/200% zoom evidence. The primary Work Economics button uses white text over a pink-to-yellow gradient; the white/yellow endpoint contrast is approximately `1.99:1` (white/pink is `3.71:1`), below WCAG AA for normal text. Static JSX lint is green but is not an axe or assistive-technology result.
10. **Known high-severity dependencies remain open (SEC-02).** `npm audit --json` reports two high vulnerabilities through direct `vinext` and transitive `image-size`, plus four moderate development-tool findings through `drizzle-kit`/legacy `esbuild`. There are no critical findings, but Security disposition or remediation is required before Gate 3.

### Should-fix findings

- **Pull forecast provenance is incomplete (E-04).** The response exposes the selected release item and missing-forecast keys, but not the full set of contributing items/windows behind the probabilistic range.
- **Human-gate timing is described but not modeled (D-07).** Forecast status text says the gate wait is separate, but there is no distinct human-decision target alongside agent completion and overall completion.
- **Complete state handling is incomplete (H-02).** Unknown, stale, unavailable, validation, and generic permission errors exist. Conflicting telemetry/evidence and partial provider data do not identify a responsible owner and safe corrective action in every affected view.
- **Audit immutability is application-level only (A-04).** There is no update/delete API for Work Economics events, which is positive, but the table has no database trigger or privilege boundary preventing mutation by the application/database operator. Operational privileges require Security/Platform review.

## Acceptance-test matrix

`Pass` means the tested revision satisfies the automated portion observed by this Test Agent. `Partial` or `Fail` blocks treating the Exam as fully verified. Manual specialist checks remain required even where automated behavior passes.

| ID | Result | Independent evidence |
|---|---|---|
| A-01 | Pass | Four schema/UI records remain separate; no composite score found. |
| A-02 | Pass | Nullable migration and unknown/not-due rendering; no missing-to-zero conversion found. |
| A-03 | Fail | No AI proposal/advisory/acceptance presentation; human authority is role-wide, not named-owner bound. |
| A-04 | Partial | Corrections append prior/replacement/actor/reason; immutability is not database-enforced and denials are not logged. |
| B-01 | Fail | Fields validate on record save, but Gate 1 can be approved without the record. |
| B-02 | Fail | Any non-empty evidence string passes; unsupported claims are not marked unverified. |
| B-03 | Fail | Drivers render, but AI proposal, omissions, and human acceptance state do not. |
| C-01 | Partial | Basic numeric ranges/bands validate; per-role ranges are not representable. |
| C-02 | Pass | Completion range/timezone/confidence are separate from active effort. |
| C-03 | Fail | Expert judgment is not constrained to low confidence; distribution/sample-size behavior is absent. |
| C-04 | Pass | No story-point/date conversion or cross-POD productivity calculation found. |
| C-05 | Fail | Dispatch blocks missing/reforecast-required records, but acceptance is not bound to the assigned owner. |
| D-01 | Fail | Compact Flight Board/Backlog summaries omit milestone/time, completion range, and update timestamp. |
| D-02 | Pass | Separate phase-exit label and timestamp are stored and editable in item details. |
| D-03 | Pass | Pure evaluator emits textual on-track/at-risk/late/unknown reasons. |
| D-04 | Fail | Scope, gate, test, dependency, and several blocker changes bypass the reforecast hook. |
| D-05 | Pass | Expired milestone/freshness becomes attention-needed rather than green. |
| D-06 | Partial | Prior forecast and blocked-since survive; required unblock/dependency contract is absent. |
| D-07 | Fail | Gate wait text exists, but agent-complete, human-target, and overall windows are not separately modeled. |
| D-08 | Fail | History exists; completion variance calculation is absent. |
| E-01 | Pass | WIP-full response includes selected slot-opening range/item/confidence/freshness. |
| E-02 | Pass | Missing forecasts remain incomplete and name owners without inventing a date. |
| E-03 | Pass | No committed queued-start field exists; current WIP remains explicit. |
| E-04 | Fail | Full contributing-item set and its ranges are not exposed. |
| F-01 | Fail | One opaque role/provider JSON record is not separately queryable role/provider actuals. |
| F-02 | Partial | Provenance/completeness validation exists; ingestion, duplicate/conflict, and late-arrival behavior do not. |
| F-03 | Fail | Nested fields and identifier values bypass anti-person validation; all members receive stored JSON. |
| G-01 | Pass | Closing an item does not synthesize a positive outcome. |
| G-02 | Partial | Exact statuses/evidence/confidence/limitations validate; named outcome-owner authority is not enforced. |
| G-03 | Pass | No incompatible-unit ratio or ROI calculation found. |
| H-01 | Fail | Required compact data is absent; 9 px text and button contrast fail release evidence. |
| H-02 | Fail | Conflicting/permission/partial-data owner and corrective-action states are incomplete. |
| H-03 | Pass | Apply/rollback test preserves an existing item and restores original columns/data. |
| H-04 | Fail | Role rejection exists, but nested-person bypass, global item-ID scope, missing denial audit, and owner mismatch remain. |

## Commands and observed results

From `flight-board/` unless noted:

- `npm test` — **49 passed, 0 failed** (7 JavaScript/static UI + 42 TypeScript tests; production build succeeded).
- `npm run lint` — **passed**.
- `git diff --check` — **passed** before this evidence document was added.
- From repository root: `uv run pytest tests/test_repository_contract.py -q` — **3 passed**.
- Migration test — included in `npm test`; apply and rollback preserve the seeded existing row.
- Privacy boundary probe — returned `null` (accepted) for both nested `{employeeName, rankingScore}` metadata and an email address in `humanRole`; this is a blocker, not a pass.
- Pull calculation microbenchmark — 100 two-item calculations completed in approximately `7.49 ms` total (`0.075 ms` per call) in the local test environment.
- Contrast calculation — white on the Work Economics yellow gradient endpoint is approximately `1.99:1`; white on its pink endpoint is `3.71:1`.
- `npm audit --json` — 0 critical, 2 high, 4 moderate, 0 low.

## Required retest before Gate 3

1. Replace permissive JSON acceptance with exact recursive schemas/allowlists; prohibit person identifiers in both keys and values; define restricted data access and denial/access audit events.
2. Bind forecast/outcome acceptance to the named owner/authority and tenant/POD/item membership on the server; add direct API IDOR and denial-audit tests.
3. Enforce Value Hypothesis at Gate 1 and governed forecast at execution; verify evidence semantics and expert-judgment confidence rules.
4. Trigger immutable reforecast history for every Exam-named material change and implement blocker, gate-target, completion-variance, and forecast-history behavior.
5. Model per-role human ranges/totals and per-provider/model telemetry with provenance, completeness, late/conflict handling, and queryable event facts.
6. Put the complete forecast contract in every named compact view and expose contributing items in the WIP forecast.
7. Add AI proposal/advisory/human-acceptance states and complete permission/conflict/partial-data correction guidance.
8. Remediate or formally dispose of dependency findings, run axe at the changed route, and complete keyboard, screen-reader, narrow-screen, timezone, and 200% zoom checks after correcting contrast and compact text sizing.

Gate 3 remains default-closed. This Test Agent did not deploy, release, merge, or approve the revision.
