# STEER project governance

STEER is developed in public through evidence-backed proposals, reviewable changes, and
the same gates it asks adopters to use. Governance protects the framework from becoming
either a closed product roadmap or an agent-controlled process.

## Decision rights

| Decision | Accountable authority | Required evidence |
|---|---|---|
| Product direction and Gate 1 | Product Lead / maintainer named by the adopting organization | Approved intent brief tied to an exact revision |
| Technical verification and Gate 2 | Tech Lead / maintainer | Approved exam tied to an exact revision |
| Release and Gate 3 | Product Lead, Tech Lead, tagged domain owners, and independent reader | Green checks, review evidence, and authenticated rulings |
| Framework policy | STEER maintainers after public proposal and learning review | Decision record, migration impact, and dissent |
| Security response | Security maintainers | Private advisory and sanitized public follow-up |

Agents may research, propose, build, test, critique, document, and operate within an
approved boundary. Agents may not approve human gates, grant themselves access, change
their own authorization, or convert chat into assigned work.

## Contributor path

1. Open a signal, defect, or candidate issue with evidence.
2. A maintainer assigns the item to `STEER`, `Control`, or `Setup / excluded` before work.
3. Consequential STEER changes receive an intent brief and exam before implementation.
4. Work lands through a pull request with checks, review, and traceable gate evidence.
5. Repeat contributors may be invited as reviewers and then maintainers based on sound
   judgment, respectful collaboration, security behavior, and sustained stewardship.

Maintainer access is least-privilege, reviewable, and revocable. No maintainer, founder,
agent, vendor, or sponsoring organization owns an exemption from the guardrails.

## Proposing a framework change

A framework proposal states the observed problem, affected adopters, evidence, backward
compatibility, migration, success measure, and rollback. Changes to gates, guardrails,
authorization, or evidence retention are default-closed and require the applicable
specialists. Routine corrections can use the normal pull-request path.

The weekly Learning Review may accept at most two normal process changes. Security or
escaped-defect controls may be added immediately, but they must receive permanent
documentation and review within the timeframe set by the guardrails.

## Releases and compatibility

Before 1.0, breaking changes are allowed but must be called out with a migration note.
After 1.0, the project intends to use semantic versioning for the Core specification,
platform APIs, data schema, and adapter contracts. Implementations must publish the Core
and adapter versions they claim to support.

## Forks, distributions, and name use

The Apache License permits forks and commercial distributions under its terms. A fork
may call itself “STEER-compatible” only when it identifies the supported specification
version and passes the published conformance checks. The project name must not be used to
imply endorsement. A formal trademark and compatibility policy remains a pre-1.0 item.
