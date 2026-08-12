# Business-development pipeline

## States

| State | Meaning | Entry evidence | Allowed exits |
|---|---|---|---|
| `DISCOVERED` | An approved source produced a new or changed record | Source ID, raw payload hash, retrieval time | `QUALIFYING`, `DUPLICATE`, `WITHDRAWN` |
| `QUALIFYING` | Eligibility, fit, timing and source completeness are being evaluated | Normalized record and contractor-profile revision | `DECISION_REVIEW`, `NEEDS_INFORMATION`, `WITHDRAWN` |
| `NEEDS_INFORMATION` | A critical fact is absent or contradictory | Named unknown, owner, due date | `QUALIFYING`, `DECISION_REVIEW`, `ARCHIVED` |
| `DECISION_REVIEW` | A sourced recommendation is ready for human judgment | Scorecard, citations, confidence, recommendation | `CAPTURE`, `ARCHIVED`, `MONITOR` |
| `MONITOR` | Too early to bid; watch for changes | Human reason and alert rule | `QUALIFYING`, `ARCHIVED` |
| `CAPTURE` | Human approved a bid pursuit | Authenticated decision, rationale, capture owner | Later proposal pipeline—outside MVP |
| `ARCHIVED` | Human selected no-bid or the notice ceased to be actionable | Decision/failure reason and evidence | Reopen only through a new authenticated decision |
| `DUPLICATE` | Record maps to an existing opportunity/revision lineage | Canonical opportunity ID | Existing opportunity |
| `WITHDRAWN` | Official source withdrew or cancelled the notice | Source evidence | `ARCHIVED` |

## Automation boundary

Automation may advance records from `DISCOVERED` through preparation of `DECISION_REVIEW`. Only a human may move a record from `DECISION_REVIEW` to `CAPTURE`, `ARCHIVED`, or `MONITOR`. No pipeline state authorizes external submission or communication.

