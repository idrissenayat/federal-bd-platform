# Scout exact final correction evidence — STR-027

**Disposition:** `CORRECTION PREPARED — Gate 1 remains PENDING`

**Scope/ancestry:** Authorized correction of `8ffce58ed2c7176041b97a710d19220e7ff1a601`
responding to Critic `4f21bfdf18debafa35965b07ab3a23ca96c0a1ae`. Merge `1b01323…`
preserves that Critic commit and evidence byte-identically as true ancestry. Only the Brief
and this Scout evidence change after that merge; no Exam/app/code, prior evidence, Gate
receipt/ruling, PR, main merge, deployment, or release is changed.

## Exact closure

1. **Schemas:** Item 3 now enumerates literal member names/types/ranges, byte and timestamp
   encodings, required cardinality/order, duplicate and unknown-member rejection for intent,
   issuer/counter header/body/envelopes, snapshot and entry. It specifies entry ordering,
   duplicates, empty-list acceptance, invalid-entry rejection, and verification bytes.
   `revocation_entries_preimage/v1` contains entries only, has a domain-separated preimage,
   no digest field, and yields the separately bound `entries_digest`; the snapshot signature
   cannot self-reference.
2. **Multiplicity:** Item 13 removes rank-dependent Holm allocation entirely. Immutable m and
   comparison order use uniform Bonferroni alpha `.05/m`, fixed 10,000 seeded resamples and
   an explicit ceiling quantile. Missing/tie/duplicate/error/quality results have stated
   fail-closed precedence; PASS requires every bound and power condition.

## Validation

- `git diff --check` passes.
- Negative searches confirm no surviving Holm/rank-dependent/`alpha_i` language; no self-
  digest construction; and no legacy cohort extension or reversed unsafe null.
- Scoped contract checks confirm literal schema/unknown-field rules, b64 encoding, entry
  ordering/empty behavior, separate preimage, Bonferroni/m/order/seed, and retained
  pre-effect state plus audit-descendant protocol.
- Gate terminal lines remain nonblank `PENDING`; no receipt or ruling is fabricated.

## Remaining human ratifications

Humans must ratify concrete trust/revocation authority/key/freshness, scope/UTC/N, actual
m/comparison IDs, delta/epsilon, attack code/budget/seed, and power sample inputs. Next safe
action is fresh independent review of the exact correction hash; only thereafter can the
separate authenticated human Gate 1 process occur.
