# Fresh Critic recheck evidence — STR-024 corrected Gate 2 Exam

**Recommendation:** `BLOCK` for Gate 2 readiness

**Role:** named STEER Critic Agent in a new dedicated worktree; Codex is the runtime
host, not independent authorship proof

**Review target:** corrected Architect commit
`10476ba38a3f13b8e2623eda8f81779ca1ba0936`

**Corrected supervisor-boundary target:**
`bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`

**Prior challenge evidence:** Critic
`203c685ee558a4a57bba3d55d6845263c0b44188`; Test
`6026dcc401d97e2fa5e39f0d803683db305bfed3`

**Frozen Brief:** `steer/briefs/0024-governed-agent-execution.md` at
`5c0db389d1b0e9fa492a33930febcf4d1c067cb0`

**Critic branch:** `codex/str024-fresh-critic-recheck-20260815210417`

**Authority boundary:** evidence only. This review does not edit or approve the Brief,
Exam, operating-model documents, implementation, app data, or gate state and does not
authorize a build, PR, deployment, merge, release, or Gate 2 ruling.

## Integrity and source verification

- The Brief is byte-identical at the frozen and corrected Architect revisions: Git blob
  `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`, SHA-256
  `6a5dcf65e1ef6930c7964374d1aaf0220a0810c8d99022c2936c2cb1607c065c`.
- The corrected target changes only the STR-024 Exam and Architect evidence. Its
  imported Test and prior Critic files have the exact blobs from `6026dcc...`
  (`abae7f4e...`) and `203c685...` (`ebc4d18c...`) even though the exact review commits
  themselves are parallel rather than ancestors.
- Corrected Docs commit `bcf4856...` exists on the remote and materially narrows the
  rejected `909f438...` rule. It is not an ancestor of `10476ba...`; the target tree
  still contains the old operating model without the normative Codex boundary.
- The corrected Exam has blob `8c8abaeaa6e2a88f796aac7d9dd9de3a6e242437`
  and SHA-256 `588e52de087c7cda8c2258b08d38d5b2acd1e73cd40ab6c8e412b551d8319be1`.
  It contains 41 unique acceptance IDs and ten explicit `RAT-*` rows. The three frozen
  bootstrap hashes reproduce exactly.
- Public issue #52 still exposes only the Scout dispatch stating Gate 1 is pending and
  forbidding Exam work before Gate 1. The corrected Architect commit is unsigned and
  has no Git note or immutable named-agent run/attestation record. The Exam correctly
  refuses to backfill platform-agent performance from that metadata.

## Prior-blocker disposition

| Prior Critic blocker | Corrected-design verdict | Reason |
|---|---|---|
| 1. Named-agent authorship was circular | **BLOCK — narrowed but not resolved** | DSSE/in-toto, separate principals, non-exportable service keys, hostile-host tests and Git-as-context-only are the right shape, but the undefined "bound workload proof" does not prove that agent execution generated the bytes. |
| 2. Authority chain was inconsistent and Codex power was broad | **PASS for corrected wording; BLOCK for effectiveness** | `bcf4856...` and the Exam now seal the failed deliverable, require a separate platform item, restrict emergency intervention and prevent gate/agent attribution. The exact rule remains outside target ancestry, and Gate 1 evidence remains unreconciled. |
| 3. Criteria were placeholders/gameable | **PASS in most domains; BLOCK in three exact oracles** | Replay inflation, useful-output conflation, feedback contamination, Buzz audience, portability, privacy, SLO, recovery, dependency, accessibility and canary gaps are materially corrected. Identity, lease timing and evaluation eligibility/holdout transport remain ambiguous. |

## RAT assessment

| RAT field | Design verdict before human ratification |
|---|---|
| `RAT-IDENTITY` | **BLOCK** — signer endorsement is specified; trusted workload-to-output causation is not. |
| `RAT-LIFECYCLE` | **BLOCK** — 120-second lease expiry conflicts with the 150-second stale/recovery transition. |
| `RAT-PRIVACY` | **PASS** — explicit fields, access, retention, deletion, backup, export and review cadence; human ratification remains mandatory. |
| `RAT-SLO` | **PASS** — exact load/p95, telemetry, RPO/RTO, restore and reconciliation oracles; human ratification remains mandatory. |
| `RAT-EVAL` | **BLOCK** — `eligible` is undefined and runtime/holdout access rules are internally unexecutable. |
| `RAT-CANARY` | **PASS** — bounded five-run/seven-day scope, hard stops, pause triggers, disable contract and recovery checks; human ratification remains mandatory. |
| `RAT-A11Y` | **PASS** — exact surface, states, controls, AT/browser/viewports and evidence behavior; human ratification remains mandatory. |
| `RAT-DEPS` | **PASS** — documentation-only exception is exact, time-bounded, control-bound and expressly unavailable to future implementation; human ratification remains mandatory. |
| `RAT-SUPERVISOR` | **PASS pinned content / BLOCK incorporation** — exact corrected commit is named but not in governed ancestry. |
| `RAT-GATE1-RECEIPT` | **BLOCK platform/governance evidence** — no receipt exists and current repository policy also requires an in-file approval line. |

## Findings

### BLOCKER 1 — The attestation proves an agent-scoped signer endorsed bytes, not that the named agent produced them

**Evidence:** The independent service validates authorization and claim, then signs an
artifact statement. `STR024-BOOT-001A` rejects supervisor/adapter credentials, a replay,
post-signing edits, and invoking the signer without a "bound workload proof." The Exam
never defines that proof's issuer, claims, protected execution boundary, measurement,
input/output channel, or resistance to a host using the legitimate agent workload as a
signing oracle. Codex knows the fixture's exact expected bytes and hosts the workload;
it can ask or cause the legitimate agent principal to submit those bytes unless the
signer cryptographically binds output to an isolated execution trace the host cannot
forge or steer. A non-exportable attestation-service key prevents key theft, not a
valid-but-fraudulent signing request.

The blind-holdout rule has the same missing isolation boundary: it says any supervisor
or runtime access before scoring contaminates the result, while the Codex-hosted runtime
must ordinarily transport the input for execution. Without end-to-end evaluator-to-
workload encryption or an equivalent semantic-access rule, every real run is either
contaminated or dependent on an undefined exception.

**Required correction:** Define the agent workload root of trust and "authorship" claim.
Either require an independently measured isolated workload with a sealed agent key,
attested code/config, evaluator-encrypted input, model/provider response or execution-
trace digest, and output-only signing path; or narrow the claim honestly to "the
agent-scoped service principal submitted these bytes," which is not proof the named
model agent did the work. Add the attack where Codex supplies known bytes through the
legitimate agent/signing path. Define controlled ciphertext transport as non-access and
any semantic host disclosure as contamination.

### BLOCKER 2 — The corrected authority rule is safe in content but is not effective, and the detached Gate 1 receipt does not reconcile repository policy

**Evidence:** The corrected `bcf4856...` language is equal to or narrower than the Exam
and resolves the prior authority-bypass wording. But it remains a parallel commit; the
target's `docs/steer/OPERATING-MODEL.md` has no normative supervision section. Pinning a
hash is not incorporation.

For Gate 1, `RAT-GATE1-RECEIPT` correctly demands independent signed Work Management
evidence, but `GATES.md` says the timestamped sign format is inside the Brief and
`SOLO-MODE.md` defines signed as the Brief file containing `GATE 1: APPROVED`. The frozen
Brief still contains `GATE 1: PENDING`. A detached receipt can satisfy the second,
authenticated-evidence half of the rule but cannot silently waive the in-file audit-note
half. The Critic must not edit the frozen Brief or infer a policy exception.

**Required external evidence/ruling:** Incorporate exact `bcf4856...` through the
default-closed governed path and prove no broader descendant rule. Export and preserve
the signed Gate 1 receipt. Separately, obtain an authenticated governance ruling that
either recognizes a detached immutable approval manifest as the in-repository audit note
for a frozen Brief or follows the current signed-Brief procedure through an authorized
revision. The ruling must preserve the exact approved content hash and sequence; the
Exam/Architect/Codex assertion cannot serve as its own proof.

### BLOCKER 3 — Three remaining RAT oracles permit contradictory or selected outcomes

**Evidence:**

1. `RAT-LIFECYCLE` says the lease duration is 120 seconds, while warning/stale policy
   declares stale only at 150 seconds. The transition table moves lease expiry to
   `RETRY_WAIT`; `STR024-LIFE-002` instead moves it there at the 150-second stale point.
   It is therefore unclear whether old-fence writes stop and recovery begins at 120 or
   150 seconds.
2. `STR024-MET-002` defines first-pass as untouched first-pass runs divided by
   "eligible" runs, but never freezes eligibility. Selective eligibility can still
   remove hard, failed, stopped, contaminated, or intervention runs even though other
   clauses aim to retain them. Quality/benchmark denominator semantics are similarly
   not tied to a frozen eligible-run predicate.
3. `RAT-EVAL` gives dimension weights and thresholds but no point-level rubric/oracle;
   B01–B12 manifest/oracle digests are absent and correctly required later. Until the
   exact manifests define deterministic scoring and the holdout transport contradiction
   in Blocker 1 is fixed, the 90/80 thresholds can be applied inconsistently.

**Required correction/evidence:** Choose one authoritative fence-expiry time and name
any separate UI grace/stale time without extending write authority. Define eligible as
all unique runs authorized into the frozen cohort, with only predeclared, reason-coded
exclusions that remain reported and cannot improve first-pass/useful-output numerators;
define benchmark case/run denominators explicitly. Bind the point-level rubric and
B01–B12 manifest/oracle digests to the exact Exam/Gate 2 evidence after the corrected
holdout delivery rule exists. These are Gate 2 oracle decisions, not implementation
details.

## Properly deferred implementation and operating evidence

The following do **not** require implementation before Gate 2 once the three blockers
above are corrected and the proposals are ratified:

- building the identity/attestation service, signed event store, adapter, outbox, UI,
  telemetry, backup/restore and disable command;
- proving load, race, hostile-host, accessibility, restore and canary behavior against a
  future exact implementation commit;
- producing a real named-agent attestation for the already completed Architect attempt;
  that history cannot be backfilled and is correctly excluded from agent-performance
  claims; and
- proving cross-provider portability. One real adapter is correctly labeled contract
  conformance with portability `UNPROVEN`; a portability claim waits for two materially
  different passing adapters.

## Smallest genuine remaining decision/evidence set

1. **One corrected Exam revision:** close Blockers 1 and 3 by defining the trusted
   workload/output proof, holdout transport, one fence-expiry time, cohort eligibility
   and exact scoring manifests/oracles.
2. **One governed authority package:** incorporate exact `bcf4856...`; export the signed
   Gate 1 receipt; and reconcile detached approval evidence with the current in-file
   signature rule through authenticated governance—not a Critic or Architect assertion.
3. **One exact-revision human ratification package:** record `RATIFIED`/`REVISE` for
   `RAT-IDENTITY`, `RAT-LIFECYCLE`, `RAT-PRIVACY`, `RAT-SLO`, `RAT-EVAL`, `RAT-CANARY`,
   `RAT-A11Y`, and `RAT-DEPS`, including named qualified co-ratifiers where the owner
   lacks that capacity and the final B01–B12 manifest/oracle digests. Then rerun Test and
   fresh Critic against that exact revision before a human Gate 2 decision.

## Validation record

- `uv run pytest -q tests/test_repository_contract.py` — PASS, 3 tests.
- `./scripts/gauntlet.sh` — PASS: 35 readiness checks, one expected missing-SAM-key
  warning, zero failures; Ruff, mypy, pytest, gitleaks, OSV and Semgrep passed.
- Bootstrap instruction/input/output SHA-256 reproduction — PASS for all three hashes.
- Review-input blob comparison — PASS: exact prior Test and Critic file blobs match the
  copies in the corrected target; exact commits remain parallel and are not
  misrepresented as ancestors.
- `git diff --check`, frozen-Brief comparison and scope check — PASS. Only this fresh
  Critic recheck evidence file is added; no protected artifact or state is changed.

## Final recommendation

**Gate 2 readiness: `BLOCK`.** The corrected Exam is substantially stronger and most
prior defects are resolved, but named-agent causation remains unproven, the operative
authority chain remains outside governed ancestry and policy, and three exact RAT
oracles remain contradictory or selectable. This is an advisory Critic recommendation,
not Gate 2 approval or a human ruling.
