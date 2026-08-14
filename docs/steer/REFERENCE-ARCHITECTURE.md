# STEER reference architecture

The architecture separates governance from replaceable tools so an organization can
adopt STEER without accepting one vendor stack.

```text
Organization policy and identity
        │
        ├── POD registry ── memberships ── specialist attachments
        │        │
        │        └── Projects ── work items ── gates ── outcomes
        │
        ├── STEER Work Management (system of work authorization)
        ├── Evidence store / code host / CI (system of engineering record)
        ├── Communication adapter (coordination, never authorization)
        ├── Agent runtime adapter (bounded execution identities)
        └── Observability + learning ledger (outcomes and guardrails)
```

## Core records

Every implementation needs stable identifiers for organization, POD, project, member,
role, specialist attachment, adapter installation, work item, artifact revision, gate
ruling, execution authorization, evidence link, event, release, outcome observation, and
learning decision.

Humans and agents are both members, but their capabilities differ. `member_type` never
grants a human gate to an agent. Authorization is the intersection of organization
policy, POD/project membership, role, work-item assignment, gate state, adapter scope,
and credential validity.

## Trust boundaries

- Organization data is tenant-scoped and default-denied across organizations.
- POD membership does not automatically grant every project in that POD.
- A project channel cannot create or alter work authorization.
- An adapter receives only the scopes required for its capability.
- Agent credentials are separate from human identities and other agents.
- External actions are human-approved unless a signed policy explicitly permits a
  bounded reversible action.
- Every consequential transition emits an immutable audit event.

## Portability

Configuration export must exclude secrets while preserving stable IDs, policies, role
templates, project metadata, and adapter declarations. Evidence links may remain external
if integrity and access requirements are recorded. Import performs validation before any
identity, permission, or workflow state becomes active.

## Deployment profiles

- **Repository profile:** Markdown, issues, pull requests, and CI implement the model.
- **Team profile:** Work Management plus communication and agent adapters serve one POD.
- **Organization profile:** multi-tenant identity, several PODs/projects, audit, backup,
  policy inheritance, adapter administration, and conformance reporting.

The current hosted Flight Board is a team-profile prototype, not yet an organization-
profile release.
