# STR-028 Gate 3 rework evidence — target `1730e9e`

## Status

Implementation rework is complete in owner-only staging. Production remains unchanged.
The independent Critic's two implementation blockers are closed by executed evidence.
Gate 3 is not requested yet because the frozen Exam still requires one named-human
keyboard/VoiceOver matrix covering eight states and the post-rollback drawer smoke.

## Exact target

- implementation commit: `1730e9e98f355ccea80183170b9a6a104f94e3fe`
- Git commit-object SHA-256 (including `commit <size>\0`):
  `e666576f5fe7b1075fc9d139f55695e9cd7b48c31033a81b5a085a4834da5182`
- canonical target manifest:
  `b8a8f2eaa4aa0981af5cdd6cab33c2718371a0ba536c74896faf11617f953a43`
- signed target packet: `0028-gate-3-review-target.json`, SHA-256
  `5e2b84e697b2b11abd34178de924fc86788cb1b1fe70cf74d8dbe02e5865e228`
- verifier: enrolled Test Agent, key `buzz-roster-v3:test` version 3; the packet's
  BIP-340 signature is verified in the repository suite against the enrolled public key.

## Blocker remediation

### Independently verified review authority

The target manifest now includes the commit-object SHA-256. A review request must carry
an independently signed `steer-target-verification/v1` receipt whose exact target equals
the requested target. Work Management checks the enrolled Verification Agent identity,
key ID/version, signature, timestamp, target equality, and canonical manifest before it
appends any review record. `REVIEW_TARGET_READY` binds the verifier receipt digest rather
than asserting a client-provided `clean_target_verified` boolean.

Staging submitted the known wrong digest that omits the Git object header. The request
was rejected with zero new assignments or events (2/6 before and 2/6 after). The exact
signed packet then created authoritative assignment
`f4deccd3d8e607e9320b76ce09f328548a31cdd32add51b97d76787fa10eeaa0`.
Both earlier staging requests remain immutable but received signed
`REVIEW_SUPERSEDED` events and terminal `SUPERSEDED` projections. Only the new exact
assignment remains `REQUESTED`.

### Executed 20-case ledger

`measure-str028-case-ledger.ts` no longer writes unconditional PASS values or times
server-side static markup. It executes the exact named D1-backed server oracle for every
frozen case, fails nonzero when an oracle fails or is absent, then passes the observed
result into a React client render in JSDOM, waits for the next animation-frame paint, and
captures the visible result hash, live-region role, announcement mode, focus result,
oracle output hash, and client-boundary latency.

The produced ledger `0028-case-ledger-1730e9e.json` has SHA-256
`521393a0a4d1eac29f03df8f2590303ca21c1617b18df624aff9a1e2bb3ded43`:

- 20/20 exact case IDs executed and passed;
- exactly one terminal UI observation per case;
- save feedback p95 23 ms (budget 250 ms);
- handoff feedback p95 18 ms (budget 250 ms);
- no missing IDs and every frozen FAIL-03, FAIL-04, and REC-04 substep preserved.

### Reproducibility and rollback

The mutable privacy-ruling fixture now loads immutable Git bytes from the approved
`d9dbe0b...` commit. The exact implementation target passes build, 29 JavaScript tests,
114 TypeScript tests, type checking, and lint.

Staging version 16 deployed the exact target (only `.openai/hosting.json` differs in the
packaging commit). Version 16 was rolled back to version 15 and restored to version 16.
Rollback RTO was 7,402 ms; restore RTO was 8,589 ms; RPO was zero. Before, during, and
after snapshots preserve the active privacy-policy receipt, dispatch intent/outbox event,
all three review assignments, their authoritative/superseded states, manifests, and
current event hashes. Raw deployment IDs, timestamps, package identity, negative-probe
counts, and snapshots are in `0028-staging-v16-raw-evidence.json`, SHA-256
`6aa7a515b73725d28a9c2ece99c52142323eb253330b882b82ef280b0826b56d`.

## Remaining named-human evidence

The following is deliberately not inferred from automation:

| Frozen state | Keyboard and VoiceOver observation |
|---|---|
| Success | Pending |
| Validation | Pending |
| Conflict | Pending |
| Transport | Pending |
| Blocked | Pending |
| Pending | Pending |
| Empty | Pending |
| Reload | Pending |

The same session must also confirm the post-rollback drawer's pending, success, and
failure surfaces. After that evidence is recorded, regenerate only the evidence packet,
run the clean evidence-commit suite, and request a fresh independent Critic review.

No merge, production deployment, release, closure, or Gate 3 authority is claimed.
