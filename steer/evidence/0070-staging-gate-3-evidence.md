# Issue 70 staging Gate 3 evidence

## Exact authority and target

- Amended Gate 2 Exam pre-signature revision: `482a56abf5ecc262428d02613726a5c9f2c04d0d`
- Amended Exam SHA-256: `66a959826d327f8f4e7f69a95e438c93a76f48e45a9babc49b02708f3cfe98d5`
- Issue branch implementation/evidence runner revision: `a91c0aa`
- Exact staging source revision: `c5a0e92ad85cbf65e08b2cdc29168cb673620a8f`
- Saved staging version: v22, `appgprj_6a83763dc1148191b439c0795aa86a1c~appgver_538759291488819196a8c9b9d2ff2bed`
- Restored live deployment: `appgdep_6a85db580e0481919a5db2fe3f1d06f4`, succeeded with environment revision 6
- Canonical owner-only URL: <https://steer-flight-board-staging.idriss-enayat.chatgpt.site/>
- Runtime provider/model: OpenAI Responses API, `gpt-5.6-luna`, `reasoning.effort=low`, standard tier, `store=false`

Production was not deployed or migrated for issue 70. The production D1 overview contains no `signal*` tables.

## Connected Luna observations

### Credential fail-closed case

The initial connected signal was preserved with digest prefix `3f03fd514531` and entered `SAFE_FAILURE` after the staging secret was found to be empty. The provider returned `401 invalid_api_key`; the application stored `PROVIDER_4XX`, created no proposal, consumed no retry, and created no work item. The local secret was corrected without displaying it, a redacted direct check returned HTTP 200 from `gpt-5.6-luna`, and Sites environment revision 6 was deployed.

### Successful proposal case

Signal `01a01ac3-9ea3-7ccb-b4c4-ceef26c829e7` completed `READY` on its first attempt:

- exact original preserved; displayed digest prefix `340e56f760a2`
- model `gpt-5.6-luna`
- implementation `d21509c80596a74f52ccee23af5f0bf36830c357`
- 739 input tokens, 1,370 output tokens, estimated cost USD 0.001792
- disposition `CLARIFICATION_REQUIRED`, readiness `needs_clarification`, confidence `low`
- explicit problem, beneficiary, expected outcome, measurement approach, why-now, terminal condition, alternatives, dependencies, risks, evidence needs, and one material clarification
- zero verified facts from the contributor signal; separate inferences, assumptions, and unknowns with source references
- explicit exclusion of STR creation, admission, prioritization, Gate approval, assignment, and dispatch
- no work item created after the hosted observation

### In-flight rollback case

Signal `01a01add-fb0d-7387-8fd8-67486a27d9ab` started generation on v22 at `2026-08-19T16:32:36.442Z`. Its one Luna request completed at `16:32:49.146Z` while v21 rollback deployment `appgdep_6a85daad7c68819192b83c6ba8c50639` was publishing; v21 became live at `16:32:55.170959Z`. Both reverted v21 and restored v22 showed the same `READY` proposal v1. D1 contained exactly one attempt, one proposal, one source, and the three expected append-only events. No duplicate or late overwrite occurred.

The complete connected rollback record is `steer/evidence/0070-staging-v22-rollback-evidence.json`. All 40 non-signal governed tables (572 rows) had the identical before/during/after aggregate SHA-256 `b8ceb02d75086349d2b3f437678501f8ba9026625721dd73f54016fcc4e06851`; every individual table hash also matched.

## Frozen 20-case ledger

`steer/evidence/0070-case-ledger-c5a0e92.json` executes the real `handleApi` contract against isolated D1 stores with controlled provider outcomes; it does not hard-code actual states, attempts, telemetry, or database projections.

- 20/20 PASS
- capture p95 3 ms
- controlled generation p95 16 ms
- content-free telemetry PASS
- every protected work, decision, review, dispatch, notification, activity, and economics table byte-identical before/after each case
- cases include imperfect/Unicode capture, replay/conflict, schema success, unsupported-fact downgrade, malformed/unknown/missing output, credential/model/provider/timeout/token failures, safety rejection, concurrent retry reconciliation, retry exhaustion, POD isolation, enrolled agent capture, stale-source reconciliation, and supersession

The connected Luna completion took 19.8 seconds from capture to proposal-ready and remained below the 60-second hosted threshold.

## Accessibility and interaction

Agent-operated Google Chrome testing found and corrected one material issue: the modal focus trap omitted the provenance `<summary>`, preventing keyboard access to “How this proposal was produced.” The bounded fix adds `summary` to the shared focusable selector and is covered by `tests/signal-accessibility.test.ts`.

Hosted v22 results:

- initial focus: named `Close signal workspace` button
- forward Tab: `How this proposal was produced` summary
- Enter: disclosure opens and exposes the Luna/model provenance
- Tab from the final control wraps to Close
- Shift+Tab from Close wraps to provenance
- Escape closes the dialog and restores the exact signal-row opener
- captured hosted DOM: 49,328 bytes; axe 4.13.0 found zero violations with color contrast evaluated separately
- explicit signal text/surface color pairs meet WCAG AA in the regression test
- dialog, live status, safe-failure alert, advisory boundary, names, content order, and source classification were understandable from the Chrome accessibility tree

No human manual testing is claimed or required for this packet.

## Complete validation

Exact staging integration source `c5a0e92ad85cbf65e08b2cdc29168cb673620a8f`:

- production build PASS
- complete repository tests 145/145 PASS
- TypeScript typecheck PASS
- ESLint PASS
- production dependency audit: 0 vulnerabilities
- executable issue 70 ledger 20/20 PASS
- hosted Luna success PASS
- hosted keyboard/accessibility-tree PASS
- exact v22 → v21 → v22 rollback PASS
- production non-mutation PASS

The complete-suite run also discovered an unrelated wall-clock-expiring dispatch fixture. It was recorded separately as issue #72 and draft PR #73; its test-only correction is included in the exact staging integration so the full suite is repeatable. No runtime authorization behavior changed.

## Agent judgment

The connected proposal was useful decision preparation rather than a polished restatement. It explicitly stated what was not known, refused to promote contributor content into verified fact, asked one material outcome question, proposed measurable evaluation, and stopped before admission or execution. Safe failure was honest and content-free, and the original input remained recoverable.

Agent staging recommendation: **PASS pending independent Critic review of the exact target and this packet.** This evidence does not authorize merge, production deployment, Release, closure, or Gate 3.
