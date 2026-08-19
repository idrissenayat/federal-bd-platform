# Exam — Issue 74 Risk-based Gate 3 release readiness

**Brief:** `steer/briefs/0074-risk-based-gate3-readiness.md`

**Gate 1 authority:** authenticated Product Lead approval against Brief revision `e1644ff3421800423e90980929fa4eac3c64f1e1`, SHA-256 `fbd22ba38942a4098b727d3c88ebde92b336f1879a5b73ef4cb9c9bc6d0ac6e5`

**Guardrails in force:** CORE-01..11, SEC-01..05, PRIV-01..03, A11Y-01..03, REL-01..04, LEGAL-01..02, DES-01..02, HUM-01..02, DATA-01..02, EXT-01

**Gate boundary:** this Exam freezes expected behavior only. No implementation, policy activation, migration, merge, deployment, release, closure, or Gate 3 action is authorized before an authenticated Gate 2 approval against the exact Exam revision and SHA-256.

## Frozen policy contract

The implementation uses one closed vocabulary and no model-generated runtime classification.

### Risk tiers

- `DEFAULT_OPEN`: fixed solo delay `0` hours.
- `ELEVATED`: fixed solo delay `4` hours, or the policy-authorized qualified independent-human path.
- `DEFAULT_CLOSED`: fixed solo delay `24` hours, or the complete qualified-team path. Issue #74 itself remains governed by the pre-existing 24-hour rule.

### Derived risk codes

The version-1 allowlist is:

- default-closed: `AUTHN_AUTHZ_SESSION`, `MONEY_MOVEMENT`, `PERSONAL_DATA_NEW_USE`, `DESTRUCTIVE_DATA`, `MASS_COMMUNICATION`, `GOVERNANCE_CONTROL`, `CRITIC_BLOCK_OVERRIDE`;
- elevated: `NONDESTRUCTIVE_PERSISTENCE`, `EXTERNAL_PROVIDER`, `AVAILABILITY_INFRA`, `SECURITY_NON_AUTH`, `PRIVACY_NO_NEW_DATA`, `LEGAL_CLAIM`, `ACCESSIBILITY_UI`, `COST_NON_CHARGE`;
- no elevated/default-closed code: `NONE`.

The server derives the tier as the maximum severity in the union of declared risk inputs and the latest exact-target signed Critic review's derived domains. An empty union, unknown code, malformed list, missing exact-target Critic result, declared/derived mismatch, or Critic-reported under-tagging resolves to `DEFAULT_CLOSED` with a named classification error; it never resolves to `DEFAULT_OPEN`.

### Candidate snapshot

The canonical schema is `steer.gate-readiness-snapshot/v1`. It contains:

- `snapshot_id`, `work_item_id`, `work_item_key`, `pod_id`;
- Brief and Exam commit/body digests;
- implementation commit, build digest, migration-set digest, and runtime-policy digest;
- staging verification receipt ID/digest and authoritative `verification_completed_at`;
- Critic assignment/result IDs, target revision, recommendation, derived risk codes, and evidence-set digest;
- declared codes/tags, resolved tier, classification reasons, risk-policy version;
- operating mode, required role slots, selected satisfaction path, delay hours, `effective_not_before`;
- creation time, canonical snapshot SHA-256, predecessor snapshot digest when superseding, and invalidation reason when invalidated.

All dates are UTC RFC 3339 instants. Digests are lowercase SHA-256. Revisions are exact lowercase 40-character Git object IDs. The snapshot is append-only and immutable.

### Clock and alternative authority

- `effective_not_before = verification_completed_at + tier delay` for the time path.
- `verification_completed_at` is accepted only from the signed staging verification receipt bound to the same implementation/build/migration/runtime digests.
- Critic and human review time does not move the clock when every snapshot-bound input remains unchanged.
- The `ELEVATED` independent-human path requires one distinct authenticated enrolled human qualified for every elevated domain, not the intent submitter or implementation Builder, with a current role at signature and finalization.
- The `DEFAULT_CLOSED` team path requires the frozen Product Lead and Tech Lead slots, every frozen named domain-owner slot, at least two distinct authenticated humans, no submitter signing an independent slot, no Builder signing an independent review/domain slot, and current enrollment/role at signature and finalization.
- Agents, service principals, unsigned comments, client state, model diversity, and same-human role stacking never satisfy an independent-human slot.
- A path is selected and frozen in the snapshot. A pending intent cannot switch paths; a replacement snapshot/session/intent is required.

### Material drift

Any change to implementation, build, migration set, runtime policy, Brief/Exam target, verification receipt, declared or derived domain set, Critic target/recommendation/evidence set, risk policy, required roles, or operating mode invalidates the pending snapshot and its intents. A documentation-only report may preserve the snapshot only when its canonical manifest proves it adds no candidate input and references the exact existing digests. Effective historical rulings remain immutable and are not reclassified.

## Acceptance tests

1. **RR-01 — Exact policy activation.** Given the approved version-1 ruling URL/body digest and an enrolled authorized human, policy activation creates one immutable active record containing the exact tier delays, code mapping, role rules, and policy digest. Replay is idempotent; altered bytes, an unapproved URL/digest, an agent caller, or a second conflicting active version fails closed.
2. **RR-02 — Maximum-severity classification.** Given every allowlisted code alone and in mixed order/duplicates, the server deterministically resolves the maximum tier and canonical deduplicated reasons. Input order cannot change the snapshot digest.
3. **RR-03 — Missing/unknown/under-tagged classification.** Given an empty, malformed, unknown, unverifiable, mismatched, or under-tagged input, readiness is `NOT_READY`, tier is `DEFAULT_CLOSED`, and a specific non-sensitive classification error is persisted. No client-supplied lower tier is accepted.
4. **RR-04 — Exact signed Critic binding.** Given a Critic result, only the latest completed signed assignment for the exact work-item revision and exact candidate manifest may supply derived domains/recommendation. A stale, unsigned, agent-ID-only, cross-POD, non-PASS, or mismatched target blocks snapshot creation.
5. **RR-05 — Authoritative verification clock.** Given an exact signed staging verification receipt, the snapshot uses its `verification_completed_at`. Git dates, HTTP dates, client clocks, issue comments, report commit dates, or later unchanged Critic completion cannot replace or move that instant.
6. **RR-06 — Snapshot canonicality and immutability.** Given semantically identical inputs, canonicalization produces one digest. Any update/delete of snapshot authority fields or append-only readiness events fails at the database layer; a superseding snapshot references the predecessor instead.
7. **RR-07 — Default-open solo boundary.** Given a complete `DEFAULT_OPEN` snapshot and a fresh human decision session started after that snapshot, readiness is `READY` with zero fixed delay. A pre-snapshot or expired session remains `NOT_READY`.
8. **RR-08 — Elevated solo time boundary.** Given an `ELEVATED` time-path snapshot, finalization at one millisecond before `verification_completed_at + 4h` fails 409 and has no Gate effect; finalization exactly at the boundary may proceed only after every other control is rechecked.
9. **RR-09 — Elevated independent-human path.** Given the countersignature path, one exact-snapshot signature from a currently enrolled human qualified for every elevated domain satisfies separation. Submitter, Builder, agent, wrong-domain, stale-role, revoked, cross-POD, duplicate-human, wrong-snapshot, or malformed proof does not.
10. **RR-10 — Default-closed solo boundary.** Given a `DEFAULT_CLOSED` solo time-path snapshot, the existing full 24-hour rule remains exact at the millisecond boundary and cannot be shortened by client input, role stacking, agent review, or policy-column mutation.
11. **RR-11 — Default-closed qualified-team path.** Given Product Lead, Tech Lead, and all frozen named domain slots, readiness remains `NOT_READY` until at least two distinct eligible humans fill every slot with exact-snapshot proofs. Missing, duplicated, forbidden-pair, stale, revoked, or wrong-domain proofs fail closed.
12. **RR-12 — No automatic ripening.** Given a human records intent before the time/authority path is satisfied, the record stays ineffective. Passing time or receiving the last countersignature never creates an effective ruling automatically; an authenticated human must explicitly finalize after a fresh authoritative readiness response.
13. **RR-13 — Intent/envelope/event binding.** Given a decision intent, its signed issuer envelope and every proof/finalization event bind the full snapshot digest, risk-policy version, resolved tier, path, delay, verification time, earliest time, and required role slots. Mutating or omitting any field breaks verification.
14. **RR-14 — Finalization derives authority.** Given duplicated columns or client payloads conflict with the immutable snapshot/policy/event chain, finalization trusts only the canonical signed snapshot plus append-only accepted proofs and fails closed. Direct database changes cannot lower delay/tier or remove roles.
15. **RR-15 — Material drift and reset.** For each frozen drift field, a changed value creates an `INVALIDATED` result naming the changed field and old/new digests, supersedes pending intent/session authority, and requires a new verification/snapshot/session/intent. Unchanged exact inputs do not reset the clock.
16. **RR-16 — Replay, concurrency, and crash safety.** At least 100 concurrent identical snapshot, intent, proof, and finalization requests produce one authoritative record/event per idempotency identity and one Gate effect. Conflicting replay returns 409. Faults before/after each write reconcile without duplicate effect or an unreviewable state.
17. **RR-17 — POD and human authority.** Every readiness, policy, snapshot, signature, and finalization endpoint requires enrolled current identity and POD equality. Agents may prepare advisory evidence but cannot activate policy, satisfy a human slot, record human intent, or finalize.
18. **RR-18 — UI authoritative states.** The existing decision dialog renders `NOT_READY`, `READY`, and `INVALIDATED` from the server with tier/reason, exact candidate revision, verification time/timezone, chosen path, earliest time/countdown, completed/missing controls, reset reason, and next action. The client never enables finalization from its own timer; it refreshes authority at the boundary.
19. **RR-19 — Accessibility.** Automated axe plus agent-operated keyboard, focus, screen-reader, contrast, 320 px, and 200% zoom checks pass for default-open ready, elevated countdown, elevated missing signer, default-closed countdown, team missing roles, invalidated/reset, server failure, and effective history. Each status change is announced once and no disabled action lacks an adjacent explanation.
20. **RR-20 — Content-safe telemetry.** Counters record classification tier/outcome, readiness outcome, invalidation reason code, time-path boundary rejection, countersignature acceptance/rejection class, finalization outcome, and latency using bounded labels. No reasoning, work content, email, raw signature, credential, or person-ranking measure enters telemetry/logs.
21. **RR-21 — Documentation convergence.** `GATES.md`, `SOLO-MODE.md`, and `GUARDRAIL-LIBRARY.md` state the exact version-1 policy, distinguish time separation from assurance, prohibit automatic ripening, and preserve the current default-closed categories. Repository checks fail if the executable policy digest and normative policy fixture diverge.
22. **RR-22 — Backward compatibility.** Every intent/receipt created under an earlier policy preserves its original 24-hour semantics and export verification. No migration recalculates its tier, clock, path, signers, or effect. Issue #70 cannot be accelerated by this implementation.
23. **RR-23 — Existing behavior regression.** The complete existing suite proves Gate 1/Gate 2 separation, signed review lifecycle, decision packages, issuer proof, sessions, human-only decisions, work-item transitions, dispatch, economics, history, and completed work remain unchanged outside the new Gate 3 readiness inputs.
24. **RR-24 — Migration and rollback.** Exact staging migration preserves before/during/after hashes and identity projections for every pre-existing table. Rollback to the previous version leaves new readiness records inert and preserves all legacy Gate decisions; restore replays without duplication. An in-flight pending intent fails closed across rollback.
25. **RR-25 — Hosted staging matrix.** The exact candidate runs at least 30 hosted cases covering all 24 tests above, every tier/path, all boundary instants with a controlled server clock, required UI states, drift fields, role failures, and rollback. The ledger binds request/response identities, D1 projections, activity/events, telemetry deltas, exact source/runtime revisions, and pass/fail oracles.
26. **RR-26 — Production boundary.** Before Gate 3, production source/version/environment/D1 hashes remain unchanged. Production policy activation and migration occur only after an exact approved Gate 3 release. Post-deploy smoke proves one legacy receipt, one default-open readiness result, one default-closed blocked result, and rollback readiness without creating an actual Gate effect.

## Non-functional checks

- Readiness calculation p95 is at most 500 ms for 100 hosted reads and p95 snapshot creation is at most 1,000 ms, excluding signed Critic/staging work completed before the request.
- Countdown/display refresh does not poll more often than once per minute before the final minute and once per second within the final minute; server authority is refreshed before controls enable.
- All new request bodies, lists, strings, timestamps, digests, policy versions, signatures, and label cardinalities have server-side bounds.
- Schema and query changes include necessary indexes derived from real access patterns; exact migrations and rollback artifacts are committed.
- Dependency/license/audit results remain within the approved repository policy; no new cryptographic primitive is introduced when the existing signed-envelope implementation suffices.

## Frozen staging ledger

The 30-case hosted denominator is fixed before the first run:

- 4 classification cases (`DEFAULT_OPEN`, `ELEVATED`, `DEFAULT_CLOSED`, unknown/under-tagged);
- 6 time boundaries (each tier before/at boundary, including zero-hour fresh-session enforcement);
- 6 signer cases (valid elevated, wrong domain, submitter, Builder, complete team, incomplete/duplicate team);
- 8 drift cases (implementation, migration, runtime, Exam, verification, derived domains, Critic target, risk policy);
- 3 replay/concurrency/fault cases;
- 3 legacy/rollback/restore cases.

Any rerun preserves the first complete ledger and appends a new run identity; it never overwrites failed evidence.

## Human judgment checklist

The Test and Critic agents perform interaction, accessibility, security, timing, and evidence checks. The Product Lead confirms their exact-target result rather than manually repeating tests.

- [ ] The readiness card answers “Can I decide now?”, “Why?”, and “What happens next?” without requiring policy knowledge.
- [ ] Low-risk speed does not come from a client timer, missing evidence, under-tagging, or automatic approval.
- [ ] High-risk team acceleration is understandable as qualified human separation, not a waiver.
- [ ] An invalidation clearly names what changed and does not imply that prior review still applies.
- [ ] The policy change does not claim that elapsed time or agent review alone provides independent assurance.

---

GATE 2: PENDING — authenticated Tech Lead approval required in a separate work session against the exact Exam revision and SHA-256.
