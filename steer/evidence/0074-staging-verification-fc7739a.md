# Issue #74 staging verification — exact runtime fc7739a

Generated: 2026-08-20T03:11:33.226Z

## Authority and exact target

- Gate 1 Brief: `steer/briefs/0074-risk-based-gate3-readiness.md`; revision `e1644ff3421800423e90980929fa4eac3c64f1e1`; SHA-256 `fbd22ba38942a4098b727d3c88ebde92b336f1879a5b73ef4cb9c9bc6d0ac6e5`.
- Gate 2 Exam: `steer/exams/0074-risk-based-gate3-readiness.md`; revision `1b8ad059a8ee2a4a94c7828bc617d4909a52813c`; SHA-256 `a407773a621ee75421201a6bd5673024eee4d9f3d8f929cf50bf1740850709c6`.
- Runtime implementation revision: `fc7739ad780b31dfc18c1157890ac99eccd3e663`.
- Runtime commit-object SHA-256: `c62ac8388fe24fbf5b307ae6171e4dcaf17c55dae90153fbfaf321b6904e9378`.
- Review target: `steer/evidence/0074-real-lifecycle-case-contract.md`; SHA-256 `5b4bc63646fcb11ee494c507018b36cc95f8f2761da4eae76d551109bdab74d0`.
- Build SHA-256: `ede408b3c2ac6f238829d35e5643a10419fddfa630b6b49793f6116f94f698a8`.
- Migration-set SHA-256: `6ef5c16a1fabdad73ce952583f67d03b4f65012e90bc6307f255af49fab68511`.
- Runtime-policy SHA-256: `8ceebba8473e3729e51c12aabaef1dcdf89a076200a11a898a9716a1e158de9f`.

## Canonical owner-only staging

- Project: `appgprj_6a83763dc1148191b439c0795aa86a1c`.
- URL: `https://steer-flight-board-staging.idriss-enayat.chatgpt.site`.
- Sites source wrapper: `9a70208f87e67ea83d6a182c9dcd59ffcee0dc7a`.
- Saved version: 38; `appgprj_6a83763dc1148191b439c0795aa86a1c~appgver_17fba91296708191b81550aa894e7394`.
- Initial exact-v38 deployment: `appgdep_6a866a8ee98c8191981bb53159559137`, succeeded with environment revision 28.
- Restored exact-v38 deployment: `appgdep_6a866e10ab048191ae1fe2a2ad001a88`, succeeded with environment revision 28.
- Access remained custom owner-only: one owner, zero groups, zero external visitors.
- Production remained at version 36. Its D1 overview contains 34 tables and no issue-74 readiness, decision-package, decision-intent, session, or staging-verification tables. No production deployment or database mutation was performed.

## Prior Critic findings closed

1. **Builder / intended-submitter separation:** the signed verification receipt and frozen readiness authority bind both identities; snapshot creation rejects equality; countersignature rejects either identity; intent submission and finalization recheck the frozen intended submitter and current role/POD authority. Hosted signer-submitter and signer-Builder cases fail closed.
2. **Synthetic evidence:** the synthetic evaluator is retired. The matrix now traverses real fixture prerequisites, signed verification receipt, production snapshot/package/session/intent functions under the current Product Lead, issuer proof, finalization, Gate effect, and raw D1 projection.
3. **Full drift:** work item, Brief authority, Exam authority, Critic result, derived domains, risk classification/policy, verification receipt, operating mode, Builder, intended submitter, implementation, build, migration set, and runtime policy are recomputed. Invalidation stores exact per-field old/new digests.
4. **Full authority binding:** snapshot, intent, issuer envelope, proof events, and finalization bind and compare the complete canonical readiness authority, including policy/tier/path/delay/verification/roles/identities and exact Brief/Exam/runtime hashes.
5. **UI and accessibility:** the existing decision dialog renders server-authoritative countdown, completed/missing controls, exact reset field/digests, and next action. The agent-operated packet covers hosted semantics, keyboard focus, live contrast, 320 px, and 200% zoom.
6. **Telemetry, timing, and rollback:** real domain functions emit bounded case-linked telemetry; every case projection includes activity/events/telemetry; the exact pending intent is preserved through a live previous-version rollback and completes once after restore.

## Frozen hosted denominator

Run: `rr74-v38-1787194069146`.

| Cohort | Result |
| --- | --- |
| Real hosted functional / boundary / signer / drift / replay / fault cases | 27/27 PASS |
| Exact rollback / inert pending / restore-no-duplicate cases | 3/3 PASS |
| Frozen denominator | 30/30 PASS |
| Distinct concurrent full lifecycles | 100/100 |
| Distinct snapshots | 100/100 |
| Distinct intents | 100/100 |
| Exact Gate effects | 100/100 |
| Duplicate Gate effects | 0 |

The 100-identity cohort executes `fixture → signed receipt → snapshot → package → fresh session → intent → proof → finalization → D1 projection`. Each identity retains its exact snapshot, intent, projection digest, Gate-effect oracle, and telemetry rows.

Ledger: `steer/evidence/0074-real-hosted-ledger-fc7739a.json`; SHA-256 `b9ad1b5b936a1dcba2bbce99911503f92129796d1321880303b07636e7b36e10`.

## Telemetry and timing

- 1,219 telemetry rows across 125 exact case identities; every recorded row is case-bound.
- Bounded metric vocabulary present: classification tier, readiness outcome, invalidation reason, boundary rejection, countersignature outcome, finalization outcome, hosted case outcome, readiness latency, and snapshot creation latency.
- No reasoning, work content, email, signature, credential, or person-ranking label is present.
- Overall request observation p95: 2,540.93 ms.
- Snapshot creation p95 across the 25 standard real cases: 2,867.26 ms.
- Readiness response p95: 1,454.62 ms.
- Finalization p95: 2,050.09 ms.

All are below the Exam's five-second hosted feedback budget.

## Exact rollback proof

Pending intent `01a01d1a-338a-7fb2-94d7-3e4c710b034e` for item 478 was seeded on v38 as `PENDING_PROOF`, sequence 1, event digest `20ed7cd822e6b4dbb51304c17af6bfa2b6e88a72e7593fff306102ba4cfb75b6`.

- Rollback v38 → v28: deployment `appgdep_6a866d39d7ec8191a51df324bce40024`; RTO 9,981 ms.
- While v28 was live: the new fixture projection route returned 401; exact finalization returned 409; direct D1 inspection retained `PENDING_PROOF`, sequence 1, the same event digest, and no Gate effect.
- Restore v28 → v38: deployment `appgdep_6a866e10ab048191ae1fe2a2ad001a88`; RTO 11,848 ms.
- After restore: no-proof finalization remained 409; issuer proof returned 201; finalization returned 201; replay returned 200 with `replay=true`; the intent became `EFFECTIVE` with exactly one Gate effect.

Artifacts:

- `steer/evidence/0074-rollback-pending-fc7739a.json`; SHA-256 `9b0e815d966c4982729293b606bb0f9e26af0d67d4001facf6c9e6e3e9cc6c4c`.
- `steer/evidence/0074-rollback-restored-fc7739a.json`; SHA-256 `82df64cdb43a47ef45685195222c8f55885417a6c64ffb06cf99bf041582bcd6`.
- `steer/evidence/0074-rollback-connected-evidence-fc7739a.json`; SHA-256 `cbc266c4edc852079a4a82ed0551724879211362901762dc7028857157373019`.

## UI and accessibility

- Eight frozen readiness states render at 320 px and zoom 2 with exactly one named status and zero serious/critical axe findings.
- Live v38 hosted checks covered exact invalidation, elevated/default-closed countdowns, missing-qualified-human explanation, semantic status, focus containment, Escape restoration, and server refresh.
- Live computed contrast: 27/27 visible enabled text samples pass; minimum 5.17:1.
- Durable 200% screenshot: `steer/evidence/0074-hosted-ui-200pct-fc7739a.png`; SHA-256 `84a89b655841113298ff6f2d622020d160982abb4ea2d3fd07de9af1d700d23c`.
- Agent-operated record: `steer/evidence/0074-agent-operated-ui-a11y-fc7739a.md`; SHA-256 `1e5be13863f28af0df6118047c6b72c8f62491c553bbd96b2d597607122f14c9`.

## Local and repository verification

- Build: PASS.
- Typecheck: PASS.
- Lint: PASS.
- Focused issue-74 release-readiness/API/accessibility suite: 11/11 PASS.
- Full local Flight Board run: 145/146; the only failure is the pre-existing issue #76 dispatch-retention same-millisecond HOLD/RELEASE ordering race. The prior issue-74 Critic explicitly classified #76 as separate and not independently blocking #74.
- PR #75 repository-contract initially failed because the CI shallow checkout did not contain immutable historical revisions required by existing exact-target tests. This evidence revision adds `fetch-depth: 0`; the check must be read from the exact evidence HEAD after push.
- No issue-74 test, hosted case, typecheck, lint, build, or deployment check failed.
- The hosted run exposed a separate staging-operability defect: governed fixtures inflate normal WIP and Human Decisions. Bounded follow-up issue #77 preserves the audit records while excluding them from operational counts; it carries no implementation authority yet.

## Remaining authority boundary

This packet authorizes no merge, production deployment, Release, closure, or Gate 3. A fresh independent Critic must review the exact runtime and evidence revision. Gate 3 remains a Product Lead decision.
