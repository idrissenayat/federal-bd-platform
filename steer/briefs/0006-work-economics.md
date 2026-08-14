# Intent Brief — 0006 STEER Work Economics and value realization

**Status:** Gate 1 approved; Gate 2 approved; Gate 3 blocked

**Tags:** #security #privacy #reliability #legal #design-system #money #a11y

**Date opened:** 2026-08-14

**Engineering record:** [GitHub issue #48](https://github.com/idrissenayat/federal-bd-platform/issues/48)

**STEER work item:** STR-017

## Expected outcome and measurement

- **Primary outcome:** every STEER work item makes its expected value, forecast effort, actual delivery economics, and verified outcome separately understandable so that humans can prioritize and learn without treating activity as value.
- **Baseline / denominator:** the current backlog has no standardized Work Economics record; the denominator is every new or materially revised STEER work item after this capability ships.
- **Observation window:** the first 10 completed work items or 30 days after release, whichever is later, with outcome verification continuing through each item's declared observation date.
- **Minimum meaningful signal:** at least 90% of eligible items contain a reviewable value hypothesis and forecast before execution, actual delivery economics after completion, and an outcome status with evidence or an explicit `not yet observable` reason.
- **Guardrail measure:** zero individual productivity rankings; zero claims that tokens, hours, story points, model speed, or closed-item counts are business value; zero ROI claims when realized value and cost do not share legitimate monetary units.

## Who this is for

Product Leads deciding what the POD should do next; Delivery and specialist roles estimating the work; humans making STEER gate rulings; and POD members learning whether completed work produced the intended result. The record must remain understandable to a contributor who did not create the item.

## Problem and why now

The Product Backlog shows workflow state, phase, priority, owner, and gate, but it does not explain why one item is worth doing, what delivery is expected to consume, what it actually consumed, or whether the promised outcome occurred. That makes prioritization subjective and can encourage misleading proxies such as ticket counts, elapsed time, story points, or token volume.

STEER also combines humans and multiple AI agents. Human active time, agent attempts, token use, provider spend, queue time, gate latency, rework, and business outcomes are different facts. Combining them into one productivity score would hide bottlenecks, penalize careful work, and invite gaming. The platform needs a governed Work Economics record before portfolio reporting or optimization is credible.

## What "done and correct" means

### 1. Four records remain visibly separate

Every eligible work item can hold four independently labeled sections. A missing section is shown as unknown or not yet due; it is never silently treated as zero.

| Record | Required information | When it becomes authoritative |
|---|---|---|
| **Value hypothesis** | value type; beneficiary; outcome metric; baseline; target; unit; observation date; outcome owner; impact, time criticality, strategic alignment, and confidence; supporting evidence | after Product Lead review at Gate 1 |
| **Delivery forecast** | size band; human active-time range by role; agent/provider cost range; complexity, uncertainty, and coordination bands; target cycle-time service level; comparable items or stated basis | before execution authorization |
| **Actual delivery economics** | human active minutes aggregated by role; agent/model/provider attempts, tokens, and metered cost; infrastructure/tool cost; cycle, wait, and gate latency; rework, defects, and rollback events | from telemetry or an audited correction after delivery |
| **Realized outcome** | status; observed metric or risk movement; observation date; verifier; evidence; confidence; forecast variance; explanation when inconclusive or negative | after the declared observation point and human verification |

### 2. The value hypothesis uses explicit types and evidence

The supported value types are:

- revenue or mission enablement;
- user/customer outcome;
- time or operating-cost reduction;
- risk, security, compliance, or reliability improvement;
- learning or option value; and
- platform capability or reuse.

An item may select more than one type, but it names one primary type. Non-monetary outcomes remain in their native unit. AI may propose an ordinal `Low`, `Medium`, or `High` value-confidence summary from the recorded drivers, but the UI must show the drivers and evidence beside it. The summary is advisory, not a claim of realized value and not an automatic ordering rule.

### 3. Forecast effort is a range, not a promise

- Size uses `XS`, `S`, `M`, `L`, or `XL` as a coarse comparison within the same POD and work type.
- Human effort is forecast as a minimum–maximum active-time range by role, not individual.
- Agent effort is forecast as a minimum–maximum metered cost range plus expected attempts. Token ranges may be retained for diagnostics but are not comparable across model families.
- Complexity, uncertainty, and coordination each use a documented five-level rubric. They remain separate because a small but uncertain item is not the same as a large, well-understood item.
- Elapsed cycle time is an operational service-level expectation and is never substituted for active effort.

### 4. Actual cost distinguishes work from waiting

- Human active time is logged in broad role totals with a correction trail. It excludes unattended elapsed time.
- Agent execution records provider, model identifier, attempts, input/output tokens where available, metered cost, and execution duration. Missing provider telemetry is labeled missing.
- Cycle time, queue time, blocked time, gate wait, and agent execution duration remain separately queryable.
- Rework identifies the originating phase when known. Defects and rollbacks remain visible rather than being hidden in a completion total.
- Access to person-level raw timing, if collected at all, is restricted; routine product views use role/POD aggregates.

### 5. Realized value requires later evidence

Outcome status is one of `not due`, `pending evidence`, `verified positive`, `verified neutral`, `verified negative`, or `inconclusive`. Closing a work item does not mark value as realized. The outcome owner records the observed native-unit result and links the evidence. If causal attribution is weak, the verifier records that limitation.

Forecast-versus-actual variance may be calculated for like units. Cost efficiency or ROI may be displayed only when both realized value and total cost have defensible monetary values and the assumptions are visible. Otherwise the platform presents cost and outcome side by side without inventing a ratio.

### 6. Authority and anti-gaming controls are explicit

| Decision or fact | AI/agent role | Human authority |
|---|---|---|
| Value hypothesis | proposes fields, evidence, confidence, and omissions | Product Lead owns beneficiary, metric, expected value, and Gate 1 ruling |
| Delivery forecast | proposes ranges from comparable evidence | assigned Delivery roles accept or edit the forecast before execution |
| Actual telemetry | emits signed/system-attributed events | authorized operator may correct attribution with an audit reason |
| Outcome verification | gathers evidence and flags mismatch | named outcome owner or Observe/Learn owner verifies the result |
| Challenge function | Critic identifies unsupported value, false precision, privacy risk, and gaming | gate owner resolves findings; agents never approve their own claims |

The platform never ranks individuals by output, speed, hours, tokens, cost, estimate accuracy, or closed-item count. POD-level learning may compare forecast calibration, flow efficiency, outcome attainment, rework, and cost trends when sample size and work type are shown.

### 7. Human-readable UI states are complete

- Backlog and My Work show a compact summary: `Value hypothesis`, `Effort forecast`, and `Outcome status`.
- The item drawer exposes the four full records, authority labels, evidence, AI recommendation, human edits, and audit history.
- Empty states explain who must provide the missing information and when it is required.
- Loading, unavailable telemetry, stale evidence, conflicting evidence, permission-denied, and validation-error states are distinguishable.
- Small screens preserve all information through stacked summaries or deliberate horizontal scrolling; columns are not clipped beneath navigation.
- AI-generated values are visually labeled and remain editable until the responsible human accepts them.

## Design intent

Work Economics should read like a decision brief, not an employee dashboard or accounting ledger. The first view answers four questions in order: **Why might this matter? What do we expect it to take? What did it take? What changed?** Color supports status but never carries meaning alone.

The backlog uses short native-unit summaries rather than one synthetic score. Selecting the summary opens a four-section drawer with evidence and authority close to each field. Forecasts are visibly marked as ranges, realized outcomes are time-stamped, and `unknown`, `not due`, and `inconclusive` are first-class states. AI suggestions use the existing advisory pattern and prefill editable reasoning for the human decision.

## Out of scope

- Implementing database schema, migrations, telemetry, UI, portfolio dashboards, or model routing in this brief.
- Creating a universal monetary value for safety, compliance, learning, mission, or user outcomes.
- Replacing product judgment with a composite score or automatically reprioritizing the backlog.
- Employee performance management, compensation, surveillance, utilization targets, or individual comparison.
- Treating story points, token use, elapsed time, model speed, or item counts as cross-team productivity measures.
- Billing, customer invoicing, chargeback, or moving money.
- Comparing PODs without controlling for work type, risk, evidence quality, and sample size.

## Risks and default-closed touchpoints

- **Privacy and labor risk:** detailed human activity can become surveillance. Store the minimum necessary, use role/POD aggregates in normal views, restrict raw access, define retention, and log corrections and access before Gate 2.
- **False precision and gaming:** one score can reward estimation behavior rather than outcomes. Preserve native units, display ranges and confidence, expose missing evidence, and prohibit individual rankings.
- **Financial interpretation:** cost and ROI may influence funding decisions. Monetary values require source, currency, period, and assumptions; non-monetary outcomes must not be forced into dollars.
- **Telemetry reliability:** provider token and cost reporting differs by model and may arrive late. Mark provenance and completeness; never convert missing telemetry to zero.
- **Design-system risk:** compact summaries can hide uncertainty or authority. Gate 2 must cover all responsive, empty, stale, unavailable, and permission states.
- **Causal attribution:** a positive metric movement may have other causes. Outcome verification records confidence and competing explanations.

This brief touches privacy-sensitive work telemetry and financial reporting semantics. The implementation is therefore default-closed if it adds personal-data storage or changes schema. Gate 2 must include a data inventory, purpose and retention rules, access controls, correction/audit behavior, a threat-model paragraph, migration and rollback tests, and evidence that no individual scoring is exposed.

The control plan is explicit:

- the Interim Tech Lead owns Gate 2 and must verify that the exam covers the data inventory, access controls, retention, audit trail, migration, rollback, and every UI state named above;
- the Security Owner reviews authentication, authorization, least privilege, telemetry integrity, and the threat model;
- the Product Lead owns privacy-purpose and financial-claim semantics and must reject unsupported ROI or productivity claims;
- the Product Designer reviews the responsive decision hierarchy, accessibility, and disclosure of AI versus human authority;
- the Platform / Ops Lead reviews provider-cost provenance, missing-telemetry behavior, reliability, and operational rollback; and
- Gate 3 requires the Product Lead, Tech Lead, and every tagged domain owner. Solo mode waits at least 24 hours before the Gate 3 ruling; team mode requires the named specialist signatures. The exact artifact revisions and the fresh-context Critic evidence remain attached to the ruling.

## Chosen approach

Use a four-record Work Economics model—value hypothesis, delivery forecast, actual delivery economics, and realized outcome—with separate authority, evidence, timing, and confidence. Prefer native units and ranges; allow an advisory value-confidence band for quick scanning, but do not collapse value, effort, cost, and outcomes into one productivity score.

Rejected: story points as delivered value; token or hour totals as productivity; a universal ROI formula; and automatic priority ordering. Each creates misleading comparability and can be optimized without improving business or mission outcomes.

---

GATE 1: APPROVED — authenticated Product Lead ruling recorded in STEER on 2026-08-14 at 2:30 PM America/New_York, bound to exact approved Brief revision `21d5e0bbd0e420413b7dce0d0c8b57b3d4e5d0e0`

GATE 1 EVIDENCE: Critic review #19; authenticated ruling by Idriss Enayat — “I approve Gate 1 for STR-017 — Define STEER Work Economics and value-realization model based on the exact linked evidence at revision 21d5e0bbd0e4. The current Critic Agent review found no automatic hard stop. No automatic hard stop was found, but 1 material concern should shape the human review. I considered the highlighted concern (Default-closed controls apply) and accept it as mandatory downstream controls that remain required at the named later gates. This approval authorizes Exam design only; it does not authorize credentials, implementation, release, or a later gate.”

DOCUMENTATION RECONCILIATION: The post-implementation Critic derived `#a11y` from the final diff under CORE-08. Adding that tag and reflecting the authenticated ruling above do not alter the approved Brief’s substantive intent or rebind the Gate 1 approval; the approval remains bound to exact revision `21d5e0bbd0e420413b7dce0d0c8b57b3d4e5d0e0`. See `steer/evidence/0006-work-economics-documentation-reconciliation.md`.
