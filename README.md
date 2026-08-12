# STEER Agentic SDLC Validation Project

This repository is first an evaluation of **STEER as an Agentic SDLC**. The federal business-development platform is the demanding, real-world product used to test the framework—not the main claim being evaluated.

The product remains important: it must discover credible contract opportunities, analyze fit, recommend a bid/no-bid posture, and move an approved opportunity into the next business-development stage. But shipping that software alone does not prove STEER works. The project must compare STEER with a credible conventional workflow and report speed, quality, human attention, cost, product outcomes, bypasses, and failures.

## Primary research question

Does STEER deliver independently useful, verified software outcomes faster or with less qualified human effort than a good Kanban-style control workflow, without degrading quality, safety, cost, or team experience?

The primary comparison keeps the people, repository, models, tools, CI, and engineering standards as similar as possible. The process changes; the control is not intentionally weakened. Historical human-centric Scrum/Kanban data may provide context, but it is not treated as a clean causal comparison.

Read [the STEER experiment charter](steer/EXPERIMENT-CHARTER.md) before the product documents.

## Test vehicle: product boundary

The first release covers federal **contract** opportunities—not grants—and stops after the human bid/no-bid decision creates either a capture record or a no-bid archive entry.

The platform will:

1. Discover new and changed notices from approved official sources.
2. Preserve the raw source and a verifiable provenance record.
3. Normalize, deduplicate, and connect notice revisions.
4. Evaluate eligibility, fit, timing, strategic value, risks, and missing information.
5. Produce an explainable `BID`, `NO_BID`, or `REVIEW` recommendation with citations and confidence.
6. Require a human decision before advancing to Capture or closing the opportunity.
7. Record the decision and eventual result so the model can be calibrated.

The platform will not submit responses, contact government personnel, or send external messages without explicit human action. The MVP accepts public, unclassified information only.

## First product flight

The initial vertical slice is:

`SAM.gov notice → immutable evidence → normalized opportunity → contractor-fit analysis → sourced recommendation → human decision → Capture/Archive`

SAM.gov is the live-notice system of record. USAspending award data provides historical context. Agency forecasts and SBA SUBNet are governed follow-on adapters because their interfaces and semantics differ from SAM.gov.

## Repository map

| Path | Purpose |
|---|---|
| `steer/` | STEER v2 operating system, briefs, exams, reviews, and signals |
| `steer/EXPERIMENT-CHARTER.md` | Primary question, control workflow, allocation, measures, and claim rules |
| `steer/CONTROL-WORKFLOW.md` | Credible agent-assisted Kanban comparison condition |
| `steer/EXPERIMENT-REGISTER.md` | Frozen configuration, cohort allocation, deviations, and status |
| `docs/product/` | Product charter, pipeline, decision rubric, and company-profile contract |
| `docs/architecture/` | System design and trust boundaries |
| `docs/sources/` | Approved-source register and ingestion rules |
| `apps/api/` | API boundary; implementation begins after Gates 1 and 2 |
| `apps/web/` | Analyst review experience; not required for the first ingestion tracer |
| `workers/ingestion/` | Source polling, evidence capture, parsing, and enrichment |
| `packages/domain/` | Source-independent opportunity and decision contracts |
| `tests/fixtures/` | Sanitized official-source fixtures and expected outputs |

## Current status

- Repository and STEER controls: established.
- STEER-versus-control experiment: defined; baseline execution not started.
- Product charter, source policy, architecture, and decision rubric: drafted.
- Brief `0002`: setup tracer drafted.
- Brief `0003`: first real opportunity-intelligence slice drafted.
- Gate 1: awaiting product-owner approval and a completed contractor profile.
- Gate 2: exam drafted; implementation has not started.

Start with [the experiment charter](steer/EXPERIMENT-CHARTER.md), then review [the product charter](docs/product/PRODUCT-CHARTER.md), complete [the company profile](docs/product/COMPANY-PROFILE.md), and approve the first real brief.

Before any product implementation, bootstrap and verify the shared environment:

```bash
./scripts/bootstrap-environment.sh
./scripts/gauntlet.sh
```

The readiness levels, evidence, and remaining delivery blockers are recorded in
[`steer/ENVIRONMENT-READINESS.md`](steer/ENVIRONMENT-READINESS.md).
