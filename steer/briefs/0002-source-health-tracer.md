# Intent Brief — 0002 Source-health tracer

**Status:** draft  
**Tags:** #security #reliability  
**Date opened:** 2026-08-12

## Expected outcome and measurement

- Primary outcome: prove that Minimum Viable STEER can take one real setup item from written intent through a pre-code exam, implementation, verification, and learning with complete process evidence.
- Baseline / denominator: no runnable project health path exists. This tracer's
  denominator is the single configured SAM.gov adapter exercised in fixture mode;
  future source adapters are separate work and do not expand this brief's scope.
- Observation window: begins when Gate 1 is approved and ends after the merged tracer
  passes its first required `main` CI run and the resulting setup/process evidence is
  recorded in a Learning Review.
- Minimum meaningful signal: the source-health behavior passes its exam, all three decision points are evidence-backed, human active minutes and gate latency are captured, and the resulting process defects are recorded.
- Guardrail measure: zero secret values in logs, test output, stored evidence, or error messages; no claim that this single tracer proves STEER superiority.

## Who this is for

A platform engineer or founder setting up the repository and needing proof that the basic rails work before real opportunity data is ingested.

## Problem and why now

The repository needs a small tracer that crosses configuration, adapter contracts, structured output, tests, and secret redaction before the real SAM.gov ingestion slice starts.

## What "done and correct" means

- A documented command runs an offline source-health check against committed fixtures and exits successfully.
- A missing SAM.gov key is reported as `not_configured`, not as a stack trace or false healthy result.
- A live check is opt-in, bounded by a timeout, and never prints the API key.
- The output is structured and distinguishes configuration, connectivity, schema,
  freshness, and degraded status. Fixture mode reports freshness as `not_evaluated`;
  it never presents fixture age as live-source freshness.
- CI runs the offline check without external network access.

## Design intent

Command-line output is concise, accessible in plain text, and machine-readable as JSON. Errors state the smallest corrective action. Live access is visibly different from fixture validation.

This is a STEER feasibility/calibration item, excluded from the comparative cohort.

## Out of scope

- Storing opportunities.
- Polling or pagination.
- Attachments.
- Analysis or recommendations.
- Web UI.

## Risks and default-closed touchpoints

The SAM.gov key is a secret. The live path defaults off, redacts query strings and headers, and uses a strict timeout. CI uses fixtures only.

## Chosen approach

Use a small Python command and a source-adapter protocol. Begin with a SAM.gov fixture
adapter and an optional, minimal authenticated `GET` search probe with a strict timeout;
do not issue a network request when the API key is absent. Avoid introducing a queue,
web UI, or database for the tracer.

---

GATE 1: APPROVED — 2026-08-12T20:47:45Z — IE
GATE 1 EVIDENCE: https://github.com/idrissenayat/federal-bd-platform/issues/2#issuecomment-5272619531 — authenticated Product Lead approval for artifact `c6c20065b3e9aebc57c3193862f5ceb9ce6f0eef`
