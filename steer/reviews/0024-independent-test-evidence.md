# Independent Test evidence — STR-024 Gate 2 Exam

**Recommendation:** `BLOCK` for Gate 2 readiness

**Review role:** independent STEER Test Agent

**Review time:** 2026-08-15T20:45:23Z / 2026-08-15T16:45:23-04:00

**Target Architect commit:** `df0cdde2e1916062c239fa3867588a855f9b691b`

**Target Exam blob:** `d211c6c7aa69a75d58b005feccbd394d53d74d16`

**Frozen Brief commit:** `5c0db389d1b0e9fa492a33930febcf4d1c067cb0`

**Frozen Brief blob:** `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`

**Test branch:** `codex/str024-independent-test-20260815204050`

**Authority boundary:** evidence-only review; no Brief, Exam, operating-model,
implementation, gate-state, app-data, deployment, merge, release, closure, or PR
authority was exercised.

## Test identity and evidence limits

This review ran in a fresh dedicated worktree whose initial `HEAD` was the exact
Architect commit. The execution surface identified this reviewer as a dedicated Codex
test-agent task acting in the STEER Test role. It did **not** expose a durable STEER
`run_id`, distinct platform-agent principal, agent configuration revision, instruction
digest, exact model/provider identifier, or tool-policy snapshot. Those fields are
reported missing rather than invented. This evidence therefore proves the Git and test
work below, but it is not itself proof that a named platform agent was technically
distinct from its Codex runtime host.

Local tool snapshot: Git 2.39.5, uv 0.12.3, Python 3.12.13, Node 20.19.4, npm 10.8.2,
gitleaks 8.30.1, OSV-Scanner 2.5.0, and Semgrep 1.172.0.

## Frozen artifact and Architect evidence verification

| Check | Result | Independent evidence |
|---|---|---|
| Exact starting revision | PASS | Initial `HEAD` was `df0cdde2e1916062c239fa3867588a855f9b691b`; `origin/codex/str024-architect` resolved to the same commit. |
| Exact Architect base | PASS | The sole parent of `df0cdde` is `5c0db389d1b0e9fa492a33930febcf4d1c067cb0`. |
| Brief byte identity | PASS | Current and frozen-commit blobs both equal `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`; both are 17,786 bytes. |
| Architect scope | PASS | `5c0db389..df0cdde` adds only the STR-024 Exam and Architect evidence. No Brief, operating-model, implementation, app-data, or gate-state file changed. |
| Acceptance inventory | PASS | 40 unique IDs: AUTH 7, LIFE 9, EVID 7, BOOT 4, UX 4, MET 4, and NFR 5. No duplicate ID was found. |
| Brief-line traceability | PASS WITH BLOCKED TARGETS | All 15 numbered “done and correct” lines have mapped IDs. Some mapped IDs are not yet falsifiable because required policies, numbers, fixtures, or owners remain unfrozen; see the per-ID matrix. |
| Gate 1 provenance | BLOCK | The public issue contains only the 2026-08-15 Scout authorization with `Gate 1 pending` and “do not draft the Exam before Gate 1.” No authenticated exact-revision Gate 1 ruling was independently available. The frozen Brief itself still says `GATE 1: PENDING`. The Architect's statement that a Codex supervisor verified a private Work Management ruling is not independently reproducible and does not satisfy CORE-11/GATES durable exact-revision evidence. |
| Named Architect versus Codex authorship | BLOCK | The Markdown role label and Git author string `STEER Architect Agent` are self-asserted metadata, not authenticated run evidence. There is no `run_id`, principal/type record, execution/configuration snapshot, lifecycle trace, artifact-attribution event, or Codex-impersonation negative control for the Architect attempt. The output must not be counted as proven platform-agent performance. |
| Architect local-check claims | PASS WITH QUALIFICATION | The repository gauntlet, negative-control script, and scope/integrity checks were reproduced. “OSV clean” is accurate only for the gauntlet's `uv.lock` scan; an explicit Flight Board lockfile scan finds the already documented development/build advisories below. |

The content review confirms that the Exam strongly and explicitly separates the named
agent, adapter, Codex supervisor, and authenticated human; prevents Codex-authored work
from entering untouched-agent success/quality numerators; specifies authorized and
unauthorized emergency deliverable intervention; binds evidence and feedback to exact
run/output/configuration versions; keeps Buzz non-authoritative; enumerates human-only
priority/assignment/workflow/scope/forecast/outcome/gate/merge/release/closure powers;
and calls for bootstrap, impersonation-negative, replay, canary, rollback, and
per-agent/version quality/intervention/rework/rejection/defect/policy/cost/latency
measurement. The blockers below concern missing frozen or complete oracles and missing
provenance, not absence of those intended controls.

## Per-acceptance-ID test

Legend: `P` means the Exam text adequately addresses the dimension for Gate 2; `B`
means a missing decision, value, fixture, contract, or oracle prevents a deterministic
test. Columns are completeness (`C`), falsifiability (`F`), authority separation (`A`),
negative paths (`N`), evidence requirements (`E`), and Brief/guardrail traceability
(`T`). An ID is `BLOCK` if any dimension is `B`. “Negative path” may be satisfied by a
direct denial/race clause, the paired acceptance ID, and the mandatory attack list.

| Acceptance ID | C | F | A | N | E | T | Verdict | Test note |
|---|---:|---:|---:|---:|---:|---:|---|---|
| STR024-AUTH-001 | B | B | P | P | P | P | BLOCK | `AUTHORIZED` is called a durable state, but the minimum table starts from an “authorized dispatch” and jumps to `CREATED`; the required complete transition table is absent, so the exact committed state/event oracle is ambiguous. |
| STR024-AUTH-002 | P | P | P | P | P | P | PASS | Enumerates missing, forged, expired, cross-scope, stale, unassigned, held, non-executable, and Buzz-origin denial before side effects, with safe audit proof. |
| STR024-AUTH-003 | P | P | P | P | P | P | PASS | Concurrent and delayed replay share one immutable run and terminal effect; every attempt remains visible. |
| STR024-AUTH-004 | B | B | P | P | P | P | BLOCK | “Either permits ... or stops” allows opposing outcomes without a frozen revision-change policy stating which fields invalidate which mutations. |
| STR024-AUTH-005 | P | P | P | P | P | P | PASS | Explicitly covers UI/API/consumer/database enforcement and denies agent, adapter, Codex, forged-human, and stale-human principals for every named human-only power. |
| STR024-AUTH-006 | P | P | P | P | P | P | PASS | Confusable names, prompt claims, and borrowed human sessions cannot replace verified principal ID/type and scoped credentials. |
| STR024-AUTH-007 | P | P | P | P | P | P | PASS | Requires immutable agent/config/instruction/model/provider/runtime/adapter/tool-policy/input snapshot and digests, with secret/private/restricted exclusions. |
| STR024-LIFE-001 | P | P | P | P | P | P | PASS | Exact assigned principal wins a conditional claim/fence; other agents, Codex-as-worker, and losing requests are denied and audited. |
| STR024-LIFE-002 | B | B | P | P | P | P | BLOCK | Lease duration, stale threshold, fencing renewal, and the retry-versus-block recovery decision are not frozen. |
| STR024-LIFE-003 | B | B | P | P | P | P | BLOCK | Authentication/order/content oracles are clear, but heartbeat cadence, permitted skew, and rate bound have no exact values. |
| STR024-LIFE-004 | P | P | P | P | P | P | PASS | Safe phase/time/sequence/evidence output is observable and cannot mutate authority or imply success/human judgment. |
| STR024-LIFE-005 | B | B | P | P | P | P | BLOCK | Retry count, backoff schedule, jitter bound, retryable code set, and side-effect idempotency proof are not defined. |
| STR024-LIFE-006 | B | B | P | P | P | P | BLOCK | Failure classes are named, but the canonical reason/code taxonomy and owner/next-action mapping are absent, so a merely populated record could pass without correct classification. |
| STR024-LIFE-007 | B | B | P | P | P | P | BLOCK | Human stop precedence is stated, but safe boundaries, complete race ordering, pre-claim cancellation, and Codex safety-stop transitions are not defined in a complete table. |
| STR024-LIFE-008 | B | B | P | P | P | P | BLOCK | Revocation denial is clear; adapter health thresholds and the rule choosing hold, stale, or blocker are left “per policy.” |
| STR024-LIFE-009 | P | P | P | P | P | P | PASS | Late/duplicate/stale/malicious mutations cannot rewrite terminal evidence and human decisions remain separate. |
| STR024-EVID-001 | P | P | P | P | P | P | PASS | Exact run/attempt/worker/snapshot/lifecycle/artifact revision/digest/telemetry package is required; missing or cross-item evidence fails closed. |
| STR024-EVID-002 | P | P | P | P | P | P | PASS | Every artifact must identify agent attempt or separately labeled human/supervisor intervention; mixed/unknown work is excluded from autonomous performance. |
| STR024-EVID-003 | B | B | P | P | B | P | BLOCK | Required fields and unknown-versus-zero are strong, but the rate-card source/revision, cost calculation rule, and precise latency boundaries are not frozen. |
| STR024-EVID-004 | P | P | P | P | P | P | PASS | Feedback binds authenticated human, exact run/attempt/output/evidence and agent/config versions, time, category, reason, and requested change without rewriting history. |
| STR024-EVID-005 | B | B | B | P | B | P | BLOCK | Separate runs/roles/targets are required, but the scoring rubric is not frozen and the principal-independence rule does not explicitly prohibit Builder/Test/Critic identity reuse; “fresh-context” alone is not independent assurance. |
| STR024-EVID-006 | P | P | P | P | P | P | PASS | Corrections create immutable successor versions with rationale/predecessor and cannot improve prior metrics retroactively. |
| STR024-EVID-007 | B | B | P | P | B | P | BLOCK | Benchmark fixture/revision, baseline, promotion threshold, canary size/duration/stop rules, rollback owner/command, and recovery criteria are pending. |
| STR024-BOOT-001 | B | B | P | P | B | P | BLOCK | The required proof is correctly shaped, but no exact public/synthetic fixture, named agent/config/version, runtime policy, expected artifact, or evidence oracle is frozen. |
| STR024-BOOT-002 | P | P | P | P | P | P | PASS | Directly rejects or labels Codex deliverable edits/attestation and excludes them from untouched success, review-ready, first-pass, quality, and agent-authored evidence sets. |
| STR024-BOOT-003 | P | P | P | P | P | P | PASS | Requires prior exact-run human authority, full intervention delta/telemetry, supervisor-touch label, correct numerator exclusion, and denominator inclusion. |
| STR024-BOOT-004 | P | P | P | P | P | P | PASS | Unauthorized Codex deliverable work is denied and audited; non-deliverable platform repair remains separately scoped. |
| STR024-UX-001 | P | P | P | P | P | P | PASS | Buzz is an idempotent redacted outbox mirror with stable authority links; delay/outage cannot mutate authority or lose authoritative evidence. |
| STR024-UX-002 | B | B | P | P | P | P | BLOCK | State inventory is broad, but the exact work-item/run-panel surface, generic unexpected-error state, and per-state allowed/denied control matrix are not named. |
| STR024-UX-003 | B | B | P | P | B | P | BLOCK | Axe/focus/name/contrast/live-region outcomes are observable, but supported browser/screen-reader pairs, mobile viewports, reduced-motion procedure, and manual evidence format are missing. |
| STR024-UX-004 | P | P | P | P | P | P | PASS | Exercises markup, instructions, mentions, links, confusables, and secret-like values against tool/authority/script/mention/credential/link effects. |
| STR024-MET-001 | P | P | P | P | P | P | PASS | Covers the full lifecycle, feedback, evaluation, intervention, health, and denial event set with versions, IDs, ordering, denominators, and missingness. |
| STR024-MET-002 | B | B | P | P | B | P | BLOCK | Every requested per-agent/version metric is named, including intervention/rework/gate rejection/defects/policy/cost/latency, but exact eligibility and score/rubric denominator definitions are not frozen. |
| STR024-MET-003 | P | P | P | P | P | P | PASS | Explicit reconciliation prevents survivor filtering and excludes stopped/failed/touched/incomplete attempts from untouched success while retaining declared denominators. |
| STR024-MET-004 | B | B | P | P | B | P | BLOCK | It faithfully tests Brief thresholds and contrary cases, but cohort ID/start/end, accountable owner, threshold freeze, schema version, and baseline/feasibility ruling are absent. |
| STR024-NFR-001 | B | B | P | P | B | P | BLOCK | The Exam explicitly says missing load assumptions and p95 budgets block Gate 2; none are recorded. |
| STR024-NFR-002 | B | B | P | P | B | P | BLOCK | Required human data/retention/access/legal/backup ruling is absent. Production dependencies have zero known vulnerabilities, but the full Flight Board lockfile has the documented 2 high/4 moderate dev/build findings, so “dependency audit ... green” lacks a satisfied or waived oracle. |
| STR024-NFR-003 | B | B | P | P | B | P | BLOCK | Recovery behavior is sound in principle, but RPO/RTO, restore fixture/procedure, reconciliation oracle, rollback command/owner, and measured thresholds are not supplied. |
| STR024-NFR-004 | P | P | P | P | P | P | PASS | Applies the public/synthetic-only boundary to tests, bootstrap, benchmark, canary, logs, exports, and evidence with rejection/redaction of excluded data. |
| STR024-NFR-005 | B | B | P | P | B | P | BLOCK | Conformance dimensions are correct, but the versioned adapter contract/schema, enabled-adapter inventory, fixtures, expected export, and pass threshold are absent. |

**Per-ID result:** 20 `PASS`, 20 `BLOCK`. The `BLOCK` count is a Gate 2 design/readiness
result, not an implementation-test result; no STR-024 implementation exists at the
target commit and no implementation was authorized or exercised.

## Independent Brief-to-Exam traceability

| Brief “done and correct” line | Exam coverage | Trace result |
|---|---|---|
| 1. Authority and identity | AUTH-001..007 | PASS; AUTH-001/004 need the frozen transition/revision policy. |
| 2. Human/agent boundary | AUTH-005..006, BOOT-001..004 | PASS; Codex impersonation and emergency intervention are explicit. |
| 3. Durable lifecycle | AUTH-001, LIFE-001..009, MET-001 | PASS; complete state/transition table remains missing. |
| 4. Idempotency | AUTH-003..004, LIFE-005/009, UX-001 | PASS. |
| 5. Claim and lease | LIFE-001..003/008 | PASS; exact lease/health values remain missing. |
| 6. Heartbeat and progress | LIFE-002..004, UX-002 | PASS; heartbeat bounds remain missing. |
| 7. Retry and failure | LIFE-005..006/008, MET-003 | PASS; retry and classification policies remain missing. |
| 8. Stop and cancel | LIFE-007..009, BOOT-003..004 | PASS; race/safety-stop table remains missing. |
| 9. Evidence return | EVID-001..005, BOOT-001..003 | PASS; exact authorship controls are unusually strong. |
| 10. Provider/model portability | AUTH-007, EVID-003/006/007, NFR-005 | PASS; adapter contract/fixtures remain missing. |
| 11. Telemetry and learning | EVID-003..007, MET-001..004 | PASS; freeze artifacts remain missing. |
| 12. Accessibility and clarity | UX-002..004 | PASS; exact surface/support/evidence matrix remains missing. |
| 13. Security and privacy | AUTH-002/005..007, UX-004, NFR-002/004 | PASS; human data ruling and audit disposition remain missing. |
| 14. Rollout and rollback | EVID-007, LIFE-008, NFR-003 | PASS; canary/recovery/owner values remain missing. |
| 15. Falsifiable evaluation | MET-002..004 | PASS; cohort/rubric/denominators remain missing. |

## Repository, gauntlet, static, secret, and dependency checks

| Command/check | Result |
|---|---|
| `./scripts/gauntlet.sh` | PASS on the final staged evidence in 10 seconds: environment 35 pass / 1 expected missing-SAM-key warning / 0 fail; Ruff pass; mypy pass; pytest 3 pass; gitleaks no leak; `uv.lock` OSV no issue; Semgrep 252 rules / 130 tracked files / 0 finding. An earlier base run also passed in 12 seconds. |
| `./scripts/prove-gauntlet-blocks.sh` | PASS; planted synthetic secret and planted failing test were both blocked. |
| `npm ci && npm run lint && npm test` in `flight-board/` | PASS; lint clean, production build successful, render test 1 pass, TypeScript tests 27 pass. |
| `osv-scanner scan source --lockfile flight-board/package-lock.json flight-board` | QUALIFIED/BLOCK for NFR-002: 0 critical, 2 high and 1 medium advisories affecting two dev packages; npm expands the transitive esbuild chain to four moderate nodes. |
| `npm audit --omit=dev --audit-level=critical --package-lock-only --prefix flight-board` | PASS; 0 production vulnerabilities. |
| `npm audit --audit-level=critical --package-lock-only --prefix flight-board` | QUALIFIED: 6 dev/build vulnerabilities, 2 high and 4 moderate; matches `docs/security/DEPENDENCY-RISK-2026-08-13.md`, whose temporary exception is not a green full audit. |
| `git diff --check 5c0db389..df0cdde` | PASS. |
| Public issue/remote verification | PASS for public facts: issue #52 remains open; its only public comment is the Scout/Gate-1-pending handoff; frozen Brief and Architect branch refs match the two target commits. |

The missing SAM.gov credential is expected for this documentation-only offline review;
no secret was requested, displayed, or added. The existing dev/build advisories were not
introduced by the Architect documentation commit, but STR024-NFR-002 currently requires
a green dependency audit and does not define the accepted-exception behavior.

## Exact residual decisions and evidence required from humans

These are the remaining human decisions; the Test Agent makes none of them:

1. **Product Lead / Gate authority — Gate 1 provenance.** Record an authenticated,
   durable Gate 1 ruling with principal, role, timestamp, decision, and exact Brief
   revision `5c0db389...`; resolve the mismatch between that asserted ruling and the
   frozen Brief's `GATE 1: PENDING` audit line under GATES/CORE-11. Do not treat the
   Architect's supervisor statement as the approval record.
2. **Platform owner + Product/Tech authority — Architect provenance disposition.** Either
   rerun/re-attest Exam preparation through a named Architect principal with run ID,
   immutable agent/config/instruction/model/provider/runtime/adapter/tool-policy/input
   snapshot, lifecycle trace, and artifact digest, or explicitly rule that this document
   is human-reviewed evidence only and exclude the unproven attempt from all
   platform-agent/first-pass/quality numerators. Missing evidence cannot be backfilled by
   changing Git author text.
3. **Tech Lead — complete state machine.** Freeze the complete state/event/invalid-
   transition table, including `AUTHORIZED`, create/claim/start, pre-claim cancel,
   retry/exhaustion, adapter/credential revocation, lease loss, evidence-binding failure,
   human stop, Codex safety stop, terminal callbacks, and every stop/completion/retry/
   revocation/lease/evidence race with compare-and-set/fence precedence.
4. **Tech Lead + identity/platform owner — capability and worker policy.** Approve the
   endpoint/command/webhook/consumer inventory and exact auth method, credential scopes,
   claim conditions, lease/fence duration/renewal/skew, heartbeat cadence/rate, retryable
   code taxonomy, retry/backoff/jitter budget, failure reason/owner mapping, adapter
   health thresholds, and revision-change invalidation rules.
5. **Privacy/data owner — run-data ruling.** Freeze minimum fields, purpose, privacy
   classification/legal or policy basis where applicable, access roles, exact retention,
   deletion/revocation, audit owner/cadence, and backup/export treatment.
6. **Reliability owner + Tech Lead — numeric service/recovery budgets.** Record load
   assumptions and p95 budgets for creation/claim/heartbeat/progress/status/evidence;
   RPO/RTO, backup/restore and reconciliation oracles; gauntlet/load-smoke evidence;
   rollback procedure and command.
7. **Product/experiment owner + Test owner — frozen evaluation assets.** Freeze cohort
   ID/start/end/denominators, 90%/100% and zero-guardrail threshold disposition,
   metric-schema version, exact score rubric and eligibility definitions, benchmark and
   bootstrap fixtures/expected artifact, named agent/config version, baseline, rate-card
   source/revision, and accountable owner. State explicitly whether this is feasibility
   evidence because no observed STR-024 baseline exists.
8. **Product Lead + reliability/operations owner — canary and rollback.** Name canary
   size/duration/authorization, stop/rollback triggers, rollback owner, version rollback
   target, recovery criteria, and specialist owners; preserve runs/evidence/feedback/
   human decisions on rollback.
9. **Security/Tech owner — dependency oracle.** Reconcile NFR-002's “dependency audit
   ... green” with the current time-bounded dev/build exception: remediate, or record an
   exact authenticated acceptance/expiry/controls and clarify the Gate 2 pass threshold.
   Production and critical findings are currently zero; the full audit is not zero.
10. **Accessibility/design owner + Test owner — exact interaction matrix.** Name the
    work-item/run-panel surface, state-to-control permission matrix, generic error state,
    browser/screen-reader pairs, mobile viewports, keyboard/focus/live-region/reduced-
    motion procedure, and evidence format.
11. **Tech Lead / Gate 2 authority — Exam disposition.** After the missing values and
    evidence are part of the exact Exam revision, obtain a fresh-context Critic review,
    disposition each blocker explicitly, and record the authenticated Gate 2 ruling in a
    different session from Gate 1. This Test result is advisory and cannot approve it.

## Final recommendation

**Gate 2 readiness: BLOCK.** The Exam has strong coverage of the requested governed-run
boundary and all 40 IDs are traceable, but 20 IDs still lack a frozen deterministic
oracle. Gate 1 and named-agent provenance are not independently reproducible; the
complete state/capability policies and human privacy/performance/recovery/evaluation/
rollout decisions are absent; no fresh Critic evidence exists; and NFR-002's dependency
“green” condition is not presently satisfied by the full dev/build audit. No Gate 2
approval should be recorded until the exact residual decisions above are resolved and
bound to the exact revised Exam.
