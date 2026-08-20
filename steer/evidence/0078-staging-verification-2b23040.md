# Issue #78 staging verification

Date: 2026-08-20  
Environment: canonical owner-only staging  
Exact staged source: `2b2304035c8ab2efa5698c983d067baf330e9e91`  
Sites version: 44  
Sites environment revision: 28

## Outcome first

The dedicated Signal Backlog implementation is working on canonical staging. It exposes all 70 retained owner-POD signals, keeps Product Backlog work-only, preserves the existing issue #70 signal workspace, passes the focused #70/#77/#78 regression suites, and remains within the approved latency budgets. The rollback to pre-#78 version 42 and restoration to exact version 44 both succeeded. Production remained untouched at version 36/source `8aa6e634c4b04f2198ec0941a7e8d5c7bee88d4f`.

The signal workflow is green on canonical owner-only staging. Complete repository testing is 179/179, so the amended SB-19 exception is not invoked. Exact before/during/after SHA-256 projections match for all nine issue #70 signal tables across a second pre-#78 rollback and exact-target restore.

This packet is not Gate 3 ready under the frozen Exam wording. SB-16 requires three states to be exercised on the hosted owner-only environment even though that environment has one enrolled owner, 70 retained signals, and no authorized fault injector. SB-20 does not state a table scope, while the completed rollback proof is exhaustive for the signal subsystem rather than every unrelated work/authority table. Those two evidence-contract mismatches require a narrow governed amendment; no hidden staging backdoor was added to manufacture them.

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

## Remaining exact closures

1. Amend SB-16 so real hosted states are exercised where naturally reachable, while permission failure, network/retry failure, and empty POD may be proven by the exact API/D1 authorization and empty-data contracts plus agent-operated isolated UI rendering. The amendment must prohibit a hidden staging fault-injection path.
2. Amend SB-20 to bind rollback hashes to every signal-subsystem table, schema, and index plus semantic no-side-effect regression coverage for unrelated work/authority data. The completed rollback already satisfies that signal-scoped boundary.

No PR, merge, production deployment, Release, closure, Gate 3, or Critic review was performed.
