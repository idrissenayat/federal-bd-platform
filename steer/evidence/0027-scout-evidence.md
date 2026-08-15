# Scout evidence — STR-027 signed gate receipts and ratification packages

**Role:** named STEER Scout Agent
**Work item:** [STR-027 / issue #55](https://github.com/idrissenayat/federal-bd-platform/issues/55)
**Workflow:** STEER (frozen)
**Branch:** `codex/str027-scout`
**Deliverable:** `steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md`
**Authority boundary:** Sense-stage Intent Brief and durable Scout evidence only; no
Exam, platform/product implementation, credentials, Flight Board mutation, gate ruling,
PR, deployment, merge, release, closure, or STR-024 human decision

## Authorization provenance

The Codex supervisor reported the following live STEER Work Management trail before
starting this named Scout run:

- Idriss Enayat accepted the AI-prepared delivery forecast for STR-027 at
  `2026-08-15T19:38-04:00`.
- Idriss Enayat used the agent handoff authorization for the assigned Scout Agent at
  `2026-08-15T19:40-04:00`.
- The authorized next action is to draft the STR-027 Intent Brief, publish durable
  evidence, and request human Gate 1 review; it grants no implementation or gate
  authority.

Work Management remains authoritative for the authorization. Issue #55 is the durable
engineering record and scope reference. This evidence does not invent a public Flight
Board event URL, event id, cryptographic receipt, or native platform-agent attestation
that the current bootstrap does not expose.

Codex is the temporary runtime host/supervisor, not the Scout Agent. Because this
bootstrap does not provide the measured workload, distinct agent credential, immutable
run id, signed manifest, model/provider/config digest, or output attestation required by
STR-024's future design, this artifact must not be counted as formal platform-agent
performance or backfilled as native attestation.

## Inputs read

- Repository `AGENTS.md` and `CONTRIBUTING.md`.
- `steer/operating-system/GATES.md`,
  `steer/operating-system/GUARDRAIL-LIBRARY.md`,
  `steer/PROJECT-GUARDRAILS.md`, `steer/SOLO-MODE.md`,
  `steer/operating-system/DECISION-LOG.md`, and
  `steer/operating-system/METRICS.md`.
- `steer/EXPERIMENT-CHARTER.md`, `steer/TEAM-COMMUNICATION.md`,
  `steer/agents/agent-roles.md`, `docs/steer/TOOL-ADAPTERS.md`, and
  `docs/steer/REFERENCE-ARCHITECTURE.md`.
- Exact corrected Codex-supervisor rule at
  `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`, including
  `docs/steer/OPERATING-MODEL.md` and the Docs Agent evidence present in this branch.
- STR-024 frozen Brief at
  `5c0db389d1b0e9fa492a33930febcf4d1c067cb0`, exact corrected Exam and Architect
  evidence at `254226bbb99a07844262d609b11d1b0b36281f9f`, and the pending
  `steer/evidence/0024-gate-1-receipt.md` template.
- Final independent Test evidence at
  `41e131d2250d78e0b71685d1decf1c4c9648db4d` and final fresh Critic evidence at
  `223f4adf237a388bd11f6620b32137329894a14e`.
- GitHub issue #55 as read through the authenticated repository session.

## Evidence-backed problem statement

STR-024 does not have a content-design blocker: the final independent Test passes 41/41
acceptance IDs and the final fresh Critic passes the corrected Exam design. Gate 2 is
still correctly blocked because:

1. its authenticated Gate 1 ruling is not independently exportable as a signed receipt,
   is not human-countersigned in the repository, and is not mirrored by the separately
   authorized signature-only Brief audit-note descendant required by current policy;
2. its exact-Exam RAT decisions and required qualified co-ratifiers are not recorded;
   and
3. its owner/custodian-signed fixed B01–B12 scoring manifest, ciphertext/oracle/
   assertion digests, and custody/access evidence do not exist.

STR-027 is therefore framed as a platform governance/usability capability, not an
implementation shortcut or automatic approval path.

## Brief coverage map

| Required STR-027 concern | Brief disposition |
|---|---|
| Signing/countersignature authority | Done-and-correct 1–5 separate the human decision, issuer signature, human countersignature, in-file recorder, and denied principals. |
| Immutable exact-revision receipt | Done-and-correct 3–5 define the minimum `steer.gate-receipt.v1` fields, canonical coverage, append-only sequence and supersession. |
| AI-prepared editable RAT decisions | Done-and-correct 6–8 require non-blank advisory reasoning, human edit/diff, explicit submission, exact revision, per-RAT attribution and no bulk/automatic judgment. |
| Evaluator-owned B01–B12 manifest/oracle digests | Done-and-correct 9 fixes the STR-024 manifest principals, exact denominator/rubric, signatures, digests and non-selectability. |
| Blind-holdout custody | Done-and-correct 10 prohibits semantic runtime/Codex/UI/Buzz access and defines one-way encryption and contamination handling. |
| Privacy/security | Done-and-correct 11–13 plus the threat model and default-closed decision table address keys, identity, minimization, access, disclosure and retention. |
| Accessibility/human speed | Done-and-correct 6, 14 and 15 require populated reasoning, clear authority/revision/risk, keyboard/screen-reader operation, idempotent success and actionable failure. |
| Rollback/recovery | Done-and-correct 16 stops scoped capabilities while preserving immutable rulings/evidence and requires revalidation before resume. |
| STR-024 dependency | Done-and-correct 17 and exact links in “Problem and why now” bind the final Exam/Test/Critic evidence and preserve the human Gate 2 decision. |
| Corrected Codex boundary | Done-and-correct 18 pins exact `bcf4856f...`, denies deliverable/signing/judgment/evaluator powers, and preserves audited emergency limits. |
| Unresolved consequential choices | The default-closed table names Idriss Enayat as accountable resolution owner, required qualified co-ratifiers/evidence, and the denial state for every gap. |

## Scope and judgment controls

- The Scout did not choose a signing implementation, hosting provider, key service,
  database, canonicalization library, UI framework, model, or evaluator runtime.
- The Brief proposes deterministic canonical/signature properties and presents
  architecture families for later comparison; it does not grant credentials or create
  keys.
- The Scout did not fill any pending STR-024 receipt value, RAT decision, owner key id,
  signature, digest, holdout value, or gate line.
- Existing STR-024 Brief, Exam, receipt template, Test evidence, Critic evidence, and
  operating-model files remain unchanged.
- All unresolved identity/security, privacy, role, evaluation, accessibility, and
  reliability choices are default-closed with a named accountable human owner. A named
  owner to resolve the question is not treated as inferred specialist qualification.
- Gate 1 on STR-027, if approved by the authorized human, authorizes Exam design only.
  It does not authorize implementation or resolve STR-024 Gate 2.

## Independent Critic handoff recommendation

Run a fresh-context Critic against the exact committed Brief and this evidence before a
human Gate 1 ruling. The Critic should attack, at minimum:

1. whether the issuer, human decision-maker, countersigner, repository recorder,
   preparation agent, evaluator/custodian, transport, Codex supervisor, and independent
   verifier can be confused or collapsed into one authority;
2. whether a changed artifact, replayed event, AI default, missing co-ratifier, signer
   outage, public export, or UI retry can become an effective ruling without an exact
   authenticated human action; and
3. whether B09–B12 semantics, keys, or selection information can leak through package
   generation, digest metadata, errors, lengths/timing, Buzz, logs, or reviewer access.

The Critic should derive tags independently and issue at most three blocker/should-fix
findings under the repository role contract. A clean Critic result is advisory; only the
authenticated human Product Lead may decide Gate 1.

## Unresolved human decisions

The Brief's default-closed table is the authoritative summary. The smallest Gate 1
questions are:

1. Does the proposed problem/outcome justify an Exam, with STR-024 as the first vertical
   slice but a provider-neutral platform contract as the scope?
2. Are Idriss Enayat's accountable roles and the default block on unnamed qualified
   security/privacy/Test/accessibility/Ops co-ratifiers correct for this phase?
3. Should the Architect compare the three proposed signer/ledger families without
   changing current GATES/SOLO policy or selecting keys/providers before Gate 2?

No Scout recommendation can answer those human questions or approve Gate 1.

## Validation record

Validation completed at `2026-08-15T19:53:42-04:00` in the isolated Scout worktree.

| Check | Result |
|---|---|
| `./scripts/gauntlet.sh` | PASS in 13.7 seconds — 35 readiness checks passed, one expected missing-SAM-key warning, zero failures; Ruff, mypy and pytest 3/3 passed; gitleaks, `uv.lock` OSV and Semgrep (252 rules / 137 tracked files) were clean. |
| `./scripts/prove-gauntlet-blocks.sh` | PASS — planted synthetic secret and failing test were blocked. |
| `npm ci && npm run lint && npm test` in `flight-board/` | PASS — build completed; ESLint clean; rendered-shell test 1/1 and TypeScript tests 27/27 passed. |
| `npm audit --omit=dev` | PASS — zero production vulnerabilities. |
| Full `npm audit` | QUALIFIED, unchanged dependency posture — zero critical, two high and four moderate dev/build findings. No package or lockfile changed; the time-bounded controls in `docs/security/DEPENDENCY-RISK-2026-08-13.md` remain the governing exception through 2026-08-27 and are not a production certification. |
| Exact remote source commits | PASS — GitHub returned exact `bcf4856f...`, `254226b...`, `41e131d...`, and `223f4ad...`; all referenced paths exist at those revisions. |
| Corrected supervisor ancestry/content | PASS — exact `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de` is an ancestor of the Scout base and the seven corrected boundary/evidence files are byte-unchanged at Scout `HEAD`. |
| STR-024 protected evidence integrity | PASS — the frozen Brief, exact Exam, pending Gate 1 receipt template, and Architect evidence are byte-unchanged from `254226bbb99a07844262d609b11d1b0b36281f9f`. |
| Diff and scope | PASS — `git diff --cached --check` is clean; only the new STR-027 Intent Brief and Scout evidence are staged. No product/platform code, Exam, protected artifact, app data, gate state, or credential changed. |

The exact containing commit and immutable GitHub URLs are supplied in the post-push
Scout handoff rather than guessed inside this pre-commit evidence. Any unavailable
credential, native run attestation, external verifier, qualified human signature, or
holdout evidence remains explicitly unavailable and is not replaced with invented data.
