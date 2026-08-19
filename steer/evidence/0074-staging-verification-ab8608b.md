# Issue 74 staging verification — risk-based Gate 3 readiness

**Status:** implementation and canonical staging verification complete. This packet does not authorize merge, production deployment, Release, closure, or Gate 3.

## Frozen authority and target

- Gate 1 Brief revision: `e1644ff3421800423e90980929fa4eac3c64f1e1`; SHA-256 `fbd22ba38942a4098b727d3c88ebde92b336f1879a5b73ef4cb9c9bc6d0ac6e5`.
- Gate 2 Exam revision: `1b8ad059a8ee2a4a94c7828bc617d4909a52813c`; SHA-256 `a407773a621ee75421201a6bd5673024eee4d9f3d8f929cf50bf1740850709c6`.
- Implementation revision: `ab8608b3bc9f6f1880c5b32dd3293b2ab7a1a3d5`.
- Build SHA-256: `c8ae9688513d22877b354e7728eea1db425c2c51e822a99e10ce08c37c14bc3c`.
- Migration-set SHA-256: `925f5e62a3d6d5750d04a5b713b25454dd106b161d2712495e25136cbb576b68`.
- Runtime-policy SHA-256: `8ceebba8473e3729e51c12aabaef1dcdf89a076200a11a898a9716a1e158de9f`.
- Hosted ledger: `steer/evidence/0074-hosted-case-ledger-ab8608b.json`; SHA-256 `d9bc97e9cc6a8e00a828425d2127e3ec2d9b48394890083880d9a66e2b6da1c7`.

## Canonical staging

- Project: `appgprj_6a83763dc1148191b439c0795aa86a1c`.
- URL: `https://steer-flight-board-staging.idriss-enayat.chatgpt.site/`.
- Access: owner-only.
- Active version: 31; environment revision: 20.
- Sites source wrapper: `44d256c2a9cf55fb59d5eab69baad7bab6241b22`.
- Restore deployment: `appgdep_6a86265ace64819181893e9611c27255`, succeeded.
- The authenticated staging UI shows the configured decision issuer and the exact issue #74 version-1 policy as active. Runtime metadata returns the exact implementation, build, migration-set, and policy digests above.

## Implemented control

The implementation replaces blanket solo Gate 3 cooling with a server-owned, versioned readiness decision:

- `DEFAULT_OPEN`: no fixed delay, with a fresh post-snapshot human decision session.
- `ELEVATED`: four hours from authoritative staging verification or an exact-snapshot qualified independent-human path.
- `DEFAULT_CLOSED`: 24 hours from authoritative staging verification or the complete qualified-team path.
- Missing, unknown, malformed, mismatched, under-tagged, stale, cross-POD, unsigned, or non-PASS authority fails closed.
- Readiness snapshots, policy records, signatures, and readiness events are canonical and append-only. Candidate drift invalidates pending authority rather than mutating it.
- Passing time or receiving signatures never creates an effective Gate ruling. A fresh authenticated human finalization is always required.
- Existing receipts preserve their original policy and timing semantics.

## Hosted 30-case matrix

Run `rr74-20260819214559621` completed 30 of 30 cases with no failed oracle:

| Group | Cases | Result |
|---|---:|---|
| Classification | 4 | PASS |
| Time boundaries | 6 | PASS |
| Qualified signer/team paths | 6 | PASS |
| Material drift | 8 | PASS |
| Replay/concurrency/fault | 3 | PASS |
| Legacy/rollback/restore | 3 | PASS |

The 27 API observations are signed, immutable D1 records bound to the exact server runtime digests. The concurrency exercise issued 100 simultaneous identical requests: 98 initial responses arrived, two private-gateway transports failed, and authoritative D1 still contained one identity; the final retry returned one idempotent HTTP 200 replay. Transport failures were preserved rather than removed from the record.

## Timing

- Worker sample: 100 hosted requests.
- Readiness calculation CPU p95: 86 ms; maximum: 169 ms; Exam limit: 500 ms — PASS.
- Private Sites gateway wall p95: 10,301 ms; maximum: 10,331 ms. This is disclosed as a non-production private-gateway capacity signal and is not represented as readiness-computation time.
- Raw harness/network p95 across the hosted ledger: 11,088.86 ms.

## Rollback and restore

Every staging D1 table was projected and hashed before rollback, while the prior version was live, and after restore:

- 50 tables; 1,938 rows.
- Before aggregate SHA-256: `8fd15916a15feac46011dffc8e8ffc482a3311588f05abffbc573ad81ae01aad`.
- During aggregate SHA-256: `8fd15916a15feac46011dffc8e8ffc482a3311588f05abffbc573ad81ae01aad`.
- After aggregate SHA-256: `8fd15916a15feac46011dffc8e8ffc482a3311588f05abffbc573ad81ae01aad`.
- Changed table projections: none.

The rollback deployed pre-feature staging version 28 as deployment `appgdep_6a86256df11081919a616df2b4625da8`. While it was live, the new service-authenticated readiness case endpoint was unavailable and returned HTTP 401, so new readiness behavior was inert/fail-closed. Restoring version 31 succeeded, and the exact prior case replayed HTTP 200 with `idempotent_replay: true`, response SHA-256 `6a5bdacf5def68728d1ff6e8c0ad5cad4a9bbd45a25d5cfdf68dc0c44921d52a`.

## Regression and repository checks

- Build: PASS.
- UI/source tests: 33/33 PASS.
- TypeScript tests: a complete 143/143 run passed. Later repeated full runs exposed one pre-existing timing-sensitive dispatch-retention assertion; the exact failed case immediately passed 1/1 in isolation. The same-millisecond HOLD/RELEASE ordering defect is tracked separately as [issue #76](https://github.com/idrissenayat/federal-bd-platform/issues/76); it is disclosed and is not counted as an issue #74 readiness-case failure.
- Typecheck: PASS.
- Lint: PASS.
- Git diff check: PASS.
- GitHub `repository-contract`: PASS.
- No production dependency was added. `npm audit` still reports the repository's pre-existing transitive advisories; this packet does not claim a clean dependency audit.

## Agent-operated UI and accessibility

- Authenticated canonical staging load: PASS; no observed console error.
- Policy/issuer readiness region: named and understandable; exact policy shown active.
- Keyboard traversal: PASS across workspace navigation, connected records, Block Buzz, and search; focus order remained predictable.
- 320 px viewport: PASS; content reflowed, release-authority text remained readable, and the navigation used its intentional horizontal scroller.
- 200% true Chrome zoom: PASS. Chrome visibly reported exactly 200%. The release-authority heading, Ready status, issuer, risk policy, tier delays, and no-automatic-release explanation remained readable without clipping. The responsive workspace navigation remained usable through its intentional horizontal scroller.
- 200% keyboard trace: PASS in the order My Work, Overview, Flight Board, Backlog, Human Decisions, Team & Agents, Search work, and Create work item. Focus remained visible and predictable.

The automated suite also checks named status semantics, adjacent blocked-action explanations, focus-contained governed dialogs, Escape close, opener-focus restoration, server-owned readiness status, and the prohibition on automatic ripening. A fresh independent Critic must still review the exact target and completed evidence before any Gate 3 request.

## Production boundary

Production was read-only throughout Gate 2. It remains on version 36 with its existing environment revision and 34-table D1 schema; no issue #74 readiness tables or policy records were created there. No merge, production deployment, Release, closure, or Gate 3 action occurred.
