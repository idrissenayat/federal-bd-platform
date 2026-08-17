# Build evidence — 0007 Completed-work visibility

**Work item:** STR-029 / GitHub issue #59  
**Approved Brief:** `43409c2c4d4f0a334da89e0bc9ee6327a6d9d30e`  
**Approved Exam:** `b6b6bc6af8a96b12258e4b10579a10774b0f2ffa`  
**Implementation commit:** `46741278b9a7cce492183dcbdef6518fb2117abf`  
**Draft PR:** https://github.com/idrissenayat/federal-bd-platform/pull/60

## Result

The implementation is complete on the draft branch and has not been merged, deployed to
the production Flight Board, released, closed, or submitted for Gate 3. With the Product
Lead's explicit approval after Gate 2, the same product revision was published to a
separate owner-only staging project for Evaluate verification. It keeps the seven STEER lanes, derives
recent completed history without changing D1, separates active and completed counts,
removes movement/edit controls from completed records, preserves the server dispatch
barrier, adds an evidence-based phase timeline, and makes the final-lane exit criteria
explicit.

## Acceptance mapping

| Exam area | Evidence at the implementation commit | Status |
| --- | --- | --- |
| A1–A3 recent/default/history boundary | Pure helpers use `closed_at` when valid, otherwise the latest preserved `state → complete` activity. Frozen-clock tests cover exact seven-day inclusion, one millisecond older, invalid, missing, and future timestamps. | Pass |
| A4 search | `matchesBoardSearch` is shared by all work before lane partitioning; tests cover case-insensitive title and identifier matches plus whitespace. | Pass |
| A5 counts | `laneItems` returns non-complete work and visible completed history separately; lane headers label both and tests prove history does not inflate the active count. | Pass |
| A6 empty states | Lanes distinguish `Clear active airspace` from `No active work · completed history below`. | Pass by source/build inspection |
| B7 Completed status | Completed cards contain the visible text `Completed` in both the card status and history footer, with color used only as reinforcement. | Pass by source/build/lint inspection |
| B8 movement lock | Completed cards render no `card-move` region; the completed drawer replaces editable Work controls with a locked-record explanation. | Pass by source/build inspection |
| B9 audit access | The completed card remains a native button that opens the standard drawer, evidence links, Critic evidence, decisions, and activity. | Pass by source/build inspection |
| B10 dispatch invariant | Explicit authorization regression proves `state=complete` returns unauthorized with no handoff message. | Pass |
| C11–C14 phase timeline | Pure timeline tests prove evidence-time ordering, duplicate collapse, ignored unknown transitions, current-phase identification, and `Not recorded` for missing history. UI uses a labelled ordered list and native `<time>` values. | Pass |
| D15–D17 final lanes | Release, Observe, and Learn cues and drawer exit criteria name every requirement frozen in the Exam. Sense through Evaluate guidance remains present. | Pass by source/build inspection |
| E data/network/rollback | Toggle state is component-local; no schema, migration, API, D1 write, browser storage, or per-card request was added. Rollback remains a code revert and prior-site redeploy. | Pass |

## Commands and results

- `npm run lint` — pass.
- `npm test` — pass: production Vinext build, rendered shell test, five dispatch
  authorization tests, and six completed-history/timeline tests (12 total).
- Targeted strict TypeScript check for the changed app, helpers, tests, and dispatch
  boundary — pass.
- Repository-wide `npx tsc --noEmit` still reports only the pre-existing missing
  Cloudflare ambient names `Fetcher` and `D1Database` in `worker/index.ts`; the
  production build passes and STR-029 did not modify that file.
- `./scripts/gauntlet.sh` — pass after excluding ignored/reproducible Vinext `dist`
  output from the source scan: 35 readiness passes, one unrelated missing-SAM-credential
  warning, Ruff, mypy, pytest, gitleaks, OSV-Scanner, and Semgrep all green.
- Semgrep ran 252 rules across 111 tracked files with zero findings.

## Staging Evaluate evidence

The Product Lead explicitly approved a non-production test environment after Gate 2. An
owner-only staging site was created at
https://steer-flight-board-staging.idriss-enayat.chatgpt.site with its own D1 binding and
synthetic seed records. The production Flight Board remained on its existing Sites
project and version. Staging version 1 was built from implementation/evidence revision
`c8faf4d97cad7aae2f79b747ae86d6414d6ecff6` plus a staging-only hosting/package commit;
no product source changed between the approved implementation and staging build.

Authenticated in-app-browser checks on 2026-08-17 produced these results:

- Desktop at 1098 × 964: pass. All seven lanes, separate active/completed counts, final
  lane exit cues, the completed card, drawer timeline, and locked-record treatment were
  readable. No document-level horizontal overflow or console errors were observed.
- Narrow screen at 390 × 844: pass. The board uses an intentional horizontal lane
  scroller, cards remain readable, the drawer becomes a full-width audit surface, and no
  document-level horizontal overflow was observed.
- Completed history: pass. The default hides the seed record whose completion time is
  absent; `Show completed` reveals it in Learn with `1 completed`, does not inflate the
  `0 active` count, shows `Completion time not recorded`, and changes the empty state to
  `No active work · completed history below`.
- Search: pass. Searching `STR-012` retained the matching completed record while removing
  unrelated active cards; whitespace restored the complete board.
- Completed-state controls: pass. The completed card has no movement controls. Its drawer
  shows `Movement and dispatch controls are locked`, exposes evidence/activity for audit,
  renders the authorization action disabled, and states that completed execution is
  blocked. The server-side completed dispatch regression also remains green.
- Accessibility structure: pass. The page exposes main/navigation/complementary
  landmarks, labelled search and completed-history controls, a labelled ordered phase
  timeline, named native buttons, no duplicate IDs, no broken `aria-labelledby`
  references, no missing image alternatives, and a visible 3px keyboard focus outline.
- Keyboard execution: environment-limited. The in-app automation focused the native
  completed-card button and verified its visible focus treatment, but its Tab/Enter/Space
  commands did not dispatch to the page. Native-button semantics and lint/source checks
  pass, but one real keyboard traversal and activation remains required before Gate 3.

## Rollback

Revert implementation commit `46741278b9a7cce492183dcbdef6518fb2117abf` and rebuild.
No D1 data, schema, activity, decision, or evidence record needs repair. The prior hosted
site version remains the deployment rollback target.

---

EVALUATE: AUTOMATED + VISUAL + STRUCTURAL A11Y PASS / REAL KEYBOARD ACTIVATION PENDING
GATE 3: NOT REQUESTED
