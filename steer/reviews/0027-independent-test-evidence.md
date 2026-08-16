# Independent Test evidence — STR-027 Gate 2 Exam readiness

**Exam design result:** `PASS` — 59/59 current acceptance IDs are present once and
specify a falsifiable positive/negative outcome with retained evidence.

**Gate 2 readiness recommendation:** `BLOCK` — this is an Exam-design review, not
implementation proof. The exact required authenticated human receipts, eight human RAT
dispositions, frozen protocol/custody vectors, and fresh Critic review are absent by
construction and remain mandatory before a human Gate 2 decision. This result does not
approve Gate 2.

**Review role:** independent STEER Test Agent

**Review target:** Architect commit `6c962bf0e54c594409a27e91456d090e4d62b8eb`
on `architect/str-027-gate-2-exam`.

**Review branch:** `test/str-027-gate-2-retest`

**Authority boundary:** Test evidence only. No Brief, Exam, Architect evidence,
implementation, application, receipt, human decision, RAT, blind fixture, Gate state,
PR, merge, deployment, release or credential was changed or claimed.

## Integrity and provenance reproduction

| Check | Result | Independent reproduction |
|---|---|---|
| Exact target | PASS | Local `HEAD` is `6c962bf0e54c594409a27e91456d090e4d62b8eb`; `git ls-remote` over the supplied repo-scoped test key resolved `refs/heads/architect/str-027-gate-2-exam` to that same hash. |
| Authority ancestry | PASS | `git merge-base --is-ancestor b15efdc2355089c90c943eaa374d0b5e290b5343 HEAD` and the equivalent check for `5337659ca59504d9ffa9106cfa03e45f06a90171` both succeeded. |
| Frozen Brief | PASS | Both authority revision and target resolve `steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md` to Git blob `8c62fef9ecb6cab7d31399ee5d3465b11cc4a66e`; worktree SHA-256 is `24d43671eab43d9a50b1d8a638b2209e0313cdaa0f8d605f888d58492be4bcce`. |
| Architect artifact integrity | PASS | Exam SHA-256 `5241f96fb54c175b118a48dd121cf65057e460a4b1eaca7b3bdd64606fe53ee0`; Architect evidence SHA-256 `3b325092fb1e376016f57ce628ebd48cba41fa379a2a2c818bf369a36d6aa50b`. |
| Target scope | PASS | `git diff --name-status 5337659... 6c962bf...` reports only the added Exam and Architect evidence. `git diff --check` and `git fsck --no-dangling` passed. |
| Acceptance inventory | PASS | `rg -o 'STR027-[A-Z0-9]+-[0-9]+' ... | sort | uniq -c` produced 59 distinct IDs, each occurring exactly once. |

The Git commit is unsigned (`git log --show-signature` had no signature record). That is
not treated as human Gate authority or named-agent attestation. It is immutable source
provenance for this review only.

## Test method and result boundary

I independently reviewed the frozen Brief, exact Exam, Architect evidence, the final
fresh-Critic evidence at `5337659...`, `GATES.md`, and the source inventory. I assessed
whether each Exam ID defines observable behavior, adversarial failure, retained evidence,
and Brief/default-closed traceability. The target adds documentation only: no receipt
service, signer, event store, UI, key service, evaluator, fixture, test vector, or build
implements these requirements. Therefore live protocol, signature, crash, concurrency,
B01--B12, privacy, security, recovery, performance and accessibility executions cannot
truthfully be marked passed; those are explicitly required future implementation/Gate 3
evidence. Their absence does not make an Exam requirement unfalsifiable at Gate 2.

`RAT-SIGN` deliberately leaves the canonicalization/length profile and algorithm for
qualified human ratification. The Exam fixes the domain-separated, length-delimited shape
that vectors must exercise, while requiring the ratified encoding and frozen vectors;
it does not select an algorithm, key service, or trust root.

## Per-ID independent design matrix

`PASS` below means design adequacy only: the cited ID supplies an observable success and
negative/fail-closed oracle plus evidence expectation. It does **not** mean an application
has passed that runtime test.

| IDs | Result | Independent test oracle / coverage conclusion |
|---|---|---|
| AUTH-001..006 | PASS | Human-only capability boundaries, deliberate pending intent, submit/proof current-policy recheck, exact artifact binding, separated issuer/countersigner/recorder authority, and Gate lineage all require denial/audit or exact durable state. Forged display name, agent/service, cross-tenant, stale-role, substitution and role-collapse negatives are explicit. |
| SIGN-001..008 | PASS | Payload/header allowlists, deterministic canonical bytes, detached envelope, key-state matrix, bounded issuer, append-only verification, and offline export verification have exact substitution, encoding, replay, revocation and unavailable-service negatives. Vector bytes/digests/signatures are required future evidence, not invented here. |
| EFF-001..008 | PASS | State machine, pre/post-commit crash matrices, all-write atomicity, >=100-worker CAS race, idempotent retry/conflict, safe failed proof, sequence/supersession and non-authoritative mirrors are measurable and fault-injectable. |
| RAT-001..007 | PASS | Required nonblank editable advisory data, provenance/staleness, keyboard/AT editable draft-to-human diff, deliberate individual action, owner/dependency blocking, injection resistance and exact RAT receipt collectively prevent AI/service judgment and admit positive/negative evidence. |
| BLIND-001..008 | PASS | Signed fixed denominator, distinct-custody audit, ciphertext and commitment binding/entropy, one-way delivery, contamination preservation, public B01--B08 separation, and STR-024's default-closed ambiguity each specify leakage, replay, substitution, reuse and dictionary negatives. No B09--B12 semantic material was accessed. |
| UX-001..004 | PASS | Review hierarchy, keyboard/focus/error recovery, named manual/automated screen-reader and visual evidence, and pending-versus-effective latency states are observable; support matrix remains ratification-blocked. |
| SEC-001..002 | PASS | Secret-surface canaries and endpoint authn/authz/schema/rate/CSRF/replay controls name IDOR, injection, XSS, SSRF, mass-assignment and confused-deputy negatives with audit expectations. |
| PRIV-001..003 | PASS | Schema/export allowlist, lifecycle deletion/pseudonymization/backup/legal-hold behavior, and access/export downgrade attacks have rejection/redaction and audit oracles. Ratified lawful basis/retention settings remain unresolved rather than silently assumed. |
| REC-001..003 | PASS | Capability-scoped disable, empty-projection replay with reconciliation, and named-Ops revalidation before resume are independently demonstrable and preserve append-only authority. |
| REL-001..003 | PASS | Ratified load profile, degradation behavior/backpressure and safe telemetry define measured p95/p99/error/telemetry outcomes while honestly deferring values and Operations ownership to RAT-SLO. |
| MET-001..004 | PASS | Pre-frozen cohort/denominator, explicit measures/missingness, ratified thresholds and zero-tolerance guardrails prevent survivor filtering or unsupported value claims. |
| STR024-001..002 | PASS | Synthetic preparation is constrained not to decide/sign/appoint/expose; exact human receipt, RATs, custody manifest and separate-session decision remain required. |
| CODEX-001 | PASS | Pinned equal-or-narrower boundary denies Codex delivery authorship, evidence fabrication, signature/decision/evaluation/holdout authority and named-agent-performance credit. |

**Matrix result:** 59 `PASS`, 0 `BLOCK` for Exam design adequacy.

## Adversarial and cross-cutting retest conclusions

- **Provenance and policy:** the frozen Brief is byte-identical across the approved and
  Architect targets; the Exam preserves its human-only decision authority, separate
  issuer/countersigner/recorder capabilities, exact revision binding, append-only
  correction, and separate-session human Gate 2 boundary.
- **Signatures and effective state:** signed bytes exclude signature and derived
  verification state; detached-envelope substitution and self-reference are denied;
  `PENDING_PROOF` cannot present as authority; CAS, transactional effect, replay and
  retry oracles are concrete.
- **RAT packages:** all eight named RAT decisions remain visibly unresolved/default
  closed. The AI output is advisory, populated, editable, diffable and cannot choose or
  submit an individual human decision.
- **B01--B12:** the case denominator cannot be selected after results; contamination is
  preserved rather than replaced; B09--B12 plaintext, openings and semantic material are
  denied to this Test run and the broad non-custodian surfaces.
- **Negative controls:** authority confusion, signing-oracle, protocol mutation,
  concurrent/fault, prompt/evidence injection, blind leakage, recovery/privacy/a11y
  campaigns are enumerated with expected safe failure and evidence.
- **Evidence integrity:** exact artifact hashes, vector regeneration, offline verifier,
  append-only events, allowlisted exports and missing-evidence-is-BLOCK rules prevent a
  documentation assertion from being converted into implementation proof.

## Validation and limitations

Executed commands from the exact target before adding this evidence:

```bash
git rev-parse HEAD
git merge-base --is-ancestor b15efdc2355089c90c943eaa374d0b5e290b5343 HEAD
git merge-base --is-ancestor 5337659ca59504d9ffa9106cfa03e45f06a90171 HEAD
git rev-parse b15efdc2355089c90c943eaa374d0b5e290b5343:steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md HEAD:steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md
sha256sum steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md steer/exams/0027-signed-gate-receipts-and-ratification-packages.md steer/reviews/0027-architect-evidence.md
git diff --check 5337659ca59504d9ffa9106cfa03e45f06a90171 6c962bf0e54c594409a27e91456d090e4d62b8eb
git fsck --no-dangling
rg -o 'STR027-[A-Z0-9]+-[0-9]+' steer/exams/0027-signed-gate-receipts-and-ratification-packages.md | sort | uniq -c
```

All above passed. `./scripts/gauntlet.sh` was attempted and is **BLOCKED by this worker**:
it reports missing `gh`, `jq`, `uv`, Docker, gitleaks, osv-scanner, semgrep, shellcheck,
actionlint, Codex/Claude auth, Python 3.12, pinned Node, GitHub auth and project
PostgreSQL/Compose; its readiness summary was 12 pass, 1 expected SAM warning, 23 fail.
The script also labels a documentation occurrence of “private keys” as a potential
secret. This is a scanner/environment limitation, not a secret-clean result. No package
installation, secret, configuration or application change was made to bypass it.

## Required human action

A human must **withhold Gate 2** until all items in the exact Exam's “Required evidence
before a human may decide Gate 2” exist: authenticated exact-brief Gate 1 receipt and
in-file audit-note descendant; named qualified human dispositions for all eight RAT rows;
frozen canonical/signature/event/CAS and B01--B12 safe-binding/custody vectors; this
independent Test result plus a fresh-context Critic review; and no unresolved blocker.
Then, and only then, the authenticated Tech Lead may issue or withhold the separate-session
human Gate 2 ruling. This Test Agent does not make that ruling.
