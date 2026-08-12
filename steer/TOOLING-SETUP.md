# Tooling Setup — the minimal rails

Stand these up **before** the first real feature. The bar to clear is the tracer-bullet
test at the bottom, not tool perfection. Budget: a weekend, not a month. Everything here
has a free or near-free tier suitable for a new product.

## 1. Repo and branches

- Git repo, trunk-based. Protect `main`: changes land only via PR with green checks.
- Agents build in **isolated branches** (one per build attempt). Parallel builders = parallel branches.
- This kit lives at `/steer` in the repo, so agents can read the contract.

## 2. Agent fleet — minimum first, lanes by trigger

- **Minimum Viable STEER:** one Builder, one fresh-context Critic, and one Test role (the Test role may be another fresh session). This is sufficient to start. Add parallel builders only when a rebuild or option comparison justifies their cost.
- The full reference fleet is multi-vendor: **Claude Code** (primary build lane — Builders,
  Test Agent, Docs), **Codex** (cross-vendor Critic + second builder: a different model
  family can't share the builders' blind spots), **Cursor** (the human cockpit for
  diff-reading and judgment edits), **Grok** (Scout + cheap bulk sessions). Start with
  the Claude lane on day one; add Codex the same week — the cross-vendor Critic is the
  useful diversity upgrade in the stack. Different model families can still share training data, incentives, and failure modes, so this is **diversity insurance**, not independent assurance. Every lane must pass the same
  ready-means tests before joining; a lane that won't read /steer doesn't build.
- Configure the role prompts from `agents/agent-roles.md` — at minimum: **Builder**,
  **Critic** (separate context always; different family when practical), **Test Agent**.
  Scout/Architect/Docs/Ops are role prompts on whichever lane fits.
- Add a standing instruction in your agent config (e.g. `CLAUDE.md`):
  *"Read /steer/briefs/<id> and /steer/exams/<id> before building. Rules in
  /steer/operating-system/GUARDRAIL-LIBRARY.md apply to every change. Escalate questions
  rather than guessing on anything the brief doesn't answer."*

## 3. The gauntlet (CI)

GitHub Actions (or equivalent) running on every PR — each job maps to guardrail IDs
from `operating-system/GUARDRAIL-LIBRARY.md`:

| Job | Guardrails | Typical tools |
|---|---|---|
| Tests | CORE-01 | your test runner |
| Types & lint | CORE-02 | typechecker, linter |
| Secrets scan | SEC-01 | gitleaks |
| Dependency audit | SEC-02 | npm audit / pip-audit / osv-scanner |
| License check | LEGAL-01 | license-checker |
| Accessibility (web) | A11Y-01 | axe-core against a preview build |
| Perf budget | REL-01 | Lighthouse CI / a load smoke test |

Start with whichever rows apply; add rows as the guardrail library grows. **A red gauntlet
blocks merge — no override habit.** If a check is wrong, fix the check in a PR of its own.

## 4. Flags and staged release

- Every user-visible change ships behind a flag. Pre-launch, a config-file flag system
  (a JSON of flags read at startup) is genuinely enough; adopt a flag service when
  you need percentage rollouts.
- "Canary" before you have users = deploy to a staging URL + run the exam's smoke tests
  against it. After you have users = flag on for a small %, watch, then 100%.
- Auto-rollback, minimal version: deploys are one-command reversible, and you know the command cold.

## 5. Telemetry from day one

- Error tracking (Sentry-class) and basic product analytics wired before the first user.
  Phase 7 does not exist without signals.
- A `signals/` inbox (file, board, or channel): every piece of user feedback, error spike,
  or observation lands there. That inbox is what your Scout agent digests weekly into
  candidate briefs.

## 6. Cost and human-attention watch

- One line per week in the Learning Review: agent/API spend, hosting spend, human judgment hours, and human diff-fixing hours. Machine speed is only a win when total economics and scarce human attention remain acceptable.

## Activation triggers

| Add | Trigger |
|---|---|
| Second builder | A failed first attempt, genuinely different architecture options, or time-critical comparison |
| Second model family | Repeated correlated Critic misses, default-closed work, or volume that justifies the seat/API cost |
| Specialist agent/human | A brief or diff touches its tagged domain |
| Dedicated Test Agent | Exam quality or first-pass results repeatedly identify specification gaps |
| Four-lane fleet | Sustained throughput where lane specialization improves measured outcomes or human load |

## The named stack (verified August 2026)

The full reference build lives in the Tools & Environment Handbook; this is the
short version. **A practical reference stack:** GitHub (repo + Actions + Projects +
secrets), Claude Code (the agent fleet; Cursor/Devin/Cline are alternatives),
PostHog (analytics + flags + session replay), Sentry (errors), Vercel or Railway
or Fly.io (hosting, previews, rollback), Slack (huddle + #signals inbox).

**Collaboration option:** Buzz (Block) as huddle + #signals + agent-escalation surface —
open-source, agents as first-class members with signed audit trails; Slack is the
fallback. Full inventory with statuses and triggers: `TECHNOLOGY-REGISTER.md`.

**Free CLI tools that run inside the gauntlet:** Vitest/pytest + Playwright
(tests, E2E, a11y via axe-core), gitleaks (secrets), Semgrep (SAST),
osv-scanner + Renovate (dependencies), license-checker (licenses),
Lighthouse CI + k6 (performance), promptfoo (AI-behavior evals and fleet
upgrade benchmarks).

**Graduate later, on triggers:** Doppler (secrets, at env #2), GrowthBook or
Unleash (flags, at first %-rollout), OpenTofu/Terraform (infra, beyond
app-platform hosting), Better Stack (uptime/SLOs, at team tier). Postgres via
Neon or Supabase + Prisma/Alembic for data and expand-contract migrations.

## The tracer-bullet test

You are done setting up when this passes end to end:

1. Write a trivial brief (e.g. "add a /health endpoint returning version"), sign Gate 1.
2. Write its 3-line exam, sign Gate 2.
3. A Builder agent implements it in a branch; the gauntlet runs; the Critic reviews the diff.
4. You sign Gate 3; it deploys behind a flag to staging; smoke test passes; you flip the flag.
5. Total human keyboard time on infrastructure: **zero**.

If any step needed manual infra fiddling, fix that before starting real features —
friction you tolerate once becomes friction you tolerate forever.
