# Fresh Critic evidence — STR-027 Intent Brief

**Gate 1 readiness recommendation:** `BLOCK`

**Role:** named STEER Critic Agent in a fresh isolated worktree; Codex is the
temporary runtime host, and this Git record is not native named-agent attestation

**Exact review target:** Scout commit
`08888804dcba179dcc66e8d081badd9bd13feaac` on `codex/str027-scout`

**Critic branch:** `codex/str027-fresh-critic-20260815`

**Files reviewed:**

- `steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md`
- `steer/evidence/0027-scout-evidence.md`

**Authority boundary:** Critic evidence only. This review does not edit or approve
the Brief, Scout evidence, STR-024 artifacts, operating-model documents, product or
platform code, Flight Board state, credentials, signatures, receipts, ratifications,
or gate state. It does not authorize an Exam, implementation, PR, deployment, merge,
release, closure, STR-024 Gate 2 decision, or any access to blind holdouts.

## Executive result

The Scout chose a valid problem, preserved the human-only decision boundary, derived
the required risk tags, and produced a detailed, falsifiable design intent. Principal
separation, stale/replay rejection, default-closed human ratifications, correction by
supersession, accessible review, rollback, and fixed B01–B12 denominator rules are
materially stronger than the current prototype.

Human Gate 1 is nevertheless not ready. Two Brief requirements admit an unsafe or
unimplementable result, and the Scout validation record contains one objective factual
error. These are bounded corrections; they do not require selecting a provider, key
service, algorithm, retention period, co-ratifier roster, accessibility matrix, or
RPO/RTO before Gate 1.

## Material findings

### 1. BLOCKER — the receipt's signed object is self-referential, and effect timing is ambiguous

The Brief requires `steer.gate-receipt.v1` to contain the issuer signature and
verification result and then says the signature covers **every field** (Brief lines
102–110). A signature cannot generally sign canonical bytes that include the signature
itself. A verification result is also derived after signature creation and may vary by
verifier time, trust store, or revocation state; it is not stable signed payload data.

The same protocol says the issuer signs only **after** the authenticated human ruling
is committed (lines 93–101), while reliable submission must produce exactly one
`ruling/receipt` or a failure (lines 193–198). It never states whether that already
committed ruling becomes effective before signature and independent verification. On
signer outage or crash between those steps, one implementation can expose an unsigned
effective decision while another can retry into a second effect. Both contradict the
guardrail measure and the intended idempotent human experience.

**Impact:** the normative receipt cannot be implemented as written, and a signer
failure can split human intent, authoritative gate state, and durable proof. An
independent verifier could neither reproduce the signed bytes nor determine safely
whether the gate/RAT action took effect.

**Fastest safe disposition:** revise the Brief to define two explicit objects/states:

1. an append-only human decision intent that remains `PENDING_PROOF` and has no gate/RAT
   effect; and
2. a canonical payload that excludes its signature and derived verification result,
   wrapped by a detached/protected signature envelope whose issuer/key/algorithm
   metadata is cryptographically bound.

Commit the signed receipt and the authoritative `EFFECTIVE` transition atomically, or
use one idempotent transaction/outbox state machine that provably yields the same
effect. Append verification, revocation, supersession, and failed-attempt events
separately without rewriting the signed payload. No UI, Git note, Buzz mirror, or
dependent gate may present `PENDING_PROOF` as effective.

### 2. BLOCKER — the permitted holdout digest can disclose low-entropy assertions

The Brief correctly denies B09–B12 plaintext, oracles, assertions, unpadded lengths,
semantic summaries, and decryption material to Work Management, Codex, transport,
Buzz, logs, public evidence, and the evaluated workload (lines 154–162 and 272–273).
However, it permits those surfaces to receive unspecified "digests" (lines 154–160),
requires an export with cryptographic digests (lines 163–169), and preserves the exact
STR-024 manifest whose fields include a raw `assertion-set SHA-256` rather than an
explicit ciphertext digest. A plain hash is not a confidentiality boundary for a small
or enumerable assertion/oracle space: an unauthorized reviewer can hash guesses and
recover the hidden meaning.

The threat model explicitly names leakage through digest metadata (lines 292–304), so
the current mitigation contradicts the stated risk rather than merely leaving a vendor
parameter open.

**Impact:** the first STR-024 vertical slice can contaminate B09–B12 before scoring
while still satisfying the Brief's literal export/digest requirements. That defeats
the blind-evaluation evidence and can bias or invalidate the fixed first-run
denominator.

**Fastest safe disposition:** require every holdout-sensitive assertion/oracle field
visible outside the custodian/evaluator boundary to be a digest of randomized,
fixed-size ciphertext or a domain-separated high-entropy commitment. Never export a
raw hash of low-entropy plaintext, assertion identifiers, or semantic structures.
Bind the commitment to manifest id, candidate, case id, revision, and custodian nonce;
keep any opening material custodian/evaluator-only; test offline-dictionary, cross-case
correlation, length, timing, error, log, Buzz, and public-export leakage. If this safely
narrows `assertion-set SHA-256`, record that exact interpretation in the STR-024
ratification package rather than silently changing the frozen Exam.

### 3. SHOULD-FIX BEFORE THE HUMAN RELIES ON THE SCOUT EVIDENCE — validation overstates its comparison

Scout evidence line 153 reports that “the seven corrected boundary/evidence files” are
byte-unchanged from exact commit `bcf4856f...`. Independent `git show`,
`git diff-tree`, and blob comparison show that `bcf4856f...` changes exactly two files:
`docs/steer/OPERATING-MODEL.md` and
`steer/evidence/docs-agent-codex-supervision-boundary-2026-08-15.md`. Both are present
and byte-identical at the Scout target, so the substantive boundary is intact; the
reported count is still false.

**Impact:** an auditor cannot reproduce the validation record as written. Leaving the
miscount uncorrected weakens confidence in the very exact-revision evidence capability
STR-027 is meant to establish.

**Fastest safe disposition:** a successor Scout revision should replace “seven” with
“two,” enumerate both exact paths and blobs/hashes, and rerun the scope/integrity check.
Do not rewrite the original run or mislabel the correction as Critic/host work.

## Adversarial disposition of the requested attack surface

| Attack | Result at this revision |
|---|---|
| Authority/principal collapse | `PASS` at Brief level. Human decider, issuer, countersigner, in-file recorder, preparation agent, evaluator, custodian, transport, verifier, and Codex are distinct capabilities; missing qualified owners block. Exact identity technology and co-ratifier roster are legitimate Gate 2 ratifications. |
| Replay, stale state, changed artifact | `PASS` at Brief level. Exact repository/commit/path/blob/file/body hashes, linked monotonic events, idempotency, supersession, and noninheritance by new revisions are testable. The Exam must supply concurrency and canonicalization vectors. |
| Signing oracle / signer outage | `BLOCK` through finding 1. Key isolation and denial language are sound, but the signed-object boundary and effective transition are not coherent yet. |
| AI-default manipulation | `PASS` at Brief level. The AI draft is advisory, populated, versioned/digested, editable with a visible diff, individually attributable, and cannot select, bulk-submit, or silently approve. The later Exam must attack prompt injection, evidence substitution, model/config drift, automation bias, and empty/error states. |
| Countersigner independence | `PASS` for Gate 1 framing. A distinct authenticated human action is required when policy requires it, and missing qualification blocks. Which roles may be combined is correctly deferred to named human ratification. |
| Public/private disclosure and retention | `PASS` for Gate 1 framing except the holdout commitment blocker in finding 2. Receipt/RAT field allowlists, least privilege, legal basis, retention, deletion/pseudonymization, backup expiry, and public disclosure remain explicitly default-closed. |
| Accessibility | `PASS` at Brief level. Keyboard, supported screen-reader, focus recovery, non-color states, error/recovery states, and exact review information are specified; the support matrix and qualified evidence owner may be ratified later. |
| Audit/event immutability | `PASS` except the receipt-envelope/effect issue in finding 1. Append-only events, failed attempts, correction by successor, sequence, and projection reconstruction are explicit. |
| Rollback/recovery | `PASS` at Brief level. Scoped capability stops preserve authoritative records and require identity/key/sequence/revision revalidation before resume. |
| STR-024 circular dependency | `PASS` as a Gate 1 scope question, not a hidden waiver. STR-027 can use the current GATES/SOLO authenticated in-file note plus repository/CI evidence for its own pre-feature gates; it does not need to pretend its unbuilt receipt implementation already exists. The future Exam must state this one-time bootstrap path explicitly and must not use STR-027 to retroactively invent STR-024 evidence. |
| B01–B12 leakage/contamination | `BLOCK` only through finding 2. Distinct principals, exact first B01–B12 denominator, fixed 30/30/25/15 scoring, zero for missing/fail/contamination, no replacement runs, and one-way encrypted custody otherwise prevent selection and denominator gaming. |

## Human decisions legitimately deferred after the blockers are corrected

Gate 1 need not choose a signer vendor, key service, database/ledger family,
canonicalization/signature algorithm, public receipt fields, retention duration,
deletion/pseudonymization schedule, final co-ratifier matrix, AI model/config,
accessibility support matrix, availability target, RPO/RTO, or evaluator runtime.

Before Gate 2/implementation, the authorized humans and qualified domain owners must
ratify those exact values and the system must stay in the Brief's named default-deny
state while any is unresolved. In particular, this Critic neither appoints qualified
security/privacy/Test/accessibility/Ops owners nor recommends a STR-024 Gate 2 ruling.

## Integrity and scope verification

- `08888804dcba179dcc66e8d081badd9bd13feaac` exists locally and on the configured
  GitHub origin; this Critic worktree and branch were created directly from it.
- The Scout commit adds only the STR-027 Brief and Scout evidence.
- Corrected supervisor boundary commit
  `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de` is an ancestor of the Scout target.
  Its two changed files are blob-identical at the Scout target.
- STR-024 corrected Exam commit
  `254226bbb99a07844262d609b11d1b0b36281f9f` is an ancestor of the Scout target.
  The protected STR-024 Brief, Exam, Gate 1 receipt template, and Architect evidence are
  byte-unchanged from that revision.
- Final Test commit `41e131d2250d78e0b71685d1decf1c4c9648db4d` and final Critic commit
  `223f4adf237a388bd11f6620b32137329894a14e` exist on the configured GitHub origin and
  contain the exact referenced review paths. They are parallel evidence commits, not
  falsely treated as ancestors of the Scout target.
- GitHub issue #55 is open and its assigned role, Sense-stage next action, boundaries,
  and STR-024 dependency match the Scout scope.
- The frozen STR-024 Brief and Exam, blind holdouts, signatures, credentials, app data,
  and gate state were not changed or accessed beyond permitted public/repository text.

## Validation record

| Check | Result |
|---|---|
| `./scripts/gauntlet.sh` | PASS — 35 readiness checks, one expected missing-SAM-key warning, zero failures; Ruff, mypy, pytest 3/3, gitleaks, `uv.lock` OSV and Semgrep (252 rules / 138 tracked files) passed. |
| `./scripts/prove-gauntlet-blocks.sh` | PASS — planted synthetic secret and failing test were blocked. |
| `npm ci && npm run lint && npm test` in `flight-board/` | PASS — build and lint passed; rendered shell 1/1 and TypeScript tests 27/27 passed. |
| `npm audit --omit=dev` | PASS — zero production vulnerabilities. |
| Full `npm audit` | QUALIFIED, unchanged — zero critical, two high and four moderate dev/build findings; no package or lockfile changed. |
| Exact origin commit/path checks | PASS — Scout and all four pinned source commits resolve from GitHub; issue #55 resolves; referenced files exist. |
| Ancestry/content checks | PASS with one Scout evidence misstatement — `bcf4856...` and `254226b...` are ancestors; protected files are unchanged; `bcf4856...` contains two changed files, not seven. |
| Scope | PASS — only this new Critic evidence file is added on the Critic branch. No Brief, Exam, implementation, prior evidence, gate, credential, app data, or protected artifact changed. |

## Final disposition

**`BLOCK` human Gate 1 readiness at Scout revision `08888804...`.** Correct the
canonical signed-envelope/effective-transition contract, prevent low-entropy holdout
hash disclosure, and correct the reproducibility error in the Scout evidence. Then run
a new fresh-context Critic against the exact successor revision. A future clean review
remains advisory; only the authenticated human Product Lead may decide Gate 1.
