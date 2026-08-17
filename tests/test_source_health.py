from __future__ import annotations

import json
import subprocess
import sys
import time
from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path

import pytest

from federal_bd.source_health import (
    ENDPOINT,
    exit_code,
    render_text,
    run_fixture,
    run_live,
    validate_result_schema,
)

FIXTURE = Path(__file__).parent / "fixtures/sam-opportunities.json"
NOW = datetime(2026, 8, 17, 18, 0, tzinfo=UTC)
VALID_PAYLOAD = json.dumps(
    {
        "totalRecords": 1,
        "limit": 1,
        "offset": 0,
        "opportunitiesData": [{"noticeId": "synthetic-1"}],
    }
).encode()


def fixed_clock() -> datetime:
    return NOW


def test_offline_fixture_is_healthy_fast_and_network_free() -> None:
    started = time.perf_counter()
    result = run_fixture(FIXTURE, clock=fixed_clock)
    assert time.perf_counter() - started < 5
    assert result["status"] == "healthy"
    assert result["configuration"] == "fixture"
    assert result["connectivity"] == "not_tested"
    assert result["schema"] == "healthy"
    assert result["freshness"] == "not_evaluated"
    assert validate_result_schema(result)
    assert exit_code(result) == 0


def test_live_without_key_is_not_configured_and_does_not_call_transport() -> None:
    called = False

    def forbidden_transport(url: str, timeout: float) -> tuple[int, bytes]:
        nonlocal called
        called = True
        raise AssertionError((url, timeout))

    result = run_live(None, transport=forbidden_transport, clock=fixed_clock)
    assert result["status"] == "not_configured"
    assert result["error_code"] == "missing_credential"
    assert "SAM_API_KEY" in str(result["correction"])
    assert called is False
    assert exit_code(result) == 2


def test_successful_live_probe_reports_sanitized_structured_result() -> None:
    key = "top-secret-api-key"

    def transport(url: str, timeout: float) -> tuple[int, bytes]:
        assert key in url
        assert timeout <= 10
        return 200, VALID_PAYLOAD

    result = run_live(key, transport=transport, clock=fixed_clock)
    encoded = json.dumps(result)
    assert result["status"] == "healthy"
    assert result["configuration"] == "configured"
    assert result["connectivity"] == "healthy"
    assert result["endpoint"] == ENDPOINT
    assert result["http_status"] == 200
    assert result["observed_schema_version"] == "sam-opportunities-v2"
    assert result["checked_at"] == "2026-08-17T18:00:00Z"
    assert key not in encoded
    assert "api_key=" not in encoded
    assert validate_result_schema(result)


@pytest.mark.parametrize(
    ("status", "body", "expected"),
    [
        (429, b"rate limited", "rate_limited"),
        (503, b"unavailable", "upstream_error"),
        (200, b"<html>not json</html>", "invalid_json"),
        (200, json.dumps({"opportunitiesData": [{}]}).encode(), "unexpected_schema"),
    ],
)
def test_live_failures_are_typed_and_nonzero(
    status: int,
    body: bytes,
    expected: str,
) -> None:
    result = run_live("secret", transport=lambda url, timeout: (status, body), clock=fixed_clock)
    assert result["error_code"] == expected
    assert result["status"] in {"degraded", "failed"}
    assert exit_code(result) == 1
    assert validate_result_schema(result)


def test_timeout_is_typed_and_secret_is_redacted() -> None:
    key = "timeout-secret"

    def timeout_transport(url: str, timeout: float) -> tuple[int, bytes]:
        raise TimeoutError(f"timed out for {url}\x00")

    result = run_live(key, transport=timeout_transport, clock=fixed_clock)
    assert result["error_code"] == "timeout"
    assert key not in json.dumps(result)
    assert "\x00" not in result.get("diagnostic", "")


def test_unexpected_transport_error_is_bounded_and_redacted() -> None:
    key = "transport-secret"

    def failed_transport(url: str, timeout: float) -> tuple[int, bytes]:
        raise RuntimeError(f"failure at {url}\n" + "x" * 1000)

    result = run_live(key, transport=failed_transport, clock=fixed_clock)
    diagnostic = result["diagnostic"]
    assert result["error_code"] == "transport_error"
    assert key not in diagnostic
    assert len(diagnostic) <= 240
    assert "\n" not in diagnostic


def test_fixture_schema_requires_notice_and_pagination(tmp_path: Path) -> None:
    invalid = tmp_path / "fixture.json"
    invalid.write_text('{"opportunitiesData":[{}]}', encoding="utf-8")
    result = run_fixture(invalid, clock=fixed_clock)
    assert result["error_code"] == "unexpected_schema"
    assert result["schema"] == "unexpected"
    assert exit_code(result) == 1


def test_non_utc_clock_fails_closed() -> None:
    local_zone = timezone(timedelta(hours=-4))
    result = run_live("secret", clock=lambda: NOW.astimezone(local_zone))
    assert result["status"] == "failed"
    assert result["error_code"] == "clock_invalid"
    assert result["checked_at"] == "unavailable"


def test_plain_text_is_shareable_and_contains_no_secret() -> None:
    result = run_live(
        "secret",
        transport=lambda url, timeout: (200, VALID_PAYLOAD),
        clock=fixed_clock,
    )
    output = render_text(result)
    assert output.startswith("SAM.gov source health\n")
    assert "status: healthy" in output
    assert "secret" not in output


def test_cli_json_output_matches_documented_schema() -> None:
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "federal_bd.source_health",
            "--mode",
            "fixture",
            "--format",
            "json",
        ],
        check=False,
        capture_output=True,
        text=True,
        timeout=5,
    )
    assert completed.returncode == 0
    assert completed.stderr == ""
    assert validate_result_schema(json.loads(completed.stdout))

