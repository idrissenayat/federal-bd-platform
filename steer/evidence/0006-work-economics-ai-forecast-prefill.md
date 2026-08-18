# STR-017 correction evidence — Forecast Agent prefill

**Date:** 2026-08-15

## Reported defect

The initial Delivery forecast rendered required fields but left completion timestamps and other forecast facts for the human to enter manually. This contradicted the approved Brief authority model and design intent: AI proposes editable forecast fields; the named human accepts or edits them.

## Correction

- A bounded STEER Forecast Agent now proposes the complete initial forecast automatically from the current phase, explicit work type, gate, next action, attached evidence, and same-POD/same-work-type history when at least five completed observations exist.
- The proposal includes size, role-level human range, provider-level cost range, expected attempts, complexity, uncertainty, coordination, earliest/likely/latest completion, timezone, confidence, basis, next milestone/time, phase-exit target, limitations, and evidence links.
- Insufficient history is explicitly expert judgment with low confidence. The proposal never becomes authoritative by itself.
- The human interaction is reduced to `Review & accept AI forecast`; every field remains editable and acceptance remains server-authorized to the named human delivery owner.
- Reforecast-required and blocked-work proposals preserve the existing authority and blocker contracts.

## Approved acceptance coverage

- A-03 — advisory AI values are labeled, editable, and require named-human acceptance.
- C-01 — complete effort/cost/attempt/rubric forecast range.
- C-02 — separate earliest/likely/latest timestamps and timezone.
- C-03 — low-confidence expert judgment or qualifying same-POD/work-type history.
- C-05 — named delivery-owner acceptance still blocks execution.
- D-01/D-02/D-04 — next milestone, phase exit, and reforecast proposals are prefilled.
- H-02/H-04 — limitations and safe action remain explicit; server authorization is unchanged.

## Verification

- Full application build and test suite: 68 passed, 0 failed.
- Typecheck: passed.
- Lint: passed.
- New focused tests cover initial prefill, qualifying cohort use, valid ranges, advisory state, and blocked-work preservation.

This correction does not authorize Gate 3, merge, or release approval. Existing named specialist and human evidence requirements remain in force.
