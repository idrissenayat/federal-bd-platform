# Adopt and install STEER

STEER can begin as a repository operating model and grow into the reference platform.
Do not wait for every integration before testing one real, low-risk flight.

## 1. Name the installation

Record the organization, accountable maintainer, Product and Tech gate owners, security
contact, data classification, approved repositories, and initial tool choices. Decide
which actions are always human-only.

## 2. Create the first POD

Start with the four human accountabilities—Product Lead, Tech Lead, Product Designer,
and Platform/Security owner—even if one person temporarily holds several. Add the core
agents only when each has a distinct role, human owner, tool boundary, escalation path,
and separate identity. See `steer/agents/agent-roles.md`.

## 3. Add projects

For each project, create:

- a charter, outcome measures, data boundary, and project guardrails;
- a repository or durable evidence location;
- a project channel for coordination;
- a project-scoped backlog and work items;
- brief, exam, signal, review, and decision-log locations.

One POD can own several projects. Keep project evidence and permissions distinct even
when the same people and agents participate.

## 4. Connect the minimum toolchain

Choose one implementation for each required capability in
[TOOL-ADAPTERS.md](TOOL-ADAPTERS.md). The current reference stack uses STEER Work
Management, GitHub, CI, and Block Buzz, but adopters may substitute compatible tools.
Start with work authorization, source/evidence, identity, communication, and CI; add
observability and agent runtimes before production use.

## 5. Verify readiness

Run:

```bash
./scripts/bootstrap-environment.sh
./scripts/gauntlet.sh
```

Then prove in the shared environment that direct protected-branch pushes fail, a planted
secret is blocked, separate workspaces cannot see uncommitted work, a fresh Critic can
review without Builder context, a signal reaches a governed work item, and a gate binds
an authenticated approver to an exact revision.

## 6. Fly one tracer

Choose a small but independently useful item with observable value. Run it through all
seven states, capture human time and failures, and perform the Learning Review. Do not
claim success because code was produced; verify the predeclared outcome and guardrails.

## 7. Scale deliberately

Add another project when the POD has review capacity. Add another POD when the existing
unit has sustained demand and named human decision owners. Add a specialist only for a
bounded need with explicit project access and an expiry/review date.

## Current installation status

The repository-level operating model is usable now. The hosted reference platform is a
single-POD pilot. Multi-organization/POD/project installation is specified but not yet
implemented; see brief and exam `0004`. Production identity, backup, migration, tenancy,
and support claims remain out of scope until their gates and conformance tests pass.
