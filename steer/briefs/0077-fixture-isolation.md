# Intent Brief — Issue 77 Verification fixture isolation

**Status:** draft — Gate 1 pending

**Delivery candidate:** GitHub issue #77

**Workflow assignment:** STEER

**Initial size / risk:** S / elevated

**Tags:** #reliability #a11y #design-system

**Date opened:** 2026-08-20

## Expected outcome and measurement

- Primary outcome: the Product Lead can trust the normal staging cockpit because governed verification fixtures remain auditable without appearing as operational work or human rulings.
- Frozen baseline: staging displays 106 pending rulings; an agent-operated inspection on 2026-08-20 found that all 106 are issue #74 real-lifecycle verification fixtures and zero are genuine pending rulings. The same fixture population also inflates WIP and open-backlog measures.
- Denominator: every work item returned by the authenticated staging bootstrap, partitioned by one server-authoritative fixture predicate.
- Minimum meaningful signal: the normal cockpit reports zero fixture-caused rulings and zero fixture-caused WIP while preserving every fixture, linked lifecycle record, and authoritative drawer in an explicitly labeled staging-only evidence view.
- False-positive guardrail: an ordinary work item is never hidden merely because its workflow is `Setup / excluded`; every required governed fixture identity field must match.
- Production guardrail: production records, counts, queries, schema, and deployed version remain unchanged during implementation and staging verification.

## Who this is for

Product Leads who rely on WIP, backlog, forecast, and Human Decisions counts to prioritize real work, and verification reviewers who must still inspect the durable evidence created by hosted lifecycle tests.

## Problem and why now

Issue #74 correctly replaced synthetic evidence with real hosted lifecycle verification. Those tests create real, auditable staging work items. The normal application currently treats those records exactly like operational work because client counts select every item with an operational state or decision status. As a result, the staging Product Lead sees 106 fake pending rulings and hundreds of fixture-inflated WIP records.

This is a trust failure. The underlying audit records are valid and must not be deleted, but they do not represent demand, work capacity, or human decisions. A Product Lead should never have to recognize and mentally subtract test data from an operational control surface.

## Governed fixture identity

The server is the only classification authority. A work item is a verification fixture only when all of the following are true:

1. the runtime environment is exactly `staging`;
2. `workflow` is exactly `Setup / excluded`;
3. the key matches the bounded issue #74 identity `RR74-` plus twelve uppercase hexadecimal characters;
4. `github_url` matches the server-created issue #74 staging fixture namespace and contains the bounded run and case identity; and
5. the assigned Builder identity matches the server-created issue #74 fixture Builder namespace.

No client label, title, description, query parameter, or single database column can classify an item by itself. A non-fixture record that shares one or more fields remains operational. Production always classifies every record as operational.

## What "done and correct" means

1. The authenticated bootstrap marks each returned item with a server-derived, read-only fixture classification using the exact predicate above.
2. Normal staging WIP, waiting-on-human, waiting-on-agent, forecast, active-work, open-backlog, priority, phase, role-cockpit, search, Flight Board, and Human Decisions surfaces operate only on non-fixture items.
3. Normal decision history, recent activity, notifications, and economics summaries do not allow fixture events to displace or distort operational records.
4. Staging exposes one clearly labeled `Verification evidence` view or filter containing every classified fixture and no operational item.
5. A reviewer can open every fixture from that view and inspect its existing authoritative item, review, decision, readiness, activity, and lifecycle evidence. No audit record is rewritten or deleted.
6. The evidence view explains that fixtures are excluded from operational metrics and cannot be treated as real Product Lead demand.
7. Classification is deterministic across refresh, search, direct item opening, and rollback. Unknown or partial identity remains operational and is visibly reviewable rather than silently hidden.
8. Unit tests cover each predicate field independently, exact matches, near misses, non-fixture `Setup / excluded` work, and the production boundary.
9. Integration tests prove that fixture records contribute zero to every named operational count while genuine items produce unchanged counts.
10. Agent-operated staging verification records the before/after count partition, opens representative fixture and non-fixture drawers, checks keyboard operation and status explanation, and confirms the exact fixture total is preserved.
11. Rollback restores the previous presentation without mutating, deleting, or reclassifying stored records.

## Design intent

Preserve the existing navigation and visual system. Add one secondary staging-only `Verification evidence` destination or Backlog filter with a concise evidence badge. The normal Product Lead surfaces should become clean automatically; they must not require the user to enable a “hide tests” preference.

The evidence view should answer three questions immediately:

- Why is this record here?
- Why is it excluded from operational counts?
- How can I inspect its authoritative evidence?

Use text in addition to color, keep keyboard focus predictable, retain the existing drawer, and ensure the view remains understandable at 320 px and 200% zoom. Empty, loading, and classification-error states must not imply that evidence was deleted.

## Out of scope

- Deleting, archiving, rewriting, or compacting any fixture or audit record.
- Changing issue #74 readiness behavior, policy, evidence, or release decision.
- A general environment, tenant, or test-data management framework.
- Reclassifying historical production records or changing production counts.
- Cleaning unrelated staging seed data or resolving issue #76.
- Redesigning the navigation, backlog, Flight Board, drawer, or Product Lead cockpit.
- Automatically approving, merging, deploying to production, releasing, or closing any work item.

## Risks and controls

The principal risk is hiding genuine work. Classification therefore requires the full server-governed conjunction and treats partial matches as operational. The second risk is losing audit access; the evidence view reads the same immutable records and no deletion or schema migration is permitted. The third risk is client/server disagreement; the server supplies the classification and automated tests reconcile every named count from one partition.

This item is elevated because it changes the management information used for prioritization and adds an accessibility-relevant UI state. It does not change authentication, authorization, personal-data use, destructive persistence, money, mass communication, or Gate authority.

## Chosen approach

Add one pure server-side classifier for the already-governed issue #74 fixture identity, return its result in bootstrap data, and derive two explicit client collections: operational items and verification evidence. Reuse the existing work-item components and drawer. Keep the default application surfaces bound only to operational items, while the staging-only evidence surface uses only fixtures.

Rejected alternatives: deleting fixtures would destroy audit evidence; hiding every `Setup / excluded` record could conceal genuine work; matching only the `RR74` key or title is spoofable and incomplete; a user-controlled “hide tests” preference would leave counts untrustworthy by default; and a new database or environment is disproportionate to this bounded correction.

## Dependency and release boundary

Issue #77 is based on the exact issue #74 staging lifecycle that created the governed fixtures. It may be implemented and verified on a stacked branch after Gate 2, but it cannot merge before its required base revisions are available. No issue #77 approval grants Gate 3 or production authority to issue #74, and no issue #74 approval grants Gate authority to issue #77.

---

GATE 1: PENDING — Product Lead approval required against the exact pre-signature revision and SHA-256.
