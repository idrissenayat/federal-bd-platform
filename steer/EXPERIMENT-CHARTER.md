# STEER Agentic SDLC experiment charter

## Purpose

The federal BD platform is a real product and must solve a real problem. Its deeper purpose in this repository is to generate honest evidence about STEER as an Agentic SDLC.

The experiment asks whether STEER's specific operating mechanisms—intent briefs, exams before code, explicit human gates, fresh critique, agent execution, controlled release, and learning reviews—improve verified delivery compared with a competent conventional workflow.

## Primary decision

After the comparative cohort, choose one:

- **Continue:** STEER shows a meaningful advantage without unacceptable guardrail harm.
- **Adapt and repeat:** evidence identifies a correctable STEER mechanism or configuration defect.
- **Stop:** STEER adds control cost without enough verified benefit.

The decision is about this implementation and context. One product cannot establish universal SDLC superiority.

## Comparison design

### Primary comparison: agent-assisted STEER vs agent-assisted Kanban control

Both workflows receive:

- The same product, repository, people, AI/model access, development environment, CI/security requirements, coding standards, and release infrastructure.
- Comparable, independently useful work items selected before treatment assignment.
- The same obligation to produce secure, maintainable, outcome-bearing software.

The process treatment differs:

| STEER treatment | Kanban control |
|---|---|
| Intent Brief and outcome contract before build | Competent work item with goal and acceptance criteria |
| Exam committed before implementation | Tests may be written in the team's normal sequence |
| Three evidence-backed human decision points | Normal product/code/release review policy |
| Fresh Critic and explicit ambiguity attack | Normal peer/agent review used by the control team |
| STEER Learning Review and guardrail conversion | Normal retrospective/flow review |

The Control workflow must not be intentionally bureaucratic, under-specified, or deprived of normal good engineering. Agents may implement in both conditions; otherwise the comparison would confound STEER with access to AI labor.

### Secondary context

Historical human-centric Scrum or Kanban results may provide context, but differences in people, tools, product maturity, and work mix mean they are not treated as causal proof.

## Cohort and allocation

1. Select 10–20 independently useful items across at least two work types and three risk/size bands.
2. Before assignment, write a short neutral candidate card containing the user problem, expected outcome, dependencies, and a blind size/risk estimate.
3. Form matched pairs or blocks using work type, risk, size, and dependency level.
4. Randomly assign one item in each pair/block to STEER and the comparable item to Control.
5. Record assignment before detailed specification or implementation begins.
6. Do not reassign after difficulty or results become visible. Record killed, blocked, and abandoned items.
7. Alternate or randomize sequence within blocks to reduce learning and calendar effects.

If fewer than five credible matched pairs can be formed, label the result a feasibility study rather than a comparative framework test.

## Primary KPIs

### 1. Verified outcome yield

**Definition:** items meeting their predeclared acceptance criteria and observable product outcome within the stated window, divided by all items started in that workflow.

**Why:** prevents faster delivery from winning when the software fails to create value.

**Caveat:** outcome windows may be slow or causally weak; report verified release and observed outcome separately when necessary.

### 2. Time to verified release

**Definition:** elapsed time from treatment assignment/work start to verified, releasable software; report median, range, and paired difference. Killed items remain in the denominator of outcome yield.

**Why:** directly tests STEER's speed promise without measuring typing volume.

**Guard against gaming:** segment by preassigned size/risk and pair with outcome yield, escaped defects, and killed items.

### 3. Qualified human hours per verified outcome

**Definition:** active human time spent specifying, deciding, reviewing, correcting agent work, governing, and responding to failures, divided by verified outcome-bearing items.

**Why:** human judgment is the scarce resource STEER claims to protect.

**Guard against gaming:** record role and activity category; do not exclude rework, setup, or gate wait caused by the process.

## Diagnostic drivers

- First-pass verification rate.
- Post-approval brief/exam changes and ambiguity escalations.
- Rework hours and number of build attempts.
- Human gate/decision latency versus machine execution latency.
- Process adherence and bypass count for STEER items.
- Work-in-progress and blocked time.

These explain results; they are not success metrics by themselves.

## Guardrails

- Escaped defects by severity and canary rollback count.
- Security/privacy/control failures.
- Fully loaded cost per verified outcome.
- Team cognitive-load/trust pulse plus qualitative failure notes.
- Product-specific outcome and source-integrity measures from the Product Charter.
- No hidden or autonomous state transitions.

## Provisional claim thresholds

Freeze final thresholds after baseline/calibration and before the comparative cohort. Until then, the provisional bar for “promising in this context” is:

- At least 20% lower median time to verified release, **and**
- At least 15% lower qualified human hours per verified outcome, **and**
- No meaningful decline in verified outcome yield or product guardrails, **and**
- Directionally favorable paired results across a majority of matched pairs rather than one large outlier.

These thresholds are decision aids, not statistical proof. Report ranges, pair-level differences, missing observations, and contrary cases.

## Evidence capture

Every item uses `templates/experiment-item-ledger.md`. Capture:

- Treatment assignment, block/pair, and pre-treatment size/risk.
- Exact people, model/tool versions, and environment.
- Start, decision, build, verification, release, and outcome times.
- Human active minutes by activity.
- Rework, killed attempts, defects, rollbacks, and process bypasses.
- Product outcome and guardrail result.
- Dissenting interpretation and contamination/carryover notes.

## Bias and contamination controls

- Do not choose treatment after seeing item difficulty.
- Do not give STEER better people, models, prompts, or infrastructure.
- Do not withhold normal tests, review, or security controls from Control.
- If STEER practices leak into Control, record contamination rather than pretending separation.
- If the team improves over time, sequence/block data must remain visible.
- When possible, have outcome acceptance performed by a reviewer who does not know the treatment.

## Claim rules

Allowed after one successful tracer: “STEER is operationally feasible here.”

Allowed after a credible comparative cohort: “STEER showed [specific measured advantage/disadvantage] in this product, team, toolchain, and work mix.”

Not allowed from this project alone: “STEER is proven superior to Scrum/Kanban” or “STEER works universally.”

