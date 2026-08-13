# STEER operating model

STEER organizes delivery around seven states: **Sense, Frame, Engineer, Evaluate,
Release, Observe, and Learn**. The letters are a lifecycle, not mandatory ceremonies.
Teams pull work when authorization, evidence, and human decision capacity are available.

## The durable hierarchy

- An **organization** owns policies, identity, approved adapters, audit, and PODs.
- A **POD** is a stable delivery unit of humans and agents with named decision owners.
- A **project** owns a product context, repository, guardrails, signals, and outcomes.
- A **work item** is the atomic unit of authorization and evidence.
- A **specialist attachment** temporarily adds a human or agent to a bounded POD/project
  purpose and expires or is revoked when that purpose ends.

A POD may run several projects. An organization may run several PODs. People and agents
can participate in more than one POD only through explicit, visible memberships; access
and work authorization never follow from presence in a chat channel.

## The flight loop

| State | Required result | Primary owner |
|---|---|---|
| Sense | Evidence-backed signal or problem | Scout / Product Lead |
| Frame | Intent brief, outcome, risks, tags, scope, Gate 1 | Product Lead |
| Engineer | Chosen approach and implementation against the frozen exam | Architect / Builder |
| Evaluate | Automated checks, Test evidence, fresh Critic findings, human judgment | Test / Critic / specialists |
| Release | Gate 3 ruling, controlled exposure, rollback readiness | Product + Tech Leads |
| Observe | Outcome and guardrail measurements | Ops / Product Lead |
| Learn | Decision to keep, adapt, stop, or add a guardrail | POD Learning Review |

## Three human gates

1. **Gate 1 — Spec:** the work is worth doing and the intent is clear and testable.
2. **Gate 2 — Exam:** correctness is adequately expressed before the build adapts to it.
3. **Gate 3 — Ship:** the verified result should reach users.

Agents can prepare the evidence but cannot approve these decisions. Higher-risk tags add
specialist review and cooling-off. A gate is valid only when authenticated evidence binds
the approver, artifact revision, and sequence.

## Work and communication rule

The Work Management system is the authority for priority, assignment, scope, state, and
human rulings. Communication tools coordinate questions and handoffs. Source control and
CI preserve engineering evidence. A team can replace any tool as long as its adapter
preserves this contract.

## Self-optimization without self-exemption

STEER observes verified outcomes, flow, quality, cost, human attention, bypasses, and
team experience. The Learning Review converts repeated failures into proposed changes,
but limits routine process changes to prevent oscillation and gaming. Changes to gates,
guardrails, authorization, or evidence are themselves default-closed STEER items.

The objective is not maximum agent activity. It is more verified, useful outcomes per
unit of scarce human judgment without unacceptable harm.
