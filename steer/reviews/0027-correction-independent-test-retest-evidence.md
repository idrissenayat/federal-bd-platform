# Independent Test retest — STR-027 corrected Gate 2 Exam

**Exam-design result:** `PASS` — all **59/59** current acceptance IDs occur exactly once
and retain a reproducible positive/negative design oracle. This is a specification review,
not runtime execution or implementation approval.

**Gate 2 readiness recommendation:** `BLOCK` — the corrected Exam closes the three
specification blockers identified in fresh Critic input
`a7f05e8faee7bba5dfb31b68d962faea535496d7`, but the exact target still lacks the
human-controlled prerequisites that the corrected Exam requires before an authenticated
human can decide Gate 2. No Gate decision is made by this evidence.

**Review role:** independent STEER Test Agent

**Target under test:** Architect correction commit
[`172aa08d29cc94b6407a3cc465f2583ecf262cbc`](https://github.com/idrissenayat/federal-bd-platform/commit/172aa08d29cc94b6407a3cc465f2583ecf262cbc)
on `architect/str-027-gate-2-correction`.

**Test evidence branch:** `test/str-027-correction-retest`

**Inputs reviewed:** frozen Brief authority
`b15efdc2355089c90c943eaa374d0b5e290b5343`; prior independent Test
`a5efbd607fec9932ba0e147100482a069d13cb11`; fresh Critic finding input
`a7f05e8faee7bba5dfb31b68d962faea535496d7`; and the authenticated correction policy
that a required countersignature leaves a ruling `PENDING_COUNTERSIGNATURE` and
ineffective until every required independently authenticated human has signed.

**Authority boundary:** This commit adds Test evidence only. It does not edit the Brief,
Exam, Architect evidence, implementation, application, receipt, RAT, custody material,
credential, key, gate state, or holdout. It does not read the new Critic result, rule on a
gate, open a PR, merge, deploy, or release.

## Exact-target integrity reproduction

| Check | Result | Reproduced evidence |
|---|---|---|
| Exact target and remote | PASS | Local `HEAD` and `origin/architect/str-027-gate-2-correction` both resolve to `172aa08d29cc94b6407a3cc465f2583ecf262cbc`. |
| Frozen Brief | PASS | Authority is an ancestor; both authority and target resolve the Brief to blob `8c62fef9ecb6cab7d31399ee5d3465b11cc4a66e`, SHA-256 `24d43671eab43d9a50b1d8a638b2209e0313cdaa0f8d605f888d58492be4bcce`. |
| Correction scope | PASS | Diff from `6c962bf0e54c594409a27e91456d090e4d62b8eb` modifies only the Exam and Architect rework evidence. `git diff --check` and `git fsck --full --no-dangling` pass. |
| Artifact hashes | PASS | Corrected Exam SHA-256 `e66849ff1c247169dcf15bbc88164b7cf33a6c0322d5b0583c8b190f423d56ad`; Architect evidence SHA-256 `8a9893a5d0f0f93bd058f6a169d460069692f2c8f90ed323e3fedc2a677e3c58`. |
| Acceptance inventory | PASS | `rg -o 'STR027-[A-Z0-9-]+' ... | sort | uniq -c` reports 59 distinct IDs, each with count 1. |
| Commit signature | QUALIFIED | `git log --show-signature` reports `N` (no Git signature). This source commit is provenance only, not human gate authority. |

## Retest of correction findings

### 1. Required countersignatures now truly gate effect — PASS at design level

The corrected contract makes `PENDING_COUNTERSIGNATURE` a durable, ineffective state:
`STR027-EFF-001` requires `no intent → PENDING_PROOF → PENDING_COUNTERSIGNATURE →
EFFECTIVE`; `STR027-AUTH-005` binds every required independently authenticated human
signature to the **pending** receipt; and `STR027-EFF-003` requires the one effect
transaction to recheck policy and atomically accept the proof set, CAS-transition once,
update projection, and enqueue mirrors—or commit none. `EFF-002`, `EFF-004`, `EFF-005`
and `UX-004` cover missing/rejected/revoked/stale signatures, crash/retry, concurrent
issuer/countersigner/retry traffic, duplicate signatures, and honest pending display.

Therefore a required signature cannot merely arrive after authority was effective. The
retest finds the corrected specification falsifiable: a Gate 3 harness can demonstrate
that every failure/race leaves projections, exports, mirrors, and dependent actions
ineffective, while an exact valid proof set permits precisely one transition. Runtime
proof is not available because no implementation exists at this target.

### 2. Gate 2 oracle freeze and Gate 3 runtime proof are separated — PASS at design level

The correction expressly places human-ratified policies/design, schemas, canonical and
signature/event/CAS specifications, implementation-independent vectors, fault/threat
models, metric definitions, and fixed positive/negative oracles at Gate 2. It then assigns
Builder implementation plus independent execution of every acceptance ID against an exact
build to Gate 3. `REVISE` explicitly blocks and requires a governed Exam revision plus
fresh ratification. The required-evidence section repeats that **no Builder output or
runtime pass is Gate 2 evidence**.

This resolves the former circular requirement without converting runtime claims into
paper passes: every stated implementation behavior remains an eventual Gate 3 execution
obligation against vectors/oracles frozen before the build.

### 3. Signed-byte grammar is canonical and falsifiable — PASS at design level

`STR027-SIGN-003` now fixes UTF-8 domain bytes, a NUL octet, unsigned 64-bit big-endian
octet lengths, RFC 8785 JCS UTF-8 header and payload bytes, invalid duplicate keys/lone
surrogates, and exact media type. `RAT-SIGN` may choose algorithm and trust policy but
cannot change the grammar. Required vectors cover zero/max-bound lengths, overflow,
Unicode/number/key ordering, and media type. This is sufficiently exact for independent
byte regeneration and invalid-vector rejection; the actual vectors are correctly still a
human-ratified Gate 2 prerequisite rather than invented in this retest.

### 4. Leakage oracle and cohort denominator are measurable — PASS at design level

`STR027-BLIND-005` requires RAT-EVAL to freeze observed task input, protected secret
classes, threat principal and metadata/padding/schedule/error classes; it fixes a balanced
minimum of 1,000 samples per secret class and a held-out-classifier 95% Wilson upper bound
no greater than random-guess accuracy + 0.02. Out-of-allowlist observations contaminate
the run. `MET-001..003` fixes immutable eligible-unit handling, deduplication by ratified
intent identity, closure at the earlier of ten units or exactly 30 days, retention of
failures/missing/abandoned units, and a qualified-human blinded usability/evidence rubric.

These additions turn the formerly gameable/ambiguous design claims into pre-build,
falsifiable specifications. Sample fixtures, class definitions, rubric, and custody
material remain unratified and absent, so they are not claimed as executed evidence.

### 5. Gate 1 stays default-closed — PASS for preservation; BLOCK for readiness

The correction accurately preserves the frozen Brief's `GATE 1: PENDING` and `GATE 1
EVIDENCE: PENDING`. It does not substitute the Buzz dispatch record for the required
authenticated Work Management receipt or the governed in-file audit-note descendant.
This is correct fail-closed behavior, but it independently blocks any human Gate 2
ruling until those real artifacts exist and are verified.

## 59-ID design coverage result

| IDs | Result | Retest conclusion |
|---|---|---|
| AUTH-001..006 | PASS | Exact artifact/role/lineage binding and separated human, issuer, countersigner, and recorder capabilities remain observable with denial/audit negatives. |
| SIGN-001..008 | PASS | Canonical bytes, protected envelope, key-state matrix, bounded issuer, append-only verification, and offline verification have defined invalid/substitution/replay oracles. |
| EFF-001..008 | PASS | Pending-countersignature state, atomic CAS, >=100-worker concurrency, fault injection, retry, supersession, and non-authoritative mirrors are testable at Gate 3. |
| RAT-001..007 | PASS | Editable advisory-only packages, individual human actions, provenance/staleness, dependencies, and injection resistance remain default-closed and testable. |
| BLIND-001..008 | PASS | Fixed B01–B12 denominator, custody separation, binding modes, leakage bounds, contamination retention, and STR-024 ambiguity controls remain explicit. No B09–B12 material was accessed. |
| UX-001..004 | PASS | Human review, keyboard/AT recovery, visual/manual evidence, and pending-versus-effective honesty have observable outcomes. |
| SEC-001..002; PRIV-001..003 | PASS | Secret, endpoint, export, lifecycle, and access-abuse negatives retain clear fail-closed evidence expectations. |
| REC-001..003; REL-001..003 | PASS | Scoped stop, event replay/reconciliation, owner-controlled recovery, ratified load profile, degradation, and telemetry are falsifiable. |
| MET-001..004; STR024-001..002; CODEX-001 | PASS | Denominator/rubric/zero-guardrail, human-only STR-024 dependencies, and pinned supervisor boundary are explicit. |

**Matrix total:** 59 `PASS`, 0 design-adequacy `BLOCK`.

## Validation commands and limitations

Executed at exact target `172aa08d29cc94b6407a3cc465f2583ecf262cbc` before this evidence
was created:

```bash
git ls-remote origin refs/heads/architect/str-027-gate-2-correction
git merge-base --is-ancestor b15efdc2355089c90c943eaa374d0b5e290b5343 HEAD
git rev-parse b15efdc2355089c90c943eaa374d0b5e290b5343:steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md HEAD:steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md
sha256sum steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md steer/exams/0027-signed-gate-receipts-and-ratification-packages.md steer/reviews/0027-architect-evidence.md
git diff --name-status 6c962bf0e54c594409a27e91456d090e4d62b8eb HEAD
git diff --check 6c962bf0e54c594409a27e91456d090e4d62b8eb HEAD
git fsck --full --no-dangling
rg -o 'STR027-[A-Z0-9-]+' steer/exams/0027-signed-gate-receipts-and-ratification-packages.md | sort | uniq -c
./scripts/gauntlet.sh
```

All Git/content checks passed. `./scripts/gauntlet.sh` is **BLOCKED by this worker**:
12 readiness checks passed, one expected SAM warning occurred, and 23 failed because
required tools/services are absent (`gh`, `jq`, `uv`, Docker, gitleaks, osv-scanner,
semgrep, shellcheck, actionlint, Codex/Claude auth, Python 3.12, pinned Node, GitHub auth,
and project PostgreSQL/Compose). The script also flags documentation text containing
“private keys” as a potential secret. This is neither a clean secret result nor a product
test result. No environment, dependency, configuration, credential, or application change
was made to bypass it.

No protocol/runtime, signature, concurrency, custody, leakage, accessibility, security,
privacy, recovery, performance, or deployment execution can truthfully pass: target
`172aa08...` changes Markdown artifacts only and contains no corresponding implementation
or frozen ratified vectors. Those are Gate 3 execution work after a valid Gate 2 decision.

## Required human action

**Withhold Gate 2.** First preserve and verify the authenticated Gate 1 receipt plus
policy-compliant in-file Brief audit-note descendant; name qualified humans and obtain
valid dispositions for all eight RAT rows; ratify the exact policies, schemas, vectors,
custody/field inventories, threat/fault models, rubric, leakage classes, and harness
oracles required by the corrected Exam; then obtain this Test review and an independent
fresh-context Critic review of the final exact revision. Only then may the authenticated
Tech Lead decide Gate 2 in the required separate session. Gate 3 subsequently owns exact
build execution.
