# Issue #78 Dedicated Signal Backlog — Independent Critic Review

**Ruling: BLOCK**

**Reviewed at:** 2026-08-21T13:08:41Z

**Evidence HEAD:** `5e29125714fb371106c744bb5579f14b7b7e3329`

**Exact staged runtime:** Sites staging version 44, environment revision 28, source `2b2304035c8ab2efa5698c983d067baf330e9e91`

**Review role:** fresh independent Critic; no implementation, deployment, merge, Release, closure, or Gate 3 action was performed

## Executive ruling

The product slice is materially implemented and works on the canonical owner-only staging site: Signal Backlog is separate from Product Backlog, the live register exposes 70 authorized signals (66 Ready for review and 4 Needs attention), the bounded first page contains 25 rows, the existing signal workspace opens the authoritative original/provenance/failure view, all focused issue #70/#77/#78 tests pass, the index migration is additive, the exact rollback/restoration deployments succeeded, all nine signal-table rollback hashes match, and production remains untouched.

Gate 3 is nevertheless **BLOCKED** because the durable packet does not satisfy the frozen hosted-evidence contract for SB-02 through SB-15 and SB-17/SB-18. The packet contains prose summaries and an aggregate concurrency file, but not the required per-case ledger binding request identities, normalized parameter classes, response and D1 digests, count/page oracles, authoritative timestamps, telemetry deltas, protected projections, UI observations, and accessibility references. Required capture/refresh, same-timestamp, cursor/auth attack, stale-response, response-size, and query-plan evidence is not reconstructable from the committed artifacts. The SB-18 aggregate also lists `READY` as an exercised group while the frozen API accepts only `READY_FOR_REVIEW`; the same artifact claims every request returned HTTP 200. Those statements cannot simultaneously describe the frozen endpoint.

This is an evidence closure, not a recommendation to rebuild the feature. The implementation and rollback may be reused unchanged if a new exact-target ledger closes the findings below.

## Exact authority and ancestry

| Authority | Independently recomputed result |
|---|---|
| Gate 1 Brief pre-signature revision `f6e309f344ab96084f524df6d54f4c031f6ceb54` | SHA-256 `45eba1fe5908cfebd1820b8ec5eacbf1c2e9066a134bd1a434d30dea6a77fd3b` — match |
| Original Gate 2 Exam pre-signature revision `6cc3aa9818a72b10995095e32a643c6784c94b65` | SHA-256 `256b594ab0aa1465d4de04b1e4c67fa24452599e6c5d067acb921dceaf96f10e` — match |
| SB-19 amendment pre-signature revision `47c8ee5b1b34cc5462d8bcb5731a0c4dade3f6c1` | SHA-256 `03b2263d928fecb73bf2ddcf9aba5b3818ec2b77205f36fe6883a97671c6e453` — match |
| SB-16/SB-20 amendment pre-signature revision `44effe361d68a17eed81ef65803b5a629023eef7` | SHA-256 `155f5513beb464651ef23d153455a1a1a096047af9bd0023b9149b65f41f2e7b` — match |
| Gate approvals | Gate 1 and both amendments are bound to the exact revisions/hashes in the authenticated issue/task record; the original Gate 2 approval is preserved in the Exam and its authenticated governed task |
| Required predecessors | Issue #70 runtime/evidence/Critic and issue #77 runtime/evidence are all ancestors of the evidence HEAD |
| Runtime/evidence relationship | `2b2304035...` is an ancestor of `5e291257...`; after the runtime commit, the only Flight Board change is the deliberate hosting binding restoration from staging to production project metadata |

The final amendment is confined to SB-16 unreachable-state proof and SB-20 signal-scoped rollback. No fault injector, identity bypass, test-only product route, production branch, or product-code amendment was introduced by it.

## Independent hosted boundary verification

- Sites independently reports canonical staging as active, custom owner-only, exactly one allowed owner, zero external visitors, zero groups, version 44/source `2b2304035...`.
- The rollback deployment `appgdep_6a874fd6af7481918775036947344370` independently resolves to prior version 42/source `bfb2178c...`, status succeeded, environment revision 28.
- The restoration deployment `appgdep_6a87505130f081919f202668ed1b4f4b` independently resolves to version 44/source `2b2304035...`, status succeeded, environment revision 28.
- The live staging UI independently exposed Signal Backlog as a primary destination, Product Backlog as a distinct destination, the non-admission authority boundary, counts 70/0/0/66/4, a 25-row first page, Load more, and one named polite status.
- An independent bounded D1 read found exactly 70 signal rows: 66 `READY` and 4 `SAFE_FAILURE`; no signal content is reproduced in this report.
- One live Needs-attention row opened the existing authoritative signal workspace and exposed the preserved original plus honest safe-failure state without presenting it as a work item.
- Production independently remains active on version 36/source `8aa6e634c4b04f2198ec0941a7e8d5c7bee88d4f`, last updated before issue #78 staging activity. No production deployment or write was performed.

## Acceptance mapping

`PASS` means the frozen requirement is independently supported. `PARTIAL` means the implementation or isolated test is credible but the required hosted/durable proof is incomplete. `FAIL` is release-blocking.

| Acceptance | Result | Independent assessment |
|---|---|---|
| SB-01 navigation separation | PASS | Live navigation and source inspection confirm Signal Backlog/Product Backlog separation; the prior capped bootstrap register is removed. |
| SB-02 complete register | PARTIAL | Local 31-row/page-7 keyset test passes and live staging exposes 70 with continuation, but no durable per-page identities, response digests, or D1 oracle prove all 70 exactly once. |
| SB-03 same-time boundary | PARTIAL | The isolated API fixture passes five equal timestamps across a boundary; the packet contains no hosted same-timestamp cohort/result required by the delivery boundary. |
| SB-04 concurrent capture snapshot | FAIL | No committed capture/old-snapshot/refresh case or allowed-delta manifest exists. The packet does not prove that a post-snapshot capture is excluded then appears exactly once after refresh. |
| SB-05 authoritative counts | PARTIAL | Live counts match an independent 70-row lifecycle read, and isolated filter/count tests pass. Per-search/filter D1 projections and stable continuation count oracles are absent. |
| SB-06 lifecycle mapping | PASS | Closed server mapping, unknown-state failure, allowlisted attention reason, local tests, and live Ready/Needs-attention presentation agree. |
| SB-07 literal search | PARTIAL | Bounded literal-search implementation and focused tests pass; the frozen hosted adversarial cohort and its exact result digests are not committed. |
| SB-08 input rejection | PARTIAL | Closed parser and typed-error tests pass. The full hosted malformed/repeated/unknown matrix, response digests, and telemetry deltas are not durable. |
| SB-09 cursor binding/authorization | PARTIAL | Server POD scope and isolated cross-POD/unenrolled tests pass. The required hosted cursor replay and membership/POD-change evidence is absent; the SB-16 amendment does not amend SB-09. |
| SB-10 existing workspace | PASS | The exact hosted target opened the authoritative issue #70 workspace for a listed row; focused predecessor signal tests are green. |
| SB-11 capture discoverability | FAIL | No issue #78 hosted intake case, immutable append projection, zero-work/authority projection, old-snapshot result, refresh result, or allowed-delta ledger is committed. |
| SB-12 stale responses | PARTIAL | Abort and monotonic sequence guards exist in the staged source, but no focused automated race test or hosted case ledger demonstrates the frozen out-of-order matrix. |
| SB-13 honest states | PARTIAL | The amended SB-16 matrix covers eight presentation states, but malformed-query/server-contract and partial-cache cases are not bound to committed hosted case results. |
| SB-14 operational separation | PARTIAL | The GET route has no work/Gate/decision/assignment/dispatch mutation path and signal rollback hashes are stable. Per-read protected projections and telemetry deltas required by the hosted ledger are absent. |
| SB-15 telemetry privacy | PASS | Telemetry code writes only fixed metric/label enums and numeric values; it does not bind signal, query, cursor, user, POD, proposal, or free text. Focused source/security scans found no new secret or injection issue. |
| SB-16 accessibility | PARTIAL | The final amendment is valid; exact-source isolated eight-state render tests, explicit contrast ratios, live populated keyboard/focus semantics, 320-pixel, and true-200% summaries exist. The artifact does not preserve the required per-state agent-operation trace, full axe-clean result, or reproducible focus/screen-reader/viewport result for every state. |
| SB-17 performance/bounds | FAIL | Only aggregate p95 prose is committed. The required 30 case rows, visible/server timestamps, maximum response bytes, per-query results, and recorded D1 query plan are absent. |
| SB-18 concurrency | FAIL | The aggregate lacks the required per-case D1/telemetry/oracle bindings and names invalid group `READY` while claiming 100/100 HTTP 200. The closed API contract rejects `READY`; the valid enum is `READY_FOR_REVIEW`. |
| SB-19 reconciled regression | PASS via approved exception | Focused issue #70/#77/#78 tests pass 38/38; build, typecheck, lint, dependency audit, Semgrep, and diff-scoped gitleaks pass. The independent full suite produced 178/179 due issue #76. The same failure reproduced at approved predecessor `bfb2178...` on run 5 of 5, issue #76 is separately governed, and issue #78 changes only the signal route/UI/index/telemetry path. This report explicitly invokes the approved exception and does not repeat the packet's fully-green claim. |
| SB-20 signal-scoped rollback | PASS | Both provider deployments independently succeeded; exact before/during/after count and SHA-256 values match for all nine signal tables; target/prior source and environment bindings are exact; the additive index definition is present; source/runtime inspection shows no unrelated authority-write path; production remains untouched. |

## Derived domains and guardrails

The final diff derives `#security`, `#privacy`, `#a11y`, `#reliability`, and `#design-system`; all are already declared in the Brief. No missing domain tag was found. There is no new dependency or new personal-data field. The additive index is non-destructive.

Because this change adds an authorization-enforced endpoint, the later Gate 3 readiness service must treat the release as default-closed under the governing policy. This report neither creates nor satisfies a readiness snapshot.

Independent checks:

| Check | Result |
|---|---|
| Exact authority SHA-256 and ancestry | PASS |
| Focused #70/#77/#78 suites | PASS — 38/38 |
| Production build | PASS |
| Typecheck | PASS |
| Lint | PASS |
| Production dependency audit | PASS — 0 vulnerabilities |
| Semgrep on changed product surfaces | PASS — 0 findings |
| Gitleaks on issue #78 implementation commits | PASS — no leaks |
| Full repository suite | 178/179; approved SB-19 issue #76 exception applies as documented above |
| Live owner-only staging/version/source/access | PASS |
| Rollback and restore deployment identity/status | PASS |
| Production non-mutation | PASS |

## Blocking findings and minimal closure

### F1 — BLOCKER: the required exact-target hosted case ledger is absent

The four issue #78 evidence files are summaries or aggregates. They do not contain the frozen per-case fields needed to reconstruct SB-02 through SB-15 and SB-17/SB-18, and they omit complete `started_at`/`completed_at` boundaries.

**Minimal closure:** without changing product code, run one bounded exact-v44 verification and commit one content-safe ledger containing a row for every required case: request identity, normalized parameter class, authoritative timestamps, response digest, D1/count/page oracle digest, latency, telemetry delta, protected projection, UI state, and accessibility reference. Include the page-7 complete chain, equal-timestamp boundary, filter/search cohorts, invalid/cursor/auth matrix, workspace cases, stale-response races, and honest-state cases. Do not publish original signal text, search bytes, cursor bytes, identities, POD values, or private response projections.

### F2 — BLOCKER: capture/refresh and zero-authority evidence is missing

SB-04 and SB-11 require one real hosted capture with a frozen old snapshot, authoritative refresh, append-only signal effects, and zero work/authority effects. No such issue #78 case or allowed-delta manifest is committed.

**Minimal closure:** perform exactly one bounded staging capture using public synthetic text, record the old-snapshot exclusion and refreshed one-time inclusion, and commit before/after signal-event plus protected work/authority digests. Reuse issue #70 capture; do not add an admission or other write path.

### F3 — BLOCKER: SB-17/SB-18 aggregates are incomplete and SB-18 is internally inconsistent

The packet does not expose the 30 performance case rows, response-size maximum, query plan, or 100 concurrency case rows/telemetry deltas. `0078-hosted-concurrency-2b23040.json` lists `READY`, which the frozen parser rejects, while reporting only HTTP 200.

**Minimal closure:** rerun the exact frozen query mix with `READY_FOR_REVIEW`; publish content-free per-case identities/digests and bounded telemetry deltas; add the 30-request server/visible timing rows, p95 recomputation inputs, maximum response size, returned-row cap, and `EXPLAIN QUERY PLAN`/index result. Replace or supersede the contradictory aggregate; do not silently relabel it.

### F4 — BLOCKER: SB-16's structured record does not preserve the complete operation proof

The source-bound isolated renderer is permitted for the three unreachable states and no prohibited backdoor exists. However, the artifact records conclusions rather than the required per-state agent-operated keyboard/focus/screen-reader/320/true-200% and fully clean axe outcomes; the automated test itself accepts serious/critical-zero rather than zero violations.

**Minimal closure:** expand the SB-16 ledger to record the exact executable renderer/contract pair and result for every state, preserve the keyboard/focus and announcement trace, and report the complete axe violation set. Naturally reachable states must remain on exact hosted v44; only permission, network/retry, and empty-POD presentation may use the approved isolated pairing.

## Final recommendation

**BLOCK Gate 3.** Keep issue #78 open and production unchanged. Close F1–F4 on the same exact staged runtime if it remains unchanged, then run a fresh independent Critic against the new evidence HEAD. No product rebuild or redeployment is required unless the verification discovers a real defect or the staged source drifts.
