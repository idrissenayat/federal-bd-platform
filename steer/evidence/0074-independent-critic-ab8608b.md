# Issue #74 / PR #75 — Independent Gate 3 Critic Review

**Ruling: BLOCK**

**Review role:** Independent Critic; no Builder evidence was accepted on assertion alone

**Candidate implementation:** `ab8608b3bc9f6f1880c5b32dd3293b2ab7a1a3d5`

**Evidence HEAD:** `22bb40184cc000a70c1c6bc90c115b0aed13edc2`

**Review date:** 2026-08-19

## 1. Scope and exact authority reviewed

| Artifact | Exact reviewed value | Independent result |
|---|---|---|
| Gate 1 Brief pre-signature revision | `e1644ff3421800423e90980929fa4eac3c64f1e1` | Commit exists; exact approved body verified |
| Gate 1 Brief SHA-256 | `fbd22ba38942a4098b727d3c88ebde92b336f1879a5b73ef4cb9c9bc6d0ac6e5` | Match |
| Gate 1 owner approval | PR comment `5347663378`, 2026-08-19T20:32:48Z | Exact revision/hash approved; authority limited to preparing the Exam |
| Gate 2 Exam pre-signature revision | `1b8ad059a8ee2a4a94c7828bc617d4909a52813c` | Commit exists; exact approved body verified |
| Gate 2 Exam SHA-256 | `a407773a621ee75421201a6bd5673024eee4d9f3d8f929cf50bf1740850709c6` | Match |
| Gate 2 owner approval | PR comment `5347701887`, 2026-08-19T20:36:41Z | Exact revision/hash approved; authority limited to implementation and owner-only staging verification |
| Runtime implementation target | `ab8608b3bc9f6f1880c5b32dd3293b2ab7a1a3d5` | Exists and is the reviewed runtime target |
| Evidence HEAD | `22bb40184cc000a70c1c6bc90c115b0aed13edc2` | Exists; descendant of runtime target |
| Evidence packet | `steer/evidence/0074-staging-verification-ab8608b.md` | SHA-256 `64900cf94ca3505de3cbc963619185c832a26fbf97482f26d16b4b84b7bd96b8` |
| Hosted ledger | `steer/evidence/0074-hosted-case-ledger-ab8608b.json` | SHA-256 `d9bc97e9cc6a8e00a828425d2127e3ec2d9b48394890083880d9a66e2b6da1c7`; match |

The ancestry is linear for the reviewed authority and candidate: Gate 1 Brief revision → Gate 2 Exam revision → runtime target → evidence HEAD. The evidence-only range adds the packet and hosted ledger; it does not change the runtime implementation. The final diff touches authentication/authorization, governance, persistence, accessibility-facing UI, and telemetry. The Brief declares corresponding risk domains, and issue #74 remains default-closed regardless of narrower classification arguments.

This Critic report is documentation-only. Its commit does not change, re-freeze, or bless the implementation candidate.

## 2. Executive conclusion

The exact approved Brief, Exam, candidate, evidence revision, and ledger digest are authentic, local proportional tests pass, the canonical staging metadata is coherent, and production has not been changed. Those are necessary but not sufficient.

The release-readiness proof is not acceptable for Gate 3. The claimed 30 hosted cases and 100-request concurrency result exercise a staging-only synthetic evaluator whose caller supplies derived risks, server time, signer attributes, and drift field. They do not traverse the real snapshot, intent, proof, finalization, or Gate-effect paths. The canonical staging database independently confirms zero real verification receipts, readiness snapshots, readiness events, countersignatures, and decision intents. The real implementation also does not freeze and enforce the candidate Builder against the later decision-intent submitter, recompute the full frozen authority on drift, or bind every required authority field explicitly through the intent/envelope/events. Required UI/accessibility states, exact telemetry deltas, and a real in-flight rollback proof are absent.

Accordingly, Gate 3 is **BLOCKED**. No merge, release, production policy activation, or issue closure is authorized by this report.

## 3. Acceptance mapping

`PASS` means independently demonstrated for the reviewed scope. `PARTIAL` means useful implementation or test evidence exists but the frozen requirement is not completely demonstrated. `FAIL` is release-blocking unless explicitly described otherwise.

| Requirement | Result | Independent assessment |
|---|---|---|
| RR-01 policy activation and conflict handling | PASS | Staging has exactly one active v1 policy with the approved Exam URL/hash and expected policy digest; local policy/digest tests pass. Production has no issue #74 activation. |
| RR-02 deterministic risk classification | PARTIAL | Deterministic library behavior and representative tests exist, but hosted evidence covers only representative synthetic tiers, not the full allowlist, ordering, duplicate, and conflict denominator through the real path. |
| RR-03 fail-closed missing/malformed/mismatched classification | PARTIAL | Local missing/malformed/mismatch tests pass. Hosted cases are synthetic and do not prove persisted, real endpoint behavior across the frozen denominator. |
| RR-04 exact candidate and Critic binding | FAIL | Snapshot creation checks digest syntax and implementation commit against the latest review, but does not independently resolve every supplied Brief/Exam/candidate-manifest byte and omits the Critic assignment identity. Hosted evidence does not use a real Critic record. |
| RR-05 signed staging verification receipt and trusted time | PARTIAL | Signature and receipt validation logic exists. Canonical D1 has zero real verification receipts; hosted cases accept caller-supplied `server_now`, so clock authority and Git/client-clock negatives are not demonstrated end to end. |
| RR-06 canonical immutable snapshot | PARTIAL | Canonical serialization, hashing, and update/delete guards exist. The frozen object omits Builder and Critic-assignment identity, and no real staging snapshot or database-tamper case demonstrates the complete contract. |
| RR-07 fresh decision session | PARTIAL | Server-side session checks exist in the real intent/finalization flow. Synthetic boundary cases never exercise a real session or finalization. |
| RR-08 default-open boundary | PARTIAL | Exact library boundary logic is tested. No hosted real finalization establishes HTTP 409 before the boundary, success at it, and exactly one Gate effect. |
| RR-09 elevated tier separation and countersignature | FAIL | The code excludes the snapshot freezer and a role string containing `Builder`; it does not freeze the candidate Builder or prohibit a qualified countersigner from later becoming the intent submitter/finalizer. |
| RR-10 default-closed issue #74 behavior | PARTIAL | The 24-hour boundary and explicit finalization model exist, but no real issue #74 snapshot/intent/proof/finalization run demonstrates fail-closed release behavior and one Gate effect. |
| RR-11 team-mode required roles and separation | FAIL | Role presence is checked, but candidate Builder and later submitter separation is not frozen/enforced. Synthetic `TEAM_COMPLETE` data is not a real membership/countersignature flow and does not cover the actual issue #74 domain set. |
| RR-12 no automatic ripening | PASS | Readiness becoming time-eligible does not itself release; a fresh explicit finalization is required and local tests exercise this invariant. |
| RR-13 full snapshot/intent/envelope/event binding | FAIL | The digest is carried, but risk-policy version, resolved tier, selected path, delay, trusted verification time, earliest effective time, and required roles are not all explicit in every intent, issuer envelope, proof, and finalization event as required. |
| RR-14 tamper resistance and replay | PARTIAL | Hash/signature/replay checks and immutable update/delete guards exist. The incomplete authority object and absence of real database/request tampering cases prevent acceptance. |
| RR-15 exact drift invalidation | FAIL | Real reevaluation compares only work-item revision and latest review ID/evidence SHA. It does not recompute every frozen Brief, Exam, implementation, build, migration, runtime policy, receipt, domains, Critic, role, and mode field, nor record exact changed field plus old/new digests. |
| RR-16 100-way concurrency, crash, and one-effect proof | FAIL | The ledger sends 100 requests to one synthetic case identity: 98 authoritative responses, 2 transport failures, one create, and a retry. It does not send 100 identical requests for snapshot, intent, proof, and finalization, verify one Gate effect, or cover crash points before/after every write. |
| RR-17 authentication, POD scope, and authority | PARTIAL | Real endpoints require authenticated human/POD context. Hosted cases do not exercise the real negative matrix, and the staging-only signer lookup is not itself POD-bound. |
| RR-18 eight required UI states | FAIL | The UI exposes policy/readiness status and polls at the required broad cadence, but lacks an actual countdown, completed-control list, and exact changed-field reset reason/next action. No real snapshot exists to render all eight frozen states. |
| RR-19 accessibility and exact 200% evidence | FAIL | Generic keyboard/320px claims and a prose true-200% observation do not constitute the required eight-state accessibility matrix. There is no issue #74-specific axe result, durable screenshot/digest, screen-reader state proof, or complete focus trace for all states. |
| RR-20 telemetry | FAIL | Metric definitions exist, but live D1 contains only `steer_release_hosted_case_total` for synthetic cases. Required per-control deltas, classification outcomes/errors, exact drift reasons, countersignature/finalization outcomes, and timing evidence from real flows are absent. |
| RR-21 policy/docs consistency | PASS | Gate/solo/guardrail documents and the policy fixture are aligned; the exact runtime-policy digest test passes. |
| RR-22 backwards compatibility | PARTIAL | The migration default and legacy intent path preserve the prior 24-hour behavior in local tests. The hosted matrix contains no real legacy export or issue #70 compatibility run. |
| RR-23 regression and unrelated retention defect | PARTIAL | A fresh local full Flight Board suite passed, as did Python/gauntlet checks. GitHub CI does not run the Flight Board npm suite. Issue #76 is a real same-millisecond dispatch-retention ordering defect, but it is in a separate subsystem and did not reproduce in this fresh full run; it is not independently a #74 release blocker. |
| RR-24 rollback and in-flight fail-closed behavior | FAIL | The ledger records aggregate table/row hashes around a Sites version rollback. It does not carry a real pending intent through rollback, and the prior version’s 401 at the synthetic endpoint is not in-flight fail-closed proof. No per-table identity projection or committed schema rollback artifact is supplied. |
| RR-25 durable hosted case ledger | FAIL | The 27 synthetic API observations plus 3 rollback assertions total 30 rows, but do not cover RR-01..RR-24. Exact D1 projections, immutable activity/events, telemetry deltas, actual lifecycle requests, and legacy/UI cases are absent. |
| RR-26 production boundary and post-deploy verification | PASS (pre-release boundary only) | Production remains on its pre-issue version/environment/schema and has no issue #74 variables or tables. Post-production smoke and closeout are not yet applicable and are not authorized. |

### Nonfunctional requirements

| Area | Result | Assessment |
|---|---|---|
| Security/authorization | FAIL | Builder-versus-submitter authority is not bound; full authority tamper coverage is absent. |
| Privacy/data minimization | PASS | No new dependency or new sensitive telemetry label was identified; persisted readiness objects are principally IDs, roles, digests, and governance state. |
| Accessibility | FAIL | Required eight-state and exact 200% durable evidence is missing. |
| Telemetry/observability | FAIL | Required real-flow metric deltas and full timing evidence are missing. |
| Immutability/idempotence | PARTIAL | Update/delete guards and local replay tests exist; full write-path/crash/concurrency proof does not. |
| Server-side bounds | FAIL | New receipt/object/request surfaces are not uniformly strict-schema/size bounded; `effective_not_before` accepts broadly parseable timestamps; countersign reason lacks a maximum. |
| Timing budgets | FAIL | Claimed worker-read p95 is under 500 ms, while gateway wall time is much higher; no snapshot-creation p95 evidence demonstrates the 1,000 ms requirement. |
| Migration/rollback | FAIL | Forward migration and compatibility checks exist, but an exact committed schema rollback artifact and real in-flight rollback proof do not. |
| Backwards compatibility | PARTIAL | Local compatibility is credible; hosted legacy-path verification is absent. |

## 4. Findings and minimal closure

### F1 — BLOCKER: candidate Builder and intent submitter separation is not an enforceable frozen invariant

The snapshot has no candidate-Builder identity. Countersigning rejects the snapshot creator and a current role string containing `Builder`, but a qualified countersigner may later submit/finalize the decision intent. This can satisfy elevated or team countersignature rules without the required separation from the actual Builder and submitter.

**Minimal closure:** add the exact candidate Builder and intended submitter authority to the canonical snapshot/intent contract; enforce distinct immutable identities at countersign and finalization; validate current enrolled human, POD, and exact role membership server-side; add negative and race tests through the real hosted APIs.

### F2 — BLOCKER: the hosted denominator and concurrency proof are synthetic

`runStagingReadinessCase` builds a fabricated snapshot from caller-provided derived risks, clock, signer properties, and drift field. Its drift result is selected directly from that field. The 100-request run targets one synthetic case endpoint, not snapshot, intent, proof, finalization, or Gate effect identities. Canonical staging D1 has zero rows in the five real lifecycle tables inspected.

**Minimal closure:** run the frozen matrix through the actual authenticated snapshot, intent, proof, countersignature, finalization, history, and Gate-effect endpoints. Execute at least 100 identical concurrent requests for every required identity, inject crash points before and after each write, and prove one authoritative row/event/Gate effect with exact D1 projections.

### F3 — BLOCKER: full drift and authority recomputation is absent

Real readiness reevaluation observes only the work-item update timestamp and latest Critic review ID/evidence SHA. It cannot detect or precisely explain drift across the complete frozen Brief, Exam, implementation, build, migration set, runtime policy, verification receipt, risk domains, Critic assignment/result, required roles, or operating mode.

**Minimal closure:** independently resolve and recompute every frozen authority input on each protected read/finalization; invalidate pending state and fresh sessions on any change; persist content-safe exact field codes and old/new digests in immutable history; exercise every drift field through real hosted mutations.

### F4 — BLOCKER: authority is not fully bound through intent, proof, envelope, and events

The snapshot digest is propagated, but the required explicit policy version, tier, path, delay, verification time, earliest effective time, and roles are not bound in every downstream object/event. Brief and Exam revisions/digests are accepted as syntactically valid client values rather than resolved against the approved exact bytes.

**Minimal closure:** resolve approved Brief/Exam bytes server-side; bind the full frozen authority both by digest and explicit fields in intent, issuer envelope, every proof, and finalization event; reject all mismatches and add independent tamper/replay cases.

### F5 — BLOCKER: required operator UI and accessibility proof is incomplete

The page does not provide the required live countdown, completed-control list, or exact invalidated field/reason and next action. The durable evidence does not demonstrate all eight required states, issue-specific axe coverage, screen-reader behavior, contrast, complete focus order, 320px rendering, and true browser 200% with a verifiable artifact.

**Minimal closure:** implement every missing UI disclosure and capture all eight states against real server records; attach reproducible axe, keyboard/focus, screen-reader, contrast, 320px, and true-200% artifacts with hashes.

### F6 — BLOCKER: telemetry, timing, rollback, and ledger identity evidence is insufficient

Only the synthetic hosted-case counter appears in live D1 for this exercise. The rollback proof uses aggregate counts/hashes, and its “in-flight” case is merely a prior runtime returning 401 at the staging-only endpoint. There is no real pending intent, exact per-table projection, snapshot-creation p95, or committed schema rollback artifact.

**Minimal closure:** record before/after required metric deltas from real flows; demonstrate both timing budgets with defined start/end clocks and sample sets; carry a genuine pending intent through rollback/restore and prove fail-closed behavior; publish exact identity-preserving D1 projections for all pre-existing and new rows; commit and test the approved schema rollback artifact.

### F7 — MEDIUM: repository CI does not exercise the Flight Board suite

The only GitHub check at the evidence HEAD is the green `repository-contract` workflow. It runs repository, Python, secret, dependency, and static-analysis checks but not the Flight Board npm build/tests/typecheck/lint. A fresh local run is green. Issue #76 should remain separately tracked; it becomes a #74 concern only if the release regression suite cannot be made repeatably green.

**Minimal closure:** add the Flight Board build, test, typecheck, and lint commands to required CI and obtain a clean exact-candidate run; close or explicitly risk-accept issue #76 under its own authority.

## 5. Independent commands and results

All local commands were run from the issue #74 worktree against the stated revisions.

| Check | Result |
|---|---|
| `git cat-file`, ancestry, and runtime-to-evidence diff inspection | All four revisions exist; expected ancestry; evidence range contains packet and ledger only |
| `shasum -a 256` on approved Brief and Exam bodies | Exact supplied hashes match |
| `shasum -a 256 steer/evidence/0074-staging-verification-ab8608b.md` | `64900cf94ca3505de3cbc963619185c832a26fbf97482f26d16b4b84b7bd96b8` |
| `shasum -a 256 steer/evidence/0074-hosted-case-ledger-ab8608b.json` | `d9bc97e9cc6a8e00a828425d2127e3ec2d9b48394890083880d9a66e2b6da1c7` |
| `npm test -- --runInBand` in `flight-board` | PASS: build, 33 UI-source tests, 143 TypeScript tests |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `uv run pytest -q` | PASS: 16 tests |
| `bash scripts/gauntlet.sh` | PASS: 35 pass, 1 expected SAM credential warning, 0 fail |
| `npm audit --json` | 6 pre-existing findings: 2 high, 4 moderate; no dependency change in this candidate |
| GitHub PR/check inspection | PR #75 remains draft/open; exact evidence HEAD; `repository-contract` run `32314068575`, job `96262675426`, green |
| Ledger structure/content recomputation | 27 synthetic API observations + 3 rollback assertions; hashes internally match; coverage claims do not match the frozen end-to-end denominator |
| Source inspection | Confirmed synthetic case construction, incomplete authority binding/drift, separation defect, UI gaps, telemetry definitions, migration behavior |
| Authenticated read-only staging inspection | Version 31/env revision 20 active; expected source/build/migration/policy values; owner-only access; real lifecycle tables empty |
| Authenticated read-only production inspection | Version 36/env revision 1 unchanged since 2026-08-18; 34-table pre-issue schema; no issue #74 variables/tables |

The local `npm audit` findings are inherited and should remain tracked, but they are not introduced by this candidate and are not the basis of this ruling.

## 6. Canonical staging and production boundary

### Canonical owner-only staging

- Project: `appgprj_6a83763dc1148191b439c0795aa86a1c`
- Active version/environment: version 31 / environment revision 20
- Source revision: `ab8608b3bc9f6f1880c5b32dd3293b2ab7a1a3d5`
- Build SHA-256: `c8ae968b12788686668f4693d6bdcfb4794bdffaf639c8c185b611282b5e3f5f`
- Migration-set SHA-256: `925f5eb1e059e60aca7bf6862aa6c067359f1124726497274ca79df9eea7c59a`
- Runtime-policy SHA-256: `8ceebba72c401d6cb28a05b549554534a4f4d8dbd38b03f6229bd2a1d17b0706`
- Access: custom owner-only, one owner, no external visitors
- D1: 50 tables; exactly one active v1 issue #74 policy; 52 synthetic case rows (25 earlier plus 27 claimed)
- Real lifecycle row counts: zero verification receipts, zero readiness snapshots, zero readiness events, zero countersignatures, zero decision intents
- Relevant live telemetry: synthetic `steer_release_hosted_case_total` observations only
- Version rollback and restore deployments succeeded, but do not establish a real in-flight intent invariant

### Production non-mutation boundary

- Project: `appgprj_6a7ce092d7608191b97e3becd405c373`
- Active version/environment: version 36 / environment revision 1
- Last update predates issue #74 staging activity (2026-08-18)
- Environment contains only the prior dispatch configuration; no issue #74 release-readiness variables
- D1 remains at 34 tables with no readiness, verification-receipt, or staging-case tables
- Access remains owner-only

No production mutation was observed or performed. This review performed no deployment, policy activation, release, merge, issue closure, or production write.

## 7. Final recommendation

**BLOCK Gate 3.** The bounded remediation is exactly the closure listed in F1–F6, followed by a fresh independent Critic review of a new immutable candidate/evidence pair. F7 should be closed or explicitly dispositioned before release, but issue #76 is not by itself the reason for this BLOCK.

Until that review passes, keep PR #75 draft/open, keep issue #74 default-closed, do not activate production policy, and do not merge, release, or close the issue.
