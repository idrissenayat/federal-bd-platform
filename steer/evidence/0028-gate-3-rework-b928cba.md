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

`steer/evidence/0028-case-ledger-b928cba.json` is bound to the exact implementation commit and has SHA-256 `8efcd4f8068e7e33b37264fbca4e879751e22489e6b0c0ed66b591284c441a46`.

- 20/20 frozen cases passed; no denominator omissions.
- 20 terminal UI feedback observations were recorded.
- Save feedback p95: 24 ms against a 250 ms budget.
- Handoff feedback p95: 18 ms against a 250 ms budget.
- Hidden validation/conflict errors: 0.
- Stale response overwrites: 0.
- Duplicate dispatches: 0.
- Unresolved critical recurrences: 0.

## Exact-version rollback rehearsal

Staging version 18 was rolled back to saved version 17, validated, and restored to version 18.

| Operation | Deployment | Result | RTO |
| --- | --- | --- | --- |
| v18 → v17 | `appgdep_6a84a1e2b62881919d677f32aaab96ff` | succeeded | 10.002 s |
| v17 → v18 | `appgdep_6a84a221395c81918504d9c1f8c0247c` | succeeded | 9.115 s |

Before, during, and after digests matched exactly for all 24 work items, all 3 review assignments, all 11 review events, and both privacy-policy versions. The 58-row telemetry prefix was preserved; two expected append-only `fresh` reconciliation observations were added by loading the rollback and restored pages. RPO for governed records was zero. After restoration, the STR-028 drawer opened successfully with the corrected v18 dialog semantics.

## Clean verification

- build: PASS
- JavaScript tests: 30/30
- TypeScript tests: 124/124
- aggregate: 154/154
- typecheck: PASS
- lint: PASS
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
