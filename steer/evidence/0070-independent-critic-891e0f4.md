# Issue #70 focused independent Gate 3 re-review — PASS

Reviewed 2026-08-19 against only the five blockers recorded in `steer/evidence/0070-independent-critic-a12ddf4.md`. This is an independent Critic recommendation. It does not itself authorize merge, production deployment, Release, closure, or Gate 3.

## Exact review target

- PR evidence HEAD: `891e0f43b8ec55f554c062833d306a7897db1f51`
- Release-target code: `d1e3c60b1059a617a2a4a71a1f01b9f9d11c016e`
- Amended Gate 2 Exam revision: `482a56abf5ecc262428d02613726a5c9f2c04d0d`
- Independently recomputed Exam SHA-256: `66a959826d327f8f4e7f69a95e438c93a76f48e45a9babc49b02708f3cfe98d5`
- Canonical private staging version/source: version 26 / `2293a800ef8053a035768ab926227d7afce66b08`
- Restored staging environment/deployment: revision 17 / `appgdep_6a8601ab2f808191b08f9d6c6ba67c8e`
- Frozen staging model: `gpt-5.6-luna`

Evidence digests were independently recomputed:

- `steer/evidence/0070-gate3-closure-v26.md`: `8d851a437446e7b8759a71fafb97b231a34126bbaea8c4eb59c1cdf500e31b13`
- `steer/evidence/0070-hosted-staging-cohort-v26.json`: `3770ee9daad39d7fe13c95ea866b4e6cd2086ed03e22d03c42f6989525e8c2e3`
- `steer/evidence/0070-hosted-accessibility-focus-v26.json`: `bd5c966f66189bf4ee053531d3b4b3ecdce37fe00e92b47878df558889e425c8`

## Ruling

**PASS the focused Gate 3 re-review.** All five prior blockers are closed at the exact target. No new blocker was found within the authorized focused scope.

## Five blocker closures

### 1. Attempt implementation provenance — CLOSED

Migration `flight-board/drizzle/0023_signal_terminal_provenance.sql` adds required `implementation_revision` to `signal_generation_attempts`; the runtime writes the configured revision before provider invocation; the authoritative snapshot returns it; and a database trigger makes it immutable. Fresh tests cover successful, failed, and retry attempts plus mutation rejection.

An independent paginated read of the hosted staging table found 17 attempts in the frozen v26 cohort and 17 exact bindings to `d1e3c60b1059a617a2a4a71a1f01b9f9d11c016e`. This includes failed V26X-20 attempt `01a01b76-4f4b-72e4-b422-b1684c009e70`, which records Luna, the exact implementation revision, `MODEL_POLICY_MISMATCH`, input digest, and authoritative start/completion timestamps despite having no proposal.

### 2. Terminal-plus-90-day retention — CLOSED

New captures receive a non-eligible pending boundary and `terminal_disposition_at = NULL`. The first transition to `READY`, `SAFE_FAILURE`, or `STALE` atomically records terminal disposition and terminal plus 90 days. Migration/runtime triggers require that relationship and prevent later mutation; subsequent terminal-state transitions retain the first terminal boundary.

An independent hosted read found 17 cohort signals: 16 `READY`, one `SAFE_FAILURE`, no missing terminal boundary, and 17/17 exact `7,776,000,000` millisecond terminal-to-deletion intervals. V26X-20 independently reproduces `2026-08-19T19:18:53.620Z` to `2026-11-17T19:18:53.620Z`.

### 3. Deletion-time legal-hold and policy atomicity — CLOSED

The retention authorization now binds cutoff, policy version, ruling digest, and activation receipt. The parent `signals` delete executes first in the same D1 batch, and its database trigger re-evaluates terminal state, age, the latest immutable active policy, 90-day retention, provider recovery no longer than 30 days, bound policy digests, authorization expiry, and active unreleased holds at deletion time. If eligibility changes, the atomic batch rolls back and the worker records no deletion.

The focused regression injects a new `HOLD` after candidate selection but immediately before the batch. Deletion returns zero and every linked row remains; after an append-only release, the governed deletion succeeds. Migration and runtime trigger definitions are aligned.

### 4. Workspace focus and single Ready announcement — CLOSED

The workspace heading is now the programmatic focus target (`H2#signal-workspace-title`, `tabindex=-1`), and the Ready state exposes one atomic polite status: “Proposal ready for human review. No work item has been created.” Source-contract and contrast regressions pass.

The v26 artifact records the actual hosted transition. I also independently opened existing hosted case V26X-16 without creating or changing data: focus remained on the heading after authoritative content loaded, the decision-ready proposal was visible, and the DOM contained exactly one matching Ready status with `aria-live=polite` and `aria-atomic=true`.

### 5. Authoritative cohort completion boundary — CLOSED

The regenerated artifact defines completion as the maximum authoritative `signal_generation_attempts.completed_at` in the denominator. An independent hosted table read reproduced maximum start `2026-08-19T19:18:53.515Z` and maximum completion `2026-08-19T19:18:53.620Z` for V26X-20. The artifact's `cohort_completed_at` is exactly `2026-08-19T19:18:53.620Z`; every included case begins no later than that boundary, and browser observation completes later at `2026-08-19T19:18:54.387Z`.

## Supporting exact-target verification

- Sites independently confirms private/custom staging, saved version 26, source `2293a80`, successful restored deployment, environment revision 17, `SIGNAL_AI_MODEL=gpt-5.6-luna`, and `SIGNAL_IMPLEMENTATION_REVISION=d1e3c60...`. Key application, worker, schema, migration, and test files are byte-identical between the release-target subtree and staged source tree; only staging hosting binding differs.
- Required GitHub `repository-contract` passes at exact code revision `d1e3c60` (run `32290690386`, job `96190539933`) and at exact evidence HEAD `891e0f4` (run `32293678792`, job `96200001250`), including repository secret scanning and dependency/source scanning.
- Fresh local production build, 146/146 tests, typecheck, lint, and production dependency audit all pass with zero production dependency vulnerabilities.
- A fresh independent five-row paginated read of every protected table reproduced all 40 reference table hashes: 572 total rows and zero mismatches. This is a byte-level comparison against `0070-staging-v22-rollback-evidence.json`, not only a count assertion.
- The frozen hosted denominator is 20/20: 16 real Luna proposals, three denominator pre-provider safety rejections, and one controlled safe failure. The additional API-key harness-qualification rejection `01a01b73-7deb-7fec-a595-0d2ac13cd95a` is content-free, made no provider call or work-item change, is fully disclosed, and remains outside the denominator; its presence does not alter the frozen 20-case oracle.
- Production remains unmodified: the production site is still saved version 36, last updated before this issue's v26 verification; its D1 overview still has 34 tables and no `signals` or `signal_*` tables. This review performed no production write or deployment.

## Gate 3 recommendation

The Product Lead may approve Gate 3 against PR evidence HEAD `891e0f43b8ec55f554c062833d306a7897db1f51` and release-target code `d1e3c60b1059a617a2a4a71a1f01b9f9d11c016e`, subject to the unchanged signed Gate controls and an explicit authenticated human ruling. Production deployment must preserve the exact implementation-revision runtime binding and the approved Luna policy. This report does not merge, deploy, Release, or close the issue.
