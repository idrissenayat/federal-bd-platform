# STR-028 Gate 3 case evidence

Status: **BLOCKED — manual accessibility and provider-backup rulings remain open**

Target source commit: `4fa02b1925f18874481925280042faafec59ea4c`

Approved Brief: `0f83de8248771d35292ee57b56186493b5b71b1a`

Frozen Exam: `1be1182774071b4be7ba42f6ec3027f0f0b30e9a`

This record distinguishes the executed isolated non-production fixture matrix
from the remaining manual UI observations. A green server/ordering fixture is
not represented as a completed narrow-screen or screen-reader observation.

## Fixed case denominator

| Case | Exact automated evidence | Staging/manual status |
|---|---|---|
| SAVE-01 | `work-economics-server-controls.test.ts` — “SAVE-01 populates an empty optional Work Economics forecast from the authoritative response” | Isolated server fixture PASS; source-level authoritative/local-feedback wiring PASS; staged operator mutation not executed |
| SAVE-02 | `work-economics-server-controls.test.ts` — “SAVE-02 replaces an existing Work Economics forecast with one audited correction” | Isolated server fixture PASS; source-level authoritative/local-feedback wiring PASS; staged operator mutation not executed |
| SAVE-03 | `work-economics-server-controls.test.ts` — “SAVE-03 accepts valid lower-bound numeric forecast values” | Isolated server fixture PASS; source-level authoritative/local-feedback wiring PASS; staged operator mutation not executed |
| SAVE-04 | `work-economics-server-controls.test.ts` — “SAVE-04 accepts valid upper rubric values and long permitted text” | Isolated server fixture PASS; real 320px staging viewport PASS on version 10 |
| DISP-01 | `work-economics-server-controls.test.ts` — “successful dispatch creates one immutable receipt, outbox identity, and QUEUED event across replay”; “service fencing, verified relay delivery, signed agent acknowledgement, and agent read form one idempotent lineage” | Complete synthetic signed-relay fixture PASS; staged blocked-state surface PASS |
| DISP-02 | Same replay test proves the original receipt/outbox/event IDs are returned without a duplicate | Isolated replay fixture PASS; staged control survives reload |
| DISP-03 | Service-fencing test uses service authentication, signed acknowledgement, and agent read without a human UI session | Isolated non-interactive service fixture PASS; hosted runtime remains separate issue #52 and is not substituted into this case |
| DISP-04 | `work-economics-accessibility.test.ts` — named atomic live region, one focus-stable action, and WCAG AA contrast tests | Automated markup/axe/contrast PASS; real 320px staging containment PASS; manual keyboard traversal and screen-reader observation pending |
| FAIL-01 | `work-economics-server-controls.test.ts` — stale r0 against authoritative r1 returns 409 without a durable side effect | Isolated conflict fixture PASS; source-level action-local failure wiring PASS; staged operator failure not executed |
| FAIL-02 | Same file — invalid field set rejected without overwriting r1 | Isolated validation fixture PASS; source-level action-local failure wiring PASS; staged operator failure not executed |
| FAIL-03 | Same file — all frozen F03-A..F03-F pre-receipt conflicts reject with one typed no-PII diagnostic | All isolated substeps PASS |
| FAIL-04 | Same file — all frozen F04-A..F04-E post-receipt mismatches fence before send | All isolated substeps PASS |
| ORDER-01 | `post-write.test.ts` — older bootstrap cannot overwrite a newer confirmed mutation | Deterministic response-order fixture PASS |
| ORDER-02 | Same file — latest explicit action result wins when an older save resolves later | Deterministic response-order fixture PASS |
| ORDER-03 | Same file — older dispatch projection cannot overwrite a newer receipt lifecycle event | Deterministic response-order fixture PASS |
| ORDER-04 | Same file — delayed old failure cannot replace a later authoritative success | Deterministic response-order fixture PASS |
| REC-01 | Successful-dispatch replay test returns the original immutable identity with one outbox/event chain | Isolated exact-replay fixture PASS |
| REC-02 | `work-economics-server-controls.test.ts` — concurrent submissions commit one identity and one idempotent replay | Isolated concurrency fixture PASS |
| REC-03 | Same file — uncertain send reconciles a discovered relay delivery before acknowledgement without retry | Isolated signed-relay reconciliation fixture PASS |
| REC-04 | Same file — invalidation fences the old intent and permits exactly one same-lineage successor for R04-A..R04-F | All isolated successor-lineage substeps PASS |

The manifest tests separately prove that the signed denominator is exactly these
20 IDs and that the frozen FAIL-03, FAIL-04, and REC-04 substeps are unchanged.

## Verification completed

- Full build and test suite: 133 passed (24 JavaScript and 109 TypeScript),
  0 failed.
- TypeScript and lint checks: passed on the target source state.
- Production dependency audit: 0 vulnerabilities.
- Owner-only staging version 10 deployed with environment revision 1 as
  deployment `appgdep_6a847929deb881919d08bc7bd47de8ae`.
- Populated staging retained all 24 work items (20 open, 4 closed).
- Desktop staging inspection confirmed the STR-028 action-local dispatch status,
  named atomic live region, one disabled action when authorization is blocked,
  and preserved work-item data.
- Actual rollback rehearsal: staging was moved to saved version 5, the prior UI
  was observed, and saved version 8 was redeployed successfully as deployment
  `appgdep_6a8472b2e2dc81918fb105396251bd17`.
- The first real 320×800 staging observation found the STR-028 drawer at
  `clientWidth=290` and `scrollWidth=485`. Source commit `c4278f6` reduced the
  overflow, but staging version 9 still measured `290/356` because Work controls
  and Agent authorization retained min-content width.
- Exact target `4fa02b1925f18874481925280042faafec59ea4c` removed those residual
  constraints. Staging version 10 measured body/document `305/305`, drawer
  `290/290`, drawer body `290/290`, and zero descendants outside the drawer
  boundary at a real `320×800` layout viewport. Visual inspection confirmed the
  title, advisory review, and governed controls remain legible and contained.

## Open evidence and rulings

1. Complete the missing operator-surface observations for SAVE-01..04, FAIL-01/02,
   and DISP-04 without modifying production data. The isolated server, ordering,
   cryptographic, recovery, and substep fixtures are already executed and green.
2. Complete manual keyboard traversal and screen-reader checks. The real
   narrow-screen check now passes, and automated axe, landmark,
   focus-stability, and contrast tests are green, but they do not replace those
   two assistive-technology observations.
3. Record the Privacy/Legal ruling for provider backup recovery. Live D1 rows are
   deleted after 90 days, but provider Time Travel recovery is not row-purgeable.
4. Obtain a fresh independent signed Critic result against the exact Gate 3 target.

Production, merge, release, closure, and Gate 3 remain unauthorized.
