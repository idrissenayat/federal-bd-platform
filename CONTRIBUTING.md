# Contributing through STEER

This repository is an experiment in the STEER Agentic SDLC. The written contract and
the process evidence are part of the deliverable; a working feature without them is not
complete.

## Before opening a build branch

1. Select a GitHub issue from the STEER Flight Board and record its assigned workflow:
   `STEER`, `Control`, or `Setup / excluded`.
2. Read `AGENTS.md`, `steer/EXPERIMENT-CHARTER.md`, the relevant brief and exam, the
   decision log, and the applicable guardrails.
3. Confirm Gate 1 and Gate 2 with authenticated GitHub evidence. A timestamp typed into
   a file is an audit note, not sufficient approval evidence.
4. Create one branch per build attempt. Use `codex/<description>` for Codex work and an
   equivalent tool/role prefix for other lanes.

## Building and reviewing

- The Builder implements the signed brief against the frozen exam.
- The Test role owns exam completeness; a Builder must not weaken an exam to pass code.
- The Critic uses a fresh context and records its review in the pull request.
- Run `./scripts/gauntlet.sh` before pushing.
- Record active human minutes, agent/tool versions, rebuilds, findings, overrides, and
  deviations in the item ledger.

## Pull requests

Every change lands through a pull request. Complete the template, link the issue, brief,
exam, gate evidence, Critic evidence, and local checks. Required GitHub checks must be
green. A red check blocks merge; correct a bad check in its own reviewed change.

Gate 3 is a release decision, not merely a code-review approval. No PR approval, merge,
or green check may be represented as permission to expose the change to users unless the
item's Gate 3 requirements are also satisfied.

## Scope and data safety

Only public, unclassified, synthetic, or explicitly sanitized data belongs in this
repository. Never commit API keys, contractor-private data, proposal material, CUI, FCI,
export-controlled data, or classified information.
