"""SAM.gov source-health tracer.

The fixture path is the default and never performs network I/O. The live path is
explicit, bounded, and keeps credentials out of its result and error surfaces.
"""

from __future__ import annotations

import argparse
import http.client
import json
import os
import re
import ssl
import sys
import time
import urllib.parse
from collections.abc import Callable, Sequence
from datetime import UTC, datetime
from pathlib import Path
from typing import NotRequired, TypedDict

ADAPTER = "sam.gov"
ENDPOINT = "https://api.sam.gov/opportunities/v2/search"
SCHEMA_VERSION = "sam-opportunities-v2"
DEFAULT_FIXTURE = Path(__file__).resolve().parents[1] / "tests/fixtures/sam-opportunities.json"
MAX_TIMEOUT_SECONDS = 10.0
MAX_DIAGNOSTIC_LENGTH = 240


class HealthResult(TypedDict):
    adapter: str
    status: str
    configuration: str
    connectivity: str
    schema: str
    freshness: str
    endpoint: str
    http_status: int | None
    observed_schema_version: str | None
    checked_at: str
    latency_ms: int
    error_code: str | None
    correction: str | None
    diagnostic: NotRequired[str]


Transport = Callable[[str, float], tuple[int, bytes]]
Clock = Callable[[], datetime]


def _safe_timestamp(clock: Clock) -> str:
    observed = clock()
    if observed.tzinfo is None or observed.utcoffset() != UTC.utcoffset(observed):
        raise ValueError("clock must provide a UTC-aware timestamp")
    return observed.isoformat().replace("+00:00", "Z")


def _redact_diagnostic(value: object, secrets: Sequence[str] = ()) -> str:
    text = str(value)
    for secret in secrets:
        if secret:
            text = text.replace(secret, "[REDACTED]")
    text = re.sub(
        r"([?&](?:api_key|apikey|token|key)=)[^&\s]+",
        r"\1[REDACTED]",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"[\x00-\x1f\x7f]+", " ", text)
    return text[:MAX_DIAGNOSTIC_LENGTH]


def _base_result(*, checked_at: str, latency_ms: int = 0) -> HealthResult:
    return {
        "adapter": ADAPTER,
        "status": "degraded",
        "configuration": "not_configured",
        "connectivity": "not_tested",
        "schema": "not_evaluated",
        "freshness": "not_evaluated",
        "endpoint": ENDPOINT,
        "http_status": None,
        "observed_schema_version": None,
        "checked_at": checked_at,
        "latency_ms": latency_ms,
        "error_code": None,
        "correction": None,
    }


def _clock_failure(exc: Exception) -> HealthResult:
    result = _base_result(checked_at="unavailable")
    result["status"] = "failed"
    result["error_code"] = "clock_invalid"
    result["correction"] = "Use a UTC-aware system clock and retry the check."
    result["diagnostic"] = _redact_diagnostic(exc)
    return result


def _validate_sam_payload(payload: object) -> bool:
    if not isinstance(payload, dict):
        return False
    required = ("totalRecords", "limit", "offset", "opportunitiesData")
    if any(field not in payload for field in required):
        return False
    opportunities = payload["opportunitiesData"]
    if not isinstance(opportunities, list):
        return False
    return all(isinstance(item, dict) and bool(item.get("noticeId")) for item in opportunities)


def validate_result_schema(result: object) -> bool:
    """Validate the stable result contract without adding a runtime dependency."""
    if not isinstance(result, dict):
        return False
    required_types: dict[str, type | tuple[type, ...]] = {
        "adapter": str,
        "status": str,
        "configuration": str,
        "connectivity": str,
        "schema": str,
        "freshness": str,
        "endpoint": str,
        "http_status": (int, type(None)),
        "observed_schema_version": (str, type(None)),
        "checked_at": str,
        "latency_ms": int,
        "error_code": (str, type(None)),
        "correction": (str, type(None)),
    }
    return all(
        key in result and isinstance(result[key], expected)
        for key, expected in required_types.items()
    )


def run_fixture(
    path: Path = DEFAULT_FIXTURE,
    *,
    clock: Clock = lambda: datetime.now(UTC),
) -> HealthResult:
    try:
        checked_at = _safe_timestamp(clock)
    except Exception as exc:
        return _clock_failure(exc)
    started = time.perf_counter()
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        result = _base_result(checked_at=checked_at, latency_ms=_elapsed_ms(started))
        result["configuration"] = "fixture"
        result["status"] = "failed"
        result["error_code"] = "fixture_unreadable"
        result["correction"] = "Restore the committed SAM.gov fixture and retry."
        result["diagnostic"] = _redact_diagnostic(exc)
        return result
    result = _base_result(checked_at=checked_at, latency_ms=_elapsed_ms(started))
    result["configuration"] = "fixture"
    if not _validate_sam_payload(payload):
        result["status"] = "failed"
        result["schema"] = "unexpected"
        result["error_code"] = "unexpected_schema"
        result["correction"] = "Restore the required SAM.gov notice and pagination fields."
        return result
    result["status"] = "healthy"
    result["schema"] = "healthy"
    result["observed_schema_version"] = SCHEMA_VERSION
    return result


def _http_get(url: str, timeout: float) -> tuple[int, bytes]:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname != "api.sam.gov" or parsed.port is not None:
        raise ValueError("live source host must be the pinned SAM.gov HTTPS endpoint")
    target = parsed.path + (f"?{parsed.query}" if parsed.query else "")
    tls_context = ssl.create_default_context()
    # Python 3.12 is pinned; the default context verifies the certificate and hostname.
    connection = http.client.HTTPSConnection(  # nosemgrep
        "api.sam.gov",
        timeout=timeout,
        context=tls_context,
    )
    try:
        connection.request("GET", target, headers={"Accept": "application/json"})
        response = connection.getresponse()
        return response.status, response.read()
    finally:
        connection.close()


def _elapsed_ms(started: float) -> int:
    return max(0, round((time.perf_counter() - started) * 1000))


def run_live(
    api_key: str | None,
    *,
    timeout: float = 5.0,
    transport: Transport = _http_get,
    clock: Clock = lambda: datetime.now(UTC),
) -> HealthResult:
    try:
        checked_at = _safe_timestamp(clock)
    except Exception as exc:
        return _clock_failure(exc)
    if not api_key:
        result = _base_result(checked_at=checked_at)
        result["status"] = "not_configured"
        result["error_code"] = "missing_credential"
        result["correction"] = "Set SAM_API_KEY and explicitly request live mode."
        return result
    timeout = min(max(timeout, 0.1), MAX_TIMEOUT_SECONDS)
    query = urllib.parse.urlencode(
        {
            "api_key": api_key,
            "limit": "1",
            "offset": "0",
            "postedFrom": "01/01/2000",
            "postedTo": "01/02/2000",
        }
    )
    started = time.perf_counter()
    result = _base_result(checked_at=checked_at)
    result["configuration"] = "configured"
    try:
        status_code, body = transport(f"{ENDPOINT}?{query}", timeout)
    except TimeoutError as exc:
        result["latency_ms"] = _elapsed_ms(started)
        result["status"] = "degraded"
        result["connectivity"] = "timeout"
        result["error_code"] = "timeout"
        result["correction"] = "Retry the bounded live check after verifying network access."
        result["diagnostic"] = _redact_diagnostic(exc, [api_key])
        return result
    except Exception as exc:
        result["latency_ms"] = _elapsed_ms(started)
        result["status"] = "degraded"
        result["connectivity"] = "failed"
        result["error_code"] = "transport_error"
        result["correction"] = (
            "Verify TLS and network access, then retry the bounded live check."
        )
        result["diagnostic"] = _redact_diagnostic(exc, [api_key])
        return result
    result["latency_ms"] = _elapsed_ms(started)
    result["http_status"] = status_code
    if status_code == 429:
        result["status"] = "degraded"
        result["connectivity"] = "rate_limited"
        result["error_code"] = "rate_limited"
        result["correction"] = "Wait for the SAM.gov rate limit to reset before retrying."
        return result
    if status_code >= 500:
        result["status"] = "degraded"
        result["connectivity"] = "upstream_error"
        result["error_code"] = "upstream_error"
        result["correction"] = "Retry after SAM.gov service health recovers."
        return result
    if not 200 <= status_code < 300:
        result["status"] = "failed"
        result["connectivity"] = "rejected"
        result["error_code"] = "http_error"
        result["correction"] = "Verify the credential and request parameters before retrying."
        return result
    result["connectivity"] = "healthy"
    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        result["status"] = "failed"
        result["schema"] = "malformed"
        result["error_code"] = "invalid_json"
        result["correction"] = "Treat the live response as malformed and retry later."
        result["diagnostic"] = _redact_diagnostic(exc, [api_key])
        return result
    if not _validate_sam_payload(payload):
        result["status"] = "failed"
        result["schema"] = "unexpected"
        result["error_code"] = "unexpected_schema"
        result["correction"] = (
            "Inspect the SAM.gov adapter contract before accepting this response."
        )
        return result
    result["status"] = "healthy"
    result["schema"] = "healthy"
    result["observed_schema_version"] = SCHEMA_VERSION
    return result


def render_text(result: HealthResult) -> str:
    return "\n".join(
        (
            "SAM.gov source health",
            f"status: {result['status']}",
            f"configuration: {result['configuration']}",
            f"connectivity: {result['connectivity']}",
            f"schema: {result['schema']}",
            f"freshness: {result['freshness']}",
            f"endpoint: {result['endpoint']}",
            f"http_status: {result['http_status']}",
            f"observed_schema_version: {result['observed_schema_version']}",
            f"checked_at: {result['checked_at']}",
            f"latency_ms: {result['latency_ms']}",
            f"error_code: {result['error_code']}",
            f"correction: {result['correction']}",
        )
    )


def exit_code(result: HealthResult) -> int:
    if result["status"] == "healthy":
        return 0
    return 2 if result["status"] == "not_configured" else 1


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check the SAM.gov source adapter health.")
    parser.add_argument("--mode", choices=("fixture", "live"), default="fixture")
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--fixture", type=Path, default=DEFAULT_FIXTURE)
    parser.add_argument("--timeout", type=float, default=5.0)
    args = parser.parse_args(argv)
    if not 0 < args.timeout <= MAX_TIMEOUT_SECONDS:
        parser.error(
            f"--timeout must be greater than 0 and at most {MAX_TIMEOUT_SECONDS:g} seconds"
        )
    result = (
        run_fixture(args.fixture)
        if args.mode == "fixture"
        else run_live(os.getenv("SAM_API_KEY"), timeout=args.timeout)
    )
    if args.format == "json":
        print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    else:
        print(render_text(result))
    return exit_code(result)


if __name__ == "__main__":
    sys.exit(main())
