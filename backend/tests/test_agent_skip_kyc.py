"""
Tests for Agent Skip KYC feature.
- POST /api/public/agent-skip-kyc/{user_id}: sets kyc=approved, sends reset email,
  but keeps freeze_type/account_status unchanged.
- GET /api/public/agent-my-clients: now returns kyc_status field for each client.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://email-heartbeat-fix.preview.emergentagent.com").rstrip("/")
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"}


@pytest.fixture(scope="module")
def agent_token():
    r = requests.post(
        f"{BASE_URL}/api/public/agent-login",
        json={"pin": "8971", "username": "marco", "password": "agent123"},
        headers=UA,
    )
    assert r.status_code == 200, f"Agent login failed: {r.status_code} {r.text}"
    return r.json()["data"]["token"]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@zenthos-eu.com", "password": "admin123"},
        headers=UA,
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["data"]["token"]


@pytest.fixture(scope="module")
def clients_list(agent_token):
    r = requests.get(
        f"{BASE_URL}/api/public/agent-my-clients",
        headers={**UA, "Authorization": f"Bearer {agent_token}"},
    )
    assert r.status_code == 200, r.text
    return r.json()["data"]["clients"]


# ---------- GET /api/public/agent-my-clients: kyc_status field ----------

def test_agent_my_clients_returns_kyc_status(clients_list):
    """Each client entry should include kyc_status field."""
    assert isinstance(clients_list, list)
    assert len(clients_list) > 0, "Expected at least one client for agent marco"
    for c in clients_list:
        assert "kyc_status" in c, f"kyc_status missing in client: {c.get('email')}"
        assert c["kyc_status"] in ("not_started", "pending", "approved", "rejected"), c["kyc_status"]


def test_bug20_testers_present(clients_list):
    """Bug20 tester accounts should be visible and not_started."""
    bug20 = [c for c in clients_list if c["email"].startswith("test_bug20_")]
    assert len(bug20) >= 1, "Expected at least one Bug20 tester with kyc=not_started"


# ---------- Skip KYC business logic ----------

def _find_not_approved_client(clients):
    for c in clients:
        if c.get("kyc_status") != "approved" and c["email"].startswith("test_bug20_"):
            return c
    return None


def _get_user_full(admin_token, email):
    r = requests.get(
        f"{BASE_URL}/api/admin/users",
        headers={**UA, "Authorization": f"Bearer {admin_token}"},
        params={"search": email},
    )
    if r.status_code != 200:
        return None
    users = r.json().get("data", {}).get("users", []) or r.json().get("users", [])
    for u in users:
        if u.get("email") == email:
            return u
    return None


def test_skip_kyc_success_and_state_transitions(agent_token, admin_token, clients_list):
    """POST /agent-skip-kyc/{id} sets kyc_status=approved, keeps freeze intact."""
    target = _find_not_approved_client(clients_list)
    if not target:
        pytest.skip("No non-approved Bug20 client available")

    # Capture pre-state via admin
    pre = _get_user_full(admin_token, target["email"])
    assert pre is not None, f"Could not fetch admin view for {target['email']}"
    pre_freeze = pre.get("freeze_type")
    pre_status = pre.get("account_status")

    # Call skip-kyc
    r = requests.post(
        f"{BASE_URL}/api/public/agent-skip-kyc/{target['id']}",
        headers={**UA, "Authorization": f"Bearer {agent_token}"},
    )
    assert r.status_code == 200, f"skip-kyc failed: {r.status_code} {r.text}"
    body = r.json()
    assert body.get("ok") is True
    assert "email_sent" in body

    # Give DB a moment
    time.sleep(0.5)

    # Verify state via admin
    post = _get_user_full(admin_token, target["email"])
    assert post is not None
    assert post.get("kyc_status") == "approved", f"kyc_status not approved: {post.get('kyc_status')}"
    assert post.get("password_reset_required") is True, "password_reset_required should be True"
    assert post.get("password_reset_token"), "password_reset_token should be set"
    # Freeze / account status must NOT change
    assert post.get("freeze_type") == pre_freeze, f"freeze_type changed: {pre_freeze} -> {post.get('freeze_type')}"
    assert post.get("account_status") == pre_status, f"account_status changed: {pre_status} -> {post.get('account_status')}"
    # Account should remain frozen (per requirement)
    assert post.get("account_status") == "frozen"


def test_skip_kyc_rejects_when_already_approved(agent_token):
    """After approval, calling skip-kyc again should return 400."""
    # Fetch fresh clients list
    r = requests.get(
        f"{BASE_URL}/api/public/agent-my-clients",
        headers={**UA, "Authorization": f"Bearer {agent_token}"},
    )
    assert r.status_code == 200
    clients = r.json()["data"]["clients"]
    approved = [c for c in clients if c.get("kyc_status") == "approved"]
    if not approved:
        pytest.skip("No approved client to test the 400 path")
    target = approved[0]
    r2 = requests.post(
        f"{BASE_URL}/api/public/agent-skip-kyc/{target['id']}",
        headers={**UA, "Authorization": f"Bearer {agent_token}"},
    )
    assert r2.status_code == 400, f"Expected 400, got {r2.status_code}: {r2.text}"
    assert "already approved" in r2.text.lower()


def test_skip_kyc_rejects_when_client_not_owned(agent_token):
    """Random/fake user_id should return 404 (not owned by this agent)."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    r = requests.post(
        f"{BASE_URL}/api/public/agent-skip-kyc/{fake_id}",
        headers={**UA, "Authorization": f"Bearer {agent_token}"},
    )
    assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"


def test_skip_kyc_requires_agent_auth():
    """Endpoint requires agent JWT."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    r = requests.post(f"{BASE_URL}/api/public/agent-skip-kyc/{fake_id}", headers=UA)
    assert r.status_code == 401
