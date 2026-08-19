# Issue #70 independent Gate 3 re-review — BLOCK

Reviewed 2026-08-19 against the frozen amended Gate 2 Exam and the exact release target. This is an independent Critic review. It does not authorize merge, production deployment, Release, closure, or Gate 3.

## Exact review target

- PR evidence HEAD: `a12ddf409e5da002fc28c3b019c972785cf5c8e4`
- Release-target code: `d051ec93d700c6151e742c195eb2e40cfda51d8c`
- Amended Gate 2 Exam revision: `482a56abf5ecc262428d02613726a5c9f2c04d0d`
- Independently recomputed Exam SHA-256: `66a959826d327f8f4e7f69a95e438c93a76f48e45a9babc49b02708f3cfe98d5`
- Canonical staging version/source: version 25 / `52f8e6d96a129acfc890f3ea0691509aa75fa0e1`
- Final staging environment revision: 14
- Frozen runtime model: `gpt-5.6-luna`
- Persisted release-target implementation revision: `d051ec93d700c6151e742c195eb2e40cfda51d8c`

Evidence digests were independently recomputed:

- `steer/evidence/0070-gate3-closure-v25.md`: `379a0d82ad4c899dfcac01a8afcc0e75400c307c89708b66a26114686504efe3`
- `steer/evidence/0070-hosted-staging-cohort-v25.json`: `0675cce0a378f4884e2a4093e29fc45dda92e23678d3f2533d4f927c82281bd4`
- `steer/evidence/0070-hosted-accessibility-matrix-v25.json`: `062a7dadb100ec5bfd8e6f53433b1b7fb78469528bfb5db44c536b493d854dc7`

## Ruling

**BLOCK Gate 3.** The prior scanner, hosting-target, protected-table, and real-hosted-denominator gaps are materially closed. The exact target nevertheless fails frozen acceptance requirements for per-attempt provenance, terminal-retention semantics, legal-hold atomicity, and accessible focus/status transitions. The cohort evidence also declares a completion timestamp earlier than its twentieth case, so the frozen packet is not internally self-consistent.

## Blocking findings

### 1. Generation attempts do not record the implementation revision

Brief condition 7 and Exam acceptance test 6 require every attempt audit record to contain the implementation revision. `signal_generation_attempts` has provider, model, prompt version, timestamps, digests, outcome, usage, and cost, but no implementation-revision column (`flight-board/db/schema.ts:145-164`). Its insert and authoritative snapshot likewise omit that field (`flight-board/worker/api.ts:1802-1805`, `:2011-2014`). Only a successful `signal_proposals` row records `implementation_revision` (`:2039-2044`), so a failed attempt has no immutable binding to the executable revision. The hosted controlled-failure case V25X-20 demonstrates that gap: it has an attempt and no proposal.

Bounded remediation: add a required immutable implementation-revision field to the attempt schema/migration, populate it from the governed runtime binding when the attempt begins, expose it in the authoritative audit snapshot, and test success, failure, and retry paths against the exact environment revision. Re-run the approved Exam and hosted evidence after the migration.

### 2. The 90-day deletion clock starts at capture, not terminal disposition

The frozen Brief requires retention for 90 days **after terminal disposition**. The implementation computes `retention_delete_after` at capture (`flight-board/worker/api.ts:1782-1784`, `:1878-1882`). Transitions into `READY`, `SAFE_FAILURE`, or `STALE` update lifecycle state and `updated_at` but do not establish a terminal timestamp or reset the retention boundary; the database control makes the capture-time field immutable. The retention worker then selects terminal rows whose capture-derived date is due (`:2155-2165`). A signal that remains non-terminal for most of 90 days can therefore become terminal and be deleted immediately, contrary to the approved privacy boundary.

Bounded remediation: bind an immutable terminal timestamp and terminal-plus-90-day deletion boundary on the first terminal transition, make retention eligibility depend on that boundary, and add coverage for long-lived `CAPTURED`/`PROCESSING` records entering `READY`, `SAFE_FAILURE`, and `STALE`, including held records.

### 3. Legal-hold eligibility is not revalidated atomically with deletion

The worker selects candidates and checks for a live hold in one statement (`flight-board/worker/api.ts:2155-2185`), then later creates a service authorization and deletes each candidate in a separate batch (`:2195-2208`). That deletion batch does not re-check the live-hold, policy, lifecycle, or age predicate. A `HOLD` can commit after candidate selection and before deletion; the later batch will then delete both the hold and the signal. The serial hold/release tests do not prove this interleaving safe.

Bounded remediation: make final eligibility, active-hold absence, policy binding, authorization, and deletion one guarded atomic operation (for example, a conditional authorization/CAS whose success is required before deleting), and add a concurrent hold-versus-retention-run regression test.

### 4. Submission focus and Ready announcements do not meet the frozen accessibility contract

The approved design requires focus to move to the signal-workspace heading after submission. The deployed code instead moves focus to the Close button (`flight-board/app/page.tsx:1129-1133`); the heading at `:1833` is neither the focus target nor programmatically focusable. The v25 matrix confirms `initial_focus: "Close signal workspace"` for the actual hosted Ready state.

Exam acceptance test 12 also requires status changes to be announced once. Processing uses a polite live status (`:1842`), but the actual hosted Ready evidence records `announcement: null`, and the proposal surface at `:1848-1854` has no live-status transition. Thus a keyboard or screen-reader user is not given the approved post-submit focus destination or an atomic Ready announcement.

Bounded remediation: focus the workspace heading once when the authoritative workspace opens, add one atomic polite Ready announcement without duplicate updates, and rerun the actual hosted transition with keyboard and accessibility-tree evidence.

The disclosed stale evidence and conflict/permission evidence were reviewed strictly. The stale case uses the exact deployed lifecycle renderer because the immutable source cannot be changed through an authorized staging API. Conflict and permission use the shared deployed in-dialog error renderer plus exact 409/403 contracts. Those disclosed source-equivalent methods are acceptable for their bounded presentation claims; they do not cure the independent heading and Ready-transition failures above.

### 5. The frozen 20-case packet has an impossible completion boundary

The cohort JSON declares `cohort_completed_at: 2026-08-19T18:28:42.000Z`. An independent read of the authoritative staging database found V25X-20's attempt `01a01b48-7212-7857-9db7-5db3a7945aca` started at `2026-08-19T18:28:47.762Z` and completed at `2026-08-19T18:28:47.875Z`. The twentieth case therefore occurred 5.762 seconds after the packet says the cohort was complete.

The twenty outcomes themselves are present and coherent, but the declared frozen window is not. Bounded remediation: regenerate the cohort artifact with start/completion boundaries derived from authoritative records, recompute its digest, and rebind the closure packet.

## Independently verified closures and positive evidence

- The amended Exam bytes at revision `482a56a` exactly match the approved SHA-256.
- GitHub required check `repository-contract` passed for PR HEAD `a12ddf4` (run `32288577476`, job `96183860009`). The exact code target `d051ec9` also passed its repository contract (run `32284114771`, job `96169529666`), including the scanner step.
- Fresh local validation passed: production build, typecheck, lint, 146/146 tests, and production dependency audit with zero vulnerabilities.
- PR hosting metadata targets the production project; the staging project binding exists only in the staging source. No production deployment is authorized by this report.
- Canonical staging is owner-only, version 25, source `52f8e6d`, with environment revision 14, `gpt-5.6-luna`, and implementation binding `d051ec9`.
- The hosted denominator contains 20/20 passing behavioral cases against a threshold of 18: 15 real Luna proposals, four pre-provider safety rejections with the required bounded codes, and one honest controlled `MODEL_POLICY_MISMATCH` safe failure. Capture p95 is 316 ms (limit 750 ms); proposal p95 is 12,803 ms (limit 60,000 ms). Unsupported-fact and work-item-side-effect telemetry are zero.
- An independent paginated read of all 40 protected staging tables reproduced the pre/during/post byte hashes with no changed table: 572 rows before and 572 after. This closes the earlier invariant-evidence gap.
- The v25 accessibility artifact covers all eight named states at 320 px with zero reported axe violations, explicit contrast coverage, modal-contained capture errors, draft preservation, and focus restoration. Its own Ready-state evidence exposes the blocking focus/announcement mismatch above.
- Production remained unchanged: latest saved production version 36 predates the issue #70 run, and the production D1 overview has 34 tables with zero `signals` or `signal_*` tables. This review performed read-only validation and no production mutation.

## Gate 3 recommendation

Do not approve Gate 3 against `a12ddf4` / `d051ec9`. Apply only the bounded remediations above, preserve the unchanged approved scope and Luna runtime binding, rerun the complete frozen Exam, and obtain a fresh independent Critic review of the new exact revision and evidence hashes.
