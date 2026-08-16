# STR-027 final Gate 1 fresh Critic challenge

**Disposition:** `BLOCK`
**Review role:** STEER Critic Agent
**Exact target:** Scout correction commit `bfc5ba5302b0ad74b86f40a118d11aa959a4995b`
**Review boundary:** Fresh final Gate 1 challenge. This evidence reviews the corrected Brief independently, adds no Test result, and does not alter or approve the Brief, Exam, prior evidence, code, application, gate state, PR, merge, deployment, or release.

## Result

The correction closes the prior exact-revision/audit-descendant blocker and fixes the high-level acyclic construction order. Gate 1 readiness still **BLOCKS** because the claimed byte-constructible proof leaves nested bytes and revocation state unbound/ambiguous, while two contradictory cohort contracts remain in the same Brief and the leakage hypothesis is reversed.

## BLOCKER 1 — nested object bytes and revocation state are not fully constructible or bound

**Attack.** The corrected order is acyclic: intent, then issuer envelope, then countersignatures (Brief lines 131–161). Security metadata named in each header/body is now signed, and the detached signature is excluded without self-reference. However:

1. Every object is declared RFC 8785 JSON, but the issuer JSON body “contains the exact intent bytes” and the countersignature JSON body “contains the exact issuer envelope bytes.” JSON has no byte-string primitive. The field names, media type, and byte encoding (for example, unpadded base64url versus an embedded JSON object/string) are not defined. The top-level envelope/proof shape and detached-signature encoding are also absent. Multiple non-byte-equivalent objects satisfy the prose, so independent producers cannot construct one frozen byte stream.
2. Issuer/countersigner signed fields bind only `trust_profile_id`/version. They do not bind a revocation-snapshot digest, authority, sequence, issued/next-update time, or verification/effect epoch. “Signed revocation snapshot and sequence” is only a verifier input (lines 158–161), and the CAS uses “their signed revocation snapshot” plus an undefined “current no-weaker policy” (lines 162–170). A signer can therefore present an authentic older pre-revocation snapshot; two offline verifiers can select different snapshots and reach different effect decisions over identical proofs. No maximum staleness or monotonic snapshot rule is frozen.

The nonce/replay tuple is signed and slot uniqueness is CAS-enforced, but that does not cure snapshot rollback or ambiguous nested-byte encoding.

**Smallest safe correction.** Define exact JSON field names/types and unpadded base64url encoding for embedded canonical bytes and detached signatures (or sign digests and bundle separately), plus duplicate/unknown-field and padding rules. Bind the exact revocation snapshot digest, authority, monotonic sequence, issuance/next-update times and policy freshness bound in issuer and counter-proof signed bytes; require the atomic transition to compare them with the authoritative latest acceptable sequence and fail on rollback/staleness. Freeze golden and negative construction vectors for Gate 2.

## PASS — exact pre-note to audit-descendant identity is closed at Brief level

The corrected contract (lines 172–184) identifies `pre_note_commit`, defines the substantive byte range/LF normalization, signs its hash, permits only replacement of the two terminal Gate lines, requires a direct sole-parent audit descendant, forbids every other tree/parent change, and makes an offline verifier check both commits, the exact diff, body equality, signed pre-note identity and audit identity. This prevents a changed substantive Brief from inheriting the ruling. The exact target remains correctly `PENDING`; no receipt or descendant is fabricated here.

The wording “excluding” terminal Gate lines is redundant because they are after `---`, but it does not create a second substantive byte range: the positively defined range ends before the separator.

## BLOCKER 2 — the outcome contract contradicts itself, and the leakage test's null is reversed

**Enrollment/denominator attack.** The unchanged measurement section still closes at the first 10 units or day 30, then **extends until 10** when fewer exist, and permits the cohort rule/supported decision types to freeze only before Gate 2 (lines 38–56). The new section 13 instead requires a pre-start finite `N` and UTC end, closes at `min(end,Nth request)`, and **never extends** (lines 272–280). Both are normative “done and correct” text in the exact Brief. An operator can choose the favorable contract, extend a weak cohort, or define the universe after Gate 1. This leaves the denominator selectable despite the new authoritative-log reconciliation rule.

**Leakage attack.** The oracle defines the null as advantage `<= delta`, but calls a result a pass when an upper confidence bound is `<= delta` and powers the test to **reject that null** at `delta+epsilon` (lines 282–295). Rejecting `H0: leakage <= delta` is evidence of excessive leakage, not evidence of safety. To establish bounded leakage, the non-inferiority/equivalence direction must default to `H0: advantage >= delta` (or a conservatively specified boundary) and pass only when that unsafe null is rejected / a simultaneous upper bound is below delta. The current prose mixes a safe null, a high-leakage power point, percentile bounds, “simultaneous” coverage and Holm adjustment without defining adjusted confidence levels. It can generate inconsistent PASS/INCONCLUSIVE outcomes.

The family-disjoint split, single sealed test, frozen features/code/seeds/search budget, all-candidate correction, adaptive candidate allowance, minimum samples and explicit fail-closed conditions are otherwise material improvements.

**Smallest safe correction.** Remove the old extend-until-10 contract and make section 13's pre-start universe, request predicate, `N`, UTC end and no-extension rule the sole denominator authority. Reverse and fully specify the leakage hypothesis, define per-family experimental units and adjusted one-sided confidence levels (choose either a valid simultaneous construction or a precisely integrated Holm procedure), and state deterministic PASS/FAIL/INCONCLUSIVE precedence. Human-ratify the universe, `N`, delta/epsilon, attack versions/budget and power inputs before cohort/test sealing.

## Other challenged surfaces

- **Pre-effect authority and atomicity:** `PASS` in design intent; every required slot remains ineffective until one CAS verifies all proofs, and retry/crash/mirror behavior is default closed. It remains blocked in executable specification by Blocker 1.
- **Human separation/role stacking:** `PASS`; submitter/countersigner separation, one human per slot, minimum distinct humans and forbidden combinations remain explicit.
- **Privacy, security, accessibility and operations:** `PASS` for Gate 1 framing; least privilege, no public disclosure while unresolved, key isolation, accessible state/recovery behavior, scoped stops and event replay are explicit. Concrete qualified owners, trust roots, retention, support matrix, RPO/RTO and rehearsals remain correctly default-closed before production.
- **Payload boundaries:** `PASS`; practical production maxima and rejection-only near-U64 parser inputs remain separate, although concrete maxima still require human capacity/accessibility ratification.
- **Claims:** time savings and universal security/compliance/accessibility remain expressly unproven. Outcome/leakage reporting remains blocked by Blocker 2.

## Disposition and next human action

**`BLOCK` Gate 1 readiness for exact Scout correction `bfc5ba5302b0ad74b86f40a118d11aa959a4995b`.** This is advisory Critic evidence, not a human Gate 1 ruling.

Smallest safe human action: authorize one final narrow Scout correction limited to the two blockers above, then commission a fresh exact-revision Critic check. If that passes, the authenticated Product Lead may separately review and record Gate 1 using the now-adequate pre-note/audit-descendant protocol.
