# Scout eleventh-documentation-rework evidence — STR-028 Intent Brief 0028

**Work item:** [STR-028 / issue #56](https://github.com/idrissenayat/federal-bd-platform/issues/56)
**Branch:** `scout/str-028-intent-brief`
**Parent revision:** `df76d7ac149c5cd2b810019fa9dd9f6147cdf511`
**Review role:** Scout evidence for the eleventh authorized Intent Brief documentation
rework; this is not a Critic review, human gate ruling, Exam, implementation evidence,
or release decision
**Controlling decisions:** [Tech design decision #5310467779](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5310467779), [supervisory Tech decision #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334), [supervisory Tech decision #5316551748](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316551748), [supervisory Tech decision #5316704687](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316704687), [supervisory Tech decision #5316789932](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316789932), [supervisory Tech decision #5316881629](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316881629), [supervisory governance decision #5316966355](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316966355), [supervisory governance decision #5317059006](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5317059006), [supervisory Tech decision #5317183348](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5317183348), and [Tech decision #5317300148](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5317300148)

## Authorized change

The authenticated Tech decision #5317300148 binds this eleventh rework to the same
primary claim/run and freezes the pre-receipt versus post-receipt routing qualifier,
the executable Git OID/commit-object/artifact-manifest digest contract, and the
deterministic fixed-case substeps. This rework changes only the Intent Brief, this
Scout evidence file, the project Decision Log, TEAM-COMMUNICATION, and agent-roles,
preserving the same primary claim and branch from parent revision
`df76d7ac149c5cd2b810019fa9dd9f6147cdf511`. It does not draft an Exam, change
application or worker code, approve a gate, merge, deploy, or release.

## Review assignment, receipt, and stage contract

- The STR-028 Work Management item has one primary execution claim/run owned by the
  assigned Scout. Rework revisions preserve that claim, lineage, and idempotency
  boundary; non-owning reviewers do not acquire, replace, or duplicate it.
- Each review assignment is bound to the active work-item stable ID/key, STEER
  workflow, unchanged primary claim lineage/owner/member, review stage, the canonical
  target tuple (`target_git_object_format`, `target_git_commit_oid`,
  `target_commit_object_sha256`, `target_artifacts[]`, and
  `target_artifact_manifest_sha256`), exact artifact URLs, prior evidence/decision
  bindings, reviewer role and enrolled member, explicit output/prohibitions, and
  authenticated authorizing actor/event. It grants review authority only and cannot
  change primary ownership, workflow, lineage, scope, gate state, or implementation
  authority.
- The target tuple is executable: `target_git_commit_oid` is the lowercase Git OID
  for the repository's `sha1`/`sha256` storage format; `target_commit_object_sha256`
  hashes `UTF8("commit " + DECIMAL(len(commit_bytes)) + "\0") || commit_bytes`,
  where `commit_bytes` are the exact raw bytes from `git cat-file commit <oid>`; and
  each of the five allowed artifact entries stores `{path, url, size_bytes, sha256}`
  over exact raw file bytes, sorted by UTF-8 byte order of `path`. The paths are
  `steer/TEAM-COMMUNICATION.md`, `steer/agents/agent-roles.md`,
  `steer/briefs/0028-stale-post-write-feedback.md`,
  `steer/operating-system/DECISION-LOG.md`, and
  `steer/reviews/0028-scout-second-rework-evidence.md`. The manifest digest
  is `SHA-256(UTF8(RFC8785({schema:"steer-review-artifact-manifest/v1",
  target_git_object_format:target_git_object_format,
  target_git_commit_oid:target_git_commit_oid, artifacts:target_artifacts})))`,
  with JCS UTF-8/no-BOM. Scout recomputes these values and verifies the OID and all
  five URLs before `REVIEW_TARGET_READY`; Work Management compares the full tuple and
  rejects missing or mismatched values before append or side effect.
- `review_assignment_id = SHA-256(UTF8(RFC8785(steer-review-assignment/v1 payload)))`
  using RFC 8785 JCS UTF-8 without BOM and recorded array ordering. Work Management
  alone appends the signed assignment after active-item, unchanged-owner/workflow/
  lineage, reviewer/stage, target, prior-binding, output/prohibition, authorizer, and
  canonical-route checks. Only the enrolled reviewer appends signed acknowledgement
  and result records bound to the assignment and predecessor receipt; no unsigned
  review record is valid.
- `review_idempotency_key = SHA-256(UTF8(RFC8785({schema:"steer-review-idempotency/v1", review_assignment_id})))`.
  Immutable request/ack/result receipts carry the assignment ID, idempotency key,
  exact revision/URLs, stage, identities, authorizer/event, prior bindings,
  output/prohibitions, timestamps, and disposition. Exact replay returns the existing
  receipts without a new append, review run, or primary claim. Changed/missing fields,
  stale owner/workflow/lineage, wrong reviewer/authorizer, target mismatch, or
  duplicate mismatch rejects before append or side effect and cannot mint a fallback
  key.
- Until authoritative `review_assignments[]` exists, one authenticated approved-setup
  bootstrap may seed the complete assignment payload and receipt, including its
  authorizer/event, exact target/URLs, primary bindings, stage, reviewer,
  output/prohibitions, and idempotency key. The bootstrap is independently auditable
  and closes once the store exists; no override, project-channel fallback, or alternate
  authorizer is accepted unless the configured canonical route or a frozen decision
  explicitly allows it.
- The mandatory two-phase handoff is `REVIEW_TARGET_READY` then durable Work
  Management assignment/bootstrap and reload verification, then `REVIEW_REQUESTED`.
  The target-authoring Scout records target-ready only after pushing/verifying the exact
  commit, branch/remote, clean worktree, required checks, and artifact URLs, and must
  not mention or request the reviewer. Work Management then verifies item state, primary
  owner/claim/run, reviewer identity, stage, target/prior bindings, output/prohibitions,
  authorizer/event, idempotency key, and canonical route before emitting the request.
  A pre-assignment request is invalid; a changed target requires a new target-ready
  receipt and does not create a new primary claim/run.
- Critic inputs are stage-specific:

  | Review stage | Required inputs | Boundary |
  |---|---|---|
  | `PRE_GATE_1_BRIEF` | Exact Brief revision, Scout evidence, Decision Log, governing gates/guardrails, signals/metrics limits, and authenticated Work Management assignment/ack/result receipts | No Exam prerequisite; the Exam is downstream of human Gate 1. This is review evidence only, not a Gate 1 ruling or execution authorization. |
  | `GATE_2_EXAM` | Exact human-approved Brief revision, exact Exam revision, applicable guardrails, and assigned Exam/Test evidence | Requires the Exam; it cannot be substituted by a pre-gate Brief review. |
  | `GATE_3_BUILD` | Exact Brief and frozen Exam revisions, implementation diff, test/CI evidence, and prior review receipts/results | Build review only; no merge, deployment, release, or human gate signature. |

- The eleventh rework stops at `REVIEW_TARGET_READY`; no Critic request is emitted in this
  Scout handoff. A later `PRE_GATE_1_BRIEF` request is non-owning, exact-revision bound,
  and valid only after Work Management persists and reload-verifies the assignment.
  The same primary Scout claim/run remains in force.

## Contract incorporated

- `dispatch_intent_id` is the SHA-256 of JCS-canonicalized
  `steer-dispatch-intent/v1` payload containing workspace/POD, work item, workflow,
  enrolled agent identity, authorization revision/audit event, immutable evidence,
  accepted forecast, canonical channel ID, and authorized Next-action hash.
- The uniqueness boundary is one claim/run for one intent ID across Work Management,
  outbox, Buzz, retries, routing corrections, and agent runtime. Material
  authorization, evidence, assignee, or scope changes create a new revision and
  supersede rather than delete the prior receipt.
- One transaction validates authorization and routing, reserves the unique intent,
  writes the immutable receipt, and creates exactly one outbox row before delivery.
  Delivery/retry cannot change item, gate, phase, assignee, decision, or downstream
  authorization state.
- The immutable receipt is an authorization snapshot only: it carries the required
  acknowledgement policy/required-binding fields, not mutable acknowledgement state
  or a future signature. The same initial transaction creates the unique receipt, one
  outbox identity, and `v0: QUEUED`; an append-only `dispatch_event` ledger keyed by
  intent uses the exact `steer-dispatch-event/v1` fields: intent/lineage IDs,
  event/expected versions, previous-event hash, event/prior/resulting states, UTC
  timestamp, authorized actor/service stable ID and key version, typed payload digest,
  receipt/routing/evidence bindings, and external references. Agent-readable status is
  receipt plus ordered ledger plus rebuildable current projection.
- Every transition appends one event and updates the projection in one transaction with
  compare-and-set on `expected_event_version`. `v0:QUEUED` is version 0 with expected
  version -1 and null prior hash; every next event is exactly
  `expected_event_version + 1`, and its prior hash is SHA-256 of exact preceding
  canonical bytes. Every event is signed by its authorized appending service key over
  the SHA-256 canonical payload; `ACKNOWLEDGED` also verifies the assigned-agent
  signature. Unknown schema/key, unauthorized actor, bad signature/hash, skipped/reused
  version, illegal transition, stale expected version, or binding mismatch is rejected
  before side effect and emits only a typed no-PII diagnostic. Exact signed-binding
  replay is idempotent; wrong-key/second acknowledgements cannot advance state. Privacy
  retention/deletion covers receipt, ledger, projection, outbox, signatures/key
  references, review-assignment/acknowledgement/result/bootstrap receipts, indexes, and
  replicas together; review receipts are included in the identity-linked inventory,
  retention, hold, and auditable deletion cascade.
- The authority matrix is fixed: Work Management authorization service appends
  `QUEUED`, `ACKNOWLEDGED` after exact agent-signature verification, `SUPERSEDED` in
  explicit human reauthorization, and `CANCELLED` from authenticated human
  cancellation/reassignment; the outbox delivery service appends `DELIVERED` after
  canonical-relay verification; outbox/reconciliation appends
  `RECONCILIATION_REQUIRED`; reconciliation appends `FAILED_RETRYABLE`/`FAILED_FINAL`;
  the outbox delivery service alone appends non-state `SEND_ATTEMPT_RESERVED` after
  CAS lease acquisition and serialized `SEND_ATTEMPT_STARTED` immediately before
  one external send using the reservation fence; the terminalization coordinator
  appends signed `TERMINALIZATION_REQUESTED` for authenticated cancellation,
  supersession, or audited configuration invalidation in the same ordering domain;
  reconciliation alone appends signed `REQUEUED` from `FAILED_RETRYABLE` to `QUEUED`
  under the versioned retry policy;
  authorization/reconciliation append diagnostic-only `ACK_REJECTED`/
  `DELIVERY_BLOCKED_CONFIG_STALE`. No unsigned event is allowed.
- The executable delivery sequence is fixed: commit the immutable receipt, unique
  outbox row, and signed `v0:QUEUED`; commit one leased signed non-state
  `SEND_ATTEMPT_RESERVED` with unique intent/attempt, `reservation_fence`, and
  canonical relay bindings; immediately before the call, serialize a CAS
  `SEND_ATTEMPT_STARTED` against that fence and revalidate non-terminal state, active
  lease, current configuration, and no winning `TERMINALIZATION_REQUESTED`; perform
  exactly one external send only after that commit; verify the durable NIP-01
  publisher-signed relay event against the Tech-owned `relay_event_signers` registry;
  then append signed `DELIVERED`. A terminalization request that wins first
  invalidates the fence and forbids the send; a pre-call start that wins first makes
  terminalization wait for attempt resolution. Timeout, unknown result, or crash
  without proof appends `RECONCILIATION_REQUIRED`; the same intent/attempt is queried
  before retry, and an absent delivery becomes `FAILED_RETRYABLE` only after the lease
  is released and reconciliation is resolved. A verified `DELIVERED` is monotonic;
  stale reconciliation is an idempotent no-op. A retry requires signed `REQUEUED` by
  the reconciliation service under the versioned retry policy, then a new unique
  `SEND_ATTEMPT_RESERVED`; no failure or requeue occurs while a lease is active or
  reconciliation is unresolved; attempt numbers never repeat and binding mismatch
  fails closed.
- The allowed lifecycle is frozen as `QUEUED -> DELIVERED -> ACKNOWLEDGED` only after
  reservation, serialized pre-call start, and verified send, with
  `RECONCILIATION_REQUIRED` only from a non-`DELIVERED` state for uncertain delivery,
  retry through `FAILED_RETRYABLE -> REQUEUED -> QUEUED` using the same intent, and
  terminal `FAILED_FINAL`, `SUPERSEDED`, or `CANCELLED` states. `DELIVERED` is
  monotonic; stale reconciliation cannot regress it, and no failure/requeue may
  occur while an active lease or unresolved reconciliation remains.
  `SUPERSEDED` is pre-ack only with an explicitly linked successor;
  `ACKNOWLEDGED`, `FAILED_FINAL`, and `CANCELLED` close the lineage. Retries create no
  second receipt, outbox identity, claim, or run.
- The v1 cryptographic profile is fixed: RFC 8785 JCS, UTF-8 without BOM, and
  `SHA-256(UTF8(RFC8785(unsigned steer-dispatch-event/v1 payload)))`; BIP-340 Schnorr
  over secp256k1 on the 32-byte digest; 32-byte x-only lowercase-hex public keys and
  64-byte lowercase-hex signatures; and the same profile for the versioned
  `steer-dispatch-ack/v1` binding. `previous_event_sha256` hashes the exact canonical
  predecessor envelope including signatures. The audited Tech-owned
  `workspace.security.dispatch_event_signers` registry binds service roles and event
  types to key versions, validity intervals, and `ACTIVE|RETIRED|REVOKED` status;
  historical retired signatures may verify, but retired/revoked keys cannot sign new
  events, effective revocations fail closed, and registry rotation never rewrites
  history.
- Relay delivery proof is the NIP-01 publisher-signed event itself: verify canonical
  event ID, publisher key/signature, kind/tags/content, channel, intent/attempt, and
  payload digest. Trust is resolved through the Tech-owned
  `workspace.security.relay_event_signers` registry with key version, validity
  interval, and `ACTIVE|RETIRED|REVOKED` status; missing/mismatched registry,
  invalid serialization/signature, unauthorized or retired/revoked new publisher,
  or binding mismatch rejects delivery before `DELIVERED` or side effect, with
  audited rotation/revocation and historical preservation.
- Only the exact enrolled assigned-agent pubkey may sign an acknowledgement binding
  intent ID, authorization revision/evidence digest, canonical channel ID, delivered
  Buzz event ID, agent claim/run ID, and acknowledgement timestamp. Uncertain
  delivery reconciles against the canonical channel/relay before same-intent retry;
  downstream work remains blocked without one valid acknowledgement.
- `dispatch_claim_lineage_id` is the exact root formula
  `SHA-256(JCS({schema:"steer-dispatch-lineage/v1", originating_workspace_pod_id, work_item_stable_id, work_item_key, workflow:"STEER", root_human_authorization_audit_event_id}))`.
  Those five inputs are immutable; role, enrolled member/agent, evidence, scope, route,
  configuration, and individual authorization revision are intent/receipt inputs.
  Before acknowledgement, changed evidence/scope/route/config/relay/membership proof
  may use an explicitly authorized same-lineage successor only when originating
  workspace/POD, work item, workflow, root objective, role, and enrolled member/agent
  are unchanged. A role/assignee/workspace/work-item/workflow/root-objective change
  creates a new lineage with cross-lineage terminalization and mandatory new human
  authorization. `ACKNOWLEDGED`, `FAILED_FINAL`, and `CANCELLED` close a lineage;
  post-ack recovery requires new root authorization/new lineage/new run. Exactly one
  accepted claim/run is allowed per lineage.
- Stable member/agent-key/fingerprint, acknowledgement-signer, and human-actor
  references are pseudonymous personal data. The privacy contract is purpose-limited,
  minimizes stored identity and cryptographic material, prohibits PII in logs,
  requires inventory before implementation, retains identity-linked records for 90
  days after terminal state, defines auditable deletion and scoped time-bounded holds,
  and fails closed if inventory, retention, deletion, or logging controls are absent.
- Routing is sourced from audited Work Management workspace/POD key
  `workspace.routing.steer_agent_handoff.channel_id`, with the active audited
  configuration version as sole precedence and no fallback. Its current value is
  `10ac2fb4-f7fc-4dbc-bb73-8c545f31a470` (`#steer-team`). During the `FAIL-03`
  pre-receipt phase, missing, unknown, conflicting, mismatched, non-member, or
  competing routing inputs fail closed before any receipt/outbox/reservation/attempt/
  delivery/state/claim/run and emit only the typed no-PII diagnostic; no fence or
  terminalization exists. During the post-receipt/pre-send `FAIL-04` and `REC-04`
  phases, the same binding classes are handled only from the committed v1
  receipt/outbox plus one reservation fence: before `SEND_ATTEMPT_STARTED`, append
  signed non-state `TERMINALIZATION_REQUESTED`, invalidate the existing fence, append
  the typed diagnostic, and do not start, send, change state/current projection,
  create a claim/run, fail, or requeue. `REC-04` requires explicit human
  reauthorization and only a frozen same-lineage successor. A project channel may
  carry discussion only; it cannot override or provide a fallback for the configured
  canonical route.
- Measurement is pre-enrolled at exactly 20 non-production cases across four cases
  each for successful saves, successful dispatch authorizations, validation/conflict
  failures, delayed/out-of-order responses, and replay/concurrent/partial-dispatch
  recovery. The authoritative manifest is in the Brief as SAVE-01..04, DISP-01..04,
  FAIL-01..04, ORDER-01..04, and REC-01..04 with named seeds and mutations. The
  denominator is all enrolled cases; missing or unclassifiable results fail; the two
  production observations remain incident evidence outside the denominator. Each case
  records seed revision/config, action identity, expected authoritative and UI result,
  actual receipt/outbox/event/claim/run IDs, HTTP/error result, and pass/fail; no
  substitution or seed change is allowed after execution starts. The fixed security
  mappings are: `DISP-02` exact acknowledgement replay/no new event or run;
  `DISP-03` wrong-key rejection before one valid acknowledgement; `DISP-04` second
  acknowledgement rejection after valid ack; `REC-01` exact authorization and ack
  replay; `REC-02` concurrent dispatch and acknowledgement CAS plus unique active
  attempt reservation, reservation-fence/pre-call-start serialization, total ordering
  against terminalization, and no stale send/failure/requeue; `REC-03` NIP-01 relay
  publisher proof and `relay_event_signers` verification before uncertain-send
  backfill, stale reconciliation no-op after `DELIVERED`, and no retry before
  requeue/reservation; `REC-04` uses the same post-receipt/pre-send seed as FAIL-04
  and executes mandatory ordered substeps `R04-A` through `R04-F` for configuration
  v2, channel, relay, workspace/POD, membership, and publisher mismatches. `FAIL-03`
  executes `F03-A` through `F03-F` for missing key, unknown/deleted channel,
  name/ID disagreement, relay/workspace mismatch, non-membership, and competing
  source; all remain pre-receipt with no reservation/fence and only a typed
  diagnostic. `FAIL-04` executes `F04-A` through `F04-E` for channel, relay,
  workspace/POD, membership, and publisher invalidation; all use the same
  post-receipt terminalization/fence/diagnostic order and no start/send/state/claim/
  run/failure/requeue. Substeps use isolated resets of their fixed seeds, remain
  inside the 20 case IDs, and are all required for a case pass. The signed
  terminalization/audit record is allowed; “no lifecycle event” means no
  state-transition event or current-state projection change.
- Reliability observability is fixed before Gate 1: p95 <=250 ms for
  `steer_work_item_save_feedback_latency_ms` and
  `steer_agent_handoff_feedback_latency_ms` over the fixed matrix; emit
  `steer_work_item_save_outcome_total`, `steer_post_write_reconciliation_total`,
  `steer_agent_handoff_outcome_total`, `steer_stale_ui_recurrence_total`, and
  `steer_duplicate_dispatch_total` with only typed bounded non-PII labels. All 20 cases
  emit expected outcome and one terminal UI feedback observation; observe before Gate 1
  and after any eventual release for the first 100 eligible operations or 30 days,
  whichever is later. Alert immediately on critical stale-view recurrence/duplicate
  dispatch and on a 15-minute p95 breach with at least 20 eligible observations.
- Historical wrong-channel defect evidence is event
  `ee8c2edb3347377c6a343ecc2a6c09e3c01fae6a95509d2a218db112d4ed04d3` from channel
  `c44eff40-c669-4c18-b6e8-46604af44668`; it is explicitly non-authoritative and
  cannot authorize execution or review. Configured `#steer-team` and exact Work
  Management request/assignment receipts supersede it for routing/authorization.

## Revision provenance

The authorized parent is `df76d7ac149c5cd2b810019fa9dd9f6147cdf511`. A Git-tracked file
cannot contain the hash of the commit that contains itself, so this evidence records
the parent and binds the review target to the immutable commit named in the external
Work Management/Buzz request/result and its exact artifact URLs. The target binding
also records the repository Git object format and OID, the independently reproducible
SHA-256 of the raw Git commit object, and the SHA-256 manifest of the five exact raw
artifact byte sequences. No self-referential follow-up commit is created merely to
write its own hash.

## Evidence classification

The evidence matrix now classifies the authenticated owner/Tech issue comments,
including the receipt-schema/privacy ruling at [comment #5316380334](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316380334), the immutable-event/routing/manifest ruling at [comment #5316551748](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316551748), the lineage/event-authority/security-case ruling at [comment #5316704687](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316704687), the executable-sequence/cryptographic-profile ruling at [comment #5316789932](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316789932), the send-fencing/publisher-trust/fixed-case ruling at [comment #5316881629](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316881629), the review-assignment/stage-input ruling at [comment #5316966355](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5316966355), the complete append-only review receipt/canonical-route/lifecycle/provenance/privacy ruling at [comment #5317059006](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5317059006), and the frozen case-phase/reliability/two-phase-handoff ruling at [comment #5317183348](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5317183348),
and the routing/digest/substep ruling at [comment #5317300148](https://github.com/idrissenayat/federal-bd-platform/issues/56#issuecomment-5317300148), as **authenticated decision evidence**, separate from production observations, source inspection, local/non-production execution, and not-run proof obligations.

## Validation boundary

- No live replay, concurrency, outbox-delivery, or partial-dispatch run was executed.
- No claim is made that the implementation already satisfies these contracts.
- This documentation revision adds no receipt records or identity-linked runtime data;
  it records the required pseudonymous-personal-data treatment for future governed
  implementation.
- The exact review target is intentionally supplied by the external Work Management
  request/result rather than written self-referentially into this file. This eleventh
  handoff stops at `REVIEW_TARGET_READY`; no `REVIEW_REQUESTED` Critic event is emitted
  until Work Management records and reload-verifies the exact assignment and full
  target tuple.
- No Exam was created or required for this `PRE_GATE_1_BRIEF` review; the Exam is a
  downstream artifact after human Gate 1. The Critic request/result must bind the
  exact Brief revision, the non-owning assignment/acknowledgement/result receipts, and
  the configured canonical `#steer-team` route.
- Gate 1 remains pending; a fresh independent Critic review must inspect the exact
  resulting revision before any named human Gate 1 decision.
