# Buzz Operating Contract

Buzz is STEER's target human-agent communication plane. It is currently a pilot, not the
authority for source code, written contracts, experimental treatment, gate approvals, or
release decisions. GitHub and the versioned `/steer` directory remain authoritative until
Buzz passes the promotion proofs in this document.

## System boundaries

| Surface | Purpose | Authority |
|---|---|---|
| Buzz | Huddles, signals, agent status, questions, findings, and escalation routing | Conversational; links to durable outcomes |
| GitHub Issues / Flight Board | Candidate, work, status, treatment, and blocker record | Authoritative work record |
| Pull requests and Actions | Diff, deterministic checks, review, and build evidence | Authoritative implementation record |
| `/steer` | Briefs, exams, guardrails, decisions, metrics, and learning | Authoritative written contract |
| OpenProject | Optional coordination projection for Buzz | Non-authoritative mirror during the pilot |
| XWiki | Discoverable onboarding and explanatory pages | Convenience copy; repository revision governs |

No Buzz bot may mutate a brief, exam, guardrail, treatment, gate state, `main`, release,
or bid/no-bid decision merely because a chat command resembles an instruction.

## Initial spaces

| Space | Use | Durable write-through |
|---|---|---|
| `#huddle` | Human and agent intentions, progress, handoffs, and blockers | Link active issue/PR; blockers become issue state |
| `#signals` | Sourced observations about users, sources, process, or operations | Signal issue or versioned digest when triaged |
| `#escalations` | Default-closed ambiguity, missing authority, and time-sensitive blockers | Escalation issue; reusable ruling enters decision log |
| `#critic-findings` | Fresh-context Critic results and human rulings | Pull-request review or linked review artifact |
| `#release-watch` | Deploy status, telemetry, anomaly, and rollback coordination | Release evidence and incident/defect issue |
| `#learning-review` | Weekly evidence review and process-change proposals | Versioned learning review; at most two normal changes |

Direct messages are never the sole location for scope rulings, gate decisions, security
exceptions, source interpretation, or experiment deviations.

## Required message envelope

An agent-generated operational message must preserve:

- immutable actor identity and active STEER role;
- human owner and credential/session identifier, without exposing the credential;
- timestamp and unique event identifier;
- linked work item and workflow treatment, when applicable;
- referenced artifact path plus exact commit SHA or immutable URL;
- message kind: signal, status, question, finding, recommendation, decision request, or
  automation result;
- provenance showing whether content was human-authored, agent-authored, or automated;
- tamper-evident signature or equivalent append-only audit evidence.

Display names and avatars are presentation only. They do not establish identity.

## Agent communication rules

1. Start every work conversation from an issue, brief, exam, signal, or explicit
   escalation; include the link.
2. State facts, inferences, and recommendations separately. Source facts require a link
   to preserved evidence.
3. When authority is missing, stop the affected action and route a specific question to
   `#escalations`; do not block unrelated safe work.
4. Findings are resolved by an authenticated human ruling or a verifiable change, not by
   silence, emoji, or an agent marking its own message complete.
5. Never send credentials, SAM.gov keys, sensitive contractor data, CUI/FCI, proprietary
   proposal material, or classified/export-controlled data through Buzz.
6. A human gate decision must write through to the authoritative GitHub revision record.

## Service levels and fallback

- In-flight escalation: acknowledged the same working day.
- Security concern: immediate acknowledgement through the private security route; Buzz
  carries only a non-sensitive pointer.
- Normal build/review question: one working day.
- Signal triage: two working days.

If Buzz is unavailable or its identity/audit controls are uncertain, use GitHub
Discussions and escalation issues. Reconcile links when Buzz returns; never recreate a
gate approval from memory.

## Readiness and promotion

| Level | Meaning | Required evidence |
|---|---|---|
| B0 — Inventoried | Services and accounts are discoverable | Health and roster audit |
| B1 — Operational communication | Authenticated human/agent messages, spaces, routing, retention, and revocation work | One end-to-end huddle/signal/escalation proof plus negative-permission tests |
| B2 — Trusted projection | GitHub links and state projections are idempotent and reconciled; events are tamper-evident | Replay, duplicate, outage, and mismatch tests |
| B3 — Approval candidate | Qualified review shows the signed log can bind a human ruling to an exact revision | Separate approval brief/exam and explicit Gate 3 decision |

Buzz becomes the default huddle at B1. It may project the flight board at B2. It cannot
co-sign or hold gates before B3. Promotion changes the technology register and decision
log; it is never inferred from regular use.

The older `Agentic End2End SDLC` OpenProject/XWiki pilot and the current Buzz UI prototype
are preserved as historical baselines. STEER onboarding uses a separate workspace and
does not relabel the Scrum pilot in place.
