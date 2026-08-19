# Scout final narrow correction evidence — STR-027

**Disposition:** `CORRECTION PREPARED — Gate 1 remains PENDING`

**Scope and ancestry:** This is the authorized final narrow correction to exact Scout commit
`bfc5ba5302b0ad74b86f40a118d11aa959a4995b`, responding to fresh final Critic commit
`b557858fc788a64f20c3f6c1013bd52df5ea33b8`. Merge `b9cf3c3…` preserves the Critic commit
and its evidence byte-identically as true ancestry. After that merge, only the Brief and this
Scout evidence are changed. No Exam, application/code, prior evidence, Gate receipt/ruling,
PR, main merge, deployment, or release is changed or claimed.

## Narrow corrections

1. **Nested bytes/revocation:** JSON binary representation is fixed to unpadded RFC 4648 §5
   base64url with canonical envelope field layout and exact Ed25519 verification inputs.
   Intent → issuer envelope → countersignature stays acyclic. Every signed proof carries the
   fresh monotonic signed `revocation_snapshot/v1`; authority/key, sequence, timing,
   digest/policy, signature input, offline cache ordering, rollback/equivocation and atomic
   effect behavior are specified and default closed.
2. **Cohort:** the old first-10/day-30/extension wording is explicitly superseded. One UTC/N,
   source-sequenced, before-generation enrollment contract sets the finite denominator and
   deterministic close/ambiguous-order outcomes.
3. **Leakage:** v3 states unsafe null `H0: A > delta`, safe alternative, all-attack estimand,
   decision inequality, deterministic adaptive candidate set, 10,000 seeded stratified
   resamples, exact Holm alpha allocation/bound procedure, one sealed test, and power/error
   failure conditions.

## Validation

- `git diff --check` passes.
- Negative searches find no legacy first-10/day-30/extension contract, reversed `H0:
  advantage <= delta` null, or raw-byte field acceptance. The only phrase `raw bytes` is the
  explicit rejection of raw binary JSON fields.
- Scoped checks confirm base64url envelope/signature inputs, signed revocation details,
  pre-effect `PENDING_COUNTERSIGNATURE`, retained pre-note/audit identity protocol, UTC/N
  contract, unsafe null, Holm adjustment and deterministic resampling seed.
- Gate terminal lines remain nonblank `PENDING`; no receipt/ruling has been fabricated.

## Remaining human parameters

Humans must ratify actual trust/revocation authority/key/freshness duration, concrete scope
universe/UTC/N, delta/epsilon, attack implementations/budget/seed, and power sample inputs;
then request fresh independent review of the exact final hash. A separate authenticated human
Gate 1 process remains required even after review.
