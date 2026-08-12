# Comparative pilot — STEER on Opportunity Intelligence

This pilot instantiates `EXPERIMENT-CHARTER.md` for the federal BD platform. The platform is the test vehicle; the decision is whether STEER merits continued use or modification.

## Phase 0 — calibration, excluded from the comparison

- Build the source-health tracer (`0002`) with Minimum Viable STEER.
- Use the tracer to verify the rails, evidence capture, human-time logging, and ledger mechanics.
- Do not count the tracer as comparative evidence.
- Complete the contractor profile and freeze the product rubric.

## Phase 1 — establish a credible control

Define the team's good agent-assisted Kanban workflow in writing before comparative work begins. It includes normal outcome framing, acceptance criteria, CI, security, review, and release controls. It does not inherit mandatory STEER briefs, pre-code exams, three-gate evidence, or a fresh Critic unless those were already normal control practices.

Run one non-scored control calibration item to confirm timing and evidence collection are comparable. Do not tune the control to fail.

## Phase 2 — comparative cohort

- Select 10–20 independently useful platform items.
- Form at least five matched pairs/blocks by work type, risk, estimated size, and dependency level.
- Randomize STEER versus Control within each block before detailed design/build.
- Use the same people, models, tools, repository, CI, and product standards.
- Preserve killed, blocked, contaminated, and failed items.

Candidate work may include source polling, evidence storage, normalization, revision detection, eligibility rules, recommendation packaging, decision authorization, pilot telemetry, and analyst review. Do not split a feature artificially merely to improve item counts.

## Measures and decision

Primary KPIs:

1. Verified outcome yield.
2. Time to verified release.
3. Qualified human hours per verified outcome.

Guardrails include escaped defects, security/control failures, fully loaded cost, team load, product outcomes, source integrity, and unauthorized transitions.

Use pair-level differences, medians, ranges, and narrative failures. Do not claim statistical significance from a small cohort. Apply the provisional thresholds in `EXPERIMENT-CHARTER.md`, then decide `continue`, `adapt and repeat`, or `stop`.

## Required reporting

- Every treatment assignment and any deviation.
- All started, killed, failed, and missing-observation items.
- Model/tool/environment changes.
- STEER adherence and Control contamination.
- At least three detailed failure narratives.
- The strongest argument against the final conclusion.
- A scoped claim that names this product, team, toolchain, and work mix.

