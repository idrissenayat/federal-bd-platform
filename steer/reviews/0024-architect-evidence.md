# Architect evidence — STR-024 Gate 2 Exam preparation

**Role:** named STEER Architect Agent
**Work item:** [STR-024 / issue #52](https://github.com/idrissenayat/federal-bd-platform/issues/52)
**Branch:** `codex/str024-architect`
**Brief reviewed:** `steer/briefs/0024-governed-agent-execution.md` at exact revision
`5c0db389d1b0e9fa492a33930febcf4d1c067cb0`
**Exam prepared:** `steer/exams/0024-governed-agent-execution.md`
**Authority boundary:** Exam/receipt/evidence design plus governed incorporation of exact
Docs boundary `bcf4856f`; no runtime/product code, credential, deploy, repository-to-main
merge, release, closure, or gate authority

## Authorization provenance

The Codex supervisor verified the following authenticated STEER Work Management trail
for this Architect run:

- Idriss Enayat accepted the Value Hypothesis at 2026-08-15 16:21
  America/New_York.
- At 2026-08-15 16:22 America/New_York, Idriss Enayat approved Gate 1 for STR-024
  against linked Brief revision `5c0db389d1b0`. The ruling accepted the Critic's
  default-closed concern as mandatory downstream control and authorized Exam design
  only—not credentials, implementation, release, or any later gate.
- STEER advanced the item to Frame and assigned the Architect Agent.
- Codex is the supervisor/runtime host for this bootstrap; it is not the Architect and
  cannot claim the Architect's output as its own platform-agent performance.

STEER Work Management is authoritative for this ruling. GitHub issue #52 exposes the
earlier Scout dispatch but, at the time of this evidence, does not expose a public
authenticated Gate 1 mirror. This document records the verified provenance and the
traceability gap without inventing a URL or treating GitHub comments as the authority.

## Inputs read

- Brief 0024 and its pre-Gate-1 Critic review.
- `AGENTS.md`, `steer/operating-system/GATES.md`,
  `steer/operating-system/GUARDRAIL-LIBRARY.md`,
  `steer/PROJECT-GUARDRAILS.md`, and
  `steer/operating-system/DECISION-LOG.md`.
- `steer/TEAM-COMMUNICATION.md`, `steer/agents/agent-roles.md`,
  `steer/operating-system/METRICS.md`, and `steer/EXPERIMENT-CHARTER.md`.
- `docs/steer/TOOL-ADAPTERS.md` and `docs/steer/REFERENCE-ARCHITECTURE.md`.
- STR-024 issue #52 and its currently public owner comment.

## Architecture options considered

### A — Work Management run ledger plus transactional outbox and bounded worker adapter

Work Management creates the durable authorization/run record and append-only lifecycle
events. A transactional outbox drives a replaceable worker adapter and Buzz mirror;
fenced leases and idempotency protect execution. GitHub stores immutable engineering
evidence, and a learning ledger derives versioned agent scorecards from run events.

- **Trade-off:** clearest authority and recovery boundaries, but it requires careful
  consistency and outbox reconciliation across Work Management, runtime, GitHub, and
  Buzz.
- **Main risk:** an incomplete transaction/fencing design could show stale or duplicate
  work as current.
- **Complexity:** M–L.
- **Stressed guardrails:** SEC-03..05, PRIV-01..03, REL-01..04, CORE-11.

### B — Append-only event store as the execution ledger with projected work-item views

All authorization and runtime events enter one integrity-protected stream; Work
Management views and metrics are deterministic projections. Adapter and Buzz delivery
consume the same stream with independent checkpoints.

- **Trade-off:** excellent replay/audit semantics, but projection lag and operational
  complexity can confuse the human authority view unless boundaries are exceptionally
  clear.
- **Main risk:** treating an execution event stream as authority could accidentally
  bypass existing Work Management human controls.
- **Complexity:** L.
- **Stressed guardrails:** CORE-05..06, SEC-03..05, REL-01..04, HUM-01..02.

### C — External runtime owns orchestration; Work Management receives callbacks

The provider runtime creates tasks, retries, and terminal callbacks while Work
Management stores summaries and evidence links.

- **Trade-off:** quickest provider-specific integration, but weakens portable identity,
  idempotency, revocation, and authoritative state guarantees.
- **Main risk:** callbacks or chat/provider history become de facto authorization and
  Codex can be mistaken for the named agent.
- **Complexity:** S initially, L to govern.
- **Stressed guardrails:** SEC-03..05, AI-03, HUM-01..02, REL-02..04.

**Recommendation:** Option A is the best design direction for a bounded vertical slice
because it preserves Work Management authority while making worker and Buzz delivery
replaceable. The Exam remains provider/storage neutral and requires the Builder to
prove its transition, fencing, evidence, and rollback contracts before any choice can
pass; this recommendation does not authorize implementation.

## Exam coverage and supervisor boundary

The Exam assigns stable acceptance IDs to all 15 “done and correct” Brief lines and
adds explicit coverage for:

- immutable run, assignment, revision, agent/config/instruction/model/provider/runtime/
  tool-policy identity;
- claim/lease/fencing, heartbeat, safe progress, bounded retry, stop, failure, stale
  recovery, terminal immutability, and race precedence;
- exact output/evidence integrity, tokens/cost/latency, feedback bound to exact runs and
  versions, independent Test/Critic scoring, versioned correction, benchmark replay,
  canary, and rollback;
- per-agent/version quality, intervention, rework, gate rejection, defects, policy,
  cost, latency, and missingness metrics;
- Buzz lifecycle mirroring and server-enforced human-only authority; and
- one end-to-end named-agent bootstrap plus negative controls that prevent Codex work
  from being attributed to platform agents.

Codex may host/start/observe/stop-for-safety/troubleshoot, but it may not impersonate or
author deliverables for Architect, Builder, Test, Critic, Scout, Docs, or Ops. Emergency
deliverable intervention requires exact authenticated human authorization, is fully
audited, is marked supervisor-touched, is excluded from agent success/quality/first-pass
numerators, and remains in failure/intervention/rework/cost/latency denominators.

### Brief-to-Exam traceability

| Brief “done and correct” line | Primary Exam acceptance IDs |
|---|---|
| 1. Authority and identity | STR024-AUTH-001..007 |
| 2. Human/agent boundary | STR024-AUTH-005..006, STR024-BOOT-001..004 |
| 3. Durable lifecycle | STR024-LIFE-001..009, STR024-MET-001 |
| 4. Idempotency | STR024-AUTH-003..004, STR024-LIFE-009 |
| 5. Claim and lease | STR024-LIFE-001..003, STR024-LIFE-008 |
| 6. Heartbeat and progress | STR024-LIFE-002..004, STR024-UX-002 |
| 7. Retry and failure | STR024-LIFE-005..006, STR024-MET-003 |
| 8. Stop and cancel | STR024-LIFE-007..009 |
| 9. Evidence return | STR024-EVID-001..005 |
| 10. Provider and model portability | STR024-AUTH-007, STR024-NFR-005 |
| 11. Telemetry and learning | STR024-EVID-003..007, STR024-MET-001..004 |
| 12. Accessibility and clarity | STR024-UX-002..004 |
| 13. Security and privacy | STR024-AUTH-002..007, STR024-UX-004, STR024-NFR-002..004 |
| 14. Rollout and rollback | STR024-EVID-007, STR024-LIFE-008, STR024-NFR-003 |
| 15. Falsifiable evaluation | STR024-MET-002..004 |

## Independent rework inputs

- Independent Test Agent evidence commit
  `6026dcc401d97e2fa5e39f0d803683db305bfed3` reviewed exact Architect commit
  `df0cdde2e1916062c239fa3867588a855f9b691b` and reported 20 PASS / 20 BLOCK.
- Fresh Critic Agent evidence commit
  `203c685ee558a4a57bba3d55d6845263c0b44188` reviewed the same target and reported
  three BLOCKERs. No finding was dismissed.
- Corrected Docs Agent supervisor-boundary commit
  `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de` supersedes the rejected broad wording at
  `909f438ca646ecb8e38aad2d2008c4082c6d7adb`. It was a parallel dependency at the first
  rework; the second rework incorporates exact `bcf4856f` as an ancestor and preserves
  its corrected content.

The rework revision is the immutable containing commit for this response and its paired
`steer/exams/0024-governed-agent-execution.md`. The post-push Architect handoff supplies
that exact commit URL. The source review commits remain immutable and are preserved in
this branch history.

## Test BLOCK rework-response matrix

| Independent Test BLOCK at `6026dcc` | Disposition in this exact rework revision |
|---|---|
| STR024-AUTH-001 | Replaced the minimum table with a complete default-deny state/event table including no-run→`AUTHORIZED`→`CREATED`, invalid transitions and actors. |
| STR024-AUTH-004 | Frozen all invalidating revisions to `STOP_REQUESTED`; only digest-neutral display/redaction corrections may continue. |
| STR024-LIFE-002 | Proposed exact 120-second lease/write-fence expiry and immediate stale UI, 30-second heartbeat, 60-second warning, no-write 120–150 recovery grace, 150-second blocker, reclaim/fence and skew policy under RAT-LIFECYCLE. |
| STR024-LIFE-003 | Added exact cadence, one-per-10-second rate, 8-KiB limit, server ordering and ±5-second skew diagnostic. |
| STR024-LIFE-005 | Added three-attempt limit, exact 5/20-second seeded jitter, retryable/non-retryable code sets and side-effect receipt rule. |
| STR024-LIFE-006 | Added canonical failure codes, owner roles, unknown-code safe stop, dependency/next-check/retry fields. |
| STR024-LIFE-007 | Added pre-claim stop, exact safe boundary, 5-second acknowledgement, 30-second fence, Codex safety-stop conditions and CAS race precedence. |
| STR024-LIFE-008 | Added 30-second health checks, degraded/unhealthy/recovery thresholds and deterministic blocker versus lease-stale semantics. |
| STR024-EVID-003 | Defined rate-card authority, unknown-cost rule and exact queue/claim/execution/review-ready latency boundaries. |
| STR024-EVID-005 | Added `str024.eval.v1`, non-selectable scoring manifest, distinct custodian/evaluator/transport/workload principals, author exclusion, explicit rubric/pass floor and one-way encrypted holdout isolation. |
| STR024-EVID-007 | Defined B01–B12, pass threshold, contamination invalidation, five-run/seven-day canary, stop triggers, owner and disable/recovery contract. |
| STR024-BOOT-001 | Frozen `STR024-BOOT-V1` agent/config/tool policy and bytes/hashes; added measured isolated workload, signed/HPKE manifest, sealed trace/finalizer attestation oracle and legitimate-workload signing-oracle attack STR024-BOOT-001A. |
| STR024-UX-002 | Named Work Management `Agent run` panel, unexpected-error state and principal/state control rules with server enforcement. |
| STR024-UX-003 | Pinned browser/AT/viewport matrix, focus behavior, reduced motion, live-region rate and manual evidence format. |
| STR024-MET-002 | Defined exhaustive no-exclusion eligible-run predicate, unique-run unit, fixed benchmark denominator and exact numerators/denominators for quality, first-pass, intervention, rework, rejection, defects, policy, cost and latency. |
| STR024-MET-004 | Defined `STR024-PILOT-V1`, exact close/extension rule, lifecycle versus useful-output measures, replay deduplication and feasibility-only claim. |
| STR024-NFR-001 | Proposed exact load profile, operation p95s, error/drop bounds and CI budget under RAT-SLO. |
| STR024-NFR-002 | Proposed exact data/access/90-day/365-day/35-day/deletion/revocation/export policy and explicitly dispositioned the current dev/build dependency exception through 2026-08-27 under RAT-PRIVACY/RAT-DEPS. |
| STR024-NFR-003 | Proposed 99.0% canary availability, 100% critical telemetry, RPO 0, RTO 30 minutes, 100-run restore and zero-mismatch reconciliation under RAT-SLO/RAT-CANARY. |
| STR024-NFR-005 | Defined `steer-runtime-adapter/v1`, B01–B12 100% hard-control pass, deterministic fake export/import and honest one-versus-two-adapter portability claims. |

## Critic BLOCKER rework-response matrix

| Fresh Critic BLOCKER at `203c685` | Disposition in this exact rework revision |
|---|---|
| BLOCKER 1 — named-agent authorship not independently provable | Defined independently verified measured isolated-workload generation, signed/encrypted manifest input, sealed agent/provider/tool trace and output-only finalizer, DSSE/Ed25519 statement, separate actor events, mixed-patch attribution and known-byte legitimate-workload/confused-deputy/replay/post-sign tests. Current un-attested Architect work remains excluded. |
| BLOCKER 2 — authority chain inconsistent and parallel rule over-broad | Retained authoritative Work Management provenance, prepared a separate exact-revision receipt/countersignature/in-file-signature procedure, rejected `909f438`, incorporated corrected `bcf4856` as exact ancestor/content, and kept ordinary/emergency Codex actions separately authorized, non-deliverable and ineligible for agent/gate attribution. |
| BLOCKER 3 — placeholders/gameable measures | Converted policy/numeric/fixture placeholders into conservative proposed values with RAT-IDENTITY/LIFECYCLE/PRIVACY/SLO/EVAL/CANARY/A11Y/DEPS/SUPERVISOR fields; completed endpoint/transition/race oracles; deduplicated replay attempts from unique-run outcomes; separated lifecycle accountability from useful output; froze rubric/benchmark/holdout contamination/canary/rollback/a11y/privacy/security/reliability parameters. |

## Second independent recheck inputs

- Independent Test retest commit
  `82c2fe5b4538bb2906038f8f1e56db5d4db9bc06` rated all 41 acceptance IDs design PASS
  and left only human/platform evidence residuals.
- Fresh Critic recheck commit
  `414f297932643f76e7435195b93b035e9bee5b07` narrowed the remaining defects to named-
  agent generation proof, effective supervisor/Gate 1 governance, and lease/
  eligibility/scoring-manifest exactness. No recheck finding was dismissed.

## Critic `414f297` rework-response matrix

| Recheck blocker | Disposition in this exact second-rework revision |
|---|---|
| 1 — signer endorsement did not prove named-agent generation; holdout/runtime access contradicted itself | Replaced ambiguous “bound workload proof” with `AgentExecutionManifest/v1` plus hardware-backed remotely measured `STEER Isolated Agent Workload/v1`; sealed workload key/plaintext, disabled host semantic channels, one-time signed/HPKE input, measured agent/provider/tool hash-chain, signer reachable only from the internal sealed final-output buffer, DSSE statement binding quote/manifest/trace, and an independent verifier. STR024-BOOT-001A now attacks Codex known bytes through the **legitimate** workload/finalizer path. Holdouts use distinct custodian/evaluator/transport/workload principals, evaluator→workload fixed-size ciphertext, workload→evaluator encrypted output, oracle never delivered to workload, and semantic-access contamination rules. The claim is deliberately limited to measured workload generation, not human-like model authorship. |
| 2 — corrected boundary was not effective and detached receipt did not satisfy in-file signature policy | Non-fast-forward merged exact corrected Docs commit `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`; it is now an ancestor and its corrected operating-model content is present. Added `steer/evidence/0024-gate-1-receipt.md` with exact commit/blob/SHA/body hash, `steer.gate-receipt.v1` fields, platform-signature verification, and an explicit pending Idriss Enayat countersignature. The template requires a later authenticated human-authorized signature-only Brief descendant that changes only `GATE 1`/`GATE 1 EVIDENCE`, preserves the substantive-body hash and satisfies current GATES/SOLO rules. This Architect did not sign or edit the frozen Brief. |
| 3 — 120/150 timing conflicted; eligibility and scoring could be selected | Made the write fence/lease expire and UI stale transition occur at exactly 120 seconds; 120–150 is explicitly no-write recovery grace and 150 commits `FAILED_BLOCKED/LEASE_STALE` if the same assigned valid agent has not started a new attempt. Defined eligible pilot runs exhaustively with no post-authorization exclusions, fixed first-run B01–B12 benchmark denominator and zero treatment for failures/contamination/missing cases. Froze `str024.scoring-manifest.v1` owner/custodian/evaluator/transport roles, mandatory fields, canonical digest, fixed Boolean point allocations and absence of selectable cases/weights/exclusions. Exact encrypted holdout/oracle digests remain a named human Test-owner Gate 2 attachment because the Architect must not see or invent them. |

## Smallest residual human actions and platform export

1. **One Gate 1 evidence action package:** the platform owner exports and signs the
   canonical `steer.gate-receipt.v1` fields in the prepared receipt; Idriss Enayat
   verifies and countersigns it through an authenticated repository action; then an
   authenticated human authorizes the signature-only Brief descendant required by
   current GATES/SOLO policy. The frozen Brief remains untouched in this Architect
   revision.
2. **One exact-revision ratification package:** Idriss Enayat records `RATIFIED` or
   `REVISE` for RAT-IDENTITY, RAT-LIFECYCLE, RAT-PRIVACY, RAT-SLO, RAT-EVAL,
   RAT-CANARY, RAT-A11Y and RAT-DEPS; identifies any separately qualified co-ratifier;
   and the named Test owner/custodian attaches the signed canonical B01–B12 manifest,
   aggregate digest, ciphertext/oracle/assertion digests and custody/access evidence.
3. **One final independent evidence cycle and human Gate 2 decision:** independent Test
   and fresh Critic review the exact second-rework commit. Only after their findings and
   the two packages above are complete may the authorized human decide Gate 2 in the
   required separate session.

Future implementation of the isolated workload, attestation verifier and immutable
events is Gate 3/build evidence, not a Gate 2 design residual. Existing un-attested
Architect/Test/Critic artifacts remain excluded from platform-agent performance and
cannot be backfilled.

## Recommendation

**Exam content: ready for independent recheck. Gate 2 readiness: BLOCK pending the three
human/evidence actions above.** This is an Architect recommendation, not a gate ruling.

## Verification record

Initial revision `df0cdde2e1916062c239fa3867588a855f9b691b` was verified
2026-08-15T16:39:21-04:00 in the dedicated Architect worktree:

| Check | Result |
|---|---|
| `uv run ruff check .` | PASS |
| `uv run mypy tests` | PASS |
| `uv run pytest -q` | PASS — 3 tests |
| `./scripts/gauntlet.sh` | PASS — readiness 35 pass, 1 expected missing-SAM-key warning, 0 fail; gitleaks, OSV and Semgrep clean |
| `./scripts/prove-gauntlet-blocks.sh` | PASS — synthetic secret and failing test blocked |
| `git diff --cached --check` | PASS |
| Scope check | PASS — only the STR-024 Exam and Architect evidence are added |
| Brief integrity/base check | PASS — Brief file unchanged and worktree base exactly `5c0db389d1b0e9fa492a33930febcf4d1c067cb0` |

The expected SAM.gov warning is unrelated to this documentation-only Exam change and no
credential was added. Exact commit and GitHub evidence URLs are supplied in the
Architect handoff after commit/push rather than guessed in this pre-commit artifact.

Rework verification completed 2026-08-15T17:01:46-04:00:

| Check | Result |
|---|---|
| `./scripts/gauntlet.sh` | PASS in 10.5s — readiness 35 pass, expected missing-SAM-key warning, 0 fail; Ruff, mypy, pytest 3/3, gitleaks, `uv.lock` OSV and Semgrep 252 rules clean |
| `npm ci && npm run lint && npm test` in `flight-board/` | PASS — build, render test 1/1 and TypeScript tests 27/27 |
| Production-only npm audit | PASS — 0 vulnerabilities |
| Full npm/OSV audit | QUALIFIED AS SPECIFIED — npm 2 high + 4 moderate dev/build nodes; OSV 2 high + 1 medium advisories across 2 dev packages; 0 critical and unchanged from the time-bounded 2026-08-13 exception |
| `./scripts/prove-gauntlet-blocks.sh` | PASS — planted secret and failing test blocked |
| Bootstrap fixture hash reproduction | PASS — exact input/output SHA-256 values reproduce |
| Acceptance/rework inventory | PASS — 41 unique Exam IDs including new hostile-host STR024-BOOT-001A; no duplicates; matrix contains all 20 Test BLOCKs and all 3 Critic BLOCKERs |
| `git diff --check` and scope | PASS — rework changes only the STR-024 Exam and Architect evidence after importing the two independent review artifacts |
| Frozen Brief integrity | PASS — no byte change from `5c0db389d1b0e9fa492a33930febcf4d1c067cb0` |
| Corrected supervisor dependency at first rework | PASS for exact remote existence/content of `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`; ancestry was then an explicit unresolved dependency and was not silently asserted |

Second rework verification completed 2026-08-15T17:22:52-04:00:

| Check | Result |
|---|---|
| `./scripts/gauntlet.sh` | PASS in 10.3s — readiness 35 pass, expected missing-SAM-key warning, 0 fail; Ruff, mypy, pytest 3/3, gitleaks, `uv.lock` OSV and Semgrep 252 rules clean |
| `npm ci && npm run lint && npm test` in `flight-board/` | PASS — build, render test 1/1 and TypeScript tests 27/27 |
| Production-only npm audit | PASS — 0 vulnerabilities |
| Full npm/OSV audit | QUALIFIED AS SPECIFIED — npm 2 high + 4 moderate dev/build nodes; OSV 2 high + 1 medium advisories across 2 dev packages; 0 critical, matching the time-bounded existing exception |
| `./scripts/prove-gauntlet-blocks.sh` | PASS — planted secret and failing test blocked |
| Corrected supervisor ancestry/content | PASS — exact `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de` is an ancestor and all seven corrected boundary/evidence files are byte-identical to that revision |
| Gate 1 receipt integrity | PASS — prepared receipt contains exact frozen Brief commit/blob/SHA-256 and substantive-body SHA-256; remains explicitly unsigned/pending |
| Frozen Brief integrity | PASS — Git blob remains `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`; no byte changed from `5c0db389d1b0e9fa492a33930febcf4d1c067cb0` |
| Acceptance/recheck inventory | PASS — 41 unique IDs, no duplicate, and 3/3 Critic-`414f297` blockers mapped |
| Bootstrap hashes / diff | PASS — all three hashes reproduce; staged diff has no whitespace error |
