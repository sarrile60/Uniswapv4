"""
Regression tests for the timer_duration_hours '' -> None bug affecting:
  - login for agent-created users
  - admin update of agent-created users (UserPublic serialization)
  - agent_my_clients response (timer_duration_hours must be None, not '')

Covers:
  1. Login as agent-created user works with correct password.
  2. Admin PUT /api/admin/users/{id} succeeds (no 500 from UserPublic).
  3. Admin can change password via plain_password; login works with new password.
  4. /api/public/agent-my-clients returns timer_duration_hours as None (not '').
  5. Full agent-create-user -> user login cycle works end-to-end.
"""
import os
import time
import pytest
import requests
from datetime import datetime, timezone

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://uniswap-v4-preview.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# Browser UA required (bot-detection middleware blocks curl)
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
}

AGENT_PIN = "8971"
AGENT_USER = "marco"
AGENT_PASS = "agent123"
ADMIN_EMAIL = "admin@uniswapv4.com"
ADMIN_PASS = "admin123"

# Existing agent-created client per handoff notes
EXISTING_USER_EMAIL = "agentfinal_1781535154@test.com"
EXISTING_USER_PASSWORD = "testing123"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update(HEADERS)
    return sess


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return r.json()["data"]["token"]


@pytest.fixture(scope="module")
def agent_token(s):
    r = s.post(f"{API}/public/agent-login", json={"pin": AGENT_PIN, "username": AGENT_USER, "password": AGENT_PASS})
    assert r.status_code == 200, r.text
    return r.json()["data"]["token"]


# ---------------- Tests ----------------
class TestExistingAgentUserLogin:
    """Agent-created user 'Final Test' should be able to login."""

    def test_login_existing_agent_created_user(self, s):
        r = s.post(f"{API}/auth/login", json={"email": EXISTING_USER_EMAIL, "password": EXISTING_USER_PASSWORD})
        assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("ok") is True
        user = body["data"]["user"]
        assert user["email"] == EXISTING_USER_EMAIL
        # timer_duration_hours must be None or int (never '')
        assert user.get("timer_duration_hours") in (None,) or isinstance(user.get("timer_duration_hours"), int)


class TestAdminUpdateAgentUser:
    """Admin PUT /admin/users/{id} should succeed for agent-created users."""

    def _get_user_id(self, s, admin_token, email):
        r = s.get(f"{API}/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200, r.text
        users = r.json()["data"]["users"]
        for u in users:
            if u["email"] == email:
                return u["id"]
        pytest.skip(f"User {email} not found")

    def test_admin_update_agent_user_no_500(self, s, admin_token):
        uid = self._get_user_id(s, admin_token, EXISTING_USER_EMAIL)
        # Trivial update: just change first_name; should NOT 500 due to timer_duration_hours=''
        r = s.put(
            f"{API}/admin/users/{uid}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"first_name": "FinalTestUpd"},
        )
        assert r.status_code == 200, f"Admin update failed: {r.status_code} {r.text}"
        body = r.json()
        assert body["ok"] is True
        user = body["data"]["user"]
        assert user["first_name"] == "FinalTestUpd"
        # Verify timer_duration_hours is None (not '')
        assert user.get("timer_duration_hours") in (None,) or isinstance(user.get("timer_duration_hours"), int)

    def test_admin_update_password_then_login(self, s, admin_token):
        uid = self._get_user_id(s, admin_token, EXISTING_USER_EMAIL)
        new_pw = f"newpw_{int(time.time())}"

        r = s.put(
            f"{API}/admin/users/{uid}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"plain_password": new_pw},
        )
        assert r.status_code == 200, f"Password update failed: {r.status_code} {r.text}"

        # Now login with new password
        r2 = s.post(f"{API}/auth/login", json={"email": EXISTING_USER_EMAIL, "password": new_pw})
        assert r2.status_code == 200, f"Login with new password failed: {r2.status_code} {r2.text}"

        # Restore original password for future runs
        r3 = s.put(
            f"{API}/admin/users/{uid}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"plain_password": EXISTING_USER_PASSWORD},
        )
        assert r3.status_code == 200


class TestAgentMyClients:
    """agent_my_clients should return timer_duration_hours as None, never ''."""

    def test_timer_duration_hours_is_none_or_int(self, s, agent_token):
        r = s.get(f"{API}/public/agent-my-clients", headers={"Authorization": f"Bearer {agent_token}"})
        assert r.status_code == 200, r.text
        clients = r.json()["data"]["clients"]
        assert len(clients) >= 1
        for c in clients:
            v = c.get("timer_duration_hours")
            assert v is None or isinstance(v, int), f"timer_duration_hours must be None or int, got {v!r}"


class TestAgentCreateUserFullCycle:
    """Full flow: agent creates user -> that user logs in with correct password."""

    def test_agent_create_user_and_login(self, s, agent_token):
        # Check wallet pool availability first
        pool = s.get(f"{API}/public/wallet-pool-count").json()
        available = pool.get("available", pool.get("data", {}).get("available", 0)) if isinstance(pool, dict) else 0
        if available < 1:
            pytest.skip("No available wallets in pool")

        ts = int(time.time())
        email = f"test_bug20_{ts}@test.com"
        password = "TestPass123!"
        payload = {
            "email": email,
            "username": f"testbug20_{ts}",
            "password": password,
            "first_name": "Bug20",
            "middle_name": "",
            "last_name": "Tester",
            "date_of_birth": "1990-01-01",
            "start_date": "2024-01-01",
            "end_date": "2025-01-01",
            "eur_amount": "0",
            "total_fees": "0",
            # timer_duration_hours intentionally omitted -> tests the '' -> None sanitization
        }
        r = s.post(f"{API}/public/agent-create-user", headers={"Authorization": f"Bearer {agent_token}"}, json=payload)
        assert r.status_code == 200, f"Agent create user failed: {r.status_code} {r.text}"

        # Now the created user should be able to login
        time.sleep(0.5)
        r2 = s.post(f"{API}/auth/login", json={"email": email, "password": password})
        assert r2.status_code == 200, f"Newly created user login failed: {r2.status_code} {r2.text}"
        user = r2.json()["data"]["user"]
        assert user["email"] == email
        # Bug regression: must not be ''
        assert user.get("timer_duration_hours") in (None,) or isinstance(user.get("timer_duration_hours"), int)
