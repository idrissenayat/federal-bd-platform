# Team Communication and Escalation

The rule is simple: conversation may happen anywhere, but evidence and consequential
decisions must land in an auditable shared surface.

| Communication | Destination | Response expectation | Durable outcome |
|---|---|---|---|
| Daily asynchronous huddle | Block Buzz `#steer-team` | By the team's working-day midpoint | Blockers linked to work items; decisions moved to the durable record |
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
