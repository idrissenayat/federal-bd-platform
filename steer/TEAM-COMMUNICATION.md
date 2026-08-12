# Team Communication and Escalation

The rule is simple: conversation may happen anywhere, but evidence and consequential
decisions must land in an auditable shared surface.

| Communication | Destination | Response expectation | Durable outcome |
|---|---|---|---|
| Daily asynchronous huddle | Pinned GitHub Discussion | By the team's working-day midpoint | Blockers linked to issues; decisions moved to the log |
| Signal or observation | Signals Discussion or signal issue form | Triage within two working days | Digest in `steer/signals/`; candidate if evidence warrants |
| Agent ambiguity/escalation | Escalation issue form, linked to item | Same working day for in-flight work | Ruling in issue and decision log when reusable |
| Build/review question | Pull-request thread | One working day; urgent blocker same day | Resolved thread or linked decision |
| Security concern | Private Security Advisory | Immediate acknowledgement | Remediation issue without sensitive details |
| Weekly Learning Review | Versioned file in `steer/reviews/` | Protected weekly slot | At most two normal process changes, plus escape conversions |

Do not use direct messages as the only record of a scope ruling, gate decision, security
exception, source interpretation, or experiment deviation. Do not paste secrets or
sensitive data into any communication surface.

GitHub Discussions is the initial communication system because it is available beside
the work and evidence. Adopt a real-time chat/huddle service only when response latency or
team size demonstrates a need; link consequential chat conclusions back here.
