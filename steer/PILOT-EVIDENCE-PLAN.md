# STEER Pilot & Evidence Plan

> **Framework reference:** For this repository's actual comparison, `EXPERIMENT-CHARTER.md`, `CONTROL-WORKFLOW.md`, `EXPERIMENT-REGISTER.md`, and `PILOT-0003.md` are authoritative. They add a credible agent-assisted control, treatment allocation, matched items, contamination tracking, and claim rules.

Use this protocol before making broad claims or rolling STEER across multiple teams.

## Pilot question

Does STEER improve the team's ability to deliver **verified customer outcomes** without unacceptable increases in human judgment load, cost, escaped defects, or team friction?

## Cohort

- Run **10–20 independently shippable items** through the complete loop.
- Include at least three risk levels and at least two item types (for example UI, data, integration, operations).
- Record killed items as evidence; do not report only shipped successes.
- Freeze the core metric definitions before item 1. Document any later change rather than rewriting history.

## Baseline

Use the most comparable 10–20 prior items from the same team/product. If no historical baseline exists, run a staged comparison: first 5 items with current practice, then 10–20 with STEER. Record differences in scope, staffing, and risk.

## Measures

| Dimension | Primary measure | Guard against gaming with |
|---|---|---|
| Outcome | Brief-specific customer/business outcome and observation window | Adoption/exposure denominator and unintended effects |
| Speed | Median idea → verified; median idea → observed outcome | Item-size/risk band and killed-item count |
| Quality | Escaped defects and canary rollbacks | Severity plus absolute count per week |
| Specification | Machine-scored first-pass rate | Human judgment rejections and brief/exam revisions |
| Human capacity | Judgment hours per item and weekly governance hours | Role, risk band, and time spent fixing agent work |
| Economics | Tool/agent spend and fully loaded cost per shipped item | Marginal cost, human hourly-value assumption, and volume |
| Experience | Short team pulse: clarity, cognitive load, trust | Free-text failure notes; never use sentiment alone |

## Per-item outcome contract

Before Gate 1, each brief must name:

1. the user/business condition expected to change;
2. the primary outcome measure and current baseline;
3. the observation window;
4. the minimum meaningful signal;
5. a guardrail measure that would make the result unacceptable.

When causal attribution is weak, label the result **observed**, not **caused by STEER**.

## Comparison and reporting

- Compare medians and ranges; samples this small do not justify false precision.
- Segment by risk/size before blaming the process for hard work.
- Publish the denominator, killed items, missing observations, overrides, and metric-definition changes.
- Include at least three failure narratives: what happened, what the system missed, and what changed.
- Record tool/model versions because capability changes can explain results.

## Decision after the pilot

Choose one:

- **Adopt:** outcome and quality improve or hold while human load/economics remain acceptable.
- **Adapt and repeat:** the failure is localized to a phase, gate, metric, or configuration.
- **Stop:** the framework adds control cost without enough outcome, quality, or learning benefit.

The decision and dissenting view go into `operating-system/DECISION-LOG.md`.
