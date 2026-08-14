# STEER tool adapter contracts

STEER requires capabilities, not brands. Each adapter declares its owner, version,
credentials, scopes, supported operations, evidence format, health, and revocation path.
An organization approves adapters centrally and installs them only where needed.

| Capability | Adapter must provide | Reference choice today |
|---|---|---|
| Work authorization | POD/project/item IDs, assignment, state, gates, holds, audit | STEER Work Management |
| Code and durable evidence | immutable revisions, reviews, links, protected change path | GitHub |
| Communication | project/thread identity, mentions, message links, membership | Block Buzz |
| Agent runtime | distinct identity, role prompt, tool scopes, start/stop, activity | Buzz ACP / configured models |
| Identity and access | authentication, organization/POD/project membership, revocation | Deployment-specific |
| CI and verification | checks tied to artifact revision, logs, attestations | GitHub Actions + gauntlet |
| Secrets | non-display storage, rotation, least-privilege injection | Deployment-specific |
| Deployment | versioned release, environment, rollback, health | Sites / deployment-specific |
| Observability | events, outcomes, cost, reliability, guardrail signals | STEER learning ledger |

## Required invariants

1. Communication never becomes work authorization.
2. An agent cannot widen its own assignment, tools, memberships, or response policy.
3. Gate evidence identifies the human, artifact revision, time, and decision.
4. Every write is organization-, POD-, project-, and item-scoped as applicable.
5. Retries are idempotent or visibly produce a new event; hidden duplicate actions fail.
6. Secrets and private credentials never enter prompts, logs, exports, or evidence links.
7. Loss of adapter health produces a visible hold, not silent best-effort execution.
8. Revocation stops new work and is testable end to end.

## Specialist plugins

A specialist plugin packages one bounded capability such as accessibility review,
security testing, legal analysis, proposal design, data engineering, or domain research.
It may be performed by a human or agent, but the installation declares:

- supported role and competence claim;
- human owner and escalation route;
- organization/POD/project/work-item scope;
- read/write/external-action permissions;
- data classes and destinations;
- required tags and gates;
- expiry or review date;
- evidence produced and conformance checks.

Plugins advise or execute within that boundary. They do not become POD members, gate
approvers, or broadly authorized agents merely because they are installed.

## Conformance direction

Before 1.0, adapters are reference integrations. The planned conformance kit will test
identity separation, scoping, evidence integrity, authorization refusal, revocation,
health failure, idempotency, and export behavior against a versioned contract.
