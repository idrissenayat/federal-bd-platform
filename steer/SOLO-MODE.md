# Solo Mode — wearing every hat without fooling yourself

*v2.0 — adds evidence-grade gates, explicit model-diversity limits, and human-attention measurement.*

STEER's safety comes from separation: the person who writes the spec is checked by the
person who writes the exam, and both are checked by the exam itself. Solo, you lose the
second human — so you replace human separation with **time separation, context separation,
and automation**. These seven rules are the whole of solo mode. They are cheap. Do not skip them.

## The seven rules

**1. Never build without a signed brief.**
"Signed" means the brief file contains `GATE 1: APPROVED — <timestamp> — <initials>`.
The act of signing is a deliberate pause: read the brief top to bottom as if a colleague
wrote it, then sign. If you can't be bothered to read it, it isn't ready.

**2. The exam is committed before the first build branch opens.**
No exceptions, including "tiny" changes. The discipline is the product: the moment you
let one feature skip the exam, the exam becomes optional, and optional means gone.
(Genuinely trivial changes — typos, copy — use the standing class defined in
`templates/trivial-exam.md`, copied once to `exams/trivial.md`.)

**3. System-enforced release readiness replaces the second signer.**
Sign Gate 1 and Gate 2 in **different work sessions** (evening brief, morning sign is ideal).
For Gate 3, the platform freezes exact staging verification and Critic evidence, derives
a closed-vocabulary risk tier, and enforces 0 hours for default-open, 4 hours for elevated,
and 24 hours for default-closed work. The clock is separation, not assurance: the Critic,
tests, and domain controls remain mandatory. Passing time never approves or ships work;
return in a fresh session and explicitly finalize after the server reports `READY`.
Missing, unknown, mismatched, under-tagged, or drifted evidence fails closed and requires
a replacement snapshot/session/intent. Older receipts keep their original 24-hour rule.
*Exemption — the tracer class:* infrastructure tracer bullets (features with no
user-visible behavior, e.g. a /health endpoint) may stack their gates in one day.
The exemption is the class, never the item — a real feature never qualifies.
*Regression fixes:* use the hotfix lane in GATES.md, not a bent gate.

**4. The Critic is never the Builder's chat continued.**
Run the Critic as a fresh agent context with the adversarial prompt from
`agents/agent-roles.md` — and, when practical, **from a different model family than the
builder** (see TOOLING-SETUP: Codex is the reference cross-vendor critic lane).
A same-model Critic in a fresh context is the floor. A different model family reduces some
correlated blind spots but does not remove them and is not independent assurance. Deterministic
checks and qualified human review remain mandatory where the risk requires them.

**5. WIP limit is 2.**
Two items in flight, maximum. Solo, your attention is the entire human layer of the
company. The queue can wait; a half-attended gate cannot.

**6. No more than two gate signatures per session — never two for the same item.**
Batching signatures is how the deliberate pause dies quietly. If Wednesday stacks a
rebuild triage, a Gate 2, and a candidate screen, the Gate 2 waits for its own session.
This rule exists because under load you will want to break it — that want is the signal.

**7. The Learning Review happens even though it's just you.**
Thirty minutes, weekly, written into `reviews/` using the template. The two questions
(what did users teach us / where did specs or tests fail us) plus the metrics snapshot.
Skipping it because "I already know what happened" is how solo founders lose the thread.
The written record is also what makes your first hire's onboarding take a day instead of a month.

## Honest limits of solo mode

Self-review has a ceiling. Time separation catches most spec-blindness; it does not catch
what you don't know (security subtleties, accessibility depth, legal exposure). Mitigate:
run the domain-agent guardrails from day one (they encode expertise you don't have),
keep the default-closed list conservative, and buy fractional human review for anything
touching money, auth, or personal data **before** real users arrive.

Two solo-specific integrity checks (both in the runbook's cadence):
- **The honesty test, done right:** a defect you seed yourself only tests the classes you
  already check for. Instead, keep a private bank of defect categories written weeks in
  advance and have an agent inject one, unannounced, at a random point each month —
  the gauntlet or Critic must catch it without you knowing what or when.
- **The gate-decay check:** monthly, re-read one of your own signed ◆3s cold and write
  down what you would now refuse. If the answer is repeatedly "nothing," your reviews
  are either excellent or theater — and the seeded test can't tell you which; this can.

## Minimum solo configuration

Start with one Builder, one fresh Critic session, the core gauntlet, and the three decision
points. Do not buy four lanes or run parallel builders by default. Add capacity when the
activation triggers in `TOOLING-SETUP.md` fire. Log both **judgment hours** and **hours spent
editing agent diffs**; hidden human labor makes the economics and capability claims false.

The first full-time hire (Tech Lead) retires rule 3 — that's why they're first.

## What changes with each hire

| Hire | They take | You keep | Rules retired |
|---|---|---|---|
| Tech Lead | Gate 2, exam ownership, judgment review, Critic tuning | Gates 1 & 3 | Rule 3 time separation for Gates 1/2 |
| Product Designer | Design intent, design system, UX judgment, independent ◆3 reader | — | Solo ◆3 Critic-reader stand-in |
| Platform Engineer | Fleet, pipeline, rails, cost watch | — | Your infra hat |
| Fractional specialists | Their guardrail set + tagged co-signs | — | Solo caution on their domain |
