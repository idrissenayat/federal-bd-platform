# STEER Agent Onboarding

Agents are constrained cryptographic identities, not fictional job titles. Every active
agent needs a human owner, a unique Nostr keypair, one STEER role, the minimum required
Buzz memberships, and reproducible allowed/denied/offboarding proofs.

## Human authority

Idriss Enayat is the initial decision owner. Agents may prepare evidence, recommend a
ruling, and route an escalation. They may not approve a STEER gate, change experimental
treatment, make a final bid/no-bid decision, authorize external communication, or grant
themselves permissions.

## Minimum viable fleet

| Buzz identity | STEER role | Runtime | Boundary |
|---|---|---|---|
| `builder` | Builder | Codex through `codex-acp` | Signed brief and assigned branch only |
| `critic` | Critic | Claude through `claude-agent-acp` | Fresh context; findings only |
| `test-agent` | Test Agent | Codex through `codex-acp` | Exam and verification evidence only |

Scout, Architect, Docs, Ops, and specialist roles are prompts activated by the triggers
in `agents/agent-roles.md`; they are not day-one accounts. The Critic is always a fresh
session and never a continuation of the Builder conversation.

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
