# Product charter

## Role in the STEER evaluation

This platform is the **test vehicle** for evaluating STEER as an Agentic SDLC. Product success is necessary evidence and a non-negotiable guardrail, but it is not the sole experiment outcome. The primary methodology and claim rules live in `steer/EXPERIMENT-CHARTER.md`.

A weak product result cannot be excused by good process telemetry, and a useful product does not by itself prove STEER caused the result.

## Problem

Federal contractors must watch multiple official sources, detect changes, read long notices and attachments, compare requirements with company qualifications, and make timely bid/no-bid decisions. The work is repetitive, but the consequential judgments depend on source fidelity, company-specific facts, and experienced human review.

## Intended users

- Business-development and capture leaders.
- Proposal and operations leaders participating in bid/no-bid reviews.
- Small and mid-sized federal contractors without a large research staff.

## Product outcome

Increase the share of relevant federal opportunities that receive a timely, evidence-backed decision while reducing analyst time per decision and preserving decision quality.

## Product guardrail contract for the STEER experiment

For a 10–20-opportunity pilot, compared with the team's current manual process:

- Reduce median analyst preparation time per bid/no-bid decision by at least 40%.
- Deliver a sourced qualification brief before the configured internal decision SLA for at least 90% of matched opportunities.
- Achieve at least 95% provenance completeness for material recommendation claims.
- Produce no automatic pipeline advancement without authenticated human approval.
- Report recommendation/human-decision agreement, overrides, missed amendments, and false-positive discoveries without hiding negative results.

These are product targets and experiment guardrails, not proof that STEER outperforms another SDLC.

## MVP scope

### Included

- Active SAM.gov contract notices and detected updates.
- Raw-source preservation and revision lineage.
- Contractor profile with capabilities, NAICS/PSC preferences, certifications, set-aside eligibility, vehicles, clearances, geographies, past performance, and risk constraints.
- Rule-based eligibility screening.
- Evidence-backed qualitative analysis and configurable weighted scoring.
- `BID`, `NO_BID`, and `REVIEW` recommendations.
- Human decision with rationale and override reason.
- Handoff to Capture for bid decisions; structured archive for no-bid decisions.
- USAspending historical-award enrichment where useful.

### Explicitly excluded from the first release

- Grants.gov opportunities.
- Paid opportunity aggregators.
- Automated scraping of arbitrary websites.
- Proposal generation or submission.
- Automated email, outreach, teaming requests, or government communication.
- Autonomous final bid/no-bid decisions.
- CUI, FCI, classified, export-controlled, or proprietary proposal content.
- Predictive win-probability claims without a validated outcome dataset.

## Success and guardrail measures

| Dimension | Measure |
|---|---|
| Business outcome | Relevant opportunities receiving an on-time decision |
| Human load | Active analyst minutes per completed decision |
| Discovery quality | Precision of surfaced opportunities against human relevance judgment |
| Decision quality | Recommendation agreement, override rate and reasons, eventual bid outcomes |
| Source integrity | Material claims with a resolvable evidence citation |
| Change safety | Missed or late notice-amendment alerts |
| Autonomy guardrail | Pipeline advances without authenticated human approval—target zero |

## Open product inputs

The first real build cannot pass Gate 1 until the product owner provides the initial contractor profile and confirms the provisional decision rubric. See `COMPANY-PROFILE.md` and `BID-NO-BID-RUBRIC.md`.
