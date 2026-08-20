# Exam — Issue 77 Verification fixture isolation

**Brief:** `steer/briefs/0077-fixture-isolation.md`

**Gate 1 authority:** authenticated Product Lead approval against Brief revision `6a0c6efec80e788c86ed90b9da2f31202d39e26e`, SHA-256 `958f75721c610f5e21f80a4d1892fc802bc98952abadcf1911660838c3502386`

**Guardrails in force:** CORE-01..11, A11Y-01..03, REL-01..04, DES-01..02

**Gate boundary:** this Exam freezes expected behavior only. No implementation, merge, deployment, Release, closure, production change, or Gate 3 action is authorized before an authenticated Gate 2 approval against the exact Exam revision and SHA-256.

## Frozen classification contract

The server owns one closed classifier, versioned as `steer.verification-fixture/v1`. It returns `ISSUE_74_HOSTED_LIFECYCLE` only when all of these inputs match:

1. runtime environment is exactly `staging`;
2. `workflow` is exactly `Setup / excluded`;
3. `key` matches `^RR74-[A-F0-9]{12}$`;
4. `github_url` matches `^https://staging\.test/issue-74/[a-z0-9][a-z0-9._:-]{2,79}/RR74-[A-Z0-9-]{3,50}$`; and
5. `assignee_id` matches `^rr74-builder-[a-f0-9]{16}$`.

The classifier returns `OPERATIONAL` for every partial match, malformed value, missing field, unknown environment, and every production record. Clients consume the server result and never independently infer fixture status from copy, color, URL parameters, title, description, workflow alone, or a user preference.

The bootstrap exposes the classification and partitions related records without changing their stored bytes. The application uses:

- `operational_items` for every normal management surface and metric;
- `verification_fixtures` only for the staging evidence view; and
- item-bound activity, decisions, reviews, notifications, economics, readiness, and lifecycle records in the same partition as their work item.

The implementation may use one returned collection plus a server-authored classification field if the observable contract is identical. Stored work items and audit tables are never rewritten, reclassified, deleted, or migrated.

## Acceptance tests

1. **FI-01 — Exact positive classification.** A staging item matching all five frozen fields returns `ISSUE_74_HOSTED_LIFECYCLE`, the classifier version, and a read-only fixture flag.
2. **FI-02 — Environment boundary.** The same record in `production`, preview, local, missing, or unknown environment returns `OPERATIONAL`. The client cannot supply or override environment authority.
3. **FI-03 — Conjunctive false-positive protection.** Changing each of workflow, key, URL namespace, run identity, case identity, or Builder identity independently returns `OPERATIONAL`; combinations of partial matches also remain operational.
4. **FI-04 — Ordinary excluded work remains visible.** A genuine `Setup / excluded` work item without the complete governed identity remains in normal backlog, WIP, search, phase, and decision calculations.
5. **FI-05 — Content is not authority.** Fixture-like title, description, evidence text, tags, query parameters, or client JSON cannot classify a record. Altering those values cannot declassify an otherwise exact governed fixture.
6. **FI-06 — Bootstrap partition completeness.** Every authenticated POD work item appears exactly once in either the operational or verification partition. The union equals the pre-change item identity set and the intersection is empty.
7. **FI-07 — Related-record partition.** Activity, decisions, reviews, notifications, economics events, readiness snapshots/events, intents, proof events, and receipts remain item-bound. Fixture records cannot displace operational recent activity/history through shared limits or sorting.
8. **FI-08 — Operational metric reconciliation.** WIP, active, blocked, waiting-on-human, waiting-on-agent, open backlog, priority, phase, workflow, forecast, and role-cockpit counts recompute solely from operational items and equal an independent server-side oracle.
9. **FI-09 — Human Decisions reconciliation.** `Needed now` and `Resubmitted` fixtures contribute zero to navigation badges, Overview, My Work, Decision Inbox, flow pulse, notifications, and decision targets. Genuine matching items contribute exactly once.
10. **FI-10 — Operational navigation and search.** My Work, Overview, Flight Board, Backlog, Human Decisions, Team & Agents, global search, and default direct-item selection do not surface a fixture as operational work.
11. **FI-11 — Staging evidence surface.** Staging exposes one clearly named `Verification evidence` destination or filter. It contains every classified fixture, no operational item, the preserved total, and an explanation that the records are audit evidence excluded from operational metrics.
12. **FI-12 — Authoritative drawer preservation.** From the evidence surface, a reviewer can open representative ready, blocked, invalidated, and effective fixtures and inspect the existing authoritative drawer, review, decision, activity, readiness, intent, and receipt evidence without creating or mutating a record.
13. **FI-13 — Refresh, search, and direct evidence access.** Evidence filtering, evidence search, refresh, opening/closing a drawer, and a supported direct evidence selection preserve the same server classification and never move a fixture into operational collections.
14. **FI-14 — Empty/loading/error honesty.** Empty, loading, bootstrap failure, and classification mismatch states do not claim evidence was deleted or operational counts are trustworthy. A malformed or unclassified record remains operational and produces bounded diagnostic telemetry.
15. **FI-15 — Accessibility.** Automated axe and agent-operated keyboard, focus, screen-reader, visible-focus, contrast, 320 px, and 200% zoom checks pass for: evidence list populated, evidence empty, search no result, drawer open, classification warning, bootstrap failure, normal cockpit with zero rulings, and normal cockpit with one genuine ruling. Status/exclusion explanations are available in text and announced once.
16. **FI-16 — Content-safe telemetry.** Bounded metrics record classifier outcome, partition totals, mismatch/error outcome, and evidence-view load result. They contain no work content, reasoning, email, personal identity, raw URL, credential, or unbounded run/case identifier.
17. **FI-17 — No persistence mutation.** Before/after identity counts and canonical projections for work items, activity, decisions, reviews, readiness, intents, receipts, events, telemetry, economics, and notifications remain byte-equivalent except for the separately named bounded read telemetry. No schema migration is generated.
18. **FI-18 — Existing behavior regression.** The complete existing suite proves issue #74 readiness, Gate decisions, review lifecycle, dispatch, signal generation, economics, history, completed work, and production hosting metadata remain unchanged.
19. **FI-19 — Hosted staging reconciliation.** Against the frozen pre-change staging baseline, all 106 visible pending rulings classify as issue #74 fixtures, the normal Human Decisions count changes from 106 to 0, the evidence view shows and opens all 106, and zero genuine pending ruling is lost. The ledger records all item identities and before/after count oracles.
20. **FI-20 — Production boundary and rollback.** Before Gate 3, production source/version/environment/table inventory/counts remain unchanged. Exact staging rollback restores the prior presentation while all fixture and audit projections remain identical; restoring the candidate deterministically recreates the clean operational partition.

## Non-functional checks

- The pure classifier processes the current staging item population in at most 50 ms at p95 and adds no network round trip.
- Authenticated bootstrap p95 does not regress by more than 10% from a same-environment pre-change sample.
- The evidence view remains responsive with at least 500 fixtures and does not render an unbounded activity or decision history eagerly.
- No new dependency, schema column, migration, secret, credential, external call, or browser-stored classification state is introduced.
- All classifier input strings have explicit length bounds before pattern evaluation.
- Repository build, typecheck, lint, tests, secret scan, dependency audit, and guardrail checks remain green within the existing time budget.

## Frozen staging ledger

The hosted denominator is fixed before the implementation run:

- 106 current pending-ruling fixtures and zero current genuine pending rulings;
- every current work-item identity partitioned exactly once;
- six positive/negative classifier identity cases, including a genuine `Setup / excluded` near miss;
- every operational metric named in FI-08 and every ruling surface named in FI-09;
- four representative fixture drawer states and one genuine operational drawer;
- the eight accessibility states in FI-15;
- one rollback and restore sequence with exact before/during/after projections; and
- a read-only production boundary snapshot.

Any verification rerun appends a new run identity and preserves the first complete failure or success evidence. It never overwrites or deletes the frozen baseline.

## Human judgment checklist

The Test and Critic agents perform count reconciliation, interaction, accessibility, rollback, and production-boundary checks. The Product Lead confirms their exact-target result rather than manually processing fixture rulings.

- [ ] The normal cockpit now represents only genuine operational work without a user preference.
- [ ] The evidence surface clearly explains why fixtures are present and excluded.
- [ ] Every fixture remains inspectable and no audit evidence was deleted or rewritten.
- [ ] A genuine near-match remains visible in the normal workflow.
- [ ] The fix does not alter issue #74 authority or production state.

---

GATE 2: PENDING — Interim Tech Lead approval required against the exact pre-signature revision and SHA-256.
