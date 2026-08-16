# Exam — 0027 Signed gate receipts and editable ratification packages

**Brief:** `steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md`
**Exact approved Brief revision supplied by STEER:** `b15efdc2355089c90c943eaa374d0b5e290b5343`
**Fresh Critic evidence:** `steer/reviews/0027-final-fresh-critic-recheck-evidence.md` at `5337659ca59504d9ffa9106cfa03e45f06a90171`
**Guardrails in force:** CORE-01..11, SEC-01..05, PRIV-01..03, A11Y-01..03,
REL-01..04, DES-01..02
**Status:** Architect draft for independent Test/Critic review and authenticated human
Gate 2 decision; not approved for implementation

## Authority and test conventions

Work Management remains authoritative. A repository line, signature service, AI draft,
GitHub state, Buzz message, display name, or successful cryptographic operation cannot
create human decision intent. The system under test must distinguish the authenticated
human decider, issuer, countersigner, in-file recorder, preparation agent, verifier,
fixture custodian, evaluator, runtime transport, evaluated workload, and Codex host as
separate principals and capabilities.

All protocol fixtures use public synthetic identities and content. No test receives a
production key, credential, private reasoning, personal profile, or B09–B12 plaintext,
semantic summary, oracle, assertion, opening, decryption material, unpadded length, or
stable low-entropy hash. A result is `PASS` only when the named positive and negative
oracles are reproducible against the same implementation revision. Missing evidence is
`BLOCK`, never an inferred pass.

The Builder must publish deterministic conformance fixtures for the ratified protocol:
canonical payload bytes, protected-header bytes, exact domain-separated length-delimited
signed bytes, payload/envelope/event digests, valid and invalid signatures, event chains,
and state projections. Each fixture records schema/profile/algorithm versions and exact
hex/base64 encodings. Independent Test regenerates—not merely snapshots—those values.

## Gate 2 ratification inputs — default closed

The following choices remain human decisions. The AI-prepared package must be populated
and editable, but its proposals are not rulings. No implementation authorization or
Gate 2 approval exists until the named accountable human and every required qualified
co-ratifier record `RATIFIED` or `REVISE` against this exact Exam revision.

| RAT id | Accountable human | Required qualified human/evidence | Decision that must be recorded | Default while unresolved |
|---|---|---|---|---|
| `RAT-SIGN` | Idriss Enayat, Product/Tech owner | Named identity/security owner — **unresolved** | Canonicalization profile, integer/length encoding, signature algorithm, issuer trust root, key service, rotation/revocation and historical-verification policy | No production signer, countersigner, or effective export |
| `RAT-PRIVACY` | Idriss Enayat, Product/data owner | Named privacy/data owner — **unresolved**; approved data inventory | Private/public receipt fields, reason visibility, lawful basis, access, retention, deletion/pseudonymization, backup expiry and audit cadence | Private least-privilege access; no public disclosure |
| `RAT-ROLES` | Idriss Enayat, Product/Tech owner | Named domain owners — **unresolved** | Gate/RAT owner and co-ratifier matrix, permitted role stacking, countersignature/in-file-note sequence | Missing qualified owner blocks the affected RAT/gate |
| `RAT-POLICY` | Idriss Enayat, Product/Tech owner | Independent Test evidence for CORE-10/11 | Supported Gate/RAT types, artifact/body hash rules, session/cooling-off/batch policy and supersession sequence | Existing GATES/SOLO rules govern; STR-027 cannot weaken them |
| `RAT-AI` | Idriss Enayat, Product owner | Named Test owner plus privacy/security review — **unresolved** | Preparation agent/model/config, evidence allowlist, error/confidence behavior, prompt-injection controls and edit-diff retention | Generation limited to synthetic test data; no silent blank/default |
| `RAT-EVAL` | Idriss Enayat, Product/experiment owner | Named human Test owner and fixture custodian — **unresolved** | Distinct B01–B12 principals/keys; safe binding mode; fixed-size profile; manifest vectors; exact STR-024 `assertion-set SHA-256` interpretation; access and contamination response | `UNRATIFIED`; no raw assertion digest, valid manifest, score, RAT-EVAL or STR-024 Gate 2 package |
| `RAT-A11Y` | Idriss Enayat, Product owner | Named qualified accessibility/design owner — **unresolved** | Supported browser/AT/viewport matrix, WCAG target and manual evidence owner | No production-readiness or accessibility claim |
| `RAT-SLO` | Idriss Enayat, Tech owner | Named Ops/reliability owner — **unresolved** | Availability/latency, RPO/RTO, reconciliation, scoped disable/recovery commands and rollback owner | Fail closed, preserve records, stop new affected actions during degradation |

A generated package must show these unresolved owner gaps rather than preselect a value,
appoint Idriss as every specialist, or let an agent/Codex fill the gap.

## Acceptance tests

### Authority, intent, role and artifact binding

- **STR027-AUTH-001 — Human-only submission.** Given every principal type and every
  Gate/RAT endpoint at UI, API, worker and persistence boundaries, only an authenticated
  human whose current organization/POD/project/item role satisfies the ratified matrix
  can create a `DecisionIntent/v1`; agent, Codex, issuer, adapter, evaluator, transport,
  verifier, Buzz/link-preview, generic service, forged display name and cross-tenant
  attempts return a safe denial and append an attempt audit event with no intent/effect.
- **STR027-AUTH-002 — Deliberate intent.** Opening, viewing, generating, editing, timing
  out, pressing Enter outside the confirmed action, or receiving an AI recommendation
  creates no intent. One explicit authenticated submit with a stable idempotency key
  creates exactly one append-only `PENDING_PROOF` intent and no Gate/RAT effect.
- **STR027-AUTH-003 — Current-policy check.** Submission and proof acceptance each
  re-evaluate actor account/type/role, tenant/scope, target revision, evidence presence,
  sequence, cooling-off/session policy and required owner matrix. Revocation or drift
  between the two holds the intent ineffective and records a safe failure.
- **STR027-AUTH-004 — Exact artifact.** Repository/URI, commit, path, Git blob, file
  SHA-256 and policy-defined substantive-body SHA-256 reproduce from exported evidence.
  Path substitution, same-path new commit, body change, history rewrite, inaccessible
  object or new revision fails closed and never inherits an earlier ruling.
- **STR027-AUTH-005 — Capability separation.** The issuer may sign only a durable exact
  human intent and cannot create/change intent; a countersigner performs a distinct
  authenticated human action bound to the effective receipt digest; an in-file recorder
  has only the separately authorized audit-line capability. No shared token or service
  capability collapses these authorities.
- **STR027-AUTH-006 — Gate lineage.** Gate 1 binds the exact approved Brief lineage;
  Gate 2 binds that lineage, this exact Exam, required Test/Critic results and RAT set;
  Gate 3 binds signed Brief/Exam lineage, exact verified build and domain evidence.
  A receipt cannot waive GATES/SOLO in-file notes, session separation, cooling-off,
  co-signers or independent-reader requirements.

### Canonical payload, detached envelope and verification

- **STR027-SIGN-001 — Signature-free payload.** Schema validation and planted fixtures
  prove `steer.gate-receipt.payload.v1` contains exactly the Brief's allowlisted fields
  and contains no signature, verification result/state, verifier, trust snapshot,
  resolved key, secret, prompt, profile, private reasoning or holdout semantics.
- **STR027-SIGN-002 — Protected header.** The deterministic header contains only envelope
  schema, payload media type/SHA-256, issuer principal, key id, ratified algorithm and
  canonicalization profile, purpose/audience and signing time. Unknown, duplicate,
  noncanonical, unprotected security-critical or mismatched fields are rejected.
- **STR027-SIGN-003 — Exact signed bytes.** For every approved vector, independent Test
  regenerates exact bytes for `"STEER_GATE_RECEIPT_V1\0" || length(header) || header ||
  length(payload) || payload` using the `RAT-SIGN` encoding and obtains the frozen
  digest/signature. Omitted domain separator, ambiguous concatenation, alternate Unicode,
  number/key ordering, whitespace, duplicate-key, normalization, length or media-type
  encodings fail verification.
- **STR027-SIGN-004 — Detached envelope.** `steer.gate-receipt.signature.v1` stores exact
  protected-header bytes, payload digest and signature; the signature is absent from the
  signed bytes. Payload/header/envelope substitution, signature transplant across item,
  tenant, audience, purpose or schema, and appended/truncated bytes fail closed.
- **STR027-SIGN-005 — Key and identity policy.** Valid-current, rotated-historical,
  unknown, revoked-before-sign, revoked-after-sign, compromised, wrong-tenant,
  principal-type-confused, expired-trust-snapshot and unavailable-key-service vectors
  follow the exact `RAT-SIGN` policy and preserve historical verification evidence.
- **STR027-SIGN-006 — Signing-oracle resistance.** The issuer accepts only an authorized
  pending intent, reconstructs payload from authoritative records, enforces exact
  purpose/audience/scope and refuses caller-supplied arbitrary bytes. Known-byte,
  cross-protocol, replay, changed-role/revision and compromised-host requests cannot
  yield a valid effective receipt.
- **STR027-SIGN-007 — Derived verification event.** Verifier/version/time, trust and
  revocation snapshot, resolved public-key state, canonicalization/signature/role/
  sequence outcomes, warnings/errors and overall result exist only in append-only
  `ReceiptVerification/v1`, bound to intent/payload/envelope digests. Reverification
  appends a new event and never mutates signed bytes or earlier events.
- **STR027-SIGN-008 — Independent export verification.** A clean offline verifier with
  allowlisted public evidence and trust material reconstructs canonical bytes, hashes,
  ancestry/body invariants, signature, scope, sequence, supersession and required
  evidence without private keys, prompts, holdouts, openings or mutable app state.

### Atomic and idempotent effective transition

- **STR027-EFF-001 — State machine.** The exhaustive valid path is `no intent` →
  `PENDING_PROOF` → (`EFFECTIVE` or append-only `PROOF_FAILED` attempts while remaining
  ineffective). Correction creates a new superseding intent. Direct-to-effective,
  pending-as-approved, mutation/deletion and terminal rewrite are impossible at the
  server/data layer.
- **STR027-EFF-002 — Pre-commit crash matrix.** Kill after intent commit, payload build,
  signing request, signature generation, envelope receipt and verification but before
  the effect transaction. Every projection remains ineffective; retry derives the same
  payload, and no mirror/dependent action represents approval.
- **STR027-EFF-003 — Atomic effect.** Fault injection at every write proves one durable
  transaction either appends accepted payload/envelope/verification, CAS-transitions
  the intent exactly once, updates the Gate/RAT projection and enqueues mirrors, or
  commits none. No externally observable partial authority state exists.
- **STR027-EFF-004 — Concurrency and CAS.** At least 100 concurrent signer/retry workers
  for one unchanged intent may generate proof, but exactly one envelope is accepted,
  exactly one effective transition/event sequence exists and every successful caller
  receives the same receipt. Competing changed bytes are rejected and preserved safely.
- **STR027-EFF-005 — Post-commit crash/retry.** Kill after transaction commit and before
  response, then retry with the same idempotency key: the system returns the existing
  intent/effective receipt and emits no duplicate decision, projection or dependent
  action. Reusing the key with changed intent returns conflict, never overwrite.
- **STR027-EFF-006 — Failure honesty.** Signer/verification/storage/role/revision/sequence
  failures append safe `PROOF_FAILED` attempts with owner, code, next check and retry
  eligibility. Unknown error is non-retryable pending human/Ops review. UI and exports
  cannot label the ruling effective.
- **STR027-EFF-007 — Ordering, replay and supersession.** Previous event/receipt digest
  and monotonic sequence reject old, duplicate, gap, fork and reordered events. A new
  authenticated superseding decision links and preserves its predecessor; prior and
  current status are independently reconstructable.
- **STR027-EFF-008 — Mirror non-authority.** Delay, duplicate, reorder, corrupt or lose
  outbox, Git and Buzz delivery. Authoritative state remains the ledger projection;
  reconciliation converges without creating intent/effect or leaking disallowed data.

### Editable AI-prepared Gate/RAT packages

- **STR027-RAT-001 — Complete non-blank preparation.** Every required RAT package binds
  exact Exam commit/blob/SHA, RAT id/proposed value, plain-language summary, evidence
  links/digests, risks/dependencies, `RATIFY`/`REVISE` recommendation, editable proposed
  reasoning, required owner/co-ratifier and effects. Missing generation/evidence yields
  an explicit blocked/error state, never a blank required field or default approval.
- **STR027-RAT-002 — Advisory provenance.** Package records preparation principal,
  agent/model/config/prompt-template/evidence-set versions and AI-draft digest without
  exposing hidden prompts/private reasoning. Changed target, evidence or configuration
  visibly invalidates/stales the draft and dependent action.
- **STR027-RAT-003 — Full edit and diff.** Keyboard and supported AT users can edit every
  advisory field, restore/review changes and inspect a semantic plus exact-text diff
  between AI draft and submitted human reasoning. Submission binds both immutable draft
  digest and final reasoning; edits are never attributed to AI.
- **STR027-RAT-004 — No automated judgment.** Recommendation generation, focus, click,
  timeout, keyboard shortcut, agent/API call, copied decision or AI text cannot select
  or submit. Each RAT requires deliberate individual human attribution; no bulk
  “approve all,” inherited decision or silent incompatible combination is accepted.
- **STR027-RAT-005 — Dependency/role enforcement.** Missing evidence/qualified owner,
  unresolved Critic blocker, incompatible RAT, invalid order or target drift blocks the
  affected RAT and dependent gate with actionable status. Permitted role stacking must
  match `RAT-ROLES`, not account ownership or display identity.
- **STR027-RAT-006 — Prompt/evidence attack.** Injected evidence, HTML/Markdown/script,
  link-preview content, model instruction, hidden text, Unicode spoofing and substituted
  digest cannot alter authority controls, conceal risk, fetch secrets/holdouts or cause
  submission. Rendered content is escaped and external evidence remains untrusted.
- **STR027-RAT-007 — RAT receipt.** Human RAT ruling records actor/account/type/role,
  exact target, decision, final reasoning, AI-draft/version digest, evidence-set digest,
  time/session, predecessor/supersession and verified event/signature proof; replay and
  changed-target packages fail exactly like Gate receipts.

### Blind B01–B12 manifest, custody and anti-leakage

- **STR027-BLIND-001 — Fixed manifest.** Owner and distinct custodian sign RFC 8785
  `str024.scoring-manifest.v1` bytes before a candidate run. It fixes exact Exam,
  candidate, principal/config, exactly-first B01–B12 case-run denominator, Boolean
  assertions, 30/30/25/15 allocation, hard-fail codes, safe bindings and aggregate
  digest, with no optional case/weight/exclusion/replacement/evaluator-selected field.
- **STR027-BLIND-002 — Distinct custody.** Owner, custodian, evaluator, runtime transport
  and workload authenticate as distinct principals with least privilege. B09–B12
  plaintext/oracles/assertions/openings/decryption material and semantic metadata are
  available only to custodian/evaluator; access is append-only audited and denied to
  AI preparer, Codex, prompt author, transport, workload tools/retrieval, UI, Buzz, logs
  and public export.
- **STR027-BLIND-003 — Randomized ciphertext mode.** If `RAT-EVAL` selects ciphertext,
  vectors prove randomized fixed-size authenticated ciphertext whose protected AAD binds
  manifest id/revision, Exam/candidate digests, case id, fixture revision and purpose.
  Bit change, wrong AAD, deterministic/reused nonce, variable/unpadded length, case/
  candidate/revision substitution or cross-protocol replay is rejected/contaminated.
- **STR027-BLIND-004 — Commitment mode.** If `RAT-EVAL` selects commitment, vectors prove
  domain-separated length-delimited commitment over the same fields, canonical secret
  digest and a fresh custodian-generated opening with at least 256 bits entropy per
  case/candidate/manifest/revision. Exported, short, reused, deterministic, unbound or
  dictionary-matchable openings/bindings are rejected/contaminated.
- **STR027-BLIND-005 — One-way delivery.** Fixed-size authenticated evaluator/custodian →
  workload input and workload → evaluator output reveal no oracle/opening/semantic
  secret to the transport/workload. Oracle access occurs only after immutable candidate
  output/trace commitment. Timing, size, count, error, retry, URL and log side channels
  stay within the ratified non-semantic allowlist.
- **STR027-BLIND-006 — Contamination.** Premature semantic/opening access, raw/stable
  low-entropy hash, dictionary matchability, cross-case linkability, substitution,
  material reuse or unauthorized principal access marks the affected evaluation
  `CONTAMINATED`, preserves it as zero/fail in the frozen denominator and requires fresh
  custodian material plus a new signed manifest; it cannot be replaced or hidden.
- **STR027-BLIND-007 — Public synthetic B01–B08.** Explicitly ratified public fixture
  content may be linked only in a differently named public-evidence field. That does not
  relax B09–B12 controls or permit the ambiguous `assertion-set SHA-256` field.
- **STR027-BLIND-008 — STR-024 ambiguity default.** Before valid `RAT-EVAL`, any attempt
  to populate/export STR-024 `assertion-set SHA-256` as a raw assertion hash, issue a
  valid manifest/score, or include it in a Gate 2 package is rejected. After ratification,
  only option A's randomized fixed-size assertion-ciphertext semantics and frozen vectors
  pass, unless a separately governed STR-024 Exam revision replaces the field.

### Privacy, security, accessibility and human feedback

- **STR027-UX-001 — Review hierarchy.** First viewport exposes exact target, AI advisory,
  why/evidence/risks/missing items, required role and consequence before controls.
  Advisory draft, human edit, pending intent, proof failure, effective ruling, blocked,
  superseded, stale and signature-invalid states are text-labeled and not color-only.
- **STR027-UX-002 — Keyboard/focus.** Against the `RAT-A11Y` matrix, all evidence expand,
  edit, diff, submit, request-revision, error recovery and receipt verification paths are
  keyboard operable with logical order, visible focus and no trap; after validation,
  signing or recovery, focus moves to the error/status heading without data loss.
- **STR027-UX-003 — Screen reader and visual access.** Automated axe and manual named-
  owner evidence confirm accessible names/relationships, status announcements without
  flooding, table/diff alternatives, 400% zoom/reflow, reduced motion, WCAG contrast and
  no hidden state. Exact target and effect are announced before confirmation.
- **STR027-UX-004 — Honest latency.** UI immediately acknowledges durable
  `PENDING_PROOF` but never says approved/ratified until the atomic transaction returns
  exact receipt, target and event sequence. Refresh, double-submit, offline/online,
  timeout and back navigation return the durable state without an ambiguous enabled
  action or lost human edits.
- **STR027-SEC-001 — Secrets.** Secret scanning plus runtime canaries prove private keys,
  credentials, tokens, holdout material and openings never enter prompt/browser/Git/
  Buzz/log/analytics/export/fixture/agent-tool surfaces. Redaction errors fail closed.
- **STR027-SEC-002 — Endpoint matrix.** Every read/generate/edit/submit/sign/countersign/
  record/verify/export/recover/admin endpoint has explicit authn, tenant/scope authz,
  input/schema/size/rate checks and CSRF/replay protections; IDOR, injection, XSS, SSRF,
  mass assignment and confused-deputy vectors fail safely and are audited.
- **STR027-PRIV-001 — Data allowlist.** Schema and export tests permit only ratified
  minimal identity/role/decision/revision/reason-evidence digest/sequence/audit fields;
  profiles, credentials, prompts, private reasoning, restricted data and holdout
  semantics are rejected/redacted before persistence and every downstream sink.
- **STR027-PRIV-002 — Lifecycle.** Data inventory records field purpose/legal basis/
  access/publicity/retention. Ratified deletion or pseudonymization removes personal
  display data within the chosen period, preserves only permitted non-identifying
  integrity tombstones, reaches backups by expiry and leaves signatures/verifiability
  with the exact documented limitation; legal hold and denial paths are audited.
- **STR027-PRIV-003 — Access/export.** Cross-tenant, expired-role, revoked-user, guessed
  id, overbroad audit, public-link and export-downgrade attacks fail. Export applies the
  same or narrower allowlist as source, records requester/purpose/scope and never carries
  holdout openings, semantic secrets or non-allowlisted reason text.

### Recovery, rollback, performance and observability

- **STR027-REC-001 — Scoped disable.** Independently disable AI generation, decision
  submission, signing, countersigning, export and evaluator delivery. Each switch blocks
  only new affected operations, leaves pending/effective truth explicit, preserves all
  decisions/proofs/custody and cannot be bypassed through API/worker/replay.
- **STR027-REC-002 — Restore/replay.** From the ratified backup point, replay append-only
  events into an empty projection and reproduce every intent, receipt/envelope digest,
  verification, sequence, supersession, RAT dependency and custody status with zero
  unexplained mismatch within ratified RPO/RTO. Cache/search/Buzz/Git outage cannot
  become authority.
- **STR027-REC-003 — Resume.** After outage, compromise or rollback, a named Ops owner
  must revalidate identity, trust/key/revocation state, sequence, idempotency, exact
  revisions, evidence/custody access, outbox and derived views before enabling a scoped
  capability. Stale pending work is reconciled, not auto-effective.
- **STR027-REL-001 — Load/latency.** Under the `RAT-SLO` concurrency and payload profile,
  generation, submit, effective transition, verification/export and review render meet
  ratified p95/p99/error targets with zero duplicate effects, dropped audit events,
  authority leaks or unannounced missing telemetry. Queue time is reported separately.
- **STR027-REL-002 — Dependency and key-service degradation.** Slow/unavailable signer,
  trust store, repository, verifier, outbox, model and evaluator scenarios expose owner,
  safe status, next check and retry eligibility; circuit breaking/backpressure prevents
  a signing storm, while authorized unrelated reads remain available.
- **STR027-REL-003 — Telemetry safety.** Every operation emits allowlisted success/failure,
  latency, schema/config and missingness telemetry tied to safe ids. Telemetry cannot
  contain human reason text, personal profile, secret, signed payload beyond policy,
  holdout semantics/opening or cross-tenant identifiers.

### Outcome and STR-024 dependency

- **STR027-MET-001 — Eligible denominator.** Freeze supported decision types/cohort before
  Gate 2. Every eligible generated package—including generation failure, rejection,
  abandoned draft, supersession, inaccessible evidence and missing package—stays in the
  first-10-or-30-day denominator; no post-outcome exclusion or replacement is possible.
- **STR027-MET-002 — Exact measures.** From append-only events, report eligible/generated/
  human-ready/submitted/verified/rejected/superseded/failed counts; nonblank human-ready
  rate; verified submitted rate; AI-draft acceptance/edit distance; active preparation
  and judgment time; generation/signing/verification latency; signature/revision/role/
  replay/contamination failures; accessibility outcomes and missingness by exact feature/
  agent/model/config version. Numerators, denominators and unknown values are explicit.
- **STR027-MET-003 — Falsifiable threshold.** At cohort close, 100% of submitted rulings
  must verify exact target/role/sequence/issuer and at least 90% of eligible packages
  must become nonblank human-ready, subject to human ratification of those proposed
  thresholds. Report observed manual-path comparison and median active time without
  claiming causality or universal STEER superiority.
- **STR027-MET-004 — Zero guardrails.** Any agent/service ruling, unsigned/unverifiable
  effective display, revision mismatch, replay, overwritten ruling, blind disclosure,
  secret exposure or silent auto-submit is a visible zero-tolerance failure and rollout
  stop; missing guardrail telemetry also blocks rather than scoring zero observed.
- **STR027-STR024-001 — Prepared, not decided.** A synthetic vertical slice can prepare
  and independently verify STR-024's exact Gate 1 receipt, editable exact-Exam RAT set
  and custody package, but cannot sign for Idriss, appoint owners, alter its frozen Brief,
  create historical proof, expose B09–B12 or decide STR-024 Gate 2.
- **STR027-STR024-002 — Required final evidence.** STR-024 remains blocked until its exact
  Exam, final Test/Critic evidence, human receipt/countersignature/in-file note, every
  required human RAT and signed custodian manifest are present and valid, followed by an
  authenticated human Gate 2 decision in the required separate session.
- **STR027-CODEX-001 — Supervisor boundary.** Exact corrected boundary commit
  `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de` remains an ancestor/equal-or-narrower
  contract. Codex hosting/start/observe/safety-stop/read-only troubleshooting cannot
  author/finish deliverables, fabricate/rewrite evidence, sign/countersign, decide,
  grade the workload, access holdouts or count as named-agent performance.

## Edge cases and adversarial campaigns

Independent Test must exercise at least these campaigns against the exact build:

1. **Protocol mutation:** mutate every field and byte boundary; duplicate keys; alternate
   encodings; Unicode normalization; self-referential signature/verification fields;
   cross-schema/purpose/tenant/item transplant; truncated/appended envelopes.
2. **Race/fault matrix:** concurrent human submits, signer callbacks, verifier retries,
   superseding decisions, role/key/revision changes and crashes at each durable boundary.
3. **Authority confusion:** forged names, stale sessions, service-to-human type confusion,
   issuer/countersigner role reuse, Codex known-byte signing-oracle requests and UI-only
   authorization bypass.
4. **AI manipulation:** prompt injection in evidence, poisoned links, hidden text, model
   failure, stale config, fabricated citation, blank/error output, automation-bias copy,
   and attempt to bulk/default-submit.
5. **Blind leakage:** offline dictionary attack, length/timing/error correlation, nonce/
   opening reuse, cross-case/candidate replay, early oracle access, log/export/Buzz/UI
   disclosure and attempted replacement of a contaminated run.
6. **Recovery/privacy/a11y:** backup replay under partial loss, key compromise/revocation,
   delete/export during outage, focus/AT recovery after every error and 400% reflow of a
   long edited package and cryptographic failure detail.

## Required evidence before a human may decide Gate 2

- Authenticated Gate 1 receipt and policy-compliant in-file Brief audit-note descendant
  bound to exact substantive Brief revision `b15efdc2355089c90c943eaa374d0b5e290b5343`.
- Human dispositions for `RAT-SIGN`, `RAT-PRIVACY`, `RAT-ROLES`, `RAT-POLICY`, `RAT-AI`,
  `RAT-EVAL`, `RAT-A11Y` and `RAT-SLO`, with all separately qualified humans named.
- Frozen canonical/signature/event/CAS/concurrency vectors, B01–B12 safe-binding vectors,
  signed manifest/custody design and exact public/nonpublic field inventory.
- Independent Test mapping every acceptance ID to executable positive/negative evidence
  against this exact Exam revision, plus fresh-context Critic review of Brief + Exam.
- No unresolved blocker, invented signature/custody evidence, production credential,
  holdout access or retrospective named-agent attestation.

## Human judgment checklist (Evaluate)

- [ ] Can I identify the exact artifact, human intent, role, proof, sequence and effective
      state without trusting editable UI, chat, AI text or the signer as decision-maker?
- [ ] Are all AI-prepared fields useful and editable while individual human judgment is
      deliberate, attributable and never defaulted or bundled?
- [ ] Would the named identity/security, privacy, accessibility/design, Test/custody and
      Ops/reliability humans accept these exact unresolved-choice dispositions?
- [ ] Can an independent verifier and a keyboard/screen-reader user recover confidently
      from stale revision, signer failure, retry, supersession and rollback?
- [ ] Does STR-024 remain blocked until real human receipts/RATs and blind-custody evidence
      exist, with no invented history or leaked B09–B12 semantics?

---

GATE 2: PENDING — authenticated human Tech Lead ruling required in a different session
from Gate 1 after all required evidence and named-human ratifications above exist.
GATE 2 EVIDENCE: PENDING — must bind approver, role, decision, time, sequence, exact
Brief lineage, this Exam revision, Test/Critic evidence and RAT package. This Architect
artifact is not an approval.

GATE 3: PENDING — requires exact verified build, independent Test and fresh Critic,
tagged-domain human rulings and default-closed cooling-off.
GATE 3 EVIDENCE: PENDING
