# Builder rework evidence — 0006 Work Economics

**Work item:** STR-017

**Controlling Exam:** `steer/exams/0006-work-economics.md` at approved revision `65c9dcb209a6`

**Trigger:** independent Test Agent revision `b8f0ca379ee729c6b513d24a7ed16e4f1e50ccb2`

**Boundary:** implementation/test evidence only. Independent retest, Critic, specialists, cooling-off, Gate 3, merge, deploy, and release remain blocked.

## Corrective result by finding

1. Exact recursive allowlists now reject unknown nested keys, email values, unapproved role strings, duplicate event IDs, and person/ranking keys. Safe bootstrap/audit reads suppress malformed legacy JSON.
2. Economics writes require authenticated same-POD membership, eligible human role, and named owner; denials append payload-free audit events.
3. `delivery_owner_id` and `outcome_owner_id` bind acceptance/verification. Dispatch compares the accepted opaque actor ID with the named delivery owner.
4. Scope title/description, owner, phase/state/blocker, milestone/action, evidence/dependency/test, workflow, priority, gate decisions, rework, and resubmission trigger immutable reforecast evidence. Blocked work carries an unblock contract; completion calculates likely-window variance.
5. Every compact view now shows value, effort range, completion window/state/confidence, next milestone/time, last update, and outcome at a 12px minimum.
6. Each governed record exposes AI advisory/evidence/drivers/omissions and a human ruling that distinguishes acceptance unchanged from acceptance with edits; absent AI advice is explicit and does not fabricate a recommendation.
7. Per-role human forecast/actual facts, per-provider forecast/telemetry events, and duration facts are normalized into queryable D1 tables while the four records stay visibly separate.
8. Gate 1 requires an accepted evidence-verified native-unit Value Hypothesis. Monetary claims require currency/period/assumptions; expert judgment is forced to low confidence; comparable history requires same-POD/work-type distribution and sample size >=5.
9. Route-level axe reports zero serious/critical findings on the rendered Work Economics surface. Automated endpoint contrast is >=4.5:1; compact text is >=12px. Human keyboard/screen-reader/200% checks still require the Product Designer.
10. Audit still reports two high and four moderate dependency findings. `0006-dependency-security-disposition.md` records reachability and safe alternatives; an authenticated Security ruling remains mandatory.

Should-fix corrections: pull forecast returns every contributing WIP item/window; gate waits model agent completion and human target separately; permission/conflict/partial/unavailable states name the owner and corrective action; D1 triggers prohibit audit event update/delete; `Rework` is no longer incorrectly treated as an execution hold after the human starts it.

## Exam map

| ID | Automated/system evidence | Remaining human authority |
|---|---|---|
| A-01 | Separate schema/JSON/UI records; UI static test | Independent reader |
| A-02 | Nullable migration, safe reads, forecast unit tests | — |
| A-03 | Advisory/acceptance UI; named-owner/POD tests | Product/Tech review |
| A-04 | Prior/replacement events + D1 immutability trigger test | Platform privilege review |
| B-01 | Exact value schema + Gate 1 fail-closed test | Product ruling |
| B-02 | Verified URL, assumptions, monetary semantics validation | Product/Legal ruling |
| B-03 | AI driver/evidence/omission/acceptance rendering test | UX review |
| C-01 | Per-role/per-provider range schemas and projections | Delivery review |
| C-02 | Separate calendar/effort fields and UI test | — |
| C-03 | Expert-low and comparable cohort/sample validator tests | Calibration review after cohort |
| C-04 | No conversion/score code; anti-ranking tests | Independent review |
| C-05 | Named-owner dispatch tests | Tech Lead |
| D-01 | Complete ForecastSummary used in all named views; static test | Narrow/200% human check |
| D-02 | Phase-exit fields/UI | — |
| D-03 | State/reason unit tests | — |
| D-04 | Expanded material-change tests and server hooks | Independent API retest |
| D-05 | Stale/missed-milestone tests | — |
| D-06 | Blocked/unblock/dependency schema and reforecast hooks | Workflow UX review |
| D-07 | Separate agent-complete/human-target fields and reason | Human gate review |
| D-08 | Immutable histories and completion-variance test | Calibration review |
| E-01 | Pull range/item/confidence/freshness tests | — |
| E-02 | Missing owner/no invented date test | — |
| E-03 | WIP-authoritative behavior; no queued committed start | Delivery review |
| E-04 | Full contributor/range test + UI disclosure | — |
| F-01 | Human/provider/duration projection tables and migration test | Platform query review |
| F-02 | Unique event, provenance, nullable, late/conflict schemas/UI | Provider operations review |
| F-03 | Recursive anti-person tests, aggregate allowlist, POD scope | Privacy ruling |
| G-01 | No completion-to-value synthesis | Product review |
| G-02 | Exact outcome schema + named-owner authority | Outcome owner |
| G-03 | No ROI/ratio; monetary assumptions fail closed | Product/Legal ruling |
| H-01 | Route axe, contrast, responsive/static compact tests | Keyboard/screen reader/200% |
| H-02 | Explicit empty/stale/conflict/partial/permission/validation guidance | UX review |
| H-03 | Two-migration apply/rollback preservation test | Platform backup approval |
| H-04 | POD/named-owner pure tests, denial wiring, immutable triggers | Independent live IDOR retest |

## Changed implementation and automated evidence

- Contracts/calculation: `flight-board/lib/work-economics.ts`, `work-economics-validation.ts`
- Server/storage: `worker/api.ts`, `worker/authorization.ts`, `db/schema.ts`, migrations `0005` and `0006`
- Human UI: `app/page.tsx`, `app/globals.css`
- Tests: work-economics unit, security wiring, migration/rollback, accessibility/contrast, static responsive UI, authorization/rework dispatch, plus the existing application suite
- Governance: updated data inventory and dependency Security disposition

## Builder verification result

- `npm test`: 62 passed, 0 failed (production build, 10 static/UI/security tests, 52 TypeScript/API/domain/migration/accessibility/calibration tests).
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `uv run pytest tests/test_repository_contract.py -q`: 3 passed.
- `npm audit --json`: 0 critical, 2 high, 4 moderate; exact residual disposition is recorded separately and remains Security-owned.

## Residual blockers (not hidden)

- Independent Test Agent must retest the new exact revision, including live API denial/IDOR and provider projection queries.
- Named Security, Privacy/Legal, Product Designer, Platform/Ops, Product Lead, Tech Lead, and independent-reader rulings remain absent.
- Product Designer must perform keyboard, screen-reader, timezone, narrow-screen, and 200% zoom checks; automated axe/contrast does not replace them.
- Security must accept or reject the dependency reachability disposition. If rejected, Gate 3 stays blocked until a safe upstream/framework remediation exists.
- The mandatory default-closed 24-hour cooling-off begins only after an independently verified build. No release action has occurred.
