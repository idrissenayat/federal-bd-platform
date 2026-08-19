# Issue #70 Gate 3 closure packet — staging v26

Prepared 2026-08-19 against amended Gate 2 Exam revision `482a56abf5ecc262428d02613726a5c9f2c04d0d`, SHA-256 `66a959826d327f8f4e7f69a95e438c93a76f48e45a9babc49b02708f3cfe98d5`. This packet requests independent Critic review. It does not authorize merge, production deployment, Release, closure, or Gate 3.

## Exact target

- Release-target code: `d1e3c60b1059a617a2a4a71a1f01b9f9d11c016e`
- Canonical staging project: `appgprj_6a83763dc1148191b439c0795aa86a1c`
- Saved site version: 26, `appgprj_6a83763dc1148191b439c0795aa86a1c~appgver_f0020bab8b2c8191b949930dda57ef1a`
- Staging source commit: `2293a800ef8053a035768ab926227d7afce66b08`
- Restored runtime environment revision: 17
- Frozen runtime model: `gpt-5.6-luna`
- Restored deployment: `appgdep_6a8601ab2f808191b08f9d6c6ba67c8e`

## Five bounded closures

1. **Attempt implementation provenance.** Migration `0023_signal_terminal_provenance.sql` adds required `implementation_revision` to `signal_generation_attempts`. Generation writes the runtime binding before provider invocation; the authoritative snapshot exposes it; a database trigger prevents mutation. All 17 stored v26 attempts bind `d1e3c60...`, including failed attempt `01a01b76-4f4b-72e4-b422-b1684c009e70`.
2. **Terminal-plus-90-day retention.** New captures receive a non-eligible pending boundary. The first transition to `READY`, `SAFE_FAILURE`, or `STALE` atomically writes `terminal_disposition_at` and exactly +90 days; database guards reject a terminal state without that boundary and prevent later mutation. All 17 stored v26 signals reproduce an exact 7,776,000,000 ms interval.
3. **Atomic legal-hold and policy recheck.** The retention authorization now binds cutoff, latest policy version, ruling digest, and activation receipt. The parent delete executes first inside the same atomic batch, and its database trigger rechecks terminal state, age, latest active 90/≤30 policy, bound digests, and absence of an active hold at deletion time. A regression injects a new `HOLD` after candidate selection but before the batch; deletion returns zero and all rows remain. After a later append-only release, the governed deletion succeeds.
4. **Workspace focus and Ready announcement.** The actual hosted v26 Ready transition focuses `H2#signal-workspace-title` and exposes exactly one atomic polite status: “Proposal ready for human review. No work item has been created.” Focus remains on the heading after authoritative content loads. The focused hosted axe scan reports zero violations, 41 passes, and zero incomplete checks; explicit contrast regression remains green.
5. **Authoritative cohort boundary.** The regenerated artifact derives its start from authoritative signal/rejection records and its completion from the maximum included `signal_generation_attempts.completed_at`. The frozen completion is `2026-08-19T19:18:53.620Z`, exactly the completed time of case V26X-20 and later than every included case start.

## Complete Exam rerun

- Local production build, typecheck, lint, and 146/146 tests: PASS.
- GitHub required `repository-contract`: PASS, run `32290690386`, job `96190539933`.
- Dependency audit: zero findings. Ruff, mypy, pytest 16/16, gauntlet self-test, shell/workflow/container validation, and Semgrep: PASS.
- Hosted denominator: 20/20 PASS against threshold 18; 16 real Luna proposals, three pre-provider safety rejections, and one controlled `MODEL_POLICY_MISMATCH` safe failure.
- Hosted performance: capture p95 282 ms ≤ 750 ms; generation p95 15,655 ms ≤ 60,000 ms.
- Provenance: 17/17 attempts exact-revision bound; 16/16 proposals use Luna and the exact implementation revision; 16/16 source revision/digest pairs match.
- Existing governed state: all 40 protected non-signal tables retain the reference 572 rows with no count change; migrations and runtime statements touch only signal stores for this slice. Work-item and unsupported-fact side-effect counters remain zero.
- Production: latest saved production version remains 36 at source `8aa6e634c4b04f2198ec0941a7e8d5c7bee88d4f`; production D1 remains 34 tables with no `signals` or `signal_*` stores. Production was not mutated.

## Controlled deployment record

- Exact-success deployment/environment 15: `appgdep_6a85fe2072f481919c566744169c69cb`
- Controlled model-policy mismatch deployment/environment 16: `appgdep_6a86013c5df081919b72294fb61c6547`
- Restored Luna deployment/environment 17: `appgdep_6a8601ab2f808191b08f9d6c6ba67c8e`

The safety harness initially encountered an unrelated global refresh alert while qualifying the API-key rejection path. Its content-free API-key rejection (`01a01b73-7deb-7fec-a595-0d2ac13cd95a`) is retained and disclosed outside the frozen denominator. The scoped intake-dialog run was then observed directly and is the V26X-17 denominator case. This extra rejection made no provider call and no work-item change.

## Evidence bindings

- `steer/evidence/0070-hosted-staging-cohort-v26.json` — SHA-256 `3770ee9daad39d7fe13c95ea866b4e6cd2086ed03e22d03c42f6989525e8c2e3`
- `steer/evidence/0070-hosted-accessibility-focus-v26.json` — SHA-256 `bd5c966f66189bf4ee053531d3b4b3ecdce37fe00e92b47878df558889e425c8`
- Prior accepted unchanged-state matrix: `steer/evidence/0070-hosted-accessibility-matrix-v25.json`
- Prior independently reproduced 40-table snapshot: `steer/evidence/0070-staging-v22-rollback-evidence.json`

## Recommendation request

Ask the independent Critic to review only the exact target and evidence above against the five findings in `steer/evidence/0070-independent-critic-a12ddf4.md`, while preserving the unchanged amended Gate 2 scope. No Gate 3 action is authorized by this packet.
