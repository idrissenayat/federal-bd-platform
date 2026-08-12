from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def test_steer_control_artifacts_exist() -> None:
    required_paths = (
        "AGENTS.md",
        "steer/EXPERIMENT-CHARTER.md",
        "steer/CONTROL-WORKFLOW.md",
        "steer/EXPERIMENT-REGISTER.md",
        "steer/operating-system/GATES.md",
        "steer/operating-system/GUARDRAIL-LIBRARY.md",
        "steer/TEAM-ENVIRONMENT.md",
        "steer/TEAM-COMMUNICATION.md",
        "steer/AGENT-ONBOARDING.md",
        "steer/BUZZ-OPERATING-CONTRACT.md",
        "integrations/buzz/README.md",
        "integrations/buzz/agent-roster.yaml",
        "integrations/buzz/provision_openproject.rb",
        "CONTRIBUTING.md",
        "SECURITY.md",
        ".github/CODEOWNERS",
        ".github/pull_request_template.md",
        ".github/ISSUE_TEMPLATE/candidate.yml",
        ".github/ISSUE_TEMPLATE/escalation.yml",
        ".github/branch-protection.json",
        "scripts/configure-github.sh",
        "scripts/check-team-environment.sh",
        "scripts/run-semgrep.sh",
        "scripts/prove-lane-isolation.sh",
    )

    missing = [path for path in required_paths if not (REPO_ROOT / path).is_file()]

    assert not missing, f"Missing STEER control artifacts: {missing}"


def test_buzz_roster_contains_no_credentials() -> None:
    roster = (REPO_ROOT / "integrations/buzz/agent-roster.yaml").read_text().lower()

    forbidden_assignments = ("api_key:", "token:", "password:", "secret:")
    assert not any(name in roster for name in forbidden_assignments)
    assert "agent-critic-steer" in roster
    assert "agent_gate_approval: denied" in roster

    provisioner = (REPO_ROOT / "integrations/buzz/provision_openproject.rb").read_text()
    assert "Token::API.create!" not in provisioner


def test_runtime_versions_are_pinned() -> None:
    assert (REPO_ROOT / ".python-version").read_text().strip() == "3.12"
    assert (REPO_ROOT / ".node-version").read_text().strip() == "20"


def test_example_credentials_are_not_populated() -> None:
    example_lines = (REPO_ROOT / ".env.example").read_text().splitlines()
    credential_values = {
        key: value
        for line in example_lines
        if "=" in line
        for key, value in [line.split("=", maxsplit=1)]
        if key.endswith(("API_KEY", "TOKEN", "SECRET"))
    }

    assert all(not value for value in credential_values.values())
