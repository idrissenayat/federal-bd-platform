# Block Buzz integration boundary

This directory versions STEER's non-secret configuration contract for
[Block Buzz](https://github.com/block/buzz). Buzz is the human/agent communication
plane; it is not a replacement for GitHub, `/steer`, the flight board, or human gate
authority.

## Implemented pilot topology

```text
human owner + uniquely keyed agents
                 |
                 v
       self-hosted Block Buzz relay
        (Nostr signed event log)
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
- Every human and agent has a distinct Nostr keypair. Local pilot secrets are held in
  macOS Keychain and are never committed or copied into evidence.
- Relay membership is enforced. The owner is configured through
  `RELAY_OWNER_PUBKEY`; agents are explicit members and private-channel bots.
- Codex and Claude connect through the official ACP adapters. Inbound agent work is
  owner-only by default.
- GitHub and `/steer` remain authoritative for work, code, experiments, gates,
  evidence, and decisions. Buzz messages link to those records.

`agent-roster.yaml` is desired state only. Public keys and signed event IDs from the
local proof live in `steer/evidence/buzz-agent-readiness-2026-08-12.md`.

## Promotion boundary

The local B1 communication slice is proven, including enrollment, denial, revocation,
restart retention, and a live Codex reply. It does not authorize a production or hosted
deployment. Production promotion still requires a deployment brief, durable secret
store, TLS, backups/restore, monitoring, and production auth checks.

## Superseded implementation

Commits `b34e499` and `3b343dc` recorded an app built after the word “Buzz” was
misread as a product request. That app is preserved as historical evidence but is not
Block Buzz and cannot satisfy this contract. This correction is additive; history is
not rewritten.
