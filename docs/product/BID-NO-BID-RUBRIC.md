# Bid/no-bid recommendation rubric

This is a provisional, configurable rubric. The platform recommends; a human decides.

## Hard gates

Any confirmed failure produces `NO_BID`. Any unresolved hard-gate fact produces `REVIEW`, never an invented pass.

1. Response deadline remains actionable under the contractor's minimum lead-time rule.
2. The contractor is eligible for the set-aside and size standard.
3. Any required contract vehicle, facility clearance, personnel clearance, license, or geography is satisfied.
4. Mandatory scope capabilities can be supplied by the contractor or an identified permissible partner.
5. No explicit company exclusion, conflict, or unacceptable contractual condition applies.
6. The source record is active and sufficiently complete to support a decision.

## Weighted factors

| Factor | Weight | Evidence expected |
|---|---:|---|
| Capability and requirement fit | 25 | Requirement-to-capability mapping with gaps |
| Relevant past performance | 20 | Versioned internal references and official award context |
| Strategic/customer fit | 15 | Company priorities and agency/office focus |
| Competitive position | 10 | Incumbent/award context, differentiators, partner posture |
| Contract and delivery feasibility | 10 | Vehicle, staffing, location, schedule, compliance |
| Economics and pursuit capacity | 10 | Value range, margin rule, proposal capacity, pursuit load |
| Timing and information quality | 10 | Response window, attachment completeness, unresolved unknowns |
| **Total** | **100** | |

## Provisional recommendation bands

- `BID`: all hard gates pass, score at least 75, and no critical unknown remains.
- `REVIEW`: score 55–74, confidence is low, or a critical fact is unresolved.
- `NO_BID`: a hard gate fails or the score is below 55.

The output must show the score by factor, hard-gate status, citations, confidence, unknowns, assumptions, and the smallest action that could change the recommendation. Weights and thresholds are frozen during the 10–20-item pilot unless a defect requires a logged change.

