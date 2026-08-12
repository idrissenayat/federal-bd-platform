# Block Buzz and Agent Readiness Evidence — 2026-08-12

## Decision

**Official Block Buzz local B1 communication proof: PASS.**

**Shared/production deployment: NOT AUTHORIZED / NOT YET PROVEN.**

The earlier claim that a custom owner-only Sites application was “Buzz B1” is
superseded. That application is not Block Buzz. Commits `b34e499` and `3b343dc` remain
in history to show the initial misunderstanding and why this correction was necessary.

## Observed official environment

| Component | Observation | Result |
|---|---|---|
| Upstream | `https://github.com/block/buzz`, local HEAD `c3b0ccf3` | Official source identified and isolated |
| Toolchain | Hermit-pinned Rust 1.95, Node 24.15, pnpm 11.4, just 1.46 | PASS |
| Infrastructure | Postgres, Redis, MinIO, Keycloak healthy; local Postgres remapped to `127.0.0.1:15432` to avoid an existing project | PASS |
| Relay | `ws://localhost:3000`; `/health` returns 200; membership required; stable relay key held in macOS Keychain | PASS, local development only |
| Desktop | Official `/Applications/Buzz.app` version 0.5.10 was already running with user-owned agents | Observed only; left untouched |
| Adapters | `codex-acp` 1.2.0 and `claude-agent-acp` 0.66.0 both initialized and enumerated models using existing logins | PASS |

The root development relay still has REST token auth disabled, as Block's local setup
expects. That is acceptable for the loopback pilot and is not acceptable production
evidence.

## Identities

Private keys were generated without display and stored only in macOS Keychain service
`org.steer.block-buzz.dev`. Public identities are:

| Identity | Relay role | Public key |
|---|---|---|
| Human decision owner | owner | `16e9720b67509b1dfce7372312f551097704f1a2ec4950ae826a6b729414bf91` |
| Builder | member / channel bot | `1bcd9d68ce9a04cd17bf7e96d71e237654d38eeb26dd8ea5a08ba1259a6baf12` |
| Fresh-context Critic | member / channel bot | `873eacdb79becf6b5e18f4aec79decad3c80bcce3d3c6c690e6dd773256f12c1` |
| Test Agent | member / channel bot | `692f22559c40755774615c070956134867995f07f54c1f2507b905d3b9bb0a52` |

Signed profile events were accepted for all four identities. No private key appears in
this file, tool output, repository history, or Buzz messages.

## Spaces and signed-event proof

| Space | ID | Creation event |
|---|---|---|
| `steer-huddle` (private stream) | `837f7ed9-d8a2-4d7b-8a91-3e4eec91314f` | `515e1f7ad6333df3c9c82ae3e59e4bd7b6816aee98e1604fe094565c9a03741d` |
| `signals` (open forum) | `d0eb53ad-3f3c-453b-b2dd-0915bfa95e61` | `e9d02ecfc006b555f2946bc0517c3618f2463d564eca04f1280da1f45da0654f` |
| `agent-escalations` (private stream) | `d08c85cd-7d02-46bf-8d9b-dd08426eb31f` | `317bbb599787b48480e1f6df75d48c01f2d8e4b4839a74a394519be76c6e41a7` |

The huddle contains separate signed onboarding events from the owner, Builder, Critic,
and Test Agent. The `signals` proof event is
`e400c9394f8af71c64d7b0b503aaa5100b34ba1a840b6e8468b8aa416acd64d9`.
The Test Agent's default-closed escalation event is
`202f4ebf5c8ce1648a88fa575c077a968608c5ad6b22e9d1d985734198876b50`.

## Access, revocation, and retention

- An unregistered key received exit code 3 and `403 relay_membership_required`.
- Disposable member `7470b8233a9e1facee27695d80c87677bad922d722c5b8f4e1b390b27a5a98e0`
  could read before revocation and received the same 403 immediately after removal.
- After a clean relay restart, the owner and three agents remained enrolled and signed
  history remained queryable.

## Real agent proof

The owner published signed mention event
`79fb9ca00e3c5a2a4aa94181b36bc619f4d46ec609babefbcde0f2a88ae29415`
to the Builder in the private huddle. `buzz-acp` launched a real Codex session through
`codex-acp`, with `respond-to=owner-only`. The Builder replied:

> Received through Block Buzz.

Reply event `e13dc1adc44187c4ab9a044be57238f17c4e139a742d50baf47aea34435d9b33`
is signed by the Builder public key and remained available after relay restart. The
owner then sent signed `!shutdown` event
`9da0f0b526615deb0169d2d9aff29dbf860e481883514d79c3bd506eedc74682`,
and the temporary harness exited cleanly.

## Preserved correction trail

The mistaken custom app is preserved in its own local repository at baseline commit
`b38e143`, tag `buzz-scrum-prototype-baseline-2026-08-12`, and later commit `b2f8e49`.
Its owner-only deployment remains available for historical inspection, but no machine
bypass credential was created and none is needed for Block Buzz. It is not part of the
STEER communication architecture.

## Remaining work

1. Write and approve a production deployment brief: TLS, stable secrets, backup/restore,
   monitoring, upgrades, and explicit production REST auth.
2. Decide whether to connect the already-running desktop session to this relay without
   disrupting its existing managed agents.
3. Configure persistent supervision for only the activated STEER agents.
4. Prove GitHub write-through/reconciliation before any B2 promotion.

GitHub and `/steer` remain authoritative. This local pass does not authorize Buzz to
hold gates or final bid/no-bid decisions.
