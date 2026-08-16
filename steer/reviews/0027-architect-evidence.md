# Architect rework evidence — STR-027 Gate 2 Exam correction

**Role:** STEER Architect Agent
**Work item:** STR-027 / issue #55
**Branch:** `architect/str-027-gate-2-correction`
**Correction base:** `6c962bf0e54c594409a27e91456d090e4d62b8eb`
**Frozen Brief authority:** `b15efdc2355089c90c943eaa374d0b5e290b5343`
**Independent Test input:** `a5efbd607fec9932ba0e147100482a069d13cb11`
**Fresh Critic input:** `a7f05e8faee7bba5dfb31b68d962faea535496d7`
**Authority boundary:** corrected Exam and this Architect rework evidence only; no Brief
edit, implementation, credential/key, signature, receipt, ratification, holdout access,
gate decision, ready PR, merge, deployment, or release.

## Authorization and unresolved authority evidence

Idriss Enayat's authenticated 2026-08-16 Buzz correction directs the Architect to apply
this policy: when countersignature is required, the ruling remains
`PENDING_COUNTERSIGNATURE` and has no effect until every required independently
authenticated human has signed. This is the policy input for the corrected Exam, not a
Gate 1 or Gate 2 ruling.

The exact frozen Brief still contains `GATE 1: PENDING` and `GATE 1 EVIDENCE: PENDING`.
The authenticated Work Management Gate 1 receipt and policy-compliant in-file audit-note
descendant required by repository policy and the Exam are absent from this target. The
Buzz direction is dispatch/correction provenance only and is not substituted for either
artifact. Gate 2 therefore remains default-closed.

## Independent findings reconciled

The independent Test found the original 59 IDs structurally falsifiable but recommended
`BLOCK` pending authenticated Gate 1 evidence, human RAT dispositions, frozen protocol
and custody vectors, and fresh Critic review. The fresh Critic independently identified
three blockers and three should-fix findings. This correction preserves the Test's useful
acceptance inventory while adopting the Critic's safe corrections:

1. **Effect-authorizing countersignature.** The state machine now includes durable,
   ineffective `PENDING_COUNTERSIGNATURE`. Every required independently authenticated
   countersignature binds the pending receipt. Current policy, role, revision, sequence,
   proof set and CAS are rechecked in the one atomic/idempotent transition to `EFFECTIVE`.
   Missing, rejected, revoked, stale, duplicate or crashing signatures have no effect.
2. **Gate separation.** Gate 2 freezes human-ratified design/policy, schemas, exact
   canonical/signature/event/CAS specifications, implementation-independent vectors,
   custody and field inventories, threat/fault models, metric definitions, campaigns,
   harness specifications and fixed acceptance oracles. Builder implementation and
   independent execution of every acceptance ID against the exact build are Gate 3
   evidence. A `REVISE` disposition blocks and requires a governed Exam revision.
3. **Gate 1 evidence remains absent.** The corrected Exam explicitly requires the real
   authenticated receipt and governed in-file descendant. Neither is fabricated here.
4. **Canonical signed-byte grammar.** The Exam fixes UTF-8 domain bytes, unsigned 64-bit
   big-endian octet lengths, RFC 8785 JCS UTF-8 header/payload bytes, invalid duplicate
   keys/lone surrogates, exact media type, and required boundary/invalid vectors.
   `RAT-SIGN` may select algorithm and trust policy but cannot mutate this grammar.
5. **Measurable blind leakage oracle.** `RAT-EVAL` must freeze allowed task inputs,
   protected secret classes, threat principal, metadata/padding/schedule/error classes,
   and a balanced >=1,000-sample-per-class held-out distinguishability test. The 95%
   Wilson upper bound may not exceed random-guess accuracy + 0.02.
6. **Fixed outcome denominator and useful rubric.** The eligible-unit manifest is frozen
   before Gate 2; cohort closure is the earlier of ten eligible units or exactly 30 days,
   with day-30 closure even below ten. Units are deduplicated by ratified intent identity,
   and failures/missing/abandoned units remain. Success requires qualified-human blinded
   usability and evidence-correctness under a frozen rubric; nonblank text is insufficient.

## Preserved architecture and coverage

The original recommendation remains: Work Management holds authenticated human intent;
a bounded issuer reconstructs the exact payload; required humans countersign through
separate capabilities; and one transactional ledger/CAS/outbox boundary creates effect.
Mirrors, Git, Buzz, signer, verifier, AI preparer, evaluator, transport and Codex remain
non-authoritative. The corrected Exam retains 59 unique acceptance IDs and all authority,
cryptographic, RAT, blind custody, privacy, security, accessibility, recovery,
reliability, metric, STR-024 and Codex surfaces.

No signature vector, human RAT, Gate receipt, audit-note descendant, B01–B12 manifest,
custody log, specialist review, implementation behavior, runtime execution, or production
performance was generated or claimed by this correction.

## Gate status and next human action

**Gate 2 readiness remains `BLOCKED`.** A human must preserve the authenticated Gate 1
receipt and governed in-file Brief audit-note descendant, name all required specialists,
ratify the final exact policies/specifications/vectors/oracles, and commission independent
Test and fresh Critic review against this corrected revision. Only after all required
Gate 2 evidence exists may the authenticated Tech Lead issue a separate-session ruling.
Runtime pass evidence is then generated against the exact build for Gate 3.

This Architect does not approve a gate or authorize implementation.

## Validation record

Validation is recorded against the final correction commit in the signed Buzz completion
report because a commit cannot truthfully self-reference its own SHA. Required checks:

- frozen Brief at the authority commit and correction worktree is byte-identical;
- correction diff contains only the Exam and this Architect evidence;
- 59 acceptance IDs remain unique and occur once;
- whitespace/conflict-marker and repository integrity checks pass;
- local and remote correction-branch SHAs match after the repo-scoped SSH port-443 push.
