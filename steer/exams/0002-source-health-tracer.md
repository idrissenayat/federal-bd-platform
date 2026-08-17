# Exam — 0002 Source-health tracer

**Brief:** `steer/briefs/0002-source-health-tracer.md` at approved Gate 1 revision `c6c20065b3e9aebc57c3193862f5ceb9ce6f0eef`
**Guardrails in force:** CORE-01..11 + SEC-01..05 + REL-01..04 + SRC-01..04

## Default-closed security and release control

This tracer handles a SAM.gov API credential and is therefore default-closed under
`#security`. The authenticated human who records Gate 3 is the named security
authority for this solo-mode tracer as well as the Product and Technology authority;
the Gate 3 receipt must state those capacities explicitly. Gate 3 cannot be presented
until at least 24 hours after the verified build commit and must bind the exact build,
test results, secret-scan result, and this Exam revision. A fresh-context review of the
approved Brief, frozen Exam, implementation diff, and verification packet is required
before the ruling. Any blocker from that review remains default-closed unless the
authenticated human explicitly records the override and its reasoning.

## Acceptance tests

1. Given the committed SAM.gov fixture and no environment secrets, when the offline health command runs, then it exits `0` and returns `configuration=fixture`, `schema=healthy`, and `connectivity=not_tested`.
2. Given no `SAM_API_KEY`, when a live health check is requested, then the command returns `not_configured`, names `SAM_API_KEY`, and does not attempt a request.
3. Given a configured key and a successful minimal response, when live health runs, then it reports the endpoint, response status, observed schema version, and check time without exposing the key.
4. Given a timeout, `429`, `5xx`, invalid JSON, or unexpected schema, when live health runs, then it reports a typed degraded/failure result and a non-zero exit without leaking request secrets.
5. Given JSON output mode, when any health result is emitted, then it validates against the documented result schema.
6. Given CI, when tests run without network access, then every test passes using fixtures.
7. Given the verified build is ready for Gate 3, when the release packet is assembled,
   then it identifies the authenticated human security authority, proves the 24-hour
   cooling period from the exact verified build commit, includes a fresh-context review,
   and includes the exact green CI and secret-scan evidence. Missing authority, elapsed
   time, review, or exact-revision evidence blocks release.

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
- Rollback is a revert of the exact tracer implementation commit through the protected
  pull-request path. The rehearsal must prove the prior fixture-only repository checks
  still pass and that no source data, credential, or audit evidence is deleted or
  rewritten.

## Outcome instrumentation

- CI records offline tracer pass/fail and duration.
- Live checks, when explicitly run, record adapter name, status, latency, and UTC check time—never credentials.

## Human judgment checklist (Evaluate)

- [ ] Can a new maintainer understand whether the source is unconfigured, unreachable, malformed, or healthy?
- [ ] Is it impossible to mistake fixture health for live source health?
- [ ] Are correction steps specific and minimal?
- [ ] Would I be comfortable sharing the complete command output in a support ticket?
- [ ] Does the Gate 3 packet name the acting security authority, bind the exact build and
      checks, include the fresh-context review, and prove the 24-hour cooling period?

---

GATE 2: PENDING  
GATE 2 EVIDENCE: PENDING — authenticated approval tied to this revision

GATE 3: PENDING  
GATE 3 EVIDENCE: PENDING — approval plus required checks tied to the shipped commit
