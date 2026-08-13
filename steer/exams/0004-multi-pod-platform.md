# Exam — 0004 Open-source multi-POD STEER platform

**Brief:** briefs/0004-multi-pod-platform.md
**Guardrails in force:** CORE-01..08, SEC-01..05, PRIV-01..04, A11Y-01..03,
REL-01..03, DES-01..02, plus project tenant, agent, evidence, and external-action rules

## Acceptance tests

1. Given a clean supported environment, when an administrator follows only the published
   guide, then installation, organization creation, first POD, and first project complete
   without source edits.
2. Given one organization, when an administrator creates two PODs and assigns two projects
   to one POD, then every portfolio, cockpit, work item, and metric is correctly scoped.
3. Given two organizations with colliding friendly names and IDs supplied by a hostile
   client, when any read/write/export request is made, then server-side authorization
   returns only the authenticated organization’s permitted records and logs denials.
4. Given POD membership without project membership, when the member requests the private
   project, then content and metadata are denied without confirming record existence.
5. Given a human and agent with similarly named roles, when gate or access mutations are
   attempted, then only the authenticated authorized human can perform the human action.
6. Given a specialist attachment, when its scope, expiry, or revocation changes, then
   access follows the new boundary immediately and every transition is auditable.
7. Given an incomplete work item or pending human hold, when a Buzz message asks an agent
   to execute, then the adapter and agent refuse and point to the missing authorization.
8. Given each required adapter, when healthy, degraded, revoked, duplicated, or retried,
   then health and authorization states are visible and writes are safe/idempotent.
9. Given an export, when inspected, then it contains the documented portable configuration
   and evidence references but no secret, private credential, or hidden personal data.
10. Given a malformed, oversized, cross-tenant, or privilege-escalating import, when it is
    validated, then it makes no active changes and returns actionable errors.
11. Given Federal BD pilot data, when migration is rehearsed and rolled back, then record
    counts, identities, evidence links, gate history, and audit events remain traceable.
12. Given desktop and mobile users using keyboard and screen reader, when they navigate
    context switching and decisions, then WCAG 2.2 AA checks and the named task flows pass.
13. Given 30 days of dogfood events, when the learning report is generated, then outcome,
    denominator, flow, cost, human attention, bypass, defect, and experience measures are
    reproducible without exposing project-private content.

## Edge cases and attacks

- IDOR, forged organization/POD/project IDs, Unicode-confusable names, stale sessions,
  membership races, invitation replay, deleted projects, and concurrent context switches.
- Agent/human identity collision, gate impersonation, prompt injection through imported
  fields, over-broad plugin tools, hidden delegation, and compromised adapter credentials.
- Partial migration, duplicate webhook, delayed event, network partition, dependency
  outage, export interruption, unsupported version, and rollback after writes.
- Empty organization/POD/project, member in several PODs, project transfer, POD archive,
  specialist expiry during work, and organization offboarding.

## Non-functional checks

- Authorization is enforced on the server and tested across every organization-scoped
  resource and mutation; no client filter counts as isolation.
- Common interactive reads meet a defined pre-release performance budget at the agreed
  load; the Architect records the exact target before Gate 2.
- Consequential changes emit integrity-protected audit events with actor, scope, action,
  prior/new state references, artifact revision, decision, and time.
- Schema changes use backed-up, rehearsed, reversible migrations with documented recovery
  time and recovery point targets before production exposure.
- Dependency licenses, SBOM, secret scanning, vulnerability checks, and provenance are
  included in release evidence.

## Outcome instrumentation

- Record clean-install start/completion, assistance needed, elapsed time, failure reason,
  organization/POD/project counts, successful authorization, denied execution, gate
  action, specialist lifecycle, adapter health, and migration result.
- Publish an aggregate dogfood report after 30 days with denominators and limitations.
  Do not publish tenant content or identify contributors without permission.

## Human judgment checklist (Evaluate)

- [ ] Can a new delivery leader explain where to work and who can decide within 10 minutes?
- [ ] Does multi-project work feel clearer rather than like several boards hidden together?
- [ ] Are specialist and agent powers understandable before they are granted?
- [ ] Are install, denial, failure, and recovery instructions honest and actionable?
- [ ] Would the tagged owners ship this under their names as an experimental release?

---

GATE 2: PENDING — Tech Lead approval occurs in a different session after Gate 1.
GATE 2 EVIDENCE: PENDING

GATE 3: PENDING — requires Product, Tech, security, privacy, accessibility, legal,
reliability, design-system, and independent-reader evidence after the build.
GATE 3 EVIDENCE: PENDING
