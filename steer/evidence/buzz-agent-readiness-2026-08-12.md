# Buzz and Agent Readiness Evidence — 2026-08-12

## Decision

**Buzz services and prior agent roster: INVENTORIED (B0).**

**STEER agent onboarding and communication: NOT READY / DEFAULT-CLOSED.**

The environment contains useful working components, but a running service, an avatar,
and an account name are not evidence that an agent is safely onboarded. Buzz must not be
described as the operational STEER communication plane until B1 proofs pass.

## Observed environment

| Component | Observation | Readiness implication |
|---|---|---|
| OpenProject | Local Compose deployment is running; prior private `Agentic End2End SDLC` project has 16 members, 33 work packages, and two boards | Backend exists; content is a Scrum-oriented historical pilot, not a STEER workspace |
| XWiki | Local deployment responds and contains an Agentic End2End SDLC project home | Documentation backend exists; STEER revision-labelled onboarding is absent |
| Agent accounts | Fourteen named persona accounts exist | Roster inventory only; role names and permissions do not implement STEER authority |
| Agent credentials | Only Tempo was observed with an API token; the other personas had no API token | Minimum fleet cannot yet communicate as separate authenticated agents |
| Roles | Tempo has broad write capability; most personas are read/assignee accounts | Least-privilege STEER evidence/build/critic boundaries are not proven |
| Buzz web application | Local source contains a chat/board prototype with sample Scrum channels, people, tasks, and messages; it was not running locally | User experience prototype, not operational communication proof |
| Buzz data model/API | Prototype stores tasks and messages and interprets simple text commands | No proven workspace/channel membership, immutable agent identity, signature, provenance, or GitHub reconciliation |
| GitHub | Private repository, issues, pull requests, Actions, Discussions, and `/steer` artifacts are operational, with known branch-protection/Projects account constraints | Remains authority and communication fallback |

No secret values were copied into this evidence.

## Preserved baseline

The existing OpenProject/XWiki Scrum pilot is left unchanged. The Buzz application source
also remains unchanged because its repository contains unversioned prior work. Before UI
adaptation, that state needs an owner-reviewed baseline commit or tag so the original can
be recovered and compared.

## Controls established in this revision

- `steer/AGENT-ONBOARDING.md` defines human authority, identity requirements, minimum
  fleet, role mappings, permissions, onboarding, and negative tests.
- `steer/BUZZ-OPERATING-CONTRACT.md` defines spaces, routing, message evidence, system
  boundaries, fallback, and B0–B3 promotion criteria.
- `integrations/buzz/agent-roster.yaml` records non-secret desired state for a distinct
  `STEER Federal BD Platform` workspace.
- GitHub issue `#10` is the authoritative setup item for the remaining B1 proofs.
- The idempotent provisioner created private OpenProject project ID `4`, identifier
  `steer-federal-bd-platform`, with six members: the human administrator plus Scout,
  Bolt, Bugsy, a new fresh-context Critic identity, and Tempo. It created one B1 proof
  work item and no API token.
- The old project remained ID `3` with 33 work packages, two boards, and 16 members after
  provisioning, matching its pre-provisioning inventory.
- OpenProject role inspection confirms the four Evidence agents can comment but cannot
  edit work packages or manage members. Tempo can comment and coordinate work state but
  cannot manage members. This is a configuration check, not yet an authenticated B1 API
  proof. Tempo retains its one pre-existing pilot token; all four Evidence agents and the
  new Critic have zero tokens.
- GitHub and `/steer` remain authoritative; Buzz, OpenProject, and XWiki cannot silently
  approve or overwrite consequential state.

## Remaining B1 proofs

1. Preserve the Buzz prototype baseline after reviewing its untracked files.
2. Issue unique, non-displayed credentials to the four active Evidence identities. Tempo
   may use its existing credential only after rotation/ownership is verified.
3. Enforce channel membership, message attribution, provenance, retention, and revocation.
4. Prove each role can perform an allowed action and is denied a forbidden action through
   the authenticated interface, not only by inspecting configured permissions.
5. Route a sourced signal to `#signals`, an ambiguity through `#escalations` to a GitHub
   issue, and a fresh-context finding to `#critic-findings` and a pull request.
6. Revoke one test credential and prove access stops while history remains.
7. Verify that secrets and sensitive data do not appear in messages or audit output.

Until these pass, GitHub Discussions and escalation issues are the operational fallback.
