# Scout surgical correction evidence — STR-027 cross-field closure

**Disposition:** `CORRECTION PREPARED — Gate 1 remains PENDING`

**Scope/ancestry:** This authorized surgical correction responds to fresh Critic
`809567e87af10fbab65a2dd3629d49182158ebdc` against `d886902236c1da88ceeb49d9bd78d1449a884b4e`.
Merge `65d65a5…` preserves the Critic commit and evidence byte-identically as true ancestry.
After that merge only the Brief and this Scout evidence change. No Exam/app/code, earlier
evidence, Gate action, PR, main merge, deployment, or release is changed.

## Cross-field closures

1. `required_signer_set/v2` is now a complete signed literal object: eligible universe,
   deterministic slot assignments, required count, minimum-distinct-human count, and ordered
   forbidden role coassignments each have exact member schemas, cardinalities, ordering,
   uniqueness and internal consistency. Verification requires no unsigned policy input.
2. Every snapshot member has an explicit type. The complete signed issuer/counter snapshot now
   includes both `entries_digest` and the authority signature. Defined snapshot identity includes
   authority key, sequence, entry digest, every time and policy version, with exact equality
   required across proofs/cache/EFFECTIVE transition.
3. Power is required independently for every fixed comparison at actual Bonferroni `.05/m`,
   fixed alternative `delta+epsilon`, and >=80%; no `.05` power authority remains.

## Validation

- `git diff --check` passes.
- Negative checks find no omitted signer-set schema members, unsigned policy dependency,
  omitted/mismatched `entries_digest`, untyped snapshot member list, or surviving power-at-.05
  wording. Scope checks confirm retained pre-effect state, audit-descendant protocol, bounded
  enrollment and uniform Bonferroni decision.
- Gate terminal lines remain nonblank `PENDING`; no receipt/ruling is fabricated.

## Residual human ratifications

Humans must still ratify trust/revocation authority/key/freshness, scope/UTC/N, exact signer
universe/role constraints, m/comparison IDs, delta/epsilon, attack implementation/budget/seed,
and per-comparison power inputs. The next safe action is fresh independent review of the exact
hash, then only a separate authenticated human Gate 1 process if it passes.
