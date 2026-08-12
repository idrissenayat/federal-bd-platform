# STEER Starter Kit v2.0 — revision notes

**Released:** 2026-08-12  
**Preservation rule:** the files one directory above `v2/` are the unchanged original edition. This directory is the revised edition. Nothing in the original was overwritten. `ORIGINAL-CHECKSUMS.sha256` records and verifies all 20 original files.

## Why this edition exists

The original kit is a strong operating hypothesis: it makes intent, evaluation, release safety, and learning explicit in a way that is unusually usable by agent-heavy teams. Its main weakness was confidence ahead of evidence. It sometimes presented one detailed operating configuration as universal, measured delivery more strongly than customer outcomes, and treated model diversity as if it created full independence.

v2 keeps the core idea — **agents do the labor; humans make the consequential decisions** — while making the framework easier to start, harder to game, and more honest about what still needs proof.

## What changed and why

| Change | Why | Main files |
|---|---|---|
| Added customer/business outcome measurement | Fast delivery is not valuable if the shipped outcome does not improve the user or business condition named in the brief | `README.md`, `operating-system/METRICS.md`, brief/review templates, examples |
| Added Minimum Viable STEER | Four lanes, seven named agent roles, and parallel builders are useful scaling patterns, not entry requirements | `README.md`, `TOOLING-SETUP.md`, `SOLO-MODE.md`, `agents/agent-roles.md` |
| Reframed Agile language | Teams should retire ceremonies whose cost exceeds their value, not dismiss an entire family of practices | `README.md`, deck, handbook |
| Defined model diversity as diversity insurance | A separate context or model family reduces correlated blind spots but does not create true independence or replace deterministic checks and qualified human review | `GATES.md`, `agent-roles.md`, deck, handbook |
| Added human judgment capacity and imputed cost | Tool spend alone understates the scarce resource STEER is designed around: qualified human attention | `METRICS.md`, calculator, handbook, deck |
| Added a 10–20 item pilot protocol | The framework should earn broader adoption through a baseline comparison and published failures, not assertion | `PILOT-EVIDENCE-PLAN.md`, `RUNBOOK-30-DAYS.md`, deck, handbook |
| Clarified five moves vs. seven phases | The five moves are the conceptual model; the seven phases are the operating implementation | `README.md`, deck, handbook |
| Strengthened gate evidence | A typed timestamp is an audit note, not strong proof of identity or enforced sequence | `GATES.md`, `GUARDRAIL-LIBRARY.md`, templates, checklist |

## What did not change

- Brief before build; exam before implementation.
- Three consequential decision points: approve intent, approve the exam, approve release.
- Default-closed treatment for high-risk work.
- The exam freezes at Gate 2.
- Escaped defects become permanent learning.
- WIP is constrained by human attention.

## Evidence status

STEER v2 is a **testable operating framework**, not a proven universal replacement for Scrum, Kanban, or other delivery systems. Internal stress testing informed the controls. External validity must come from pilots that report both successes and failures using `PILOT-EVIDENCE-PLAN.md`.
