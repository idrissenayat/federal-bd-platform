# Block Buzz and Agent Readiness Evidence — 2026-08-12

## Decision

**Official Block Buzz shared B1 communication proof: PASS for controlled onboarding.**

**Always-on hosted agent workers: BLOCKED pending provider service credentials.**

**Production operations beyond B1: PARTIAL / DEFAULT-CLOSED.**

The earlier claim that a custom owner-only Sites application was “Buzz B1” is
superseded. That application is not Block Buzz. Commits `b34e499` and `3b343dc` remain
in history to show the initial misunderstanding and why this correction was necessary.

## Shared Railway environment

| Component | Observation | Result |
|---|---|---|
| Railway project | Isolated project `steer-block-buzz`; existing `bdp` project untouched | PASS |
| Relay | `wss://blockbuzzmain-production-5bcb.up.railway.app`; HTTPS liveness, readiness, and health all returned 200 | PASS |
| Image | `ghcr.io/block/buzz:sha-788b3c0`, the image pinned by Block's official Railway template | PASS |
| Data services | Managed PostgreSQL, Redis with persistent volume, and Railway S3-compatible bucket | PASS |
| Relay controls | TLS, auth token requirement, closed relay membership, owner bootstrap, migrations, audit service, and object-store conformance probe | PASS |
| PostgreSQL recovery | Railway point-in-time recovery enabled and wired to a backup bucket | PARTIAL; scheduled backups and restore rehearsal unavailable/unproven |
| Hosted agents | No OpenAI or Anthropic service credential is configured | BLOCKED; no local login is treated as a production credential |
| Local workstation | STEER relay and six supporting containers stopped after remote cutover; containers and volumes retained, Buzz Desktop untouched | PASS; shared service no longer depends on the workstation |

An initial empty Railway project was deleted before receiving members or data after a
diagnostic command surfaced its generated credentials. The replacement project generated
an entirely new secret set. No exposed value was reused, committed, or copied into this
evidence.

## Shared spaces and events

| Space | Channel ID | Signed proof event |
|---|---|---|
| `steer-huddle` | `908db895-ff7b-43d1-8b0a-b261503bd523` | Owner `349c8ffe160020f2014fa7becab18f267b1fcf590dc428c492cfa725077addce` |
| `signals` | `3894392d-3876-4932-9f18-89d39358c10c` | `839b48b37e7d6d8ac3437a722dd43a02ef19ebc6c40c26aab388e7c6da02a68c` |
| `agent-escalations` | `49138dfb-7fc2-4436-8583-c2f958cb7fa0` | Test Agent `e16ea45131e1a0ec231caa2da8f18c37e14cbb6cc39bb24a063cda8aac6c479b` |
| `critic-findings` | `07b04d3a-56ea-4533-8192-a7ebffd5a4ed` | Critic `1d740550be08af8969bcc8656f97a9fac5761d3da71d59248ce39320a97c7e8f` |
| `release-watch` | `b037c21f-1e7c-42ad-83e0-ac13479cc450` | Test Agent `0cac456ff940e98ba7453b766abf22c4bb6bb3c627b648245013b4c58bcf1258` |
| `learning-review` | `b35c0804-3d73-4cb1-b2dd-b91bd6e07723` | Owner `0bcc1d0a34b2ce9a2e7293f6f6028f3e91aaac66784890182a147ffb1a970df5` |

Separate signed huddle events were accepted from Builder
`24f4d20e0e5432baf42f567de9aa5a984eaf19c0a8131b185bfacbe12f915e13`,
Critic `6584e98758024ef0396ecb4f07edaa2bf10aecbce51a72379d67b006a8e7dd75`,
and Test Agent `836f72debf208acbc823e6d1fa8b2476ce7c78b576ed26376ff16cd63af4e0c0`.

## Full reference fleet expansion

The project elected to enroll the complete seven-role reference fleet. The four added
identities are relay members and channel bots with unique signing keys:

| Agent | Public key | Profile event | Huddle introduction | Role-specific proof |
|---|---|---|---|---|
| Scout | `f66f2459a92b793fd40bbf7f38553df37c6674bf273d85dbf85787290cc2237a` | `1a9e70e501502aa535cd53809a1a6e3ac8e7f75abacf03c17f7bedda07f4d30c` | `75f1c6e8cae7e3d55775903f069071a776b2795209807638ff9c3bc8e617f8cd` | `signals` event `8e461a1539216328ea24ef4e617ccaf046798b82f7fceae3776aedce1ae031b0` |
| Architect | `9c764661a78b480a324c8da9a5b86cf0224ad992467c324358e88fab4b85b2ea` | `03c2d4357f1c19a5d39b61973cdf25e0ece97cd1535b1ca68a53037eead9c6a0` | `1cd0967c48aacfd90cdfa71f0f0facc56b90ae34dc361fd306ad119896598df0` | escalation event `ce1546c95467ccf4e994fa5b014a3a0e5d9d8c7f11bea24fbcb1e26dc89f37fc` |
| Docs Agent | `2680575df454cefd26835487860724a805502f6285dfe8191251bf7d2bfcbf4d` | `a27735951de2e32cf8b9e827066b6c6c6cea29ceca660de4982231ff9878729e` | `aa2ecc2d9c6f8f990525214f1f2753497d1baf129329c92dd9d87486f8397518` | escalation event `c02021e64b35f9a2703b26e9394b6869920148770d3e67d28d0ee0aded62ff01` |
| Ops Agent | `8ebe6f6dfcedc9c867a1083772a4f40d83da100d663d300ecd99562ebbf05349` | `4b1a5ee7d8747bc72a82a015061402c1d785cc71b22b1ec7a9e29716ea03d44c` | `066724620edc682896a7f6cdd9f37db277a4e9efed3438394abb0a7dceb17461` | `release-watch` event `530ea1404715cf056f7cdb5372aaf6ea7f55914275cd8458f907e3b143a01ecd` |

All four can read and publish in `steer-huddle`, route ambiguity through
`agent-escalations`, and participate in `learning-review`. Scout is an explicit
`signals` bot; Ops Agent is an explicit `release-watch` bot. Architect and Docs Agent
were not added to `release-watch`; Scout and Ops Agent were not added to
`critic-findings`. Unauthorized reads of those private spaces returned an empty result
while the owner observed one Critic event and two release-watch events. This is private
channel non-disclosure, not an HTTP-error assertion.

The temporary SSH key used to run the relay administration command was removed from
Railway and the workstation immediately after membership verification. No Railway SSH
key remains registered.

An unregistered disposable identity received exit code 3 and
`403 relay_membership_required`. Disposable member
`0f17c7a2d1b7a295a60431fbc7be211585044ab05548f65b5963d77a7b5081ad`
could read before revocation and received the same denial after removal. After a Railway
relay restart, the owner and three agents remained enrolled, and all four signed huddle
events remained queryable by Builder.

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
| Scout | member / channel bot | `f66f2459a92b793fd40bbf7f38553df37c6674bf273d85dbf85787290cc2237a` |
| Architect | member / channel bot | `9c764661a78b480a324c8da9a5b86cf0224ad992467c324358e88fab4b85b2ea` |
| Docs Agent | member / channel bot | `2680575df454cefd26835487860724a805502f6285dfe8191251bf7d2bfcbf4d` |
| Ops Agent | member / channel bot | `8ebe6f6dfcedc9c867a1083772a4f40d83da100d663d300ecd99562ebbf05349` |

Signed profile events were accepted for all eight identities. No private key appears in
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

1. Select an approved runtime lane for each activated role, enter the corresponding
   provider service credentials directly into Railway, and deploy persistent workers;
   repeat owner-only ACP proofs for every activated identity.
2. Enroll each human teammate using their own key and GitHub identity; do not mint or
   retain human private keys on their behalf.
3. Rehearse PostgreSQL restore and define backup coverage for the Railway object bucket;
   scheduled backup commands are not authorized by the current account capability.
4. Configure external availability/error alerting and an explicit Railway cost limit.
5. Decide whether to use a custom domain and document the desktop-client connection path.
6. Prove GitHub write-through/reconciliation before any B2 promotion.

GitHub and `/steer` remain authoritative. This shared B1 pass does not authorize Buzz
to hold gates or final bid/no-bid decisions.
