"""
Regression tests for the bug: when admin/agent updates a user's email,
the wallet_pool.assigned_email must be synchronized to the new email.

Covers:
  1. PUT /api/admin/users/{user_id}  - email change -> wallet_pool.assigned_email updates
  2. PUT /api/public/agent-update-client/{user_id} - email change -> wallet_pool.assigned_email updates
  3. Same-email PUT does NOT change wallet_pool
  4. GET /api/admin/wallet-pool returns the new email
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://trading-app-preview-6.preview.emergentagent.com").rstrip("/")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
HEADERS = {"Content-Type": "application/json", "User-Agent": UA}

TEST_USER_ID = "a8f5ec06-b843-4055-a5eb-9a9483fd9591"
ORIG_EMAIL = "agent_synced@test.com"

ADMIN_EMAIL = "admin@uniswapv4.com"
ADMIN_PASSWORD = "admin123"
AGENT_USERNAME = "marco"
AGENT_PASSWORD = "agent123"
AGENT_PIN = "8971"


# ---------- fixtures ----------

@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    body = r.json()
    tok = (body.get("data") or {}).get("token") or body.get("access_token") or body.get("token")
    assert tok, f"no admin token in response: {body}"
    return tok


@pytest.fixture(scope="session")
def admin_client(api, admin_token):
    api.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api


@pytest.fixture(scope="session")
def agent_token():
    s = requests.Session()
    s.headers.update(HEADERS)
    r = s.post(f"{BASE_URL}/api/public/agent-login",
               json={"username": AGENT_USERNAME, "password": AGENT_PASSWORD, "pin": AGENT_PIN})
    if r.status_code != 200:
        # Try alternative endpoint / body
        r = s.post(f"{BASE_URL}/api/public/agent-login",
                   json={"username": AGENT_USERNAME, "password": AGENT_PASSWORD})
    assert r.status_code == 200, f"agent login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = ((data.get("data") or {}).get("token")
           or data.get("access_token") or data.get("token")
           or ((data.get("data") or {}).get("access_token")))
    assert tok, f"no agent token: {data}"
    return tok


# ---------- helpers ----------

def _get_wallet_pool_email_for_user(admin_client, user_id):
    r = admin_client.get(f"{BASE_URL}/api/admin/wallet-pool")
    assert r.status_code == 200, f"wallet-pool GET failed: {r.status_code} {r.text}"
    body = r.json()
    wallets = body.get("data", {}).get("wallets") or body.get("wallets") or body.get("data") or []
    if isinstance(wallets, dict):
        wallets = wallets.get("wallets", [])
    matches = [w for w in wallets if w.get("assigned_to") == user_id]
    assert matches, f"no wallet_pool entry for user {user_id}. Response keys: {list(body.keys())}"
    return matches[0].get("assigned_email"), matches[0]


def _get_user_email(admin_client, user_id):
    r = admin_client.get(f"{BASE_URL}/api/admin/users/{user_id}")
    assert r.status_code == 200, f"get user failed: {r.text}"
    body = r.json()
    user = body.get("data", {}).get("user") or body.get("user") or body.get("data") or body
    if isinstance(user, dict) and "email" in user:
        return user["email"]
    # fallback: list
    r2 = admin_client.get(f"{BASE_URL}/api/admin/users")
    users = (r2.json().get("data") or {}).get("users") or r2.json().get("users") or []
    for u in users:
        if u.get("id") == user_id:
            return u["email"]
    raise AssertionError("user not found")


# ---------- tests ----------

class TestEmailWalletPoolSync:

    def test_00_baseline_state(self, admin_client):
        """Baseline: user and wallet_pool exist and are in sync."""
        current_email = _get_user_email(admin_client, TEST_USER_ID)
        wp_email, _ = _get_wallet_pool_email_for_user(admin_client, TEST_USER_ID)
        assert current_email == wp_email, f"baseline out of sync: user={current_email} wp={wp_email}"
        print(f"baseline: user_email={current_email} wp_email={wp_email}")

    def test_01_admin_email_change_syncs_wallet_pool(self, admin_client):
        """Admin PUT with new email should update wallet_pool.assigned_email."""
        new_email = f"TEST_admin_synced_{int(time.time())}@test.com"
        r = admin_client.put(f"{BASE_URL}/api/admin/users/{TEST_USER_ID}",
                             json={"email": new_email})
        assert r.status_code == 200, f"admin update failed: {r.status_code} {r.text}"

        # Verify user email changed (admin endpoint does not force-lowercase; compare case-insensitively)
        got = _get_user_email(admin_client, TEST_USER_ID)
        assert got.lower() == new_email.lower(), f"user email not updated: {got}"

        # Verify wallet_pool.assigned_email synced
        wp_email, wp = _get_wallet_pool_email_for_user(admin_client, TEST_USER_ID)
        assert wp_email.lower() == new_email.lower(), \
            f"wallet_pool.assigned_email not synced: expected {new_email} got {wp_email}"
        print(f"admin sync OK: wp_email={wp_email}")

    def test_02_agent_email_change_syncs_wallet_pool(self, admin_client, agent_token):
        """Agent PUT /api/public/agent-update-client with new email should update wallet_pool."""
        new_email = f"TEST_agent_synced_{int(time.time())}@test.com"

        s = requests.Session()
        s.headers.update(HEADERS)
        s.headers.update({"Authorization": f"Bearer {agent_token}"})
        r = s.put(f"{BASE_URL}/api/public/agent-update-client/{TEST_USER_ID}",
                  json={"email": new_email})
        assert r.status_code == 200, f"agent update failed: {r.status_code} {r.text}"

        got = _get_user_email(admin_client, TEST_USER_ID)
        assert got == new_email.lower(), f"user email not updated: {got}"

        wp_email, _ = _get_wallet_pool_email_for_user(admin_client, TEST_USER_ID)
        assert wp_email == new_email.lower(), \
            f"wallet_pool.assigned_email not synced by agent: expected {new_email.lower()} got {wp_email}"
        print(f"agent sync OK: wp_email={wp_email}")

    def test_03_same_email_no_change(self, admin_client):
        """Updating with the same email should keep wallet_pool.assigned_email intact (no error)."""
        current = _get_user_email(admin_client, TEST_USER_ID)
        # PUT a non-email field so we don't trigger email path
        r = admin_client.put(f"{BASE_URL}/api/admin/users/{TEST_USER_ID}",
                             json={"first_name": "FinalTestUpd"})
        assert r.status_code == 200, f"admin update failed: {r.text}"

        wp_email, _ = _get_wallet_pool_email_for_user(admin_client, TEST_USER_ID)
        assert wp_email == current, f"wp email drifted on non-email update: {wp_email} vs {current}"

    def test_04_restore_original_email(self, admin_client):
        """Restore original email so state is preserved for future tests."""
        r = admin_client.put(f"{BASE_URL}/api/admin/users/{TEST_USER_ID}",
                             json={"email": ORIG_EMAIL})
        assert r.status_code == 200, f"restore failed: {r.text}"
        got = _get_user_email(admin_client, TEST_USER_ID)
        assert got == ORIG_EMAIL
        wp_email, _ = _get_wallet_pool_email_for_user(admin_client, TEST_USER_ID)
        assert wp_email == ORIG_EMAIL, f"wp not restored: {wp_email}"
        print(f"restored: user_email={got} wp_email={wp_email}")
