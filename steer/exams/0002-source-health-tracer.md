# Exam — 0002 Source-health tracer

**Brief:** `briefs/0002-source-health-tracer.md`  
**Guardrails in force:** CORE-01..11 + SEC-01..05 + REL-01..04 + SRC-01..04

## Acceptance tests

1. Given the committed SAM.gov fixture and no environment secrets, when the offline health command runs, then it exits `0` and returns `configuration=fixture`, `schema=healthy`, and `connectivity=not_tested`.
2. Given no `SAM_API_KEY`, when a live health check is requested, then the command returns `not_configured`, names `SAM_API_KEY`, and does not attempt a request.
3. Given a configured key and a successful minimal response, when live health runs, then it reports the endpoint, response status, observed schema version, and check time without exposing the key.
4. Given a timeout, `429`, `5xx`, invalid JSON, or unexpected schema, when live health runs, then it reports a typed degraded/failure result and a non-zero exit without leaking request secrets.
5. Given JSON output mode, when any health result is emitted, then it validates against the documented result schema.
6. Given CI, when tests run without network access, then every test passes using fixtures.

## Edge cases and attacks

- API key embedded in a query-string exception.
- Control characters or unusually long text in a source error.
- A `200` response with an HTML body.
- Fixture schema missing `noticeId` or pagination fields.
- Local clock unavailable or non-UTC.

## Non-functional checks

- Live timeout is at most 10 seconds.
- Secrets are masked in logs, exceptions, snapshots, and test failures.
- Offline tests complete in under 5 seconds on a typical laptop.

## Outcome instrumentation

- CI records offline tracer pass/fail and duration.
- Live checks, when explicitly run, record adapter name, status, latency, and UTC check time—never credentials.

## Human judgment checklist (Evaluate)

- [ ] Can a new maintainer understand whether the source is unconfigured, unreachable, malformed, or healthy?
- [ ] Is it impossible to mistake fixture health for live source health?
- [ ] Are correction steps specific and minimal?
- [ ] Would I be comfortable sharing the complete command output in a support ticket?

---

GATE 2: PENDING  
GATE 2 EVIDENCE: PENDING — authenticated approval tied to this revision

GATE 3: PENDING  
GATE 3 EVIDENCE: PENDING — approval plus required checks tied to the shipped commit

