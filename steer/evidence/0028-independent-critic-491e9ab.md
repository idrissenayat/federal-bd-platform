# STR-028 final focused Gate 3 Critic re-review — evidence `491e9ab`

## Outcome

**PASS recommendation for Gate 3.** The two blockers in the prior focused Critic
report at `0e892316` are closed at exact evidence commit
`491e9ab5ad96d7107b6ad288b08ca69a25c3e273` against unchanged implementation
target `b928cba7e9d486c9f30f212c452814185f8025da`.

AT-18 now measures one connected authoritative response-to-production-component paint
per frozen case, binds every receipt-bearing dispatch/recovery action to its actual D1
intent, and derives recurrence and duplicate totals from captured UI/D1 observations.
AT-19 now includes the missing action smoke while v17 is actually live, followed by a
successful v18 restoration and the same hosted smoke on restored v18. No material
finding remains within this focused re-review.

This is a Critic recommendation to the human Gate 3 authority. It is not Gate 3
approval and authorizes no merge, production deployment, release, closure, or other
external action. Production must remain unchanged until an explicit human ruling.

## Exact reviewed scope

- implementation target: `b928cba7e9d486c9f30f212c452814185f8025da`
- evidence commit: `491e9ab5ad96d7107b6ad288b08ca69a25c3e273`
- prior focused BLOCK report: `steer/evidence/0028-independent-critic-4125307.md`
  at commit `0e892316`
- connected ledger: `steer/evidence/0028-case-ledger-b928cba.json`
- connected ledger SHA-256:
  `fcf980d910eb49526dafc1e22e6a6f1e766221373a0ad1d07e77505ab27439ab`
- exact rollback packet:
  `steer/evidence/0028-staging-v18-rollback-connected-evidence.json`
- rollback packet SHA-256:
  `d766eb4322e97c893e72754f7623e84b3f0dcad7c8f1b15a51ae95a7d5955f0a`
- rework record SHA-256:
  `594cbd22671807fa443d1d0608394d26f67fb0d9003754244beeea5a9f9367cd`
- production baseline: Sites version 34/source
  `9c245083a8101de0c631c9dc92937765e12d39aa`

The diff from the implementation target to the evidence commit contains tests,
measurement scripts, review-target/evidence artifacts, and prior Critic reports only;
there is no production runtime source or migration change.

## Focused acceptance mapping

| Exam item | Result | Independent mapping |
|---|---|---|
| AT-18 | **PASS** | Stored ledger is exact-hash valid, generated after both rollback smokes, and records 20/20 PASS with 20 terminal observations, no missing cases, save p95 71 ms and dispatch p95 86 ms. Fresh independent execution reproduced 20/20, 20 terminal observations, save p95 77 ms and dispatch p95 85 ms. All 20 action identities equal their captured response identities; all 9/9 receipt-bearing cases also equal the first D1 receipt and outbox intent. ORDER activity counts are `[2,1,1,1]`; all 17/17 frozen substeps pass with D1 hashes; actual HTTP and typed transport values are checked. The required seven metric names are present. Captured stale-overwrite and duplicate-dispatch signals sum to zero, and the summary counters sum those signal rows rather than case PASS. |
| AT-19 | **PASS** | Read-only Sites status independently confirms exact v18→v17 deployment `appgdep_6a84b26fb81c81918e045dbdbf24a5c3` succeeded on version 17 and exact v17→v18 deployment `appgdep_6a84b307b6f88191884c6b0a0cc2edfe` succeeded on version 18. While v17 was live, the hosted pending→success→stale 409 conflict→recovery flow produced only activity rows 323/324; the same flow on restored v18 produced only rows 325/326. The conflict writes no activity, both flows restore the authoritative original, and current staging D1 independently shows rows 323–326, the restored work-item value, and one receipt/outbox/event/audit with no attempt, lease, fence, send, delivery, or acknowledgement. |

All acceptance items outside AT-18 and AT-19 remain governed by their existing PASS
mappings and are outside this deliberately focused re-review. The full regression suite
was nevertheless rerun to detect collateral failure.

## Closure of the prior blockers

### 1. AT-18 action identity and measured signals — closed

The observer now counts duplicate stable receipt/outbox intent identities and duplicate
event/attempt versions from the captured D1 snapshot
(`flight-board/tests/str028-connected-observer.ts:19-29`). It captures D1 before choosing
the response identity and falls back to the actual outbox/receipt/event intent when the
response does not expose one (`:131-140`). The connected ledger therefore records the
actual receipt intent in every applicable case rather than substituting an unrelated
response digest.

The same observer calculates visible response recurrence and durable duplicate signals
from each observation (`:141-143`). ORDER cases compare the authoritative and visible
states directly and count duplicate stable identities from their captured projection
(`:220-231`). The generator requires both signal values to be integers and zero before a
case can pass, emits the captured values into per-case telemetry, and sums those telemetry
values into the ledger summaries
(`flight-board/scripts/measure-str028-case-ledger.ts:117-121,145-150,163-181`). These are
falsifiable measurements, not unconditional PASS-derived zeros.

Independent regeneration reproduced:

- 20/20 exact frozen cases and 20/20 connected terminal paints;
- 20/20 action-to-response identity matches;
- 9/9 receipt-bearing and 9/9 outbox-bearing cases bound to their D1 intent;
- all four ORDER cases with nonempty activity;
- 17/17 isolated frozen substeps with PASS and a 64-character D1 SHA-256;
- zero stale-overwrite and zero duplicate-dispatch captured signal totals; and
- seven required metric names with both p95 values below the 250 ms budget.

### 2. AT-19 behavior on the live reverted version — closed

The rollback artifact records the closure rehearsal deployment sequence at lines 45–63.
Read-only Sites inspection independently returned both exact deployment IDs, the expected
version IDs, terminal `succeeded` status, staging URL, and environment revision 2.

The v17-live smoke is recorded at rollback artifact lines 278–329: pending status,
authoritative HTTP 200 success and activity 323, a typed `STALE_REVISION` HTTP 409 with
assertive focused error and zero activity delta, recovery activity 324, and restored
authority. The restored-v18 repetition is at lines 331–382 and records the same sequence
with activity 325/326. Both smoke sequences completed before the stored connected ledger
was generated at `2026-08-18T19:34:04.738Z`.

Independent live D1 reads reproduced activity rows 323, 324, 325, and 326 with their exact
timestamps; the current STR-028 `next_action` is the authoritative original restored by
row 326. The live dispatch projection remains exactly one receipt, one outbox row, one v0
QUEUED event, zero attempts, and one authorization audit. It has attempt 0, send-started
0, null lease/fence/delivery/acknowledgement, consistent with the packet's zero
duplicate/send/claim/run/audit deltas at lines 384–403.

## Independently reproduced checks

- Exact Git objects exist for implementation and evidence commits; repository HEAD and
  pushed branch matched `491e9ab5ad96d7107b6ad288b08ca69a25c3e273` before this report.
- SHA-256 values independently match the connected ledger, rollback packet, and rework
  record listed above.
- Fresh connected-ledger execution: 20/20 PASS; 20 terminal observations; no missing
  cases; p95 77 ms/85 ms; all identity, ORDER, substep, transport, and signal invariants
  listed above PASS.
- Full suite: build PASS; JavaScript 30/30; TypeScript 124/124; aggregate 154/154.
- Typecheck PASS; lint PASS; repository contract 3/3 PASS (direct execution because the
  optional pytest package is unavailable in this environment).
- Read-only Sites: staging remains custom owner-only (one allowed owner, no groups or
  external visitors), current version 18; exact v17 and v18 closure deployments both
  succeeded.
- Read-only production Sites: current version remains 34, source remains
  `9c245083a8101de0c631c9dc92937765e12d39aa`, and its project update timestamp remains
  `2026-08-16T18:30:47.275379Z`. No production mutation occurred during this review.

## Material findings and residual risks

No open severity-ranked material finding remains for AT-18 or AT-19.

Residual, non-blocking operational limits:

1. The Sites D1 reader bounds long cell values. The rollback comparison used the same
   deterministic bounded projection at all checkpoints and separately retained the
   untruncated dispatch identity/state columns. The Critic independently read the exact
   current identity/state columns used by the rollback oracle.
2. The private live service-claim endpoint was intentionally not invoked from the human
   browser. Fail-closed rollback safety is instead supported by the unchanged queued v0
   identity, zero attempts/send fields throughout the recorded rehearsal, current live D1
   invariants, and the connected service-fencing cases.
3. A production release remains a separate human-owned decision. Standard release-time
   monitoring and rollback authority are still required; this report does not exercise or
   authorize production.

## Recommendation

**PASS** the STR-028 implementation/evidence packet forward to the human Gate 3 decision.
No further remediation is required for the two prior blockers. Keep production untouched
unless and until the authorized human explicitly approves Gate 3 and the separate release
boundary.
