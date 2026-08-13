# Intent Brief — 0004 Open-source multi-POD STEER platform

**Status:** Gate 1 rework after authenticated Product Lead change request
**Tags:** #security #privacy #a11y #legal #reliability #design-system #money
**Date opened:** 2026-08-13
**Work item:** [GitHub issue 16](https://github.com/idrissenayat/federal-bd-platform/issues/16)

## Expected outcome and measurement

- **Primary outcome:** an unfamiliar organization can install the STEER distribution,
  create its organization and first POD, add two projects, onboard a human and a bounded
  agent, and authorize the first work item without project-specific assistance.
- **Baseline / denominator:** the current hosted Flight Board is a hard-coded single-POD,
  single-project pilot and the reusable adoption success rate is therefore 0/1 tested
  organizations.
- **Observation window:** installation test plus 30 days of dogfood use after release.
- **Minimum meaningful signal:** 4 of 5 clean-environment onboarding trials complete the
  path in 45 minutes or less; all required isolation and authorization tests pass.
- **Guardrail measure:** zero cross-organization/project data exposures, zero agent gate
  approvals, zero unauthorized executions, and no critical accessibility blockers.

## Who this is for

A delivery leader adopting Agentic SDLC who needs several human/agent PODs and projects,
but does not want the operating model coupled to the Federal BD domain or one vendor
toolchain. The first dogfood user is the STEER Flight Team itself.

## Problem and why now

The prototype makes the lifecycle visible, but its workspace, project, roles, members,
and integrations are coupled to one pilot. That prevents credible external adoption and
makes adding another internal project ambiguous. Publishing the code without an
installable organizational model would create an open repository, not an open system.

## What "done and correct" means

1. An administrator can install a versioned STEER distribution and create an organization
   without modifying source code.
2. An organization can own several PODs; each POD can track several projects.
3. Membership and permissions are explicitly scoped to organization, POD, project, and
   work item, with default-deny tenant isolation.
4. A POD can onboard named human and agent roles with distinct identities, owners,
   capabilities, and audit history.
5. A temporary specialist—human or agent—can be attached with bounded permissions,
   required tags, an expiry/review date, and revocation.
6. A user can switch POD/project context and immediately understand assigned work,
   decision requests, progress, blockers, ownership, and the next permitted action.
7. Work authorization, communication, code/evidence, agent runtime, CI, identity,
   secrets, deployment, and observability tools connect through versioned adapters.
8. Configuration can be exported without secrets and imported only after validation.
9. Existing Federal BD pilot records remain traceable through a documented migration.
10. The system captures outcome, flow, quality, cost, human-attention, bypass, and
    experience measures for bounded Learning Review changes.

## Design intent

The platform uses an organization switcher, POD/project switcher, role cockpit, portfolio
view, project board, decision inbox, member/agent roster, adapter registry, and learning
view. Plain language answers “Where am I?”, “What do I own?”, “What is waiting?”, “Who
can decide?”, and “What happens next?” before exposing implementation detail.

Every list has useful empty, loading, denied, stale, disconnected-adapter, and error
states. Context remains visible on desktop and mobile. Body text and controls meet WCAG
2.2 AA sizing, contrast, keyboard, focus, and semantic requirements. Destructive or
privilege-changing actions require an explicit confirmation that names the affected
organization, POD, project, member, and consequence.

## Out of scope

- A marketplace, billing, or paid plugin economy.
- Autonomous human gate approval or unrestricted agent-to-agent delegation.
- Importing sensitive project content from arbitrary third-party tools.
- Claiming universal STEER superiority or production certification from the pilot.
- Replacing specialized code hosts, communication tools, or identity providers.

## Risks and default-closed touchpoints

This introduces authentication/authorization, personal membership data, schema
migrations, exports, agent tool access, and external adapters. It is default-closed.
Threats include tenant confusion, IDOR, confused deputy behavior, agent impersonation,
prompt/tool injection, over-broad OAuth scopes, secret leakage, stale membership,
malicious imports, unsafe plugins, audit tampering, and irreversible migrations. The
architecture must use server-side scope enforcement, separate identities, least
privilege, immutable audit, validated imports, reversible migrations, and denial tests.

Legal review must confirm the project license, third-party dependency/license inventory,
contributor terms, name/trademark policy, privacy disclosure, and adapter terms before a
1.0 distribution.

## Specialist guardrails and default-closed cooling-off plan

This item is default-closed because it introduces authentication and authorization,
personal membership data, schema migrations, external adapters, and a future boundary
where paid capabilities could be connected. Billing and movement of money remain out of
scope for this brief; any later money-handling capability requires its own brief, exam,
named commercial authority, and explicit human gates.

- **Named decision authorities:** the Product Lead rules on Gate 1; the Tech Lead rules on
  Gate 2 in a different session; Gate 3 requires the Product Lead, Tech Lead, an independent
  reader, and the named owners for security, privacy, accessibility, legal, reliability,
  design system, and money. An open owner seat blocks Gate 3 rather than transferring
  authority to an agent.
- **Bounded specialists:** every human or agent specialist receives an explicit organization,
  POD, project, work-item, capability, owner, expiry/review date, and revocation path.
  Default permissions are empty. Delegation, privilege expansion, and gate approval are
  prohibited unless a later approved artifact expressly authorizes the specific action;
  human gates can never be delegated to an agent.
- **Evidence required before Gate 2:** the exam must cover the threat model, server-side
  authorization matrix, tenant-denial cases, specialist expiry/revocation, data inventory
  and retention/deletion, migration rollback, adapter scopes, audit integrity, accessibility,
  license/dependency controls, and the explicit no-money boundary.
- **Evidence required before Gate 3:** Builder, Test, independent Critic, and each tagged
  owner must review the exact release revision. Required evidence includes clean isolation
  and authorization tests, no critical dependency or accessibility blocker, rehearsed
  migration rollback, specialist revocation proof, and a resolvable audit trail.
- **Cooling-off:** the item never auto-ships. In team mode, every named Gate 3 authority
  must sign. In solo mode, the authenticated human may rule only after the STEER-mandated
  24-hour cooling-off from the verified build; the platform and repository must retain the
  exact artifact revision, identity, timestamps, Critic review, and cooling-off evidence.
- **Failure behavior:** missing authority, missing evidence, stale evidence, an unresolved
  blocker, or an incomplete cooling-off period keeps the work blocked. Buzz discussion,
  agent output, a green CI run, or a merge never substitutes for a human gate ruling.

## Chosen approach

Pending Architect options. The working direction is a vendor-neutral Core contract with
a reference Work Management implementation and permission-scoped adapters. Rejected for
now: hard-coding the current Buzz/GitHub/Sites stack, treating each project as a separate
installation, or making plugins full-trust POD members.

---

GATE 1: CHANGES REQUESTED — authenticated Product Lead ruling recorded in Flight Board
work item STR-007; this corrected revision requires a new ruling.
GATE 1 EVIDENCE: PENDING — rerun the Critic and bind the next ruling to this exact revision.
