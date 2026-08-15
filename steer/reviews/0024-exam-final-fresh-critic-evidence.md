# Final fresh Critic evidence — STR-024 corrected Gate 2 Exam

**Final Critic recommendation:** `PASS` the corrected Exam design; `BLOCK` Gate 2
readiness until the exact pre-Gate-2 human/platform evidence below is complete

**Role:** named STEER Critic Agent in a new dedicated worktree; Codex is the runtime
host and this metadata is not named-agent attestation

**Review target:** Architect commit
`254226bbb99a07844262d609b11d1b0b36281f9f`

**Prior Critic target:**
`414f297932643f76e7435195b93b035e9bee5b07`

**Frozen Brief:** `steer/briefs/0024-governed-agent-execution.md` at
`5c0db389d1b0e9fa492a33930febcf4d1c067cb0`

**Critic branch:** `codex/str024-final-fresh-critic-20260815212445`

**Authority boundary:** evidence only. This review does not edit or approve the Brief,
Exam, operating-model documents, implementation, app data, receipt, signature, or gate
state and does not authorize a build, PR, deployment, merge, release, or Gate 2 ruling.

## Integrity and authority verification

- The Brief remains byte-identical to the frozen revision: Git blob
  `57c1f496f76a2940bce09e7b2e3d84cb4f0a1aab`, SHA-256
  `6a5dcf65e1ef6930c7964374d1aaf0220a0810c8d99022c2936c2cb1607c065c`.
- Exact corrected boundary commit
  `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de` is now an ancestor through merge
  `9d0beda03a305961d7fa7967e02e691f9f9f1893`. All seven boundary/evidence files in the
  target are blob-identical to `bcf4856...`; no descendant broadening was found.
- The prior Critic recheck file in the target is byte-identical to `414f297...` blob
  `5f64a03cd92b04e8bbe697497527a7c956a8c7d1`. The exact source commit is parallel and
  is not falsely reported as an ancestor.
- The Gate 1 receipt template binds the exact Brief commit/blob/file SHA-256 and the
  independently reproduced substantive-body SHA-256
  `cf6e63a869375415ba4013c675bf99a0cf298e19e8db46a3cd26680f8ffadc1a`.
  It is prominently `PENDING`, contains no fabricated platform values or signature, and
  expressly requires the platform export, human countersignature and policy-compliant
  signature-only Brief descendant before it becomes evidence.
- The target Architect commit itself is unsigned and un-attested. The Exam and
  Architect evidence correctly exclude historical un-attested work from named-agent
  performance; this review does not infer missing provenance from Git author metadata.

## Resolution of the three `414f297` blockers

### PASS 1 — Named-agent generation is no longer reducible to a signing oracle

The Exam now defines the proof claim narrowly and observably: an independently measured
isolated workload executed the exact signed manifest and generated the final bytes
through an internal sealed finalizer. The remote-attestation quote binds the hardware
root, measured harness/configuration, ephemeral workload key, manifest and nonce. Keys
and plaintext memory are unavailable to Codex/host/adapter; host stdin, debug, mutable
mounts, overrides and unapproved network are disabled. Signed HPKE input is the sole
executable input, provider/tool exchanges enter the sealed trace, and there is no API
that signs caller-supplied bytes or digests.

`STR024-BOOT-001A` now attacks the exact former bypass: Codex supplies known bytes
through the legitimate workload/finalizer path. The independent verifier rejects that
path unless the quote, signed manifest, one-time input, complete trace, sealed finalizer,
fence and artifact all agree. The text also avoids overclaiming: an unsigned provider
response proves only that the measured workload used that response, not that the model
has human-like authorship.

### PASS 2 — Holdout isolation is executable and semantic host access fails closed

The evaluator verifies the workload quote and sends fixed-size padded ciphertext
directly to its ephemeral key. Codex and the transport principal can relay only permitted
ciphertext metadata; plaintext, oracle, assertion, unpadded length or semantic summary
access before scoring is a hard `CONTAMINATED` result. Output returns encrypted to the
evaluator; the oracle never enters the workload; scoring and feedback occur only after
trace/output commitment. Custodian, evaluator, transport and workload principals are
distinct. This resolves the earlier contradiction between necessary opaque transport
and prohibited semantic runtime access.

### PASS 3 — Authority, timing, eligibility and scoring are fixed rather than selectable

- Authority: exact `bcf4856...` is both pinned and incorporated without broader Codex
  powers. The Exam remains equal to or narrower than the operating rule.
- Gate 1 policy: the prepared receipt no longer pretends a detached record satisfies
  current policy. It requires signed platform export, authenticated human
  countersignature and an authorized descendant changing only the two Gate 1 audit lines
  while preserving the approved substantive hash.
- Lifecycle: lease and write fence expire at 120 seconds; stale UI and `RETRY_WAIT` begin
  immediately; 120–150 seconds is explicitly no-write same-agent recovery grace; failure
  commits at 150 seconds if recovery did not start.
- Eligibility: every unique `AUTHORIZED` pilot run in the frozen server sequence is
  included. Failure, stop, contamination, rollback, retry, intervention, human edit and
  missing telemetry cannot be excluded and contribute zero when numerator conditions
  fail. Transport replays remain attempt events for one run.
- Scoring: the benchmark denominator is the first run of each B01–B12, exactly 12 cases;
  missing/failed/contaminated cases remain and score zero. The Boolean allocations are
  fixed at functional 30, contract 30, evidence 25 and clarity 15, totaling 100. The
  canonical RFC 8785 manifest has no optional case, weight, exclusion or runtime
  selection field and requires owner/custodian signatures.

The exact signed scoring manifest and encrypted case/oracle/assertion digests are not
present. That absence is correctly an explicit pre-Gate-2 Test-owner/custodian evidence
requirement; it is no longer an Architect-selectable design placeholder.

## RAT/default stress-test result

No content blocker or should-fix finding remains in the corrected Exam. The identity,
lifecycle and evaluation defaults that previously failed are now conservative,
falsifiable and non-gameable. The previously passing privacy, SLO, canary, accessibility
and dependency proposals remain exact and default-closed. One-adapter behavior is still
honestly labeled conformance with portability `UNPROVEN`; cross-provider proof requires
two materially different adapters.

The ratification table says every row requires authenticated `RATIFIED` or `REVISE`.
The safest policy-consistent reading includes `RAT-SUPERVISOR`: ancestry/content proof
is complete, but the Product/Tech owner should include explicit human ratification of
that boundary in the same exact-revision package rather than treating merge mechanics
as a human decision. `RAT-GATE1-RECEIPT` is satisfied only by the separate receipt and
signature actions below.

## Smallest exact pre-Gate-2 action set

1. **Complete one Gate 1 evidence package.** The platform owner exports and signs the
   canonical `steer.gate-receipt.v1` fields; Idriss Enayat verifies and countersigns the
   receipt through an authenticated repository action; an authenticated human then
   authorizes the signature-only Brief descendant specified in the receipt. Required
   CI/CORE-11 checks must prove the exact substantive hash, sequence, separate session,
   batch limit and two-line-only Brief diff.
2. **Complete one exact-Exam ratification/evaluation package.** Idriss Enayat and any
   separately qualified owners record `RATIFIED` or `REVISE` for `RAT-IDENTITY`,
   `RAT-LIFECYCLE`, `RAT-PRIVACY`, `RAT-SLO`, `RAT-EVAL`, `RAT-CANARY`, `RAT-A11Y`,
   `RAT-DEPS` and, conservatively, `RAT-SUPERVISOR`, all tied to
   `254226bbb99a07844262d609b11d1b0b36281f9f`. The named Test owner/custodian attaches
   the signed canonical B01–B12 manifest, aggregate digest, ciphertext/oracle/assertion
   digests and custody/access evidence.
3. **Finish independent evidence and human judgment.** This artifact supplies the final
   fresh Critic design review. A Test Agent must independently re-test exact
   `254226bbb99a07844262d609b11d1b0b36281f9f`. Only after actions 1–2 and that Test
   evidence exist may the authorized human decide Gate 2 in the required separate
   session. Nothing here records or recommends automatic approval.

## Properly post-Gate-2 implementation evidence

Do not require these artifacts to approve the test design, and do not mistake their
future absence at build verification for a waiver:

- implementation of the hardware-backed isolated workload, manifest issuer, HPKE
  delivery, sealed trace/finalizer, independent verifier, per-actor event ledger,
  adapters, outbox, UI, storage and telemetry;
- deterministic endpoint, denial, race, replay, signer-oracle, contamination,
  accessibility, load, restore, rollback and adapter-conformance test results against an
  exact implementation commit;
- real bootstrap/hostile-host attestations and a named-agent run trace; production
  privacy/access evidence; canary results; and one- versus two-provider portability
  evidence; and
- any performance claim for the historical Architect/Test/Critic artifacts. Their
  missing attestation cannot be backfilled.

## Validation record

- Brief Git-blob and SHA-256 comparison — PASS, no byte changed.
- Exact `bcf4856...` ancestry and seven-file blob comparison — PASS.
- Gate 1 substantive-body hash reproduction — PASS.
- Scoring allocation arithmetic — PASS: 30 + 30 + 25 + 15 = 100.
- Acceptance/RAT inventory — PASS: 41 unique acceptance IDs and ten `RAT-*` rows.
- Bootstrap instruction/input/output SHA-256 reproduction — PASS for all three hashes.
- `uv run pytest -q tests/test_repository_contract.py` — PASS, 3 tests.
- `./scripts/gauntlet.sh` — PASS: 35 readiness checks, one expected missing-SAM-key
  warning, zero failures; Ruff, mypy, pytest, gitleaks, OSV and Semgrep passed.
- `git diff --check` and scope check — PASS. Only this final Critic evidence file is
  added; no protected artifact, app data or gate state is changed.

## Final disposition

**Corrected Exam design: `PASS`. Gate 2 readiness: `BLOCK` only on the three
pre-Gate-2 human/platform actions above.** All three `414f297` content blockers are
resolved. No protected artifact change, implementation, deployment, merge, release, PR,
gate approval or historical agent-performance claim is authorized by this evidence.
