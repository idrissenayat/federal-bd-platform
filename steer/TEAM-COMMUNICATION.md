# Team Communication and Escalation

The rule is simple: conversation may happen anywhere, but evidence and consequential
decisions must land in an auditable shared surface.

| Communication | Destination | Response expectation | Durable outcome |
|---|---|---|---|
| Daily asynchronous huddle | Buzz `#huddle`; GitHub Discussion until Buzz B1 | By the team's working-day midpoint | Blockers linked to issues; decisions moved to the log |
| Signal or observation | Buzz `#signals`; signal issue form is durable fallback | Triage within two working days | Digest in `steer/signals/`; candidate if evidence warrants |
| Agent ambiguity/escalation | Buzz `#escalations` plus linked escalation issue | Same working day for in-flight work | Ruling in issue and decision log when reusable |
| Build/review question | Pull-request thread | One working day; urgent blocker same day | Resolved thread or linked decision |
| Critic finding | Buzz `#critic-findings` plus pull-request review | Same day for a blocker; otherwise one working day | Human ruling or verified change on the pull request |
| Security concern | Private Security Advisory | Immediate acknowledgement | Remediation issue without sensitive details |
| Release observation | Buzz `#release-watch` plus release/incident evidence | During the release watch window | Verified outcome, rollback, or defect record |
| Weekly Learning Review | Buzz `#learning-review` plus versioned file in `steer/reviews/` | Protected weekly slot | At most two normal process changes, plus escape conversions |

Do not use direct messages as the only record of a scope ruling, gate decision, security
exception, source interpretation, or experiment deviation. Do not paste secrets or
sensitive data into any communication surface.

Buzz is the target communication plane under `steer/BUZZ-OPERATING-CONTRACT.md`. It
becomes the default huddle only after its B1 identity, permissions, routing, retention,
and revocation proofs pass. Until then, GitHub Discussions and escalation issues remain
the operational fallback beside the work and evidence. In either surface,
consequential conclusions must write through to the authoritative artifact.
