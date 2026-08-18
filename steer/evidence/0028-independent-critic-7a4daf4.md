# STR-028 focused Gate 3 Critic re-review — evidence `7a4daf4`

## Outcome

**BLOCK Gate 3. Production must remain untouched.**

This re-review is limited to the two blockers in
`steer/evidence/0028-independent-critic-b928cba.md`: AT-18 and AT-19. Both remediations
are materially improved, but neither yet satisfies the frozen Exam's falsifiable
observation contract.

- **AT-18 remains BLOCK.** The new observer passes an actual handler/client-authority
  value into the production `InlineActionFeedback` component and records same-process D1
  rows, but it still does not measure from actual response receipt, does not bind the
  ledger's `action_identity` to the action under test, omits required telemetry signals,
  allows expected transport codes to diverge, and reduces isolated substeps to a PASS
  list plus only the last substep's D1 snapshot.
- **AT-19 remains BLOCK.** Sites independently confirms the exact v18→v17→v18 sequence,
  including the disclosed failed callback and successful retry, and the queued lineage
  is credibly fail-closed. But the evidence provides a boolean equality assertion and
  counts rather than per-checkpoint canonical digests/raw bounded projections, and its
  cited success/failure matrix was generated before rollback. The only post-restore
  hosted smoke opens the drawer and refreshes review; it does not execute the required
  pending→success and failure action flows after rollback.

The implementation target remains `b928cba7e9d486c9f30f212c452814185f8025da`.
Evidence commit reviewed: `7a4daf4f4c58d280f37d5c4ecc75e916dc7f8534`.
This Critic result is advisory and grants no merge, deployment, release, closure, or
human Gate 3 authority.

## Exact evidence fingerprints

- connected ledger SHA-256:
  `a4f12897983e4e3735328fe3443e2bf55ccf2e3e744a93fde69053dbdb76a459`
- rollback evidence SHA-256:
  `9d441637257a54bf06c6e2340ec0e586aa0901b9b07cf508db8aa1386d112dcd`
- rework record SHA-256:
  `db7693d9a57f246542ce0fd0152c3e9df396d15104221a0990c3da7553046df3`
- production remains Sites version 34/source
  `9c245083a8101de0c631c9dc92937765e12d39aa`

## Focused acceptance mapping

| Exam item | Result | Independent mapping |
|---|---|---|
| AT-18 | **BLOCK** | Fresh execution emits 20/20 connected rows, 20 terminal observations, and p95 73ms save/70ms handoff. However, the timestamps do not start at actual response receipt; all 20 ledger action identities are synthetic and none equals the captured response/action identity; ORDER-01..04 have zero activity/D1 rows; F03/F04/R04 lack per-substep D1 evidence; expected transport codes are not checked; and `steer_stale_ui_recurrence_total` plus `steer_duplicate_dispatch_total` are absent. |
| AT-19 | **BLOCK** | Sites confirms rollback succeeded, the first restore failed before provider deployment, and the retry restored v18. The evidence credibly records one queued intent unchanged at event v0 with zero attempt/start/lease/fence/delivery/ack. It does not attach canonical per-table checkpoint hashes or raw projections, and the referenced action matrix predates rollback; post-restore hosted evidence only opens the drawer and refreshes review, not pending/success/failure action truth. |

## Material findings

### 1. AT-18 still passes cases without validating the frozen measured fields

`flight-board/tests/str028-connected-observer.ts:55` sets
`responseReceivedAt = performance.now()` only when the observer is called. The server
tests call the observer after receiving the response and after assertions and database
queries (for example `work-economics-server-controls.test.ts:393`, `:408`, and `:661-663`).
The reported duration therefore begins after authoritative receipt, rather than at the
Exam's required authoritative-response receipt boundary. The reproduced p95 values are
green for the interval that is measured, but are not measurements of the frozen interval.

`flight-board/scripts/measure-str028-case-ledger.ts:117` continues to create
`action_identity` as `sha256(target + case ID)`. Independent inspection found that zero
of 20 ledger action identities equals the captured response identity or dispatch intent.
Exam §2.2 requires the deterministic mutation identity or `dispatch_intent_id` actually
under test, not a ledger-row identifier.

The pass predicate at `measure-str028-case-ledger.ts:99-107` checks outcome,
reconciliation, UI semantics, and substep names/results, but does not compare the actual
HTTP/typed code with `definition.transport`. The stored ledger therefore marks PASS while
recording examples such as `DISP-03: ACKNOWLEDGED` instead of expected
`SIGNED_AGENT_READ`, `DISP-04: OK` instead of `QUEUED`, `FAIL-02: HTTP_400` instead of
`VALIDATION_ERROR`, and `REC-03: DELIVERED` instead of `DELIVERY_RECONCILED`.

The ORDER observer (`str028-connected-observer.ts:141-186`) constructs status 200 from
client objects and writes empty receipts, outbox, events, attempts, authorization audits,
activity, and economics events at lines 178-182. Consequently all four ORDER ledger rows
have zero activity observations, despite the one-observation contract requiring drawer,
activity, and authority agreement.

For F03/F04/R04, the tests execute each isolated substep, but retain only
`observedResponse` and `observedDb` from the last loop iteration and then emit one capture
(`work-economics-server-controls.test.ts:531`, `:613`, `:968`). The ledger records a
PASS/code list for every substep but zero per-substep D1 snapshot hashes. This cannot
falsifiably prove every isolated branch's IDs/counts.

Finally, the reproduced telemetry contains only the two latency histograms, the two
outcome counters, and reconciliation. The frozen signals
`steer_stale_ui_recurrence_total{severity=...}` and `steer_duplicate_dispatch_total` are
absent. Summary fields derived from `case.result` at
`measure-str028-case-ledger.ts:151-169` are not emissions of those required signals and
make the zero recurrence/duplicate result circular.

**Minimum closure for AT-18:**

1. Capture a timestamp immediately when the real handler/client promise resolves and
   pass it into the observer; calculate paint latency from that timestamp.
2. Set `action_identity` from the actual mutation identity or captured
   `dispatch_intent_id`; fail on mismatch with response/D1 identity.
3. Include and validate actual transport status/code against each frozen case oracle.
4. For ORDER cases, record the authoritative/visible item and activity values—not only a
   hash—and assert agreement/no duplicate activity in the emitted observation.
5. Emit a separate response, D1 snapshot hash, IDs/counts, and result for every isolated
   F03/F04/R04 substep; derive the parent result only after all substeps pass.
6. Emit the two missing bounded telemetry signals and calculate all zero summaries from
   those captured emissions and D1 deltas, never from the final case result.

Then regenerate the exact 20-case ledger and make its validator fail if any required
field, signal, identity, substep evidence, or expected transport code is missing or
contradictory. No production environment is required.

### 2. AT-19's exact rollback is credible, but the required post-rollback smoke is absent

Read-only Sites checks independently confirm:

- `appgdep_6a84a91f4b9c8191a7e546f90b5123cf` succeeded on saved v17;
- `appgdep_6a84aa00cacc819189ff5d406f96f904` failed with no provider deployment;
- `appgdep_6a84aa179d548191afc6128e12e7f5c8` succeeded on saved v18; and
- staging is owner-only/current v18 while production remains unchanged at v34.

The rollback JSON records checkpoint timestamps, table counts, the comparison method,
and `all_tables_identical_before_during_after: true`
(`0028-staging-v18-rollback-connected-evidence.json:47-73`). It does not record a
before/during/after canonical digest for any table or attach the bounded projections, so
an independent reviewer cannot reproduce the equality assertion from the durable packet.
The Sites database reader's bounded-cell limitation is disclosed at lines 110-112, which
makes binding those exact projections especially important.

The in-flight fields at lines 75-87 are materially useful and consistent with the current
live queued identity. But the post-restore hosted smoke at lines 89-97 proves only load,
drawer open, review refresh, and durable queued text. Lines 98-107 refer to the separate
connected ledger and accessibility matrix for pending/success/failure. The ledger was
generated at `2026-08-18T18:43:23.651Z`; rollback did not begin until
`2026-08-18T18:49:03.513Z`. It is therefore pre-rollback evidence and cannot be the
Exam's post-rollback smoke.

**Minimum closure for AT-19:**

1. Add before/v17/restored SHA-256 values for the exact canonical bounded bytes of every
   one of the 18 tables (or attach the projections themselves), including a schema/query
   descriptor so each digest is independently reproducible.
2. While v17 is live after rollback, execute the initiating drawer through an honest
   pending→success flow and an honest failure flow in an isolated synthetic staging item;
   record response identity/status, named local role/text digest, focus, activity/D1
   delta, and no duplicate/send/claim/run/audit delta.
3. Repeat the same bounded smoke after v18 restore, bind both observations to their
   deployment/version IDs and timestamps, and retain the already-good queued-intent
   before/during/after invariant.

If the old v17 build cannot safely execute those actions, a truthful typed fail-closed
result is acceptable for the ambiguous in-flight operation, but it does not replace the
separate pending/success/failure drawer smoke required by AT-19.

## Independently reproduced checks

- Fresh ledger generator run: 20/20 PASS, 20 terminal observations, no missing IDs, save
  p95 73ms and dispatch p95 70ms.
- Ledger audit: five unique telemetry metric names only; both frozen recurrence/duplicate
  signals absent; 0/20 synthetic action identities bind to captured response identities;
  ORDER activity row counts are `[0,0,0,0]`; 0 isolated substeps contain their own D1
  snapshot digest.
- Full evidence-head suite: build PASS; JavaScript 30/30; TypeScript 124/124; aggregate
  154/154; typecheck PASS; lint PASS; production dependency audit reports zero
  vulnerabilities.
- Recomputed ledger, rollback-evidence, and rework-record SHA-256 values exactly match the
  packet claims above.
- Read-only Sites checks reproduce all three deployment terminal states and exact saved
  version IDs. The failed restore correctly reports no provider deployment; the retry is
  current v18.
- Read-only production check confirms version 34/source `9c245083...`. No implementation,
  staging, production, or Work Management mutation was performed.

## Required next action

Keep production unchanged. Make the six bounded AT-18 evidence corrections and the two
bounded AT-19 additions above, regenerate immutable evidence, and request another focused
independent re-review. Recommendation: **BLOCK**.
