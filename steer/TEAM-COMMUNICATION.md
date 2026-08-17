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
5. the controlling stage artifact and exact revision: `PRE_GATE_1_BRIEF` uses the
   exact Brief plus its evidence/controls and has no Exam prerequisite because the
   Exam is downstream of human Gate 1; later Exam/build stages require their matching
   exact artifacts; and
6. no returned-change hold for that stage. A pending human Gate 1 is expected for a
   non-owning `PRE_GATE_1_BRIEF` review, but blocks implementation, gate approval, and
   downstream execution.

The authorized human uses the work item's **Authorize & copy Buzz handoff** control and
posts the generated message in the applicable project thread. A Buzz mention is a
notification, not permission to start. If any requirement is missing, the agent may
discuss or clarify the request but must not execute it, reprioritize it, change its
scope, assign another agent, or approve a gate.

| Communication | Destination | Response expectation | Durable outcome |
|---|---|---|---|
| Daily asynchronous huddle | One parent thread in Block Buzz `#steer-team` | By the team's working-day midpoint | Each active human/agent posts status, blocker/input, evidence link, next handoff, and boundary; decisions move to the durable record |
| Authorized agent handoff | Work-item thread in `#project-<short-name>` using the Flight Board-generated message | Agent acknowledges in the same working thread | Assignment, scope, state, and authorization remain in the Flight Board; implementation evidence remains in GitHub |
| Signal or observation | Block Buzz `#signals` or signal issue form | Triage within two working days | Digest in `steer/signals/`; candidate if evidence warrants |
| Agent ambiguity/escalation | Block Buzz `#agent-ops` plus linked escalation issue | Same working day for in-flight work | Ruling in issue and decision log when reusable |
| Upcoming human gate | Block Buzz `#gate-review` plus Flight Board decision inbox | Same working day when work is ready | Authenticated ruling bound to the exact evidence |
| Build/review question | Pull-request thread | One working day; urgent blocker same day | Resolved thread or linked decision |
| Security concern | Private Security Advisory | Immediate acknowledgement | Remediation issue without sensitive details |
| Weekly Learning Review | Versioned file in `steer/reviews/` | Protected weekly slot | At most two normal process changes, plus escape conversions |

Do not use direct messages as the only record of a scope ruling, gate decision, security
exception, source interpretation, or experiment deviation. Do not paste secrets or
sensitive data into any communication surface.

Block Buzz is the live communication system for humans and agents. The tested human and
agent access procedures are in `TEAM-ONBOARDING.md`. GitHub Issues, pull requests,
Discussions, briefs, exams, and decision records remain the durable evidence surfaces;
link consequential Buzz conclusions back to the relevant record.

For visible agent handoffs, the sending agent replies in the applicable thread and
mentions the receiving agent; the receiving agent acknowledges there. Do not use broad
mentions for every event. Mention the full STEER fleet only for fleet readiness checks,
shared blockers, or an explicitly scheduled cross-project huddle.

If an agent receives an unauthorized Buzz request, it responds: “I can discuss or
clarify this request, but I cannot begin execution until it has an authorized STEER Work
Management item assigned to me.” The requester then creates or corrects the Flight Board
item instead of negotiating authorization in chat.

## Stage-scoped review handoffs

The Flight Board maintains one primary execution claim/run for a work item. A reviewer
receives a separate, non-owning assignment that cannot acquire or duplicate the primary
claim, change its owner, change scope, approve a gate, or authorize implementation.
Every review assignment is bound to the work-item key/link, workflow, primary claim
reference, review stage, exact artifact revision, reviewer role/member, and source
request event. Work Management records immutable request and result receipts with those
bindings and the disposition. Repeating the same assignment tuple reuses the receipt
idempotently; a changed revision, stage, reviewer, or source request creates a new
review receipt only, never a new primary run.

Critic inputs are stage-specific:

| Review stage | Required inputs | Boundary |
|---|---|---|
| `PRE_GATE_1_BRIEF` | Exact Brief revision, Scout evidence, Decision Log, governing gates/guardrails, signals/metrics limits, and Work Management assignment/receipts | No Exam prerequisite; the Exam is downstream of human Gate 1. The result is review evidence, not a Gate 1 ruling or execution authority. |
| `GATE_2_EXAM` | Exact human-approved Brief revision, exact Exam revision, applicable guardrails, and assigned Exam/Test evidence | Requires the Exam; a pre-gate Brief review is not a substitute. |
| `GATE_3_BUILD` | Exact Brief and frozen Exam revisions, implementation diff, test/CI evidence, and prior review receipts/results | Build review only; no merge, deployment, release, or human gate signature. |
