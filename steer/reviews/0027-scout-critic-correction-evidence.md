# Scout correction evidence — STR-027 fresh Critic Gate 1 findings

**Disposition:** `CORRECTION PREPARED — Gate 1 remains PENDING`

**Scope:** Authorized narrow Brief correction responding directly to fresh Critic evidence
`a085abebf3f89c95e2f7323ff2f75d328833e3c9`, preserved byte-identically in ancestry. This
commit changes only the Brief and this Scout evidence; it does not alter Exam, prior evidence,
code, application, gate state, receipt/ruling, PR, main branch, deployment, or release.

## Findings closed in the Brief

1. **Constructible proofs:** The Brief now defines an acyclic construction order: immutable
   decision intent, then issuer envelope binding its digest, then per-slot countersignature
   proof binding both earlier objects. Every security-relevant issuer/countersigner identity,
   time, nonce, policy/trust version, receipt ID, required set, issuer-envelope digest and
   role binding is in signed header/body bytes. It specifies domains, canonical bytes,
   offline reconstruction, revocation snapshot, replay rejection, and CAS/idempotent effect.
2. **Exact Gate 1 revision identity:** `pre_note_commit`, normalized substantive-byte hash,
   two-terminal-line exclusion, an exact permitted audit-descendant diff, sole-first-parent
   rule and both-commit offline checks prohibit substantive inheritance or identity drift.
3. **Non-selectable outcomes/leakage:** A frozen supported-decision universe and request-log
   predicate enroll every matching request before generation, with UTC/N bounded closure and
   an immutable denominator. The oracle defines estimand/null/pass inequality, family splits,
   adaptive budget, bootstrap/percentile confidence method, Holm adjustment, one sealed test,
   power/error thresholds, and fail-closed outcomes.

## Validation

- Fresh Critic commit is an ancestor through merge `68db0ac…`; its evidence file is unchanged.
- Only the permitted Brief and this Scout evidence differ after that evidence-preserving merge.
- `git diff --check` passes; a scoped review confirms required pre-effect state and the new
  issuer/countersignature, audit identity, enrollment and oracle clauses are present.
- Gate terminal lines remain nonblank `PENDING`; no human receipt or ruling is claimed.

## Remaining human decisions

Humans still must ratify concrete authority/trust anchors and revocation policy, Gate 1
approver/role and audit-note evidence, supported universe and parameters `N`, delta/epsilon,
attack versions and power inputs. The next safe action is fresh independent review of the exact
correction hash, followed only if it passes by a separate authenticated Product Lead Gate 1
process under the specified pre-note/audit-descendant protocol.
