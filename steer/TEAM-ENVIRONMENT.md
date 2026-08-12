# STEER Team Environment

This is the functional team environment required before normal STEER delivery. It covers
the capabilities a mature software team needs without importing Scrum ceremonies as the
operating model.

| Capability | STEER system | Ready means |
|---|---|---|
| Demand and backlog | GitHub Issues + STEER Flight Board | Every candidate has evidence, value hypothesis, risk/size, workflow assignment, owner, and status |
| Intent | Versioned Intent Brief | Gate 1 evidence binds an authenticated approver to the exact revision |
| Verification | Versioned exam + CI gauntlet | Gate 2 freezes the exam; deterministic checks block merge |
| Coding | Pinned runtimes, Compose, isolated branches/worktrees, Builder role | One-command bootstrap; two lanes can work without collision |
| Review | Pull request + fresh-context Critic | Diff, Critic findings, human rulings, and required checks are preserved |
| Release decision | Gate 3 evidence | Human decision is distinct from green CI and merge permission |
| Documentation | Repository Markdown | Intent, design, decisions, operations, and learning are versioned with code |
| Team communication | Block Buzz pilot + GitHub fallback | Named Nostr identities, signed events, spaces, routing, retention, revocation, and durable write-through pass B1 proofs |
| Learning | Metrics ledger + weekly Learning Review | Flow, quality, outcome, cost, and human attention are reviewed and changes are limited |

## Shared GitHub surfaces

- **Flight board:** the portfolio and WIP view. Status, STEER phase, workflow treatment,
  gate state, risk, and experiment inclusion are explicit fields.
- **Issues:** candidate work, defects, signals requiring action, and agent escalations.
- **Pull requests:** implementation evidence, Critic review, CI, and authenticated human
  review. They are not substitutes for Gate 3.
- **Discussions:** the asynchronous fallback when Buzz or its identity/audit controls are
  unavailable. Durable decisions graduate to the decision log; product evidence
  graduates to a brief or signal digest.
- **Block Buzz:** the target shared human-agent huddle, signals, findings, and escalation
  plane. The Railway-hosted communication slice has passed B1 for controlled onboarding.
  Hosted agent workers, backup restore, external alerting, and B2 GitHub reconciliation
  remain default-closed under `BUZZ-OPERATING-CONTRACT.md`.
- **Security Advisories:** confidential vulnerability reporting.

## Work states and WIP

The flight board uses seven STEER phases: Sense, Frame, Engineer, Evaluate, Release,
Observe, and Learn. An item may be blocked at a gate inside a phase. Solo WIP is two;
additional capacity does not raise the limit until human review capacity is measured.

## Required live proofs

1. Two isolated builder worktrees cannot see each other's uncommitted work.
2. A planted secret and a failing test are blocked locally and in GitHub Actions.
3. Direct push to `main` is rejected; a green pull request remains the only merge path.
4. A fresh-context Critic produces a review artifact without Builder context.
5. A signal can be captured, promoted to a candidate, and traced to a brief.
6. A gate approval is tied to an authenticated GitHub identity and exact revision.
7. Each active agent can perform one allowed action, is denied one forbidden action, and
   can be revoked without removing its communication history.
8. A Buzz signal, escalation, and Critic finding retain actor provenance and write
   through to the linked authoritative GitHub artifact.

Passing workstation checks is L1. Passing shared repository and collaboration proofs is
L2. Staging, flags, rollback, telemetry, and tracer `0002` are L3.
