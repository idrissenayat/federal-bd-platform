# Buzz and Agent Readiness Evidence — 2026-08-12

## Decision

**Buzz B1 functional proof: PASS locally.**

**Hosted human workspace: PASS / OWNER-ONLY.**

**Hosted autonomous-agent access: PARTIAL / DEFAULT-CLOSED.**

The communication controls and five-agent onboarding chain passed locally. The private
Sites deployment is live for authenticated humans. Private Sites also protects API
routes, so autonomous hosted agents remain blocked until a separate machine-bypass
credential is explicitly authorized. That credential is additive to, not a replacement
for, each agent's unique Buzz credential.

## Observed environment

| Component | Observation | Readiness implication |
|---|---|---|
| OpenProject | Local Compose deployment is running; prior private `Agentic End2End SDLC` project has 16 members, 33 work packages, and two boards | Backend exists; content is a Scrum-oriented historical pilot, not a STEER workspace |
| XWiki | Local deployment responds and contains an Agentic End2End SDLC project home | Documentation backend exists; STEER revision-labelled onboarding is absent |
| Agent accounts | Fourteen named persona accounts exist | Roster inventory only; role names and permissions do not implement STEER authority |
| Agent credentials | Five unique Buzz credentials were issued, hashed at rest, never printed, and placed in an ignored mode-0600 local vault | Local minimum fleet is separately authenticated; hosted reachability still needs explicit Sites bypass authority |
| Roles | Scout, Bolt, Bugsy, fresh-context Critic, and Tempo passed an allowed and forbidden operation | Least privilege and channel membership passed locally |
| Buzz web application | STEER communications UI is deployed owner-only at `https://buzz-sdlc.idriss-enayat.chatgpt.site` | Authenticated human workspace is operational |
| Buzz data model/API | Separate `steer_*` tables hold identities, memberships, six spaces, messages, and administrative audit events | Legacy Scrum data remains; STEER events are append-only SHA-256 chains |
| GitHub | Private repository, issues, pull requests, Actions, Discussions, and `/steer` artifacts are operational, with known branch-protection/Projects account constraints | Remains authority and communication fallback |

No secret values were copied into this evidence.

## Preserved baseline

The existing OpenProject/XWiki Scrum pilot remains unchanged. The former Buzz Scrum
prototype is preserved in local commit `b38e143` and annotated tag
`buzz-scrum-prototype-baseline-2026-08-12`. The nine legacy tasks and nine legacy messages
remain in their original D1 tables; STEER uses separate prefixed tables. Runtime secrets,
backups, build output, dependencies, and the independently pinned OpenProject vendor
checkout were excluded from Git history.

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
- Buzz commit `b2f8e49` implements Sites/ChatGPT human authentication, unique hashed
  agent credentials, workspace/channel membership, provenance, protected action kinds,
  authoritative artifact/revision links, credential rotation/revocation, and two
  recomputable SHA-256 event chains.
- The proof recorded five active agents, five attributed agent contributors, five denied
  actions, three revocation events from repeated development verification, and valid
  message/audit chains. No credential value appears in this evidence.
- Local routing exercised issue `#10` for a signal and escalation and pull request `#11`
  revision `b34e499` for the fresh-context Critic finding.

## Remaining hosted B1 proof

1. Receive explicit authority to create a Sites SIWC bypass credential for autonomous
   machine access to this owner-only application.
2. Store and distribute it separately from the five unique Buzz agent credentials.
3. Repeat one allowed and one denied agent request against the hosted endpoint.
4. Revoke/rotate the applicable hosted credential and prove history remains.

Until these pass, humans may use the private Buzz workspace, but autonomous hosted agents
use GitHub Discussions and escalation issues as the operational fallback. Buzz does not
become the default shared huddle based on the local proof alone.
