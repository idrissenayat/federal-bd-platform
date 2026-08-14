# Builder evidence — 0006 Work Economics

**Work item:** STR-017  
**Controlling Exam:** `steer/exams/0006-work-economics.md` at approved revision `65c9dcb209a6`  
**Status:** Builder implementation evidence; independent Test, Critic, specialist reviews, cooling-off, Gate 3, and release remain pending.

## Acceptance-test map

| ID | Builder evidence | Verification state |
|---|---|---|
| A-01 | Four separately stored/rendered records in `db/schema.ts`, `worker/api.ts`, and `app/page.tsx`; no composite score | Automated UI/static + unit coverage |
| A-02 | Nullable migration; `workEconomicsFromRow` and UI use unknown/not due/missing states | Unit + migration coverage |
| A-03 | UI authority/advisory text; server human-role authorization; accepted actor/time stamped by server | API/unit coverage; human UX review pending |
| A-04 | Append-only `work_economics_events` stores previous/replacement/actor/reason/time | Migration + API review; independent integrity test pending |
| B-01 | Value validation requires the complete native-unit contract | Unit/API validation coverage |
| B-02 | No ROI/prioritization calculation; evidence is required | Unit/API validation; Product ruling pending |
| B-03 | Driver bands, evidence, confidence, omissions/unknowns, authority shown together | Static UI coverage; human review pending |
| C-01 | Delivery form and validation require range, size, attempts, three bands, basis | Unit/API coverage |
| C-02 | Earliest/likely/latest/timezone/confidence are distinct from effort | Unit + static UI coverage |
| C-03 | Basis/comparable/sample fields and low-confidence expert-judgment path | API validation; historical distribution not yet available at dogfood sample size |
| C-04 | No story-point-to-date or cross-POD conversion exists | Code review + anti-score test |
| C-05 | `evaluateAgentDispatch` requires a current owner-accepted forecast for STEER items | Authorization tests |
| D-01 | `ForecastSummary` appears in My Work, role portfolio, Overview, Flight Board, Backlog, and item details | Static UI + unit coverage |
| D-02 | Forecast stores/shows explicit phase-exit event and target | Static UI/API coverage |
| D-03 | `evaluateForecast` emits on track/at risk/late/unknown with textual reason | Unit coverage |
| D-04 | Material item changes preserve prior forecast, set reforecast reason, and append event | Unit/API coverage |
| D-05 | Missed milestone or freshness window becomes at risk, never green | Unit coverage |
| D-06 | Blocked state/reason is preserved separately and produces at-risk forecast | Unit coverage; full unblock workflow human check pending |
| D-07 | Human-gate waiting is explicitly different from agent work and appears in reason | Unit coverage |
| D-08 | Every forecast replacement is retained; individual scoring absent | API/schema review; completion-variance enhancement pending after telemetry cohort exists |
| E-01 | `buildPullForecast` returns slot range, releasing item, confidence, freshness | Unit coverage |
| E-02 | Missing active forecasts return no invented date and name owners | Unit coverage |
| E-03 | Existing WIP limit remains authoritative; no queued committed-start field is created | Unit/code review |
| E-04 | Pull forecast exposes range and contributing active items | Unit coverage |
| F-01 | Actual record keeps human/agent/cycle/queue/blocked/gate/rework/defect/rollback fields separate | API/schema review |
| F-02 | Actual validation requires provider/model/attempts/cost/duration/source/completeness and preserves nullable tokens | Unit/API coverage |
| F-03 | Human effort is role-aggregated; server rejects person/ranking fields | Unit/API coverage; Privacy review pending |
| G-01 | Completion does not synthesize a realized outcome; missing stays not due | Unit/code review |
| G-02 | Exact outcome states and evidence/verifier/confidence/causal limits are validated | Unit/API coverage |
| G-03 | No fabricated ratio or ROI calculation exists | Code review; Product/Finance semantics review pending |
| H-01 | Compact summaries, full drawer, non-color state text, responsive one-column layout | Static UI coverage; keyboard/screen reader/200% manual test pending |
| H-02 | Unknown, stale, partial telemetry, permission and validation responses have corrective text | Unit/static/API coverage; conflicting/loading manual test pending |
| H-03 | Generated migration adds nullable fields; apply/rollback test preserves existing row | Automated migration coverage |
| H-04 | Section writes enforce server-side human role authorization; person/ranking payloads rejected | Authorization/unit coverage; independent IDOR test pending |

## Files and commands

- Domain logic: `flight-board/lib/work-economics.ts`
- Server/schema: `flight-board/worker/api.ts`, `flight-board/worker/authorization.ts`, `flight-board/db/schema.ts`
- Migration: `flight-board/drizzle/0005_normal_iron_fist.sql`
- Human UI: `flight-board/app/page.tsx`, `flight-board/app/globals.css`
- Automated evidence: `flight-board/tests/work-economics.test.ts`, `work-economics-migration.test.ts`, `work-economics-ui.test.mjs`, `authorization.test.ts`, `gate-transition.test.ts`
- Verification commands: `npm test`, `npm run lint`, `git diff --check`, and `uv run pytest tests/test_repository_contract.py -q`

## Known findings kept open for Gate 3

- Independent Test Agent, fresh-context Critic, and named Security, Privacy/Legal, Product Designer, Platform/Ops, Product Lead, Tech Lead, and independent-reader rulings are not Builder evidence and remain pending.
- Accessibility requires manual assistive-technology and 200% zoom verification in addition to the static checks.
- The dependency audit reports no critical vulnerabilities, but currently reports two high findings through `vinext`/`image-size` and four moderate development-tool findings through `drizzle-kit`/legacy `esbuild`. Automated fixes propose unsafe version changes, so dependency remediation or an explicit Security disposition is required before Gate 3.
- No production deployment is authorized. The feature and schema remain default-closed until Gate 3 and the required 24-hour cooling-off complete.
