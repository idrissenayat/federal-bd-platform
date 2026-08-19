# STR-027 clean Gate 1 readiness Critic review

**Disposition:** `BLOCK`
**Review role:** STEER Critic Agent
**Exact target:** Scout commit `94ac4d31a1442bde8868a15bf2cee606d1f9814b`
**Review boundary:** Fresh first-principles review of the complete exact Brief. No Test result or prior conclusion was consulted. This commit adds this Critic evidence file only and does not alter or approve the Brief, prior evidence, Exam, application/code, a gate, PR, merge, deployment, or release.

## Executive result

The minimal correction closes both requested binding gaps: countersignatures now bind a deterministic digest recomputed from the issuer-signed `required_signer_set/v2`, and `authority_id` is included in the snapshot identity used across proofs, cache/rollback state, and atomic effect. The pre-effect, role-separation, audit-descendant, cohort, Bonferroni/power, privacy, accessibility, and operational contracts remain default closed. A clean review of the whole current schema nevertheless finds two remaining signed-byte ambiguities in the issuer envelope: its outer schema discriminator is neither fixed nor issuer-authenticated, and its intent-digest equality rule compares unlike representations without naming the hash operation.

## BLOCKER 1 — the issuer outer-envelope schema is unconstrained and absent from its signature input

Every outer envelope has an exact member named `schema`, but the Brief gives that member only the primitive type `string`; it never fixes an issuer-envelope or countersignature-envelope discriminator value (Brief lines 163–167). More importantly, the generic envelope digest includes `schema_UTF8`, while the issuer signature input signs only length-delimited decoded header and body bytes (lines 165–175). An attacker can therefore replace the issuer outer `schema` string without invalidating the issuer signature. This is directly reachable when `required_count=0`, where no countersignature subsequently binds `issuer_envelope_digest`, and it also leaves parsers free to route the same issuer-signed H/B bytes under different outer protocol labels.

The header/body internal `schema` value does not cure an unauthenticated outer discriminator because the Brief defines both and does not require equality or a fixed outer value. Independent verifiers can accept different outer strings while claiming conformance, so the signed object is not uniquely identified.

**Smallest safe correction:** freeze exact outer schema values for each envelope type and include the outer schema in the issuer and countersignature signature preimages (or sign the already defined complete envelope-digest preimage). Require the outer discriminator to match the internal header/body schema before any proof or state transition, including the zero-countersigner path.

## BLOCKER 2 — the issuer intent binding compares canonical bytes to a digest without defining the comparison

`issuer_body/v2` embeds `intent_b64`, while issuer header/body carry `intent_digest` `hex64`. The only equality rule says, “The decoded intent must equal `intent_digest`” (Brief line 173). Decoded intent is canonical JSON bytes/object; `intent_digest` is a 64-character SHA-256 value. They cannot literally be equal, and this rule does not say to hash the exact decoded canonical bytes and compare the lowercase result. Item 3 earlier says the intent digest is SHA-256 canonical bytes (line 146), but the issuer verification rule must still identify which decoded representation is canonicalized/hashed and reject a body whose embedded intent does not produce the signed digest.

Without that explicit operation, one implementation can compare the raw decoded bytes incorrectly, another can reserialize a parsed object, and another can infer the intended byte hash. That defeats deterministic offline verification at the primary intent-to-issuer association.

**Smallest safe correction:** require `intent_b64` to decode to exact RFC 8785 canonical UTF-8 `intent/v4` bytes; compute SHA-256 over those exact decoded bytes; require its lowercase hex to equal every repeated `intent_digest`; and reject before signature acceptance or state change on decode, canonicality, schema, or digest mismatch.

## Confirmed closures and PASS findings

- **Required-set binding/no unsigned path:** `required_signer_set/v2` is the sole accepted schema. Its literal signed object carries eligible principals, unique assignments, required/minimum counts and forbidden role pairs. `required_set_preimage/v2` is domain-separated and length-delimited over exact canonical bytes decoded from the issuer-embedded signed intent; both counter header/body bind the digest, and mismatch rejects before proof counting or state change.
- **Revocation identity/replay:** Every snapshot member is typed; the complete authority-signed snapshot includes `entries_digest` and is embedded byte-identically in issuer/counter signed bytes. Identity now includes `authority_id`, authority key, sequence, digest, all times and trust-policy version across proofs, cache namespace, rollback/equivocation checks, and atomic EFFECTIVE input. Entry preimage construction is acyclic; empty, duplicate, invalid and out-of-order rules are deterministic and fail closed.
- **Pre-effect authority and distinct humans:** `PENDING_PROOF` and `PENDING_COUNTERSIGNATURE` remain ineffective. Signed required count/assignments, human-type exclusions, one-human/one-slot, submitter separation, nonce/idempotency/replay checks and the sole atomic EFFECTIVE transition remain explicit; zero countersigners is the only direct path.
- **Exact audit descendant:** The pre-note substantive byte range, LF normalization, signed commit/path/blob/hash, exact two-terminal-line diff, sole-parent descendant, preserved body/tree and two-commit offline checks remain exact and reject added parents or inherited substantive edits.
- **Cohort/statistics:** Scope, predicate, UTC bounds, finite N and source ordering are frozen before enrollment; every match enrolls before generation and every enrolled unit stays in the denominator. Immutable `m`, fixed comparison order, uniform Bonferroni `.05/m` one-sided bounds, deterministic 10,000 resamples, and >=80% power for every comparison at `.05/m` and `A=delta+epsilon` are fail closed on missing/error/quality/contamination outcomes.
- **Privacy/accessibility/operations:** Data minimization, key isolation, holdout protection, human-ratified disclosure/retention, keyboard/screen-reader and actionable error states, scoped operational stops, recovery/reconciliation, payload/parser-edge separation and no premature value/security/accessibility claims remain adequate Gate 1 framing.

## Disposition and smallest human next action

**`BLOCK` Gate 1 readiness for exact Scout commit `94ac4d31a1442bde8868a15bf2cee606d1f9814b`.** This evidence is advisory and does not rule on Gate 1.

Authorize one final byte-binding correction that freezes and signs the outer envelope discriminator and replaces the impossible decoded-intent/digest equality with an exact canonical-byte SHA-256 verification rule. Then commission one fresh exact-revision Critic check before any separate authenticated human Gate 1 action.
