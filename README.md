# STEER — an open Agentic SDLC

STEER is an experimental, open-source operating model for delivering software with
humans and AI agents as one governed team. It combines outcome-oriented work management,
intent briefs, executable exams, explicit human gates, bounded agent roles, durable
evidence, and a learning loop that improves the system without silently weakening it.

STEER is not tied to one industry, model provider, code host, or chat product. An
organization can adopt the operating model, run the reference Work Management platform,
create one or more PODs, assign several projects to each POD, and add temporary human or
agent specialists through permission-scoped adapters.

> **Maturity:** experimental / pre-1.0. We use STEER to build STEER and publish the
> evidence, limitations, and changes. Do not interpret the current pilot as proof that
> STEER is universally better than Scrum or Kanban.

## The distribution

| Layer | Purpose | Current location |
|---|---|---|
| **STEER Core** | Vendor-neutral lifecycle, gates, guardrails, roles, templates, metrics, and learning rules | [`steer/`](steer/) and [`docs/steer/`](docs/steer/) |
| **STEER Work Management** | Reference application for portfolios, PODs, projects, work authorization, reviews, and human decisions | [`flight-board/`](flight-board/) |
| **STEER Adapters** | Replaceable contracts for work tracking, source control, communication, agents, identity, CI, evidence, and observability | [`docs/steer/TOOL-ADAPTERS.md`](docs/steer/TOOL-ADAPTERS.md) |
| **STEER Labs** | Real projects that dogfood the framework and produce comparable evidence | Federal BD pilot in [`docs/product/`](docs/product/) |

The current application began as a single-POD Federal BD pilot. The governed extension
to organizations, multiple PODs, multiple projects per POD, and specialist plugins is
specified in [brief 0004](steer/briefs/0004-multi-pod-platform.md) and its
[exam](steer/exams/0004-multi-pod-platform.md), tracked by
[GitHub issue 16](https://github.com/idrissenayat/federal-bd-platform/issues/16). It will
not enter implementation until STEER Gates 1 and 2 are approved.

## Start here

- **Adopting STEER:** read the [adoption and installation guide](docs/steer/ADOPTION.md).
- **Understanding the method:** read the [operating model](docs/steer/OPERATING-MODEL.md).
- **Designing an installation:** read the [reference architecture](docs/steer/REFERENCE-ARCHITECTURE.md)
  and [tool adapter contracts](docs/steer/TOOL-ADAPTERS.md).
- **Joining this team:** follow [team onboarding](steer/TEAM-ONBOARDING.md), then use the
  [Flight Board](https://steer-flight-board.idriss-enayat.chatgpt.site/).
- **Contributing:** read [CONTRIBUTING.md](CONTRIBUTING.md), [GOVERNANCE.md](GOVERNANCE.md),
  and [SECURITY.md](SECURITY.md).

To verify a development environment:

```bash
./scripts/bootstrap-environment.sh
./scripts/gauntlet.sh
```

Run the offline SAM.gov source-health tracer without network access or credentials:

```bash
uv run python -m federal_bd.source_health --mode fixture --format json
```

See [`docs/sources/SOURCE-HEALTH.md`](docs/sources/SOURCE-HEALTH.md) for the explicit
live probe, result contract, security boundary, and rollback procedure.

The reference Work Management application has its own setup instructions in
[`flight-board/README.md`](flight-board/README.md).

## The operating boundary

The durable work hierarchy is:

```text
Organization
└── POD (stable human + agent delivery unit)
    ├── Project
    │   └── Work item → brief → exam → build → evidence → human ruling
    └── Specialist attachment (temporary, scoped, revocable)
```

Work Management authorizes work. Team communication coordinates it. The engineering
system preserves implementation evidence. A chat message, agent suggestion, or green CI
check cannot substitute for an authenticated human gate.

## First reference project

The Federal BD pilot tests whether STEER can deliver a demanding product while being
compared with a credible agent-assisted Kanban control. It discovers official federal
contract opportunities, preserves evidence, evaluates fit, recommends `BID`, `NO_BID`,
or `REVIEW`, and requires a human decision before advancing. Its original repository
framing is preserved in [the initial pilot README](docs/history/INITIAL-PILOT-README.md).

## License

The proposed distribution license is [Apache License 2.0](LICENSE). It permits commercial
and non-commercial use, modification, and redistribution under its terms and includes an
explicit patent license. The draft license becomes the repository's governing license
only when this change is reviewed and merged.

Copyright 2026 STEER contributors.
