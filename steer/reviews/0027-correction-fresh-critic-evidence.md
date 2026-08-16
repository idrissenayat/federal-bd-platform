# Fresh Critic evidence — STR-027 Gate 2 correction

**Disposition:** `BLOCK`

**Role:** STEER Critic Agent in a fresh isolated worktree and restarted context

**Exact review target:** Architect correction commit
`172aa08d29cc94b6407a3cc465f2583ecf262cbc`

**Frozen Brief authority:**
`steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md` at
`b15efdc2355089c90c943eaa374d0b5e290b5343`

**Correction under challenge:** the Exam and Architect evidence at the exact target,
including the corrections prompted by prior independent Test
`a5efbd607fec9932ba0e147100482a069d13cb11` and prior fresh Critic
`a7f05e8faee7bba5dfb31b68d962faea535496d7`.

**Critic branch:** `critic/str-027-correction-fresh`

**Independence and boundary:** This review used the frozen Brief, exact corrected Exam,
Architect evidence, repository governance, and the earlier Critic record needed to
challenge whether its findings were actually closed. It did not read, search for, or
depend on the concurrently produced correction Test result. It adds only this new Critic
evidence. It does not edit or approve the Brief, Exam, Architect evidence, code,
application, gate state, credentials, receipts, ratifications, manifests, or holdouts; it
opens no ready PR and authorizes no implementation, merge, deployment, release, or gate
ruling.

## Provenance and scope reproduced

- The isolated worktree began at exact Architect target
  `172aa08d29cc94b6407a3cc465f2583ecf262cbc`, whose parent is original Architect target
  `6c962bf0e54c594409a27e91456d090e4d62b8eb`.
- Remote `architect/str-027-gate-2-correction` also resolved to `172aa08d29cc94b6407a3cc465f2583ecf262cbc`
  during review.
- The correction changes only the Exam and Architect correction evidence. The frozen
  Brief remains byte-identical at Git blob `8c62fef9ecb6cab7d31399ee5d3465b11cc4a66e`,
  SHA-256 `24d43671eab43d9a50b1d8a638b2209e0313cdaa0f8d605f888d58492be4bcce`.
- The corrected Exam retains 59 unique acceptance IDs, each occurring once, and labels
  Gate 2 and Gate 3 pending. It does not claim implementation or runtime evidence.

## Ranked findings

### BLOCKER 1 — The correction creates two conflicting effect-authority contracts under one “frozen” Brief lineage

**Attack/evidence.** The unchanged approved Brief says a required countersignature is
bound to the **effective** receipt digest (Brief lines 93–102), defines the one atomic
transaction as `PENDING_PROOF` directly to `EFFECTIVE` (lines 126–137), and diagrams the
`EFFECTIVE` transition before an “optional required human countersignature/audit note”
(lines 303–322). The corrected Exam instead says every required countersigner binds a
**pending** receipt before effect (Exam lines 85–89) and makes the only path
`PENDING_PROOF -> PENDING_COUNTERSIGNATURE -> EFFECTIVE` (lines 141–159).

The Architect calls the latter an authenticated human policy input, but also claims the
Brief is frozen and byte-identical. Dispatch provenance can choose the desired correction;
it does not make contradictory normative bytes disappear. Repository `AGENTS.md` says
that when a conflict exists the signed Brief and Exam govern the feature, without giving
an implementation a safe precedence rule. An implementer can therefore conform to the
Brief's direct transition or the Exam's pre-effect countersignature while violating the
other. Artifact/body verification cannot prove which substantive contract a Gate 1
approval covered.

**Smallest safe correction.** The authorized human must govern a new Brief descendant
that explicitly adopts the pre-effect, effect-authorizing countersignature model and
removes the direct-transition diagram/text (or explicitly rules countersignature
post-effect and audit-only). Bind authenticated Gate 1 evidence to that exact substantive
Brief revision, then issue an Exam against that lineage and rerun independent review. Do
not treat a Buzz correction instruction as an invisible amendment to signed artifact
semantics.

### BLOCKER 2 — “Human countersignature” still has no verifiable protocol, so the main correction is non-falsifiable

**Attack/evidence.** The Exam fully specifies only the issuer envelope:
`steer.gate-receipt.signature.v1`, its protected header, payload digest, signed-byte
grammar, trust policy, and verification event (Exam lines 96–137). It newly requires
“every independently authenticated required countersignature” to bind a pending receipt
and says an atomic transaction appends a “final accepted proof set” (lines 154–165), but
never defines a countersignature object/schema or its signed bytes. There is no fixed
answer for what a human countersigner signs: payload digest, issuer-envelope digest,
pending-receipt digest, current required-set/policy digest, predecessor, role, decision,
tenant, session, or sequence. Nor is there a countersigner key/trust/revocation profile,
proof/event identifier, idempotency key, canonical required-set ordering, duplicate proof
identity, or export verification grammar.

Consequently two implementations can both claim `STR027-AUTH-005`/`EFF-003`/`EFF-004`
while one signs only a reusable receipt digest and another binds current policy and role.
The former can be replayed after required-set or role drift, and an offline verifier
cannot reconstruct whether the exact current set was independently satisfied. “Current
policy is rechecked” inside the effect transaction does not prove that each earlier human
action knowingly bound that policy/set. `RAT-ROLES` may select who is required; it cannot
supply the missing cryptographic/event grammar while the Exam claims that Gate 2 freezes
that grammar.

**Smallest safe correction.** Before Gate 2, define and freeze a domain-separated
`CountersignatureIntent/Proof` schema and canonical bytes that bind at minimum the exact
pending issuer receipt/envelope, decision and target, tenant/scope, required-set and
policy revision/digest, countersigner human identity/current role, sequence/predecessor,
session/time and idempotency identity. Define key/trust/revocation rules, append-only
accept/reject events, set ordering, duplicate/conflict semantics, crash/retry behavior,
CAS input and offline-export vectors. Add mutations and races for policy/set/role changes
between each proof and the effect commit.

### BLOCKER 3 — Required Gate 1 authority evidence is still absent, and the target itself says default-close

**Attack/evidence.** The frozen Brief still ends `GATE 1: PENDING` and `GATE 1 EVIDENCE:
PENDING` (Brief lines 425–428). The Architect evidence confirms that both the authenticated
Work Management receipt and governed in-file audit-note descendant are absent (Architect
evidence lines 22–26). The corrected Exam requires both before a human may decide Gate 2
(Exam lines 395–405). The Brief additionally lists writing or freezing an STR-027 Exam
before authenticated Gate 1 as out of scope (Brief lines 330–338).

This correction properly admits rather than fabricates the gap, but admission is not
closure. No reviewer can establish that the current substantive Brief—much less the
contradictory countersignature change in Blocker 1—has authenticated human Gate 1
approval.

**Smallest safe correction.** The authorized human preserves the real Work Management
receipt and policy-compliant in-file audit note against the final governed Brief revision.
Verify identity, role, decision, time, sequence and exact revision under repository policy;
then regenerate/review Gate 2 materials. No agent should infer or backdate this evidence.

### BLOCKER 4 — The blind-leakage oracle can pass a leaking design by choosing a weak classifier

**Attack/evidence.** `STR027-BLIND-005` requires at least 1,000 balanced samples per secret
class and says **a** held-out classifier's 95% Wilson upper bound must be no greater than
random-guess accuracy + 0.02 (Exam lines 237–247). It does not freeze classifier family,
features available to the attacker, training/holdout split, hyperparameter search, random
seeds, repeated trials, label-permutation calibration, multiple-comparison handling, or
minimum attack competence. A deliberately underfit or label-flipped classifier can
satisfy the bound even when another simple classifier extracts the secret. Wilson
coverage quantifies uncertainty in the chosen classifier's observed accuracy; it does not
establish that no feasible distinguisher exists. For a balanced binary 2,000-sample
holdout, even exactly 50% observed accuracy has an upper bound around 52.2%, illustrating
that the proposed 2-point budget is also not calibrated to its own minimum sample size.

Because `RAT-EVAL` is allowed to freeze the test later, an evaluator can select a weak
attack after seeing the channel and create a nominal pass. This is a gameable security
acceptance oracle, not merely missing runtime evidence.

**Smallest safe correction.** Freeze before Gate 2 the threat principal's complete
observable feature set and a versioned, independently reviewable attack suite (including
simple per-channel tests and competent tuned multivariate classifiers), train/validation/
holdout protocol, seeds, minimum effective holdout size derived from a power calculation,
permutation baseline, multiplicity rule, and fail-if-any-attack criterion. Keep raw
holdouts with the custodian and require independent regeneration. Calibrate the leakage
margin and confidence procedure together rather than fixing 1,000 samples and `+0.02`
independently.

### SHOULD-FIX 1 — The outcome denominator alternates between unknowable future units and “packages” that exclude failures

`STR027-MET-001` says an immutable eligible-unit manifest is frozen before Gate 2, but the
cohort opens only at the first future eligible request and includes failures, abandoned
drafts and missing packages (Exam lines 332–339). A pre-Gate manifest cannot enumerate
unknown future requests unless the experiment limits eligibility to a hand-picked list.
`STR027-MET-003` then measures 90% of “eligible packages,” not eligible units (lines
347–353), allowing generation failures and missing packages to disappear because no
package exists. This defeats the correction's stated intent.

**Correction.** Freeze an eligibility predicate and append-only enrollment protocol before
Gate 2, not future unit identities. At cohort open, enroll every qualifying request in
sequence with no discretion; retain one `eligible_unit` denominator through every metric,
including units with no generated package. Freeze tie/boundary timezone and tenth-unit
concurrency rules and publish a reconciliation oracle from source events to enrollment.

### SHOULD-FIX 2 — Role stacking can collapse “independent” human authority

The Exam requires distinct principal capabilities and distinct authenticated actions, but
`RAT-ROLES` is free to permit role stacking (Exam lines 49–61, 85–89, 201–204). It does
not state minimum distinct-human cardinality or forbidden combinations among decider,
required countersigners, specialist ratifiers, fixture owner/custodian and evaluator.
Multiple clicks/sessions or keys by one person are not independent human review. The text
warns against appointing Idriss as every specialist but supplies no falsifiable rule that
prevents it.

**Correction.** Freeze per risk class the minimum number of distinct human identities,
forbidden role combinations and conflict-of-interest/qualification evidence. Require the
proof set to bind those person-level constraints and reject two roles backed by the same
human/account root even if different capabilities or keys are used.

### SHOULD-FIX 3 — Canonical length boundary vectors are underspecified at an impossible physical edge

The fixed grammar is a material improvement, but `STR027-SIGN-003` asks fixtures to cover
“zero/max-bound lengths” for U64 octet counts (Exam lines 106–115). A valid payload with
`2^64-1` actual octets cannot be materialized by a practical conformance fixture, while a
short buffer carrying that declared length is an invalid truncation vector. The phrase
does not distinguish representational boundary parsing from a realizable configured
payload maximum.

**Correction.** Freeze a practical schema/envelope maximum and exact vectors at
`max-1/max/max+1`; separately specify synthetic parser tests for U64 encodings near
`2^64-1`, overflow before allocation, declared-versus-actual mismatch and truncation.
Never require allocating the representational maximum.

## PASS at specification level

Subject to the blockers, the correction materially closes several earlier defects:

- **Gate 2 versus Gate 3 separation:** `PASS`. Gate 2 now freezes human-ratified,
  implementation-independent specifications/vectors/oracles; Builder implementation and
  execution against the exact build are Gate 3 evidence. `REVISE` correctly blocks and
  requires a governed new Exam revision.
- **Issuer signed-byte grammar:** `PASS` apart from the boundary clarification above. The
  domain separator, NUL, U64BE octet lengths, RFC 8785 JCS UTF-8 bytes, media type and
  invalid encoding classes are explicit and invariant under `RAT-SIGN`.
- **Fixed cohort close and useful human judgment:** `PASS` for the 30-day terminal close,
  qualified-human blinded rubric, evidence-correctness requirement, explicit missingness
  and rejection of nonblank text as value; denominator identity still needs Should-fix 1.
- **Effect remains default-closed in the corrected Exam:** `PASS` as an intended state
  invariant. Missing/rejected/revoked/stale countersignatures remain ineffective, the
  final transition is CAS-guarded, mirrors are non-authoritative and crash/retry campaigns
  are required. Blockers 1–2 prevent this from yet being a single implementable contract.
- **Authority and manipulation defenses:** `PASS` at specification level for agent/service
  denial, deliberate individual submission, no bulk/default approval, issuer signing-
  oracle resistance, current-role/revision checks, append-only supersession, prompt/
  evidence injection, secret sinks, low-entropy commitment rejection, contaminated-run
  retention, endpoint threats, scoped disable/recovery and Codex non-authority.

## Final disposition and smallest safe next action

**Fresh Critic recommendation: `BLOCK` Gate 2 readiness for exact correction commit
`172aa08d29cc94b6407a3cc465f2583ecf262cbc`.** The correction improves the Exam but does
not yet produce one governed, falsifiable authority contract: the frozen Brief conflicts
with the corrected effect path; countersignature proofs lack a protocol; required Gate 1
evidence is absent; and the leakage test remains selectable/gameable.

The smallest safe next action is human governance, not implementation: choose and record
the pre-effect countersignature model in a new exact Brief revision; preserve its
authenticated Gate 1 receipt/audit note; direct the Architect to freeze the countersignature
proof protocol and competent leakage oracle plus denominator/identity clarifications; then
obtain exact-revision human RAT values and rerun independent Test and fresh Critic. This
review is evidence and recommendation only, not a gate ruling.
