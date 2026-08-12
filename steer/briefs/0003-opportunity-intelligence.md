# Intent Brief — 0003 Opportunity intelligence to decision handoff

> **Experiment role:** This is the common product-program contract for both STEER and Control work. It is not scored as a single comparative item. Before execution, decompose it into independently useful candidate cards, match/block them, and assign workflow treatment according to `EXPERIMENT-CHARTER.md`.

**Status:** draft  
**Tags:** #security #privacy #reliability #legal  
**Date opened:** 2026-08-12

## Expected outcome and measurement

- Primary outcome: provide a real, consequential product context in which to compare STEER and the agent-assisted Kanban control while increasing relevant opportunities receiving a timely, evidence-backed human decision.
- Baseline / denominator: the product owner's current manual saved-search and review process, measured over a comparable set; denominator is all opportunities matching the frozen pilot profile and source query.
- Observation window: 10–20 opportunity decisions after the baseline and profile are frozen.
- Minimum meaningful signal: at least 40% lower median analyst preparation time and at least 90% of matched opportunities reaching decision review before the internal SLA.
- Guardrail measure: at least 95% provenance completeness for material claims, zero autonomous decision-state advances, no missed high-impact amendment remaining undetected beyond the source-check SLA, and no process claim based only on product completion.

## Who this is for

A federal contractor's business-development or capture leader who must rapidly decide whether an official procurement notice deserves scarce pursuit resources.

## Problem and why now

Official notices arrive continuously, change over time, and contain long descriptions and attachments. Teams lose time gathering facts, miss amendments, and apply inconsistent fit criteria. Agent-assisted analysis can reduce preparation work, but only if official evidence, company-specific eligibility, unknowns, and human authority remain explicit.

## What "done and correct" means

- The system incrementally ingests active SAM.gov Contract Opportunities, follows pagination, preserves every raw response with a digest, and reconstructs locally observed revisions.
- A normalized opportunity preserves official identifiers, agency hierarchy, notice type/status, dates, NAICS/PSC, set-aside, place, description, contacts, related notices, and attachment metadata without inventing absent fields.
- New and changed notices are deduplicated into a canonical opportunity and high-impact changes trigger re-analysis.
- Qualification reads an explicit contractor-profile revision and evaluates every hard gate as `PASS`, `FAIL`, or `UNKNOWN` with evidence.
- The recommendation package contains a factor score, `BID`/`NO_BID`/`REVIEW`, confidence, material citations, assumptions, unknowns, risks, and the smallest fact/action that could change the posture.
- A missing critical source or contractor fact yields `REVIEW`; it never becomes an inferred pass.
- Only an authenticated human can choose `BID`, `NO_BID`, or `MONITOR` and advance the opportunity to Capture or Archive.
- The original recommendation and every human override remain immutable and auditable.
- The pilot ledger captures analyst time, source freshness, agreement/override, decision rationale, recommendation defects, and later pursuit outcome where known.

## Design intent

The review experience is an analyst's evidence table, not a chatbot transcript. Show recommendation, hard gates, score and source freshness first; keep each material statement expandable to exact evidence. Unknowns and contradictory facts use warning states. The decision action is visually distinct from the recommendation and requires an explicit rationale.

The first implementation may expose the package through an API/CLI before the web review screen, but it must use the same contracts the eventual UI will render.

## Out of scope

- Grants, paid aggregators, arbitrary web search, and unrestricted crawling.
- Proposal writing, pricing, color-team review, submission, or contract-performance workflows.
- Automated government or partner communication.
- Autonomous final bid/no-bid decisions.
- Predictive win probability presented as fact.
- CUI, FCI, classified, export-controlled, or proprietary proposal material.
- Production-scale multi-tenancy and billing during the first pilot.

## Risks and default-closed touchpoints

- Source content and attachments are untrusted; attachments remain quarantined until safe processing passes.
- The SAM.gov public API returns the latest active version, so local polling history must preserve observed changes and the product must disclose gaps.
- API keys, POC information, company past performance, and decisions need least-privilege access and redacted logs.
- The platform's legal/compliance posture is advisory: it identifies relevant stated requirements but does not certify eligibility or provide legal advice.
- LLM analysis may hallucinate, flatten uncertainty, or bias scoring; structured evidence, deterministic hard gates, frozen weights, and human approval control that risk.

## Chosen approach

Build one source adapter and one end-to-end decision package before adding more sources or a rich UI. Use PostgreSQL for authoritative records, immutable object storage for evidence, deterministic eligibility rules, and a structured analysis layer that can be replayed from frozen inputs.

Rejected for the first slice: multi-source crawling, vector search as the system of record, autonomous decisions, and parallel agent lanes. These add failure modes before the evidence path is proven.

---

GATE 1: PENDING — requires completed company profile, rubric confirmation, and outcome-baseline owner  
GATE 1 EVIDENCE: PENDING — authenticated approval tied to this revision
