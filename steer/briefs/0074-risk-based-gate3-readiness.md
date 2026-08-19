# Intent Brief — Issue 74 Risk-based Gate 3 release readiness

**Status:** draft — Gate 1 pending

**Delivery candidate:** GitHub issue #74

**Workflow assignment:** STEER

**Initial size / risk:** S / default-closed

**Tags:** #security #privacy #a11y #legal #reliability #design-system #money

**Date opened:** 2026-08-19

## Expected outcome and measurement

- Primary outcome: a human release authority can see and act on one server-authoritative Gate 3 readiness decision that applies separation proportionate to the frozen candidate's risk instead of applying the same solo 24-hour wait to every candidate.
- Baseline: the current active solo-calibration policy always records `cooling_hours = 24`; the client recognizes only that exact policy and every default-closed intent must wait 24 hours from submission, even when the exact candidate was frozen and verified earlier.
- Denominator: the frozen verification matrix covering every risk tier, both operating modes, each allowed time/countersignature path, early and boundary-time finalization, missing or under-declared risk, and every named candidate-drift input.
- Minimum meaningful signal: 100% of matrix cases produce the exact expected `NOT_READY`, `READY`, or `INVALIDATED` decision; no premature or incomplete ruling becomes effective; and the UI agrees with the authoritative response in every tested state.
- Flow measure: for default-open solo candidates, fixed waiting time falls from 24 hours to zero; for elevated solo candidates, fixed waiting time is four hours unless the frozen policy permits and receives a qualified independent countersignature; current default-closed protection remains 24 hours in solo mode unless the complete qualified team path is satisfied.
- Guardrail measure: zero automatic Gate approvals, merges, deployments, releases, role grants, risk downgrades, or retroactive changes to an existing receipt.

## Who this is for

Product Leads and Technology/Domain authorities who have an exact verified candidate ready for a release decision. The immediate user is often a solo operator wearing multiple roles, but the same record must remain trustworthy when a real team supplies independent countersignatures.

## Problem and why now

Issue #70 reached a green exact build, staging verification, and independent Critic PASS on PR #71, but the platform and written operating rules still apply one blanket solo cooling rule. That delay has a legitimate purpose: time separation reduces same-session correlated judgment when one person owns Product, Technology, and domain decisions. The implementation is nevertheless too coarse and starts its clock too late. It does not distinguish ordinary UI or bounded reliability changes from authentication, money, personal-data, destructive-data, mass-communication, governance-control, or Critic-override changes. It also does not present one immutable explanation of why a candidate is or is not ready.

The result is avoidable idle time for low-risk changes, conversational handling of premature approvals, and ambiguity about whether the clock began at build completion, staging verification, Critic completion, or intent submission. Time alone is not evidence. The platform needs a deterministic policy that uses time only where human separation is absent and risk warrants it.

## Risk and separation policy

The first version contains exactly three risk tiers. The active policy version fixes the mapping, required roles, delays, and allowed alternative; clients cannot change them.

| Tier | Required classification | Solo-calibration separation | Qualified-team separation |
|---|---|---|---|
| `DEFAULT_OPEN` | No elevated/default-closed domain is declared or derived, and the classification evidence is complete | No fixed wait; a fresh human decision session after the frozen-candidate receipt is required | Existing authenticated Gate authority requirements; no fixed cooling interval |
| `ELEVATED` | Non-destructive persistence, external-provider, availability, or other policy-listed operational risk without a default-closed domain | Four hours from authoritative verification, or one policy-authorized independent qualified human countersignature distinct from the submitter and Builder | The required qualified independent human countersignature; no fixed cooling interval after it is accepted |
| `DEFAULT_CLOSED` | Authentication/authorization/session handling, money movement, new personal-data use, destructive data operations, mass communications, governance-control changes, Critic-block override, unknown classification, under-tagging, or inconsistent evidence | Twenty-four hours from authoritative verification; no agent or same-human role stacking may shorten it | Every policy-required named domain authority plus the Product/Technology quorum, with at least two distinct authenticated humans and all submitter/Builder exclusions; no fixed cooling interval after the final required signature |

Issue #74 itself is a governance-control change and therefore remains `DEFAULT_CLOSED` under the existing rules for its own release.

## Frozen candidate and clock authority

Readiness is bound to one immutable candidate snapshot containing at least:

- work-item identity and POD;
- Brief and frozen Exam revisions/digests;
- implementation commit;
- build and migration-set digests;
- runtime-policy digest;
- exact staging verification receipt and authoritative `verification_completed_at`;
- declared tags and independently derived final-diff domains;
- Critic target/recommendation revision and evidence-set digest;
- active risk/separation-policy version and required human roles.

`verification_completed_at` comes from the authoritative staging verification receipt, never a client clock, Git author date, UI observation, or free-form comment. The tier's `effective_not_before` is calculated from that timestamp, so Critic and human review can use elapsed time without moving the clock when they review the unchanged candidate.

A changed implementation commit, build, migration set, runtime policy, Brief/Exam target, verification receipt, derived domain set, Critic target, or evidence-set digest creates a new snapshot and invalidates every not-yet-effective intent bound to the earlier snapshot. An unchanged documentation-only report that merely references the same already-bound evidence does not reset the clock. The server records the exact reset field and old/new digests.

## What "done and correct" means

1. One versioned server policy deterministically maps the union of declared tags and independently derived final-diff domains to `DEFAULT_OPEN`, `ELEVATED`, or `DEFAULT_CLOSED`; missing, unknown, under-declared, conflicting, or unverifiable classification fails to `DEFAULT_CLOSED`.
2. One immutable readiness snapshot binds every field named above and exposes its canonical SHA-256 digest.
3. The server returns `NOT_READY`, `READY`, or `INVALIDATED`, with tier, policy version, allowed satisfaction path, authoritative verification time, earliest valid time, missing authorities, reset reason, and candidate digest.
4. Decision intent, issuer envelope, proof events, finalization, durable decision row, export, and replay all bind the same readiness snapshot and policy version; duplicated mutable columns cannot grant authority.
5. An approval or finalization attempt before readiness fails closed and remains ineffective. It never waits in a state that later becomes effective without a new authenticated human finalization action after readiness.
6. `DEFAULT_OPEN` solo candidates require an authenticated fresh decision session after the candidate snapshot but have no fixed wait.
7. `ELEVATED` candidates enforce the frozen four-hour or qualified-countersignature path exactly. Only the active policy may permit the alternative, and a signer must be enrolled, current, qualified for the required domain, distinct from the submitter and Builder, and bound to the same snapshot.
8. `DEFAULT_CLOSED` solo candidates retain 24 hours. The qualified-team alternative requires every frozen named domain authority, the Product/Technology quorum, at least two distinct humans, no forbidden role stacking, and exact-snapshot signatures.
9. Candidate or authority drift invalidates pending readiness and produces a content-safe audit event. An effective historical ruling remains immutable and is never retroactively reinterpreted under a newer policy.
10. The decision UI displays the authoritative tier, satisfied/available path, candidate revision, verification time, earliest valid time/countdown, missing authorities, and reset reason. Client clocks are display-only and cannot enable controls.
11. Early, stale, replayed, cross-POD, revoked-signer, role-drift, under-tagged, unknown-domain, boundary-time, concurrent-finalization, and database-tampering cases all fail closed or reconcile idempotently to the one authoritative outcome.
12. Existing Gate 1/Gate 2 separation, fresh Critic, exact-evidence binding, human-only ruling authority, review lifecycle, signed receipt chain, production release controls, and non-decision work-item behavior remain unchanged.
13. `steer/operating-system/GATES.md`, `steer/SOLO-MODE.md`, and the guardrail library describe the exact shipped policy without claiming that delay itself proves quality.
14. Issue #70 and all earlier receipts remain governed by their original policy version; no migration recalculates, upgrades, or accelerates them.

## Design intent

Keep the existing governed-decision dialog and design system. Replace generic “24-hour cooling” copy with one answer-first “Release readiness” card:

- a plain-language status heading such as “Ready for your decision,” “Ready after 3h 12m,” or “Independent Security approval required”;
- tier and reason stated in text, not color alone;
- exact candidate revision and verification time;
- one server-authoritative list of completed and missing controls;
- a countdown that is visibly advisory and refreshes from the server at and after the boundary;
- explicit reset messaging naming what changed and requiring a fresh package/session;
- no disabled control without an adjacent explanation and next action.

Status changes are announced once, focus remains predictable, keyboard operation remains complete, timestamps include timezone context, and the card remains understandable at 320 px and 200% zoom.

## Out of scope

- Applying the new policy retroactively to issue #70 or any existing intent/receipt.
- Automatically approving a Gate, merging a pull request, deploying, releasing, closing work, or granting a role.
- Replacing Gate 1, Gate 2, exact-target Critic review, CI, staging verification, rollback evidence, or domain-owner requirements.
- A general rules engine, arbitrary administrator-authored expressions, or user-configurable risk weights.
- Redesigning the complete work-item taxonomy, review lifecycle, or emergency/hotfix lane.
- Treating agents, model diversity, or elapsed time as qualified independent human assurance.

## Risks and default-closed touchpoints

This item changes the enforcement that decides when human Gate 3 intent may become effective. A defect could prematurely authorize production, accept an unqualified signer, downgrade an under-tagged change, reuse stale verification, or make the UI contradict the server. It also changes the governing Gate and solo-mode documents. The work is therefore default-closed and carries every release-domain tag.

Controls are a small closed policy vocabulary, immutable canonical snapshots, exact digest/signature binding, server-only time/classification authority, append-only events, current enrollment/role checks at finalization, explicit invalidation rather than mutation, database immutability guards, deterministic boundary/concurrency tests, and a fresh Critic over Brief + Exam + implementation. No builder-authored fixture, client countdown, Git timestamp, or free-form label can make a ruling ready.

## Privacy and retention boundary

The readiness record stores identifiers, roles, domains/tags, revisions, digests, timestamps, and status—not user-entered work content, credentials, or provider payloads. It reuses the existing decision-record retention and deletion/hold policy. Signer identity is used only for authority, separation, and audit; no productivity or ranking inference is permitted.

## Chosen approach

Extend the existing STR-027 decision-package lifecycle rather than create a parallel release path. Add one immutable readiness snapshot and versioned risk policy, bind their digests into decision intents and issuer envelopes, derive finalization from those immutable inputs plus append-only signer events, and surface the authoritative result in the current decision dialog.

Rejected alternatives: deleting cooling entirely would remove the solo separation control; allowing an early approval to ripen automatically would eliminate the required later human judgment; using only declared tags would reward under-tagging; restarting the clock when a report is committed would preserve avoidable idle time; and making policy client-configurable would turn a release control into advisory UI state.

---

GATE 1: PENDING — authenticated Product Lead approval required against the exact Brief revision and SHA-256.
