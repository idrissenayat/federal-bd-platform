# STR-027 final independent Gate 1 Critic recheck

**Disposition:** `BLOCK`
**Review role:** STEER Critic Agent
**Exact target:** Scout commit `8ffce58ed2c7176041b97a710d19220e7ff1a601`
**Review boundary:** Independent fresh recheck of the exact corrected Brief. No Test result or prior conclusion was used. This commit adds this evidence file only and does not alter or approve Scout artifacts, the Exam, application/code, a gate, PR, merge, deployment, or release.

## Executive result

The corrected Brief preserves the pre-effect countersignature rule and closes the legacy cohort contradiction and audit-descendant ambiguity. It is not yet Gate 1-ready: the proof/revocation grammar still does not uniquely identify all signed objects, and the claimed simultaneous leakage procedure is not a valid or complete Holm construction. Both defects permit different conforming verifiers to reach different results.

## BLOCKER 1 — the revocation and envelope schemas are still not uniquely byte-constructible

The correction usefully freezes binary JSON fields to unpadded base64url, gives one top-level envelope layout, fixes 64-byte Ed25519 signatures and domain-separated issuer/countersignature inputs, and orders intent → issuer → countersignature without self-reference (Brief lines 130–165). Replay tuples, role slots, receipt/intent/issuer digests and named policy/trust metadata are signed.

Two remaining ambiguities are material:

1. `steer.decision.intent.v4`, decoded issuer header/body, decoded countersignature header/body and `revocation_snapshot/v1` are still prose field lists rather than exact JSON member names, JSON types, cardinalities and unknown-field rules. The only literal object schema is the outer envelope. For example, “receipt/idempotency IDs,” “tenant/scope,” “policy/trust versions,” and “required set” admit nested versus flat representations and number versus string encodings that all satisfy the prose but produce different RFC 8785 bytes.
2. `revocation_snapshot/v1` “contains … canonical snapshot digest” and a detached signature, but never identifies the bytes that digest covers. If it means the snapshot object, it is self-referential; if it means a revocation-entry set, that object's schema/bundling is absent. Header/body bind every snapshot field except the detached signature, while the authority signs `canonical_snapshot_without_signature`; the text does not say whether that authority-signed object includes its own `canonical snapshot digest`. Consequently the digest/signature input and the material needed for deterministic offline revocation checking remain ambiguous.

Freshness behavior is otherwise materially improved: signed authority/key/sequence/times/policy, same-sequence equivocation rejection, highest retained sequence, expiry, rollback checks and atomic re-verification default closed. However, an offline verifier cannot apply those checks deterministically until the exact snapshot/list bytes and schemas are frozen.

**Smallest safe correction:** freeze literal JSON schemas for the intent, both decoded headers/bodies, and snapshot/list objects (exact names, types, required/forbidden fields and bounds). Define the snapshot digest over a separately named canonical `revocation_entries/v1` byte object, exclude that digest from its own preimage, bundle those bytes, and state exactly which signature/digest fields each enclosing object carries. Supply positive and mutation vectors for Gate 2.

## BLOCKER 2 — the leakage confidence procedure calls a non-Holm ordering “Holm” and does not guarantee simultaneous 95% coverage

The corrected outcome contract (lines 275–303) now has one pre-start, human-frozen universe, deterministic predicate/log source, monotonic enrollment before generation, finite UTC/N closure, no extension/substitution, all-failure denominator, and fail-closed reconciliation/tie handling. The legacy first-10/day-30 extension is gone. This closes selectable cohort/denominator gaming at Brief level, subject to later human ratification of the concrete universe and parameters.

The leakage direction is also corrected: unsafe `H0: A > delta`, safe `H1: A <= delta`, and pass only when all one-sided upper bounds are at or below delta. The attack set, adaptive budget, sealed test, resampling seed/count, family resampling, candidate inclusion and power point are now explicit.

But the multiplicity rule is not Holm's procedure. It sorts attacks by **descending observed advantage** (with identifier ties), assigns `alpha_i=.05/(m-i+1)`, and independently forms all bounds. Holm step-down sorts valid p-values from smallest to largest and applies sequential rejection/stop rules. Without those p-values and stop rule, the stated per-bound alpha allocations sum above .05 for `m>1`; they do not establish the claimed simultaneous 95% family-wise coverage. Ordering by observed effect also uses the same sealed test data to choose confidence levels without a proved simultaneous construction. A favorable rank can therefore receive a looser bound and manufacture PASS while the text still calls it Holm-adjusted.

The strict unsafe null `A > delta` versus safe alternative `A <= delta` also leaves the boundary decision to the confidence inequality, which is acceptable only once a valid simultaneous upper-bound method is frozen.

**Smallest safe correction:** choose one valid construction and state it exactly. The simplest is Bonferroni: for all `m` pre-enumerated fixed and admitted candidates, use the same one-sided percentile level `1-.05/m`, and pass only if every bound is `<= delta`; failed candidates remain included/fail closed. Alternatively define valid bootstrap p-values for `H0,a: A_a >= delta`, Holm's p-value ordering, sequential stop/rejection rule, and inversion into simultaneous bounds. Freeze deterministic PASS/FAIL/INCONCLUSIVE precedence and verify family-wise coverage/power with vectors or simulation evidence at Gate 2.

## PASS findings

- **Audit descendant:** The pre-note byte range, LF normalization, signed pre-note identity, exact two-terminal-line-only diff, sole-parent descendant, unchanged body/tree and two-commit offline checks remain intact (lines 175–187). Substantive inheritance fails closed.
- **Pre-effect authority:** Required signatures remain ineffective in `PENDING_COUNTERSIGNATURE`; one CAS verifies every role/proof/snapshot before the sole `EFFECTIVE` transition. Crash, retry, replay and mirrors default closed.
- **Human separation:** Submitter/countersigner separation, one human per slot, minimum distinct humans, fixed role assignments and forbidden combinations remain explicit.
- **Privacy/accessibility/operations/payload limits:** Least privilege, unresolved private disclosure, key isolation, accessible state/recovery flows, scoped operational stops, event replay and distinct practical versus rejection-only U64 limits remain adequate Gate 1 framing. Concrete specialist choices correctly remain default-closed before production.
- **Claims:** No measured time, security, compliance, accessibility or universal-value claim is made prematurely.

## Disposition and smallest human next action

**`BLOCK` Gate 1 readiness for exact Scout commit `8ffce58ed2c7176041b97a710d19220e7ff1a601`.** This Critic evidence is advisory and does not rule on Gate 1.

Authorize one narrowly scoped Scout correction limited to literal nested/revocation schemas and one valid simultaneous leakage method. Then perform a fresh exact-revision Critic check. If it passes, the authenticated Product Lead may separately review and record Gate 1 through the preserved pre-note/audit-descendant protocol.
