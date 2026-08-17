# SAM.gov source-health tracer

The tracer separates committed-fixture validation from an explicit live connectivity
probe. Fixture mode is the default and is safe for CI:

```bash
uv run python -m federal_bd.source_health --mode fixture
uv run python -m federal_bd.source_health --mode fixture --format json
```

Fixture health proves only configuration and schema compatibility. It reports
`connectivity=not_tested` and `freshness=not_evaluated`; it is never evidence that the
live source is reachable or current.

Live mode is opt-in, uses a minimal authenticated `GET`, and has a five-second default
timeout with a hard ten-second maximum:

```bash
SAM_API_KEY=... uv run python -m federal_bd.source_health --mode live --format json
```

If `SAM_API_KEY` is absent, the command returns `not_configured` without attempting a
request. Output never includes the credential or a credential-bearing URL.

## JSON result contract

Every result contains `adapter`, `status`, `configuration`, `connectivity`, `schema`,
`freshness`, sanitized `endpoint`, nullable `http_status`, nullable
`observed_schema_version`, UTC `checked_at`, `latency_ms`, nullable `error_code`, and
nullable corrective action. Failures may add a bounded, control-character-free
`diagnostic`. Exit `0` means healthy, `2` means the live credential is not configured,
and `1` means degraded or failed.

## Rollback

Revert the exact implementation commit through a protected pull request, run the
repository gauntlet, and verify fixture mode still reports an honest local result. The
tracer stores no source data or credentials, so rollback must not delete or rewrite
audit evidence.

