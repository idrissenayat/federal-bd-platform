# STR-028 independent Gate 3 Critic review — `d9dbe0b`

Date: 2026-08-18  
Review stage: `GATE_3_BUILD`  
Recommendation: **BLOCK**  

## Outcome

The implementation's bounded functional behavior is substantially green: the exact
target and artifact digests reproduce, the staging runtime files match the target,
all 135 local tests pass, and the frozen 20 case paths pass in isolated synthetic
fixtures under the explicit non-production privacy override. Production remains on
the pre-STR-028 baseline.

Gate 3 is nevertheless **BLOCKED**. The latest deployed privacy-policy row is still
`BLOCKED_BACKUP_RULING`, and the reviewed implementation has no authenticated route,
UI, migration, or exact operational procedure that can append an immutable `ACTIVE`
version bound to the supplied human ruling. The policy schema cannot bind the ruling
URL, digest, or authorizing event. In addition, AT-16's target inventory predates and
omits the new review-lifecycle stores, AT-18's complete measured 20-case ledger/p95
evidence does not exist, and the rollback/accessibility evidence does not exercise
all frozen oracles against the exact final target. A default-closed implementation is
safe while blocked, but being safely disabled is not evidence that the release-time
activation boundary is operable and governed.

This Critic result is advisory evidence only. It does not approve Gate 3, authorize a
deployment, or mutate production.

## Exact authority and target binding

| Authority | Expected | Independently reproduced |
|---|---|---|
| Approved Brief | commit `0f83de8248771d35292ee57b56186493b5b71b1a`; SHA-256 `4776f295226a75ad17651efafb86b698825bdde2c177ed07a231903d52c0f7af` | PASS |
| Frozen Exam | commit `1be1182774071b4be7ba42f6ec3027f0f0b30e9a`; SHA-256 `d29c3922d3ed0e6dd1f3ee736c10d5db4a4ec806028614422bbb00042283d7b8` | PASS |
| Implementation | commit `251618abb8d60eddd64f9ee9245b73030f33eb08` | PASS |
| Commit object digest | `e631998693d008f978381b9debb63ff534f6faaf9fc4c6f5509ec50ca07ff779` | PASS from exact Git object bytes including the `commit <len>\0` header |
| Target artifacts | 19 packet entries | PASS: every size and SHA-256 reproduced |
| Artifact manifest | `2a396e88e1cfbb61bddb6f4860efc0ccf783197a55acb30bfbfbf35facaf36ee` | PASS from canonical manifest bytes |
| Evidence-only revision | `d9dbe0b70e812f680ae23fad2ce4ffafc6e65229` | PASS: descendant of the target; only the case-evidence and target-packet files differ from `251618abb` |
| Staging version 11 | saved version ID and archive digest in packet | PASS: Sites reports version 11, commit `18f31fa5fdbe20fb95368a6a735072e2582b451c`, archive SHA-256 `462e7a...`; all 18 packaged runtime/test files hash-match their target counterparts after the package root mapping |

## Frozen 20-case mapping

“Functional PASS” below means the isolated non-production behavior was independently
reproduced by the green suite. It does **not** make the overall Gate 3 packet pass:
every dispatch/review success fixture uses `DISPATCH_ALLOW_TEST_PRIVACY_POLICY=true`
(`flight-board/tests/work-economics-server-controls.test.ts:10-20`), while the same
test proves the real blocked policy returns `409` without creating a receipt
(`:467-497`). The required per-case ledger and AT-18 observations are addressed in
the findings.

| Case | Result | Independent evidence |
|---|---|---|
| `SAVE-01` | Functional PASS | Exact server test at `work-economics-server-controls.test.ts:254`; staged success/reload account at case evidence lines 20 and 69-74 |
| `SAVE-02` | Functional PASS | Exact correction/audit test at `:266`; staged restoration/reload account at evidence lines 21 and 69-74 |
| `SAVE-03` | Functional PASS | Exact lower-bound test at `:279` |
| `SAVE-04` | Functional PASS | Exact upper-bound/long-text test at `:298`; 320px evidence at lines 23 and 63-68 |
| `DISP-01` | Functional PASS, release-blocked | Receipt/replay test at `:467`; signed delivery/ack chain at `:841`; blocked without test override at `:494-496` |
| `DISP-02` | Functional PASS, release-blocked | Original receipt identity and replay counts at `:497-505`, plus exact authorization replay at `:924-939` |
| `DISP-03` | Functional PASS, release-blocked | Service-authenticated read and signed acknowledgement at `:841-939`; no human UI dependency in the fixture |
| `DISP-04` | Functional PASS, evidence-qualified | Named atomic live region/one action and contrast at `work-economics-accessibility.test.ts:46-70`; human keyboard/VoiceOver wording at case evidence lines 84-87 |
| `FAIL-01` | Functional PASS | Stale r0/r1 test at `work-economics-server-controls.test.ts:236`; staged conflict account at evidence line 28 |
| `FAIL-02` | Functional PASS | Validation/no-overwrite test at `:319`; staged validation account and atomic rows 26/27 at evidence lines 29 and 75-80 |
| `FAIL-03` | Functional PASS | F03-A..F loop and forbidden-side-effect counts at `:330-389` |
| `FAIL-04` | Functional PASS | F04-A..E fence-before-send loop at `:392-465` |
| `ORDER-01` | Functional PASS | `post-write.test.ts:29` |
| `ORDER-02` | Functional PASS | `post-write.test.ts:70` |
| `ORDER-03` | Functional PASS | `post-write.test.ts:57` |
| `ORDER-04` | Functional PASS | `post-write.test.ts:70` |
| `REC-01` | Functional PASS, release-blocked | Exact receipt/authorization/ack replay assertions at `work-economics-server-controls.test.ts:467-510` and `:924-939` |
| `REC-02` | Functional PASS, release-blocked | Concurrent submission test at `:512` |
| `REC-03` | Functional PASS, release-blocked | Lost-response/discovered-delivery reconciliation test at `:538` |
| `REC-04` | Functional PASS, release-blocked | R04-A plus explicit successor at `:602`; R04-B..F at `:690`; manifest closure test in `str028-manifest.test.ts:18-25` |

## Acceptance-test mapping

| Exam oracle | Result | Basis |
|---|---|---|
| AT-01 | PASS for non-production build | `SAVE-01..04` server tests plus staged SAVE-01/02 authoritative reload observations |
| AT-02 | PASS for non-production build | `FAIL-01/02` tests and staged inline error, focus, preserved-input observations |
| AT-03 | PASS | Deterministic `ORDER-01..04` tests in `post-write.test.ts:29-72` |
| AT-04 | **INCOMPLETE / BLOCK** | Pending and narrow states exist, but the packet does not execute the complete unavailable + page-reload-failure oracle. Quiet reconciliation failures are intentionally suppressed at `page.tsx:810-829`, so the claimed explicit reload-error state is not demonstrated. |
| AT-05 | PASS in synthetic fixture; production blocked | One receipt/outbox/QUEUED and signed delivery-to-ack sequence pass; privacy override caveat applies |
| AT-06 | PASS in synthetic fixture | Exact reload/replay identity and no-duplicate assertions pass |
| AT-07 | PASS in synthetic fixture | Service-authenticated read and enrolled-key acknowledgement pass |
| AT-08 | PASS for implemented UI path, evidence-qualified | Automated live-region/contrast plus supplied human keyboard/VoiceOver ruling; exhaustive-state gap is captured under AT-17 |
| AT-09 | PASS in synthetic fixture | Exact authorization and acknowledgement replay remain one lineage |
| AT-10 | PASS in synthetic fixture | CAS/concurrency and reservation fencing tests pass |
| AT-11 | PASS in synthetic fixture | Lost response reconciles discovered delivery before retry |
| AT-12 | PASS in synthetic fixture | All F03-A..F reset paths reject before receipt/side effect |
| AT-13 | PASS in synthetic fixture | All F04-A..E paths terminalize/invalidate without send |
| AT-14 | PASS in synthetic fixture | All R04-A..F paths and explicit same-lineage successor conditions pass |
| AT-15 | PASS in synthetic fixture | BIP-340/JCS event, signer, authority, replay, and lifecycle negative tests pass |
| AT-16 | **FAIL / BLOCK** | The inventory is incomplete and still declares the provider boundary blocked; the ACTIVE transition is not executable or bound to the ruling. Details below. |
| AT-17 | **INCOMPLETE / BLOCK** | Axe/contrast, 320px, SAVE/FAIL focus, and the supplied human ruling are useful. The packet does not enumerate human or equivalent executable observations for transport failure, empty/unavailable, and reload states required by Exam lines 349-357. |
| AT-18 | **FAIL / BLOCK** | No complete 20-case telemetry ledger or both-histogram p95 calculation exists. Direct staging rows cover only four case IDs and no dispatch histogram. |
| AT-19 | **INCOMPLETE / BLOCK** | Sites confirms the version-8 restore deployment succeeded, but the evidence does not rehearse rollback of exact version 11 or prove the frozen data, in-flight, duplicate, post-rollback feedback, RPO, and RTO assertions. |

## Material findings, ordered by severity

### Blocker 1 — No authenticated, immutable ACTIVE-policy activation boundary exists

The application creates only policy version 1 with status
`BLOCKED_BACKUP_RULING` (`flight-board/worker/api.ts:750-755`). Dispatch reads the
latest version and returns `PRIVACY_BACKUP_RULING_REQUIRED` unless it is `ACTIVE` or
the test override is exactly `true` (`:1093-1107`); signed review creation has the
same bypass (`:1915-1919`). The complete authenticated route table at `:2798-2838`
contains no privacy-policy activation endpoint, and there is no corresponding UI or
runbook in the target. Staging's only row is version 1 / blocked, and staging has the
test override enabled.

The table schema records version, inventory binding, retention values, status,
`changed_by`, reason, and time (`flight-board/drizzle/0015_material_doorman.sql:1-15`).
It has no field for the approved ruling's immutable URL, digest, receipt/event ID, or
authority tuple. A direct SQL insert could therefore be append-only, but the packet
does not supply an authenticated procedure and the row could not cryptographically
bind the ruling. Case evidence itself leaves this unresolved at lines 98-102.

The target correctly fails closed. That safety property is a PASS; release-time
operability and governance are a FAIL. An undocumented privileged database edit is
not sufficient under AT-16's “observable, not merely documented” requirement.

### Blocker 2 — AT-16's immutable data inventory is stale and incomplete

The target inventory says Privacy/Security ruling is still required before Gate 3
(`steer/evidence/0028-dispatch-data-inventory.md:3`) and says `agent_reviews` is not
connected to the required signed review lifecycle (`:32`). The same target adds
`review_assignments`, `review_events`, `review_retention_holds`,
`review_retention_authorizations`, `review_retention_runs`, and new assignment
references on three existing tables
(`flight-board/drizzle/0018_review_assignment_lifecycle.sql:1-72`). None of those
stores or fields is inventoried with purpose, source, controller, access, owner,
retention, deletion, and hold behavior. `dispatch_privacy_policies.changed_by` is
also an identity-linked policy field absent from the inventory.

The executable review retention test at
`work-economics-server-controls.test.ts:1019-1055` is valuable, but it cannot replace
the frozen Exam's required complete inventory. The provider section also still calls
the boundary an explicit blocker (`0028-dispatch-data-inventory.md:53-71`) rather
than binding the later human ruling. AT-16 therefore fails even before considering
activation.

### Blocker 3 — AT-18 and the frozen case-ledger evidence are not complete

Exam AT-18 requires every one of the fixed 20 cases to emit its expected outcome and
one terminal UI feedback observation, with measured p95 <=250ms for both named
histograms. The required ledger also mandates seed/config, action identity, expected
authority/UI, actual IDs, transport result, telemetry, and result for each case.
`0028-gate-3-case-evidence.md:18-39` is a prose mapping, not that ledger.

Direct read-only inspection of staging's `steer_telemetry` table found case labels
only for `SAVE-01`, `SAVE-02`, `FAIL-01`, and `FAIL-02`; it contains no
`steer_agent_handoff_feedback_latency_ms` rows. The first `FAIL-01` run has latency
but no paired outcome, exactly as acknowledged at case-evidence lines 75-80; only
`FAIL-02` was rerun after the atomic batch correction. Consequently neither full
denominator, missingness, terminal-observation count, nor both p95s can be computed.
The atomic telemetry implementation test at
`work-economics-server-controls.test.ts:209-233` proves the fix's mechanism, not the
frozen measured matrix.

### Blocker 4 — Exact-target rollback and exhaustive accessibility evidence are absent

Sites independently confirms that the cited version-8 restore deployment succeeded,
and version 11 is now deployed. The packet records only that staging moved to version
5, its prior UI was observed, and version 8 was restored
(`0028-gate-3-case-evidence.md:56-58`). It does not show a rollback of the final
version-11 target, preserved authoritative state/history, fail-closed treatment of an
in-flight ambiguous action, zero duplicate identities/events, an honest
post-rollback pending/success/failure smoke, or measured RPO/RTO as AT-19 requires.

For AT-17, the human statement at case-evidence lines 84-87 is accepted as genuine
keyboard/VoiceOver evidence, and the automated axe/contrast plus narrow checks pass.
It does not identify the frozen transport-failure, empty/unavailable, or reload
states. The packet therefore cannot close the exhaustive release-blocking oracle.

## Checks independently reproduced

- Exact Brief, Exam, commit-object, 19 artifact, and canonical manifest SHA-256
  verification: all PASS.
- Staging version-11 archive metadata: exact packet version, packaging commit, and
  archive digest; all packaged target runtime/test files match: PASS.
- `npm test`: PASS — build plus 25 JavaScript and 110 TypeScript tests, 0 failures.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm audit --omit=dev --audit-level=high`: PASS — 0 vulnerabilities.
- Sites deployment metadata: staging version 11 and cited version-8 restore both
  succeeded; staging is owner-only.
- Production boundary: production project remains version 34 sourced from
  `9c245083a8101de0c631c9dc92937765e12d39aa`, last updated before STR-028 staging;
  its D1 schema contains none of the STR-028 dispatch/review tables and its runtime
  environment revision is 0. No STR-028 production deployment or schema mutation is
  evident.
- Staging boundary: the D1 schema contains the STR-028 tables, the latest and only
  privacy-policy row is `BLOCKED_BACKUP_RULING`, and the explicit non-production test
  override is enabled.
- Evidence-only revision scope: only the packet and case-evidence files changed after
  the implementation target.

## Residual risks and required human decisions

- The approved provider-recovery ruling is a valid human policy decision, but a human
  must decide and authorize the exact application representation and eligible roles
  for activation; this Critic cannot invent that authority model.
- The test bypass is controlled only by an environment string
  (`api.ts:1106`, `:1918`), not an independently verified non-production identity.
  Production currently has no such variable, but release controls must prove it
  cannot be enabled as a substitute for an ACTIVE policy.
- A provider restore can resurrect rows deleted from live D1. The approved ruling
  makes the recovery window acceptable, but Platform/Ops still needs an executable
  restore procedure that reapplies the same retention/hold controls and records its
  result.
- The current inventory URL/digest is hard-coded (`api.ts:57-58`) to a document that
  says the ruling remains unresolved. Activating against that artifact without a new
  binding would leave contradictory evidence.
- Production promotion, data migration, policy activation, Gate 3 approval, merge,
  and release remain human-controlled actions and were not performed in this review.

## Exact required next action

Prepare a new implementation/evidence target that does all of the following before a
fresh independent Critic review:

1. Add an authenticated, POD-scoped, named-authority policy-activation command (or an
   equivalently executable and audited operational service) that uses expected-version
   CAS/idempotency, validates the exact 90-day/30-day ruling and inventory, and appends
   rather than updates an immutable `ACTIVE` policy version. Persist an immutable
   ruling URL, SHA-256, authorizing actor/event or receipt, reason, and timestamp;
   reject unauthorized, stale, replay-mismatched, missing, or contradictory requests.
2. Revise and bind the data inventory to include every review-lifecycle/retention
   table and field, the privacy-policy authority fields, the accepted provider-recovery
   rule, and the restore-time deletion/hold procedure. Update the hard-coded inventory
   binding and tests to the new immutable digest.
3. In owner-only staging, remove/disable the test privacy bypass, execute the
   authenticated activation, verify the latest row is the new ACTIVE version, and
   prove dispatch and signed-review creation work without the bypass while all
   unauthorized/mismatch paths remain closed.
4. Execute the complete frozen 20-case ledger once from its specified seeds, including
   all required fields/substeps, exactly one terminal UI observation per case, bounded
   telemetry, missingness accounting, and both measured p95 values. Re-run the full
   required keyboard/screen-reader state matrix.
5. Rehearse rollback from the exact new final staging version and record every AT-19
   invariant plus RPO/RTO and post-rollback smoke evidence. Rebind the Gate 3 packet to
   that exact commit/archive and request a new independent Critic review.

Production must remain untouched until those actions pass and the authorized human
Gate 3 decision is separately recorded.
