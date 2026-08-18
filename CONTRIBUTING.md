# Contributing to STEER

STEER welcomes framework, platform, adapter, documentation, research, design, security,
and reference-project contributions. The written contract and process evidence are part
of the deliverable; a working feature without them is not complete.

By participating, follow the [Code of Conduct](CODE_OF_CONDUCT.md) and
[project governance](GOVERNANCE.md). Ask in an issue before investing in a large change.

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

- Codex supervision or temporary runtime hosting follows the
  [normative supervision boundary](docs/steer/OPERATING-MODEL.md#normative-codex-supervision-boundary);
  named agents retain deliverable ownership and run-level attribution.
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

## Contributor certification

Contributions use the [Developer Certificate of Origin 1.1](https://developercertificate.org/).
Add a sign-off to each commit:

```bash
git commit -s -m "Describe the change"
```

The sign-off certifies that you have the right to submit the contribution under this
project's license. Do not submit employer-owned or third-party material without authority
and compatible terms. AI assistance does not remove your responsibility for provenance,
correctness, security, attribution, or license compatibility.

## Scope and data safety

Only public, unclassified, synthetic, or explicitly sanitized data belongs in this
repository. Never commit API keys, contractor-private data, proposal material, CUI, FCI,
export-controlled data, or classified information.
