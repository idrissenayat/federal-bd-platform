# Data inventory — 0006 Work Economics

**Scope:** STR-017 implementation revision under Gate 3 review  
**Storage:** existing Cloudflare D1 database; no new vendor or subprocessors  
**Default posture:** role/POD aggregates only; no individual productivity fields, rankings, or automated prioritization

## Inventory and controls

| Record | Data | Purpose | Source and authority | Access | Retention / deletion |
|---|---|---|---|---|---|
| Value hypothesis | value type, beneficiary, metric, baseline, target, native unit, observation date, owner, driver bands, confidence, evidence URL | Explain why the item may matter before prioritization | AI may advise; Product Lead is the accepting authority | Authenticated POD members can read; Product Lead can write | Retain with the work item and its decision evidence; delete only through the governed work-item retention/deletion process |
| Delivery forecast | size, role-level human effort ranges, provider cost range, attempts, complexity/uncertainty/coordination, basis, comparable evidence, earliest/likely/latest, timezone, confidence, milestones, freshness, acceptance | Authorize execution and answer what is next/when | Agent or contributor may propose; named delivery authority accepts or edits | Authenticated POD members can read; Product Lead, Tech Lead, or Delivery authority can accept/update | Current value stays on item; every replacement remains in the immutable event history for the work-item evidence lifetime |
| Actual economics | role-aggregated human minutes, provider/model, attempts, available tokens, metered cost, execution/cycle/queue/blocked/gate-wait duration, rework/defects/rollbacks, source/completeness | Learn delivery cost and flow without treating activity as value | System/provider telemetry or an authorized audited correction | Authenticated POD members can read aggregate data; Tech Lead or Platform/Ops can correct with a reason | Retain with delivery evidence; corrections never overwrite audit history; no person-level raw timing is accepted by this API |
| Realized outcome | exact outcome state, native-unit result, observation date, verifier, evidence, confidence, causal limitations | Verify whether the expected outcome occurred | Evidence gathered by agents is advisory; Product Lead, Tech Lead, or Observe/Learn authority verifies | Authenticated POD members can read; named outcome authority can write | Retain with product/outcome evidence through the declared observation period and work-item evidence lifetime |
| Work Economics event | item, section, action, actor ID/role, prior JSON, replacement JSON, reason, timestamp | Reconstruct acceptance and every material correction or reforecast | Server-attributed authenticated mutation | Authenticated POD read; no update/delete endpoint; database operators remain governed by platform controls | Immutable for the work-item evidence lifetime; deletion only as part of an authorized whole-record retention action |

## Data minimization and prohibited data

- Human time is accepted only as broad role totals. The schema and validation reject person, employee, ranking, performance-score, utilization, compensation, and individual-output fields.
- No synthetic productivity/value score exists. Tokens, hours, cost, attempts, speed, accuracy, or closed-item counts are not business value and are not used to rank people or PODs.
- Missing telemetry stays missing; nullable migration fields do not invent zeroes.
- Provider cost remains paired with provider/model/source/completeness. The feature does not claim ROI or combine incompatible monetary and non-monetary units.
- Ordinary application errors must not include Work Economics payloads. Audit activity contains an evidence-safe action summary, while full prior/replacement records stay in the governed audit table.

## Security and threat model

Primary threats are unauthorized acceptance or correction, IDOR against another work item, client-side bypass, fabricated provider telemetry, audit rewriting, unsupported ROI claims, and using work telemetry for employee surveillance. Controls are server-side session and role authorization, item lookup before mutation, strict per-section validation, immutable append-only audit events, explicit telemetry provenance/completeness, role aggregation, prohibited person/ranking fields, and no export endpoint. A malicious authenticated client can only perform the mutations permitted to its human role; agents cannot accept human-authority records. Gate 3 remains default-closed pending independent Security and Privacy/Legal review.

## Migration, rollback, and operational handling

Migration `0005_normal_iron_fist.sql` adds four nullable JSON columns and the audit-event table. Existing work rows remain unchanged and therefore render `unknown`, never fabricated defaults. The automated migration test applies the migration to an existing row, verifies preservation, then rolls back the event table and columns and verifies the original row again. Before production migration, Platform/Ops must take the normal D1 backup, confirm migration compatibility, and retain the prior deployment for application rollback.

## Remaining Gate 3 decisions

- Product Lead: confirm purpose limitation, native-unit value language, and no unsupported financial claim.
- Security Owner: verify authorization/IDOR behavior, logs, database privileges, audit integrity, and restricted exports.
- Privacy/Legal: approve role-level retention/deletion and confirm that no person-level collection is introduced.
- Platform/Ops: approve D1 backup/rollback and provider telemetry provenance.
- Product Designer: verify narrow screen, keyboard, screen reader, 200% zoom, and complete error/permission states.

