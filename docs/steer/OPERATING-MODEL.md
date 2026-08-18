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

## Normative Codex supervision boundary

Codex is the STEER platform supervisor, temporary runtime host, and observer. **Codex is
not a member of the Agentic SDLC delivery team.** The named Scout, Architect, Builder,
Test, Critic, Docs, or Ops Agent owns every deliverable assigned to that role.

Codex may start, monitor, stop for safety, and perform read-only troubleshooting on a
named-agent run authorized by its delivery work item. Codex may configure, evaluate, or
improve **agent, runtime, or platform configuration only** under a separate authorized
platform work item that binds the exact configuration revision, capability, and scope.
Those powers never extend to the current delivery artifact, its content, or its
evaluation decision; ambiguous repair authority is denied. Codex must not:

- impersonate a named agent or silently complete that agent's assigned work;
- edit, replace, or finish a failed agent deliverable while diagnosing or repairing the
  agent, runtime, or platform;
- fabricate activity, evidence, results, or performance;
- bypass STEER authorization, evidence requirements, or a human gate; or
- count Codex-authored output as agent performance.

Until a native runtime can launch agents, the bootstrap protocol is:

1. An authorized work item names the delivery agent, scope, next action, and controlling
   evidence before Codex starts a separate, role-bound run for that agent.
2. The run record identifies the agent and version, role instructions, runtime host,
   model/provider, inputs, actions, outputs, evidence, timing, cost when available, and
   failures. The agent and supervisor use distinct principals: their events and artifact
   boundaries are separately authenticated or independently attested, append-only, and
   immutable. A supervisor-authored agent event, rewritten history, forgeable display
   name, or unsegmented mixed output is not agent-performance evidence.
3. Buzz may expose claims, progress, blockers, and handoffs, but it does not authorize
   work or prove performance. STEER Work Management remains authoritative for assignment,
   state, scope, and human rulings; durable output and evaluation evidence remain in the
   repository or other approved evidence system.
4. Human or evaluator feedback cites the exact run and agent version. A correction
   creates a new version whose affected evaluation scenarios are replayed before broader
   use; the original run is not rewritten. The evaluated agent cannot grade itself or
   access blind holdouts or scoring oracles before scoring. Evaluator identity, fixture
   access, and feedback release are logged; contamination invalidates the score and
   requires an uncontaminated fixture.
5. If an agent cannot execute, Codex stops the run, records the failure and blocker,
   escalates through the work item and `#agent-ops`, and helps repair or reconfigure the
   agent under an authorized platform work item. The failed deliverable remains sealed;
   only a successor named-agent run may correct or finish it.

After a named-agent run is failed or blocked, an emergency intervention requires a new,
explicitly human-authorized run recorded on the work item with the source run, exact
scope, start and expiry, permitted actions, and evidence destination. Every resulting
artifact and message must be labeled **Codex emergency intervention**. The intervention
cannot approve a gate, is counted only as supervisor intervention—not agent work or
performance—and requires a review of the failed agent/runtime before normal execution
resumes.

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
