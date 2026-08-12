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
and channel-scoped. Always-on workers remain default-closed until approved provider
service credentials are supplied directly to Railway, each role has an assigned runtime,
and remote ACP proofs pass. Backup restore, external alerting, GitHub B2 reconciliation,
and a custom-domain decision remain open production controls.

## Superseded implementation

Commits `b34e499` and `3b343dc` recorded an app built after the word “Buzz” was
misread as a product request. That app is preserved as historical evidence but is not
Block Buzz and cannot satisfy this contract. This correction is additive; history is
not rewritten.
