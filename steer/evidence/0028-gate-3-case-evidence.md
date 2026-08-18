# STR-028 Gate 3 case evidence

Status: **READY FOR FRESH INDEPENDENT CRITIC — all prior Gate 3 blockers remediated and exercised in owner-only staging**

Target source commit: `d7040249d2f9d2e01f49b0cd944a2a547dc578f5`

Approved Brief: `0f83de8248771d35292ee57b56186493b5b71b1a`

Frozen Exam: `1be1182774071b4be7ba42f6ec3027f0f0b30e9a`

This record distinguishes the executed isolated non-production fixture matrix
from the completed human UI observations. Automated server, ordering, narrow-
screen, axe, and contrast evidence is not substituted for the separately
recorded human keyboard and VoiceOver ruling.

## Fixed case denominator

| Case | Exact automated evidence | Staging/manual status |
|---|---|---|
| SAVE-01 | `work-economics-server-controls.test.ts` — “SAVE-01 populates an empty optional Work Economics forecast from the authoritative response” | Isolated server fixture PASS; staged Work Economics correction showed pending then authoritative success, survived reload, and emitted bounded latency/outcome observations |
| SAVE-02 | `work-economics-server-controls.test.ts` — “SAVE-02 replaces an existing Work Economics forecast with one audited correction” | Isolated server fixture PASS; staged audited restoration showed authoritative success and reload reconciliation; temporary fixture value was removed |
| SAVE-03 | `work-economics-server-controls.test.ts` — “SAVE-03 accepts valid lower-bound numeric values” | Isolated exact lower-bound seed PASS; the shared staged Work Economics success surface passed in SAVE-01/02 |
| SAVE-04 | `work-economics-server-controls.test.ts` — “SAVE-04 accepts valid upper rubric values and long permitted text” | Isolated exact upper-bound/long-text seed PASS; real 320px staging viewport PASS on version 10 |
| DISP-01 | `work-economics-server-controls.test.ts` — “successful dispatch creates one immutable receipt, outbox identity, and QUEUED event across replay”; “service fencing, verified relay delivery, signed agent acknowledgement, and agent read form one idempotent lineage” | Complete synthetic signed-relay fixture PASS; staged blocked-state surface PASS |
| DISP-02 | Same replay test proves the original receipt/outbox/event IDs are returned without a duplicate | Isolated replay fixture PASS; staged control survives reload |
| DISP-03 | Service-fencing test uses service authentication, signed acknowledgement, and agent read without a human UI session | Isolated non-interactive service fixture PASS; hosted runtime remains separate issue #52 and is not substituted into this case |
| DISP-04 | `work-economics-accessibility.test.ts` — named atomic live region, one focus-stable action, and WCAG AA contrast tests | Automated markup/axe/contrast PASS; real 320px staging containment PASS; human keyboard/VoiceOver PASS recorded 2026-08-18 |
| FAIL-01 | `work-economics-server-controls.test.ts` — stale r0 against authoritative r1 returns 409 without a durable side effect | Isolated conflict fixture PASS; two-tab staging produced the typed 409, assertive inline alert, preserved attempted value, and focused the error without overwriting the authoritative record |
| FAIL-02 | Same file — invalid field set rejected without overwriting r1 | Isolated validation fixture PASS; staging version 11 preserved the invalid monetary/unit inputs, focused the assertive inline error, and left the server record unchanged |
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

- Full build and test suite: 143 passed (29 JavaScript and 114 TypeScript),
  0 failed.
- TypeScript and lint checks: passed on the target source state.
- Production dependency audit: 0 vulnerabilities.
- Owner-only staging version 15 deployed with environment revision 2 as
  deployment `appgdep_6a8492abc5688191bf64cd97ebf0e745`. The saved version
  is `appgprj_6a83763dc1148191b439c0795aa86a1c~appgver_2fd9606e584c8191bae1435479a52362`,
  packaging commit `ac142b72e1f78626b67779fcc726a934cd34c96b`, archive SHA-256
  `765ee2b41fcbdd6bd2cd2a7d893668bf8099d2c1f198ceb480983ebb63f723e8`,
  109 files.
- Populated staging retained all 24 work items (20 open, 4 closed).
- Desktop staging inspection confirmed the STR-028 action-local dispatch status,
  named atomic live region, one disabled action when authorization is blocked,
  and preserved work-item data.
- Exact-target rollback rehearsal: final version 15 was replaced by saved version
  14 in 14,978 ms, then exact version 15 was restored in 10,921 ms. RPO was zero.
  Before rollback, during version 14, and after restore, D1 retained policy v2
  ACTIVE, one dispatch receipt, one QUEUED outbox row, one dispatch event, one
  REQUESTED review assignment, and three hash-chained review events with identical
  IDs and hashes. Replaying the exact review packet after restore returned success
  without adding an assignment or event.
- The first real 320×800 staging observation found the STR-028 drawer at
  `clientWidth=290` and `scrollWidth=485`. Source commit `c4278f6` reduced the
  overflow, but staging version 9 still measured `290/356` because Work controls
  and Agent authorization retained min-content width.
- Runtime correction `4fa02b1925f18874481925280042faafec59ea4c`, retained by the
  exact Gate 3 target, removed those residual constraints. Staging version 10
  measured body/document `305/305`, drawer
  `290/290`, drawer body `290/290`, and zero descendants outside the drawer
  boundary at a real `320×800` layout viewport. Visual inspection confirmed the
  title, advisory review, and governed controls remain legible and contained.
- Staged SAVE-01/SAVE-02/FAIL-01/FAIL-02 operator observations exercised the
  shared Work Economics form without production data. Success applied the
  authoritative response and survived reload; stale/invalid submissions kept
  their attempted values, announced a useful assertive error, focused the error,
  and did not overwrite the authoritative record. The temporary SAVE-01 marker
  was restored through SAVE-02 and confirmed absent after reload.
- The first FAIL-01 staging run exposed one missing paired outcome observation:
  latency persisted but the independently fired conflict counter did not.
  The final target replaces the two
  fire-and-forget requests with one validated D1 batch. The version 11 FAIL-02
  retest persisted telemetry rows 26 and 27 with the same timestamp
  (`2026-08-18T15:45:48.524Z`): latency `12ms` and outcome `validation`.
- The contained exact source was rechecked at `320×800` after the telemetry
  change: body/document `305/305`, drawer and drawer body `290/290`, and zero
  descendants outside the drawer boundary.
- On 2026-08-18, Idriss Enayat supplied the human accessibility ruling:
  “STR-028 keyboard/VoiceOver PASS: controls, labels, advisory content, and
  dispatch status were understandable and keyboard-operable; focus remained
  visible and predictable.”
- On 2026-08-18, Idriss Enayat supplied the provider-recovery ruling:
  “I approve the STR-028 provider-recovery ruling: eligible live identity-linked
  records are deleted after 90 days; Cloudflare-managed Time Travel history may
  remain only for the configured recovery window, up to 30 days; recovery access
  is restricted; and restored data remains subject to the same deletion and hold
  controls.”
- The approved ruling was activated in staging through the authenticated UI as
  immutable policy version 2. It binds the complete inventory commit `4dd787c`,
  ruling commit `d9dbe0b`, actor, role, authorization event, idempotency key, and
  activation receipt. `DISPATCH_ALLOW_TEST_PRIVACY_POLICY` is absent from
  environment revision 2.
- Without the bypass, staging created exactly one durable STR-028 dispatch receipt
  `8329a2206554d7e117df1c1f6e5cf6e97f93ad07cdb876fbbaf3840f7b08b2cf`,
  one `#steer-team` outbox row, and one signed QUEUED event. A clipboard denial
  remained visible locally and did not permit reauthorization.
- Without the bypass, staging created exact signed Gate 3 review assignment
  `ccd80c7e0bdfc17f51233c06fc8c2557e005f395c2d69adc43934fcd921b64fb`
  for manifest `99a5f291a1ad24cbd41047115f2391afadec952a42dd03c03328ed733c93ff48`
  and commit-object SHA-256
  `346f45060d7f7815c115e28b9700e0de6f595f7e3b6971aff728021b9fb192f5`.
  REVIEW_TARGET_READY, REVIEW_ASSIGNED, and REVIEW_REQUESTED are one ordered,
  service-signed hash chain; exact replay created no duplicates.
- A preliminary staging assignment
  `f4a525b9e51616fc1d1bcc5eace1643e91c312493fe196b3302970268c7ef292`
  used a client-computed commit-object digest that omitted the Git object header.
  It remains immutably recorded as a superseded non-production rehearsal and is
  not the review authority. The corrected packet and exact assignment above pass
  independent commit-object reconstruction; staging therefore contains two
  distinct assignments and six events, while replay of either identity remains
  duplicate-free.
- The measured ledger `0028-case-ledger-d704024.json` contains all 20 frozen case
  IDs, one terminal feedback observation per case, every frozen FAIL/REC substep,
  no missing IDs, no hidden error, stale overwrite, or duplicate dispatch, and
  measured p95 values of 3 ms for save feedback and 1 ms for handoff feedback
  against 250 ms budgets.

## Open evidence and rulings

1. Obtain a fresh independent Critic result against exact target
   `d7040249d2f9d2e01f49b0cd944a2a547dc578f5`, review manifest
   `99a5f291a1ad24cbd41047115f2391afadec952a42dd03c03328ed733c93ff48`,
   the final measured ledger, and staging version 15.

Production, merge, release, closure, and Gate 3 remain unauthorized.
