# Issue #74 real lifecycle verification contract

This contract replaces the retired synthetic readiness evaluator. Every counted hosted case must use the canonical staging deployment and traverse the real persistence and authority path:

1. A service-authenticated, staging-only fixture creates only the prerequisite work item, exact Gate 1 and Gate 2 approvals, exact signed target-verification envelope, append-only signed Critic lifecycle, and bounded test identities.
2. The decision service creates a signed staging verification receipt for the exact source, build, migration set, runtime policy, approved Brief, approved Exam, candidate Builder, intended Product Lead submitter, and case-contract digest.
3. The authenticated Product Lead calls the production release-readiness snapshot, decision-package, decision-session, and decision-intent endpoints.
4. Qualified-human cases call the production countersignature function through the authenticated staging fixture principal adapter. Submitter, Builder, wrong-role, and duplicate-person attempts must remain ineligible.
5. The decision service calls the production issuer-proof and finalization endpoints. Exact boundary cases may supply the service-authenticated staging-only controlled clock within 48 hours of server time; production rejects that clock path.
6. Each case captures D1 projections from the real readiness snapshots, readiness events, countersignatures, intents, proof events, decisions, and activity tables. A successful case has exactly one effective Gate decision; a blocked case has zero.

The denominator is 30:

- 24 classification, exact-boundary, qualified-human, separation, and drift cases;
- one idempotent replay case;
- one 100-identity concurrency case in which every identity traverses snapshot, intent, proof, finalization, and D1 projection;
- one authentication-failure and reconciliation case;
- three rollback/restore cases: legacy preservation, pending-readiness inertness while reverted, and no duplicate effect after restoration.

The hosted ledger must record observed HTTP responses, transport attempts, per-step timings, exact snapshot and intent identities, final Gate-effect counts, raw bounded D1 projections, and projection SHA-256 values. Expected outcomes may be used only as assertions; they may not be copied into observed fields.

Accessibility verification is agent-operated. It must cover all eight readiness states, keyboard behavior, screen-reader-readable status text, focus behavior, contrast, 320 CSS pixels, and true browser zoom at 200%. Human confirmation is not required.

Production is read-only throughout Gate 2 verification. No merge, production deployment, Release, closure, or Gate 3 effect is authorized by this contract.
