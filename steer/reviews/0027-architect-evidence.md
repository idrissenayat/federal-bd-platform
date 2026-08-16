# Architect evidence — STR-027 Gate 2 Exam preparation

**Role:** STEER Architect Agent
**Work item:** STR-027 / issue #55
**Branch:** `architect/str-027-gate-2-exam`
**Brief authority:** exact corrected commit `b15efdc2355089c90c943eaa374d0b5e290b5343`
**Fresh Critic input:** exact commit `5337659ca59504d9ffa9106cfa03e45f06a90171`
**Prepared artifact:** `steer/exams/0027-signed-gate-receipts-and-ratification-packages.md`
**Authority boundary:** Exam and Architect evidence only; no Brief edit, implementation,
credential/key, signature, receipt, ratification, holdout access, gate decision, merge,
deploy, release or claim of evidence not generated in this run

## Authorization provenance and preserved boundary

Idriss Enayat's authenticated Buzz handoff states that STR-027 is active in STEER Work
Management and its human Gate 1 ruling is `APPROVED`; it directs this Architect to use
the exact corrected Brief and final fresh-Critic commits above. The handoff authorizes
Gate 2 Exam/evidence preparation only. This record reports that supplied authority; it
does not impersonate the Product Lead, manufacture the platform receipt, or treat the
handoff as Gate 2 approval.

The worktree was based on Critic evidence commit `5337659...`, which has Brief commit
`b15efdc...` as a true ancestor. The Brief at the two revisions is byte-identical. The
Exam and this evidence are new files; the Brief and prior evidence remain untouched.

## Inputs read

- Exact STR-027 corrected Brief and final fresh Critic evidence above.
- `AGENTS.md`, `steer/templates/exam.md`, `steer/operating-system/GATES.md`,
  `steer/operating-system/GUARDRAIL-LIBRARY.md`, `steer/PROJECT-GUARDRAILS.md`,
  and the existing STR-024 Exam/Architect evidence for repository conventions.
- The authorized handoff's required surfaces: signed gate receipts, detached signature
  envelopes, atomic/idempotent effect, editable AI RATs, blind B01–B12 custody,
  recovery, privacy, security, accessibility and unresolved named-human decisions.

## Architecture options considered

### A — Authoritative intent ledger + bounded issuer + transactional effect/outbox

Work Management commits authenticated human intent first. A narrowly authorized issuer
reconstructs canonical payload from that intent and returns a detached envelope. One
transaction verifies current policy, appends proof/verification, changes effect exactly
once and enqueues projections/mirrors. Independent verification consumes an export.

- **Strength:** clearest human/issuer separation, idempotency, atomic effect and recovery.
- **Risk:** transaction/outbox, canonicalization and trust-snapshot contracts must be
  exact; partial implementations could mislabel pending intent as authority.
- **Complexity:** M–L.

### B — Dedicated append-only transparency ledger with Work Management projection

Intent and proof enter a cryptographically linked external ledger; Work Management is a
projection and gate policy client.

- **Strength:** strong replay and independent audit properties.
- **Risk:** splits authority, increases consistency/recovery burden and may make the
  external service a de facto decision-maker or source of truth.
- **Complexity:** L.

### C — External signer signs exported Work Management snapshots

Work Management exports a package to a signing provider, then imports the envelope.

- **Strength:** smallest apparent integration and replaceable signing vendor.
- **Risk:** mutable/stale snapshot, signing-oracle abuse and crash gaps make atomic effect,
  exact intent and role/revision revalidation harder; vendor callbacks may gain authority.
- **Complexity:** S initially, L to govern safely.

**Recommendation:** A is the narrowest direction that preserves Work Management as
human-decision authority and keeps issuer, verifier, projections and mirrors bounded.
The Exam is implementation/provider neutral: options B/C can pass only if they prove the
same intent, canonicalization, CAS, atomicity, custody and recovery oracles. This design
recommendation does not select a vendor/algorithm/storage technology or authorize build.

## Falsifiability and coverage

The Exam defines 59 stable acceptance IDs plus six adversarial campaigns. It requires
reproducible protocol bytes and signatures, fault injection at every effect boundary,
100-worker concurrency, offline verification, authority-denial matrices, AI prompt and
bulk-approval negatives, custody side-channel/dictionary/replay attacks, scoped recovery,
privacy lifecycle, accessible manual evidence, and exact outcome denominators.

| Brief “done and correct” item | Primary Exam coverage |
|---|---|
| 1. Human-only authority | STR027-AUTH-001..003, STR027-SEC-002 |
| 2. Distinct intent/signing/countersigning | STR027-AUTH-002..005, STR027-SIGN-006 |
| 3. Canonical payload/detached envelope | STR027-SIGN-001..008 |
| 4. Atomic/idempotent effect/correction | STR027-EFF-001..008 |
| 5. Policy-compliant gate evidence | STR027-AUTH-004..006, required Gate 2 evidence |
| 6. AI-prepared editable package | STR027-RAT-001..003 |
| 7. No automatic/bundled judgment | STR027-RAT-004..005 |
| 8. RAT role/sequence | STR027-RAT-005..007 |
| 9. Evaluator-owned B01–B12 manifest | STR027-BLIND-001..002 |
| 10. Confidential bindings/custody | STR027-BLIND-003..008 |
| 11. Export/independent verification | STR027-SIGN-007..008, STR027-PRIV-003 |
| 12. Key/identity safety | STR027-SIGN-005..006, STR027-SEC-001..002 |
| 13. Privacy/minimization | STR027-PRIV-001..003 |
| 14. Accessible review | STR027-UX-001..003 |
| 15. Honest/idempotent feedback | STR027-EFF-005..006, STR027-UX-004 |
| 16. Rollback/recovery | STR027-REC-001..003, STR027-REL-002 |
| 17. STR-024 remains human-controlled | STR027-STR024-001..002, STR027-BLIND-008 |
| 18. Codex boundary | STR027-CODEX-001, STR027-AUTH-001/005 |
| 19. Falsifiable learning | STR027-MET-001..004, STR027-REL-003 |

## Named-human decisions deliberately unresolved

The Exam does not silently choose protocol or policy values that the Brief assigns to
humans. It converts every unresolved row into a named, testable, default-closed Gate 2
input: `RAT-SIGN`, `RAT-PRIVACY`, `RAT-ROLES`, `RAT-POLICY`, `RAT-AI`, `RAT-EVAL`,
`RAT-A11Y` and `RAT-SLO`. Idriss Enayat is the accountable Product/Tech/data/experiment
owner where the Brief names him. The qualified identity/security, privacy/data,
accessibility/design, Test/custody and Ops/reliability humans remain **unresolved** and
must be explicitly named; ownership is not treated as specialist competence.

The narrow `RAT-EVAL` choice is especially blocking: Idriss Enayat and the named human
Test owner/custodian must either ratify randomized fixed-size assertion-ciphertext
semantics plus frozen vectors for STR-024's `assertion-set SHA-256`, or request a governed
STR-024 Exam revision. Until then no raw digest, manifest, score, RAT-EVAL or STR-024
Gate 2 package is valid.

## Evidence generated by this Architect run

- New falsifiable Exam at
  `steer/exams/0027-signed-gate-receipts-and-ratification-packages.md`.
- This provenance/options/traceability/default-closed evidence at
  `steer/reviews/0027-architect-evidence.md`.
- Local integrity, scope, static and repository validation reported below after execution.

No signature vector, human RAT, Gate receipt, B01–B12 manifest, custody log, specialist
review, Test result, Critic result, implementation behavior or production performance was
generated. The Exam requires those future artifacts; this evidence does not claim them.

## Current blockers and next human action

**Gate 2 readiness remains `BLOCKED`, by design, pending evidence and human decisions.**
The smallest next action is for Idriss Enayat to review the editable eight-row RAT package
against this exact Exam revision, name each required qualified human, and route the Exam
to independent Test and a fresh Critic. The human Product/Tech owner and named
co-ratifiers must record their own dispositions; only after all blocking evidence exists
may the authenticated Tech Lead decide Gate 2 in a different session from Gate 1.

This Architect neither approves Gate 2 nor authorizes implementation.

## Validation record

Executed from branch `architect/str-027-gate-2-exam` based at exact Critic commit
`5337659ca59504d9ffa9106cfa03e45f06a90171`:

- `git merge-base --is-ancestor b15efdc... 5337659...` — `PASS`.
- SHA-256 plus byte comparison of the Brief at `b15efdc...`, `5337659...`, and the
  worktree — all exactly
  `24d43671eab43d9a50b1d8a638b2209e0313cdaa0f8d605f888d58492be4bcce`; `PASS`.
- Tracked/untracked scope check — no tracked modification and exactly the two new
  Architect artifacts named above before staging; `PASS`.
- Acceptance-ID extraction — 59 unique IDs and 59 occurrences; `PASS`.
- `git diff --check --no-index /dev/null <artifact>` for each new file, trailing-space
  scan and conflict-marker scan — `PASS`.
- `uv run ruff check . && uv run pytest -q` — not executed because `uv` is unavailable
  in this harness (`uv: command not found`); these are documentation-only additions.
- `gitleaks detect --no-banner --redact --source .` — not executed because `gitleaks` is
  unavailable in this harness. Manual scope review found only synthetic/public protocol
  descriptions and commit/file digests, but is not represented as a secret-scanner pass.

The immutable commit and remote push state are recorded by Git and in the signed Buzz
completion report after commit/push; they cannot be truthfully self-referenced inside the
commit's own file content.
