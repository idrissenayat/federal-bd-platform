# Architect evidence — STR-024 Gate 2 Exam preparation

**Role:** named STEER Architect Agent
**Work item:** [STR-024 / issue #52](https://github.com/idrissenayat/federal-bd-platform/issues/52)
**Branch:** `codex/str024-architect`
**Brief reviewed:** `steer/briefs/0024-governed-agent-execution.md` at exact revision
`5c0db389d1b0e9fa492a33930febcf4d1c067cb0`
**Exam prepared:** `steer/exams/0024-governed-agent-execution.md`
**Authority boundary:** Exam design and Architect evidence only; no runtime/code,
credential, deploy, merge, release, closure, or gate authority

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

## Open Gate 2 readiness findings

1. **BLOCK — independent Exam evidence is not yet present.** A named Test Agent must map
   every Brief line to acceptance IDs, and a fresh-context Critic must challenge the
   Exam. This Architect cannot self-certify their independent results.
2. **BLOCK — default-closed human rulings are not yet recorded in durable evidence.**
   The Exam requires the exact run-data inventory, retention/deletion/revocation/access
   decision, worker-authentication and lease/fencing policy, endpoint inventory,
   race-precedence table, performance/recovery budgets, cohort/threshold freeze,
   benchmark/rubric revision, canary scope, rollback owner, and specialist owners.
   The Brief and repository intentionally do not supply these values; the Architect did
   not guess them.
3. **TRACEABILITY — GitHub lacks a public Gate 1 mirror.** This does not negate the
   authoritative Work Management ruling or block Exam drafting, but CORE-11/GATES
   require durable authenticated gate evidence tied to exact artifact revision before a
   later gate can pass.

## Recommendation

**Gate 2 readiness: BLOCK.** The Exam is ready for independent Test/Critic challenge and
the named human/default-closed rulings, but it is not ready for Gate 2 approval until
the three findings above are resolved against the exact committed Exam revision. This
recommendation is not a Gate 2 ruling.

## Verification record

Verified 2026-08-15T16:39:21-04:00 in the dedicated Architect worktree:

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
