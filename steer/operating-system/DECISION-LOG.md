# Decision Log

Rulings made when a brief was ambiguous, an agent escalated, or a judgment call shaped
the product. One line each. Agents are instructed to check this log before asking again —
and your future hires will read it to absorb a year of context in an afternoon.

Format:

| Date | Item | Decision | Why | Revisit? |
|---|---|---|---|---|
| 2026-08-14 | 0001 | (example) Waitlist stores email only — no name field | Minimize PII pre-launch (PRIV-02) | When onboarding ships |
| 2026-08-14 | fleet | (example) Builder agents may add deps < 50kB without escalating; larger ones escalate | Keep bundle honest without constant interrupts | At first perf review |
| 2026-08-12 | framework-v2 | Preserve v1 unchanged; publish revisions only in `v2/` | Maintain provenance and make the rationale auditable | At v3 |
| 2026-08-12 | framework-v2 | Five moves are the conceptual model; seven phases are the operating implementation | Remove an avoidable terminology conflict | If phases change |
| 2026-08-12 | framework-v2 | Minimum Viable STEER is the default starting configuration | Avoid treating the scaled reference fleet as a universal prerequisite | After pilot |
| 2026-08-12 | framework-v2 | Cross-vendor review is diversity insurance, not independent assurance | Models can share blind spots; deterministic and qualified human checks remain necessary | Quarterly |
| 2026-08-12 | framework-v2 | Claims of effectiveness require a 10–20 item baseline comparison with outcomes, failures, and human load | Internal stress tests are not external validation | After first external pilot |
| 2026-08-12 | project | MVP covers federal contract opportunities, not grants | Contract and grant sources, qualification logic, and users differ enough to weaken the first flight | After the contract pilot |
| 2026-08-12 | sources | SAM.gov Contract Opportunities is the live-notice system of record | It is the official federal procurement-notice source with a documented public API | Quarterly/API change |
| 2026-08-12 | sources | USAspending enriches historical context but cannot establish a live solicitation fact | Award data and opportunity notices have different authority and timing | If SAM award adapter is added |
| 2026-08-12 | sources | Forecasts and SUBNet are follow-on adapters, not launch dependencies | Their interfaces are heterogeneous and need separate evidence/adapter exams | After 0003 |
| 2026-08-12 | autonomy | Automation prepares a recommendation; only a human advances to Capture, Monitor, or Archive | Bid/no-bid allocates company resources and depends on judgment beyond sourced facts | After a validated pilot |
| 2026-08-12 | data | MVP accepts public, unclassified data only | Avoid unproven handling of CUI, FCI, export-controlled, proprietary, or classified information | Before any scope expansion |
| 2026-08-12 | architecture | Preserve raw source objects separately from normalized data | Reproducible recommendations and revision history require immutable evidence | Never unless replaced by a stronger control |
| 2026-08-12 | experiment | The primary product is evidence about STEER; the federal BD platform is the real-world test vehicle | Shipping useful software alone cannot establish that STEER caused the result | At experiment close |
| 2026-08-12 | experiment | Compare STEER with a competent agent-assisted Kanban control | Comparing agentic STEER only with historical human coding would confound process with AI capability and time | Before cohort freeze |
| 2026-08-12 | experiment | Keep people, tools, models, CI, product standards, and release controls common across treatments | The process should be the main intended difference | At every environment change |
| 2026-08-12 | experiment | Assign matched items before detailed work and retain killed/failed items | Prevent favorable post-hoc assignment and survivor bias | At cohort freeze |
| 2026-08-12 | experiment | Tracer 0002 tests feasibility and instrumentation but is excluded from comparative evidence | One setup item cannot demonstrate relative SDLC performance | After tracer |
| 2026-08-12 | environment | Preserve the pre-readiness repository as baseline commit `3abf612`; keep setup hardening in a later revision | Make the initial state and the reason for every environment change auditable | Never delete; supersede if provenance moves |
| 2026-08-12 | environment | Pin Python 3.12 and Node 20; manage Python with `uv` | Match the architecture contract and avoid accidental use of globally newer runtimes | At a measured runtime upgrade |
| 2026-08-12 | environment | Bind the project Postgres container to `127.0.0.1:55432` | Port 5432 is already owned by another project; loopback isolation prevents collision and unintended network exposure | If a shared database replaces local Compose |
| 2026-08-12 | environment | Declare Bash for setup gates and test that discovery does not mutate `PATH` | zsh reserves `path` and `status`; ad-hoc probes produced false failures | If setup becomes shell-independent |
| 2026-08-12 | collaboration | Buzz is the target communication plane; GitHub and `/steer` remain the authority plane until Buzz passes explicit B1–B3 proofs | Chat improves human-agent coordination but must not silently become gate or contract authority | At each Buzz promotion level |
| 2026-08-12 | collaboration | Preserve the existing Scrum-oriented Buzz/OpenProject/XWiki pilot; provision STEER in a separate workspace | Maintain provenance and avoid presenting relabelled Scrum configuration as evidence for STEER | Never delete; supersede with linked evidence |
| 2026-08-12 | agents | Poppy is a product-analysis agent and Tempo is a flow steward; neither is a human gate approver | Existing persona names must not confer decision authority that STEER reserves for authenticated humans | If human/agent authority model changes |

Rules of the log:
- If you ruled on it out loud (or in your head) and it changes future behavior, it goes here.
- A ruling contradicted by a later ruling gets superseded, not deleted — strike it through and link the new line.
- Rulings that harden into permanent rules graduate to GUARDRAIL-LIBRARY.md or GATES.md.
