# Block Buzz integration boundary

This directory versions STEER's non-secret configuration contract for
[Block Buzz](https://github.com/block/buzz). Buzz is the human/agent communication
plane; it is not a replacement for GitHub, `/steer`, the flight board, or human gate
authority.

## Implemented shared topology

```text
human owner + uniquely keyed agents
                 |
                 v
      Railway-hosted Block Buzz relay
       (TLS + Nostr signed event log)
                 |
        +--------+---------+
        |        |         |
     huddle   signals  escalations
        |
        v
 GitHub issues / PRs / versioned /steer
       (authoritative outcomes)
```

- The relay, `buzz` CLI, and `buzz-acp` harness come from the official `block/buzz`
  repository. We do not maintain a separate application called Buzz.
- The shared relay is `wss://blockbuzzmain-production-5bcb.up.railway.app`, deployed in
  the isolated Railway project `steer-block-buzz` from Block's official Railway
  template. The image is pinned to `ghcr.io/block/buzz:sha-788b3c0`.
- Railway supplies managed PostgreSQL, Redis, persistent volumes, and S3-compatible
  object storage. Point-in-time recovery is enabled for PostgreSQL; scheduled snapshots
  and a restore rehearsal remain open controls on the current account capability.
- Every human and agent has a distinct Nostr keypair. Bootstrap identities remain in
  macOS Keychain only until hosted workers receive service credentials through Railway
  secrets; no private key is committed or copied into evidence.
- Relay membership is enforced. The owner is configured through
  `RELAY_OWNER_PUBKEY`; agents are explicit members and private-channel bots.
- All seven reference roles are enrolled as distinct identities: Scout, Architect,
  Builder, Test Agent, Critic, Docs Agent, and Ops Agent. Enrollment does not imply that
  an always-on model worker is running.
- Codex and Claude connect through the official ACP adapters. Inbound agent work is
  owner-only by default.
- GitHub and `/steer` remain authoritative for work, code, experiments, gates,
  evidence, and decisions. Buzz messages link to those records.

`agent-roster.yaml` is desired state plus non-secret shared endpoint/channel metadata.
Public keys and signed event IDs from both local and remote proofs live in
`steer/evidence/buzz-agent-readiness-2026-08-12.md`.

## Current promotion boundary

The shared relay B1 communication slice is proven, including TLS reachability,
enrollment, signed messages, denial, revocation, and restart retention. It is ready for
controlled human onboarding. All seven reference agent identities are enrolled, profiled,
and channel-scoped. The Builder now has a persistent, owner-only Railway worker backed by
the OpenAI-compatible runtime and a signed post-restart reply proof. The other six roles
remain default-closed until their provider service credentials, runtime assignments, and
remote ACP proofs are complete. Backup restore, external alerting, GitHub B2
reconciliation, and a custom-domain decision remain open production controls.

## Railway worker deployment

`Dockerfile.worker` builds the official `buzz-acp`, `buzz-agent`, `buzz-dev-mcp`,
and `buzz` binaries at the same pinned Block Buzz commit as the hosted relay. The
worker uses Buzz's built-in OpenAI-compatible runtime so it does not depend on an
interactive Codex or Claude login.

Prefer one Railway service per activated identity. When the Railway account cannot
provision another service, the same image can supervise multiple separately signed
identities by setting `STEER_AGENT_ROLES`. Shared-service mode still requires a unique
private key, prompt, and model variable for every role; `BUZZ_ACP_AGENTS` alone is not
sufficient because Block Buzz documents that its pool shares one Nostr identity.

Set `RAILWAY_DOCKERFILE_PATH=/integrations/buzz/Dockerfile.worker`, then copy the
non-secret settings from `railway-worker.env.example`. Add each identity's unique
private key, its provider key, and its role-specific system prompt only as sealed
Railway service variables. Set `BUZZ_ACP_AGENT_OWNER` to the human owner's public key
when using `owner-only`; without that public identity (or a verified `BUZZ_AUTH_TAG`),
the harness intentionally drops
every inbound event. Do not reuse a Buzz identity key between services.

Start with one owner-only Builder proof before activating the remaining roles. A
successful deployment must connect to the shared relay, discover only its assigned
channels, respond to an owner mention, reject a non-owner mention, and preserve the
signed reply after restart. Promotion evidence records event IDs and timestamps only;
it never records secret values.

## Superseded implementation

Commits `b34e499` and `3b343dc` recorded an app built after the word “Buzz” was
misread as a product request. That app is preserved as historical evidence but is not
Block Buzz and cannot satisfy this contract. This correction is additive; history is
not rewritten.
