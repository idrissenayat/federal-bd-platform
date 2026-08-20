# Intent Brief — 0005 Governed multi-model Model Fabric

**Status:** Gate 1 pending
**Tags:** #security #privacy #a11y #legal #reliability #design-system #money
**Date opened:** 2026-08-14
**STEER work item:** STR-015
**Durable record:** [GitHub issue 31](https://github.com/idrissenayat/federal-bd-platform/issues/31)

## Expected outcome and measurement

- **Primary outcome:** STEER agents and humans can request a task by required outcome and
  constraints, while a governed Model Fabric selects an eligible model, explains the route,
  preserves the evidence trail, and safely falls back without exposing provider details to the
  caller.
- **Baseline / denominator:** current STEER execution has no shared provider-neutral router, so
  0 of 1 platform workflows can demonstrate policy-based model selection with comparable audit,
  fallback, budget, and quality evidence.
- **Observation window:** a frozen representative evaluation set before release, followed by 30
  days of dogfood use across at least three STEER task classes.
- **Minimum meaningful signal:** at least 95% of eligible evaluation runs complete within their
  declared latency and budget ceilings; 100% of invocations have a reconstructable route and
  cost record; the routed policy is non-inferior to the best eligible single-provider baseline on
  each task-class quality threshold; and fallback drills cause zero unauthorized external actions.
- **Human-attention signal:** compared with the frozen single-provider baseline, median human
  correction time per accepted output does not increase, and the reason for each route is visible
  without opening provider logs.
- **Guardrail measure:** zero secret exposure, cross-project data leakage, disallowed-provider use,
  autonomous human-gate rulings, or duplicate side effects during retries.

## Who this is for

STEER POD members and bounded agents building complex software across multiple projects. They need
access to suitable capabilities from OpenAI, Anthropic, Google, xAI, and Kimi without learning five
provider APIs, making ad hoc cost decisions, or assigning a favored model to every task. Platform,
security, privacy, finance, and delivery leads need an auditable policy they can govern.

## Problem and why now

Adding providers directly to individual agents would duplicate credentials, prompts, error handling,
and audit logic while hiding why a model was chosen. Marketing labels, public benchmarks, and list
price alone are not reliable task-routing evidence. Model revisions, aliases, quotas, tool behavior,
data terms, latency, and effective cost change independently. STEER therefore needs one governed
selection boundary before provider integrations spread through the platform.

This is STEER Platform work, not Federal BD Pilot product work. The first dogfood task set may use
existing repository artifacts, but the resulting contracts and policies must remain domain-neutral.

## What "done and correct" means

1. A stable task contract declares task class, required capabilities, quality threshold, latency
   ceiling, budget ceiling, tool permissions, data classification, region, project, and consequence
   level without naming a provider.
2. Versioned provider adapters normalize invocation, streaming, structured output, tool calls,
   usage, errors, cancellation, and safety metadata while preserving provider-specific evidence.
3. A versioned capability registry records exact provider, model ID and revision/alias behavior,
   context and output limits, modalities, tool/structured-output support, availability, region/data
   constraints, measured quality, latency, reliability, and effective cost.
4. Routing applies hard eligibility filters before scoring. A model that fails data, permission,
   region, capability, budget, or consequence rules can never win through a high aggregate score.
5. Eligible models are ranked by task-specific evaluation quality, reliability, latency, and
   effective cost using a versioned policy. Weights and thresholds are frozen for each run and
   changes are auditable.
6. Each task class defines a primary route, bounded fallback chain, timeout, retry budget, circuit
   breaker, and idempotency behavior. Exhaustion fails closed with a clear human action.
7. Credentials are isolated by organization/project and provider; agents receive capability-scoped
   access rather than raw keys. Prompts, logs, caches, and telemetry exclude secrets and prohibited
   data.
8. Builder and Critic assignments can require provider-family separation. A different model family
   reduces correlated error but never substitutes for deterministic checks or qualified human
   review.
9. Every invocation records the task/policy/provider/model revisions, input and evidence hashes,
   tool permissions, route reason, latency (including time to first token and total), token/tool
   usage, effective cost, retries/fallbacks, result disposition, evaluation outcome, human rework,
   and escaped defects without recording prohibited content.
10. Humans can see the recommendation, material tradeoffs, unavailable dependencies, fallback state,
    and fastest safe action in plain language; they can override permitted routing choices with a
    reason while the original recommendation remains immutable.
11. Organization, POD, and project controls provide provider/model allowlists, spending and rate
    limits, data policy, retention policy, and emergency disablement. Narrower scopes may restrict
    but not widen their parent policy.
12. No model may approve a STEER human gate, authorize external communication, merge/release code,
    move money, or expand its own tools. Those actions remain behind existing authenticated human
    authority and platform controls.
13. Provider outage, quota exhaustion, malformed output, policy drift, stale registry data, and
    partial tool execution have tested safe states. Retries cannot duplicate side effects.
14. A frozen, versioned evaluation suite covers representative task classes, hard eligibility,
    adversarial inputs, provider degradation, cost/latency reporting, and human acceptance. Learning
    Review may change routing policy only from recorded evidence and never rewrites prior runs.
15. Model Fabric outcomes and human effort are captured in the STEER experiment ledger so this item
    does not give STEER an unrecorded model/tool advantage over Control items.

## Routing decision model

The routing sequence is deterministic and explainable:

1. Validate the task contract and consequence level.
2. Apply organization, POD, project, data, region, capability, permission, availability, and budget
   eligibility rules.
3. Rank eligible candidates using the frozen task-class evaluation score, reliability, latency, and
   effective cost. Effective cost includes input/output tokens, tool or search fees, expected retry
   cost, and human correction cost where measured; it is never raw list price alone.
4. Select the primary candidate and record the reason plus the bounded fallback chain.
5. Execute with timeouts, circuit breakers, idempotency keys, and least-privilege tools.
6. Evaluate the result, preserve telemetry, and either accept, fall back, or return a named human
   action. No policy is silently relaxed to obtain an answer.

## Design intent

The work-management platform will expose a Model Policy view for administrators and a concise route
card beside agent-assisted work. The administrator view answers: which providers/models are eligible,
which policy is active, what changed, what it costs, how it performs, and how to disable it. The route
card answers: which model was used, why it was eligible, the important tradeoff, whether fallback
occurred, what evidence supports the output, and what the human should do next.

Provider names are supporting detail, not the primary interaction. Controls use plain language,
progressive disclosure, existing STEER design tokens, and WCAG 2.2 AA keyboard, focus, contrast, and
target-size requirements. Empty, loading, stale-registry, policy-denied, budget-exhausted,
provider-degraded, partial-result, and total-failure states must be useful and actionable. A policy
change names the affected scope and consequence before confirmation.

## Out of scope

- Creating provider accounts, API keys, hosted secrets, or production integrations before Gate 2.
- Declaring one provider or model universally "best," or routing from marketing claims alone.
- Training, fine-tuning, or hosting foundation models in the first slice.
- Sending CUI, FCI, export-controlled, classified, proprietary proposal, or other prohibited content
  to any provider.
- Autonomous gate approval, release/merge, spending authority, external communication, or
  unrestricted agent-to-agent delegation.
- Replacing provider safety systems, deterministic tests, code review, or named domain owners.
- Changing the Federal BD Pilot recommendation model or its frozen pilot thresholds.

## Risks and default-closed touchpoints

The feature introduces multi-provider credentials, cross-border data decisions, prompt and tool
injection surfaces, variable retention/training terms, model drift, aliases that may move to new
revisions, quota and outage behavior, correlated model errors, unbounded cost, and retries that could
repeat writes. Logs can expose personal or proprietary data; route explanations can expose sensitive
policy; provider terms and generated-code licensing obligations may differ.

This item is default-closed because it handles authentication/authorization, secrets, possible
personal data, provider policy, and cost controls. The exam must threat-model confused-deputy access,
prompt/tool injection, tenant/project isolation, credential compromise, data residency/retention,
alias drift, audit tampering, denial of service, cost amplification, fallback policy bypass, and
duplicate side effects. The initial release remains limited to public, unclassified test content.

## Specialist guardrails and cooling-off plan

- **Named authorities:** Product Lead rules on Gate 1; Tech Lead rules on Gate 2 in a later session.
  Gate 3 requires Product Lead, Tech Lead, an independent reader, and named security, privacy,
  accessibility, legal, reliability, design-system, and money owners. An open owner seat blocks Gate 3.
- **Evidence required before Gate 2:** the exam must define adapter contract tests, exact provider
  capability verification, eligibility-denial tests, provider-family separation rules, tenant/project
  isolation, secret redaction, prompt/tool-injection tests, idempotency and fallback drills, alias-drift
  detection, budget enforcement, audit reconstruction, accessibility checks, dependency/license
  review, rollback, and frozen eval thresholds.
- **Evidence required before Gate 3:** Builder, Test, fresh-context Critic, and every tagged owner
  review the exact release revision. All hard-denial, secret, isolation, cost, retry/idempotency,
  provider-degradation, audit, accessibility, dependency, and rollback checks must pass with no
  unresolved blocker.
- **Cooling-off:** the item never auto-ships. In solo mode the authenticated human may rule only after
  the required 24-hour period from the verified build. Repository and platform evidence must bind
  identities, timestamps, artifacts, reviews, model/tool versions, and cooling-off duration.
- **Failure behavior:** missing/stale registry facts, missing authority, open tagged-owner seats,
  incomplete evidence, budget uncertainty, provider-policy ambiguity, or unresolved blocker keeps
  execution denied. Buzz discussion, a model recommendation, green CI, merge, or provider
  availability never substitutes for a human gate.

## Working direction and alternatives to examine

Working direction: a provider-neutral core with explicit adapters, a registry backed by verified
provider facts and local evaluations, policy-as-data, and a router whose decisions are immutable per
run. The Architect must compare at least: direct provider SDK adapters versus a constrained gateway;
static policy versus eval-driven policy; managed versus self-hosted routing components; synchronous
versus queued execution; and one-provider versus cross-provider Builder/Critic strategies. The exam,
not this brief, selects and freezes the implementable slice.

## Primary provider references

- [OpenAI model comparison](https://developers.openai.com/api/docs/models/compare)
- [Anthropic model selection](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)
- [Google Gemini models](https://ai.google.dev/gemini-api/docs/models)
- [xAI models](https://docs.x.ai/developers/models)
- [Kimi API overview](https://www.kimi.com/help/kimi-api/api-overview)
- [Kimi platform and pricing](https://platform.kimi.ai/)

These references establish provider-specific capability and commercial inputs; they do not establish
comparative fitness. Only versioned STEER task evaluations and observed operating evidence may do so.

---

GATE 1: PENDING — requires an authenticated Product Lead ruling on this exact revision after a fresh
Critic review. No provider credentials or integrations are authorized.
