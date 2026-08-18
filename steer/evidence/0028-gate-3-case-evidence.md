# STR-028 Gate 3 case evidence

Status: **READY FOR FRESH INDEPENDENT CRITIC — required human accessibility and provider-recovery rulings recorded**

Target source commit: `251618abb8d60eddd64f9ee9245b73030f33eb08`

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

- Full build and test suite: 135 passed (25 JavaScript and 110 TypeScript),
  0 failed.
- TypeScript and lint checks: passed on the target source state.
- Production dependency audit: 0 vulnerabilities.
- Owner-only staging version 11 deployed with environment revision 1 as
  deployment `appgdep_6a847df2f9e08191bdab7f163273e1c0`.
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
  Target `251618abb8d60eddd64f9ee9245b73030f33eb08` replaces the two
  fire-and-forget requests with one validated D1 batch. The version 11 FAIL-02
  retest persisted telemetry rows 26 and 27 with the same timestamp
  (`2026-08-18T15:45:48.524Z`): latency `12ms` and outcome `validation`.
- The exact version 11 target was rechecked at `320×800` after the telemetry
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

## Open evidence and rulings

1. Obtain a fresh independent signed Critic result against the exact Gate 3 target.
2. The target fails closed while the latest dispatch privacy policy remains
   `BLOCKED_BACKUP_RULING`. Before production dispatch is enabled, the approved
   ruling must be persisted as a new immutable `ACTIVE` policy version. The
   Critic must determine whether the release-time authenticated activation path
   is sufficiently evidenced or remains a Gate 3 blocker.

Production, merge, release, closure, and Gate 3 remain unauthorized.
