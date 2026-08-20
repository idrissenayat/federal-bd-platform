# Gates, Tags, and the Default-Closed List

*v2.0 — preserves the three decision points while strengthening evidence of identity, sequence, and enforcement.*

## The three gates

| Gate | What it approves | Signed by (full team) | Signed by (solo mode) |
|---|---|---|---|
| **◆1 Spec** | The Intent Brief: worth doing, clearly defined, testable, **tagged, design intent included** | Product Lead | You, after a full re-read, in a later session than the writing |
| **◆2 Exam** | Tests, evals & guardrails fully express "correct" | Tech Lead | You, in a different session than Gate 1 |
| **◆3 Ship** | The verified build should reach users | Product Lead + Tech Lead + every required domain owner | You, after system-enforced risk-based readiness |

**The independent-perspective rule at ◆3.** An error shared by the brief and the exam cannot be
caught by the people who wrote them. Every ◆3 therefore includes one reader who
authored **neither** the brief nor the exam — on a team, the Product Designer or a
rotating peer; solo, a mandatory fresh-context Critic run over brief + exam + build
together. A fresh context or different model family reduces correlated blind spots but is
not truly independent and does not replace deterministic checks or a qualified human for
high-risk domains. Overriding that reader's blocker findings is itself a default-closed action.

Sign format, inside the brief/exam file — **timestamped, not just dated**:

```
GATE 1: APPROVED — 2026-08-14T09:12 — IE
```

A typed signature line is the human-readable audit note, not the sole proof. A gate is passed only when the repository also records an authenticated reviewer/approver identity and the required CI check confirms the right approver, artifact version, and sequence. Solo mode records the authenticated account plus the cooling-off check. Agents must treat an
unsigned or unverified brief/exam as a hard stop, and the gauntlet verifies that gate timestamps
respect the mandated separations (different sessions for ◆1/◆2; the ◆3
risk-based readiness path). Protect the approval workflow and required checks with branch rules; do not accept a client timer or timestamp edited by the Builder as evidence. Batch-signing is machine-visible.

The three gates are **three decision points**, not necessarily three meetings or three different people. Minimum Viable STEER may use one human with time separation; higher-risk or team work adds named independent humans.

**The exam freezes at ◆2.** From the moment an exam file carries a GATE 2 line, any
diff touching it fails the gauntlet unless the commit is authored or explicitly
approved by the Tech Lead (guardrail CORE-07). Builders make code pass tests; they
do not make tests pass code.

## Brief tags

Tags declare which specialist domains an item touches. They trigger extra guardrails,
the default-closed cooling-off, and — with a team — who co-signs ◆3.

`#security` `#privacy` `#a11y` `#legal` `#reliability` `#design-system` `#money`

`#design-system` maps to the **Product Designer** as its ◆3 co-signer (org scale:
the design-system steward).

**Tags are verified, not trusted.** The Critic independently derives tags from the
brief AND the final diff; any domain present in the diff but missing from the brief's
tags blocks ◆3 and auto-applies the tag (guardrail CORE-08). Critic-added tags are
tracked per 10 items — chronic under-tagging is a Product Lead metric, so skipping
a tag costs more than writing one.

## The default-closed list (starter)

Items matching any of these **never auto-ship** and get the long cooling-off
(solo: 24h; team: named human signature):

- Authentication, authorization, session handling
- Anything that moves or charges money
- Collection, storage, or new use of personal data
- Destructive data operations (migrations, deletes, schema changes)
- Anything that sends communications to users at scale (email blasts, notifications)
- Changes to this file, the guardrail library, or **the exam of any item after its
  ◆2 signature** (not merely shipped items — see the freeze rule above)
- Overriding a blocker finding from the independent ◆3 reader

Everything else is **default-open**: green gauntlet + Gate 3 signature ships it.

## Gate 3 release-readiness policy v1

For receipts created after policy v1 activation, the server freezes an immutable
`steer.gate-readiness-snapshot/v1` after exact staging verification and a passing
exact-target Critic result. It applies one closed vocabulary:

- `DEFAULT_OPEN`: 0-hour time separation (`NONE` only).
- `ELEVATED`: 4-hour time separation, or one distinct qualified enrolled human for
  every derived domain.
- `DEFAULT_CLOSED`: 24-hour solo separation, or in team mode Product Lead, Tech
  Lead, every required domain owner, and at least two distinct eligible humans.

Authentication/authorization/session, money movement, new personal-data use,
destructive data, mass communication, governance-control changes, and overriding a
Critic blocker are always default-closed. Non-destructive persistence, external
providers, availability infrastructure, non-auth security, privacy without new data,
legal claims, accessibility UI, and non-charge cost changes are elevated. Missing,
unknown, malformed, mismatched, or under-tagged inputs fail closed.

The clock starts at the snapshot-bound staging verification completion time. Passing
time or receiving a signature never creates a ruling automatically: an authenticated
human must explicitly finalize, and the server rechecks the exact candidate, Critic,
current roles, selected path, and policy. Material drift invalidates the snapshot and
requires a replacement snapshot, session, and intent. Historical receipts retain the
policy and timing under which they were created; this policy never accelerates them.

## The hotfix lane

The exception that keeps same-day bug fixes legal without bending the gates:

A **regression fix** — a bug in shipped behavior, on a default-open surface — may
ship same-day under ◆3 alone, provided the diff is covered by a new failing-then-
passing regression test committed alongside it. The permanent bookkeeping (amending
the shipped exam, converting the escape to a guardrail) follows as its own
default-closed item within 48 hours. The lane exists for regressions only: new
behavior, however small, takes the normal loop, and nothing on the default-closed
list may use the lane.

Review this file at the Learning Review whenever an incident or near-miss suggests
it's too loose or too tight.
