# Independent Test retest evidence — STR-024 Gate 2 Exam rework

**Exam design result:** `PASS` — 41/41 current acceptance IDs are complete,
falsifiable, authority-safe, negative-path covered, evidence-producing, and traceable.

**Gate 2 readiness recommendation:** `BLOCK` — only the exact human/platform evidence
listed under “Genuine residuals” remains. This Test result does not approve Gate 2.

**Review role:** independent STEER Test Agent retest

**Review time:** 2026-08-15T21:08:08Z / 2026-08-15T17:08:08-04:00

**Corrected Architect target:** `10476ba38a3f13b8e2623eda8f81779ca1ba0936`

**Corrected Exam blob / SHA-256:**
`8c8abaeaa6e2a88f796aac7d9dd9de3a6e242437` /
`588e52de087c7cda8c2258b08d38d5b2acd1e73cd40ab6c8e412b551d8319be1`

**Prior Test evidence:** `6026dcc401d97e2fa5e39f0d803683db305bfed3`

**Prior Critic evidence:** `203c685ee558a4a57bba3d55d6845263c0b44188`

**Corrected Docs boundary:** `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`

**Frozen Brief:** `5c0db389d1b0e9fa492a33930febcf4d1c067cb0`

**Retest branch:** `codex/str024-independent-retest-20260815210356`

**Authority boundary:** evidence-only retest. No Brief, Exam, operating-model document,
implementation, application data, gate state, deployment, merge, release, closure, or
PR was changed or authorized.

## Test identity and pre-implementation evidence boundary

This fresh dedicated worktree started at the exact corrected Architect commit. The
execution surface identifies this reviewer as a dedicated Codex test-agent task acting
in the STEER Test role, but it still exposes no durable STEER `run_id`, separately
authenticated platform-agent principal, instruction digest, exact model/provider
identifier, or tool-policy snapshot. Those fields remain reported missing rather than
invented.

That limitation does not make the corrected Exam design untestable. Gate 2 freezes
observable requirements before implementation. The attestation service, runtime event
store, implementation tests, actual bootstrap, load/canary/restore traces, and adapter
conformance results are therefore Gate 3/build evidence, not prerequisites for judging
whether the Exam now defines correct behavior. Existing un-attested Architect/Test/
Critic commits must remain excluded from platform-agent performance; a human may review
their content but cannot turn Git author metadata into agent-authorship proof.

Local tool snapshot: Git 2.39.5, uv 0.12.3, Python 3.12.13, Node 20.19.4, npm 10.8.2,
gitleaks 8.30.1, OSV-Scanner 2.5.0, and Semgrep 1.172.0.

## Integrity, source-review, and ancestry verification

| Check | Result | Independent evidence |
|---|---|---|
| Exact target and remote | PASS | Fresh worktree initial `HEAD` and `origin/codex/str024-architect` both resolve to `10476ba38a3f13b8e2623eda8f81779ca1ba0936`. |
| Frozen Brief integrity | PASS | Target and frozen commit use the same Git blob `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`, SHA-256 `6a5dcf65e1ef6930c7964374d1aaf0220a0810c8d99022c2936c2cb1607c065c`, and 17,786 bytes. |
| Prior Test preservation | PASS | The target's imported Test-evidence blob `abae7f4e0d17cefb79ef0d64a9c73c1c2f71bf6c` is byte-identical to commit `6026dcc`; the source commit itself is not falsely represented as an ancestor. |
| Prior Critic preservation | PASS | The target's imported Critic-evidence blob `ebc4d18cba5120eb48e1280acd0335e3da11c2c4` is byte-identical to commit `203c685`; the source commit itself is not falsely represented as an ancestor. |
| Review-import history | PASS | Equivalent review artifacts enter the target through commits `91df02e` and `3eeb921`; the original remote review commits remain immutable. |
| Corrected Docs boundary content | PASS | Commit `bcf4856f...` narrows Codex to host/read-only/safety and separately authorized non-deliverable platform work, seals failed deliverables, separates actor attestations, forbids self-grading/holdout access, and makes emergency intervention a new exact-scope/time-bound human-authorized run. |
| Corrected Docs boundary ancestry | BLOCK as expected residual | `bcf4856f...` and `10476ba...` share base `d9dcb533...`; `bcf4856f...` is not an ancestor. The Exam accurately calls it a proposed parallel dependency and requires governed incorporation before Gate 2. The target tree's `docs/steer/OPERATING-MODEL.md` does not yet contain that boundary. |
| Public Gate 1 receipt | BLOCK as expected residual | Issue #52 still has one public Scout dispatch comment that says Gate 1 pending. The asserted Work Management ruling has no independently exportable signed exact-Brief receipt; the Exam correctly names `RAT-GATE1-RECEIPT`. |
| Rework inventory | PASS | 41 unique current IDs (AUTH 7, LIFE 9, EVID 7, BOOT 5, UX 4, MET 4, NFR 5), 20/20 prior Test BLOCK rows, and 3/3 prior Critic BLOCKER rows; no duplicate current ID. |

## Twenty prior Test BLOCK dispositions

Every prior content blocker is resolved at the design level. `RAT-*` means the value is
an explicit conservative Gate 2 proposal awaiting human ratification, not a placeholder
and not an approval.

| Prior BLOCK | Retest | Verified correction |
|---|---|---|
| STR024-AUTH-001 | PASS | Complete default-deny table now includes no-run→`AUTHORIZED`→`CREATED`, actors, terminal rules, invalid-transition denial, CAS/fencing, and evidence finalization. |
| STR024-AUTH-004 | PASS | Exact invalidating fields stop/fence the run; only digest-neutral display/redaction correction may continue. |
| STR024-LIFE-002 | PASS | RAT-LIFECYCLE gives 120-second lease, 30-second heartbeat, warning at 60, lease/fence behavior, stale at 150, same-agent reclaim, higher fence, and budget exhaustion. |
| STR024-LIFE-003 | PASS | Cadence, one-per-10-second rate, 8-KiB payload, server ordering, duplicate/out-of-order rejection, and ±5-second diagnostic skew are fixed. |
| STR024-LIFE-005 | PASS | Three total attempts, 5/20-second delays, deterministic seeded 0–20% jitter, exact retryable/non-retryable classes, and side-effect receipt rule are specified. |
| STR024-LIFE-006 | PASS | Canonical codes, owner roles, next check/dependency/retry fields, and `UNKNOWN_SAFE_STOP` fail-closed behavior are fixed. |
| STR024-LIFE-007 | PASS | Pre-claim stop, exact tool-call/atomic-result boundary, 5-second acknowledgement, 30-second fence, safety-stop conditions, and CAS race precedence are fixed. |
| STR024-LIFE-008 | PASS | 30-second health checks, one-failure degraded, two-failure/60-second unhealthy, two-success recovery, write fencing, and lease-stale separation are deterministic. |
| STR024-EVID-003 | PASS | Usage-export/invoice rate-card authority, authenticated fallback, `UNKNOWN` semantics, and exact queue/claim/execution/review-ready intervals are defined. |
| STR024-EVID-005 | PASS | `str024.eval.v1`, distinct service principals, author/evaluator exclusion, 100-point rubric, score floors, hard-fails, dependency disclosure, and holdout isolation are fixed. |
| STR024-EVID-007 | PASS | B01–B12, exact promotion floor/hard-fails, contamination invalidation, five-run/seven-day canary, stop/pause triggers, disable command, owner, preservation, and recovery checks are fixed. |
| STR024-BOOT-001 | PASS | Exact agent/config/policy, instruction/input/output bytes and hashes, agent-only attestation/event oracle, and hostile-host proof are fixed. All three published SHA-256 values independently reproduce. |
| STR024-UX-002 | PASS | Exact Work Management `Agent run` panel, unexpected-error state, state information, principal/control boundary, and server enforcement are fixed. |
| STR024-UX-003 | PASS | Browser/AT/OS/viewport matrix, focus/error-summary behavior, WCAG 2.2 AA, reduced motion, live-region limits, and manual evidence requirements are fixed. |
| STR024-MET-002 | PASS | Unique `run_id` unit and exact quality/first-pass/intervention/rework/rejection/defect/policy/retry/stale/failure/rollback/cost/latency/missingness formulas are fixed. |
| STR024-MET-004 | PASS | `STR024-PILOT-V1`, 20-run/day-30/10-run extension rule, unique-run deduplication, lifecycle versus useful-output measures, replay guardrail denominator, and feasibility-only claim are fixed. |
| STR024-NFR-001 | PASS | Full load assumptions, operation p95s, error/drop bounds, provider-time separation, deterministic CI smoke, and total gauntlet budget are fixed as RAT-SLO proposals. |
| STR024-NFR-002 | PASS | Field/purpose/access/90-day/365-day/35-day/deletion/revocation/export/audit policy and an exact, expiring documentation-only dependency exception are fixed under RAT-PRIVACY/RAT-DEPS. |
| STR024-NFR-003 | PASS | 99.0% canary availability, 100% critical telemetry, RPO 0, RTO 30 minutes, 100-run restore, zero unexplained mismatch, outbox thresholds, and rollback preservation are fixed. |
| STR024-NFR-005 | PASS | `steer-runtime-adapter/v1`, B01–B12 hard-control conformance, deterministic fake export/import, and honest one-adapter `UNPROVEN` versus two-adapter portability claims are fixed. |

## Three prior Critic BLOCKER dispositions

| Prior Critic finding | Design retest | Verified disposition / remaining evidence boundary |
|---|---|---|
| BLOCKER 1 — named-agent authorship was not independently provable | PASS | `AgentOutputAttestation/v1` now names a separate issuer, 15-minute audience/run/agent-bound proof-of-possession credential, non-exportable Ed25519 signing key, DSSE in-toto statement fields, independent verifier, nonce/fence/revocation/digest/post-edit rejection, separately credentialed actor events, mixed-patch attribution, and hostile-host/confused-deputy negative control. Runtime implementation and a real trace belong after Gate 2; current un-attested outputs remain non-agent performance. |
| BLOCKER 2 — authority chain and broad parallel Codex rule | PASS design / BLOCK residual evidence | The Exam narrows ordinary and emergency Codex powers and pins the corrected `bcf4856f...` content without pretending it is ancestry. The remaining signed Gate 1 receipt and governed boundary incorporation are explicit Gate 2 prerequisites. |
| BLOCKER 3 — placeholders and gameable measures | PASS | Numeric policies, endpoint/transition/race oracles, RAT fields, replay deduplication, lifecycle/useful-output separation, rubric, benchmark, blind holdouts, contamination invalidation, canary/rollback, accessibility, privacy, dependency, SLO, and recovery proposals are now concrete. Human ratification and B01–B12 manifest/oracle digests remain evidence steps, not design ambiguity. |

**Twenty Test findings plus three Critic findings: 23/23 have an adequate design
disposition.** This does not imply that the residual human decisions, platform receipt,
normative ancestry, or future implementation evidence already exist.

## Current per-ID design matrix

Legend: completeness (`C`), falsifiability (`F`), authority separation (`A`), negative
paths (`N`), evidence requirements (`E`), and Brief/guardrail traceability (`T`). `P`
means the current Exam adequately specifies that dimension. No ID is marked `BLOCK`
merely because its implementation/build evidence properly occurs after Gate 2.

| Acceptance ID | C | F | A | N | E | T | Design verdict | Retest oracle |
|---|---:|---:|---:|---:|---:|---:|---|---|
| STR024-AUTH-001 | P | P | P | P | P | P | PASS | Complete default-deny creation state/event sequence. |
| STR024-AUTH-002 | P | P | P | P | P | P | PASS | Forged/stale/cross-scope/held/Buzz denial before effects with safe audit. |
| STR024-AUTH-003 | P | P | P | P | P | P | PASS | Concurrent/delayed replay maps to one run/effect with visible attempts. |
| STR024-AUTH-004 | P | P | P | P | P | P | PASS | Exact invalidation and digest-neutral exception rule. |
| STR024-AUTH-005 | P | P | P | P | P | P | PASS | Every named governance/external power is server/data-layer human-only. |
| STR024-AUTH-006 | P | P | P | P | P | P | PASS | Principal ID/type and scoped credential defeat confusable/prompt/session claims. |
| STR024-AUTH-007 | P | P | P | P | P | P | PASS | Immutable agent/config/instruction/model/provider/runtime/adapter/tool/input snapshot. |
| STR024-LIFE-001 | P | P | P | P | P | P | PASS | Exact assigned PoP principal wins conditional claim/fence; Codex and losers denied. |
| STR024-LIFE-002 | P | P | P | P | P | P | PASS | Exact warning/lease/stale/fence/reclaim/budget behavior. |
| STR024-LIFE-003 | P | P | P | P | P | P | PASS | Exact cadence/rate/size/order/skew/content rules. |
| STR024-LIFE-004 | P | P | P | P | P | P | PASS | Safe progress fields cannot mutate authority or imply success/judgment. |
| STR024-LIFE-005 | P | P | P | P | P | P | PASS | Exact retry codes/count/delays/jitter and idempotency receipt. |
| STR024-LIFE-006 | P | P | P | P | P | P | PASS | Canonical taxonomy/owners and unknown-code safe stop. |
| STR024-LIFE-007 | P | P | P | P | P | P | PASS | Human/pre-claim stop, boundaries, deadlines, preservation, and race precedence. |
| STR024-LIFE-008 | P | P | P | P | P | P | PASS | Exact health/revocation thresholds and human recovery authorization. |
| STR024-LIFE-009 | P | P | P | P | P | P | PASS | Terminal immutability and separate later human records. |
| STR024-EVID-001 | P | P | P | P | P | P | PASS | Exact revision/digest/snapshot/history/telemetry package; missing/cross-item fails. |
| STR024-EVID-002 | P | P | P | P | P | P | PASS | Independent attestation plus agent events; Git metadata and relabeling rejected. |
| STR024-EVID-003 | P | P | P | P | P | P | PASS | Exact tokens/cost authority/unknown and server-time latency boundaries. |
| STR024-EVID-004 | P | P | P | P | P | P | PASS | Feedback binds human/run/attempt/output/evidence/agent/config/time/category. |
| STR024-EVID-005 | P | P | P | P | P | P | PASS | Distinct principals/context, exact target/rubric, disclosed dependencies, isolated holdout. |
| STR024-EVID-006 | P | P | P | P | P | P | PASS | Immutable correction successors cannot rewrite prior metrics. |
| STR024-EVID-007 | P | P | P | P | P | P | PASS | Exact benchmark/promotion/contamination/canary/rollback contract. |
| STR024-BOOT-001 | P | P | P | P | P | P | PASS | Exact named agent/config/bytes/hash/attestation/event/no-host-patch proof. |
| STR024-BOOT-001A | P | P | P | P | P | P | PASS | Host/adaptor forgery, replay, signer abuse, Git relabel, and post-sign edit rejected. |
| STR024-BOOT-002 | P | P | P | P | P | P | PASS | Codex bytes/edit/attestation cannot become review-ready, useful, quality, or agent work. |
| STR024-BOOT-003 | P | P | P | P | P | P | PASS | Separate human-authorized intervention run; sealed source; named-agent successor only. |
| STR024-BOOT-004 | P | P | P | P | P | P | PASS | Unauthorized intervention denied/audited; platform work remains separately authorized/scoped. |
| STR024-UX-001 | P | P | P | P | P | P | PASS | Field/target audience recheck, revocation, link-preview safety, idempotency, delay/outage. |
| STR024-UX-002 | P | P | P | P | P | P | PASS | Exact panel/states/text/control/principal/server-enforcement oracle. |
| STR024-UX-003 | P | P | P | P | P | P | PASS | Exact axe/focus/name/contrast/motion/live-region/browser/AT/viewport/manual evidence. |
| STR024-UX-004 | P | P | P | P | P | P | PASS | Injection/confusable/secret/mention/link content cannot trigger tools or authority. |
| STR024-MET-001 | P | P | P | P | P | P | PASS | Full versioned event set, IDs, ordering, denominators, missingness, and data minimization. |
| STR024-MET-002 | P | P | P | P | P | P | PASS | Exact per-agent/version metric units and numerator/denominator reconciliation. |
| STR024-MET-003 | P | P | P | P | P | P | PASS | Stops/failures/touches/missingness remain in denominators; no survivor relabeling. |
| STR024-MET-004 | P | P | P | P | P | P | PASS | Exact unique-run cohort, lifecycle/useful output, replay guardrail, thresholds, feasibility claim. |
| STR024-NFR-001 | P | P | P | P | P | P | PASS | Exact full load/p95/error/drop/provider/CI-budget proposal. |
| STR024-NFR-002 | P | P | P | P | P | P | PASS | Exact threat/data/access/retention/deletion/export/audit and dependency exception semantics. |
| STR024-NFR-003 | P | P | P | P | P | P | PASS | Exact integrity/availability/telemetry/RPO/RTO/restore/reconciliation/rollback proposal. |
| STR024-NFR-004 | P | P | P | P | P | P | PASS | Public/synthetic boundary applies to every test/run/evidence/export surface. |
| STR024-NFR-005 | P | P | P | P | P | P | PASS | Versioned conformance, fake export/import, hard-control floor, honest portability label. |

**Current per-ID result: 41 `PASS`, 0 `BLOCK` for Exam design adequacy.** Gate 2
readiness remains blocked by external ratification/provenance/ancestry/review evidence,
not by an unfalsifiable current acceptance ID.

## Specific design stress-test conclusions

- **Named agent versus Codex:** PASS. The host can know the expected bytes but cannot
  mint the agent-bound credential, signer proof, event identity, or valid attestation;
  direct forgery, replay, relabeling, signer abuse and post-sign edits are explicit
  negative controls. Human/supervisor patches remain separately signed and ineligible
  for untouched-agent metrics.
- **Emergency intervention:** PASS. Codex safety stop is enumerated and non-authoring.
  Later diagnosis/repair requires a new exact-source-run, exact-scope, ≤60-minute human
  authorization and cannot edit/finish/attest the failed deliverable or approve a gate.
- **Transitions/races/endpoints:** PASS. The default-deny table plus endpoint capability
  inventory covers create/claim/start/liveness/retry/stop/failure/evidence/human review/
  adapter health/Buzz and all governance powers. Internal identity issuance and
  attestation verification are part of the assigned-worker claim/evidence and scoped
  identity-control capabilities; Builder inventory must map their concrete routes and
  consumers before code.
- **Lease timing:** PASS with the normative ordering read as warning at 60 seconds,
  lease expiry/write fencing and retry eligibility at 120, and explicit stale condition
  at 150 from the last accepted heartbeat. Server sequence, not client time, orders the
  transition.
- **Evaluation and contamination:** PASS. Unique run is the outcome unit; transport
  replays cannot inflate it. Lifecycle accountability is separate from useful output.
  B09–B12 are access-controlled blind holdouts; pre-score access invalidates and rotates
  them, and evaluator identity/config/access/release are logged.
- **Dependency semantics:** PASS as a proposal. Independent audits reproduce zero
  production vulnerabilities and the exact existing 2 high/4 moderate npm dev/build
  nodes (OSV: 2 high/1 medium advisories across two dev packages). The exception is
  documentation-only, unchanged, expires 2026-08-27, has explicit controls, and blocks
  on a changed lock/advisory/exposure/control. RAT-DEPS is still required.
- **SLO/recovery/canary/accessibility/privacy:** PASS as deterministic proposed oracles.
  Actual load, restore, canary, assistive-technology and data-policy evidence properly
  follows implementation; named humans must ratify the proposed values before Gate 2.
- **Portability:** PASS. One real adapter proves conformance only and must say
  `UNPROVEN`; a portability claim requires two materially different adapters. The fake
  adapter tests export/import semantics without overstating provider portability.

## Repository, static, secret, dependency, and application checks

| Check | Result |
|---|---|
| `./scripts/gauntlet.sh` | PASS on the final staged evidence in 10 seconds: readiness 35 pass / 1 expected missing-SAM-key warning / 0 fail; Ruff pass; mypy pass; pytest 3 pass; gitleaks clean; `uv.lock` OSV clean; Semgrep 252 rules / 132 tracked files / 0 finding. An earlier target-only run also passed in 13 seconds. |
| `./scripts/prove-gauntlet-blocks.sh` | PASS; planted secret and planted failing test were blocked. |
| `npm ci && npm run lint && npm test` in `flight-board/` | PASS; build successful, lint clean, render test 1/1 and TypeScript tests 27/27. |
| Production npm audit | PASS; zero vulnerabilities. |
| Full npm audit | QUALIFIED exactly per proposed exception: 2 high and 4 moderate dev/build nodes; zero critical. |
| Explicit Flight Board OSV scan | QUALIFIED exactly per proposed exception: 2 high and 1 medium advisories across `image-size` and `esbuild`, both dev packages; zero critical. |
| Bootstrap hash reproduction | PASS; instruction `4c039263...`, input `5181a165...`, and output `ff89bcb4...` reproduce from the specified LF rules. |
| Diff/scope before evidence | PASS; corrected Architect target changes the Exam/Architect evidence after importing byte-identical prior Test/Critic evidence; frozen Brief is untouched. |

The SAM.gov credential warning is expected for this documentation-only offline review;
no secret was requested, displayed, or added.

## Genuine residuals before Gate 2

Only these readiness items remain; none should be replaced with implementation proof or
agent self-approval:

1. **Human RAT decisions:** Idriss Enayat and any separately required qualified identity/
   security, runtime/Ops, privacy/data, reliability, Test, accessibility/design and
   security co-ratifiers must record authenticated `RATIFIED` or `REVISE` decisions for
   RAT-IDENTITY, RAT-LIFECYCLE, RAT-PRIVACY, RAT-SLO, RAT-EVAL, RAT-CANARY, RAT-A11Y and
   RAT-DEPS against exact Exam revision `10476ba...`. Silence is not ratification.
2. **Gate 1 receipt:** the Gate 1 approver/platform owner must produce the independently
   exportable signed Work Management receipt binding actor, role, decision, time,
   sequence and Brief `5c0db389...`. The public Scout comment and supervisor statement
   do not satisfy CORE-11.
3. **Corrected normative ancestry:** incorporate exact Docs boundary `bcf4856f...`
   through its governed default-closed path and prove it is in the Gate 2 target/base
   ancestry without broadening the Exam's Codex authority.
4. **Frozen evaluation assets:** attach B01–B12 manifest/oracle digests and blind-holdout
   custody/access evidence to the exact Gate 2 receipt. The published case definitions
   are adequate, but missing frozen digests cannot be inferred.
5. **Fresh Critic of the correction:** a new fresh-context Critic must review exact
   `10476ba...`, attack all three prior blocker dispositions, and leave any disposition
   and Gate 2 ruling to the authorized humans.

The future identity/attestation service, immutable actor event store, endpoint inventory,
bootstrap/hostile-host traces, Builder tests, load/restore/canary/accessibility runs and
adapter conformance are required implementation/Gate 3 evidence. Their absence before
Gate 2 is not a residual design decision and must not be misreported as one.

## Final recommendation

**Exam design: PASS. Gate 2 readiness: BLOCK pending the five genuine residuals above.**
All 20 prior Test content blockers and all three prior Critic blockers have adequate
design dispositions, all 41 current acceptance IDs pass the independent design matrix,
the Brief is byte-identical, and the checks are green or exactly match the proposed
time-bounded dependency exception. This evidence is advisory only and does not approve,
freeze, implement, merge, deploy, release, or close STR-024.
