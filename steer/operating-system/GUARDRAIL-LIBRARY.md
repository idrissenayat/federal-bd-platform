# Guardrail Library

The written rulebook every build is checked against. Each guardrail has an ID, a rule,
and an enforcement level. Exams reference guardrails by ID. The library only grows:
**every escaped defect becomes a new guardrail** (that conversion happens at the
Learning Review — it is the single most important habit in this system).

Enforcement levels:
- **AUTO** — runs in the gauntlet on every PR; red blocks merge.
- **AGENT** — checked by the Critic/domain agent on every diff; findings block Gate 3 until ruled on.
- **MANUAL** — human checklist item at Evaluate (aim to promote these to AUTO over time).

## Core

| ID | Rule | Level |
|---|---|---|
| CORE-01 | All tests pass; new behavior in the exam has a test | AUTO |
| CORE-02 | Typecheck and lint clean | AUTO |
| CORE-03 | No secrets, keys or credentials in code or config | AUTO (gitleaks) |
| CORE-04 | No dead flags: shipped-at-100% flags removed within 2 weeks | MANUAL |
| CORE-05 | The diff touches nothing outside the brief's scope | AGENT |
| CORE-06 | Every escalated question got a ruling in DECISION-LOG.md, not a guess | AGENT |
| CORE-07 | Exam files are frozen at ◆2: any diff touching exams/ after a GATE 2 line exists fails unless authored/approved by the Tech Lead | AUTO |
| CORE-08 | The Critic derives tags from brief AND final diff; a domain in the diff but missing from the tags blocks ◆3 and auto-applies the tag | AGENT |
| CORE-09 | The gauntlet's own wall-clock stays under budget (10 min); a run over budget is itself a red check assigned to the Platform Engineer | AUTO |
| CORE-10 | Gate signatures respect mandated separation: sessions apart for ◆1/◆2; at ◆3 an immutable exact-candidate readiness snapshot enforces 0h default-open, 4h elevated, or 24h default-closed (or the complete qualified-human/team path), with no automatic ripening | AUTO |
| CORE-11 | Gate approval evidence ties an authenticated approver to the exact brief/exam/commit; a typed timestamp alone never satisfies a gate | AUTO |

## Security (#security)

| ID | Rule | Level |
|---|---|---|
| SEC-01 | No plaintext secrets; secrets loaded from env/secret store only | AUTO |
| SEC-02 | Dependency audit clean of known criticals; new deps justified in the PR | AUTO |
| SEC-03 | Every new endpoint has an explicit authn/authz statement in the exam | AGENT |
| SEC-04 | User input validated/escaped at boundaries (injection, XSS) | AGENT |
| SEC-05 | Default-closed items: threat-model paragraph in the brief before Gate 1 | MANUAL |

## Privacy (#privacy)

| ID | Rule | Level |
|---|---|---|
| PRIV-01 | No PII in logs, analytics events, or error reports | AGENT |
| PRIV-02 | New personal-data fields recorded in the data inventory with purpose + retention | MANUAL |
| PRIV-03 | Deletion path exists for any personal data collected | AGENT |

## Accessibility (#a11y)

| ID | Rule | Level |
|---|---|---|
| A11Y-01 | axe-core scan clean on changed pages | AUTO |
| A11Y-02 | Full keyboard operability for new interactions | AGENT |
| A11Y-03 | Images/controls have accessible names; contrast meets WCAG AA | AGENT |

## Reliability (#reliability)

| ID | Rule | Level |
|---|---|---|
| REL-01 | Perf budget respected (page weight / p95 latency defined per surface) | AUTO |
| REL-02 | New features emit success/failure telemetry before shipping | AGENT |
| REL-03 | Rollback path stated in the exam for anything touching data or infra | MANUAL |
| REL-04 | Every shipped item emits the outcome and guardrail telemetry named in its brief, or records why observation is impossible | AGENT |

## Legal (#legal)

| ID | Rule | Level |
|---|---|---|
| LEGAL-01 | Dependency licenses compatible with the product's licensing | AUTO |
| LEGAL-02 | No claims in UI/marketing copy the product can't substantiate | MANUAL |

## Design (#design-system)

| ID | Rule | Level |
|---|---|---|
| DES-01 | UI built only from design-system components/tokens; new patterns need a brief | AGENT |
| DES-02 | Empty, loading, and error states specified and built for every new view | AGENT |

---

*Adding a guardrail:* new row + ID, note the incident/reason in the Learning Review,
and if AUTO, add the gauntlet job in the same PR. Escape-conversions are **exempt**
from the Learning Review's 1–2-changes-per-week cap — safety additions never queue.

*Keeping growth from killing the gauntlet* (the library only grows; the 10-minute
budget doesn't): the Platform Engineer owns the gauntlet-time budget (CORE-09
enforces it); a **quarterly consolidation pass** merges and refactors guardrails —
coverage-preserving changes are default-open; only coverage-*reducing* changes are
default-closed; and MANUAL guardrails are capped at **7 concurrent** — an eighth
forces a promotion to AUTO/AGENT or a retirement, so the human checklist can't
silently bloat.
