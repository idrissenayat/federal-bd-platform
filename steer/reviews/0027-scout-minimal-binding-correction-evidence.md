# Scout minimal binding correction evidence — STR-027

**Disposition:** `CORRECTION PREPARED — Gate 1 remains PENDING`

## Authorized boundary and preserved ancestry

This minimal correction responds only to fresh Critic recheck
`1c3abdedcd4f494c9c3cd51bdf4b814e7b1e8597` against Scout target
`2ee7064c52875ec2f43b9a48b3b7c9ce2762c930`. Merge
`8eb0816196365a3d5339451da2b00c1c18d12423` makes that Critic commit a true
parent ancestry path; its Critic evidence is retained byte-identically. After the
merge, this correction changes only the STR-027 Brief and this new Scout evidence
file. It changes no Exam/application/code or prior evidence and makes no Gate
ruling, PR, main merge, deployment, or release.

## Minimal binding closures

1. Every stale signer-set v1 label/content is removed. The Brief names only the literal
   signed `required_signer_set/v2` object already defined inside `intent/v4`; it rejects
   legacy signer-set schemas.
2. `required_set_preimage/v2` is exactly
   `"STEER_REQUIRED_SET_V2\\0" || u64be(len(R)) || R`, where `R` is the RFC 8785
   canonical UTF-8 bytes of the `required_signer_set/v2` object decoded from the
   issuer-embedded signed intent. `required_set_digest` is lowercase SHA-256 hex of
   those exact bytes. Both signed countersignature header and body bind it; a
   verifier recomputes it from the decoded issuer intent and rejects a mismatch
   before counting a proof or changing state.
3. Snapshot identity is now the complete stated tuple beginning with `authority_id`.
   Exact full identity equality is required across issuer, countersignatures,
   cache, rollback/equivocation checks, and atomic `EFFECTIVE` input. Authority-ID
   substitution or a cache-namespace mismatch rejects.

## Validation record

The final commit was checked with `git diff --check`; negative searches for v1
signer-set labels, absent/ambiguous v2 preimage, mismatch acceptance, and authority
identity omission/substitution; a post-merge permitted-path scope check; true-ancestor
and byte-identical Critic-evidence blob checks; a clean-worktree check; and
`git fsck --full --no-dangling`. Remote branch SHA was compared to local after push.
The retained pre-effect `PENDING_COUNTERSIGNATURE` policy remains unchanged: it is
ineffective until every required valid independently authenticated human signature,
and only the atomic transition can make it `EFFECTIVE`.

## Residual human ratifications and safe next action

Humans must still ratify revocation authority/key/freshness; scope/UTC/N; the signer
universe and role constraints; fixed comparison IDs and `m`; delta/epsilon; attack
implementation/budget/seed; and per-comparison power inputs. The safe next action is
a fresh independent Critic review of the exact correction commit, followed only if
appropriate by a separate authenticated human Gate 1 process.
