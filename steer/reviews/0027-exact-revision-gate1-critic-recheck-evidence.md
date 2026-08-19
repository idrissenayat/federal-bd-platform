# STR-027 exact-revision Gate 1 Critic recheck

**Disposition:** `BLOCK`
**Review role:** STEER Critic Agent
**Exact target:** Scout commit `2ee7064c52875ec2f43b9a48b3b7c9ce2762c930`
**Review boundary:** Fresh independent review of the exact target. No Test result was consulted. This commit adds this Critic evidence file only and does not alter or approve the Brief, prior evidence, Exam, application/code, a gate, PR, merge, deployment, or release.

## Executive result

The surgical correction closes the power-alpha mismatch and puts the signer policy and complete authority-signed snapshot inside signed proof bytes. Earlier passing pre-effect, cohort, Bonferroni, separation, and audit-descendant controls remain intact. Two exact association defects remain: the countersignature's `required_set_digest` has no named canonical preimage/equality rule, and the defined snapshot identity omits `authority_id` despite cache/rollback authority being keyed by it. Both allow implementations to disagree at a security boundary.

## BLOCKER 1 — `required_set_digest` still has no defined signed-object preimage

`intent/v4` now embeds a literal `required_signer_set/v2` object. Its eligible universe, assignments, required count, minimum distinct-human count, and forbidden role pairs have explicit member sets, bounds, ordering, uniqueness, and consistency rules (Brief lines 141–160). The verifier is expressly forbidden from using unsigned policy data. This materially closes the prior omission.

However, every countersignature still carries `required_set_digest` `hex64` (line 180), while the Brief never defines that digest as SHA-256 over the canonical bytes of `required_signer_set/v2`, never gives a domain-separated preimage, and never requires equality with the set decoded from the signed intent. The global digest convention only applies to a **named** canonical byte preimage; none is named here. The stale Item 2 label also calls the policy object `required_signer_set/v1` and says it contains `policy_id`/`policy_version`, whereas the exhaustive object is `v2` and those fields are siblings in the intent (lines 125–127 versus 141–160).

A verifier can recover the policy from the issuer-embedded intent, but cannot determine what the countersigner's `required_set_digest` attests or reject a mismatched digest by one frozen rule. That leaves the countersignature-to-required-set association under-specified.

**Smallest safe correction:** use `required_signer_set/v2` consistently; define one domain-separated `required_set_digest` preimage over its exact RFC 8785 canonical bytes (and, if intended, the sibling policy identifiers); and require every countersignature digest to equal the digest recomputed from the issuer-embedded signed intent before its slot can count.

## BLOCKER 2 — snapshot identity omits the authority identifier used for monotonicity

The complete `revocation_snapshot/v1` is now explicitly typed and includes `entries_digest` and the authority signature. Issuer and counter header/body signed bytes must embed that complete object byte-for-byte, entry bytes are checked against the digest, and atomic EFFECTIVE rechecks the unexpired identity (lines 188–211). This closes the prior partial-snapshot and unsigned-entry association defect.

But the normative “snapshot identity” tuple is `(authority_key_id,sequence,entries_digest,issued_at,effective_at,as_of,expiry,trust_policy_version)` and omits `authority_id` (lines 205–207), while monotonic highest-sequence state is keyed by `(authority_id,trust_policy_version)` (line 208). The text then requires only that truncated identity to equal the verifier cache and atomic input. One authority key can therefore sign otherwise identical snapshots under different authority IDs that compare as the same defined identity but occupy different rollback/sequence namespaces. Conversely, a cache keyed by the stated monotonic tuple cannot use the defined identity alone. “Complete snapshot” equality across proofs does not cure the explicitly narrower cache/EFFECTIVE identity rule.

**Smallest safe correction:** define snapshot identity as the digest of the complete canonical authority-signed snapshot envelope, or include every snapshot member—at minimum `authority_id`, `authority_key_id`, sequence, entry digest, every time, policy version, schema, and authority signature—and require exact identity equality across issuer, every countersignature, cache key/value, rollback/equivocation checks, and atomic EFFECTIVE input.

## PASS findings

- **Power and familywise PASS:** Every fixed comparison must now precommit and demonstrate at least 80% power at its actual Bonferroni alpha `.05/m` for the unsafe competence point `A=delta+epsilon`; missing/insufficient power precedes PASS. Immutable `m`, fixed IDs, uniform upper bounds, deterministic 10,000-resample ordering, and missing/error/contamination precedence remain fail closed.
- **Enrollment and denominator:** Scope, predicate, UTC start/end, finite N, and source ordering are frozen before enrollment; every match enrolls before generation and every enrolled eligible unit remains in the denominator. Tie, reconciliation, missing, and source ambiguity cannot pass.
- **Pre-effect authority and separation:** Pending intent and `PENDING_COUNTERSIGNATURE` remain ineffective. Required count and assignments are signed; nonzero countersignature requires distinct assigned human principals; submitter/countersigner, role-slot, replay, stale/revoked, crash, and incomplete cases fail closed before the sole atomic EFFECTIVE transition.
- **Revocation construction:** The entry preimage remains acyclic; entry ordering, uniqueness, invalid/duplicate rejection, and canonical empty-list behavior remain explicit. Complete snapshots are signed into issuer and counter bytes, so substitution between proofs is rejected apart from the identity/cache omission above.
- **Audit descendant and other prior passes:** The exact substantive byte range, LF normalization, two-terminal-line-only diff, sole-parent descendant, tree/body hash, and offline two-commit checks remain unchanged. Privacy, key isolation, accessibility, recovery, payload-limit separation, and non-claims remain default closed pending human ratification.

## Disposition and smallest human next action

**`BLOCK` Gate 1 readiness for exact Scout commit `2ee7064c52875ec2f43b9a48b3b7c9ce2762c930`.** This evidence is advisory and does not rule on Gate 1.

Authorize one minimal Scout correction that defines and verifies `required_set_digest` against the canonical signed `required_signer_set/v2`, and makes the cache/atomic snapshot identity include `authority_id` and the complete authority-signed snapshot. Then commission one fresh exact-revision Critic check before any separate authenticated human Gate 1 action.
