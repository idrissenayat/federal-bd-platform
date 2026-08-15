# Data inventory — 0006 Work Economics rework

**Scope:** STR-017 final correction after independent Test Agent retest of branch revision `b64e4c1bc300871b4dada8b3296ab1dfa58938fd`
**Storage:** existing Cloudflare D1 database; no new vendor or production subprocessor
**Boundary:** one authenticated POD; routine reads expose role/POD aggregates only. Exact recursive allowlists reject unknown keys, email-address values, unapproved role labels, and all person/ranking keys before storage or replay.

## Inventory and controls

| Record / table | Fields and purpose | Source / human authority | Access and audit | Retention / deletion |
|---|---|---|---|---|
| `value_hypothesis_json` | Native-unit value contract, governed monetary/non-monetary mode, beneficiary, metric/baseline/target/unit/date, named outcome-owner member ID, driver bands, exact evidence URL/revision/SHA-256/verification time, assumptions, currency/period, AI advisory and human acceptance state. Monetary native units must resolve through the fixed alias registry to the declared currency. | AI may propose; Product Lead accepts. The server must resolve a GitHub text artifact to an immutable 40-character revision and fingerprint it; client verification claims are discarded. | Same-POD members read; Product Lead writes; all replacements retain prior/replacement JSON and reason. | Work-item evidence lifetime. Deleting/anonymizing a member profile removes the display/email mapping; the opaque authority ID remains as required decision evidence. |
| `delivery_forecast_json` plus `work_economics_human_facts` / `work_economics_agent_facts` | Per-role active-minute ranges; per-provider cost/integer-attempt ranges; separate complexity/uncertainty/coordination; basis/service-level cohort; completion range/timezone; milestone, phase exit, agent-complete and human-decision targets; blocked/unblock contract; advisory/acceptance | AI may propose; first eligible Delivery/Product/Tech human becomes the named delivery owner. Later acceptance must match that owner and POD. Comparable facts are derived from completed current-POD/current-work-type items, never client asserted. | Same-POD aggregate read. Server stamps opaque member ID/time; dispatch compares owner and exact current forecast state with `delivery_owner_id`. Projection tables make role/provider facts queryable. | Current projection follows the accepted record. Immutable events preserve corrections for the evidence lifetime. |
| `actual_economics_json` plus human/agent/duration fact tables and `work_economics_delivery_events` | Per-role totals; provider/model event ID, integer attempts/tokens, nullable cost, currency, duration, source, completeness, observed time, accepted/late/conflict state and conflict reason; separate queue/blocked/gate/cycle/agent durations; queryable rework origin/minutes/reason, defect severity/count, rollback reason/time; server-derived completion and variance | Provider/system telemetry or Tech/Platform/Ops audited correction. Workflow activity is authoritative for completion and variance. | Same-POD aggregate read. Unknown fields, duplicate event IDs, negative/non-finite facts, invalid dates, person identifiers, and invalid conflict records fail closed. Replacement rebuilds query projections while immutable events retain history. | Evidence lifetime. No person-level raw activity is accepted, so no person-timing deletion case exists. Provider telemetry remains aggregate and source-attributed. |
| `realized_outcome_json` | Exact outcome status, native-unit result, valid observation date, immutable evidence revision/fingerprint/verification time, verifier, confidence, causal limits, AI advisory and acceptance | AI gathers evidence; named outcome owner or Observe/Learn human verifies. Verified/inconclusive evidence must resolve server-side; pending/not-due verification provenance is cleared. | Same-POD read; server enforces named owner/POD and stamps verifier/time | Through observation and evidence lifetime; never synthesized from item completion. |
| `work_economics_events` | Section/action, opaque actor member ID and role, safe prior/replacement JSON, reason/time, including denied attempts | Server only | Same-POD read. Database `BEFORE UPDATE` and `BEFORE DELETE` triggers abort modification; no mutation API. Denials store no rejected payload, timing, or cost. | Evidence lifetime. Platform backup/retention deletion is a controlled whole-work-item operation; individual facts are not silently erased. |
| `pod_id`, `work_type`, `delivery_owner_id`, `outcome_owner_id` | Tenant/POD boundary, explicit service-level work taxonomy, and named human authority. `work_type` is separate from STEER/Control workflow treatment and defaults to `Unclassified`, which is ineligible for comparable-history cohorts. | Server/member roster; a same-POD human classifies work using the fixed taxonomy. | Every economics mutation compares item/member POD and named owner. Bootstrap scopes work, members, and economics events to the current POD. Service-level reads require exact same-POD/same-work-type completed records. | Member profile can be anonymized under the platform member-lifecycle process; opaque IDs remain for audit integrity. Work type follows the work item lifecycle. |

## Data minimization, safe reads, and anti-gaming

- Exact schemas recursively reject every unknown key at every level. Role fields accept only the documented aggregate-role allowlist, and email-like values are rejected anywhere in an economics payload.
- Server stamps use opaque member IDs, never email addresses. API errors and denial events never include the submitted payload or sensitive timing/cost.
- Existing malformed/permissive JSON is not replayed: bootstrap replaces it with `unavailable`/`unknown`, and audit JSON is redacted to a safe state message until an authorized correction is recorded.
- There is no score, person export, employee dashboard, ROI calculator, or automatic prioritization. Missing values stay nullable/unavailable and are never coerced to zero.
- Monetary value requires compatible currency, period, evidence, and visible assumptions. Non-monetary value remains in its native unit.

## Threat model and control result

Threats include API IDOR, cross-POD reads, role-wide acceptance that bypasses the named owner, nested JSON smuggling, audit rewriting, duplicate/late/conflicting provider telemetry, unsupported value/ROI claims, and repurposing timing data for employee ranking. Controls are server authentication, member/POD equality, named-owner checks, exact recursive schemas, approved role labels, verified evidence, low-confidence expert judgment, unique provider event IDs, explicit late/conflict states, queryable aggregates, evidence-safe denial events, immutable database triggers, no person export, and safe legacy reads. Agents cannot accept authoritative records. Security and Privacy/Legal must still independently review the final revision; Builder evidence cannot sign Gate 3.

## Migration and rollback

- `0005_normal_iron_fist.sql` adds nullable four-record JSON and the audit table.
- `0006_sticky_sleeper.sql` adds POD/named-owner fields, normalized human/provider/duration facts, unique provider event IDs, and immutable audit triggers.
- `0007_melodic_the_initiative.sql` adds queryable rework/defect/rollback events and retained provider conflict reasons.
- `0008_shiny_calypso.sql` adds persisted `work_type` with a safe `Unclassified` default and a POD/work-type/state cohort index.
- The automated migration test starts from an existing item, applies all four migrations, proves nullable/unknown behavior, work-type persistence, query projections, conflict provenance, and trigger enforcement, rolls back the additions/tables/triggers/columns, and confirms original key/title/next action remain intact.
- Production requires a D1 backup and Platform/Ops migration/rollback approval. No migration or deployment is authorized by this Builder rework.

## Required independent decisions still open

- Security: confirm D1 operational privileges, member anonymization procedure, dependency disposition, logs, and denial/IDOR behavior.
- Privacy/Legal: confirm evidence-lifetime retention and the member-profile anonymization/deletion process for opaque authority IDs.
- Product: confirm evidence-verified value semantics and financial-claim wording.
- Platform/Ops: confirm provider ingestion/deduplication operations, backup, and rollback.
- Product Designer: complete keyboard, screen-reader, narrow-screen, timezone, and 200% zoom human checks in addition to automated axe/contrast checks.
