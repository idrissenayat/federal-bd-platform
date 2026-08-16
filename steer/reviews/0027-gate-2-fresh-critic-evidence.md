# Fresh Critic evidence — STR-027 Gate 2 Exam

**Disposition:** `BLOCK`

**Role:** STEER Critic Agent in a fresh isolated worktree and context

**Exact review target:** Architect commit
`6c962bf0e54c594409a27e91456d090e4d62b8eb`

**Frozen Brief authority:**
`steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md` at
`b15efdc2355089c90c943eaa374d0b5e290b5343`

**Critic branch:** `critic/str-027-gate-2-fresh`

**Independence and boundary:** This review used the Brief, Exam, Architect evidence,
repository governance, and pre-Architect Brief-stage Critic record. It did not read or
depend on the concurrent Test Agent result. It adds only this Critic evidence and does
not edit or approve the Brief, Exam, Architect evidence, implementation, application,
gate state, credentials, receipts, ratifications, manifests, or holdouts. It authorizes
no PR, implementation, merge, deployment, release, or Gate 2 ruling.

## Provenance reproduced

- `git rev-parse HEAD` initially returned the exact Architect target
  `6c962bf0e54c594409a27e91456d090e4d62b8eb`.
- `git merge-base --is-ancestor b15efdc2355089c90c943eaa374d0b5e290b5343
  6c962bf0e54c594409a27e91456d090e4d62b8eb` passed.
- The Brief at its supplied authority revision and Architect target is byte-identical:
  Git blob `8c62fef9ecb6cab7d31399ee5d3465b11cc4a66e`, SHA-256
  `24d43671eab43d9a50b1d8a638b2209e0313cdaa0f8d605f888d58492be4bcce`.
- The Architect target adds only the Exam and Architect evidence to its parent. The Exam
  contains 59 distinct acceptance IDs, each occurring once.
- The Architect artifacts accurately label Gate 2 pending and do not claim generated
  implementation, signature, RAT, custody, specialist, or performance evidence.

## Findings

### BLOCKER 1 — A required countersignature can arrive after the ruling is already effective

**Attack/evidence.** The Brief defines one transaction that moves an intent directly from
`PENDING_PROOF` to `EFFECTIVE` and updates the authoritative Gate/RAT projection
(Brief lines 126–137), then depicts an “optional required human countersignature/audit
note” only after that effective transition (lines 303–322). The Exam preserves this:
`STR027-AUTH-005` binds a countersigner to the **effective** receipt digest, while
`STR027-EFF-001` permits only `PENDING_PROOF -> EFFECTIVE` and `STR027-EFF-003` makes
that transition atomic without a countersignature. `RAT-ROLES` defers whether and when a
countersignature is required, but no state or invariant prevents an affected ruling from
becoming authoritative before that required human acts.

This is not merely a missing test value. Under a policy requiring two humans, one human
plus the issuer can create an externally effective ruling; a later missing, denied,
revoked, crashed, or stale countersignature does not have a specified way to prevent the
already-effective authority. Calling the countersignature “required” therefore does not
enforce co-authority.

**Smallest safe correction.** Before Gate 2, choose one explicit contract and test every
race/crash path: either (a) countersignature is audit-only and never called required for
effect, or (b) introduce a non-effective `PENDING_COUNTERSIGNATURE` state and atomically
transition to `EFFECTIVE` only after the independently authenticated countersignature,
current-policy recheck, exact receipt binding, sequence/CAS checks, and any in-file
prerequisite succeed. Missing/rejected/revoked countersignature must remain ineffective;
no UI, export, mirror, or dependent action may say otherwise.

### BLOCKER 2 — The Exam makes pre-build Gate 2 depend on post-build execution, creating circular authorization

**Attack/evidence.** Repository policy says the Exam is committed before the first build
branch opens (`AGENTS.md` lines 5–7; `SOLO-MODE.md` lines 17–21), and `GATES.md` defines
Gate 2 as approval that the tests/evals/guardrails express correct, while Gate 3 binds the
verified build. Yet the Exam says a result passes only against “the same implementation
revision” (lines 20–25), assigns deterministic fixture publication to the Builder (lines
27–31), requires every acceptance ID to map to executable positive/negative evidence
“against this exact Exam revision” before a human may decide Gate 2 (lines 360–371), and
contains runtime, load, browser/AT, backup, signer, key-service, persistence, concurrency,
and fault-injection outcomes throughout. Its Architect evidence likewise calls missing
implementation behavior a current Gate 2 blocker (lines 129–140).

No authorized implementation can exist before Gate 2, but Gate 2 cannot occur until that
implementation has produced the required evidence. A workaround would either build
without Gate 2 or approve Gate 2 without its declared prerequisites. It also collapses
Gate 2 into Gate 3 and makes later Builders a practical author of the frozen test oracle.

The eight RAT rows add a second cycle: they must be recorded against “this exact Exam
revision” before Gate 2, while their choices supply algorithms, profiles, matrices,
limits, owners, and thresholds needed to make many tests executable. A `REVISE`
disposition is listed alongside `RATIFIED` as satisfying the recorded-input condition
(lines 33–38), although a request to revise cannot safely freeze the unchanged Exam.

**Smallest safe correction.** Split evidence by gate without weakening any eventual
acceptance criterion. Before Gate 2 require: authenticated Gate 1 evidence; named human
RAT dispositions; exact selected protocol/policy values; frozen schemas, reference
vectors, state/endpoint/capability matrices, fault model, metric definitions, and test
harness/oracle specifications that an independent reader can inspect without product
code. `REVISE` must keep Gate 2 blocked and produce a governed Exam revision; ratifiers
then bind the final exact revision. After Gate 2, require the Builder to implement against
those frozen oracles and independent Test to execute all 59 IDs against the exact build
for Gate 3. Do not let implementation-derived snapshots define expected values.

### BLOCKER 3 — The exact target lacks the Gate 1 evidence that this Exam itself requires

**Attack/evidence.** At the supplied Brief commit and Architect target, the frozen file
still ends `GATE 1: PENDING` / `GATE 1 EVIDENCE: PENDING` (Brief lines 425–428). The
Architect evidence reports an authenticated Buzz handoff saying Work Management approved
Gate 1, but explicitly says it does not manufacture the platform receipt (Architect
evidence lines 13–24). `GATES.md` lines 21–30 require both the in-file timestamped human
audit note and authenticated identity/version/sequence evidence. The Exam itself requires
an authenticated Gate 1 receipt plus a policy-compliant in-file Brief audit-note
descendant before a human may decide Gate 2 (Exam lines 360–363). Neither artifact is in
the exact review target.

A Buzz assertion is useful dispatch provenance but, under the Exam's own authority model,
is not the independently verifiable Work Management receipt. Treating it as sufficient
would create the circular authority path the design says to reject.

**Smallest safe correction.** The authorized human—not an agent—must export/preserve the
authenticated Gate 1 receipt bound to the exact substantive Brief revision, then create
the policy-compliant in-file audit-note descendant with actor, role, timestamp, sequence,
and authenticated evidence linkage. Verify both against `GATES.md` without changing the
approved substantive body. Rebase/reissue Gate 2 materials on that governed descendant
and rerun independent review. Do not fabricate or retroactively infer the evidence.

### SHOULD-FIX 1 — Canonical signed-byte notation is inconsistent before `RAT-SIGN`

The Brief calls the bytes length-delimited but prints
`domain || header || payload` with no length terms (lines 103–117). The Exam prints
`domain || length(header) || header || length(payload) || payload` and leaves integer/
length encoding to unresolved `RAT-SIGN` (Exam lines 97–102). Implementers could
reasonably freeze different vectors while each claims Brief conformance.

**Correction:** make the final human-ratified Exam state one exact byte grammar: domain
bytes, length width/endianness/constraints, canonical JSON profile, Unicode/number rules,
media type, and complete valid/invalid vectors. Record that this resolves, rather than
silently changes, the Brief's underspecified notation.

### SHOULD-FIX 2 — Blind side-channel and delivery oracles need measurable feasibility

`STR027-BLIND-005` says workload input and output reveal no semantic secret to the
workload and requires timing, size, count, error, retry, URL, and log channels to remain
within a “ratified non-semantic allowlist,” but neither the allowed observations nor
quantitative leakage/equivalence oracle exists until `RAT-EVAL`. Some task semantics must
necessarily reach the evaluated workload; an absolute “no semantic secret” reading is
impossible, while an undefined allowlist can pass any implementation.

**Correction:** in the final `RAT-EVAL`, separate task input from oracle/assertion secret,
freeze fixed sizes/padding, schedules/retry/error equivalence classes, observable metadata,
threat principal, leakage budget and statistical test with sample size/threshold. Require
a clean evaluator to show that candidate-visible observations cannot distinguish planted
secret classes beyond the ratified bound.

### SHOULD-FIX 3 — The human-ready outcome can be gamed and its cohort close is ambiguous

`STR027-MET-001` includes missing and failed packages in the denominator, but
`STR027-MET-003` calls a package successful when merely “nonblank human-ready”; it does
not require a qualified human to judge it review-ready, evidence-correct, or materially
usable. The Brief's window says day 30 extends until ten packages, which makes the close
unbounded when ten never arrive. The threshold itself remains subject to later human
ratification. Verbose AI text can therefore satisfy the apparent 90% signal without
reducing clerical work or supporting sound judgment.

**Correction:** before Gate 2 freeze the eligible unit, supported types, fixed terminal
close rule, deduplication, missingness, and exact human-ready rubric; require blinded or
independent qualified-human usability/correctness judgment and separately report draft
completion, submission, verified effect, active human time, edit distance, abandonment,
and error. Never infer value from generated nonblank text.

## Passed challenge surfaces at specification level

Subject to the blockers above, the Exam has strong explicit negative coverage for agent/
service/display-name authority, signing-oracle requests, payload/envelope substitution,
role/revision drift, replay/forks, partial commits, AI default/bulk submission, unsafe
low-entropy commitments, unauthorized holdout access, cross-tenant export, secret sinks,
recovery projection drift, inaccessible status, and Codex role confusion. Its explicit
missing-evidence-is-`BLOCK` convention, immutable supersession, 256-bit fresh openings,
fixed-size randomized-ciphertext option, contaminated-run retention, endpoint threat
matrix, scoped disable controls, and no-causality metric language are materially safer
than permissive defaults. These are specification strengths, not implementation passes.

## Final disposition and next human action

**Fresh Critic recommendation: `BLOCK` Gate 2 readiness for exact Architect commit
`6c962bf0e54c594409a27e91456d090e4d62b8eb`.** The three blockers are independent:
required co-ratification does not gate effect, pre-build Gate 2 requires post-build proof,
and required Gate 1 receipt/audit-note evidence is absent from the target. No agent may
resolve these through interpretation.

The next human action is to preserve authenticated Gate 1 evidence, decide the
countersignature authority model, and direct an Architect revision that separates Gate 2
oracle freeze from Gate 3 build execution and incorporates final human RAT values. Then
rerun independent Test and a new fresh Critic against the exact corrected revision. This
recommendation is not a human gate ruling.
