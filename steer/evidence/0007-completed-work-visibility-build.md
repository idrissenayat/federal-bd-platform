# Build evidence — 0007 Completed-work visibility

**Work item:** STR-029 / GitHub issue #59  
**Approved Brief:** `43409c2c4d4f0a334da89e0bc9ee6327a6d9d30e`  
**Approved Exam:** `b6b6bc6af8a96b12258e4b10579a10774b0f2ffa`  
**Implementation commit:** `46741278b9a7cce492183dcbdef6518fb2117abf`  
**Draft PR:** https://github.com/idrissenayat/federal-bd-platform/pull/60

## Result

The implementation is complete on the draft branch and has not been merged, deployed,
released, closed, or submitted for Gate 3. It keeps the seven STEER lanes, derives
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

## Remaining Evaluate evidence

The in-app browser can open the unauthenticated local production server, but the board
API correctly refuses to return workspace data. A local authentication-injecting preview
was then blocked by the browser URL policy. No alternate browser or policy workaround was
used. Therefore desktop/narrow visual inspection, keyboard traversal, and automated
accessibility inspection against populated cards remain pending before Gate 3.

The hosted board is unchanged because Gate 2 explicitly prohibited deployment. These
remaining checks require either a sanctioned authenticated preview or the later protected
deployment/release workflow; they must be completed and evidenced before Gate 3 approval.

## Rollback

Revert implementation commit `46741278b9a7cce492183dcbdef6518fb2117abf` and rebuild.
No D1 data, schema, activity, decision, or evidence record needs repair. The prior hosted
site version remains the deployment rollback target.

---

EVALUATE: AUTOMATED PASS / MANUAL UI EVIDENCE PENDING
GATE 3: NOT REQUESTED
