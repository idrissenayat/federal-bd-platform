# Metrics — outcomes, flow, quality, human load, and economics

*v2.0 — adds outcome evidence and human judgment capacity while retaining the original delivery measures.*

Collected per item; reviewed weekly. No number is classified solely by the person it audits.

## What counts as an item

An item is **independently shippable, user-visible value**: it could ship alone and a user would notice. The Gate 1 approver attests this in the brief. Record killed items and missing observations; neither may disappear from the denominator.

## Five core measures

1. **Outcome impact** — the brief-specific customer or business measure, baseline, exposure denominator, observation window, and guardrail measure. Report the change and uncertainty. Say *observed* unless the design supports a causal claim. An item without observable impact is labeled `not yet observed` or `not measurable`, never silently successful.
2. **Idea → verified time** — from pull into flight to full verification. Also record **idea → observed outcome** when the observation window closes. Segment by item risk/size; investigate rather than average away long tails.
3. **First-pass verification rate** — percentage whose first build passed the **gauntlet + Critic** with no blocker findings, machine-recorded. Human judgment rejections remain a positive companion measure and do not reduce first-pass.
4. **Escaped defects** — any problem found after release, including canary rollbacks. Record severity and fix-path classification (brief, exam, gauntlet, judgment, or operating gap). The Critic drafts classification; a human may raise but not lower severity. Convert every escape to a guardrail or explicitly document why not.
5. **Cost per shipped item** — report both:
   - **Operational tool cost:** agent/API + seats + hosting/infrastructure.
   - **Fully loaded delivery economics:** operational tool cost + imputed value of human judgment/fixing time.

Also report marginal token/API cost. Human time is an editable planning assumption, not a cash-expense claim.

## Human-attention companions

- **Judgment hours per item:** time reading briefs/exams/diffs, making rulings, and evaluating outcomes.
- **Human diff-fixing hours:** direct edits to agent output, shown separately because hidden fixes flatter agent capability.
- **Standing governance hours/week:** huddles, Learning Review, platform/fleet upkeep, and gate administration.
- **Judgment rejections:** human rejections after a green gauntlet. Zero across 10 items triggers a rubber-stamp review.

## Anti-gaming pairs

| Primary measure | Pair it with |
|---|---|
| Outcome change | Exposure denominator, guardrail measure, and observation completeness |
| Idea → verified | Item risk/size, killed items, and idea → observed outcome |
| First-pass rate | Judgment rejections, human-touched-diff flag, and rebuild count |
| Escaped-defect rate | Absolute escapes/week and severity |
| Cost/item | Human hours, marginal cost, and volume |
| Items shipped | Gate signatures per observed outcome |

## Per-item log

| Brief | Title | Risk/size | Into flight | ◆1 | ◆2 | First pass? | Judgment rejects | Human judgment h | Human diff-fix h | ◆3 | 100% rollout | Outcome / baseline | Observe by | Outcome result | Rollbacks | Escapes / severity | Tool cost | Fully loaded cost |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0001 | (example) Waitlist | M / default-closed | — | — | — | — | — | — | — | — | — | Confirmed signups / 0 | — | — | — | — | — | — |

## Weekly snapshot

- Items shipped and killed:
- Outcome observations due / completed / positive / neutral / negative:
- Median idea → verified; median idea → observed outcome:
- First-pass rate (rolling 10) and judgment rejections:
- Canary rollbacks and escaped defects by severity:
- Human judgment hours; human diff-fixing hours; standing governance hours:
- Tool/agent/infra spend; fully loaded delivery economics:
- Missing observations or metric-definition changes:

## Pilot verdict

After 10–20 items, compare against the baseline using `PILOT-EVIDENCE-PLAN.md`. STEER is healthy when outcomes and quality improve or hold, delivery is acceptably fast, and human load/economics remain sustainable. A faster process that does not improve observed outcomes is not validated.
