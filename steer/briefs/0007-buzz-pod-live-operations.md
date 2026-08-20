# Intent Brief — 0007 Buzz POD live operations and blocker escalation

**Status:** draft

**Tags:** #security #privacy #a11y #legal #reliability #design-system

**Date opened:** 2026-08-14

**Engineering record:** [GitHub issue #50](https://github.com/idrissenayat/federal-bd-platform/issues/50)

## Expected outcome and measurement

- **Primary outcome:** every authorized POD member can understand who is working on what, current progress, blockers, unblock ownership, and the next expected handoff from a low-noise Buzz POD operations feed without treating Buzz as a second work-management system.
- **Baseline / denominator:** STEER currently records authoritative work state and creates some Buzz notifications, but the shared POD channel does not provide a complete, reliable operational narrative; the denominator is every material STEER event for active POD work after release.
- **Observation window:** the first 20 active work items or 30 days of dogfood use, whichever is later.
- **Minimum meaningful signal:** at least 95% of eligible material events appear in the correct Buzz channel within 60 seconds, 100% of blockers identify an owner and requested action, fewer than 1% of visible events are duplicates, and a POD member can identify active work, blockers, and next expected events in under one minute.
- **Guardrail measure:** zero chat-only assignments or gate rulings; zero secret or restricted evidence content copied into Buzz; zero individual productivity rankings based on messages, response speed, hours, tokens, event volume, or work-item counts.

## Who this is for

A human or agent member of a STEER POD who needs shared operational awareness across several concurrent projects without opening every work item or interpreting silence. It is especially important for Product, Technology, Platform, Security, and specialist roles that must spot a blocker or human decision request quickly.

## Problem and why now

The Flight Board is the authoritative place to assign, authorize, gate, and audit work. Its role cockpit and team-flow pulse summarize the current state, but team members also need a chronological shared narrative while work is moving. Today the Buzz POD channel does not consistently show which authorized agent or human started an item, what materially changed, who is blocked, who must unblock it, or what should happen next.

This gap creates two dangerous responses: members may assume silence means no work is happening, or they may start assigning work directly in Buzz. The first hides delivery risk; the second bypasses STEER authority and creates conflicting instructions. The platform needs a governed projection of authoritative STEER events into Buzz—not a second backlog and not a surveillance stream.

The capability belongs to the STEER platform. Federal BD is one project that may contribute project-scoped events, but neither the POD channel nor the event model may be named, routed, or authorized as if that project were the whole team.

## What "done and correct" means

### 1. The system preserves one authority model

The operating rule is visible wherever the integration is configured:

> STEER authorizes and records the work. Buzz communicates its movement. GitHub proves the result.

- Only authenticated STEER actions can assign or unassign work, change workflow/priority/state, authorize execution, queue or record a gate, or close an item.
- Buzz supports acknowledgement, questions, coordination, and escalation. Ordinary chat never mutates authoritative state.
- A future authenticated Buzz command may request a STEER action only through the same authorization, validation, confirmation, and audit path as the Work Management UI; it is out of scope for the first release.
- An agent may emit operational status only for a work item to which that exact enrolled agent identity is actively assigned and authorized.
- Human and agent identities, roles, and message provenance remain visibly distinguishable.

### 2. A versioned event contract drives the feed

Every feed event contains:

- an immutable event ID, schema version, occurrence time, and source sequence;
- organization, POD, and optional project identifiers;
- STEER work-item ID/key, title, and resolvable link;
- event type, actor identity type, actor ID, and role;
- current action or material change in plain language;
- next expected event, responsible owner, and target time or explicit `unknown`;
- authoritative state/gate references needed to interpret the event;
- blocker data when applicable; and
- delivery attempt, destination, and trace identifiers that do not expose secrets.

Supported event types are:

`AUTHORIZED`, `STARTED`, `PROGRESS`, `BLOCKED`, `HELP_NEEDED`, `ESCALATED`, `WAITING_FOR_HUMAN`, `WAITING_FOR_AGENT`, `HANDOFF`, `GATE_READY`, `GATE_RULED`, `COMPLETED`, `STOPPED`, and `INCIDENT`.

Events are append-only facts. Corrections reference the superseded event and explain the correction; history is not silently rewritten. Display copy may evolve independently from the canonical payload.

### 3. Blockers are actionable, not merely visible

A `BLOCKED`, `HELP_NEEDED`, or `ESCALATED` event records:

- severity: `critical`, `high`, or `normal`;
- blocked-since time and current age;
- affected item, phase, and expected impact;
- blocker category and concise evidence-safe description;
- unblock owner and requested action;
- acknowledgement deadline and escalation deadline;
- safe escalation destination; and
- resolution or accepted-risk event when cleared.

Default policy:

- **Critical:** suspected security/privacy breach, unauthorized action, destructive failure, or production-impacting incident; stop affected execution and notify the POD plus named authority immediately.
- **High:** the item or its required gate cannot progress; notify immediately, request acknowledgement within 15 minutes during the configured operating window, and escalate after one hour unless the POD config states a stricter rule.
- **Normal:** progress is constrained but safe work remains; include it in the next material update and escalate by the end of the current operating window if unowned.

POD administrators may configure operating windows and stricter deadlines, but cannot disable critical escalation or remove the required owner/action fields. A missed deadline emits one escalation transition rather than repeated spam.

### 4. Progress is meaningful and low-noise

- Authoritative state, assignment, gate, handoff, completion, stop, and blocker changes emit immediately.
- A `PROGRESS` event requires a material milestone, changed forecast, new dependency, changed next event, or new risk. “Still working” is not a channel event.
- Long-running authorized agent work updates its machine-readable heartbeat at a configurable interval, default 30 minutes. An unchanged heartbeat refreshes staleness internally but does not post another channel message.
- Human progress is captured by a brief STEER progress note or authoritative transition and then mirrored; humans are not required to announce presence in chat.
- Work becomes `stale attention needed` after two missed expected heartbeats or after its declared next-event time passes. Stale is an attention signal, not proof of inactivity or a performance judgment.
- Duplicate, unchanged, superseded, and out-of-order events do not produce repeated visible messages.

### 5. Channel routing separates POD operations from project detail

- Each POD has one configured operational channel ID. Channel names are display labels, never security boundaries.
- POD-wide authorization, blocker, gate, handoff, incident, and portfolio events go to the POD channel.
- Project-specific detail may be mirrored to the configured project channel while the POD feed retains a concise cross-project event or pulse entry.
- Specialist discussion occurs in a thread or configured specialist channel and always links back to the STEER item.
- Organization, POD, project, and temporary-specialist membership is checked server-side at delivery time and again when resolving links.
- Removing or expiring membership stops future delivery immediately. Retained messages follow the approved Buzz/STEER retention and deletion policy.
- The first dogfood configuration may contain one explicit STEER Flight Team POD, but the schema and routing require organization/POD/project IDs and do not hard-code the Federal BD project.

### 6. The POD pulse answers the operational questions first

Buzz exposes one pinned or equivalent replaceable POD pulse containing:

- active work grouped by project with current owner and last material event;
- blockers ordered by severity and age with unblock owner/action;
- work waiting on humans and agents;
- next expected handoffs and target times;
- recently completed or stopped work;
- stale active work requiring attention; and
- integration health: current, delayed, reconnecting, or degraded.

The pulse is a projection rebuilt from authoritative STEER state and events. It never becomes a second state store. A member can open the exact work item from every entry. Empty, loading, stale, delayed, reconnecting, permission-denied, partial-data, and delivery-failure states use plain language and do not imply that silence equals success.

### 7. Delivery is durable, idempotent, and observable

- A committed STEER mutation and its outbound event are recorded atomically through a transactional outbox or equivalent durable pattern.
- Delivery uses idempotency keys, ordered handling per work item, bounded retries with backoff, delivery receipts, replay, and an observable dead-letter state.
- Buzz unavailability never rolls back, loses, or corrupts STEER state.
- Reconnection replays missing canonical events without flooding the channel; the pulse can be rebuilt independently.
- Delivery states `pending`, `delivered`, `retrying`, `failed`, `dead-letter`, and `superseded` are visible to authorized operators in STEER.
- Provider credentials, tokens, request bodies containing protected evidence, and private channel membership are never written to feed payloads or user-visible error messages.
- Operator recovery actions are authenticated and audited. Replaying or dropping a dead-letter event requires a reason.

### 8. Success and failure are measurable without surveillance

The platform measures event eligibility, end-to-end delivery latency, duplicate suppression, routing correctness, retry/dead-letter rate, blocker acknowledgement/resolution time, stale-item count, and user-reported clarity. Metrics are aggregated at event type, POD, and integration level.

The platform does not rank or score individuals by message count, online presence, response time, heartbeat frequency, event volume, active minutes, token use, estimate accuracy, or closed-item count. Access to person-level event history is limited to legitimate work audit and incident purposes with purpose, retention, and access logging.

## Design intent

The Buzz POD feed should feel like a calm operations log, not a noisy group chat or employee-monitoring dashboard. Each message begins with the work-item key and a stable event label, then answers: **What changed? Who owns the next move? Is anything blocked? When should we expect the next event?** Details and evidence remain behind links.

Use compact event cards or consistently formatted messages with text labels in addition to color/icons. Critical blockers are visually distinct but not repeated. Progress events group into threads by work item where Buzz supports it. The pinned POD pulse prioritizes blockers and human decisions above routine progress.

Keyboard and screen-reader users receive the same event order, severity, ownership, and links. Timestamps include timezone context and relative age. Small screens stack fields without clipping owner, blocker, or next-event content. Empty, loading, stale, delayed, reconnecting, permission-denied, partial-data, delivery-failure, and recovery states are explicitly designed before implementation.

## Out of scope

- Assigning work, changing priority/state/workflow, recording gates, or closing items through ordinary Buzz messages.
- Replacing the STEER Work Management role cockpit, backlog, Human Decisions inbox, or audit trail.
- Copying GitHub diffs, source evidence, secrets, credentials, protected attachments, or sensitive decision content into Buzz.
- A general-purpose chat bot, unrestricted natural-language commands, or autonomous agent delegation.
- Presence tracking, keystroke/activity monitoring, employee scoring, utilization targets, or individual productivity analytics.
- Treating message volume, response speed, heartbeat count, tokens, hours, story points, or closed items as business value.
- Building the multi-POD identity and installation foundation already governed by Intent Brief 0004; this feed consumes that contract and may dogfood an explicit single-POD configuration while 0004 matures.
- Sending public, customer, government, or mass-marketing communications.

## Risks and default-closed touchpoints

This capability sends automated communications, uses authenticated identities and private membership, exposes work metadata, and may add durable event and delivery records. It is default-closed.

Threats include agent impersonation, forged or replayed events, IDOR through work-item links, cross-POD/project leakage, over-broad provider scopes, secret leakage in payloads or errors, prompt/tool injection through user text, notification flooding, out-of-order or duplicate events, stale pulse data presented as current, unauthorized recovery/replay, audit tampering, surveillance misuse, and a Buzz outage being mistaken for stopped work.

The architecture must use server-side authorization, distinct human/agent/service identities, signed or authenticated provider delivery, least-privilege credentials, schema validation and output escaping, event idempotency and ordering, safe link resolution, purpose-limited data, explicit retention/deletion, immutable audit, rate limits, bounded retries, dead-letter visibility, and a documented provider-disable/rollback path. User-authored text is untrusted and must be summarized or escaped without executing commands or exposing hidden content.

Named controls and authorities:

- the Product Lead rules Gate 1 and owns the operating model and anti-surveillance boundary;
- the Tech Lead rules Gate 2 and owns the event, authorization, delivery, and recovery Exam;
- the Security Owner reviews identity, membership, provider scopes, replay/forgery, link authorization, secret handling, and incident escalation;
- the Privacy/Legal authority reviews event data purpose, channel visibility, retention/deletion, audit access, monitoring disclosures, and employment/privacy implications;
- the Product Designer reviews low-noise hierarchy, responsive behavior, accessibility, and non-color severity communication;
- the Platform / Ops Lead reviews provider configuration, outbox delivery, retries, ordering, dead letters, telemetry, outage behavior, and rollback; and
- Gate 3 requires the Product Lead, Tech Lead, an independent reader, and every tagged authority. Team mode requires named signatures; solo mode waits at least 24 hours after the verified build. Missing authority, stale evidence, an unresolved blocker, or incomplete cooling-off keeps release blocked.

## Dependencies and sequencing

- Intent Brief 0004 supplies the durable organization/POD/project membership and adapter contracts. This item must not invent a conflicting tenancy or plugin model.
- Current Block Buzz provider credentials and membership must be healthy before end-to-end delivery tests, but credentials are not required to approve this intent.
- The existing STEER outbox/notification behavior is input evidence, not proof that delivery is reliable or complete.
- Gate 2 must define deterministic tests for authorization, event schema/versioning, ordering, deduplication, routing, blocker escalation, staleness, outage/reconnect, retry/dead-letter/replay, redaction, accessibility, retention, and anti-surveillance behavior.

## Chosen approach

Use an append-only, versioned STEER event stream plus a transactional outbox and a permission-scoped Buzz adapter. Project the same canonical events into low-noise channel messages and a replaceable POD pulse; retain STEER as the sole authority and source of truth.

Rejected: direct agent posting without an authoritative event, using Buzz chat as the backlog, polling database rows without an outbox, posting unchanged heartbeat messages, and inferring productivity from communication activity. Each creates conflicting authority, lost/duplicated events, noise, or surveillance incentives.

---

GATE 1: PENDING — Product Lead must review this exact revision after a fresh Critic review

GATE 1 EVIDENCE: PENDING — authenticated approval must be tied to this exact revision
