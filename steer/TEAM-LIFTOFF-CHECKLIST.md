# Team Liftoff Checklist

The compact, repo-side version of the Team Liftoff Guide. A STEER team is cleared for
normal operations when every box is checked and the three live proofs at the bottom exist.
Re-run this checklist for every new team, and in miniature for every new hire.

## 1 · People ready

- [ ] Core four named against charters (merged hats explicit); gate signers unambiguous: ◆1 PL · ◆2 TL · ◆3 PL + TL + **every tagged domain owner** + one independent reader (authored neither brief nor exam)
- [ ] Gate separation: ≥2 humans across the gates (solo: SOLO-MODE cooling-off in force)
- [ ] Every specialist domain has an owner — fractional counts, "nobody" doesn't
- [ ] Minimum fleet configured from `agents/agent-roles.md`; fresh-context Critic verified. Cross-vendor diversity is added by trigger and recorded as diversity insurance, not independent assurance
- [ ] Honesty-test defect-category bank written and sealed (used for unannounced agent-seeded tests)
- [ ] All humans have read the kit and their charter
- [ ] Every human completed `TEAM-ONBOARDING.md`, joined the shared Buzz community, and posted a verified hello
- [ ] Every agent has a separate admitted identity, named human owner, approved channels, and successful mention/reply proof
- [ ] Working agreements signed (see Liftoff Guide); WIP limit and review SLAs written down

## 2 · Tools ready (run the test, don't trust the install)

- [ ] Protected trunk; PR-only; direct push to main rejected
- [ ] Gate checks bind authenticated approver identities to exact artifact/commit revisions; typed timestamp lines alone cannot pass
- [ ] Two builder agents can work in parallel branches without collision
- [ ] Gauntlet blocks merge on: planted secret, failing test
- [ ] Flags: ship / hide / un-ship without editing app code; rollback rehearsed twice
- [ ] Thrown error appears in tracking within a minute; signals inbox is the single landing place
- [ ] Flight board answers "what's in flight, what's blocked?" in 30 seconds
- [ ] Buzz relay admission, channel membership, human invitation, and agent escalation were tested end to end
- [ ] Last week's agent spend is a number someone can say out loud
- [ ] Last week's judgment, diff-fixing, and governance hours are numbers someone can say out loud

## 3 · Environment ready

- [ ] Agents sandboxed: no path from a builder to production data or secrets
- [ ] Staging deploys automatically on merge and resembles production
- [ ] Secrets in a store/env only (SEC-01); least-privilege access for humans and agents
- [ ] Day-one access list exists (repo, CI, flags, telemetry, agent platform, board)
- [ ] No real user data outside production; synthetic fixtures for exams

## 4 · Process ready

- [ ] Kit installed; templates in use; decision log started; metrics table exists
- [ ] Default-closed list debated and agreed at liftoff (not during an incident)
- [ ] Huddle time fixed (daily, ≤15 min); Learning Review slot fixed (weekly, protected)
- [ ] Guardrail library baselined: irrelevant rows cut, product-specific rows added

## 5 · Product ready

- [ ] 3–5 candidate briefs written and ranked
- [ ] Design system seeded (tokens + core components + written usage rules)
- [ ] Metrics baseline: historical data pulled (existing product) or metrics start at item #1 (new)
- [ ] Pilot cohort, baseline, outcome definitions, and missing-data policy written from `PILOT-EVIDENCE-PLAN.md`
- [ ] First feature chosen: small, real, user-visible
- [ ] Application skeleton exists and deploys to staging with one passing test — before Day 1, not during it

## The three live proofs (go / no-go)

- [ ] Tracer bullet shipped through all 7 phases with **zero** manual infrastructure work
- [ ] A planted failure was **blocked** by the gauntlet
- [ ] One real item passed all three gates with the agreed signers
- [ ] One real item emitted its brief-defined outcome and guardrail telemetry

## Standing health checks

| Cadence | Check |
|---|---|
| Weekly | Learning Review — metrics, two questions, ≤2 process changes (escape-conversions exempt) |
| Monthly | Honesty test — agent-seeded from the sealed bank, unannounced; must be caught. Plus the gate-decay check (re-read one signed ◆3 cold) |
| Quarterly | Process audit — rotating auditor reads a month of artifacts, reports drift. Guardrail consolidation pass (coverage-preserving merges) |
| Monthly (multi-pod) | Org review — portfolio layer merges pod learnings into the shared libraries; owns the interface-request queue |
| Per hire | Liftoff-in-miniature: read → shadow → co-sign → own |
