# STR-027 revised Brief — fresh Gate 1 Critic evidence

**Disposition:** `BLOCK`
**Review role:** STEER Critic Agent
**Exact target:** Scout commit `bb43b28c0abaff0b855cd381c2aa47fee79d4592`
**Target Brief:** `steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md`
**Review boundary:** Fresh Gate 1 design challenge of the exact target. This file adds Critic evidence only. It does not edit or approve the Brief or Exam, use a concurrent/new Test result, exercise human authority, or authorize implementation, PR readiness, merge, deployment, or release.

## Executive challenge

The revision successfully replaces the contradictory post-effect route with one default-closed `PENDING_PROOF → PENDING_COUNTERSIGNATURE → EFFECTIVE` route. It also materially improves human separation, denominator enrollment, blind-evaluation planning, parser-edge separation, privacy, accessibility and recovery framing. Gate 1 should nevertheless be **withheld** because two authority identities are not constructible from the stated bytes, the exact-revision audit protocol remains ambiguous, and the learning/leakage claims still permit a selected or statistically undefined pass.

## Finding 1 — BLOCKER: the counter-proof binds an undefined, apparently self-referential issuer proof

**Attack.** The receipt payload contains an `issuer-proof digest` (Brief lines 127–135). A countersigner then signs the complete payload *and* `issuer_envelope` bytes (lines 137–147), and effect requires issuer-proof verification (lines 159–168). But the revised Brief never defines:

- the issuer envelope schema, protected header, signed bytes, canonical representation, algorithm/trust profile or identifier;
- whether `issuer-envelope SHA-256`, `issuer-proof digest`, and `issuer_envelope` are the same object/digest;
- how an issuer can sign a payload containing the digest of that signature envelope without a circular fixed-point construction; or
- which exact envelope bytes an offline verifier obtains when the payload carries only a digest.

The counter-proof's own metadata also appears twice: `signed-at`, nonce, signer principal and policy are fields of the proof, but only `kid`, `alg`, payload/required-set digests, role slot and purpose are in its protected header. The signed byte string covers the protected header, payload and issuer envelope—not a canonical signature-free proof body containing `signed-at`, nonce or signer principal. Those fields can therefore be altered unless their values are independently and uniquely derivable; yet certificate validity and nonce uniqueness explicitly depend on them (lines 149–158). Offline verifiers can disagree about signer, time, freshness and replay while validating the same detached signature.

**Why material.** This defeats the core authenticity, revocation, replay and offline-verification claim and prevents a falsifiable implementation contract. `PENDING_COUNTERSIGNATURE` is safely ineffective in prose, but no conforming proof can be unambiguously produced and verified.

**Smallest safe correction.** Before Gate 1, freeze two acyclic signature-free objects and domains: (1) an issuer payload plus issuer protected header/envelope whose payload does **not** contain its resulting envelope digest; and (2) a countersignature body that signs every security-relevant proof field, including signer principal, certificate/key, assigned slot, signed-at, nonce, payload digest and issuer-envelope digest. Define exact schemas, canonical bytes, trust/revocation time used at the atomic effect transaction, retrieval/bundling, duplicate/unknown-field rejection, and golden/negative vectors. Then make the receipt/event identity a digest or explicitly bound ID of those immutable objects.

## Finding 2 — BLOCKER: “exact revision” and the mandatory in-file Gate 1 descendant have no reproducible identity rule

**Attack.** The Brief requires Gate 1 to bind the “exact Intent Brief” and says a detached receipt is insufficient when an in-file note is required (lines 172–177). It ends with Gate 1 pending for “this exact revision” (lines 482–483). Recording the required in-file approval necessarily creates a different Git commit and different file hash from `bb43b28…`. The payload lists both file SHA-256 and body SHA-256 (lines 127–135), but the Brief never defines the substantive-body normalization/exclusion algorithm, the only fields an audit descendant may change, the required parent/ancestry relation, or which pre-note and post-note identities the receipt and countersignatures bind. A later actor can therefore claim either the pending commit or an edited descendant is the “exact revision,” and independent verification has no frozen oracle for permissible audit-only change.

**Why material.** This is the bootstrap authority path for the very Gate 1 now under review. Ambiguity can either make valid approval impossible or let substantive changes inherit approval.

**Smallest safe correction.** Freeze an `approved_brief_identity/v1`: pre-note commit/blob/file hash, a byte-defined substantive-body hash that excludes only the two terminal Gate 1 lines, receipt identity, and a human-authorized direct descendant constrained to those exact line replacements. Require the descendant to name the receipt and pre-note identity; require the verifier to reproduce parentage, allowed diff, body equality and authenticated actor/session rules. Keep `bb43b28…` pending until that separate human action occurs.

## Finding 3 — BLOCKER: cohort eligibility and leakage competence remain selectable, and the statistical pass rule is undefined

**Attack.** `eligible_unit/v1` counts only a “policy-defined package” that is requested during a frozen window, while supported decision types and the cohort rule need not freeze until Gate 2 (lines 33–45). The system can improve the 90% human-ready metric by narrowly defining supported types, suppressing difficult requests before ledger creation, or delaying them; and “first 10 or 30 days, but extend until 10” creates an unbounded changing-time cohort rather than a fixed denominator. No source-of-request reconciliation oracle proves that every in-scope attempt received a pre-generation ledger row.

For blind leakage, the threat model grants unlimited offline computation but competence is capped at logistic regression and one unspecified gradient-boosted model (lines 265–279). “Every adjusted result below the bound” does not define the estimand, null/alternative, one-sided non-inferiority/equivalence rule, confidence-bound direction, bootstrap procedure, experimental unit, effect size, class balance, or sample-size calculation; “detect the bound with 80% power” is not mathematically sufficient. A weak model/configuration or underpowered resampling unit can manufacture a pass. The production payload maxima are likewise named but have no concrete values or required stress/accessibility/operations evidence before later human selection (lines 281–285).

**Why material.** The Brief's value and confidentiality claims are not falsifiable under a stable population and competent oracle. These are not parser-edge details: they decide whether a release may report success or no leakage.

**Smallest safe correction.** Before Gate 1, freeze the source event and invariant in-scope predicate that atomically create enrollment before generation, reconcile rejected/suppressed requests, prohibit post-start narrowing, and close at a fixed date (report small-N uncertainty rather than extending). Pre-register the leakage estimand, experimental unit, one-sided hypothesis/CI rule, effect/bound, family-aware resampling, exact model/hyperparameter/search budget, stronger adaptive attack allowance, multiplicity family and power calculation. State that no leakage pass is possible when the competent attack suite or sample size is unmet. Require concrete practical maxima and capacity/a11y/operational evidence at Gate 2, default-closed meanwhile.

## Cross-cutting adversarial result

| Surface | Result at Gate 1 framing |
|---|---|
| Pre-effect state and atomic authority | **PASS in intent:** required signatures are ineffective until the last valid required signature and a single CAS; failures, crashes and mirrors default closed. **Blocked in constructibility by Finding 1.** |
| Human identity and role stacking | **PASS:** at least two distinct humans when countersigning is required; submitter/countersigner separation, one-person/one-slot, frozen assignments and forbidden combinations are explicit. Specialist qualification remains human-ratified and missing ownership blocks. |
| Privacy and security | **PASS in scope:** minimization, field allowlists, least privilege, no secret/display fallback, cross-tenant denial and no public export while unresolved are explicit. Exact crypto/trust verification is blocked by Finding 1. |
| Accessibility | **PASS in scope:** non-color state distinction, keyboard/screen-reader evidence review, editable reasoning, focus-preserving recovery and explicit error states are required. Concrete support matrix and owner remain correctly default-closed before production. |
| Operations and recovery | **PASS in scope:** scoped stops preserve append-only authority, replay reconstructs views, and recovery revalidates identity/revisions/evidence. RPO/RTO, commands, owners and rehearsal remain explicit unresolved human decisions that block production. |
| Practical versus parser-edge limits | **PASS on separation:** U64 edge inputs are rejection-only and pre-allocation; production maxima are a distinct profile. Concrete maxima/evidence remain part of Finding 3's default-closed correction. |
| Claims | **PASS where bounded:** time savings and universal security/compliance/accessibility are expressly unproven. **BLOCK** for selectable outcome/leakage claims under Finding 3. |

## Disposition and human next action

**`BLOCK` Gate 1 readiness for exact Scout commit `bb43b28c0abaff0b855cd381c2aa47fee79d4592`.** This is advisory Critic evidence, not a Gate 1 ruling.

Smallest safe human action: authorize the Scout to make one narrowly governed Brief revision resolving the three findings above; then commission a fresh exact-revision Critic challenge. Only after that review should the authenticated Product Lead separately approve or request changes and record the frozen receipt plus constrained in-file descendant.
