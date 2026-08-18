# STR-028 Gate 3 rework evidence — exact implementation `b928cba`

Date: 2026-08-18  
Environment: owner-only STEER staging  
Production: untouched

## Result

STR-028's implementation and agent-operated acceptance evidence are ready for a fresh independent Critic review. This record does not approve Gate 3, merge, production deployment, release, or closure.

The exact implementation target is `b928cba7e9d486c9f30f212c452814185f8025da`. The independently signed target packet binds that Git commit object and 20 sorted artifact byte digests. Staging version 18 packages the exact implementation at the single canonical staging URL.

## Agent-operated accessibility and UI evidence

Codex performed the test work that had previously been assigned to a human tester. The test method was real Google Chrome keyboard navigation on macOS, the macOS/Chrome accessibility tree, and hosted narrow-layout inspection in the in-app Browser. This evidence does not claim that Idriss performed a VoiceOver audio session.

| Requirement | Agent result |
| --- | --- |
| Drawer entry focus | PASS — opening STR-028 focuses `Close item` |
| Forward focus containment | PASS — Tab moves to `Refresh review` inside the drawer |
| Reverse focus containment | PASS — Shift+Tab returns to `Close item` |
| Escape and return | PASS — Escape closes; focus returns to `Open STR-028 →` |
| Dialog semantics | PASS — native `DIALOG`, `aria-modal=true`, labelled title |
| Accessible names | PASS — Phase, State, Priority, Workflow, Work type, Decision readiness, Assignee, Evidence URL, Engineering record, and durable dispatch status were exposed |
| Narrow layout | PASS — at 320×800 the drawer was 290px client/scroll width with zero overflowing descendants |
| Focus visibility | PASS — the focused Close control exposed a solid 3px outline |
| Eight frozen states | PASS — success, validation, conflict, transport, blocked authorization, pending, empty/unavailable, and reload failure |
| Automated accessibility | PASS — no serious or critical axe findings on the frozen state surfaces; separate contrast assertions pass |

The executable matrix is `flight-board/tests/str028-agent-accessibility-matrix.test.ts`. It verifies useful local live announcements and focus for errors rather than relying on a page-level banner. The hosted raw record is `steer/evidence/0028-staging-v18-agent-evidence.json`.

## Exact 20-case ledger

`steer/evidence/0028-case-ledger-b928cba.json` is bound to the exact implementation commit and has SHA-256 `ded821cd82ed6388c6a4a86dffa2824d881155b939a6ad1198bbc6f621dd413e`.

Each case now executes as one connected observation. Timing starts immediately when the authoritative response is returned. That exact response identity is passed directly into the production `InlineActionFeedback` component; the painted role/live/focus state is captured; and the actual D1 emulator rows are snapshotted in that same process. Every frozen FAIL-03, FAIL-04, and REC-04 substep has its own database snapshot and SHA-256. The generator validates the actual HTTP status and typed response code, rejects missing or duplicate observations, and no longer fabricates outcome, transport, side-effect, focus, or latency fields from the expected-case definition.

- 20/20 frozen cases passed; no denominator omissions.
- 20 terminal UI feedback observations were recorded.
- Save feedback p95: 71 ms against a 250 ms budget.
- Handoff feedback p95: 73 ms against a 250 ms budget.
- Hidden validation/conflict errors: 0.
- Stale response overwrites: 0.
- Duplicate dispatches: 0.
- Unresolved critical recurrences: 0.

## Exact-version rollback rehearsal

Staging version 18 was rolled back to saved version 17, validated, and restored to version 18. The complete machine-readable record is `steer/evidence/0028-staging-v18-rollback-connected-evidence.json`.

| Operation | Deployment | Result | RTO |
| --- | --- | --- | --- |
| v18 → v17 | `appgdep_6a84a91f4b9c8191a7e546f90b5123cf` | succeeded | 7.370 s |
| v17 → v18 initial callback | `appgdep_6a84aa00cacc819189ff5d406f96f904` | failed before provider deployment; v17 stayed healthy | 1.907 s |
| v17 → v18 retry | `appgdep_6a84aa179d548191afc6128e12e7f5c8` | succeeded | 7.310 s |

Before, during, and after canonical rows matched across 18 governed tables: receipt, outbox, event, attempt, authorization audit, security diagnostic, dispatch retention, activity, notifications, Work Economics audit, review lineage and retention, and privacy policy. Counts included 320 activity rows, 24 notifications, 46 economics events, 4 review assignments, 15 review events, both privacy policies, and the one live dispatch lineage. The machine record now includes a SHA-256 for every table at every checkpoint plus the raw bounded receipt/outbox/event/authorization identity projection. RPO was zero.

The pre-existing queued intent `8329a2206554d7e117df1c1f6e5cf6e97f93ad07cdb876fbbaf3840f7b08b2cf` was captured before, during v17, and after restoration. It remained `QUEUED` at event version 0 with attempt 0, `send_started=0`, no lease or reservation fence, and no delivery or acknowledgement identity. Thus v17 did not claim, attempt, send, mutate, or duplicate the in-flight operation.

After restoration, Codex also executed a real hosted staging write sequence through the rendered STR-028 drawer:

- Pending: the initiating edit announced `Saving…` with `role=status` and `aria-live=polite`.
- Success: the server-accepted edit announced `Saved` from the authoritative response; D1 appended activity row 321.
- Failure: a second tab holding the prior revision was rejected, preserved its input, announced the conflict through `role=alert` and `aria-live=assertive`, moved focus to the alert, and appended no D1 row.
- Recovery: the current tab restored the exact original next action, announced `Saved`, appended activity row 322, and a fresh reload proved the authoritative original value was restored.

The only D1 delta was the two expected append-only success/restore audit rows. The stale failure produced zero durable side effects. The final connected 20-case ledger was regenerated at `2026-08-18T19:21:39.072Z`, after both the exact rollback/restore and the hosted post-rollback smoke rather than before them.

## Clean verification

- build: PASS
- JavaScript tests: 30/30
- TypeScript tests: 124/124
- aggregate: 154/154
- typecheck: PASS
- lint: PASS
- repository contract: 3/3 PASS
- production deployment or data mutation: none

## Immutable review target

The refreshed packet `steer/evidence/0028-gate-3-review-target.json` has SHA-256 `b09c5bfa02385da53a0d29e6d69b731fdab4488d854eedfdb0700843cd375f11` and binds:

- Git commit OID: `b928cba7e9d486c9f30f212c452814185f8025da`
- Git commit-object SHA-256: `340d47a1f7825eec0c5e9b727d98f9afdf8b809d867f7f1d80273cb59b7f73a0`
- artifact manifest SHA-256: `3082e2a318f2a8c035217db677d3c12c52b91a1d3d0ba4c80d54e85b744150b3`
- verifier: enrolled Test Agent key `buzz-roster-v3:test`, version 3

## Signed staging assignment

At `2026-08-18T18:25:04.175Z`, staging accepted the exact signed packet and created assignment `a84a6e440734cb6ddc136a610de32fda136264abecaca00bf842fb0a904406a5`. It is the only `REQUESTED` assignment, at event version 2, and is bound to manifest `3082e2a318f2a8c035217db677d3c12c52b91a1d3d0ba4c80d54e85b744150b3`. All three older assignments are append-only `SUPERSEDED`; there are zero parallel active assignments.

Next step: obtain the fresh independent Critic PASS/BLOCK ruling. The human Product Lead may then confirm the agent-operated result and make the Gate 3 decision; the human is not asked to repeat the tests.
