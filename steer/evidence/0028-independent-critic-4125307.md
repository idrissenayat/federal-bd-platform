# STR-028 focused Gate 3 Critic re-review — evidence `4125307`

## Outcome

**BLOCK Gate 3. Production must remain untouched.**

This review is limited to AT-18 and AT-19, the two blockers in the prior Critic report
at `e2c679acbf9afcb8ea5406edac7cfa9ede415934`. Commit
`4125307509057133eb48cdcbd681e72c77f54b9d` closes most of the requested mechanics:
the connected ledger independently runs 20/20, response timing is captured immediately,
ORDER activity is nonempty, all 17 frozen substeps carry D1 snapshots and hashes,
transport is checked, the complete metric-name set is present, and the rollback packet
now carries matching per-table hashes plus identity projections. The hosted restored-v18
success/conflict/recovery smoke is also credible.

Two exact evidence boundaries remain:

1. **AT-18:** `action_identity` is set to a response identity, not the mutation identity
   or `dispatch_intent_id` required by frozen Exam §2.2. For all dispatch/recovery cases
   with a receipt, zero ledger action identities equal the receipt's D1 `intent_id`.
   Additionally, the two new zero-valued recurrence/duplicate signals are unconditional
   literals; their summaries are still derived from case PASS, not captured telemetry or
   D1 deltas. That is an assertion rather than AT-18's measured signal.
2. **AT-19:** the pending→success→stale-conflict→recovery smoke ran only after v18 was
   restored. It did not run while v17—the reverted behavior—was live. The prior Critic's
   minimum closure and the frozen “behavior is disabled or reverted” condition require
   the smoke on the rolled-back version, not solely after restoration.

This advisory Critic result does not approve Gate 3 and authorizes no merge, production
deployment, release, closure, or human ruling.

## Exact reviewed scope

- implementation target: `b928cba7e9d486c9f30f212c452814185f8025da`
- evidence commit: `4125307509057133eb48cdcbd681e72c77f54b9d`
- connected ledger SHA-256:
  `ded821cd82ed6388c6a4a86dffa2824d881155b939a6ad1198bbc6f621dd413e`
- rollback evidence SHA-256:
  `a81fc010720efa457597884740da39f44311c540062690fb5a8daeb01126780f`
- rework record SHA-256:
  `ccf5ca3015d6905c8b55330ff3cf450087e27494503eae3b6bb139db0bc111a9`
- production remains Sites version 34/source
  `9c245083a8101de0c631c9dc92937765e12d39aa`

## Focused acceptance mapping

| Exam item | Result | Independent mapping |
|---|---|---|
| AT-18 | **BLOCK** | Fresh execution: 20/20 PASS, 20 terminal observations, p95 79ms/79ms, 20/20 response-identity equality, ORDER activity `[2,1,1,1]`, 17/17 hashed substeps, transport checks, and all seven required metric names. But 0 dispatch/recovery action identities equal their D1 receipt intent, and recurrence/duplicate values are literal zeros with summary zeros derived from `result`, not captured signal/D1 measurements. |
| AT-19 | **BLOCK** | All 18 table hashes match before/v17/restored; identity projections match; Sites independently confirms exact deployment outcomes; the queued intent stays fail-closed; restored-v18 hosted pending/success/conflict/recovery produces exactly activity 321/322 and restores authority. No equivalent pending/success/failure smoke was captured while reverted v17 was live. |

## Material findings

### 1. AT-18 still substitutes response digests for action identities and assertions for measurements

The timing, ORDER, substep, and transport defects from the prior report are corrected:

- `markAuthoritativeResponseReceived()` is called immediately after each awaited handler
  result and passed into the observer (`str028-connected-observer.ts:26-28,62-80`).
- ORDER observations now include activity (`str028-connected-observer.ts:193-209`).
- the pass predicate requires each frozen substep's D1 hash and exact transport
  (`measure-str028-case-ledger.ts:99-117`).
- the ledger has 17/17 substep snapshots/hashes and all expected transport values pass.

However, `measure-str028-case-ledger.ts:122` assigns `action_identity` from
`authoritative_response.response_identity`. The response identity itself is generated at
`str028-connected-observer.ts:128` as top-level `dispatch_intent_id` only when present;
otherwise it falls back to a snapshot or whole-response digest. The signed agent-read,
replay, and other response bodies do not all expose a top-level intent, so their ledger
identity becomes a body digest even though the same observation's D1 snapshot contains
the actual receipt intent.

Independent regeneration found 20/20 action identities equal their response identities,
but **0 dispatch/recovery rows with receipts bind `action_identity` to the D1
`dispatch_receipts.intent_id`**. Frozen Exam §2.2 defines this field as the deterministic
mutation identity or `dispatch_intent_id` under test; response provenance belongs in
`actual_evidence.authoritative_response`, not in that identity field.

The missing metric names are now present, but
`measure-str028-case-ledger.ts:144-145` writes
`steer_stale_ui_recurrence_total=0` and `steer_duplicate_dispatch_total=0` unconditionally
for every case. Lines 158-161 calculate summary zeros from whether cases passed, not from
those metric emissions or observed durable before/after counts. AT-18 is explicitly
“measured, not asserted”; literal zeros do not make the absence of a recurrence or
duplicate independently falsifiable.

**Shortest closure for AT-18:**

1. Expose/carry the action's actual mutation ID in save/order responses, and use the D1
   receipt `intent_id` for every dispatch/recovery case. Retain response digest separately.
   Fail if the action identity disagrees with response/D1 lineage.
2. Derive recurrence and duplicate signal values from each case's captured old/new UI
   authority and D1 identity/count deltas. Feed those measured values into both per-case
   metric rows and summary counters; remove unconditional zero literals and result-based
   proxies.

Regenerate the ledger and add negative tests that deliberately inject a mismatched intent,
stale overwrite, and duplicate D1 identity, proving the generator exits nonzero.

### 2. AT-19 proves restoration behavior, not behavior on the reverted version

The new rollback record is internally consistent and materially stronger:

- all 18 names exist at all three checkpoints and every per-table SHA-256 is identical;
- before/v17/restored receipt/outbox/event/attempt identity projections are exactly equal;
- the queued intent stays v0 with zero attempts/start and no lease, fence, delivery, or
  acknowledgement;
- read-only Sites status independently confirms v18→v17 succeeded, the first restore
  callback failed before provider deployment, and the restore retry succeeded on v18;
  the failed callback is transparently disclosed; and
- the hosted post-restore sequence records pending, success, focused assertive stale
  conflict with zero side effects, recovery, exactly activity rows 321/322, and restored
  original authority.

The remaining chronology is decisive. v17 was live from the successful rollback around
`2026-08-18T18:49` until the successful restore around `18:53`. The hosted action smoke
runs at `19:14–19:17`, after v18 was restored. It therefore proves the target version
still works after a rollback cycle, but not that the initiating drawer exposes honest
pending/success/failure behavior **when the new behavior is reverted**, as frozen AT-19
requires. This is also the exact minimum boundary named in the prior `e2c679a` report.

**Shortest closure for AT-19:** perform one owner-only v18→v17→v18 rehearsal and, while
v17 is live, run one isolated synthetic drawer action through pending→success and one
failure/conflict. Record the v17 version/deployment ID, timestamps, local role/text digest,
focus, response identity/status, activity/D1 delta, and zero duplicate/send/claim/run/audit
delta. The existing table hashes, in-flight proof, restored-v18 smoke, and restoration
failure disclosure can remain unchanged if the new v17 observation is immutably bound to
the same evidence packet. Production is not required.

## Independently reproduced checks

- Fresh connected ledger: 20/20 PASS, 20 terminal observations, no missing cases, save
  p95 79ms and handoff p95 79ms.
- Ledger invariants: 20/20 response-identity matches; ORDER activity counts
  `[2,1,1,1]`; 17/17 isolated substeps include D1 snapshots and hashes; expected
  transport passes; all seven required metric names exist; dispatch-intent identity
  matches are 0.
- Rollback packet: all 18 before/v17/restored hash values match; all three identity
  projections match; smoke chronology and activity 321/322 reconcile.
- Full suite: build PASS; JavaScript 30/30; TypeScript 124/124; aggregate 154/154;
  typecheck PASS; lint PASS.
- Repository contract: 3/3 PASS (executed directly because this environment lacks the
  optional pytest package).
- Read-only Sites verification reproduced the three exact deployment terminal states,
  current owner-only staging v18, and unchanged production v34. No implementation,
  staging, production, Work Management, merge, release, or closure mutation was performed.

## Required next action

Keep production unchanged. Correct the two AT-18 derivations and attach the missing
v17-live action smoke for AT-19, then request one more focused independent re-review.
Recommendation: **BLOCK**.
