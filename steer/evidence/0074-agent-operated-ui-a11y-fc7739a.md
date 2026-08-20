# Issue #74 agent-operated UI and accessibility evidence — fc7739a

Generated: 2026-08-20T03:09:03.709Z

## Exact hosted target

- Staging project: `appgprj_6a83763dc1148191b439c0795aa86a1c` (owner-only; no groups or external visitors).
- Staging URL: `https://steer-flight-board-staging.idriss-enayat.chatgpt.site/`.
- Sites version: 38; saved version `appgprj_6a83763dc1148191b439c0795aa86a1c~appgver_17fba91296708191b81550aa894e7394`.
- Restored deployment: `appgdep_6a866e10ab048191ae1fe2a2ad001a88`, succeeded.
- Source revision: `fc7739ad780b31dfc18c1157890ac99eccd3e663`.
- Build SHA-256: `ede408b3c2ac6f238829d35e5643a10419fddfa630b6b49793f6116f94f698a8`.

## Agent-operated hosted checks

The browser was authenticated as the owner and set to true 200% page zoom through the staging URL query used by the application. The live decision UI was opened from real work items created by hosted run `rr74-v38-1787194069146`.

Observed server-authoritative states:

1. `RR74-DRIFT-VERIFICATION-RECEIPT`: `INVALIDATED`; the dialog announced “Verification reset — candidate changed,” named `VERIFICATION RECEIPT`, displayed candidate `fc7739ad780b`, and exposed exact old/new digests `ce62ad23 → 97bf1e25`.
2. `RR74-CLASS-ELEVATED`: `NOT_READY`; the dialog displayed a live 3h 42m advisory countdown, exact Aug 20 2:46 AM server boundary, completed controls, and an adjacent wait explanation.
3. `RR74-CLASS-CLOSED`: `NOT_READY`; after the authority refresh completed, the dialog displayed a live 23h 42m advisory countdown, exact Aug 20 10:46 PM server boundary, completed controls, and an adjacent wait explanation.
4. `RR74-SIGNER-WRONG-DOMAIN`: `NOT_READY`; the dialog named the missing Product Designer and explained that neither submitter nor Builder can fill the independent slot.
5. `RR74-SIGNER-TEAM-DUPLICATE`: the later SOLO policy change invalidated the earlier TEAM snapshot exactly as designed, and the hosted UI named `OPERATING MODE` with old/new digests rather than presenting stale missing-role authority.

Every observed state exposed exactly one `role=status` or `role=alert` node. The accessible tree named the modal “Gate 3 pending,” its server-authoritative region, tier, candidate, UTC verification and boundary, path, snapshot, completed controls, missing/reset controls, and next action.

Keyboard trace on the live invalidated state:

- Opening the governed decision placed initial focus on “Close governed decision.”
- `Shift+Tab` from the first control wrapped to “Cancel” inside the modal.
- `Tab` from “Cancel” wrapped to “Close governed decision.”
- `Escape` closed the governed decision and restored focus to the containing work-item drawer’s “Close item” control.

Live contrast measurement traversed 27 visible, enabled text samples in `decision-receipt-status` and `decision-governance`, composited their computed foreground/background colors, and applied WCAG large-text thresholds. Result: 27/27 pass; minimum ratio 5.17:1.

## Eight-state automated accessibility matrix

`flight-board/tests/release-readiness-accessibility.test.ts` renders all eight frozen states at 320 px and CSS zoom 2:

- default-open ready;
- elevated countdown;
- elevated missing signer;
- default-closed countdown;
- team missing roles;
- invalidated/reset;
- server failure;
- effective history.

For every state it verifies the expected copy, exactly one named live status, adjacent candidate/snapshot explanation, and zero serious or critical axe findings. The exact test passed at `fc7739a`. Color contrast was separately measured against the live hosted UI above instead of relying on axe’s JSDOM-incompatible contrast rule.

## Durable visual

- Screenshot: `steer/evidence/0074-hosted-ui-200pct-fc7739a.png`
- SHA-256: `84a89b655841113298ff6f2d622020d160982abb4ea2d3fd07de9af1d700d23c`
- Capture: authenticated live v38 invalidated state at 200% zoom, including the exact candidate, reset field/digests, completed controls, next action, Critic recommendation, and disabled ruling explanation.

No human testing was required and no production UI was mutated.

