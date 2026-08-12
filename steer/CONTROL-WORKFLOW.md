# Agent-assisted Kanban control workflow

This is the credible comparison condition for the STEER experiment. It is intentionally competent. A weak control would make the experiment meaningless.

## Shared with STEER

- Same product goals and outcome obligations.
- Same people, agent/model access, repository, environments, CI, security checks, coding standards, branch protection, release safety, and observability.
- Same public-unclassified data boundary and product guardrails.
- Same experiment ledger and human-time capture.
- Same right to clarify ambiguity and stop unsafe work.

## Normal workflow

1. Product owner pulls the next eligible item from the Kanban queue.
2. The item contains a user/problem statement, expected outcome, acceptance criteria, dependencies, and risk tags at the team's normal level of detail.
3. Work begins when the item satisfies the team's Definition of Ready and WIP limit.
4. The team and agents design, implement, and test in the sequence they judge appropriate. Tests need not be frozen before code.
5. Normal code review, CI, security checks, product acceptance, and release approval apply.
6. The item ships through the same reversible release infrastructure and product telemetry as STEER work.
7. Flow review/retrospective captures defects and process learning at the control team's normal cadence.

## Explicit non-STEER conditions

- No mandatory STEER Intent Brief.
- No mandatory exam committed and frozen before implementation.
- No mandated three-gate approval topology.
- No mandated fresh-context Critic role.
- No requirement that every escape become a formal guardrail, unless normal control practice already does so.

Control participants may still use good judgment, write tests first, request independent review, improve acceptance criteria, or hold useful meetings. Those are not forbidden merely because STEER also values them.

## Control adherence

Record any deliberate adoption of a STEER-specific mechanism as contamination. Do not erase the item; report contamination and analyze it separately. Likewise, record STEER items that bypass their required mechanism.

## Definition of done

The same product-level acceptance, quality, security, operability, and outcome conditions apply to both workflows. Process evidence differs; product quality does not.

