# Exam — 0024 Governed agent execution from STEER assignments

**Brief:** `steer/briefs/0024-governed-agent-execution.md` at
`5c0db389d1b0e9fa492a33930febcf4d1c067cb0`
**Work item:** [STR-024 / issue #52](https://github.com/idrissenayat/federal-bd-platform/issues/52)
**Workflow:** STEER (frozen)
**Gate 1 provenance:** authenticated STEER Work Management ruling by Idriss Enayat,
2026-08-15 16:22 America/New_York, bound to Brief revision `5c0db389d1b0`;
verified for this Exam-preparation run by the Codex supervisor. The ruling authorizes
Exam design only. A public authenticated ruling URL is not currently available and
must not be invented.
**Guardrails in force:** CORE-01..11, SEC-01..05, PRIV-01..03, A11Y-01..03,
REL-01..04, DES-01..02, SRC-03..04, AI-03, HUM-01..02, DATA-01..02, EXT-01,
and the authority, adapter, evidence, and experiment contracts named below.

This Exam defines observable behavior, evidence, and tests. It does not select a
provider, model, queue, schema, database, hosting product, or implementation language,
and it grants no credentials, build, deployment, merge, release, closure, or gate
authority.

## Normative test contract

### Sources of truth and identities

- STEER Work Management is authoritative for work-item identity and revision,
  workflow, priority, assignment, phase/state, holds, forecasts, outcomes, gates, and
  closure. GitHub is the durable engineering-evidence surface. Buzz is a lossy
  communication mirror and can never authorize or mutate work.
- A `run_id` is globally unique and immutable. It binds one authenticated
  `authorization_id` and idempotency key to one organization/POD/project scope where
  applicable, work-item key, exact work-item revision, exact assignment revision,
  assigned agent identity, and permitted next action. A retry of the same authorization
  returns that run; a separately authorized retry creates a new run linked by
  `predecessor_run_id` and reason.
- Human, platform-agent, runtime-adapter, and supervisor identities are distinct
  principals. Consequential writes record the authenticated principal and its type;
  display names or prompt claims never establish identity.
- The immutable execution snapshot records the assigned and actual agent identities;
  agent role; agent configuration/version; instruction/prompt revision and integrity
  digest; model and provider identifiers; runtime and adapter versions; tool-policy
  revision and effective allowlist/denials; input/evidence revision digests; and
  environment identifier. Secret values, hidden system prompts, raw credentials, and
  restricted content are excluded.

### Lifecycle and event envelope

The minimum durable states are `AUTHORIZED`, `CREATED`, `CLAIMED`, `RUNNING`,
`RETRY_WAIT`, `STOP_REQUESTED`, `STOPPED`, `FAILED_BLOCKED`, and
`AWAITING_HUMAN_REVIEW`. A stale lease is an explicit condition/event on the latest
eligible state, not a healthy display state or an implicit reassignment. Every lifecycle
event has a unique event id, run id, attempt id where applicable, monotonic sequence,
previous and next state, reason/code, authenticated actor identity/type, UTC timestamp,
work-item and assignment revisions, lease fencing token where applicable, correlation
id, and redacted payload digest.

The implementation must publish and test a complete transition table before build. At
minimum it enforces these paths server-side:

| From | Event | To | Authorized actor |
|---|---|---|---|
| authorized dispatch | create | `CREATED` | Work Management service acting on authenticated human authorization |
| `CREATED` | claim | `CLAIMED` | exact assigned platform-agent credential through an approved adapter |
| `CLAIMED` | start | `RUNNING` | claimed agent/adapter with current fencing token |
| `RUNNING` | transient failure | `RETRY_WAIT` | runtime policy within authorized retry budget |
| `RETRY_WAIT` | retry | `RUNNING` | same assigned agent/adapter with a new attempt and current authorization |
| nonterminal | human stop request | `STOP_REQUESTED` | authenticated authorized human |
| `STOP_REQUESTED` | safe-boundary acknowledgement | `STOPPED` | claimed agent/adapter |
| nonterminal | terminal failure/blocker | `FAILED_BLOCKED` | claimed agent/adapter or control plane on verified policy/health failure |
| `RUNNING` | complete evidence return | `AWAITING_HUMAN_REVIEW` | exact claimed agent/adapter |

Completion loses to an earlier committed stop request or authorization revocation;
stale fencing tokens lose to current tokens; a terminal state is append-only and cannot
be overwritten. Simultaneous operations resolve by the committed event sequence and
documented compare-and-set/fencing rule. Human review, later gate rulings, merge,
release, and closure are separate human-authorized records, never run terminal states.

### Authority and Codex-supervisor boundary

| Capability | Named platform agent | Runtime adapter | Codex supervisor | Authorized human |
|---|---:|---:|---:|---:|
| Claim assigned run and perform bounded next action | Yes | Convey/enforce | Host/start/observe only | Dispatch only |
| Emit heartbeat, safe progress, blocker, output, and evidence | Yes | Convey/validate | Observe/troubleshoot only | Review |
| Change assigned deliverable or author it on the agent's behalf | No | No | **No** | May change scope through a new governed revision |
| Change priority, assignment, workflow, forecast, outcome, or gate | No | No | **No** | Yes, subject to role/policy |
| Merge, release, close, or authorize external action | No | No | **No** | Yes, subject to role/policy |
| Stop/revoke execution | Acknowledge own run | Enforce | May technically stop for safety, with audit | Yes |
| Repair runtime/platform configuration | No self-widening | Within admin policy | Yes, as platform supervision | Authorize where required |

Codex may host, start, observe, stop for safety, and troubleshoot a named platform-agent
run. Codex must not impersonate or produce the assigned deliverable for Architect,
Builder, Test, Critic, Scout, Docs, or Ops. Any emergency Codex intervention that
touches a deliverable requires prior authenticated human authorization tied to the
exact run, creates an explicit `SUPERVISOR_INTERVENTION` event with scope, reason,
files/actions and before/after evidence, marks the run `human_or_supervisor_touched`,
and excludes the affected attempt/output from first-pass and platform-agent performance
numerators. It remains in intervention, rework, cost, latency, and failure denominators.
Codex support can never be relabeled as agent output.

### Required endpoint/capability policy

Before implementation, the Builder must inventory every new or changed endpoint,
command, webhook, and background consumer and map it to one of these server-enforced
capability classes: human dispatch/review/stop; assigned-worker
claim/heartbeat/progress/evidence; adapter health/revocation; read-only status; or Buzz
outbound mirror. Authentication, scope, allowed state/revision, idempotency behavior,
rate limit, audit event, and denial response are required for each. There is no inbound
Buzz authority class. Unmapped capabilities and client-only authorization fail SEC-03.

## Acceptance tests

### Authorization, identity, and durable binding

- **STR024-AUTH-001 — Authorized creation.** Given an authenticated human dispatch
  whose workflow, scope, exact item/assignment revisions, assigned agent, executable
  next action, and cleared holds are valid, when creation commits, then exactly one
  durable run and `AUTHORIZED`/`CREATED` event sequence exists with all required
  bindings and the response returns its immutable `run_id`.
- **STR024-AUTH-002 — Default denial.** Given a missing, forged, expired, cross-scope,
  stale-revision, unassigned, gate-held, non-executable, or Buzz-originated request,
  when run creation or mutation is attempted, then it is denied before side effects,
  emits a scoped audit denial without sensitive content, and creates no active run.
- **STR024-AUTH-003 — Idempotent replay.** Given a committed authorization and stable
  idempotency key, when identical dispatches arrive concurrently or later, then all
  return the same `run_id`, exactly one active run/terminal effect exists, and replay
  events make every attempt visible.
- **STR024-AUTH-004 — Revision isolation.** Given a work item, assignment, instruction,
  or tool-policy revision changes after authorization, when the old run attempts a
  consequential mutation, then the policy either permits only its already-frozen
  bounded action or stops it visibly; it never inherits expanded scope. A new dispatch
  produces a separately bound run.
- **STR024-AUTH-005 — Human-only authority.** For every API, command, queue consumer,
  database constraint, and UI control that can alter priority, assignment, workflow,
  scope, forecast, outcome, gate, merge, release, closure, or external action, tests
  prove platform-agent, adapter, Codex-supervisor, forged-human, and stale-human
  credentials are denied server-side while an authorized human action is separately
  audited.
- **STR024-AUTH-006 — Identity separation.** Given identical/confusable display names,
  prompt text claiming another role, or a human session presented by a worker, when a
  claim or mutation is attempted, then verified principal id/type and scoped credential
  decide access; no display or prompt field can elevate authority.
- **STR024-AUTH-007 — Immutable execution snapshot.** Given an authorized run, when it
  is read during and after execution, then the exact agent/version/instruction/model/
  provider/runtime/adapter/tool-policy/input snapshot and integrity digests remain
  reproducible, while secrets, hidden prompts, personal data not required by the
  inventory, and restricted content remain absent.

### Claim, lease, heartbeat, progress, retry, stop, and failure

- **STR024-LIFE-001 — Exclusive claim.** Given one claimable run and simultaneous claim
  attempts, when claims commit, then only the exact assigned authenticated platform
  agent obtains the lease/fencing token; all other agents, Codex acting as worker, and
  losing requests are denied and audited without ownership transfer.
- **STR024-LIFE-002 — Lease and stale recovery.** Given a claimed/run state, when
  heartbeats cease past the configured lease threshold, then the run becomes visibly
  stale, new writes using the old fence fail, and recovery follows the documented
  bounded retry or blocker path without silent reassignment or duplicated effects.
- **STR024-LIFE-003 — Heartbeats.** Given a valid lease, when bounded heartbeats arrive
  in, out of, and duplicate order, then only authenticated monotonic heartbeats for the
  current fence update freshness; rates are bounded and no heartbeat exposes prompt,
  secret, or source payload content.
- **STR024-LIFE-004 — Safe progress.** Given a running agent, when it reports progress,
  then each event records a plain-language phase, UTC time, monotonic sequence and
  optional redacted evidence reference; progress cannot change authority, claim
  success, or imply a human ruling.
- **STR024-LIFE-005 — Bounded retry.** Given retryable provider/network failures, when
  policy evaluates them, then retry/backoff is capped, observable, jitter-safe, bound
  to the same assignment and authorization, and preserves every attempt, cost,
  latency, and failure. It never retries a non-idempotent side effect without a proven
  idempotency guard.
- **STR024-LIFE-006 — Failure taxonomy.** Given non-retryable, exhausted, revoked,
  authorization, validation, provider, adapter-health, and evidence-binding failures,
  when handled, then the run reaches `FAILED_BLOCKED` with safe reason/code, owner,
  next action, dependency, retry eligibility, and complete attempt history; no failure
  appears as running or successful.
- **STR024-LIFE-007 — Stop and cancel.** Given an authenticated authorized human stop,
  when racing new work, heartbeat, retry, or completion, then `STOP_REQUESTED` commits
  with precedence, new work ceases at the documented safe boundary, existing evidence
  is preserved, and the worker acknowledges `STOPPED`; an agent cannot stop another
  run, erase evidence, or convert stop into success.
- **STR024-LIFE-008 — Revocation and adapter health.** Given revoked worker/adapter
  credentials or an unhealthy/disconnected adapter, when a claim or write occurs, then
  new execution is default-denied, current runs become an actionable hold/stale/blocker
  per policy, and recovery requires health, identity, authorization, idempotency, and
  telemetry checks—not silent best effort.
- **STR024-LIFE-009 — Terminal immutability.** Given `STOPPED`, `FAILED_BLOCKED`, or
  `AWAITING_HUMAN_REVIEW`, when any late, duplicate, stale-fence, or malicious mutation
  arrives, then the terminal record is unchanged, the attempt is audited, and later
  human review/gate events remain separate.

### Output, evidence, telemetry, and feedback

- **STR024-EVID-001 — Exact review-ready package.** Given successful bounded work, when
  the agent returns it, then the package contains work-item key/revision, run and
  attempt ids, assigned and actual worker identities, execution snapshot, lifecycle
  digest, terminal status, start/end times, output/artifact references with immutable
  revision and SHA-256 (or stronger) integrity digests, warnings/unknowns, retry/
  blocker history, and telemetry completeness. Missing or cross-item evidence yields
  `FAILED_BLOCKED`, never review-ready.
- **STR024-EVID-002 — Output authorship provenance.** Given every changed artifact and
  deliverable, when evidence is assembled, then authorship is attributable to the
  platform-agent attempt or to a separately labeled human/supervisor intervention;
  mixed or unknown provenance cannot be counted as autonomous agent work.
- **STR024-EVID-003 — Token, cost, and latency telemetry.** Given success, retry,
  failure, stop, cached response, or a provider that omits a field, when the run ends,
  then per-attempt and aggregate input/output token counts, provider-reported and
  calculated cost with currency/rate-card revision, queue/claim/execution/review-ready
  latency, wall time, retry/stale time, and missingness/reason are recorded. Unknown is
  explicit; zero is used only when observed.
- **STR024-EVID-004 — Human feedback binding.** Given a human review, correction,
  approval/rejection, or qualitative rating, when recorded, then it binds the
  authenticated human, exact `run_id`, attempt/output/evidence revision, agent and
  configuration versions, UTC time, structured reason/category, and any requested
  change; it cannot rewrite the original output or be applied silently to another run.
- **STR024-EVID-005 — Independent Test and Critic scoring.** Given a review-ready run,
  when evaluation begins, then Test and fresh-context Critic runs have different run
  identities, role/config snapshots, and no deliverable-author permissions; each binds
  scores/findings to the exact target artifact commit and Exam revision. Their results
  remain separate from Builder self-checks and from human gate rulings, and Critic
  blockers require explicit human disposition.
- **STR024-EVID-006 — Versioned correction loop.** Given accepted human feedback or a
  verified failure, when an agent prompt, configuration, model, tool policy, adapter,
  or eval changes, then a new immutable version with rationale and predecessor is
  created. New results never overwrite or retroactively improve the prior version's
  metrics.
- **STR024-EVID-007 — Benchmark replay, canary, and rollback.** Given a candidate agent
  version, when promotion is proposed, then the frozen public/synthetic benchmark suite
  replays with versioned fixtures, baseline comparison, quality and guardrail results,
  and explicit missingness; a bounded canary is separately authorized; regression,
  policy failure, or unhealthy telemetry disables new dispatches and rolls back the
  agent/config/adapter version while preserving runs, evidence, and human decisions.

### Codex-supervised bootstrap proof

- **STR024-BOOT-001 — Named-agent end-to-end proof.** Given a synthetic/public fixture,
  an authenticated human dispatch to one named platform agent, and Codex configured
  only as runtime host/observer, when the bootstrap runs, then the named agent claims
  and authors the bounded deliverable; lifecycle, Buzz mirrors, exact evidence,
  telemetry, Test/Critic results, and human feedback all bind to its run/config version;
  Codex's separate supervisor identity shows only start/observe/troubleshoot actions.
  Repository artifact provenance and run events independently agree on authorship.
- **STR024-BOOT-002 — Codex impersonation negative control.** Given the same fixture,
  when Codex submits, edits, or attempts to attest the assigned deliverable without the
  named agent, then the worker mutation is denied or the attempt is marked
  `SUPERVISOR_INTERVENTION`; it cannot reach an untouched agent-success classification,
  awaiting-review numerator, first-pass numerator, quality score, or agent-authored
  evidence set.
- **STR024-BOOT-003 — Authorized emergency intervention.** Given a failed/blocked named
  agent and authenticated human authorization tied to the exact run and permitted
  intervention scope, when Codex assists, then the original failure remains, the
  intervention event records actor/reason/actions/files/before-after evidence and
  telemetry, the result is visibly supervisor-touched, and agent performance excludes
  the affected output while intervention/rework/cost/latency metrics include it.
- **STR024-BOOT-004 — Unauthorized emergency intervention.** Given no exact human
  authorization, when Codex attempts deliverable changes or agent attestation, then the
  action is denied, audited as a policy violation, and the run remains blocked/stopped;
  supervisor platform repair that does not touch the deliverable remains separately
  scoped and auditable.

### Buzz mirror and human-facing work view

- **STR024-UX-001 — Buzz lifecycle mirroring.** Given claim, material progress,
  retry/stale, blocker, stop, failure, completion, or awaiting-human-review events,
  when the outbox delivers to the correct Buzz project thread, then the redacted
  message identifies state, named agent, safe next action and stable links to Work
  Management/GitHub. Duplicate/delayed/out-of-order delivery is idempotent and cannot
  mutate or contradict authority. Buzz outage does not lose the authoritative event and
  becomes visible without blocking safe evidence persistence.
- **STR024-UX-002 — Actionable run panel.** Given loading, no-run, unauthorized/denied,
  claimable, running, retrying, stale, stop-requested, stopped, blocked/failed,
  disconnected-adapter, evidence-incomplete, and awaiting-review states, when the work
  item renders, then state, owner, next permitted action, blocker/dependency, lease
  freshness, exact revision, and review status are plain text and never color-only.
- **STR024-UX-003 — Accessibility.** Given desktop/mobile keyboard-only and supported
  screen-reader use, when a user operates run and human-review controls and live status
  updates arrive, then axe-core has no serious/critical violations, focus is preserved,
  controls and regions have accessible names/semantics, contrast meets WCAG 2.2 AA,
  updates are announced without chatter, and agent progress is distinguishable from a
  human decision request.
- **STR024-UX-004 — Prompt-injection-safe display and mirror.** Given work fields,
  model output, evidence names, or progress containing markup, tool instructions,
  mentions, links, Unicode confusables, or secret-like values, when stored/rendered/
  mirrored, then untrusted content cannot trigger tools, authority, script execution,
  broad mentions, credential exposure, or unsafe links; sanitization/redaction outcomes
  are tested.

### Learning and operating metrics

- **STR024-MET-001 — Stable event coverage.** Given dispatch, create, claim, heartbeat,
  progress, retry, stale recovery, stop/cancel, failure, evidence return,
  awaiting-review, feedback, Test/Critic evaluation, supervisor intervention, adapter
  health, and policy denial, when events are queried, then versioned schemas, stable
  identifiers, UTC ordering, explicit denominators and telemetry missingness make the
  run reproducible without prompts, secrets, restricted data, or unnecessary PII.
- **STR024-MET-002 — Per-agent/version scorecard.** Given a frozen observation window,
  when the scorecard is produced, then it reports by exact agent and configuration
  version: eligible/started/completed run counts; rubric quality and benchmark pass
  rate; untouched first-pass rate; human-intervention rate; human diff-fix and rework;
  gate rejection; verified and escaped defects by severity; policy violations and
  unauthorized attempts; retry/stale/failure/rollback rates; token/cost; queue,
  execution, review, and end-to-end latency; and observation/missingness denominators.
- **STR024-MET-003 — Anti-gaming classification.** Given killed, blocked, stopped,
  failed, retried, rolled-back, Codex-touched, human-edited, or telemetry-incomplete
  attempts, when metrics calculate, then they remain in their declared denominators,
  are not counted as untouched agent successes, and raw run-to-scorecard reconciliation
  proves no survivor filtering or retrospective relabeling.
- **STR024-MET-004 — Cohort evaluation.** Given the human-frozen first 10–20 authorized
  runs or 30-day window (extended until at least 10 runs), when it closes, then the
  report tests the Brief's proposed 90% complete-evidence terminal/awaiting-review and
  100% unique-run/assigned-authentication signals, zero-authority/secret/duplicate
  guardrails, human minutes, costs, first-pass/rework, defects, contrary cases and
  missingness. It labels the result feasibility evidence unless a valid baseline
  supports a stronger claim.

## Edge cases and attacks

The automated suite must cover each case below and reference at least one acceptance ID:

- forged/replayed authorization, worker impersonation, IDOR and cross-org/POD/project/
  item access; assignment/revision races; duplicate concurrent claim; stale credential,
  session, lease and fencing token; revoked adapter; confused-deputy supervisor.
- completion versus stop, retry versus revocation, lease expiry versus evidence return,
  duplicate terminal callback, delayed/out-of-order webhook, partial transaction,
  queue redelivery, network partition, provider timeout/rate limit/outage, and clock
  skew. Event sequence is authoritative; wall-clock time is diagnostic.
- cross-item or mutable evidence, digest mismatch, missing output, mixed authorship,
  human/Codex edits hidden as agent work, Test/Critic target drift, feedback attached to
  the wrong attempt/version, benchmark contamination, metric denominator manipulation,
  and rollback that deletes evidence.
- prompt injection through work fields or evidence, secret/PII exfiltration, malicious
  markdown/URL, oversized event/output, Unicode-confusable identity, unsafe Buzz
  mentions, raw provider error payloads, and cost/rate-card spoofing.
- no run, empty progress, missing telemetry, provider-reported unknown token/cost,
  disconnected adapters, inaccessible evidence, stale live view, repeated refresh,
  mobile reflow, keyboard focus after live update, reduced motion, and screen-reader
  distinction between progress and a human decision.

## Non-functional checks

- **STR024-NFR-001 — Performance budget.** Before Gate 2 approval, the Tech Lead records
  exact load assumptions and p95 budgets for authorized run creation, claim, heartbeat,
  progress append, status read, and evidence finalization. The gauntlet load smoke must
  finish within CORE-09's 10-minute total budget. Missing numbers block Gate 2; the
  Architect does not guess them.
- **STR024-NFR-002 — Security and privacy.** Threat-model tests cover the attacks above;
  secret scan, dependency audit, SBOM/license, static analysis and scoped authorization
  are green. Before Gate 2, an authenticated human ruling records the minimal run-data
  inventory, purpose, access roles, legal/policy basis where applicable, exact retention
  period, deletion/revocation behavior, audit owner, and backup/export treatment.
  Missing decisions default-close implementation.
- **STR024-NFR-003 — Integrity and recovery.** Run/evidence/audit records use durable,
  tamper-evident references, backup/restore is rehearsed, and recovery objectives plus
  state reconciliation are measured. Rollback disables new dispatch/run creation and
  can revert agent/config/adapter versions without deleting runs, evidence, feedback,
  or human decisions.
- **STR024-NFR-004 — Data boundary.** All tests, bootstrap, benchmark, canary, logs,
  exports, and evidence use public unclassified or synthetic data only. CUI, FCI,
  export-controlled, proprietary proposal, classified, credentials, hidden prompts,
  and unnecessary personal data are rejected or redacted before shared persistence.
- **STR024-NFR-005 — Portable adapter conformance.** A provider-neutral conformance
  suite verifies identity, scoped tool policy, start/stop, health/revocation,
  idempotency, lifecycle events, output/evidence integrity, telemetry missingness, and
  export behavior for every enabled runtime adapter. One provider's behavior cannot be
  treated as the contract.

## Outcome instrumentation

- Freeze, before Gate 2, the authorized-dispatch cohort id, start/end rule, denominator,
  proposed signal/guardrail thresholds, metric-schema version, score rubric, benchmark
  fixture revision, rate-card source, privacy classification, and accountable human
  owner. Do not backdate a freeze or call a proposal an observed baseline.
- Read authoritative run and authority events from Work Management, immutable artifact/
  check evidence from GitHub, provider usage from the adapter, Buzz delivery health
  from its outbox, and human active minutes/feedback from the learning ledger. Reconcile
  every scorecard row back to `run_id`, agent/config version, and artifact revision.
- Report first observation at 10–20 authorized runs or 30 calendar days after release,
  whichever comes first, extending until at least 10 runs exist. Preserve rejected
  unauthorized attempts in a separate guardrail denominator and all authorized
  dispatches—including replays, failures, stops, Codex-touched runs, and missing data—in
  the declared denominator.

## Required verification evidence before Gate 3

- Builder build note maps every acceptance ID to deterministic test(s) and exact commit.
- Independent Test Agent evidence records its run/config identity, Exam revision, target
  commit, commands, results, failures and artifacts; self-tests are labeled separately.
- Fresh-context Critic evidence derives tags, attacks Brief + frozen Exam + final diff,
  scores the target revision, and reports up to three blocker/should-fix findings plus
  notes. It authors neither the build nor the Test result.
- Security/privacy, accessibility, reliability, and design-system owners record the
  required checks; no agent substitutes for a qualified human signature.
- The bootstrap and Codex-impersonation negative-control traces include immutable run,
  event, artifact, audit and metric evidence and can be replayed from public/synthetic
  fixtures.

## Human judgment checklist (Evaluate)

- [ ] Can I prove the named platform agent—not Codex—authored the deliverable, and can I
      see every intervention or human edit without reconstructing a chat transcript?
- [ ] Are priority, assignment, gates, merge, release, closure, forecasts, outcomes, and
      external actions technically human-only across UI, API, worker, and data layers?
- [ ] Are stale, retrying, stopped, failed, evidence-incomplete, disconnected, and
      awaiting-review states honest, accessible, and actionable?
- [ ] Do Test and fresh Critic results target the exact run/artifact/Exam versions, and
      does feedback create a measurable versioned improvement loop without rewriting
      history?
- [ ] Would the named security, privacy, accessibility, reliability, and design owners
      ship this bounded public/synthetic-data rollout under their names?

## Gate 2 preparation checklist

- [ ] Authenticated Gate 1 evidence is durably mirrored with actor, time, decision and
      exact Brief revision; the current supervisor verification is recorded without a
      fabricated public URL.
- [ ] Tech Lead approves the complete transition table, endpoint/capability inventory,
      worker-authentication method, lease/fencing policy, and race precedence.
- [ ] Human owner freezes the data inventory, retention/deletion/revocation/access
      ruling and outcome cohort/thresholds required above.
- [ ] Test Agent maps every Brief “done and correct” line to acceptance IDs and records
      independent coverage evidence; fresh Critic challenges this Exam.
- [ ] Exact performance/recovery budgets, benchmark/rubric fixtures, canary scope,
      rollback owner, and required specialist owners are named.

---

GATE 2: PENDING — authenticated human Product Lead + Tech Lead ruling required in a
different session after Gate 1; this Architect artifact is not an approval.
GATE 2 EVIDENCE: PENDING — must bind authenticated approvers and required checks to the
exact Exam revision.

GATE 3: PENDING — requires verified build, independent Test and fresh Critic evidence,
all tagged-domain human rulings, human Product Lead + Tech Lead approval, and the
default-closed cooling-off period.
GATE 3 EVIDENCE: PENDING
