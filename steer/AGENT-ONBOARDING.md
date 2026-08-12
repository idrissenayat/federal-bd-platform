# STEER Agent Onboarding

Agents are constrained cryptographic identities, not fictional job titles. Every active
agent needs a human owner, a unique Nostr keypair, one STEER role, the minimum required
Buzz memberships, and reproducible allowed/denied/offboarding proofs.

## Human authority

Idriss Enayat is the initial decision owner. Agents may prepare evidence, recommend a
ruling, and route an escalation. They may not approve a STEER gate, change experimental
treatment, make a final bid/no-bid decision, authorize external communication, or grant
themselves permissions.

## Enrolled reference fleet

The project elected to enroll all seven reference roles in Buzz even though Minimum
Viable STEER requires only Builder, Test, and fresh-context Critic. Enrollment establishes
identity, provenance, and channel boundaries; it does not justify running every worker or
incurring provider cost before a role is needed.

| Buzz identity | STEER role | Runtime state | Boundary |
|---|---|---|---|
| `scout` | Scout | Enrolled; lane selected at activation | Evidence-backed signals and candidate briefs only |
| `architect` | Architect | Enrolled; lane selected at activation | Options and trade-offs; no production code |
| `builder` | Builder | Enrolled; Codex worker not hosted | Signed brief and assigned branch only |
| `test-agent` | Test Agent | Enrolled; Codex worker not hosted | Exam and verification evidence only |
| `critic` | Critic | Enrolled; Claude worker not hosted | Fresh context; findings only |
| `docs-agent` | Docs Agent | Enrolled; lane selected at activation | Evidence-bounded docs and release notes |
| `ops-agent` | Ops Agent | Enrolled; lane selected at activation | Deployment, telemetry, rollback, and release-watch evidence |

Role activation still follows the triggers in `agents/agent-roles.md`; dormant identities
do not count as running capacity. The Critic is always a fresh session and never a
continuation of the Builder conversation.

## Buzz identity rules

- Use the official Block Buzz relay, CLI, and ACP harness.
- Mint one Nostr keypair per identity and store private keys only in an approved secret
  store. Public keys may appear in evidence; private keys may not.
- Configure the human with the relay `owner` role. Agents are `member` at relay scope
  and `bot` only in the required channels.
- Set ACP inbound author policy to `owner-only` unless an explicit brief authorizes a
  narrower reviewed allowlist. `anyone` is default-closed.
- A display name, avatar, or reused persona name never establishes identity or authority.

## Onboarding sequence

1. Create the unique keypair and record the human owner.
2. Assign one role from `agents/agent-roles.md`.
3. Deliver `AGENTS.md`, the exact `/steer` revision, and the current brief/exam.
4. Enroll the public key at relay scope and add only required private channels.
5. Prove a signed profile, allowed read/write, forbidden access, owner-only ACP routing,
   revocation, and retained history.
6. Record public evidence in `steer/evidence/`; activate only after it passes.

## Required proof per active agent

- Messages verify under the expected public key and cannot be posted as another actor.
- The agent can read the required channel and publish only within its role boundary.
- An unregistered or revoked key receives `relay_membership_required`.
- Ambiguity reaches `agent-escalations` without silent resolution.
- Revocation stops new access without deleting signed history.
- No secret appears in logs, chat, screenshots, repository history, or evidence.

Passing a persona demonstration without these identity and permission proofs is not
onboarding.
