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

For a review handoff, the target-authoring agent first pushes and verifies the exact
revision, clean worktree, required checks, and exact artifact URLs, then records
`REVIEW_TARGET_READY` in Work Management and stops. Work Management persists and
reload-verifies the complete non-owning assignment or approved-setup bootstrap and only
then emits the authenticated canonical `REVIEW_REQUESTED` event with the exact item
key/link. A reviewer mention/request before that durable assignment is invalid and
cannot be retroactively authorized; a changed target requires a new target-ready record.

The authorized human uses the work item's **Authorize & copy Buzz handoff** control and
posts the generated message in the configured canonical `#steer-team`
(`10ac2fb4-f7fc-4dbc-bb73-8c545f31a470`) channel. A project channel may carry
discussion only and cannot override the configured route. A Buzz mention is a
notification, not permission to start. If any requirement is missing, the agent may
discuss or clarify the request but must not execute it, reprioritize it, change its
scope, assign another agent, or approve a gate.

| Communication | Destination | Response expectation | Durable outcome |
|---|---|---|---|
| Daily asynchronous huddle | One parent thread in Block Buzz `#steer-team` | By the team's working-day midpoint | Each active human/agent posts status, blocker/input, evidence link, next handoff, and boundary; decisions move to the durable record |
| Authorized agent handoff | Configured canonical Block Buzz `#steer-team` (`10ac2fb4-f7fc-4dbc-bb73-8c545f31a470`) using the Flight Board-generated message | Agent acknowledges in the same canonical thread | Assignment, scope, state, and authorization remain in the Flight Board; implementation evidence remains in GitHub; project channels cannot override or fall back |
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
The canonical assignment payload binds the active work-item stable ID/key, workflow,
unchanged primary claim lineage/owner/member, review stage, the executable target tuple
(`target_git_object_format`, `target_git_commit_oid`, `target_commit_object_sha256`,
`target_artifacts[]`, and `target_artifact_manifest_sha256`), exact artifact URLs, prior
evidence/decision bindings, reviewer role/member, explicit output/prohibitions, and
authenticated authorizing actor/event. `target_git_commit_oid` is the repository's
lowercase Git OID; `target_commit_object_sha256` hashes the raw Git object bytes
`UTF8("commit " + DECIMAL(len(commit_bytes)) + "\0") || commit_bytes`, where
`commit_bytes` are the exact `git cat-file commit <oid>` bytes. Each artifact entry
hashes exact raw bytes and the sorted five-entry manifest digest is
`SHA-256(UTF8(RFC8785({schema:"steer-review-artifact-manifest/v1", target_git_object_format:target_git_object_format, target_git_commit_oid:target_git_commit_oid, artifacts:target_artifacts})))`, with JCS UTF-8/no-BOM. Its ID is
`review_assignment_id = SHA-256(UTF8(RFC8785(steer-review-assignment/v1 payload)))`;
JCS is RFC 8785 UTF-8 without BOM with recorded array ordering.

Work Management alone appends the signed assignment after checking those bindings and
the active configured canonical route. Only the enrolled reviewer appends signed
acknowledgement and result records, each binding the assignment ID, exact target,
reviewer, source request, and predecessor receipt. No unsigned review record is valid.
The idempotency key is
`review_idempotency_key = SHA-256(UTF8(RFC8785({schema:"steer-review-idempotency/v1", review_assignment_id})))`.
Exact replay returns the existing append-only request/ack/result receipts; changed or
missing fields, stale owner/workflow/lineage, wrong reviewer/authorizer, target
mismatch, or duplicate mismatch rejects before append/side effect and cannot mint a
fallback key. Until `review_assignments[]` exists, one authenticated approved-setup
bootstrap may seed the complete payload and receipt; it is audited and then closed,
with no bootstrap writes afterward. No route override or fallback is accepted unless
the configured canonical route or a frozen decision explicitly allows it. Review
assignment/ack/result/bootstrap records follow the same pseudonymous-data inventory,
no-PII logging, 90-day terminal retention, hold, and auditable deletion controls as
other identity-linked records.

The mandatory two-phase ordering is `REVIEW_TARGET_READY` → durable Work Management
assignment/bootstrap and reload verification → `REVIEW_REQUESTED`. The target-ready
receipt binds the pushed exact commit, branch/remote verification, clean/diff checks,
the recomputed target tuple, all exact artifact URLs, and the same primary claim/run.
The request is not emitted
until Work Management has also verified item state, primary owner/claim/run, reviewer
identity, stage, prior bindings, output/prohibitions, authorizer/event, idempotency key,
and canonical route. The target-authoring agent must not mention or request the reviewer
while stopped at `REVIEW_TARGET_READY`; a reviewer request that predates assignment is
invalid. Exact retries after assignment are idempotent and do not create a new claim or
run.

Critic inputs are stage-specific:

| Review stage | Required inputs | Boundary |
|---|---|---|
| `PRE_GATE_1_BRIEF` | Exact Brief revision, Scout evidence, Decision Log, governing gates/guardrails, signals/metrics limits, and authenticated Work Management assignment/acknowledgement/result receipts | No Exam prerequisite; the Exam is downstream of human Gate 1. The result is review evidence, not a Gate 1 ruling or execution authority. |
| `GATE_2_EXAM` | Exact human-approved Brief revision, exact Exam revision, applicable guardrails, and assigned Exam/Test evidence | Requires the Exam; a pre-gate Brief review is not a substitute. |
| `GATE_3_BUILD` | Exact Brief and frozen Exam revisions, implementation diff, test/CI evidence, and prior review receipts/results | Build review only; no merge, deployment, release, or human gate signature. |
