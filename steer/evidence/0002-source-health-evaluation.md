# STR-002 evaluation packet — source-health tracer

**Work item:** STR-002 / GitHub issue #2
**Workflow:** Setup / excluded STEER feasibility tracer
**Approved Brief:** `c6c20065b3e9aebc57c3193862f5ceb9ce6f0eef`
**Frozen Exam:** `7a5c625bbd17bdce1bdd4249e54e70c636d34e5f`
**Build candidate:** `2bd301d6bc9229a994a5e1ad265e579da713140c`
**Draft PR:** https://github.com/idrissenayat/federal-bd-platform/pull/58
**Verified build time:** 2026-08-17T13:50:31-04:00
**Earliest Gate 3:** 2026-08-18T13:50:31-04:00

This packet reports only checks that were actually run. The SAM.gov credential was not
configured, so no live-source result is claimed. The live success and failure paths use
injected synthetic responses; CI and the local gauntlet remain network-independent.

## Acceptance-test mapping

| Exam obligation | Evidence | Result |
|---|---|---|
| 1. Offline fixture health | `test_offline_fixture_is_healthy_fast_and_network_free`; CLI fixture JSON returned `configuration=fixture`, `schema=healthy`, `connectivity=not_tested`, and `freshness=not_evaluated` | Pass |
| 2. Missing `SAM_API_KEY` | `test_live_without_key_is_not_configured_and_does_not_call_transport` proves `not_configured`, names the variable, returns exit 2, and makes zero transport calls | Pass |
| 3. Successful minimal live response | `test_successful_live_probe_reports_sanitized_structured_result` verifies endpoint, HTTP 200, schema version, UTC time, timeout bound, and absence of the synthetic key | Pass with synthetic transport; no live-source claim |
| 4. Typed failures | Parameterized 429, 503, invalid JSON/HTML, unexpected schema, timeout, and transport-error tests verify non-zero results and bounded redacted diagnostics | Pass |
| 5. JSON result schema | `validate_result_schema` plus `test_cli_json_output_matches_documented_schema` verifies every fixture-mode CLI result field | Pass |
| 6. Offline CI | GitHub `repository-contract` run `32052162507`, job `95453866450`, passed at the exact build commit; local pytest completed 16 tests in 0.08 seconds | Pass |
| 7. Default-closed release control | Security authority, exact evidence bindings, fresh-context review, and rollback are specified; the 24-hour hold and human Gate 3 ruling remain outstanding | Pending until the named time and ruling |

## Edge, security, and reliability evidence

- A synthetic credential embedded in the request query is absent from structured and
  text output, timeout diagnostics, unexpected transport diagnostics, and test output.
- The transport accepts only the pinned `https://api.sam.gov` host with no custom port,
  uses Python 3.12's default certificate and hostname-verifying TLS context, and has a
  hard ten-second CLI maximum.
- Control characters are removed and diagnostics are capped at 240 characters.
- An HTML body with HTTP 200 is rejected as `invalid_json`.
- Fixtures missing pagination fields or `noticeId` are rejected as
  `unexpected_schema`.
- A non-UTC or unavailable clock fails closed as `clock_invalid`.
- Ruff, strict mypy, pytest, gitleaks, OSV, and Semgrep passed. The environment check
  reported 35 passes, the expected missing-SAM-credential warning, and zero failures.
- No runtime dependency was added.

## Human judgment checklist

- The text and JSON results distinguish unconfigured, unreachable, malformed, fixture
  healthy, and synthetically verified live-healthy states.
- Fixture mode explicitly reports connectivity and freshness as unevaluated.
- Every failure provides one bounded corrective action without a credential-bearing URL.
- Complete output from fixture and missing-credential modes is safe to place in a
  support ticket. A real live invocation remains subject to the same redaction tests.

## Rollback rehearsal

A detached disposable worktree was created at the exact build candidate. The
implementation commit was reverted with `git revert --no-commit`; the prior repository
contract suite then passed (`3 passed in 0.01s`) and `git diff --check` passed. The
rehearsal removed only the new tracer code, fixture, tests, and documentation. It did
not mutate source data, credentials, the frozen Exam, gate receipts, or audit history.
The disposable worktree was removed after the check.

## Remaining release controls

1. Preserve this build candidate unchanged through the 24-hour default-closed cooling
   period ending 2026-08-18T13:50:31-04:00.
2. Run one fresh-context review over the approved Brief, frozen Exam, exact build diff,
   this packet, and CI/rollback evidence. Any blocker remains default-closed.
3. Record role-aggregated human active minutes and gate latency without inventing
   unavailable provider telemetry. STR-002 remains excluded from comparative results.
4. Obtain the authenticated human Gate 3 ruling explicitly in Product, Technology, and
   solo-mode Security authority capacities.
5. Only after approval: mark PR #58 ready, merge through protected main, verify the first
   required main CI run, record Observe/Learn evidence, and close STR-002.

GATE 3: PENDING — cooling-off, fresh-context review, and authenticated human ruling required.

