# STEER Core installation for the Federal BD reference project

This directory combines the reusable STEER Core controls with one project's installed
briefs, exams, reviews, signals, experiment files, and guardrails. Vendor-neutral
explanations live in `docs/steer/`; normative gates, guardrails, metrics, roles, and
templates live here. Product-specific material must remain clearly labeled.

## Primary purpose

For this reference project, read these in order:

1. `TEAM-ONBOARDING.md` — where work happens and how humans and agents join safely.
2. `EXPERIMENT-CHARTER.md` — what STEER must prove and how claims are constrained.
3. `CONTROL-WORKFLOW.md` — the competent agent-assisted Kanban comparison.
4. `EXPERIMENT-REGISTER.md` — freezes configuration, allocation, and cohort status.
5. `PILOT-0003.md` — applies the experiment to this product.
6. `PROJECT-GUARDRAILS.md` — product and trust controls shared across treatments.

For adoption outside Federal BD, begin with `docs/steer/ADOPTION.md` instead of copying
the project charter or project guardrails.

## Numbering

- `0001` remains the framework's worked waitlist example under `examples/`.
- `0002` is this project's setup/source-health tracer.
- `0003` is the product-program brief for the opportunity-intelligence vertical slice. It defines common product requirements but is not scored as one comparative item; the frozen cohort will decompose it into independently useful candidate cards before allocation.
- `0004` specifies the open-source multi-organization, multi-POD, multi-project reference
  platform. It is not authorized for implementation until Gates 1 and 2 are approved.

## Decision status

- Gate 1 and Gate 2 are not satisfied by a typed line alone.
- Record approvals in the repository/CI system with authenticated actor identity, exact artifact revision, and linked evidence.
- The current briefs are drafts until the product owner supplies the initial company profile and approves the outcome and scope.

Read `PROJECT-GUARDRAILS.md` in addition to the framework files under `operating-system/`.
