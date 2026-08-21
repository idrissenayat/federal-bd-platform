# Issue #78 staging verification

Initial verification: 2026-08-20
Final reconciliation: 2026-08-21
Environment: canonical owner-only staging  
Exact staged source: `2b2304035c8ab2efa5698c983d067baf330e9e91`  
Sites version: 44  
Sites environment revision: 28

## Outcome first

The dedicated Signal Backlog implementation is working on canonical staging. It exposes all 70 retained owner-POD signals, keeps Product Backlog work-only, preserves the existing issue #70 signal workspace, passes the focused #70/#77/#78 regression suites, and remains within the approved latency budgets. The rollback to pre-#78 version 42 and restoration to exact version 44 both succeeded. Production remained untouched at version 36/source `8aa6e634c4b04f2198ec0941a7e8d5c7bee88d4f`.

The signal workflow is green on canonical owner-only staging. Complete repository testing is 179/179, so the amended SB-19 exception is not invoked. Exact before/during/after SHA-256 projections match for all nine issue #70 signal tables across a second pre-#78 rollback and exact-target restore.

The Product Lead approved the final evidence-contract amendment against pre-signature Exam revision `44effe361d68a17eed81ef65803b5a629023eef7`, SHA-256 `155f5513beb464651ef23d153455a1a1a096047af9bd0023b9149b65f41f2e7b`. SB-16 now permits exact staged-source rendering paired with the real API/D1 or client contract only for a state proven unreachable for the sole enrolled owner. SB-20 is explicitly signal-scoped. The reconciled packet satisfies both boundaries without adding a fault injector, identity bypass, test-only product route, or production branch.

This evidence packet is ready for independent Critic review. It does not itself authorize Gate 3, merge, production deployment, Release, or closure.

## Verified behavior

- Named Signal Backlog primary navigation; Product Backlog contains only admitted work.
- Counts: 70 total, 0 New, 0 Screening, 66 Ready for review, 4 Needs attention.
- Complete frozen pagination: 25, then 25, then 20; no duplicate or missing row observed.
- Literal search returned the expected one-row bounded result.
- Needs-attention filter returned exactly four needs-attention rows.
- Existing signal workspace retained original, proposal, provenance, attempts, events, retention, safe-failure detail, and opener-focus restoration.
- 320 CSS-pixel check had no horizontal overflow.
- True Chrome 200% browser zoom loaded 25 of 70 with client width equal to scroll width; zoom was reset to 100% afterward.
- One hundred concurrent authenticated hosted reads: 100/100 pass, 100 request identities, 100 response digests, only HTTP 200, only total 70, no unbounded retry.
- Thirty hosted requests: server p95 148 ms (budget 750 ms); visible p95 1,078 ms (budget 1,500 ms).

## Rollback

- Pre-#78 version 42/source `bfb2178cfee32d3667c7a188209f4c7d83db5d65` deployed successfully as `appgdep_6a874fd6af7481918775036947344370`.
- The old workspace loaded normally and exposed no Signal Backlog navigation.
- Exact version 44/source `2b2304035c8ab2efa5698c983d067baf330e9e91` restored successfully as `appgdep_6a87505130f081919f202668ed1b4f4b`.
- Signal Backlog restored with 70 records.
- Exact before/during/after canonical row projections matched for all nine signal tables: `signals`, `signal_sources`, `signal_events`, `signal_proposals`, `signal_rejections`, `signal_generation_attempts`, `signal_retention_authorizations`, `signal_retention_holds`, and `signal_retention_runs`.

## Verification commands

- Focused #70/#77/#78 suites: 38/38 pass.
- Typecheck: pass.
- Lint: pass.
- Build: pass.
- Production dependency audit: 0 vulnerabilities.
- Gitleaks: pass.
- Semgrep: 0 findings across 286 tracked files.
- Complete repository suite: 179/179 pass, including the issue #76 retention-ordering regression.
- Final 2026-08-21 rerun: build and 179/179 tests pass; typecheck pass; lint pass; production dependency audit reports 0 vulnerabilities.
- Sites reconciliation: staging remains private version 44/source `2b2304035c8ab2efa5698c983d067baf330e9e91`; production remains version 36/source `8aa6e634c4b04f2198ec0941a7e8d5c7bee88d4f`.

## Remaining governance step

Run an independent Critic against the frozen Brief, approved original and amended Exam authorities, exact staged source, and this reconciled evidence target. A Critic PASS is required before the Product Lead may consider Gate 3.

No PR, merge, production deployment, Release, closure, or Gate 3 was performed.
