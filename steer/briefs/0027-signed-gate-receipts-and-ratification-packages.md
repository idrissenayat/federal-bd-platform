# Intent Brief — 0027 Signed gate receipts and editable ratification packages

**Status:** draft
**Tags:** #security #privacy #a11y #reliability #design-system
**Date opened:** 2026-08-15
**Work item:** [STR-027 / issue #55](https://github.com/idrissenayat/federal-bd-platform/issues/55)
**Workflow:** STEER (frozen)
**Assignment:** STEER Scout Agent; Sense-stage Intent Brief and evidence only

> **Revision note — 2026-08-16 (pre-effect countersignature):** This revision implements
> the authorized human policy that a ruling requiring countersignature remains
> `PENDING_COUNTERSIGNATURE` and has **no effect** until every required independently
> authenticated human has signed. It supersedes the earlier contradictory direct
> `PENDING_PROOF → EFFECTIVE` / post-effect-countersignature description; the prior Brief
> remains preserved in Git history. It also addresses fresh Critic findings at
> `4cf5cd7a5ef37c421f4f232f3cc5c41fdc7f1296`: freeze a verifiable countersignature
> protocol, competent blind-leakage oracle, `eligible_unit` denominator, distinct-human
> rules, and separate practical payload limits from synthetic U64 parser-edge vectors.
> Independent Test evidence `5769788c7b97a36a412492e9c6ee2b41dd554038` is preserved in
> this revision's ancestry. This note is not a Gate 1 receipt or ruling.
>
> **Correction note — 2026-08-16:** Fresh Critic evidence
> `a085abebf3f89c95e2f7323ff2f75d328833e3c9` is preserved in this revision's ancestry.
> This narrow correction freezes acyclic issuer/countersignature objects, audit-descendant
> identity, and non-selectable outcome/leakage rules; it changes no human policy or Gate state.
>
> **Final correction note — 2026-08-16:** Fresh final Critic evidence `b557858fc788a64f20c3f6c1013bd52df5ea33b8` is preserved in ancestry. This revision freezes nested byte encodings, monotonic fresh revocation snapshots, one bounded cohort, and an unsafe-null adjusted leakage decision; it does not change the pre-effect policy or Gate state.
>
> **Exact final correction note — 2026-08-16:** Fresh Critic evidence `4f21bfdf18debafa35965b07ab3a23ca96c0a1ae` is preserved in ancestry. This revision freezes literal nested-object schemas and an acyclic revocation-entry preimage, and uses uniform Bonferroni bounds; no human policy or Gate state changes.
>
> **Minimal binding correction note — 2026-08-16:** Fresh Critic evidence `1c3abdedcd4f494c9c3cd51bdf4b814e7b1e8597` is preserved in ancestry. This correction binds the v2 signer set to each countersignature and makes snapshot identity authority-complete; no Gate state or human policy changes.

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
- **Baseline / denominator:** Freeze `eligible_unit/v1` before observation: one immutable
  enrollment-ledger row per attempted supported Gate/RAT decision package, created before
  generation and keyed by tenant/work-item/decision-kind/target-revision/idempotency key.
  A row is eligible only when that policy-defined package is requested during the frozen
  window; it remains counted through generation failure, denial, inaccessible evidence,
  abandonment, rejection, supersession, or missing package. The denominator is the count
  of ledger rows, never merely generated or completed packages. STR-024's ten proposed
  `RAT-*` rows are not human-ratified and its B01–B12 custody package is absent.

- **Observation window:** The sole bounded cohort contract is `supported_decision_universe/v2` in item 13; it replaces all earlier observation-window text. No measurement window is valid until that frozen UTC/N contract is human-ratified.
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
2. **Pre-effect countersignature state machine and distinct humans:** A deliberate human
   submission creates one append-only `DecisionIntent/v2` in `PENDING_PROOF`, which has no
   Gate/RAT effect. The issuer may attest that exact immutable intent. If the bound policy
   requires zero countersigners, successful verification transitions it atomically to
   `EFFECTIVE`; otherwise it transitions only to `PENDING_COUNTERSIGNATURE`. In that state
   projections, dependent actions, mirrors and exports must say ineffective. Each required
   independently authenticated human countersigns the same receipt identity; only the last
   valid required signature can atomically transition the ruling to `EFFECTIVE`.
   `PROOF_FAILED`, `COUNTERSIGNATURE_FAILED`, stale, revoked, incomplete, conflicting, or
   unknown states are ineffective and fail closed. A policy-required in-file audit note is
   separate and cannot substitute for a required countersignature.

   The frozen complete signer set is the signed `required_signer_set/v2` object defined in item 3; no legacy signer-set schema may be accepted.
   It requires at least two distinct human principals whenever countersignature is required;
   submitter/issuer/service/agent/evaluator/Codex identities cannot fill a human slot; one
   human cannot fill two slots; and submitter and countersigner are always a forbidden pair.
   Policy may add stricter separations but cannot weaken these rules on retry.
3. **Literal acyclic schemas, encodings, and revocation:** All objects are RFC 8785
   canonical JSON, UTF-8 without BOM. JSON accepts only listed members: no duplicates,
   unknown members, omitted required member, or non-canonical decoding. `string` is Unicode
   scalar text; `uuidv7` is lowercase canonical 36-character UUID; `hex64` is 64 lowercase
   hex characters; `b64` is unpadded RFC4648 §5 base64url whose decoded length is stated;
   `time` is RFC3339 UTC `YYYY-MM-DDTHH:MM:SSZ`; `u64` is a JSON integer 0..18446744073709551615.
   Arrays are ordered exactly as stated, cardinalities are enforced, and byte digests are
   SHA-256 lowercase `hex64` over named canonical UTF-8 bytes.

   `intent/v4` has exactly `decision` string, `idempotency_id` uuidv7, `policy_id` string,
   `policy_version` string, `receipt_id` uuidv7, `required_signer_set` object, `scope` object,
   `sequence` u64, `submitted_at` time, `submitter_principal` string, `submitter_role` string,
   `target` object, `trust_policy_version` string, and `workflow_id` string. `scope` requires
   `item`,`pod`,`project`,`tenant`; `target` requires `body_sha256`,`commit`,`path`,
   `repository_uri`. Intent has no optional members and its digest is SHA-256 canonical bytes.
   `required_signer_set/v2` has exactly `eligible_principal_universe` array 1..64,
   `forbidden_role_coassignment` array 0..2016, `minimum_distinct_humans` u64 0..64,
   `required_count` u64 0..64, `schema` string `required-signer-set/v2`, and `slot_assignments`
   array 0..64. Eligible-universe elements are exactly `principal_id` string and `role_slot`
   string; their `role_slot` values are strictly ascending UTF-8 bytes, unique, and each
   principal ID occurs once. Slot-assignment elements are exactly `principal_id` string and
   `role_slot` string, ordered by role slot, unique by both role slot and principal ID, and
   each must equal one eligible-universe pair. Forbidden-coassignment elements are exactly
   `left_role_slot` and `right_role_slot` strings, with left < right UTF-8, sorted lexicographically,
   unique, and both slots present in the eligible universe. `required_count` equals assignment
   cardinality; `minimum_distinct_humans <= required_count`; zero count requires zero minimum
   and zero assignments; nonzero count requires at least two distinct assigned human principals
   where countersignature is required. No verifier uses unsigned policy data: it derives every
   eligible principal, required slot, distinct-human rule and forbidden pairing from this object.


   Every outer envelope has exactly `body_b64` b64(>=2 bytes), `header_b64` b64(>=2 bytes),
   `schema` string, and `signature_b64` b64(64 bytes). Its `schema` discriminator is exactly
   either `issuer/v2` or `countersignature/v3`: unknown values reject. After unpadded-base64url
   decoding and before cryptographic or state processing, outer `issuer/v2` requires both decoded
   protected header and body `schema` members to equal `issuer/v2`; outer `countersignature/v3`
   requires both to equal `countersignature/v3`. Any substituted or mismatched discriminator,
   including on the zero-countersigner path, rejects. Decoded header/body are canonical JSON with
   exactly the member sets below; envelope digest preimage is domain-separated
   `"STEER_ENVELOPE_DIGEST_V1\0" || u64be(len(S)) || S || u64be(len(H)) || H ||
   u64be(len(B)) || B`, excluding signature, where S is exact UTF-8 outer-discriminator bytes
   and H/B are decoded canonical bytes.
   `issuer_header/v2` and `issuer_body/v2` each require exactly `algorithm` string `Ed25519`,
   `issuer_key_id` string, `issuer_principal` string, `issued_at` time, `issuer_nonce` b64(32),
   `intent_digest` hex64, `policy_version` string, `purpose` string `issuer-attestation`,
   `receipt_id` uuidv7, `revocation_snapshot` object, `schema` string `issuer/v2`, and
   `trust_policy_version` string; issuer body additionally requires `intent_b64` b64(>=2).
   `intent_canonical_bytes` are the exact RFC 8785 canonical UTF-8 bytes obtained only after
   unpadded-base64url decoding `intent_b64` and successful literal `intent/v4` validation;
   noncanonical decoded bytes, decode failure, or validation failure rejects. `intent_digest` is
   lowercase SHA-256 hex of those exact bytes. Verifier recomputes it and requires constant-time
   equality to every signed issuer and countersignature header/body `intent_digest` before
   signature acceptance, proof counting, or state change; any digest mismatch rejects. Repeated
   header/body members must equal. Issuer signature input is
   `"STEER_ISSUER_ENVELOPE_V2\0" || u64be(len(S)) || S || u64be(len(H)) || H ||
   u64be(len(B)) || B`, where S/H/B are the validated outer discriminator and decoded canonical
   protected bytes above.

   `counter_header/v3` and `counter_body/v3` each require exactly `algorithm` string
   `Ed25519`, `countersigner_idempotency_id` uuidv7, `issuer_envelope_digest` hex64,
   `issuer_envelope_b64` b64(>=2), `policy_version` string, `purpose` string
   `pre-effect-countersignature`, `receipt_id` uuidv7, `required_set_digest` hex64 (defined below),
   `revocation_snapshot` object, `role_slot` string, `schema` string `countersignature/v3`,
   `signed_at` time, `signer_key_id` string, `signer_principal` string,
   `signer_nonce` b64(32), `trust_policy_version` string, and `intent_digest` hex64.
   `required_set_preimage/v2` is exact bytes `"STEER_REQUIRED_SET_V2\0" || u64be(len(R)) || R`, where R is the RFC 8785 canonical UTF-8 bytes of the `required_signer_set/v2` object decoded from the issuer-embedded intent. `required_set_digest` is lowercase SHA-256 hex of that preimage. Each countersignature signed header and body must bind that exact digest; verifier recomputes it from the decoded issuer-signed intent and rejects any mismatch before counting a proof or changing state. Embedded issuer canonical bytes must hash to `issuer_envelope_digest`; repeated members
   must equal. Counter signature input is `"STEER_COUNTERSIGNATURE_V3\0" ||
   u64be(len(S)) || S || u64be(len(H)) || H || u64be(len(B)) || B`, where S/H/B are the
   validated outer discriminator and decoded canonical protected bytes above.

   `revocation_entry/v1` has exactly `key_id` string, `principal_id` string, `reason` string,
   `revoked_at` time, `schema` string `revocation-entry/v1`, and `sequence` u64; entries are
   strictly ascending tuple `(sequence,key_id,principal_id)` by UTF-8 bytes, unique key IDs,
   and invalid/duplicate/out-of-order entry rejects the snapshot. Empty `entries` is allowed
   and is canonical `[]`. `revocation_entries_preimage/v1` is exactly canonical JSON object
   `{"entries":[...],"schema":"revocation-entries-preimage/v1"}` containing entries only;
   its digest is SHA-256 of these canonical bytes, and it contains no digest field. A
   `revocation_snapshot/v1` has exactly `as_of` time, `authority_id` string,
   `authority_key_id` string, `effective_at` time, `entries_digest` hex64, `expiry` time,
   `issued_at` time, `schema` string `revocation-snapshot/v1`, `sequence` u64,
   `trust_policy_version` string, and `signature_b64` b64(64). Thus every member has an
   explicit primitive type/range/format. Snapshot signature preimage is domain-separated
   `"STEER_REVOCATION_SNAPSHOT_V1\\0" || u64be(len(snapshot_without_signature)) ||
   snapshot_without_signature`; it binds every metadata member and `entries_digest` but never
   itself. Both issuer/counter header/body embed the complete snapshot object **including**
   `entries_digest` and `signature_b64`; their signed header/body must byte-equal it. Verifier
   separately obtains exact entry-preimage bytes and checks entries digest/signature.
   Snapshot identity is the canonical tuple `(authority_id,authority_key_id,sequence,entries_digest,issued_at,
   effective_at,as_of,expiry,trust_policy_version)`; it must exactly byte-equal across issuer,
   countersignatures, verifier cache, and atomic EFFECTIVE input. Highest sequence wins per
   `(authority_id,trust_policy_version)`; lower sequence, equal sequence/different full identity,
   authority-ID substitution, cache-namespace mismatch, rollback, equivocation, expiry, missing
   entry bytes, or cache divergence rejects. Atomic EFFECTIVE rechecks that exact unexpired
   full identity, signatures, roles, nonces and slots. No object references a later digest.

4. **Atomic idempotency, effect, and correction without erasure:** Request identity is
   `(tenant,idempotency_id)` and receipt identity `(tenant,receipt_id)`; byte-identical
   retries return the stored result and any mismatch conflicts. One durable CAS transaction
   verifies the acyclic issuer envelope, monotonic fresh snapshot, and all proof bodies,
   appends immutable accept/reject events, and writes each unique role slot once. It
   transitions `PENDING_PROOF → PENDING_COUNTERSIGNATURE → EFFECTIVE` exactly once (direct
   effect only when frozen required count is zero); mirrors/dependent projections occur only
   in that effective transaction. Crash/replay returns persisted state and cannot confer
   effect. Corrections are new linked intents, never edits.
5. **Policy-compliant Gate 1 exact-revision identity:** Before a human note, the proposed
   Brief is `pre_note_commit`; its substantive body is UTF-8 bytes from the first heading
   through the line before `---`, after normalizing LF line endings and excluding exactly
   the two terminal `GATE 1:` and `GATE 1 EVIDENCE:` lines. `substantive_sha256` hashes
   those bytes and is signed in the Gate 1 intent. The only allowed audit-descendant diff
   is replacement of those two terminal lines with an authenticated human audit note and
   evidence pointer; no other byte, path, rename, merge parent, or tree entry may differ.
   `audit_commit` must have `pre_note_commit` as its sole first parent and preserve the same
   substantive hash. An offline verifier obtains both commits, checks parentage, exact
   two-line diff, body hash, signed pre-note commit/path/blob/hash and audit commit/hash;
   any mismatch, added parent, or substantive inheritance fails closed. Gate 2 binds both
   identities plus the signed receipt; a typed timestamp or detached receipt alone is never
   sufficient.
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
8. **RAT role and sequence enforcement:** Each RAT declares accountable human owner,
   required qualified co-ratifier(s), frozen `minimum_distinct_humans`, forbidden role
   stacking, dependencies, and permitted sequence. The record explicitly binds each role
   slot to one independently authenticated human principal; no inferred competence,
   account ownership, or policy-default role stacking is allowed. Human RAT rulings record
   actor/role, exact target revision, decision, edited reasoning, AI-draft digest/version,
   evidence-set digest, time/session, predecessor/supersession, and proof.

9. **Evaluator-owned B01–B12 manifest:** For STR-024, the package preserves exact
   `str024.scoring-manifest.v1`: Idriss Enayat is the Product/experiment owner; the
   fixture custodian, evaluator, runtime transport, and evaluated workload are distinct
   principals; owner and custodian sign RFC 8785 canonical bytes before a candidate
   run; the manifest fixes exact Exam/candidate/principal/config digests and exactly the
   first authorized B01–B12 case-run denominator, Boolean assertions, 30/30/25/15 point
   allocation, hard-fail codes, safe fixture/oracle/assertion bindings, and aggregate
   digest. It has no optional case, weight, exclusion, replacement-run, or evaluator-
   selected field. The exact frozen Exam's `assertion-set SHA-256` label is not silently
   treated as permission to hash low-entropy plaintext; its safe meaning remains the
   explicit default-closed `RAT-EVAL` interpretation below.
10. **B01–B12 confidentiality-preserving bindings and blind-holdout custody:** Every
    B01–B12 assertion/oracle binding carried in the signed manifest uses one of the safe
    binding modes below; no manifest assertion field is a raw/stable hash of an
    enumerable assertion set. B01–B08 may separately link explicitly ratified public
    synthetic fixture content in a differently named public-evidence field. B09–B12
    plaintext, oracles, assertions, unpadded lengths, semantic summaries, and decryption
    material are accessible only to the separately authenticated fixture custodian and
    evaluator as permitted by the exact STR-024 Exam. Workload-bound input and
    evaluator-bound output use one-way encrypted delivery; Codex, transport, prompt
    author, evaluated agent tools/retrieval, Work Management UI, Buzz, logs, and public
    evidence receive only explicitly allowlisted non-semantic metadata and one of these
    ratified safe bindings:

    - the SHA-256 of randomized, fixed-size authenticated ciphertext whose protected
      associated data binds manifest id/revision, exact Exam and candidate digests, case
      id, fixture revision and purpose; or
    - a domain-separated high-entropy commitment over the same length-delimited binding
      fields, canonical secret digest and a fresh custodian-generated random opening of
      at least 256 bits. The random opening remains custodian/evaluator-only.

    Each case/candidate/manifest/revision uses fresh randomized encryption or opening;
    reuse, a raw/stable hash of plaintext assertions/oracles/identifiers, missing domain
    separation, low-entropy randomness, cross-case substitution or an unbound digest is
    rejected. The custodian opens a commitment only to the authorized evaluator after
    candidate output/trace commitment and records that access; no public export or human
    Gate package contains the opening or semantic secret. Premature semantic/opening
    disclosure, dictionary-matchability or cross-case linkability marks the evaluation
    `CONTAMINATED`, preserves the failed result and requires fresh custodian material
    under a new signed manifest.

    Before STR-024 Gate 2, Idriss Enayat and the named human Test owner/custodian must
    record a `RAT-EVAL` decision tied to exact Exam
    `254226bbb99a07844262d609b11d1b0b36281f9f` that either (A) interprets its
    B01–B12 `assertion-set SHA-256` field as the SHA-256 of the ratified randomized
    fixed-size assertion ciphertext and binds test vectors, or (B) requests a governed
    Exam revision. Until then, the field is `UNRATIFIED`, must not be populated/exported
    as a raw assertion hash, and no manifest, score or STR-024 Gate 2 package is valid.
11. **Evidence package and independent verification:** A human reviewer can export a
    package containing the canonical receipt/RAT records, exact public evidence links,
    allowlisted content digests, safe holdout commitment/ciphertext digests (never
    openings), signature chain, issuer public-key reference, append-only verification
    events, supersession chain, and safe validation log. An independent verifier can
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
13. **One bounded cohort and Bonferroni simultaneous leakage decision:** This is the sole
    outcome cohort rule. `supported_decision_universe/v2` freezes scope, predicate, UTC
    start/end, finite N and source ordering before enrollment; every matching request is
    enrolled before generation. Closure is earlier of end or Nth enrollment; every enrolled
    `eligible_unit` is denominator. Any source/tie/reconciliation/missing-error ambiguity
    is `INCONCLUSIVE`, never pass.

    `blind-leakage-oracle/v4` freezes immutable positive integer `m` (1..1024), comparison
    IDs in strict ascending UTF-8 byte order, features, family-disjoint strata, attack code,
    budget, seed, delta, epsilon, sample/power inputs and one sealed test. Exactly those m
    comparisons run; no rank/order/test-data selection changes m. For attack a, advantage is
    A_a=|P(a(X)=S)-P(a(X)=S')| and aggregate A=max A_a. Unsafe null is H0: A>delta; safe
    alternative H1: A<=delta. For every comparison use uniform Bonferroni alpha=.05/m and
    one-sided confidence level 1-.05/m. Draw exactly 10,000 stratified family bootstrap
    resamples with the frozen deterministic seed; bootstrap stratum order is comparison ID,
    then fixture-family UTF-8 order, then source sequence. U_a is the ceiling-index empirical
    quantile `ceil(10000*(1-.05/m))` of sorted resampled advantages (ties retain all equal
    values). PASS iff every U_a<=delta, the precommitted >=80% power at the actual per-comparison Bonferroni alpha .05/m for **every** comparison at fixed alternative A=delta+epsilon holds, and every quality rule holds. Missing comparison, duplicate ID,
    seed/resample error, contamination, budget error, insufficient power/data, or any other
    outcome has precedence `INCONCLUSIVE`/fail closed over PASS. There is no Holm, ranking,
    adaptive alpha, or test-data-dependent confidence level.

    `practical_payload_maxima/v1` separately freezes production byte maxima. The distinct
    `synthetic_u64_parser_edges/v1` corpus tests near-2^64 declared lengths, overflow and
    truncation and must be rejected before allocation; it is never a practical payload.

14. **Privacy and minimization:**
 Receipts and RAT packages contain only the identity,
    role, decision, revision, reason/evidence digests, sequence, and audit metadata
    required for governance. Full personal profiles, credentials, prompts, private
    reasoning, restricted data, and holdout semantics are excluded. Access, public
    disclosure, retention, deletion/pseudonymization, backup expiry, legal basis, and
    audit-review cadence are human-ratified before production; exports enforce the same
    field allowlist and scope as the source record.
15. **Accessible, fast human review:** The Gate/RAT review presents the AI
    recommendation, why, material risks, missing evidence, required role, exact target,
    and proposed editable reasoning before the action controls. It distinguishes AI
    draft, human edit, effective ruling, blocked, superseded, signature-invalid, and
    stale-revision states in plain text and not by color alone. Keyboard and supported
    screen-reader users can inspect evidence, compare changes, edit reasoning, submit or
    request revision, recover from validation errors, and verify success without lost
    focus. Loading, generation, empty, denied, signing, verification, recovery and error
    states are actionable.
16. **Reliable submission and honest feedback:** The interface distinguishes
    `PENDING_PROOF`, `PENDING_COUNTERSIGNATURE`, `PROOF_FAILED`,
    `COUNTERSIGNATURE_FAILED` and `EFFECTIVE`. It acknowledges pending intent
    without calling it approved/ratified, and shows durable success only after the atomic
    effective transaction returns the exact receipt/event sequence and target. A stable
    idempotency key makes retries return the same intent/effective receipt without
    duplicating or overwriting a decision. Signing, export, evidence, evaluator, or
    issuer failures name the owner, next check, dependency, retry eligibility and safe
    status rather than returning a spinner to an ambiguous action button.
17. **Rollback and recovery:** A reversible control can stop new AI package generation,
    decision submission, signing, countersigning, export, or evaluator delivery by
    scoped capability without deleting or changing existing rulings, receipts,
    signatures, evidence, holdout custody, or human decisions. Recovery revalidates
    identity, keys, sequence, idempotency, exact revisions, evidence access and derived
    views before resuming. Event-log replay can reconstruct the authoritative view; a
    cache, search index, Buzz mirror, or Git link outage cannot become authority.
18. **STR-024 unblocking remains human-controlled:** STR-027 may prepare and verify the
    signed Gate 1 evidence package, editable exact-Exam RAT package, and evaluator-owned
    manifest/digest/custody package required by STR-024. It cannot sign for Idriss
    Enayat, appoint qualified owners, ratify a proposal, expose holdouts, update the
    frozen Brief without separate human authorization, or decide Gate 2. STR-024 stays
    blocked until its exact Exam requirements and the final Test/Critic evidence are
    satisfied and an authorized human records the Gate 2 ruling in a separate session.
19. **Codex-supervisor boundary:** The implementation and operating procedure remain
    equal to or narrower than exact commit
    `bcf4856f4193ce3339cbdc58ea26b7cc6e5cd9de`. Codex may start, observe, safety-stop,
    and read-only troubleshoot a separately authorized named-agent run, and may repair
    agent/runtime/platform configuration only under another authorized platform item.
    It cannot author or finish the assigned deliverable, fabricate/rewrite evidence,
    sign or countersign a receipt, submit a RAT/gate ruling, grade the evaluated agent,
    access blind holdouts, or count its output as agent performance. Emergency activity
    remains a new human-authorized, labeled, time-bounded supervisor run and cannot
    repair the delivery artifact or approve a gate.
20. **Falsifiable learning:** The release records eligible/generated/human-ready/
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
authenticated intent (`PENDING_PROOF`; no authority effect)
        ↓
canonical payload + verified detached issuer proof
        ↓
`PENDING_COUNTERSIGNATURE` when required; still no effect
        ↓
every required distinct authenticated human countersigns exact receipt
        ↓
atomic verification + `EFFECTIVE` transition → authoritative ruling
        ↓
separate policy-required in-file audit note, if any

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
as human judgment; exploit a crash between human intent, signing, verification and
effect; reuse a signature on another item; create a self-referential/unverifiable signed
object; reorder or erase events; leak a private key or human reason; recover a
low-entropy assertion through offline digest guesses; correlate/replay commitments
across cases; expose blind holdouts through UI, logs, timings, lengths, links, or error
messages; or present a spinner/retry as success while no effective ruling exists.
Default-deny role checks, exact content/revision digests, deterministic canonicalization,
signature-free payloads, protected detached envelopes, atomic proof-to-effect,
non-replayable event sequencing, signer separation, protected keys, append-only
verification/supersession, scoped access, idempotent submission, independent
verification, safe redaction, randomized fixed-size ciphertext or domain-separated
high-entropy commitments, custodian-only openings, and explicit failure states are
required mitigations. Residual risk remains for compromised human credentials, coerced
or inattentive human approval, issuer/root-key compromise, and qualified-owner gaps;
the system must surface those risks and stop rather than silently compensate.

**Default-closed human decisions before Gate 2/implementation:**

| Consequential choice | Accountable human owner | Required co-ratifier or evidence | Default while unresolved |
|---|---|---|---|
| Receipt canonicalization profile and length encoding, detached-envelope signature algorithm, issuer trust root, key custody/rotation/revocation, historical verification | Idriss Enayat, Product/Tech owner | A named qualified identity/security owner; threat model, canonical test vectors and key-service evidence | No production signer, countersigner or effective export; signature-free payload and atomic proof-to-effect remain mandatory |
| Which Gate/RAT records may be public; actor fields, reason visibility, access, retention, deletion/pseudonymization, backup expiry and legal basis | Idriss Enayat, Product/data owner | A named qualified privacy/data owner and data-inventory ruling | Private, least-privilege evidence only; no public disclosure |
| Co-ratifier matrix and whether one human may hold multiple roles for each risk class | Idriss Enayat, Product/Tech owner | Named domain owners and the solo/team policy ruling | Missing qualified owner blocks the affected RAT/gate |
| Supported Gate types, exact artifact/body hash rules, cooling-off/batch/session policy and countersignature sequence | Idriss Enayat, Product/Tech owner | CORE-10/11 policy checks and independent Test review | STR-027 cannot replace existing GATES/SOLO rules |
| AI recommendation model/agent/config, evidence allowlist, confidence/error behavior and edit-diff retention | Idriss Enayat, Product owner | Named Test owner; privacy/security review | Advisory generation remains disabled outside synthetic/test data |
| B01–B12 owner/custodian/evaluator/transport principals, keys, safe ciphertext/commitment mode, `assertion-set SHA-256` interpretation, signed manifest/bindings, opening/access logs and contamination response | Idriss Enayat, Product/experiment owner | Named human Test owner and fixture custodian; exact STR-024 Exam evidence and anti-dictionary/replay/leakage test vectors | No raw assertion digest, valid manifest, score, RAT-EVAL or STR-024 Gate 2 package |
| Accessibility support matrix and manual evidence owners | Idriss Enayat, Product owner | Named qualified accessibility/design owner | No production readiness or accessibility claim |
| Availability, RPO/RTO, receipt retention, reconciliation, disable/recovery commands and rollback owner | Idriss Enayat, Tech owner | Named Ops/reliability owner and rehearsal evidence | Fail closed; preserve records; no new submissions during degradation |

Naming Idriss Enayat as the accountable resolution owner does not infer that he is the
qualified specialist for every row. When a separately qualified co-ratifier is required
and has not been named, that gap is a blocker, not permission for an agent or Codex to
fill the role.

## Proposed approach for Gate 1 framing

Keep Work Management as the authority and add a narrow decision-package contract around
an append-only pending human intent, a signature-free canonical payload, a protected
detached signature envelope, append-only verification, and one atomic/idempotent
`EFFECTIVE` transition. Pair it with an editable AI-prepared advisory, optional
policy-required human countersignature/in-file audit note, and confidentiality-preserving
holdout bindings. Treat signing, verification, preparation, human judgment, evaluator
custody, and communication as separate scoped principals/capabilities. Prefer a
provider-neutral contract whose first vertical slice proves the exact STR-024 Gate 1
receipt and RAT package without exposing holdouts or changing any existing human ruling.

The Architect should compare at least: (A) signing canonical exports directly from the
authoritative event service with an independent verifier; (B) an append-only transparency
ledger/proof service projected into Work Management; and (C) an external evidence signer
that receives immutable event digests. The comparison must preserve existing GATES/SOLO
policy, role separation, key custody, privacy, recovery, accessibility, and portability.
No option is chosen by this Scout Brief.

Rejected at this stage: treating Git commit authorship, typed timestamps, screenshots,
chat/Buzz messages, AI recommendations, an unsigned payload without its verified
protected envelope/effective event, browser state, or Codex supervisor claims as
authority; signing bytes that include their own signature or derived verification
result; making pending intent effective before proof; letting the signer create
decisions; publishing raw/stable hashes of low-entropy holdout assertions; exposing blind
holdouts to simplify review; one-click bulk ratification; or editing historical records
to make verification pass.

---

GATE 1: PENDING — authenticated human Product Lead ruling required for this exact revision
GATE 1 EVIDENCE: PENDING — must bind the approver, role, decision, time, sequence, exact Brief revision, and required checks
