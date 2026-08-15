# Platform / Ops evidence — 0006 STEER Work Economics

**Prepared:** 2026-08-14T18:27:53-04:00

**STEER work item:** STR-017

**Implementation revision reviewed:** `7763b9319ece1ee0ea78c8ec080cbb2aa5eded60`

**Evidence/documentation baseline reviewed:** `3bfa5ae6f7caae9e490875c78fa5a54a35c89f73`

**Role:** Ops Agent preparing evidence for the named human Platform / Ops Lead

**Boundary:** evidence and an execution-ready operational procedure only. This review used
repository files, local builds, local tests, and temporary SQLite databases. It did not read
production data or secrets, query or change the hosted database, deploy, restore production,
roll back a deployment, merge, release, mark the pull request ready, request Gate 3, or approve
Gate 3.

## Recommendation

**Platform / Ops Gate 3 recommendation: BLOCK pending production evidence and a named human
ruling.** The exact implementation has credible local migration, rollback, data-integrity, and
query-projection evidence. The production controls required by REL-02..04 and the signed Brief
are not yet demonstrated. In particular, no immutable production backup identifier and restore
result, versioned deployment rollback rehearsal, automated provider-ingestion observation,
enforceable retention/deletion control, or Work Economics alert route is present in the reviewed
repository evidence.

An agent cannot convert this packet into the required Platform / Ops approval. The named human
Platform / Ops Lead must execute or witness the production/staging procedure below, attach the
provider-generated evidence, and record an authenticated ruling bound to the exact release
revision.

## Revision and artifact integrity

- `git diff --quiet 7763b931... -- flight-board` passed at evidence baseline `3bfa5ae...`.
  The `flight-board` implementation was byte-identical to the named implementation revision.
- The production build copied `.openai/hosting.json` and Drizzle migrations into
  `flight-board/dist/.openai`. Each packaged migration was byte-identical to its source.
- The committed hosting metadata identifies Sites project
  `appgprj_6a7ce092d7608191b97e3becd405c373` and D1 binding `DB`. It intentionally contains no
  credential. This identifies the intended deployment adapter; it is not evidence about the
  current production deployment or database.

| Migration | SHA-256 verified in source and built artifact |
|---|---|
| `0005_normal_iron_fist.sql` | `e5dbd16c0cca5ffb344b85028cff283be3a2cd43c22ec4e97dc14c4898f232d3` |
| `0006_sticky_sleeper.sql` | `a5ab3f0ef97d68b1687bf15e8a6cc0f11fe69d7aea23405dd90821ffb939eee4` |
| `0007_melodic_the_initiative.sql` | `85692126185ac27fab38d40d1ac533b83f043b711765abf53eeb2330403fafc8` |
| `0008_shiny_calypso.sql` | `7d320fa498cc4e5480a0608d4a465a1a1f40fdf4d72b236decad41219479bfad` |

## What local automation proves

| Concern | Locally proved fact | Limit of the proof |
|---|---|---|
| Migration | The migration test starts with an existing work item, applies migrations 0005–0008, preserves the existing record, creates nullable Work Economics values as unknown, adds explicit `work_type`, and creates the normalized fact/event structures. | It does not execute against the hosted D1 database or its real size, concurrency, permissions, and runtime limits. |
| Schema rollback | The same test removes the new index, triggers, tables, and columns and then confirms the original key, title, and next action remain. | The reverse sequence is destructive to Work Economics records. It is a test rollback, not authorization to run destructive SQL in production. |
| Audit integrity | Database triggers reject update and delete of `work_economics_events`; denial rows retain no prior/replacement payload. | A database operator/provider administrator remains outside the application privilege boundary; production permissions and backup immutability need human review. |
| Backup/restore mechanics | A temporary SQLite rehearsal applied the exact migrations, inserted a sentinel item and audit event, used SQLite backup/restore, damaged the source copy, restored to a new database, and returned `PRAGMA integrity_check = ok` for backup and restore. The sentinel row, all five Work Economics tables, nullable unknown value, `Unclassified` work type, and immutable-event trigger were recovered. | This is a local engine rehearsal. It does not prove Sites/D1 production backup creation, retention, availability, downloadability, or recovery time. |
| Forecast behavior | Tests prove current/stale/late/reforecast-required states, named-owner acceptance, blocked dependency preservation, explicit milestone/range/freshness, and failed dispatch for invalid forecasts. | Evaluation occurs when application data is read or a handoff is attempted. No scheduled evaluator or outbound stale/late alert is proved. |
| Actual economics | Authorized writes validate and project role totals, provider facts, duration facts, and delivery events. Provider event IDs are unique per item/record kind; completeness and accepted/late/conflict states are retained. | The UI/API accepts governed telemetry or an audited correction. No automated provider collector, retry/dead-letter path, reconciliation schedule, or live provider observation is proved. |
| Outcomes | Human-governed outcome writes preserve explicit status and server-verify final evidence against an immutable GitHub revision/fingerprint. | No observation-date scheduler, evidence reminder, overdue alert, or external outcome-source ingestion is proved. |
| Denial audits | Same-POD authorization tests prove payload-safe denial rows and append-only history for item/work-economics control paths. | No operational export, rate baseline, anomaly threshold, on-call delivery, or acknowledgement evidence is proved. |
| Delivery events | Rework, defect, and rollback facts are separately queryable and the prior accepted JSON remains in the immutable audit trail when actuals are corrected. | Projection rows are rebuilt from an accepted/corrected Actual Economics record. No streaming event ingestion or severity alert is proved. |

## Production backup, migration, and recovery procedure

The steps below are the minimum evidence-bearing procedure. They must be executed by the named
Platform / Ops Lead using the approved Sites/D1 administrative control plane, without placing
credentials or production data in GitHub, STEER text fields, chat, or Buzz.

### Ownership

| Control | Accountable owner | Required witness / ruling |
|---|---|---|
| Release window, user impact, acceptance smoke | Product Lead | Tech Lead |
| Exact artifact, migration order, schema verification | Tech Lead | Platform / Ops Lead |
| Backup, isolated restore, deployment and rollback execution | Platform / Ops Lead | Tech Lead |
| Retention/deletion policy and production-data handling | Privacy / Legal | Platform / Ops Lead |
| Final release decision | Gate 3 quorum defined by the signed Brief | Authenticated evidence for every required authority |

### Before any production write

1. Record the production environment identifier, current deployment/revision identifier, D1
   database identifier, region/account context, UTC start time, operator identity, approved
   change window, and exact implementation SHA. Redact secrets and customer/work-item content.
2. Confirm the release artifact contains the four migration hashes listed above and no later
   implementation change. A changed implementation invalidates this packet and restarts the
   required verification/cooling sequence.
3. Put writes under an announced maintenance hold or another provider-supported consistent
   snapshot boundary. Record the control and the time it became effective.
4. Capture non-sensitive pre-change invariants: schema/migration version, row counts for
   `work_items`, `activity`, `decisions`, and existing Work Economics tables if present; at least
   one opaque sentinel key/ID; and the current application smoke result.
5. Create a provider-supported production D1 backup/export. Record its immutable backup/export
   ID, UTC creation time, source database ID, size, checksum if supplied, encryption/access scope,
   retention/expiry, and the operator. Do not proceed if the backup cannot be independently
   identified and retrieved.

### Restore verification before migration

1. Restore that exact backup into a new isolated non-production database. Never test recovery by
   overwriting production.
2. Bind only an isolated preview/smoke environment to the restored database and prevent outbound
   integrations. Record the restore database ID and deployment ID.
3. Verify database integrity using the provider-supported D1 integrity command or equivalent.
4. Compare the pre-change schema version, table counts, row counts, opaque sentinel records, and
   decision/activity evidence. Verify that application authentication and same-POD reads still
   work without exposing another POD.
5. If Work Economics events exist, attempt a transaction that updates and then deletes a test
   event in the isolated restore; both operations must fail with the immutable-trigger error.
6. Record elapsed backup and restore times. The Product and Tech Leads must accept the observed
   recovery point and recovery time before migration. A missing row, mismatch, integrity error,
   inaccessible backup, expired backup, or unbounded recovery time is an abort.

### Migration and post-migration verification

1. Apply migrations strictly in journal order 0005, 0006, 0007, then 0008 to the isolated restore
   first. Capture provider command result, duration, and schema/migration version after each step.
2. Verify all pre-change invariants remain; new JSON columns are `NULL` for legacy items; default
   POD and `Unclassified` work type are explicit; the five Work Economics tables, expected indexes,
   and both immutable-event triggers exist.
3. Exercise one synthetic, non-sensitive item through a forecast, actual, outcome, denied mutation,
   and rework/defect/rollback fact. Verify same-POD reads, query projections, conflict provenance,
   prior/replacement audit, and UI unknown/partial/conflict states.
4. Only after the isolated result passes may the named human authorities approve the same exact
   migration against production. Repeat captured invariants before lifting the write hold.

### Abort and recovery

- On application-only failure with schema/data invariants intact, revert traffic to the previously
  recorded verified deployment revision. Additive nullable columns and separate tables allow the
  prior application to ignore the new structures; this compatibility must still be smoke-tested.
- Do **not** use the test reverse SQL as the first production rollback. It drops tables/columns and
  would delete newly recorded Work Economics evidence. Prefer application rollback while retaining
  the additive schema.
- If migration damaged or lost authoritative data, keep production writes stopped, preserve the
  failed database for investigation, restore the verified backup to a new production candidate,
  repeat integrity/invariant checks, then change the production binding/traffic only through the
  approved provider control. Record data created after the recovery point as a reconciliation list;
  never silently discard it.
- Record a `rollback` delivery event and incident/decision evidence after recovery. A failed restore,
  unknown recovery point, unreconciled write, or unverified previous deployment keeps Gate 3 closed.

## Deployment rollback controls

The repository proves a deterministic production build and packages Sites metadata/migrations.
It does **not** contain or evidence a preview/canary environment, feature flag, health endpoint,
versioned deployment inventory, traffic-shift control, one-command rollback, rollback permissions,
or a twice-rehearsed rollback result. Therefore deployment rollback is **not operationally proved**.

Before a human Platform / Ops approval, attach all of the following from the approved hosting
control plane:

- current and candidate deployment IDs tied to Git SHAs;
- isolated preview smoke evidence for authentication, bootstrap, all four Work Economics records,
  a denied mutation, and database integrity;
- the exact operator-visible action/command for returning traffic to the prior deployment;
- two non-production rollback rehearsals with operator, UTC time, elapsed recovery time, health
  result, and proof that the D1 binding pointed to the intended database;
- post-rollback smoke and data-invariant results; and
- the named primary operator and backup operator with least-privilege/revocation confirmation.

## Telemetry, retention, and alert readiness

The database model preserves useful evidence, but persistence is not the same as an operational
telemetry system. The following minimum signals and routes remain to be configured and observed:

| Record / signal | Repository fact | Required operational alert and owner | Status |
|---|---|---|---|
| Forecasts | Accepted JSON plus normalized role/provider forecast facts; evaluator produces `unknown`, `at risk`, `late`, and reforecast-required states. | Scheduled evaluation at least hourly; alert named delivery owner when milestone/freshness expires, immediately on late/reforecast-required, and Platform / Ops on evaluator failure. | **Not implemented/proved** |
| Actuals/provider telemetry | Provider/model/event ID, attempt/token/cost/duration/source/completeness and accepted/late/conflict state are validated and queryable. | Collector health/last-success, ingestion latency, duplicate rejects, partial/missing rate, conflict count, dead-letter/retry depth; conflict to Platform / Ops and named Tech Lead. | **No automated collector or alert proved** |
| Outcomes | Outcome status, observation date, owner, evidence revision/hash, verification time, confidence, and limitations are retained. | Daily check for due/past-due outcomes and unresolved evidence; route to outcome owner, then Product Lead after the declared escalation window. | **Not implemented/proved** |
| Denial audits | Payload-safe `denied` events are append-only and POD-scoped in routine reads. | Rate/burst anomaly by route/POD with no sensitive payload; Security plus Platform / Ops acknowledgement and incident link. | **No export, threshold, or alert proved** |
| Delivery events | Rework, defect, and rollback events are normalized and queryable. | Immediate alert on rollback and blocker/critical defect; daily unresolved rework/defect digest to Tech Lead; delivery-pipeline failure alert to Platform / Ops. | **No automated alert proved** |

For every alert, the production evidence must show a synthetic trigger, delivery destination,
recipient/role, UTC trigger and receive times, deduplication key, acknowledgement, escalation path,
runbook link, and redacted payload. A dashboard without a delivered test alert is not sufficient.

The reviewed data inventory says `evidence lifetime`; it does not define an enforceable duration,
archive tier, provider backup expiry, legal hold, deletion/anonymization job, audit-log retention, or
verified deletion result. No TTL, scheduled purge, archive/export job, or deletion runbook is
present for the Work Economics tables. Privacy / Legal must define the policy; Platform / Ops must
then configure and prove enforcement, backup expiry, access logging, restoration limits, and a
synthetic deletion/anonymization rehearsal. Missing telemetry must remain `missing`, never zero.

## Commands and results

Executed at evidence baseline `3bfa5ae6f7caae9e490875c78fa5a54a35c89f73`:

- `cd flight-board && npm test` — **74 passed, 0 failed**, including production build,
  migration/rollback, append-only audit, POD authorization, Work Economics projections,
  forecast states, and accessibility/static checks.
- `cd flight-board && npm run typecheck` — passed.
- `cd flight-board && npm run lint` — passed.
- source-to-build migration `cmp` for 0005–0008 — passed; hashes are recorded above.
- temporary SQLite backup/restore rehearsal — backup integrity `ok`; restored integrity `ok`;
  sentinel `STR-OPS-REHEARSAL` recovered with nullable value hypothesis and `Unclassified` work
  type; five Work Economics tables recovered; update of an audit event failed with
  `work_economics_events are immutable`.
- `uv run pytest tests/test_repository_contract.py -q` — **3 passed**.
- `git diff --check 7763b931...3bfa5ae...` — passed.

## Residuals before Platform / Ops may sign

1. A named human Platform / Ops Lead is enrolled and records an authenticated ruling; this Ops
   Agent packet is advisory evidence only.
2. A production backup/export is created and identified, then restored into isolation with
   integrity, row/invariant, authority, and immutable-trigger verification.
3. The exact production migration and application rollback procedures are approved and rehearsed;
   a prior deployment ID and working traffic-revert control are demonstrated twice outside
   production.
4. Automated provider ingestion, reconciliation, retry/dead-letter handling, and live provenance
   observation are implemented or the release scope explicitly remains audited manual entry and
   is accepted by Product/Tech without claiming automatic telemetry.
5. Scheduled alerts for forecast freshness/late/reforecast, incomplete/conflicting actuals,
   due outcomes, denial anomalies, and delivery rollback/critical defects are delivered and
   acknowledged in a non-production exercise.
6. Privacy / Legal defines retention/deletion/legal-hold requirements; Platform / Ops proves their
   enforcement for primary data, audit history, exports, and backups.
7. Security closes the dependency disposition and reviews operational privileges; Product Designer,
   Privacy / Legal, Product Lead, Tech Lead, independent reader, and every other tagged authority
   record their required findings/rulings.
8. The full Gate 3 quorum/cooling control and the minimum 24-hour default-closed cooling period are
   satisfied against an unchanged, independently verified final implementation.

Until those residuals are attached, **Gate 3, deployment, merge, release, and PR-ready status remain
blocked**.
