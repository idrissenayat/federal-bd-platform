# Docs Agent evidence — Codex supervision boundary

- Date: 2026-08-15
- Agent: STEER Docs Agent
- Agent role version: `d9dcb53:steer/agents/agent-roles.md`
- Run: `/root/steer_docs_boundary`
- Runtime host and observer: Codex
- Branch: `codex/codex-supervisor-boundary`

## Authorized documentation result

The Docs Agent made the operating-model boundary normative in
[`docs/steer/OPERATING-MODEL.md`](../../docs/steer/OPERATING-MODEL.md#normative-codex-supervision-boundary).
It identifies Codex as supervisor, temporary runtime host, and observer—not a delivery
agent—and defines attribution, bootstrap execution, exact-run feedback, Buzz visibility,
failure escalation, and explicitly authorized emergency intervention.

Onboarding, communication, role-prompt, and contribution guidance link to that single
authoritative section with minimal duplication. No product code, brief, exam, gate
ruling, deployment, merge, release, or pull-request readiness state was changed.

## Feedback response

The Docs Agent reworked the normative section after reviewing the
[fresh Critic evidence](https://github.com/idrissenayat/federal-bd-platform/commit/203c685ee558a4a57bba3d55d6845263c0b44188)
and
[independent Test evidence](https://github.com/idrissenayat/federal-bd-platform/commit/6026dcc401d97e2fa5e39f0d803683db305bfed3).
The revision:

- limits configuration, evaluation, and improvement to agent/runtime/platform
  configuration under a separate authorized platform work item;
- seals a failed deliverable against Codex editing, replacement, or completion;
- requires separately authenticated or attested, immutable supervisor and agent events;
- makes emergency intervention a scoped, time-bounded, human-authorized new run that
  cannot approve a gate or count as agent work; and
- prevents agent self-grading and controls holdout, scoring-oracle, evaluator, and
  feedback access so contamination invalidates the evaluation.

This response changes only the operating-model documentation. It does not disposition
the Critic/Test Gate 2 recommendations or claim that STR-024 provenance or readiness is
established.

## Validation evidence

### Initial publication

The [initial boundary commit](https://github.com/idrissenayat/federal-bd-platform/commit/909f438ca646ecb8e38aad2d2008c4082c6d7adb)
records its exact diff. Before that commit, the Docs Agent ran:

- `uv run pytest -q tests/test_repository_contract.py` — PASS, 3 tests
- `git diff --check` — PASS
- repository-local Markdown link-target check — PASS, 10 local targets across 7
  changed Markdown files

### Feedback revision

Before publishing the Critic/Test feedback response, the Docs Agent ran:

- `uv run pytest -q tests/test_repository_contract.py` — PASS, 3 tests
- `git diff --check` — PASS
- repository-local Markdown link-target check — PASS, 10 local targets across 7
  boundary/evidence files

CI independently repeats the repository contract after publication.
