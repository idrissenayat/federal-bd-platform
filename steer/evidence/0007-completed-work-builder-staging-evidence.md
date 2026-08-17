# Builder and staging evidence — 0007 Completed-work visibility

**Work item:** STR-029 / GitHub issue #59  
**Production baseline:** `9c245083a8101de0c631c9dc92937765e12d39aa`  
**Corrected application revision:** `e076342406fe71747f07e14c8c74405960788aa9`  
**Staging source revision:** `89ee52ca7d3fdfa8c79b8af8edb3445f42ab48b1`  
**Staging Sites version:** 2 (`appgprj_6a83763dc1148191b439c0795aa86a1c`)  
**Staging verification:** 2026-08-17T19:36-04:00  

**Boundary:** implementation and non-production staging evidence only. This does
not authorize merge, production deployment, release, closure, or Gate 3.

## Outcome first

**PASS for independent Evaluate review.** STR-029 is layered onto the exact source
revision currently deployed to production, and the resulting build is deployed only
to the persistent owner-only staging project. Production was not modified.

The staging source differs from the corrected application revision only in
`flight-board/.openai/hosting.json`, which binds the build to the staging project. The
application, tests, migrations, and build inputs are otherwise identical.

The earlier staging version 1 is superseded and must not be used as release evidence:
it was built from stale branch `codex/steer-flight-board` instead of the deployed
production source. Version 2 is the first production-parity STR-029 staging build.

## Implemented behavior

- All seven lanes remain present.
- Active WIP and completed history are counted separately.
- Recent completed work appears quietly by default; **Show completed** reveals older
  matching records without a database write.
- Completed cards are openable and keyboard-reachable but have no movement controls.
- The drawer derives a preserved phase timeline and labels missing transitions and
  completion time as **Not recorded** rather than inventing history.
- Release, Observe, and Learn show explicit operational exit criteria.
- Completed Work Economics is read-only while accepted records and audit events remain
  visible.
- The existing server dispatch boundary rejects `state=complete`; the visible Buzz
  handoff control is disabled for completed records.
- Active-card forecasts, production search fields, Work Economics editing, responsive
  navigation, protected writes, and production migrations remain intact.

## Automated verification

| Check | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| Focused completed-history, authorization, and Work Economics UI tests | 26 passed, 0 failed |
| `npm test` | Build passed; 99 tests passed, 0 failed |
| Accessibility fixture | No serious or critical axe findings |
| `./scripts/gauntlet.sh` | 35 readiness passes, 1 expected SAM.gov credential warning, 0 failures |
| Gitleaks | No leaks |
| OSV-Scanner | No issues in the scanned repository dependency set |
| Semgrep | 252 rules on 153 tracked files; 0 findings |
| `git diff --check` | Pass |

`npm ci` continues to report the inherited package audit disposition of 2 high and 4
moderate findings. STR-029 adds no dependency and no authentication, credential,
authorization-policy, endpoint, or security-policy change. The Gate 1 scope ruling
remains controlling; the findings are disclosed here and are not silently represented
as remediated.

## Live owner-only staging verification

Staging URL: <https://steer-flight-board-staging.idriss-enayat.chatgpt.site/>

Access was rechecked before deployment: custom owner-only access, one allowed owner,
zero allowed groups, and zero external visitors. Sites deployment
`appgdep_6a839956cb44819180c50f29b6e823c8` succeeded for saved version 2.

### Production design parity

Staging and production were compared in the same in-app browser at identical
viewports:

| Viewport | Staging | Production | Result |
|---|---|---|---|
| 1440 × 1000 | fixed 238px left navigation; main starts at x=238 | fixed 238px left navigation; main starts at x=238 | Match |
| 390 × 844 | 127px top navigation; main starts at y=127; 58px top bar | 127px top navigation; main starts at y=127; 58px top bar | Match |

Computed body font, radial background, sidebar width, and top-bar background were
identical. Page height differs only because staging and production contain different
records.

### STR-029 interaction proof

- With **Show completed** off, the staging board reported one older match without
  adding it to active WIP.
- Turning the control on exposed STR-012 in Learn as `0 active / 1 completed`.
- The completed card showed visible Completed text, no move buttons, and remained
  openable for evidence.
- Its drawer contained a labelled ordered phase timeline, explicit **Not recorded**
  states, the completed-record lock notice, evidence/activity sections, and a read-only
  Work Economics audit.
- Drawer inspection found zero Work Economics forms, zero inputs, zero selects, zero
  textareas, and zero work-control grids.
- The Buzz handoff button was present only as a disabled control and the authorization
  explanation included `Execution state is active` as unmet.

## Rollback and promotion contract

Rollback is Sites version 1 for the staging project or a revert of the STR-029 UI/helper
revision; D1 records and audit history are unchanged by the completed-history view.
Version 1 remains unsuitable as a production candidate because its source base was
stale.

The next step is independent Evaluate/Critic review of the corrected revision and this
evidence. If the result is acceptable, the Product Lead may issue Gate 3 against the
unchanged application revision. Only after that approval may the same validated
application revision be merged and deployed to the production Sites project. Any
runtime code change requires a new staging build and repeat verification.

