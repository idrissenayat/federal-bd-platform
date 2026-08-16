# Scout byte-binding correction evidence — STR-027

**Disposition:** `CORRECTION PREPARED — Gate 1 remains PENDING`

## Authorized scope and preserved Critic ancestry

This correction addresses only fresh Critic review
`acd857c8501d394e895f866add4efbe46f64de68` against exact Scout target
`94ac4d31a1442bde8868a15bf2cee606d1f9814b`. Merge
`1127a54…` preserves the Critic commit and its evidence as true byte-identical
ancestry. After that merge this work changes only the STR-027 Brief and this new
Scout evidence file—no Exam/application/code or previous evidence, Gate action,
PR, main merge, deployment, or release.

## Byte-binding closures

1. Outer envelope `schema` is a closed discriminator: only `issuer/v2` or
   `countersignature/v3` is accepted. The value is length framed as exact UTF-8
   `S` in each issuer/countersignature domain-separated signature preimage. Before
   crypto or state handling, the outer value must equal both decoded protected
   header/body internal schema values. Unknown, substituted, or mismatched values
   reject, explicitly including the zero-countersigner route.
2. `intent_canonical_bytes` are exact RFC 8785 canonical UTF-8 bytes after
   unpadded-base64url `intent_b64` decoding and literal `intent/v4` validation.
   `intent_digest` is lowercase SHA-256 hex of exactly those bytes. The verifier
   recomputes and constant-time compares this value with every signed issuer and
   countersignature header/body digest before signature acceptance, proof counting,
   or state change; raw bytes, alternate canonicalization, decode/schema failure,
   and digest mismatch reject.

## Validation record

Final validation covers `git diff --check`; negative searches for unconstrained,
substitutable, unknown or mismatched envelope discriminators, including a
zero-countersigner exception; raw-bytes-equals-digest language, alternate
canonicalization, and digest-mismatch acceptance; post-merge two-file scope; true
Critic ancestry and byte-identical Critic-evidence blob; clean worktree; and
`git fsck --full --no-dangling`. Remote branch SHA is compared to local after
push. The pre-effect `PENDING_COUNTERSIGNATURE` contract remains unchanged:
pending is ineffective until all required valid independently authenticated human
signatures, and only the atomic transition produces `EFFECTIVE`.

## Residual human ratifications and safe next action

Humans still must ratify revocation authority/key/freshness; scope/UTC/N; signer
universe and roles; fixed `m`/comparison IDs; delta/epsilon; attack
implementation/budget/seed; and per-comparison power inputs. The only safe next
step is a fresh independent Critic review of the exact resulting commit before any
separate authenticated human Gate 1 process.
