# Final fresh Critic recheck — STR-027 Intent Brief

**Human Gate 1 readiness recommendation:** `PASS`

**Role:** named STEER Critic Agent in a new isolated worktree and fresh context; Codex
is the temporary runtime host, and this Git record is not native named-agent attestation

**Exact review target:** corrected Scout commit
`b15efdc2355089c90c943eaa374d0b5e290b5343` on `codex/str027-scout`

**Critic branch:** `codex/str027-final-critic`

**Files reviewed:**

- `steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md`
- `steer/evidence/0027-scout-evidence.md`
- preserved prior Critic evidence
  `steer/reviews/0027-fresh-critic-evidence.md`

**Authority boundary:** Critic evidence only. This recheck does not edit or approve the
Brief, Scout evidence, prior Critic evidence, STR-024 artifacts, operating-model files,
Exam, product/platform code, Flight Board state, credentials, signatures, receipts,
ratifications, or any gate. It authorizes no Exam, implementation, PR, deployment,
merge, release, closure, STR-024 Gate 2 decision, or blind-holdout access.

## Executive result

The corrected Intent Brief is ready for an authenticated human Product Lead to decide
Gate 1. All three findings from prior Critic commit
`05c1d7034dc139ff32a2db52ea8881d58cb91263` are closed at the Brief/evidence level,
and the correction introduces no new blocker. The specification is clear, falsifiable,
provider-neutral, explicitly default-closed, and testable by a later Exam.

This `PASS` is advisory. It does not approve Gate 1, choose deferred security/privacy/
reliability parameters, appoint qualified co-ratifiers, authorize implementation, or
unblock STR-024 Gate 2. Gate 1 may authorize Exam design only.

## Prior-finding retest

### 1. `PASS` — signed bytes, verification derivation, atomic effect and retry semantics

The signed-byte contract is no longer self-referential. The canonical
`steer.gate-receipt.payload.v1` and deterministic protected header explicitly exclude
the signature and verifier-derived state. The domain-separated, length-delimited input
binds the protected header and payload; the detached envelope carries the signature.
Verifier identity, key/revocation snapshot, outcomes and overall result live in a
separate append-only `ReceiptVerification/v1` event that binds the intent, payload and
envelope digests rather than rewriting signed bytes.

Human submission commits only an authenticated `PENDING_PROOF` intent with no Gate/RAT
effect. A current-policy check and compare-and-set accept one envelope, and one durable
transaction appends proof/verification, transitions exactly once to `EFFECTIVE`, updates
the authoritative projection and enqueues mirrors, or commits none. Pre-commit crashes
remain ineffective; an unchanged-intent retry reuses the payload and cannot accept two
envelopes; a post-commit retry returns the existing receipt; failures append a safe
`PROOF_FAILED` attempt. Stale role, revision, key, sequence, replay and signature states
fail closed, while correction uses a new superseding intent without erasure.

Planted structural negatives rejected signature/verification/trust-store/public-key
state inside the signed objects, missing proof/current-role/current-revision/sequence/
CAS/atomic components, failed verification, pre-commit signer crash and duplicate
post-commit effect.

### 2. `PASS` — B01–B12 anti-dictionary, anti-linkability and replay-safe bindings

Every assertion/oracle binding visible outside the custodian/evaluator boundary must be
either the SHA-256 of randomized fixed-size authenticated ciphertext with protected
associated-data bindings, or a domain-separated commitment with a fresh custodian-only
opening of at least 256 bits. Both bind manifest id/revision, exact Exam and candidate,
case id, fixture revision and purpose. Fresh material per case/candidate/manifest/
revision, custodian-only opening after committed output/trace, one-way input/output
delivery, allowlisted non-semantic metadata, and contamination on disclosure,
dictionary-matchability, reuse or linkability prevent raw-hash enumeration and
cross-case replay.

The exact STR-024 `assertion-set SHA-256` label is explicitly default-closed. Before
STR-024 Gate 2, Idriss Enayat and the named human Test owner/custodian must either ratify
randomized fixed-size assertion-ciphertext semantics with test vectors or request a
governed Exam revision. Until then it remains `UNRATIFIED`; a raw assertion hash,
manifest, score or Gate 2 package is invalid.

Planted negatives rejected raw/stable assertion hashes, deterministic or variable-size
ciphertext, missing binding fields, 32-bit or exported openings, missing domain
separation, and opening reuse. Clean randomized-ciphertext and 256-bit fresh-commitment
shapes passed.

### 3. `PASS` — corrected `bcf4856` ancestry and exact evidence inventory

`bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de` is a true ancestor of the corrected Scout
target and changes exactly two files, not seven:

| Path | Git blob | SHA-256 | Target equality |
|---|---|---|---|
| `docs/steer/OPERATING-MODEL.md` | `898aad2fb3331f04834321f28a7dda4c68ef8bc2` | `fad15fbbb705ea3c0e71f08b3ef461bec68647d775ba7aaf9ad9978b2cb9dd6f` | byte-identical |
| `steer/evidence/docs-agent-codex-supervision-boundary-2026-08-15.md` | `d4e4a6b77bb70493b55784fe3beb9b52dbb010ff` | `35d342765d04b3b1dfed98720142b85abed3b966bae6c9ef165fdf961e7a988f` | byte-identical |

The Scout evidence now states the count, paths, blobs and SHA-256 values exactly. Prior
Critic commit `05c1d7034dc139ff32a2db52ea8881d58cb91263` is also a true ancestor through the
recorded merge, and its evidence has SHA-256
`d268e0f021b806655d3438c7ec1f2eae31850d97d33b5ec6c077427d61475dac`
both at that commit and at the corrected target.

## Independent adversarial disposition

| Attack surface | Result |
|---|---|
| Human/issuer/countersigner/recorder/agent/evaluator/custodian/transport/verifier/Codex authority collapse | `PASS` at Brief level. Human decision intent, issuer attestation, policy-required human countersignature/audit note, preparation, custody, transport and verification are separate capabilities; service and agent principals cannot decide. Server/data-layer denial is required. |
| Signing-oracle and compromised-host abuse | `PASS` at Brief level. The issuer may attest only an exact durable human intent; it cannot create/change the decision. Keys are non-display, least-privilege and unavailable to prompts, browsers, Git, Buzz, logs, exports, fixtures, agent tools and Codex. Unavailable or invalid proof holds effect. Exact API/key-service constraints and attack vectors belong in the Exam and named security ratification. |
| Stale/changed artifact, sequence or cross-item replay | `PASS`. Repository/URI/commit/path/blob/file/body digests, event sequence/previous digest, scope/audience and current-policy verification bind the ruling. A new artifact revision never inherits approval; correction is append-only supersession. |
| Countersigner independence and role stacking | `PASS` for Gate 1. A required countersignature is a separate authenticated human action bound to the effective receipt digest. Missing qualified ownership holds the affected RAT and dependent gate; whether one human may hold multiple roles remains an explicit default-closed human policy choice. |
| Privacy, retention and public export | `PASS` for Gate 1. A minimal allowlist excludes profiles, credentials, prompts, private reasoning and holdout semantics. Public fields, legal basis, access, retention, deletion/pseudonymization and backup expiry require qualified human ratification before production; unresolved state is private/least privilege/no public disclosure. |
| Accessibility and human action speed | `PASS` at Brief level. Non-blank editable AI drafts, exact target/risk/role/evidence, visible AI-to-human diff, keyboard/screen-reader/focus recovery, non-color status, actionable error/recovery states and no bulk/automatic approval are explicit and testable. The support matrix and evidence owner remain default-closed. |
| Availability, recovery and reconciliation | `PASS` for Gate 1. Scoped stops preserve immutable decisions/evidence; recovery revalidates identity, keys, sequence, idempotency, revision and views; event replay restores authority. Exact SLO/RPO/RTO/commands/owners require Ops ratification and rehearsal before production. |
| STR-024 circularity or retroactive evidence invention | `PASS`. STR-027 uses current authenticated GATES/SOLO evidence for its own pre-feature gates. It may prepare a new, human-controlled exact-revision STR-024 package but cannot sign for Idriss, appoint owners, alter the frozen Brief, fabricate historical proof, expose holdouts or decide Gate 2. |

## Tags and deferred human choices

Independent derivation confirms `#security`, `#privacy`, `#a11y`, `#reliability` and
`#design-system`. `#money` is not implicated. `#legal` is not required by the current
Sense-stage scope because production legal-signature/non-repudiation claims and external
actions are expressly out of scope; public disclosure and legal basis remain
default-closed before production.

Gate 1 need not select a signing provider, key service, algorithm/canonicalization
profile, ledger family, public field allowlist, retention/erasure periods, co-ratifier
matrix, AI model/configuration, accessibility support matrix, availability target,
RPO/RTO, evaluator runtime or holdout binding mode. The Brief names the accountable
human, qualified co-ratifier/evidence, and fail-closed state for each. Those choices must
be resolved before Gate 2/implementation as specified; their deferral does not create a
Gate 1 ambiguity or permission to proceed by default.

## Integrity, protected artifacts and scope

- The worktree/branch was created directly at exact target `b15efdc2355...`; the target
  exists locally and at the configured GitHub origin.
- Prior Critic `05c1d703...` is true ancestry and its evidence is byte-identical.
- STR-024 corrected Exam commit `254226bbb99a07844262d609b11d1b0b36281f9f`
  is a true ancestor. Its frozen Brief, corrected Exam, pending Gate 1 receipt template
  and Architect evidence are byte-identical at this target.
- Final Test `41e131d2250d78e0b71685d1decf1c4c9648db4d` and final Critic
  `223f4adf237a388bd11f6620b32137329894a14e` resolve at origin and contain their
  referenced evidence files. They remain parallel evidence rather than false ancestry.
- GitHub issue #55 is open and its assigned Scout role, Sense-stage action, boundaries
  and STR-024 dependency match the delivered scope.
- No Brief, Scout evidence, prior Critic evidence, Exam, governance file, protected
  STR-024 artifact, product/platform code, app data, credential, signature, holdout,
  Flight Board state or gate was changed by this Critic.

## Validation record

Validation completed at `2026-08-15T20:15:19-04:00` in the isolated Critic worktree.

| Check | Result |
|---|---|
| `./scripts/gauntlet.sh` | PASS — 35 readiness checks, one expected missing-SAM-key warning, zero failures; Ruff, mypy, pytest 3/3, gitleaks, `uv.lock` OSV and Semgrep (252 rules / 139 tracked files) passed. |
| `./scripts/prove-gauntlet-blocks.sh` | PASS — planted synthetic secret and failing test were blocked. |
| Protocol planted negatives | PASS — self-reference, derived signed-state, incomplete/duplicate effect and unsafe holdout-binding shapes were rejected; clean shapes passed. |
| `npm ci && npm run lint && npm test` in `flight-board/` | PASS — build and lint passed; rendered-shell test 1/1 and TypeScript tests 27/27 passed. |
| Dependency checks | PASS/QUALIFIED — production `npm audit --omit=dev` reports zero vulnerabilities; full audit remains zero critical, two high and four moderate dev/build findings under the unchanged time-bounded repository control. No package or lockfile changed. |
| Exact origin/path/link checks | PASS — corrected Scout, prior Critic and four pinned source commits resolve at origin; issue #55 is open; every referenced repository path exists at its exact revision. |
| Ancestry/content checks | PASS — prior Critic, `bcf4856...` and `254226b...` ancestry and all stated byte-equality/blob/SHA-256 claims reproduce exactly. |
| Scope/static/secret checks | PASS — no existing tracked file changed; the final staged diff is limited to this new Critic evidence file; `git diff --cached --check`, gauntlet, secret and static rechecks are clean. |

## Final disposition and smallest next action

**`PASS` human Gate 1 readiness for exact Scout revision `b15efdc2355...`.** There are
no remaining material Critic findings at this stage. The smallest next action is for the
authenticated human Product Lead to read the corrected Brief and this evidence, then
approve or request changes for Gate 1 against that exact revision. If approved, record
the policy-compliant in-file audit-note descendant and authenticated evidence before an
Architect starts Exam design. Do not implement, choose unresolved parameters, or move
STR-024 to Gate 2 on this recommendation.

The exact containing evidence commit and immutable GitHub URL are supplied in the
post-push Critic handoff rather than guessed inside this pre-commit record.
