# Architect evidence — STR-028 Gate 2 Exam

**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Workflow:** STEER
**Role:** STEER Architect
**Approved Brief target:** `0f83de8248771d35292ee57b56186493b5b71b1a`
**Gate-1 human receipt:** `#5317465104`
**Branch:** `architect/str-028-gate-2-exam`
**Artifacts:** `steer/exams/0028-stale-post-write-feedback.md` and this file
**Disposition:** Architect-authored Exam and provenance evidence; not a Gate 2 ruling,
implementation authorization, code change, merge, deployment, release, or human
approval.

## Scope and authority

The approved Brief is the sole design authority. This evidence records how the Exam
turns that Brief into falsifiable acceptance oracles while preserving the explicit
boundaries: exactly 20 pre-enrolled case IDs, no production-demand inference, no case
substitution, no optimistic success, no gate impersonation, and no implementation.

The Exam is downstream of the human Gate-1 approval recorded by receipt `#5317465104`.
It is intentionally left at `GATE 2: PENDING`; only the authorized human Tech Lead can
rule on it after the fresh non-owning Critic review. The final commit revision is
reported by the external Work Management/Buzz handoff because a Git-tracked evidence
file cannot safely contain the hash of the commit that contains itself.

## Design decisions frozen into the Exam

## Implementation design alternatives (design-only)

The following alternatives are evaluated to satisfy the Architect role without
authorizing implementation. Each is judged against the approved Brief and the Exam;
the recommendation is a design direction for the human Tech Lead, not a Gate 2 ruling.

### Design A — Action-local authoritative reconciliation

1. Keep the open drawer as the action surface with pending, inline result, and focus ownership.
2. Treat the authoritative mutation response as the only durable success signal.
3. Reconcile activity and drawer state with versioned response suppression and reload-safe reads.
4. Use the Brief's deterministic receipt, outbox, append-only ledger, CAS, routing, and acknowledgement contracts for dispatch.
5. Exercise the whole contract through the fixed 20-case matrix and bounded telemetry.

**Key trade-off:** Smallest user-visible change and clearest failure boundary, while the
dispatch control plane still requires a substantial governed backend contract.

**Main risk:** A partial implementation could fix drawer feedback while leaving receipt,
routing, or reconciliation paths inconsistent; AT-05..AT-16 must fail closed together.

**Rough complexity:** L.

**Guardrails stressed:** CORE-01/02/05/06, SEC-03..05, PRIV-01..03, A11Y-01..03,
REL-01..04, DES-01..02.

### Design B — Command gateway with receipt-first outbox

1. Route every drawer mutation and dispatch through a versioned command gateway.
2. Commit an immutable command/authorization receipt and exactly one outbox identity before side effects.
3. Drive delivery and acknowledgement from the signed append-only ledger, with the client consuming the status envelope.
4. Apply CAS, reservation fences, signer registries, reconciliation, and lineage rules at the gateway boundary.
5. Keep the drawer as a projection of authoritative command results and preserve the same 20-case acceptance matrix.

**Key trade-off:** Strongest single boundary for idempotency and auditability, at the cost
of more cross-layer coordination and a larger migration surface.

**Main risk:** A gateway migration can duplicate or strand existing writes unless old and
new identities, rollback, and replay behavior are proven before cutover.

**Rough complexity:** L.

**Guardrails stressed:** CORE-01..03/05/06/09..11, SEC-01..05, PRIV-01..03,
REL-01..04, A11Y-01..03, DES-01..02.

### Design C — Unified event-sourced action projection

1. Represent UI saves, dispatch lifecycle, and reconciliation as one versioned action journal.
2. Rebuild drawer, activity, outbox, receipt, and claim/run projections from the journal.
3. Serialize response ordering, reservation fencing, terminalization, and stale suppression through the journal.
4. Preserve the Brief's separate append authorities, signer registries, privacy lifecycle, and human-only gates.
5. Use the fixed matrix to compare journal truth, projection truth, and visible UI truth after every case.

**Key trade-off:** Best long-term forensic and replay model, but broadest change and the
highest operational burden for projection repair and rollback.

**Main risk:** A projection or journal migration defect can make authoritative history
temporarily unavailable; rollback must preserve immutable events and fail closed.

**Rough complexity:** L.

**Guardrails stressed:** CORE-01..03/05/06/07/09..11, SEC-01..05, PRIV-01..03,
REL-01..04, A11Y-01..03, DES-01..02.

**Recommendation:** Use Design A as the product-facing shape, implemented with the
receipt-first ledger and outbox controls from Design B; it is the closest expression of
the approved Brief's chosen approach without requiring a broad event-sourcing migration.
This recommendation keeps the Exam's authoritative, default-closed oracles intact and
leaves Design C as a future evolution only if the human Tech Lead accepts its migration
and rollback risk.

### 1. Exact denominator and semantic manifest mapping

The Exam repeats the Brief's `SAVE-01..SAVE-04`, `DISP-01..DISP-04`, `FAIL-01..FAIL-04`,
`ORDER-01..ORDER-04`, and `REC-01..REC-04` IDs without aliases, additions, or
exclusions. The required result ledger maps the Brief's seed/config/action/authority/UI
outcome/evidence/error/pass-fail semantics one-to-one to the Exam's fields:

| Brief semantic field | Exam evidence field | Acceptance rule |
|---|---|---|
| Named case and seed | `case_id`, `seed_revision`, `seed_config` | Exact ID and frozen seed; missing/substituted result fails. |
| Mutation or dispatch identity | `action_identity` | Versioned deterministic identity; no timestamp-only dedupe. |
| Expected server authority | `expected_authority` | State, lifecycle/diagnostic events, and forbidden side effects are explicit. |
| Expected local outcome | `expected_ui` | Drawer/activity result, focus, announcement, and pending/error behavior are explicit. |
| Actual proof | `actual_evidence` | Receipt/outbox/event/attempt/claim/run/external IDs as applicable; no PII. |
| HTTP or typed diagnostic | `transport_result` | Conflict, validation, transport, blocked, and replay outcomes are typed. |
| Bounded signals | `telemetry` | Named metrics, bounded labels, latency, and missingness are recorded. |
| Final disposition | `result` | A case passes only when every required oracle passes. |

The accepted schema/field-name variance is therefore explicit, not silent: this is the
canonical semantic mapping from the Brief's `target_artifacts[]` and case manifest
meaning into the Exam's `actual_evidence`/`telemetry` ledger. No omission or alias is
accepted at implementation handoff.

### 2. Frozen REC-04 boundary, count, and lineage link

`REC-04` is one case ID with six isolated mandatory substeps `R04-A..R04-F`. Each
substep starts from the same post-receipt/pre-send seed: receipt, outbox, and exactly
one `SEND_ATTEMPT_RESERVED` under route/config v1; no durable Buzz delivery; and
reconciliation proving absence. Every substep must append signed non-state
`TERMINALIZATION_REQUESTED`, invalidate the existing reservation fence, append
`DELIVERY_BLOCKED_CONFIG_STALE`, send nothing, and preserve state/current-projection,
claim, run, failure, and requeue prohibitions.

The observation boundary is the blocked branch after that diagnostic. The old intent
is terminalized as the pre-send stale intent. Only explicit human reauthorization may
create one same-lineage successor, and only when the frozen workspace/POD, work item,
workflow, root authorization objective, assigned role, and enrolled agent/member are
unchanged. The old-intent-to-successor ledger relation is mandatory when that successor
exists; retry without reauthorization is rejected. A role, assignee, workspace, work
item, workflow, or root-objective change requires a new human authorization and new
lineage. There is never more than one accepted run per lineage.

The six substeps may be emitted as six bounded telemetry observations, but they remain
one parent case and do not change the denominator from 20. This is recorded as an
explicit human measurement risk for Gate 2 review, not hidden as six additional cases.

### 3. Phase-qualified FAIL-03 versus FAIL-04 behavior

The Exam preserves the Brief's default-closed phase distinction:

- `FAIL-03` begins before receipt/outbox/reservation. Every `F03-A..F03-F` conflict
  rejects before append or side effect and emits only one typed no-PII diagnostic. No
  fence exists, so no terminalization request or fence invalidation is valid.
- `FAIL-04` begins after receipt/outbox and exactly one reservation fence, before
  `SEND_ATTEMPT_STARTED`. Every `F04-A..F04-E` conflict appends the signed non-state
  terminalization request, invalidates that existing fence, and emits the typed
  diagnostic. No send, lifecycle/current-projection change, claim/run, failure, or
  requeue is valid.

This prevents the broad routing rule from collapsing two distinct security phases into
one oracle.

## Coverage matrix

| Brief obligation | Exam oracle |
|---|---|
| Authoritative drawer success and reconciliation | AT-01, AT-04 |
| Inline conflict/validation with preserved input | AT-02 |
| Delayed/out-of-order suppression | AT-03 |
| Deterministic identity, receipt, outbox, event ledger | AT-05, AT-09, AT-10, AT-15 |
| One claim/run and acknowledgement identity | AT-05..AT-10 |
| Uncertain delivery and retry fencing | AT-10, AT-11 |
| Pre-receipt route rejection | AT-12 |
| Post-receipt reservation terminalization | AT-13 |
| REC-04 reauthorization, successor, and lineage closure | AT-14 |
| Authentication, signer trust, append authority, replay rejection | AT-15 |
| Pseudonymous privacy, inventory, retention, holds, deletion, no-PII | AT-16 |
| Keyboard, focus, live announcements, narrow drawer, WCAG/axe | AT-04, AT-08, AT-17 |
| p95 reliability budget, named telemetry, bounded labels, missingness | AT-18 |
| Reversible rollback and data/infra recovery evidence | AT-19 |

Every “done and correct” line in the Brief is represented by at least one named
acceptance test. The two production observations and all not-run proof obligations are
explicitly kept outside the denominator.

## Default-closed control review

The Exam requires executable evidence for the Brief's security and privacy threat
model: forged/replayed/stale receipts, wrong route or membership, wrong signer, event
version/CAS races, unknown delivery, duplicate work, gate impersonation, unresolved
audit pointers, PII leakage, retention/deletion failure, and inaccessible UI results.
Every failure path must fail closed before the forbidden append or side effect and must
produce only the allowed typed no-PII diagnostic. The Exam does not treat a successful
HTTP response, UI text, global banner, or human message as authoritative proof.

The reliability checks preserve the exact p95 <=250 ms budgets and named telemetry
from the Brief. The rollback check requires reversible behavior and preservation of
the append-only evidence; it does not authorize a production rollout.

## Critic handoff packet

The fresh `GATE_2_EXAM` Critic must receive, through the canonical Work Management
two-phase assignment and after reload verification:

1. the human-approved Brief at `0f83de8248771d35292ee57b56186493b5b71b1a`;
2. the exact immutable Exam commit revision and both artifact URLs;
3. this Architect evidence and the applicable gates, guardrails, Decision Log, and
   project controls;
4. any assigned Test evidence, if available; and
5. the authenticated non-owning assignment, reviewer identity, target tuple,
   authorizer/event, prior bindings, output/prohibitions, and idempotency key.

The Critic must challenge whether the acceptance oracles are complete, executable,
default-closed, denominator-preserving, and free of hidden Gate 2/implementation
authority. The expected output is severity-sorted with at most three blocker or
should-fix findings, plus notes and an explicit coverage/rule-out statement. The
Critic cannot change the primary claim/run, approve Gate 2, or authorize implementation.

## Validation boundary and non-claims

- No application or worker code was changed.
- No live replay, concurrency, outbox delivery, reconciliation, or rollback run is
  claimed; this is Exam design/provenance evidence only.
- No production demand, recurrence, latency, accessibility, privacy, or reliability
  result is claimed before the fixed non-production matrix is actually run.
- No Exam Gate 2 approval, implementation authorization, PR, merge, deployment, or
  release is recorded here.
- The exact final commit, artifact byte hashes, and external review receipt must be
  captured in the Work Management/Buzz target-ready and Critic handoff after commit;
  this file avoids a self-referential commit hash.

## Architect self-check before handoff

- [x] Approved Brief target and Gate-1 human receipt are explicit.
- [x] Exactly 20 case IDs are frozen and repeated without substitution.
- [x] Every F03/F04/R04 substep is deterministic and isolated.
- [x] REC-04 observation boundary, count, and old-intent/successor linkage are explicit.
- [x] Manifest semantic mapping and R04 telemetry measurement risk are explicit.
- [x] Default-closed security/privacy, accessibility, reliability, telemetry, and rollback checks are executable.
- [x] Gate authority and not-run boundaries remain human-controlled.
