# Scout revision evidence — STR-027 pre-effect countersignature Brief

**Disposition:** `REVISION PREPARED — Gate 1 remains PENDING`

**Role and boundary:** STEER Scout Agent, authorized only to revise the Intent Brief and
add this evidence. No Exam, implementation, application, prior agent evidence, gate
receipt/ruling, PR, main-branch merge, deployment, or release was edited or created.

## Exact ancestry

- Fresh Critic review: `4cf5cd7a5ef37c421f4f232f3cc5c41fdc7f1296`.
- Independent Test review: `5769788c7b97a36a412492e9c6ee2b41dd554038`.
- Shared parent: `172aa08d29cc94b6407a3cc465f2583ecf262cbc`.
- This branch first creates an explicit merge of those sibling reviews, so both remain
  true ancestors, then adds this Brief/evidence revision.

## Revision audit

The revised Brief replaces the conflicting direct effect and post-effect countersignature
contract with one default-closed path: `PENDING_PROOF → PENDING_COUNTERSIGNATURE →
EFFECTIVE`; the latter transition occurs only after every frozen required independently
authenticated human proof verifies. It freezes a countersignature schema, domain-separated
canonical bytes, Ed25519/trust/revocation profile, required-set/policy binding, receipt
identity, duplicate/retry semantics, offline verification, and atomic compare-and-set
projection effect.

It also incorporates every fresh Critic finding without claiming those protocol choices
are approved: `eligible_unit/v1` enrollment/denominators; minimum distinct-human and
forbidden role stacking; a custodian-held leakage threat/feature/attack/split/calibration/
multiplicity/power oracle; and distinct practical payload maxima versus synthetic U64
parser-edge rejection vectors. The Brief revision note identifies the policy and the
Critic/Test commits. Earlier Brief bytes remain in Git history.

## Verification recorded for this revision

- `git diff --check` passes.
- Only `steer/briefs/0027-signed-gate-receipts-and-ratification-packages.md` and this
  Scout evidence file are changed after the review-preserving merge.
- A search of the revised Brief finds no direct `PENDING_PROOF → EFFECTIVE` transition or
  post-effect required countersignature path; the defined transition and UI flow place
  countersignature before effect.
- The exact revision's Gate 1 lines remain `PENDING`, with nonblank human-reviewable
  reasoning; no receipt or ruling is fabricated here.

## Residual human decisions / next action

A qualified human must review the exact revision and preserve an authenticated,
policy-compliant Gate 1 receipt and required in-file audit evidence against its final
hash. The named human owners must then ratify the concrete trust anchors, identity
authority, revocation freshness, signer policy, practical maxima, leakage bound/power
parameters, and applicable role/qualification matrix. Only then may the governed next
stage obtain fresh independent review; this evidence grants no Gate effect.
