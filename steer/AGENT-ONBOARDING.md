# STEER Agent Onboarding

Agents are operational identities with constrained permissions, not fictional job titles.
Every active agent must have a named owner, a unique identity, an allowed role, a
communication route, and a reproducible proof that it can do only what that role needs.

## Human authority

Idriss Enayat is the initial Product Lead and gate approver. Agents may prepare evidence,
recommend a ruling, and route an escalation. They may not approve Gate 1, Gate 2, or Gate
3; change an item's experimental treatment; make a final bid/no-bid decision; publish an
external communication; or grant themselves permissions.

`Poppy` is therefore a product-analysis agent, not the Product Owner or an approval
authority. `Tempo` is the flow steward, not a Scrum Master. These names may remain for
continuity, but their STEER authority is defined here.

## Minimum viable fleet

The first live proof uses five identities. The minimum delivery chain remains Builder,
Test Agent, and fresh-context Critic; Scout and Flow Steward exercise the communication
and escalation paths.

| Buzz identity | STEER role | Initial responsibility | Write boundary |
|---|---|---|---|
| `agent-scout` | Scout | Convert sourced observations into candidate evidence | Signals and comments only |
| `agent-bolt` | Builder | Implement an approved brief in an assigned branch | Assigned work item and pull request |
| `agent-bugsy` | Test Agent | Derive and run the frozen exam | Test evidence and comments; no gate approval |
| `agent-critic-steer` | Critic | Review from fresh context | Findings and comments only; no code or status changes |
| `agent-tempo` | Flow Steward | Route messages, blockers, and aging work | Coordination metadata; no gate approval |

The Critic identity must be newly provisioned or demonstrably isolated from the Builder
session. Renaming a continuation of the Builder conversation does not satisfy this rule.

## Extended roster mapping

The existing Buzz/OpenProject accounts are retained. Activation is demand-driven.

| Existing identity | STEER mapping | Activation trigger |
|---|---|---|
| Archie | Architect | A brief has meaningful design alternatives |
| Beacon | Ops / reliability specialist | Staging or production telemetry is in scope |
| Bolt | Builder, backend | An approved backend item is ready |
| Bugsy | Test Agent | An intent is approved or a build needs verification |
| Dottie | Builder, data specialist | Schema, provenance, or analytics is in scope |
| Glimmer | Builder, frontend | An approved interface item is ready |
| Nova | Builder, AI automation specialist | An approved AI behavior is in scope |
| Pixel | Design/accessibility specialist | User interaction or accessibility is in scope |
| Poppy | Product analysis agent | Evidence synthesis is needed; never a gate approver |
| Quill | Docs Agent | Verified behavior needs durable documentation |
| Rocket | Ops / delivery specialist | CI, deployment, flags, or rollback is in scope |
| Scout | Scout | Signal volume warrants a dedicated scout |
| Sentry | Security specialist / Critic | A security-tagged item requires qualified review |
| Tempo | Flow Steward | Routing, aging, or escalation coordination is needed |

## Permission classes

| Class | May do | Must not do |
|---|---|---|
| Observe | Read public-to-team work and evidence | Comment, edit, transition, approve, or administer |
| Evidence | Observe; add attributed comments, files, findings, and proof links | Edit the written contract, change treatment, approve gates, merge, or administer |
| Build | Evidence; update an assigned branch and pull request | Push to `main`, approve own work, alter a frozen exam, or administer |
| Coordinate | Evidence; route items and maintain non-authoritative coordination metadata | Approve gates, rewrite evidence, merge, delete, manage members, or issue credentials |
| Human approver | Record an authenticated gate ruling for an exact revision | Delegate the approval merely by asking an agent to click it |

Permissions are least-privilege and deny-by-default. Each active agent receives its own
credential through a secret manager; credentials are never shared, committed, pasted in
Buzz, or printed in readiness evidence.

## Onboarding sequence

1. Create or confirm the unique identity and human owner.
2. Assign one STEER role and permission class from this file.
3. Deliver `AGENTS.md`, the role prompt, guardrails, communication contract, and the
   current brief/exam by immutable repository link or exact commit SHA.
4. Add the identity only to the required Buzz spaces and project resources.
5. Run the identity, negative-permission, communication, escalation, and offboarding
   proofs below.
6. Record the result in `steer/evidence/`; activate the identity only after it passes.

## Required proof per active agent

- The message is attributable to the expected identity and cannot be posted as another.
- The agent can read the exact contract revision and link its work item.
- It can perform its allowed action and receives a denial for one forbidden action.
- An ambiguity reaches `#escalations` and a durable GitHub issue without being silently
  resolved by the agent.
- Revoking the credential stops further access without deleting the audit record.
- No secret value appears in logs, chat, screenshots, repository history, or evidence.

Passing a persona demonstration without identity and permission proofs is not onboarding.
