# Technology Register — the complete tool inventory

*v2.0 · August 2026 · owned by the Platform Engineer · the third pillar: people (Role
Charters) ✓, process (this kit) ✓, technology (this file) ✓.*

Every tool STEER needs to run effectively, in one place. This is also the account
inventory for provisioning and offboarding (Handbook, Layer 5). Statuses:
**ADOPT** (day 1) · **PILOT** (in use, promotion trigger defined) · **TRIGGER**
(adopt when the named trigger fires) · **PRODUCT** (when the product needs it —
these are default-closed domains). Every adopted tool must pass its ready-means
test (Handbook); every AI-connected tool must pass the /steer canary tripwire.

## A · Foundation & identity

| Tool | Status | Role | Notes |
|---|---|---|---|
| Google Workspace | ADOPT | Email, calendar, video fallback, SSO root of trust | The identity everything else hangs off |
| 1Password (or Bitwarden) | ADOPT | Human credential vault | Machine secrets live in Doppler/env — never here, never vice versa |
| Cloudflare | ADOPT | DNS, CDN, WAF, registrar | Free tier suffices until real traffic |
| GitHub | ADOPT | Repo, PRs, gauntlet (Actions), flight board (Projects), platform secrets | The system of record for code and checks |

## B · The AI fleet (four lanes + telemetry)

| Tool | Status | Role | Notes |
|---|---|---|---|
| Claude Code | ADOPT | Lane 1 — primary build: Builders, Test Agent, Docs | CLI-first, pipeline-native |
| Codex (ChatGPT) | PILOT | Lane 2 — cross-vendor Critic + builder #2 | Diversity insurance, not independent assurance. Promote when risk/volume or correlated misses justify it |
| Cursor | ADOPT | Lane 3 — human cockpit: diff-reading, judgment edits at Evaluate | Serves humans, not the fleet |
| Grok (xAI) | TRIGGER | Lane 4 — Scout + bulk sessions | Trigger: signal volume or research load justifies a dedicated lane |
| LLM usage telemetry | ADOPT | Token/cost observability per session & brief | Provider consoles day 1; Langfuse (self-host) when per-brief attribution matters — feeds METRICS.md and the cost model |

## C · Collaboration & coordination

| Tool | Status | Role | Notes |
|---|---|---|---|
| Buzz (Block) | PILOT | Signed huddle, signals, findings, and escalation plane for humans and uniquely keyed agents | Official `block/buzz` is remotely hosted on Railway. Shared B1 passed TLS health, identity, signed events, membership denial, revocation, and restart retention. Hosted ACP workers await provider service credentials; restore, alerting, and B2 reconciliation remain open. B3 is required before any gate experiment. GitHub remains authority. |
| GitHub Projects | ADOPT | Flight board (until Buzz promotion) | One surface, phase columns, gate markers |
| /steer (this kit) | ADOPT | The written contract — briefs, exams, guardrails, logs | The coordination mechanism itself; agents read it natively |

## D · Build & verify (the gauntlet's toolchain — all free CLI, run in Actions)

| Tool | Status | Role | Guardrails |
|---|---|---|---|
| Vitest / pytest | ADOPT | Test runner | CORE-01 |
| Playwright (+ axe-core) | ADOPT | E2E journeys + accessibility | exam journeys, A11Y-01 |
| gitleaks | ADOPT | Secrets scanning (history + per-PR) | SEC-01 / CORE-03 |
| Semgrep | ADOPT | SAST + policy-as-code | SEC-04 |
| osv-scanner + Renovate | ADOPT | Dependency audit + updates-as-PRs | SEC-02 |
| license-checker + allowlist | ADOPT | License compliance | LEGAL-01 |
| Lighthouse CI | ADOPT | Web perf budget | REL-01 |
| k6 | ADOPT | Load smoke (gauntlet) + full load (tagged items) | REL-01 |
| promptfoo | ADOPT | AI-behavior evals in CI + fleet upgrade benchmarks | Layer-2 upgrade procedure |

## E · Design system (the Designer's machine-readable contract)

| Tool | Status | Role | Notes |
|---|---|---|---|
| Figma | ADOPT | Design source of truth, exploration | Agents consume the *system*, not the mockups |
| Storybook | ADOPT | Component library as running code — the surface DES-01 checks against | This is what makes the design system machine-readable |
| Style Dictionary | TRIGGER | Design tokens as code, multi-platform | Trigger: second platform (mobile) or second pod |

## F · Runtime & data

| Tool | Status | Role | Notes |
|---|---|---|---|
| Vercel / Railway / Fly.io | ADOPT | Hosting, preview envs, one-command rollback | Pick per stack; Railway also hosts Buzz |
| Neon or Supabase (Postgres) | ADOPT | Database + PITR backups | Backup restore rehearsed = ready-means |
| Prisma / Alembic | ADOPT | Migrations (expand-contract, REL-03) | Per stack |
| Doppler | TRIGGER | Machine secrets manager | Trigger: second environment |
| OpenTofu / Terraform | TRIGGER | Infra as code | Trigger: outgrowing app-platform hosting |

## G · Release & telemetry

| Tool | Status | Role | Notes |
|---|---|---|---|
| Config-file flags → GrowthBook | ADOPT → TRIGGER | Feature flags; %-rollouts at trigger | Trigger: first percentage rollout |
| Sentry | ADOPT | Error tracking, release-tagged | Alerts route to the huddle channel (Buzz) |
| PostHog | ADOPT | Product analytics + session replay (+ flags if consolidating) | REL-02 events defined in exams |
| Better Stack | TRIGGER | Uptime, SLOs, status page, on-call | Trigger: team tier / first SLO |

## H · Product services (adopt when the product needs them — default-closed domains)

| Tool | Status | Role | Notes |
|---|---|---|---|
| Resend or Postmark | PRODUCT | Transactional email | #privacy tagged; single-purpose sends only |
| Clerk / Supabase Auth | PRODUCT | Authentication | #security — default-closed by definition |
| Stripe | PRODUCT | Payments | #money — default-closed, human-signed always |

## The day-1 account list

Start from the accounts already available plus the minimum delivery chain: repo/CI,
one build agent, telemetry, and hosting. The four-lane/twelve-account configuration is
the reference scaling case, not a day-one requirement. Budget from the calculator's
planning case and include the imputed value of human attention.

## Register discipline

New tool → new row, with status, ready-means test, and (if PILOT/TRIGGER) the
promotion trigger written down at adoption time, not remembered later. Tool swap →
ships like a feature behind its seam (Handbook, principle 5). Quarterly environment
audit re-verifies every ADOPT row and re-checks every TRIGGER condition. A tool with
no row in this register has no business holding company data.
