# Team Communication and Escalation

The rule is simple: **the Flight Board authorizes work, Block Buzz coordinates it, and
GitHub proves it.** Conversation may happen anywhere, but evidence and consequential
decisions must land in an auditable shared surface.

## Work authorization contract

No human or agent starts work from a Buzz request alone. A valid agent handoff requires
all of the following in STEER Work Management:

1. a durable `STR-NNN` work item linked to its engineering record;
2. a frozen workflow assignment;
3. one explicitly assigned agent;
4. an active execution state and executable next action;
5. the controlling brief, exam, or approved setup evidence; and
6. no pending human gate or returned-change hold.

The authorized human uses the work item's **Authorize & copy Buzz handoff** control and
posts the generated message in the applicable project thread. A Buzz mention is a
notification, not permission to start. If any requirement is missing, the agent may
discuss or clarify the request but must not execute it, reprioritize it, change its
scope, assign another agent, or approve a gate.

| Communication | Destination | Response expectation | Durable outcome |
|---|---|---|---|
| Daily asynchronous huddle | One parent thread in Block Buzz `steer-team` | By the team's working-day midpoint | Each active human/agent posts status, blocker/input, evidence link, next handoff, and boundary; decisions move to the durable record |
| Authorized agent handoff | Work-item thread in the applicable project channel, or `steer-team` until that channel exists, using the Flight Board-generated message | Agent acknowledges in the same working thread | Assignment, scope, state, and authorization remain in the Flight Board; implementation evidence remains in GitHub |
| Signal or observation | Block Buzz `signals`; signal issue form is the durable fallback | Triage within two working days | Digest in `steer/signals/`; candidate if evidence warrants |
| Agent ambiguity/escalation | Block Buzz `agent-escalations` plus linked escalation issue | Same working day for in-flight work | Ruling in issue and decision log when reusable |
| Upcoming human gate | Flight Board Human Decisions inbox; `steer-team` may carry the review alert | Same working day when work is ready | Authenticated ruling bound to the exact evidence; Buzz never holds the ruling |
| Build/review question | Pull-request thread | One working day; urgent blocker same day | Resolved thread or linked decision |
| Critic finding | Buzz `#critic-findings` plus pull-request review | Same day for a blocker; otherwise one working day | Human ruling or verified change on the pull request |
| Security concern | Private Security Advisory | Immediate acknowledgement | Remediation issue without sensitive details |
| Release observation | Buzz `#release-watch` plus release/incident evidence | During the release watch window | Verified outcome, rollback, or defect record |
| Weekly Learning Review | Buzz `#learning-review` plus versioned file in `steer/reviews/` | Protected weekly slot | At most two normal process changes, plus escape conversions |

Do not use direct messages as the only record of a scope ruling, gate decision, security
exception, source interpretation, or experiment deviation. Do not paste secrets or
sensitive data into any communication surface.

Block Buzz is the live communication system for humans and agents. The tested human and
agent access procedures are in `TEAM-ONBOARDING.md`. GitHub Issues, pull requests,
Discussions, briefs, exams, and decision records remain the durable evidence surfaces;
link consequential Buzz conclusions back to the relevant record. If Buzz or its
identity/audit controls are unavailable, GitHub Discussions and escalation issues are
the operational fallback.

Buzz visibility is not proof that a named agent produced a deliverable. During a
Codex-hosted bootstrap run, messages must identify the named agent and link its exact run
record; any Codex-authored intervention must carry its emergency label. The
[Codex supervision boundary](../docs/steer/OPERATING-MODEL.md#normative-codex-supervision-boundary)
governs attribution, takeover, failure escalation, and performance evidence.

For visible agent handoffs, the sending agent replies in the applicable thread and
mentions the receiving agent; the receiving agent acknowledges there. Do not use broad
mentions for every event. Mention the full STEER fleet only for fleet readiness checks,
shared blockers, or an explicitly scheduled cross-project huddle.

If an agent receives an unauthorized Buzz request, it responds: “I can discuss or
clarify this request, but I cannot begin execution until it has an authorized STEER Work
Management item assigned to me.” The requester then creates or corrects the Flight Board
item instead of negotiating authorization in chat.
