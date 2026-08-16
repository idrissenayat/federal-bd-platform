# STR-027 clean final Gate 1 Critic review

**Disposition:** `BLOCK`
**Review role:** STEER Critic Agent
**Exact target:** Scout commit `d886902236c1da88ceeb49d9bd78d1449a884b4e`
**Review boundary:** Fresh independent review of the exact target without consulting a Test result or adopting a prior conclusion. This commit adds this Critic evidence file only. It does not alter or approve the Brief, prior evidence, Exam, application/code, a gate, PR, merge, deployment, or release.

## Executive result

The correction materially improves the acyclic revocation-entry preimage and replaces the invalid rank-dependent method with uniform Bonferroni bounds. The bounded cohort, pre-effect countersignature, and exact audit-descendant contracts also remain intact. The exact Brief is nevertheless not uniquely implementable: its literal intent schema omits the policy security structure it says is signed, and its snapshot schema/embedding rules both under-type and remove the revocation-entry digest from issuer/countersignature signed bytes. The power check also uses a different alpha from the Bonferroni decision it is meant to qualify.

## BLOCKER 1 — the literal intent schema does not carry the frozen required-signer policy

Item 2 requires signed `required_signer_set/v1` to contain `policy_id`, `policy_version`, ordered role slots, `minimum_distinct_humans`, eligible principal IDs, required count, role-slot assignments, and the forbidden role-pair/set matrix (Brief lines 125–131). But the exhaustive `intent/v4` schema declares `required_signer_set` only as an array whose elements contain exactly `principal_id` and `role_slot` (lines 141–149). No other literal intent member carries the minimum, required count, eligibility universe, assignments, or forbidden matrix.

Because unknown members are rejected, implementations cannot add the missing policy fields. A verifier therefore cannot reconstruct the claimed frozen required set from the signed intent or prove that the number/separation of countersignatures satisfies the governing policy. The later CAS and role checks cannot cure information absent from the canonical signed object.

**Smallest safe correction:** define one literal `required_signer_set/v1` object schema containing every Item 2 policy member with exact types, cardinalities, ordering and matrix semantics; embed that object in `intent/v4`; define `required_set_digest` over its named canonical bytes; and make required-count-zero versus countersignature-required transitions derive only from that signed object.

## BLOCKER 2 — snapshot typing and embedding contradict unique signed revocation binding

The entry preimage itself is now acyclic and deterministic: it has a domain-separated, digest-free canonical object; entries are ordered, key-unique, and reject invalid/duplicate/out-of-order data; empty `[]` is explicit (lines 176–182). The snapshot definition is not equally literal. It groups `as_of`, `authority_id`, `authority_key_id`, `effective_at`, `entries_digest`, `expiry`, and `issued_at` as “all ID/time types above” (lines 183–185), although the declared primitive vocabulary has no generic `ID` type and those members require different primitives: authority identifiers/keys are strings, times are `time`, and `entries_digest` must be `hex64`. More materially, issuer and counter objects are said to embed the complete snapshot **except both `signature_b64` and `entries_digest`** (lines 189–190). That partial object is neither the exact `revocation_snapshot/v1` schema nor does it bind the revocation-entry digest in issuer/countersignature signature inputs.

Thus a proof's signed issuer/counter bytes can be associated with different separately obtained entry sets/snapshots while retaining the same embedded partial metadata. The authority snapshot signature may authenticate an entry digest separately, but the proof does not uniquely name that signed snapshot object or digest. This defeats the requested proof-to-snapshot association and makes the otherwise useful highest-sequence, rollback/equivocation, expiry, offline-cache, and atomic recheck rules non-deterministic at the binding boundary.

**Smallest safe correction:** assign an explicit primitive type to every snapshot member, keep `entries_digest` in the exact snapshot metadata embedded in every issuer/counter signed header/body, and bind the authority's detached `signature_b64` or an unambiguous digest of the complete authority-signed snapshot envelope. Do not describe a partial object as `revocation_snapshot/v1`; give any signed projection its own exact schema and equality rule.

## BLOCKER 3 — the power gate is evaluated at the wrong alpha

The decision bounds correctly use immutable `m`, fixed comparison ordering, uniform per-comparison alpha `.05/m`, exactly 10,000 deterministically ordered stratified resamples, and PASS only when every upper bound is at most `delta` (lines 311–325). However, the accompanying mandatory power condition is stated at alpha `.05`, not at the actual Bonferroni comparison alpha `.05/m` (line 321). For `m>1`, 80% power at `.05` does not establish 80% power for the stricter `.05/m` bounds used to decide PASS. This can admit an underpowered family while the text claims the power rule passed.

**Smallest safe correction:** evaluate and precommit the >=80% power requirement at the actual per-comparison alpha `.05/m` (and for the same estimator/resampling decision), or state and justify a conservative family-level power criterion that implies it. Preserve fail-closed treatment of missing inputs, insufficient data/power, errors, contamination, and all other quality failures.

## PASS findings

- **Enrollment and denominator:** One pre-generation, immutable scope/predicate/UTC/N/source-order contract enrolls every match; every enrolled eligible unit remains in the denominator; closure, ties, reconciliation and missing/error ambiguity fail closed. No extendable legacy cohort remains.
- **Bonferroni decision mechanics:** `m` and comparison IDs are immutable and ordered before the sealed test; all comparisons use the same `.05/m` confidence allocation; ranking, adaptive alpha and test-data-dependent confidence levels are expressly forbidden. The ceiling index remains within the 10,000 sorted draws for allowed `m`, and ties/errors cannot create PASS.
- **Pre-effect authority and identity separation:** `PENDING_PROOF` and `PENDING_COUNTERSIGNATURE` have no ruling effect. The last valid required signature is checked in the atomic transition; distinct-human, submitter/countersigner and role-slot restrictions remain explicit; replay, crash, stale/revoked/conflicting and incomplete states fail closed.
- **Audit descendant:** The signed pre-note body range, LF normalization, exact two-terminal-line replacement, sole-parent requirement, preserved substantive hash/tree identity and two-commit offline verification remain exact. An added parent or any substantive inheritance change fails closed.
- **Other framing:** Privacy, key isolation, accessibility/error states, operational stop/recovery, practical payload maxima versus parser-edge rejection, and non-claims remain adequate default-closed Gate 1 framing pending named human ratification and later evidence.

## Disposition and smallest human next action

**`BLOCK` Gate 1 readiness for exact Scout commit `d886902236c1da88ceeb49d9bd78d1449a884b4e`.** This is advisory Critic evidence, not a Gate 1 ruling.

Authorize one surgical Scout correction limited to (1) embedding the complete literal required-signer policy in the signed intent, (2) explicitly typing and binding one complete signed snapshot identity including `entries_digest` in every proof, and (3) matching the power criterion to Bonferroni alpha `.05/m`. Then commission one fresh exact-revision Critic review before any separate authenticated human Gate 1 action.
