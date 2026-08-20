# Issue #78 staging verification

Date: 2026-08-20  
Environment: canonical owner-only staging  
Exact staged source: `2b2304035c8ab2efa5698c983d067baf330e9e91`  
Sites version: 44  
Sites environment revision: 28

## Outcome first

The dedicated Signal Backlog implementation is working on canonical staging. It exposes all 70 retained owner-POD signals, keeps Product Backlog work-only, preserves the existing issue #70 signal workspace, passes the focused #70/#77/#78 regression suites, and remains within the approved latency budgets. The rollback to pre-#78 version 42 and restoration to exact version 44 both succeeded. Production remained untouched at version 36/source `8aa6e634c4b04f2198ec0941a7e8d5c7bee88d4f`.

This packet is not Gate 3 ready. Three hosted failure/empty accessibility states and the Exam's exhaustive before/during/after protected-table SHA-256 inventory remain open. Complete repository testing is also 178/179 because the pre-existing issue #76 same-millisecond dispatch-retention ordering test fails in isolation; #78 did not modify that path.

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

- Pre-#78 version 42/source `bfb2178cfee32d3667c7a188209f4c7d83db5d65` deployed successfully as `appgdep_6a8730c648788191b72b17ee4a2c72ec`.
- The old workspace loaded normally and exposed no Signal Backlog navigation.
- Exact version 44/source `2b2304035c8ab2efa5698c983d067baf330e9e91` restored successfully as `appgdep_6a873115a5548191916bc0d983d449f6`.
- Signal Backlog restored with 70 records.
- Exact before/after row projections matched for `signals`, `signal_sources`, `signal_events`, `signal_proposals`, and `signal_rejections`.

## Verification commands

- Focused #70/#77/#78 suites: 38/38 pass.
- Typecheck: pass.
- Lint: pass.
- Build: pass.
- Production dependency audit: 0 vulnerabilities.
- Gitleaks: pass.
- Semgrep: 0 findings across 286 tracked files.
- Complete repository suite: 178/179; only the independently reproducible issue #76 retention-ordering test fails.

## Remaining exact closures

1. Run permission-failure, network/retry-failure, and empty-POD states against the exact hosted target or obtain a governed amendment to SB-16. Local axe/contract fixtures already pass all eight states but cannot substitute for the frozen hosted requirement.
2. Capture the exhaustive before/during/after canonical SHA-256 projections for every issue #70 signal table and protected work/authority table, as required by SB-20.
3. Resolve issue #76 (or obtain an explicit bounded Exam ruling) so SB-19 can truthfully report a complete green repository suite.

No PR, merge, production deployment, Release, closure, Gate 3, or Critic review was performed.
