# The 30-Day Runbook — zero to a testable STEER loop

Four weeks: rails, first feature, volume, verdict. Each day lists a goal and a
"done means" check. Days are working days; slide them as life requires — but keep
the order, because each week's output is the next week's input.

This is the first half of the 10–20-item evidence protocol in `PILOT-EVIDENCE-PLAN.md`.
Before Day 1, select the comparison baseline and freeze the v2 metric definitions.

**The daily rhythm (from Day 6 on):** 10 minutes each morning as your own steering
huddle — what's in flight, what's blocked on a ruling, what gets your attention today.
Rulings go straight into `operating-system/DECISION-LOG.md`.

---

## Week 1 — Rails (Days 1–5)

**Day 1 — Install the operating system.**
Repo created, trunk protected, this kit at `/steer`, empty `briefs/ exams/ reviews/ signals/` dirs.
Agent tooling configured with the standing instruction from `TOOLING-SETUP.md` §2.
Create the pilot ledger; record baseline items and known comparability limits.
*Done means:* an agent, asked "what rules govern your work?", answers from these files, and the pilot baseline is written.

**Day 2 — The gauntlet, v1.**
CI running on every PR: tests, typecheck+lint, gitleaks, dependency audit, license check
(CORE-01/02/03, SEC-01/02, LEGAL-01). Red blocks merge — verify by pushing a deliberate failure.
*Done means:* a PR with a planted secret cannot merge.

**Day 3 — Flags and deploys.**
Staging deploy on merge; production deploy one command; rollback one command (rehearse it
twice); config-file feature flags wired.
*Done means:* you can ship, hide, and un-ship a change without editing app code.

**Day 4 — Eyes and ears.**
Error tracking + basic analytics live in staging and production. `signals/` inbox created —
from today, every observation, complaint, idea, or error lands there and nowhere else.
*Done means:* a thrown test error appears in your tracker within a minute.

**Day 5 — Tracer bullet.**
Run the full loop on a trivial feature (`/health` endpoint): brief 0002, exam, builder,
Critic, gauntlet, Gate 3, staged ship. Zero manual infrastructure work permitted.
Gate-stacking today is legal under SOLO-MODE rule 3's *tracer exemption* — the
exemption is the class (no user-visible behavior), never the item; from brief 0003
on, the cooling-off rules apply in full.
*Done means:* the tracer-bullet test in `TOOLING-SETUP.md` passes; friction found today
gets fixed today.

---

## Week 2 — First real feature (Days 6–10)

**Day 6 — Sense & specify.**
Morning: pick the first real feature — smallest thing a real user would thank you for.
Evening: write brief 0003 fully, including design intent and tags. Do NOT sign it tonight
(SOLO-MODE rule 3). Complete the outcome contract: baseline, denominator, observation window, minimum signal, and guardrail.

**Day 7 — Gates 1 and the exam.**
Morning, fresh eyes: read the brief as a stranger, fix what confused you, sign Gate 1.
Architect agent proposes options; choose; record trade-off. Test Agent drafts the exam;
Critic attacks the brief; every finding becomes a test, a ruling, or a brief edit.

**Day 8 — Gate 2 and the build.**
New session: read the exam cold, sign Gate 2. Dispatch two Builders in parallel branches
(three only for items that already failed once — parallelism is diversity insurance,
priced per session). Critic reviews the leading diff. Your only jobs: answer escalations,
resist the urge to code. If you do touch the diff, log it in the metrics row's
"human touched diff?" column — hidden hand-fixes corrupt first-pass.

**Day 9 — Evaluate.**
Gauntlet first, then the human judgment checklist from the exam. If it fails, feedback
goes back to Build — a rebuild is hours, not a crisis. Cooling-off starts when a build passes.

**Day 10 — Ship and learn.**
Sign Gate 3 (respect the cooling-off; 24h if default-closed). Canary → ship. Append the
metrics row. Hold Learning Review #1 — even with a sample size of one, write it.
*Week 2 done means:* one real feature live, one review written, the loop felt end to end.

---

## Week 3 — Volume and honesty (Days 11–17)

- Run **2–3 items** through the loop, WIP never above 2, and mind SOLO-MODE rule 6:
  never more than two gate signatures in one session. Mix sizes; include at least one
  default-closed item (something touching data or email) to practice the long gate.
- **The honesty test (once this week, done right):** don't seed a defect you chose today —
  you'd only test the classes you already check for, and knowing changes how you review.
  Use the category bank you wrote at liftoff: have an agent inject one defect from it,
  unannounced, into a build branch. The gauntlet or Critic must catch it. Uncaught =
  the month's most valuable finding — add the guardrail and re-test.
- Learning Review #2: first real read of the metrics (machine-scored first-pass; expect
  it to be humbling — that's the brief-writing muscle still growing). Do the first
  **gate-decay check**: re-read one signed ◆3 cold and write what you'd now refuse.

---

## Week 4 — Volume, then verdict (Days 18–30)

- Keep shipping toward **~10 total items** through the loop by Day 30.
- **Start hiring:** post the Tech Lead role (see the Hiring Pack). Screening candidates
  against three weeks of real shipped work beats screening against a spec sheet.
- Practice one **same-day fix through the hotfix lane** (GATES.md): a real regression on
  a default-open surface ships same-day under ◆3 with its failing-then-passing test;
  the exam amendment and guardrail follow as a default-closed item within 48h. This is
  the loop's party trick — run it by the lane's rules, not around them.
- Learning Reviews #3 and #4. In #4, run the verdict against the thresholds from
  `operating-system/METRICS.md` and the pilot plan:

| Question | Healthy sign |
|---|---|
| Idea → verified | Days, not weeks — and trending down |
| First-pass rate | Above ~50% and climbing week over week |
| Escaped defects | Rare, and every one now has a guardrail |
| Cost per item | Something the business can afford at 10× volume |
| Outcome impact | Observed customer/business movement, with denominator and guardrail |
| Human attention | Judgment and governance load sustainable at the planned volume |
| You | Deciding and judging most of the day — not fixing agent code |

**Three possible verdicts, all wins:**
*Working* → continue to 10–20 comparable items before making broad claims; hire with evidence.
*Broken somewhere specific* → the metrics point at the phase to fix; run another two weeks.
*Not working* → you learned in 30 days, solo, what most orgs learn in a year. Write it up.

Publish failures, killed items, missing observations, overrides, and metric changes with the wins.

---

## The failure playbook (any week)

- **First-pass rate stays low** → briefs or exams are vague. Fix Phases 2–3; reread the
  worked example; do not blame the agents first.
- **You're fixing agent code by hand** → tooling not ready for your stack. Stop, improve
  prompts/config/model choice, or narrow the work you delegate. Hand-fixing silently is
  the anti-pattern: it hides the real capability level from your metrics.
- **You feel like the bottleneck** → you are; that's by design. Lower WIP before lowering standards.
- **Gates feel like rubber stamps** → re-run the honesty test this week. Verification
  theater discovered solo is embarrassing; discovered with users, expensive.
- **A default-closed item feels annoyingly slow** → good. That's the system working.
