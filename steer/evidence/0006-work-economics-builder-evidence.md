# Builder rework evidence — 0006 Work Economics

**Work item:** STR-017

**Controlling Exam:** `steer/exams/0006-work-economics.md` at approved revision `65c9dcb209a6`

**Trigger:** final independent Test Agent retest at branch revision `b64e4c1bc300871b4dada8b3296ab1dfa58938fd`, recorded in `steer/evidence/0006-work-economics-test-agent-final-retest.md`

**Boundary:** implementation/test evidence only. Independent retest, Critic, specialists, cooling-off, Gate 3, merge, deploy, and release remain blocked.

## Corrective result by finding

1. Exact recursive allowlists reject unknown nested keys, email values, unapproved role strings, duplicate event IDs, non-integer attempts/tokens/event counts, invalid dates/numbers, and person/ranking keys. Safe bootstrap/audit reads suppress malformed legacy JSON.
2. Every item-ID route now resolves through authenticated POD membership before reading or mutating state. General item update, dispatch, Work Economics, review, workflow, decision, code-review, and notification denial paths are dynamically tested; denial events contain no submitted prior/replacement payload.
3. `delivery_owner_id` and `outcome_owner_id` bind acceptance/verification. Dispatch parses the exact Forecast schema, compares the opaque owner IDs, evaluates the current forecast, and rejects unknown, stale, late, at-risk, or reforecast-required records.
4. Scope title/description, owner, phase/state/blocker, milestone/action, evidence/dependency/test, workflow, priority, gate decisions, rework, and resubmission trigger immutable reforecast evidence. Completion and likely-window variance are server-derived from workflow activity whether actuals arrive before or after completion.
5. Every compact view now shows value, effort range, completion window/state/confidence, next milestone/time, last update, and outcome at a 12px minimum.
6. Each of all four governed records, including Actual correction, independently renders its AI advisory/evidence/drivers/omissions and human acceptance/edited state adjacent to the record. Absent advice is explicit and never fabricated.
7. Per-role human facts, per-provider facts with retained conflict reasons, duration categories, and separately queryable rework/defect/rollback events are normalized into D1 projections while immutable record history remains intact.
8. Gate 1 requires evidence that the server resolved, fingerprinted, and bound to an immutable 40-character Git revision. A governed monetary mode and monetary-language fail-safe require currency/period/assumptions. Comparable-history facts are replaced with a server-known current-POD/current-work-type distribution or rejected when the cohort is insufficient.
9. Route-level axe reports zero serious/critical findings on the rendered Work Economics surface. Automated endpoint contrast is >=4.5:1; compact text is >=12px. Human keyboard/screen-reader/200% checks still require the Product Designer.
10. Audit still reports two high and four moderate dependency findings. `0006-dependency-security-disposition.md` records reachability and safe alternatives; an authenticated Security ruling remains mandatory.

Final-retest corrections:

11. Monetary mode now uses an explicit currency-unit alias registry and fails closed unless the native value unit resolves to the declared currency. For example, `milliseconds` with `USD` and `EUR` with `USD` are rejected, while `US dollars` with `USD` is normalized and accepted.
12. `work_items.work_type` is a persisted, indexed taxonomy field separate from the STEER/Control workflow treatment. Service-level cohorts are now exact same-POD/same-work-type completed items; `Unclassified` records cannot form a cohort.
13. POD FlowPulse exposes every contributing WIP item's owner, next milestone, next target, completion range, confidence, and last forecast update, including the next expected item.
14. While authoritative item state is `blocked`, the server binds `blockedSince` to stored state and rejects attempts to clear the unblock owner, unblock action, or cannot-forecast dependency. Valid replacements retain both prior and replacement audit evidence.

Should-fix corrections: pull forecast returns every contributing WIP item/window; gate waits model agent completion and human target separately; permission/conflict/partial/unavailable states name the owner and corrective action; D1 triggers prohibit audit event update/delete; `Rework` is no longer incorrectly treated as an execution hold after the human starts it.

## Exam map

| ID | Automated/system evidence | Remaining human authority |
|---|---|---|
| A-01 | Separate schema/JSON/UI records; UI static test | Independent reader |
| A-02 | Nullable migration, safe reads, forecast unit tests | — |
| A-03 | Advisory/acceptance UI; named-owner/POD tests | Product/Tech review |
| A-04 | Prior/replacement events + D1 immutability trigger test | Platform privilege review |
| B-01 | Exact value schema + Gate 1 fail-closed test | Product ruling |
| B-02 | Verified URL, assumptions, explicit compatible currency-unit registry, and monetary semantics validation | Product/Legal ruling |
| B-03 | AI driver/evidence/omission/acceptance rendering test | UX review |
| C-01 | Per-role/per-provider range schemas and projections | Delivery review |
| C-02 | Separate calendar/effort fields and UI test | — |
| C-03 | Persisted `work_type` taxonomy is separate from workflow treatment; dynamic API test rejects fabricated/cross-type cohorts and derives exact same-POD/work-type distribution | Calibration review after cohort |
| C-04 | No conversion/score code; anti-ranking tests | Independent review |
| C-05 | Exact-schema/current-state named-owner dispatch tests reject stale/late/reforecast records | Tech Lead |
| D-01 | Complete ForecastSummary used in all named views; POD pulse renders each contributor's owner, milestone, target, range, confidence, and last update | Narrow/200% human check |
| D-02 | Phase-exit fields/UI | — |
| D-03 | State/reason unit tests | — |
| D-04 | Expanded material-change tests and server hooks | Independent API retest |
| D-05 | Stale/missed-milestone tests | — |
| D-06 | Blocked/unblock/dependency schema, authoritative blocked-time binding, fail-closed replacement controls, and immutable replacement audit test | Workflow UX review |
| D-07 | Separate agent-complete/human-target fields and reason | Human gate review |
| D-08 | Dynamic actuals-after-completion test proves workflow-derived time and recomputed variance | Calibration review |
| E-01 | Pull range/item/confidence/freshness tests | — |
| E-02 | Missing owner/no invented date test | — |
| E-03 | WIP-authoritative behavior; no queued committed start | Delivery review |
| E-04 | Full contributor/range test + UI disclosure | — |
| F-01 | Human/provider/duration/delivery-event projection tables and migration/query test | Platform query review |
| F-02 | Strict provider facts plus queryable retained conflict provenance | Provider operations review |
| F-03 | Recursive anti-person tests, aggregate allowlist, POD scope | Privacy ruling |
| G-01 | No completion-to-value synthesis | Product review |
| G-02 | Exact outcome schema + named-owner authority + server-resolved immutable evidence | Outcome owner |
| G-03 | No ROI/ratio; monetary assumptions fail closed | Product/Legal ruling |
| H-01 | Route axe, contrast, responsive/static compact tests | Keyboard/screen reader/200% |
| H-02 | Explicit empty/stale/conflict/partial/permission/validation guidance | UX review |
| H-03 | Two-migration apply/rollback preservation test | Platform backup approval |
| H-04 | In-memory dynamic API tests cover cross-POD update/dispatch/economics/review/workflow/decision/code-review/notification denial | Independent live IDOR retest |

## Changed implementation and automated evidence

- Contracts/calculation: `flight-board/lib/work-economics.ts`, `work-economics-validation.ts`
- Server/storage: `worker/api.ts`, `worker/authorization.ts`, `db/schema.ts`, migrations `0005`, `0006`, `0007`, and `0008`
- Human UI: `app/page.tsx`, `app/globals.css`
- Tests: work-economics unit, security wiring, migration/rollback, accessibility/contrast, static responsive UI, authorization/rework dispatch, plus the existing application suite
- Governance: updated data inventory and dependency Security disposition

## Builder verification result

- `npm test`: 74 passed, 0 failed (production build, 11 static/UI/security tests and 63 TypeScript/API/domain/migration/accessibility/calibration tests).
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `./scripts/run-semgrep.sh`: 252 rules on 143 tracked targets, 0 findings (one generated snapshot over 1 MB skipped by the repository policy).
- `uv run pytest tests/test_repository_contract.py -q`: 3 passed.
- `npm audit --audit-level=critical`: command passed at the configured threshold; report remains 0 critical, 2 high, 4 moderate. Exact non-reachability evidence and unsafe proposed downgrade paths are recorded separately and remain Security-owned.

## Residual blockers (not hidden)

- Independent Test Agent must retest the new exact revision, including live API denial/IDOR and provider projection queries.
- Named Security, Privacy/Legal, Product Designer, Platform/Ops, Product Lead, Tech Lead, and independent-reader rulings remain absent.
- Product Designer must perform keyboard, screen-reader, timezone, narrow-screen, and 200% zoom checks; automated axe/contrast does not replace them.
- Security must accept or reject the dependency reachability disposition. If rejected, Gate 3 stays blocked until a safe upstream/framework remediation exists.
- The mandatory default-closed 24-hour cooling-off begins only after an independently verified build. No release action has occurred.
