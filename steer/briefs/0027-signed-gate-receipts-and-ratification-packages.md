# Intent Brief — 0027 Signed gate receipts and editable ratification packages

**Status:** draft
**Tags:** #security #privacy #a11y #reliability #design-system
**Date opened:** 2026-08-15
**Work item:** [STR-027 / issue #55](https://github.com/idrissenayat/federal-bd-platform/issues/55)
**Workflow:** STEER (frozen)
**Assignment:** STEER Scout Agent; Sense-stage Intent Brief and evidence only

## Expected outcome and measurement

- **Primary outcome:** An authorized human can review and act on one AI-prepared,
  non-blank Gate or RAT decision package, while an independent verifier can prove that
  the resulting human ruling is authentic, sequenced, and bound to the exact artifact
  revision without relying on a chat transcript or editable display state.
- **Value hypothesis:** If Work Management prepares plain-language recommendations and
  editable reasoning, exports signed exact-revision rulings, and keeps human decisions
  separate from agent/evaluator evidence, then qualified humans will spend less time
  reconstructing evidence or filling administrative fields without weakening human-only
  authority. This is a hypothesis, not an observed result.
- **Baseline / denominator:** STR-024 currently has an authenticated Work Management
  Gate 1 ruling but no independently exportable signed receipt, countersignature, or
  policy-compliant in-file audit note. Its ten proposed `RAT-*` rows are not yet
  human-ratified, and its B01–B12 scoring/custody manifest and digests are absent. Before
  rollout, record every eligible Gate and RAT package generated, including generation
  failures, rejected signatures, human revisions, abandoned packages, supersessions,
  and inaccessible evidence. Missing packages stay in the denominator.
- **Observation window:** Report at the first 10 eligible Gate or RAT packages or 30
  calendar days after a controlled release, whichever occurs first; if fewer than 10
  packages exist at day 30, extend only until 10. Freeze the cohort rule and supported
  decision types before Gate 2.
- **Proposed minimum meaningful signal:** 100% of submitted human rulings verify against
  the exact target revision, required role, event sequence, and issuer key; at least 90%
  of eligible packages reach a human-ready state with AI-prepared recommendation and
  reasoning without a human starting from a blank required field; and median active
  human preparation time is measured and compared with the current manual path. The
  percentages are proposed values for human ratification, not approved targets.
- **Guardrail measure:** Zero agent, Codex, adapter, evaluator, or generic service
  principal gate/RAT rulings; zero unsigned or unverifiable records presented as
  effective; zero revision mismatch, replay, overwritten ruling, blind-holdout
  disclosure, signing-secret exposure, or silent auto-submission. Unknown or missing
  evidence is reported as blocked, never inferred as approval.

## Who this is for

The primary user is a Product Lead or Tech Lead who needs to make a consequential Gate
or RAT ruling quickly from understandable evidence without recreating the package. The
secondary users are a qualified domain co-ratifier, a Test owner or fixture custodian
who must preserve blind evaluation material, and an auditor or Critic who must verify
the actor, artifact revision, sequence, and evidence independently.

## Problem and why now

STEER Work Management records human rulings, but the current prototype does not export
an independently verifiable receipt that can satisfy the repository's exact-revision
gate policy. Humans can also encounter required decision fields without an AI-prepared
recommendation and editable rationale, shifting avoidable clerical work back to the
scarce human judgment layer.

The immediate evidence is specific and deliberately narrow:

- [Issue #55](https://github.com/idrissenayat/federal-bd-platform/issues/55) assigns the
  Scout Agent to define signed gate receipts and human ratification packages and states
  that STR-024 depends on this capability.
- STR-024's exact corrected
  [Exam at `254226bbb99a07844262d609b11d1b0b36281f9f`](https://github.com/idrissenayat/federal-bd-platform/blob/254226bbb99a07844262d609b11d1b0b36281f9f/steer/exams/0024-governed-agent-execution.md)
  defines ten `RAT-*` fields, the `steer.gate-receipt.v1` dependency, and the
  `str024.scoring-manifest.v1` B01–B12 custody contract.
- The final independent
  [Test evidence at `41e131d2250d78e0b71685d1decf1c4c9648db4d`](https://github.com/idrissenayat/federal-bd-platform/blob/41e131d2250d78e0b71685d1decf1c4c9648db4d/steer/reviews/0024-independent-test-final-retest-evidence.md)
  passes all 41 Exam acceptance IDs but blocks Gate 2 on the missing human/platform
  packages.
- The final fresh
  [Critic evidence at `223f4adf237a388bd11f6620b32137329894a14e`](https://github.com/idrissenayat/federal-bd-platform/blob/223f4adf237a388bd11f6620b32137329894a14e/steer/reviews/0024-exam-final-fresh-critic-evidence.md)
  passes the corrected design and identifies the same smallest pre-Gate-2 action set.
- The corrected
  [Codex supervision boundary at `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`](https://github.com/idrissenayat/federal-bd-platform/blob/bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de/docs/steer/OPERATING-MODEL.md#normative-codex-supervision-boundary)
  denies Codex authority to author agent deliverables, fabricate or rewrite evidence,
  approve gates, grade an evaluated agent, or access blind holdouts.

This proves a current governance and usability blocker for STR-024. It does not prove
that every organization needs the same signing scheme, that AI-prepared reasoning is
always accepted, or that the feature has already reduced human time.

## What "done and correct" means

1. **Human-only decision authority:** Only an authenticated human with the required
   organization/POD/project/work-item role may submit a Gate or RAT ruling. Agents,
   Codex, adapters, evaluators, Buzz, link-preview clients, and generic service accounts
   may prepare, transport, verify, or display permitted evidence but cannot submit,
   countersign, approve, reject, ratify, revise, or widen a ruling. Server/data-layer
   authorization enforces the boundary; disabled UI alone is insufficient.
2. **Distinct signing and countersigning authority:** The Work Management gate-event
   service signs the canonical receipt as issuer after an authenticated human ruling is
   committed. The human approver makes the decision; the issuer signature proves the
   durable record and does not create human authority. A required countersignature is a
   separate authenticated human verification action bound to the receipt digest. An
   agent, Codex, runtime adapter, Builder, or issuer service cannot countersign for the
   human. Where current policy requires an in-file gate audit note, a separately
   authorized human recording action changes only the allowed audit/evidence lines and
   cannot change the approved substantive artifact.
3. **Immutable exact-revision receipt:** `steer.gate-receipt.v1` is canonical,
   append-only, non-replayable, and contains at minimum: schema/version; organization,
   POD, project, item, workflow and gate; event id and monotonic sequence; previous gate
   event id/sequence/receipt digest; authenticated actor id/account/type/role; decision,
   safe reason digest and effective time; exact artifact repository/URI, commit,
   path/blob, file SHA-256, and policy-defined substantive-body SHA-256; authoring and
   review session ids; cooling-off/batch result; authorized scope; issuer, key id,
   algorithm, export time, canonical-byte SHA-256, signature, and verification result.
   Canonical bytes are deterministic and the signature covers every field.
4. **Correction without erasure:** An issued receipt, human ruling, RAT submission,
   signature, verification result, or failed attempt cannot be edited or deleted. A
   correction is a newly authenticated superseding event that links the prior receipt,
   states why it changed, and preserves both. A new artifact revision never inherits an
   earlier approval. Stale, revoked, replayed, sequence-conflicting, unknown-key, or
   signature-invalid packages fail closed and remain auditable.
5. **Policy-compliant gate evidence:** Gate 1 binds the exact Intent Brief; Gate 2 binds
   the exact approved Brief lineage, Exam revision, required Test/Critic evidence and
   RAT package; Gate 3 binds the signed Brief/Exam lineage, exact verified build and
   required domain evidence. A typed timestamp or detached receipt alone is never
   sufficient where `GATES.md`/`SOLO-MODE.md` also require an in-file audit note,
   different sessions, cooling-off, co-signers, or independent-reader evidence.
6. **AI-prepared, editable, non-blank RAT package:** For every required `RAT-*` row, an
   authorized preparation agent produces an advisory draft containing the exact target
   Exam revision/blob/SHA-256, RAT id and proposed value, plain-language summary,
   evidence links/digests, material risks/dependencies, recommendation (`RATIFY` or
   `REVISE`), editable proposed reasoning, required human role/co-ratifier, and the
   effect of each choice. The human starts from that populated package, can edit every
   advisory field, sees a diff between the AI draft and submitted reasoning, and must
   deliberately submit the ruling. No AI failure silently produces an empty required
   field or a default approval.
7. **No automatic or bundled judgment:** A generated recommendation does not select or
   submit a human decision, and opening/clicking a recommendation does not count as a
   ruling. Every RAT decision is individually attributable even when presented in one
   review package. Missing evidence, missing qualified ownership, unresolved Critic
   blocker, incompatible decisions, or a changed target revision holds the affected RAT
   and any dependent gate. Silence, timeout, inherited role, and bulk "approve all"
   cannot ratify.
8. **RAT role and sequence enforcement:** Each RAT declares the accountable human
   decision owner, required qualified co-ratifier(s), dependencies, and permitted
   sequence. A human may hold multiple roles only when policy permits and the record
   makes that explicit; the system does not infer specialist competence from account
   ownership. Human RAT rulings record actor/role, exact target revision, decision,
   edited reasoning, AI-draft digest/version, evidence-set digest, time/session,
   predecessor/supersession, and signature or authenticated event proof.
9. **Evaluator-owned B01–B12 manifest:** For STR-024, the package preserves exact
   `str024.scoring-manifest.v1`: Idriss Enayat is the Product/experiment owner; the
   fixture custodian, evaluator, runtime transport, and evaluated workload are distinct
   principals; owner and custodian sign RFC 8785 canonical bytes before a candidate
   run; the manifest fixes exact Exam/candidate/principal/config digests and exactly the
   first authorized B01–B12 case-run denominator, Boolean assertions, 30/30/25/15 point
   allocation, hard-fail codes, and aggregate digest. It has no optional case, weight,
   exclusion, replacement-run, or evaluator-selected field.
10. **Blind-holdout custody:** B01–B08 may use public synthetic fixtures. B09–B12
    plaintext, oracles, assertions, unpadded lengths, semantic summaries, and decryption
    material are accessible only to the separately authenticated fixture custodian and
    evaluator as permitted by the exact STR-024 Exam. Workload-bound input and
    evaluator-bound output use one-way encrypted delivery; Codex, transport, prompt
    author, evaluated agent tools/retrieval, Work Management UI, Buzz, logs, and public
    evidence receive only explicitly permitted non-semantic metadata and digests.
    Premature semantic disclosure marks the evaluation `CONTAMINATED`, preserves the
    failed result, and requires new custodian-generated material under a new manifest.
11. **Evidence package and independent verification:** A human reviewer can export a
    package containing the canonical receipt/RAT records, exact public evidence links,
    cryptographic digests, signature chain, issuer public-key reference, verification
    result, supersession chain, and safe validation log. An independent verifier can
    reproduce canonicalization, content hashes, ancestry/body invariants, signature,
    event sequence, role policy, cooling-off, and required evidence presence without
    private keys, prompts, holdout plaintext, or mutable application state.
12. **Key and identity safety:** Private signing/countersigning keys remain in an
    approved non-display key or secret service and never enter prompts, browser fields,
    Git, Buzz, logs, analytics, exports, fixtures, or agent tools. Key issuance,
    rotation, revocation, compromise, historical verification, service health and least
    privilege are explicit and tested. Unknown/revoked keys, unavailable verification,
    signer outage, principal-type confusion, cross-tenant access, and forged display
    names hold the action rather than falling back to unsigned acceptance.
13. **Privacy and minimization:** Receipts and RAT packages contain only the identity,
    role, decision, revision, reason/evidence digests, sequence, and audit metadata
    required for governance. Full personal profiles, credentials, prompts, private
    reasoning, restricted data, and holdout semantics are excluded. Access, public
    disclosure, retention, deletion/pseudonymization, backup expiry, legal basis, and
    audit-review cadence are human-ratified before production; exports enforce the same
    field allowlist and scope as the source record.
14. **Accessible, fast human review:** The Gate/RAT review presents the AI
    recommendation, why, material risks, missing evidence, required role, exact target,
    and proposed editable reasoning before the action controls. It distinguishes AI
    draft, human edit, effective ruling, blocked, superseded, signature-invalid, and
    stale-revision states in plain text and not by color alone. Keyboard and supported
    screen-reader users can inspect evidence, compare changes, edit reasoning, submit or
    request revision, recover from validation errors, and verify success without lost
    focus. Loading, generation, empty, denied, signing, verification, recovery and error
    states are actionable.
15. **Reliable submission and honest feedback:** A human submission uses a stable
    idempotency key and produces exactly one ruling/receipt or an explicit failure.
    Retrying cannot duplicate or overwrite a decision. The interface shows a durable
    success receipt with event/sequence and exact target, not merely a spinner returning
    to the original button. Signing, export, evidence, evaluator, or issuer failures
    name the owner, next check, dependency, retry eligibility and safe status.
16. **Rollback and recovery:** A reversible control can stop new AI package generation,
    decision submission, signing, countersigning, export, or evaluator delivery by
    scoped capability without deleting or changing existing rulings, receipts,
    signatures, evidence, holdout custody, or human decisions. Recovery revalidates
    identity, keys, sequence, idempotency, exact revisions, evidence access and derived
    views before resuming. Event-log replay can reconstruct the authoritative view; a
    cache, search index, Buzz mirror, or Git link outage cannot become authority.
17. **STR-024 unblocking remains human-controlled:** STR-027 may prepare and verify the
    signed Gate 1 evidence package, editable exact-Exam RAT package, and evaluator-owned
    manifest/digest/custody package required by STR-024. It cannot sign for Idriss
    Enayat, appoint qualified owners, ratify a proposal, expose holdouts, update the
    frozen Brief without separate human authorization, or decide Gate 2. STR-024 stays
    blocked until its exact Exam requirements and the final Test/Critic evidence are
    satisfied and an authorized human records the Gate 2 ruling in a separate session.
18. **Codex-supervisor boundary:** The implementation and operating procedure remain
    equal to or narrower than exact commit
    `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`. Codex may start, observe, safety-stop,
    and read-only troubleshoot a separately authorized named-agent run, and may repair
    agent/runtime/platform configuration only under another authorized platform item.
    It cannot author or finish the assigned deliverable, fabricate/rewrite evidence,
    sign or countersign a receipt, submit a RAT/gate ruling, grade the evaluated agent,
    access blind holdouts, or count its output as agent performance. Emergency activity
    remains a new human-authorized, labeled, time-bounded supervisor run and cannot
    repair the delivery artifact or approve a gate.
19. **Falsifiable learning:** The release records eligible/generated/human-ready/
    submitted/verified/rejected/superseded/failed packages; AI-draft acceptance and edit
    distance; human preparation and judgment time; generation/signing/verification
    latency; signature/revision/role/replay/contamination failures; accessibility
    results; escaped defects; and missingness by exact feature/agent/config version.
    Human edits and failures remain visible. Process completion is not reported as user
    value or proof that STEER is universally superior.

## Design intent

Use one focused **Decision package** surface attached to the authoritative work item.
The first viewport should answer: “What exact artifact am I deciding on, what does AI
recommend, why, what evidence or risk matters, who must decide, and what will happen if
I submit?” Evidence detail and cryptographic verification can expand progressively, but
the exact revision, effective authority, and blockers are never hidden.

The human flow is:

```text
authorized evidence set
        ↓
preparation agent creates non-blank advisory draft
        ↓
human reviews exact target + risks + evidence + proposed reasoning
        ├─ edit and RATIFY/APPROVE
        ├─ edit and REVISE/REQUEST CHANGES
        └─ leave blocked; name missing owner/evidence
        ↓
authoritative human event → issuer-signed immutable receipt
        ↓
independent verification → optional required human countersignature/audit note
```

Show AI text as advisory and visibly separate from human-authored edits and the final
effective record. Human-only controls use clear verbs and confirmation text. A successful
submission replaces the action state with an immutable receipt summary and verification
status. Buzz may mirror that a decision is ready or recorded with a safe link, but it
cannot carry signing material, reasoning details, blind-holdout metadata, or authority.

## Out of scope

- Product/platform implementation, schema migrations, API or UI code, signing-key
  creation, credential grants, runtime deployment, or infrastructure changes under this
  Sense-stage assignment.
- Writing or freezing an STR-027 Exam before an authenticated Gate 1 ruling.
- Recording Gate 1 for STR-027, completing STR-024's pending receipt/countersignature/
  RATs, editing STR-024's frozen Brief, or deciding STR-024 Gate 2.
- Allowing an agent, Codex, evaluator, adapter, Buzz, or a signature service to make or
  infer a human gate/RAT decision.
- Creating, reading, or inventing B09–B12 holdout plaintext, oracles, assertions,
  decryption material, signatures, key ids, digests, or custody evidence.
- Replacing the repository gate rules with a detached receipt, weakening cooling-off or
  independent review, bulk approval, retroactive signing, or backfilling historical
  agent attestation.
- Production legal-signature claims, non-repudiation guarantees beyond the ratified
  technical/audit contract, restricted-data handling, money movement, or external
  communications/actions.
- Claiming measured time savings, security, compliance, accessibility, or universal
  STEER effectiveness before observation and qualified review.

## Risks and default-closed touchpoints

This item touches authentication, authorization, signing credentials, personal audit
metadata, human-only governance, cross-system evidence, blind evaluation material, and
potentially durable or public records. It is default-closed and requires #security,
#privacy, #a11y, #reliability, and #design-system review. No implementation, production
key, public receipt, evaluator material, or dependent Gate 2 action is authorized by
this Brief.

**Threat model:** A malicious user, agent, Codex host, adapter, evaluator, browser,
compromised issuer, or cross-tenant actor may forge or replay a ruling; substitute an
artifact after review; confuse actor types or display names; submit an AI recommendation
as human judgment; reuse a signature on another item; reorder or erase events; leak a
private key or human reason; expose blind holdouts through UI, logs, timings, lengths,
links, or error messages; or present a spinner/retry as success while no ruling exists.
Default-deny role checks, exact content/revision digests, deterministic canonicalization,
non-replayable event sequencing, signer separation, protected keys, append-only
supersession, scoped access, idempotent submission, independent verification, safe
redaction, fixed-size encrypted holdout delivery, and explicit failure states are
required mitigations. Residual risk remains for compromised human credentials, coerced
or inattentive human approval, issuer/root-key compromise, and qualified-owner gaps; the
system must surface those risks and stop rather than silently compensate.

**Default-closed human decisions before Gate 2/implementation:**

| Consequential choice | Accountable human owner | Required co-ratifier or evidence | Default while unresolved |
|---|---|---|---|
| Receipt canonicalization, signature algorithm, issuer trust root, key custody/rotation/revocation, historical verification | Idriss Enayat, Product/Tech owner | A named qualified identity/security owner; threat model and key-service evidence | No production signer, countersigner, or effective export |
| Which Gate/RAT records may be public; actor fields, reason visibility, access, retention, deletion/pseudonymization, backup expiry and legal basis | Idriss Enayat, Product/data owner | A named qualified privacy/data owner and data-inventory ruling | Private, least-privilege evidence only; no public disclosure |
| Co-ratifier matrix and whether one human may hold multiple roles for each risk class | Idriss Enayat, Product/Tech owner | Named domain owners and the solo/team policy ruling | Missing qualified owner blocks the affected RAT/gate |
| Supported Gate types, exact artifact/body hash rules, cooling-off/batch/session policy and countersignature sequence | Idriss Enayat, Product/Tech owner | CORE-10/11 policy checks and independent Test review | STR-027 cannot replace existing GATES/SOLO rules |
| AI recommendation model/agent/config, evidence allowlist, confidence/error behavior and edit-diff retention | Idriss Enayat, Product owner | Named Test owner; privacy/security review | Advisory generation remains disabled outside synthetic/test data |
| B01–B12 owner/custodian/evaluator/transport principals, keys, signed manifest/digests, access logs and contamination response | Idriss Enayat, Product/experiment owner | Named human Test owner and fixture custodian; exact STR-024 Exam evidence | No valid manifest, score, RAT-EVAL, or STR-024 Gate 2 package |
| Accessibility support matrix and manual evidence owners | Idriss Enayat, Product owner | Named qualified accessibility/design owner | No production readiness or accessibility claim |
| Availability, RPO/RTO, receipt retention, reconciliation, disable/recovery commands and rollback owner | Idriss Enayat, Tech owner | Named Ops/reliability owner and rehearsal evidence | Fail closed; preserve records; no new submissions during degradation |

Naming Idriss Enayat as the accountable resolution owner does not infer that he is the
qualified specialist for every row. When a separately qualified co-ratifier is required
and has not been named, that gap is a blocker, not permission for an agent or Codex to
fill the role.

## Proposed approach for Gate 1 framing

Keep Work Management as the authority and add a narrow decision-package contract around
an append-only ruling event, canonical signed export, independent verifier, editable
AI-prepared advisory, and optional policy-required human countersignature/in-file audit
note. Treat signing, verification, preparation, human judgment, evaluator custody, and
communication as separate scoped principals/capabilities. Prefer a provider-neutral
contract whose first vertical slice proves the exact STR-024 Gate 1 receipt and RAT
package without exposing holdouts or changing any existing human ruling.

The Architect should compare at least: (A) signing canonical exports directly from the
authoritative event service with an independent verifier; (B) an append-only transparency
ledger/proof service projected into Work Management; and (C) an external evidence signer
that receives immutable event digests. The comparison must preserve existing GATES/SOLO
policy, role separation, key custody, privacy, recovery, accessibility, and portability.
No option is chosen by this Scout Brief.

Rejected at this stage: treating Git commit authorship, typed timestamps, screenshots,
chat/Buzz messages, AI recommendations, detached unsigned JSON, browser state, or Codex
supervisor claims as authority; letting the signer create decisions; exposing blind
holdouts to simplify review; one-click bulk ratification; or editing historical records
to make verification pass.

---

GATE 1: PENDING — authenticated human Product Lead ruling required for this exact revision
GATE 1 EVIDENCE: PENDING — must bind the approver, role, decision, time, sequence, exact Brief revision, and required checks
