import subprocess
import sys
from pathlib import Path

import pytest


API_ROOT = Path(__file__).resolve().parents[1]

SECURITY_SCRIPTS = [
    (
        "Customer isolation",
        API_ROOT / "test_customer_isolation.py",
        "ALL CUSTOMER ISOLATION TESTS PASSED.",
    ),
    (
        "Admin security",
        API_ROOT / "test_admin_security.py",
        "ALL ADMIN SECURITY TESTS PASSED.",
    ),
]


@pytest.mark.parametrize(
    "test_name,script_path,success_message",
    SECURITY_SCRIPTS,
)
def test_security_integration(
    test_name,
    script_path,
    success_message,
):
    assert script_path.is_file(), (
        f"Missing security script: {script_path}"
    )

    result = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=str(API_ROOT),
        capture_output=True,
        text=True,
        timeout=240,
    )

    output = result.stdout + "\n" + result.stderr

    assert result.returncode == 0, (
        f"{test_name} failed:\n{output}"
    )

    assert success_message in result.stdout, (
        f"{test_name} did not confirm success:\n{output}"
    )