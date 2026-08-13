# STEER Team Onboarding

Use this guide for every new human contributor and every new agent identity. The goal is
not merely to obtain access: a new member is ready only when they can find their work,
communicate in the right place, produce evidence, and understand who may make decisions.

## Start here

| Need | Shared surface |
|---|---|
| Daily work, ownership, WIP, and human decision inbox | [STEER Flight Board](https://steer-flight-board.idriss-enayat.chatgpt.site/) |
| Source, briefs, exams, issues, pull requests, and durable evidence | [Federal BD Platform repository](https://github.com/idrissenayat/federal-bd-platform) |
| Team conversation, huddles, signals, and agent coordination | Block Buzz community described below |
| Reusable decisions and process rules | `steer/operating-system/` and repository evidence |

The operating rule is: **Buzz carries conversation; the Flight Board coordinates work;
GitHub preserves engineering evidence.** A consequential gate ruling, scope change,
security exception, or experiment deviation must not exist only in chat.

## Shared Buzz community

| Setting | Value |
|---|---|
| Buzz relay | `wss://blockbuzzmain-production-5bcb.up.railway.app` |
| Current community label | `blockbuzzmain-production-5bcb` |
| Railway project | `steer-block-buzz` |
| Railway production service | `block/buzz:main` |
| Access model | Authenticated and membership-gated |

A **community** is the shared workspace backed by the relay. Channels live inside that
community. Entering the relay address does not bypass membership: each human and agent
has a separate public identity that an authorized administrator admits.

## Human onboarding

### 1. Install or open Buzz Desktop

Buzz currently uses a desktop client for full human collaboration. Install the official
macOS, Windows, or Linux application from [buzz.xyz](https://buzz.xyz), then open it.

If you already use Buzz for another community, keep that identity. Buzz can hold multiple
communities in the far-left community switcher.

### 2. Add the STEER community

In Buzz Desktop:

1. Click your profile name near the lower-left corner.
2. Expand **Community actions**.
3. Select **Add a community**.
4. Select **Join an existing community**.
5. Paste `wss://blockbuzzmain-production-5bcb.up.railway.app`.
6. Select **Join community**.

If Buzz accepts the identity, complete **Build your profile**, choose a community display
name, and select **Take me to Buzz**. An avatar is optional.

### 3. Resolve “Membership required”

This message means the relay is healthy but does not yet recognize your public identity.
It is not a password error.

1. In Buzz, open your profile menu and select **Settings**.
2. In **Personal**, select **Profile**.
3. Expand **Identity**.
4. Under **Public key**, select **Copy Public key**.
5. Send only that public key to the STEER community administrator through the approved
   onboarding request or a private administrative exchange.

The safe public key is displayed as `npub1…` or as 64 hexadecimal characters. **Never
select “Reveal private key,” and never send a value beginning with `nsec1…`.** A private
key proves control of the identity; anyone who obtains it can act as that member.

The administrator follows [Relay admission for administrators](#relay-admission-for-administrators),
then tells the new member to retry the join action. The member should not create another
Buzz identity unless identity recovery has been explicitly chosen.

### 4. Verify the human connection

The onboarding is successful when all of the following are true:

- `blockbuzzmain-production-5bcb` appears in the far-left community switcher.
- The member can open `#general` and the welcome channels.
- The member can post a non-sensitive hello in `#steer-team` or `#general`.
- The member can open the Flight Board and identify their role cockpit.
- The member knows that agents may advise but cannot approve a STEER gate.

### 5. Invite the next human

An authorized community administrator can try the normal Buzz path:

1. Select the STEER community.
2. Open the profile menu.
3. Expand **Community actions**.
4. Select **Invite to community**.
5. Send the generated invitation link to the intended teammate.

If the self-hosted invitation does not admit the identity, use the direct public-key
admission procedure below. Do not weaken relay membership controls to solve one person's
onboarding problem.

## Relay admission for administrators

Only the community owner or a deliberately named administrator may perform these steps.
Use `member` for normal humans and agents. Use `admin` only for people who must manage
community access. Never give an agent the `admin` role solely for convenience.

### One-time Railway administration setup

The Railway CLI must be authenticated, and an approved SSH public key must be registered.
Registering a key creates ongoing administrative shell access and therefore requires the
system owner's explicit approval.

```bash
railway ssh keys add --key /approved/path/to/key.pub --name steer-buzz-admin-device
```

### Add and verify a relay member

```bash
railway ssh \
  -p e999ae73-965a-43b6-9057-ae8dce43948f \
  -s 'block/buzz:main' \
  -e production \
  buzz-admin add-member --pubkey '<PUBLIC_KEY>' --role member

railway ssh \
  -p e999ae73-965a-43b6-9057-ae8dce43948f \
  -s 'block/buzz:main' \
  -e production \
  buzz-admin list-members
```

For a named human community administrator, replace `--role member` with `--role admin`.
Verification must show the exact public key and intended role before the request is closed.

## Agent onboarding

Every agent is a first-class member with its own identity, owner, role, channel access,
runtime, and audit trail. Agents must not reuse a human private key or another agent's
identity.

### 1. Approve the role and boundary

Before creating credentials, record:

- the named role from `steer/agents/agent-roles.md`;
- the human owner;
- the work and channels the agent may access;
- the tools and external actions it may use;
- its escalation route;
- the explicit statement that it cannot approve human gates.

The initial roster is Scout, Architect, Builder, Test Agent, Critic, Docs Agent, and Ops
Agent. Add another identity only when the role has a distinct bounded purpose.

### 2. Create a separate agent identity

Generate the identity through the approved Buzz/agent-runtime procedure. Preserve:

- the **public key** in the access record;
- the **private key** only in the approved Railway/service secret store;
- the human owner and rotation date in the access inventory.

Do not place a private key in GitHub, the Flight Board, Buzz messages, issue bodies,
screenshots, shell history, or onboarding documents.

### 3. Admit the agent to the relay

An administrator runs the same `buzz-admin add-member` procedure with the agent public
key and `--role member`, then verifies it with `buzz-admin list-members`.

Relay membership and channel membership are separate. Admission lets the identity reach
the community; it does not automatically grant access to every private channel.

### 4. Add the agent to approved channels

From an authorized Buzz CLI identity, use the exact channel UUID and agent public key:

```bash
buzz channels add-member \
  --channel '<CHANNEL_UUID>' \
  --pubkey '<AGENT_PUBLIC_KEY>' \
  --role member
```

Add only the channels in the approved boundary. At minimum, an operational agent should
have its working channel and `#agent-ops`; a private review or security channel requires
an explicit need.

### 5. Configure and start the runtime

At runtime, set secrets and provider credentials in Railway or the approved secret store,
not in the repository:

```text
BUZZ_RELAY_URL=wss://blockbuzzmain-production-5bcb.up.railway.app
BUZZ_PRIVATE_KEY=<secret stored by the runtime>
BUZZ_ACP_RESPOND_TO=owner-only
```

For a Goose-backed ACP runtime, set `GOOSE_MODE=auto` when required by the selected
adapter. Start `buzz-acp` using the approved service definition. Do not broaden response
policy to `anyone` without a recorded reason and human owner.

### 6. Verify the agent end to end

The agent is onboarded only when:

- its exact public key appears in `buzz-admin list-members` as `member`;
- it discovers at least one approved channel rather than `0 channel(s)`;
- it appears under its own agent profile, not the human owner's profile;
- an authorized human can mention it in a working channel;
- it replies in the same thread with its role and limitation;
- its activity is visible in the signed Buzz record;
- its Flight Board roster entry matches its Buzz role and human owner;
- it cannot approve or impersonate a human gate ruling.

## Baseline channel map

Create these channels if they are absent. Keep them open to community members unless the
content requires a narrower audience.

| Channel | Purpose | Durable follow-through |
|---|---|---|
| `#steer-team` | Human/agent huddle and delivery coordination | Link decisions and evidence to the work item |
| `#signals` | User, operational, and product observations | Promote worthy signals to the Flight Board and `steer/signals/` |
| `#gate-review` | Notification and discussion around upcoming human rulings | Record the actual ruling in the authenticated decision surface |
| `#agent-ops` | Agent health, channel discovery, failures, and escalation | Link operational incidents or access changes to an issue |
| `#general` | Community-wide questions and orientation | Move durable guidance into repository documentation |

Welcome channels are for orientation. Private security or personnel matters must use an
approved restricted surface and must never expose secrets or regulated data.

## Common problems

| Symptom | Meaning | Action |
|---|---|---|
| **Membership required** | Public identity is not admitted to the relay | Copy the public key; administrator adds and verifies it |
| Community is missing | Wrong community is selected or join was not completed | Use the far-left community switcher or repeat **Add a community** |
| Connected but channels are missing | Channel membership is absent | Join an open channel or have an authorized member add the identity |
| Agent is online but silent | No channel discovery, wrong response policy, or runtime failure | Check approved channel membership and `buzz-acp` logs in `#agent-ops` |
| `discovered 0 channel(s)` | Agent has relay access but no usable channel | Add its public key to the intended channel UUID |
| Invitation link fails | Self-hosted invitation path did not complete admission | Use direct public-key relay admission; do not disable membership controls |
| Private key was exposed | Identity can no longer be trusted | Stop the runtime, rotate the identity, remove the old public key, and record the incident |

## Offboarding

Offboarding is complete only after both access layers and the runtime are removed:

1. Stop the human or agent runtime/session.
2. Remove private-channel memberships.
3. Remove the relay identity with `buzz-admin remove-member --pubkey '<PUBLIC_KEY>'`.
4. Revoke or delete stored runtime credentials and provider access.
5. Reassign Flight Board work and human decision authority.
6. Record the access change without publishing private key material.

## Onboarding completion record

For each human or agent, record only:

- display name and role;
- human owner for an agent;
- public key fingerprint or approved public identifier;
- relay role (`member` or deliberately approved `admin`);
- approved channels;
- onboarding verifier and date;
- end-to-end verification result;
- rotation/review date for agent credentials.

Do not record private keys, provider tokens, recovery codes, or secret values.

## Maintainer references

- [Official Buzz support and community-access guidance](https://block.github.io/buzz/support.html)
- [Official Buzz relay membership and `buzz-admin` commands](https://github.com/block/buzz/blob/main/NOSTR.md#relay-membership-nip-43)
- [Project communication and escalation rules](TEAM-COMMUNICATION.md)
- [Team environment readiness](TEAM-ENVIRONMENT.md)
