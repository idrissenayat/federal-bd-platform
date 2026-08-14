# Independent Test Agent retest — STR-017 at 7763b93

**Work item:** STR-017

**Exact Builder revision tested:** `7763b9319ece1ee0ea78c8ec080cbb2aa5eded60`

**Prior Test evidence:** `b8f0ca379ee729c6b513d24a7ed16e4f1e50ccb2`, `48a870379418c9bafee0ab5eb726f414c48726eb`, `b64e4c1bc300871b4dada8b3296ab1dfa58938fd`

**Controlling Exam:** `steer/exams/0006-work-economics.md` at `65c9dcb209a6`

**Retest date:** 2026-08-14

**Implementation/system ruling:** **PASS**. All four defects from `b64e4c1` pass the repository's local fixtures, the complete automated suite is green, and no new implementation blocker was found.

**Gate 3 ruling:** **BLOCKED pending non-Test-Agent conditions.** H-01 is not completely verified until the Product Designer performs the required keyboard, screen-reader, timezone, narrow-screen, and 200% zoom checks. All named specialist/human rulings, fresh-context Critic evidence, dependency disposition, Platform/Ops backup/rollback approval, and the 24-hour default-closed cooling-off remain absent. This Test Agent does not request or approve Gate 3.

## Outcome first

The exact revision builds, typechecks, lints, preserves and rolls back existing work through migrations 0005–0008, keeps Work Economics audit history append-only, and passes 74 automated checks. The local repository contract passes, and Semgrep reports zero findings across 143 tracked targets. The handoff records GitHub `repository-contract` as passed on this exact Builder SHA; this retest did not query or exercise external systems.

The four final functional defects are resolved:

1. Monetary value now requires a supported native currency unit compatible with the declared currency. `milliseconds` + `USD` and `EUR` + `USD` fail; `US dollars` + `USD` passes.
2. `work_type` is persisted and indexed separately from `workflow`. Cohorts use exact POD + governed work type, ignore `Unclassified`, and do not mix STEER/Control treatment.
3. Every POD-pulse contributor carries owner, milestone, target, completion range, confidence, and last forecast update. The selected next item also exposes its target, likely window, confidence, and last update.
4. For an authoritatively blocked item, the server stamps stored `blocked_since`, rejects blank unblock owner/action/dependency fields without modifying the record, and retains prior/replacement audit evidence for a valid revised forecast.

## Focused prior-blocker disposition

| Prior blocker | Result | Local fixture evidence |
|---|---|---|
| B-02 — incompatible monetary unit accepted | **PASS** | Validation rejects `milliseconds` + `USD`, rejects `EUR` + `USD`, accepts `US dollars` + `USD`, and retains evidence/currency/period/assumption requirements. |
| C-03 — workflow substituted for work type | **PASS** | Migration adds `work_type`; create/update use a governed taxonomy; cross-work-type history returns `409`; same-POD/same-work-type history succeeds even when its workflow treatment differs. |
| D-01 — POD pulse missing target/update | **PASS (automated)** | Pull contributors include `nextMilestone`, `nextMilestoneAt`, and `updatedAt`; static UI coverage confirms target and last-update rendering for every contributor and the next item. Human responsive/assistive checks remain. |
| D-06 — blocked owner erases dependency contract | **PASS** | Blank blocker fields return `400` and preserve the prior JSON; a valid revision server-stamps the authoritative blocked time and records reconstructable prior/replacement evidence. |

## Prior Test evidence disposition

| Earlier finding | Final disposition at `7763b93` |
|---|---|
| Recursive person/ranking/email bypass | Resolved in exact recursive validation fixtures. |
| Work Economics denials unaudited / cross-POD IDOR | Resolved in local item-ID route fixtures; denials are payload-free and target state is unchanged. |
| Named delivery/outcome authority absent | Resolved through server POD/named-owner checks; agents cannot accept authoritative records. |
| Material reforecast coverage incomplete | Resolved for Exam-named changes, including `workType`; immutable reforecast evidence is retained. |
| Compact forecast information absent | Resolved in cards, drawer, and POD pulse automated/static coverage. |
| AI proposal/human state absent or coalesced | Resolved with one advisory/evidence/omission/acceptance block per governed record. |
| Per-role/provider/queryable actual model absent | Resolved with normalized role, provider/conflict, duration, rework, defect, and rollback projections. |
| Gate 1/client-asserted evidence | Resolved; server evidence provenance and Gate 1 fail-closed fixtures pass. |
| Stale/late forecast dispatch | Resolved; exact schema plus on-track evaluation blocks stale, late, reforecast-required, and owner-mismatched dispatch. |
| Client completion/variance and malformed actuals | Resolved; workflow facts override client values and strict/queryable actual fixtures pass. |
| Invalid outcome date/evidence | Resolved; exact date and server evidence semantics pass. |
| Dependency audit findings | Not cleared by Test Agent: 0 critical, 2 high, 4 moderate; Security must rule on the documented non-reachability disposition. |

## Exam acceptance matrix

`PASS` means the exact revision satisfies the tested automated/system behavior for the acceptance ID. `BLOCK` means complete acceptance still requires evidence outside the authorized local Test Agent scope.

| ID | Result | Exact retest evidence |
|---|---|---|
| A-01 | PASS | Four separate stored/rendered records; no synthetic productivity/value score or automatic ordering. |
| A-02 | PASS | Nullable migration and safe-read fixtures keep absent/stale/unavailable/not-due distinct from zero. |
| A-03 | PASS | Per-record advisory/editable acceptance UI plus named human server authority. |
| A-04 | PASS | Prior/replacement/actor/role/reason/time retained; update/delete triggers reject audit mutation. |
| B-01 | PASS | Exact native-unit value contract; incomplete/unaccepted value blocks Gate 1. |
| B-02 | PASS | Evidence, currency, period, assumptions, and compatible native currency unit fail closed. |
| B-03 | PASS | Adjacent confidence, drivers, evidence, omissions, and human accepted/edited state. |
| C-01 | PASS | Per-role effort and per-provider cost/attempt ranges are exact and queryable. |
| C-02 | PASS | Earliest/likely/latest/timezone/confidence remain separate from active effort. |
| C-03 | PASS | Governed `work_type` is distinct from workflow; exact same-POD/work-type cohort and sample fixtures pass. |
| C-04 | PASS | No story-point-to-date promise, composite score, or cross-POD productivity conversion. |
| C-05 | PASS | Named-owner, exact-schema, current, on-track acceptance is required for dispatch. |
| D-01 | PASS (automated) | All named compact views and every POD-pulse contributor expose owner, next target, range, confidence, and last update. |
| D-02 | PASS | Phase-exit milestone/time is distinct from final completion. |
| D-03 | PASS | On-track/at-risk/late/unknown have textual reasons independent of color. |
| D-04 | PASS | Exam-named material changes, including work type, create immutable reforecast evidence. |
| D-05 | PASS | Stale/missed/late forecasts cannot remain green or dispatch. |
| D-06 | PASS | Authoritative blocked time and nonblank unblock/dependency contract are server enforced and audited. |
| D-07 | PASS | Agent completion, human target, gate wait, and overall completion are separately modeled/displayed. |
| D-08 | PASS | Material forecast history remains reconstructable and server variance works in both event orderings without person scoring. |
| E-01 | PASS | WIP slot range/item/confidence/freshness computes from POD-scoped active work below the five-second budget. |
| E-02 | PASS | Missing forecasts name owners and do not invent dates. |
| E-03 | PASS | Queued work has no committed start while WIP is full. |
| E-04 | PASS | All WIP contributors expose ranges, state, confidence, milestone target, and freshness. |
| F-01 | PASS | Human, execution, queue, blocked, gate wait, cycle, rework, defect, and rollback facts remain separately queryable. |
| F-02 | PASS | Provider/model/event ID/attempts/tokens/cost/duration/source/completeness/conflict provenance passes strict projection fixtures. |
| F-03 | PASS | Recursive privacy attacks fail; routine reads remain role/POD aggregate and POD scoped. |
| G-01 | PASS | Completion does not synthesize realized value. |
| G-02 | PASS | Exact outcome states, valid date, named verifier, confidence/causal limits, and server evidence are required. |
| G-03 | PASS | No unsupported ROI or incompatible-unit ratio is exposed. |
| H-01 | **BLOCK — human evidence** | Automated axe/contrast/static/responsive/12px and complete-content checks pass. Required keyboard, screen-reader, timezone, narrow-screen, and 200% Product Designer evidence is still absent. |
| H-02 | PASS | Empty/stale/conflict/partial/permission/validation states identify owner and safe corrective action. |
| H-03 | PASS | Migrations 0005–0008 preserve existing work and null unknowns, enforce append-only audit, and roll back to original fields. |
| H-04 | PASS | Existing local fixtures cover same-POD/cross-POD item routes, named authority, agent rejection, assignee scope, and payload-free denial audit. |

## Commands and exact results

From `flight-board/` unless stated otherwise:

- `git rev-parse HEAD` — `7763b9319ece1ee0ea78c8ec080cbb2aa5eded60`.
- `npm test` — **74 passed, 0 failed**: production build; 11 JavaScript/static/security/UI checks; 63 TypeScript/API/domain/migration/accessibility checks.
- `npm run typecheck` — **passed**.
- `npm run lint` — **passed**.
- From repository root, `uv run pytest tests/test_repository_contract.py -q` — **3 passed**.
- From repository root, `./scripts/run-semgrep.sh` — **0 findings (0 blocking)**; 252 rules on 143 tracked targets; one generated snapshot over 1 MB skipped under repository policy.
- `npm audit --audit-level=critical` — command passed at configured critical threshold; report remains **0 critical, 2 high, 4 moderate**.
- `git diff --check` — **passed** before this evidence document was added.
- `node --import tsx --test tests/work-economics-server-controls.test.ts` — **7 passed, 0 failed**: local IDOR/denial audit, assignee boundary, item-ID routes, server evidence, normalized actuals, exact work-type cohorts, and blocked-contract enforcement.
- `node --import tsx --test tests/authorization.test.ts tests/work-economics.test.ts tests/work-economics-migration.test.ts tests/work-economics-accessibility.test.ts` — **33 passed, 0 failed**: dispatch freshness/late/owner/reforecast, monetary semantics, pull contributors, migration/rollback, append-only history, strict actual/outcome semantics, and automated accessibility.
- `node --test tests/work-economics-security.test.mjs tests/work-economics-ui.test.mjs` — **7 passed, 0 failed**: authorization/security wiring, safe reads, normalized queryability, four records, complete forecast content, responsive UI, per-record advisory state.

## Residual non-Test-Agent conditions

Gate 3 remains default-closed until all of the following are attached to the exact final revision:

1. Authenticated Security, Privacy/Legal, Product Designer, Platform/Ops, Product Lead, Tech Lead, and independent-reader findings and rulings.
2. Product Designer keyboard, screen-reader, timezone, narrow-screen, and 200% zoom verification.
3. Security acceptance or rejection of the documented 2-high/4-moderate dependency reachability disposition.
4. Platform/Ops production backup, migration, and rollback approval.
5. Fresh-context Critic review of the approved brief, approved exam, final diff, telemetry evidence, and derived tags.
6. The default-closed 24-hour cooling-off measured from the independently verified final build.

This Test Agent used only existing repository tests and local fixtures. It changed only this evidence document and did not probe external systems, modify implementation, deploy, merge, release, mark the PR ready, request Gate 3, or approve Gate 3.
