# STR-028 Gate 3 case evidence

Status: **BLOCKED — manual accessibility and provider-backup rulings remain open**

Target source commit: `bfd500758ec9f770bbb9b48f12a661aa1adc6978`

Approved Brief: `0f83de8248771d35292ee57b56186493b5b71b1a`

Frozen Exam: `1be1182774071b4be7ba42f6ec3027f0f0b30e9a`

This record distinguishes implementation-level automated proof from the frozen
20-case staging run. A green automated test is not represented as a completed
manual staging case.

## Fixed case denominator

| Case | Exact automated evidence | Staging/manual status |
|---|---|---|
| SAVE-01 | `work-economics-server-controls.test.ts` — “SAVE-01 populates an empty optional Work Economics forecast from the authoritative response” | UI surface rendered on populated staging; fixed-case instrumented run not executed |
| SAVE-02 | `work-economics-server-controls.test.ts` — “SAVE-02 replaces an existing Work Economics forecast with one audited correction” | Fixed-case instrumented run not executed |
| SAVE-03 | `work-economics-server-controls.test.ts` — “SAVE-03 accepts valid lower-bound numeric forecast values” | Fixed-case instrumented run not executed |
| SAVE-04 | `work-economics-server-controls.test.ts` — “SAVE-04 accepts valid upper rubric values and long permitted text” | Narrow staging viewport not executed; browser viewport override did not change the real layout viewport |
| DISP-01 | `work-economics-server-controls.test.ts` — “successful dispatch creates one immutable receipt, outbox identity, and QUEUED event across replay”; “service fencing, verified relay delivery, signed agent acknowledgement, and agent read form one idempotent lineage” | Dispatch control rendered on populated staging; end-to-end relay case not executed |
| DISP-02 | Same replay test proves the original receipt/outbox/event IDs are returned without a duplicate | Reloaded staging control; authorized-receipt fixture not executed against staging |
| DISP-03 | Service-fencing test uses service authentication, signed acknowledgement, and agent read without a human UI session | Hosted agent/relay case remains blocked by the upstream Buzz CLI signature omission tracked in GitHub issue #52 |
| DISP-04 | `work-economics-accessibility.test.ts` — named atomic live region, one focus-stable action, and WCAG AA contrast tests | Desktop staging markup inspected; narrow viewport and screen-reader run not executed |
| FAIL-01 | `work-economics-server-controls.test.ts` — stale r0 against authoritative r1 returns 409 without a durable side effect | Fixed-case instrumented run not executed |
| FAIL-02 | Same file — invalid field set rejected without overwriting r1 | Fixed-case instrumented run not executed |
| FAIL-03 | Same file — all frozen F03-A..F03-F pre-receipt conflicts reject with one typed no-PII diagnostic | Fixed-case instrumented run not executed |
| FAIL-04 | Same file — all frozen F04-A..F04-E post-receipt mismatches fence before send | Fixed-case instrumented run not executed |
| ORDER-01 | `post-write.test.ts` — older bootstrap cannot overwrite a newer confirmed mutation | Fixed-case instrumented run not executed |
| ORDER-02 | Same file — latest explicit action result wins when an older save resolves later | Fixed-case instrumented run not executed |
| ORDER-03 | Same file — older dispatch projection cannot overwrite a newer receipt lifecycle event | Fixed-case instrumented run not executed |
| ORDER-04 | Same file — delayed old failure cannot replace a later authoritative success | Fixed-case instrumented run not executed |
| REC-01 | Successful-dispatch replay test returns the original immutable identity with one outbox/event chain | Fixed-case instrumented run not executed |
| REC-02 | `work-economics-server-controls.test.ts` — concurrent submissions commit one identity and one idempotent replay | Fixed-case instrumented run not executed |
| REC-03 | Same file — uncertain send reconciles a discovered relay delivery before acknowledgement without retry | Fixed-case instrumented run not executed |
| REC-04 | Same file — invalidation fences the old intent and permits exactly one same-lineage successor for R04-A..R04-F | Fixed-case instrumented run not executed |

The manifest tests separately prove that the signed denominator is exactly these
20 IDs and that the frozen FAIL-03, FAIL-04, and REC-04 substeps are unchanged.

## Verification completed

- Full build and test suite: 109 passed, 0 failed.
- TypeScript and lint checks: passed on the target source state.
- Production dependency audit: 0 vulnerabilities.
- Owner-only staging version 8 deployed with environment revision 1.
- Populated staging retained all 24 work items (20 open, 4 closed).
- Desktop staging inspection confirmed the STR-028 action-local dispatch status,
  named atomic live region, one disabled action when authorization is blocked,
  and preserved work-item data.
- Actual rollback rehearsal: staging was moved to saved version 5, the prior UI
  was observed, and saved version 8 was redeployed successfully as deployment
  `appgdep_6a8472b2e2dc81918fb105396251bd17`.

## Open evidence and rulings

1. Execute the frozen 20-case instrumented matrix in the sanctioned staging
   environment and report every case individually; do not infer it from unit or
   integration tests.
2. Execute real narrow-screen and screen-reader checks. Automated responsive,
   axe, landmark, focus-stability, and contrast tests are green, but they do not
   replace the two manual checks.
3. Record the Privacy/Legal ruling for provider backup recovery. Live D1 rows are
   deleted after 90 days, but provider Time Travel recovery is not row-purgeable.
4. Obtain a fresh independent signed Critic result against the exact Gate 3 target.

Production, merge, release, closure, and Gate 3 remain unauthorized.
