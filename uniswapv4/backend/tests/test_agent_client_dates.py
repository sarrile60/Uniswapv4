"""
Backend tests for the agent client dates feature.

Covers:
- GET /api/public/agent-my-clients returns start_date/end_date for every client
- PUT /api/public/agent-update-client/{id} persists transaction_start_date/end_date
- POST /api/admin/migrate-user-dates backfills dates for users missing them
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://trading-app-preview-6.preview.emergentagent.com").rstrip("/")
BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36"
)

AGENT_USERNAME = "marco"
AGENT_PASSWORD = "agent123"
AGENT_PIN = "8971"

ADMIN_EMAIL = "admin@uniswapv4.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"User-Agent": BROWSER_UA, "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def agent_token(session):
    r = session.post(
        f"{BASE_URL}/api/public/agent-login",
        json={"username": AGENT_USERNAME, "password": AGENT_PASSWORD, "pin": AGENT_PIN},
    )
    assert r.status_code == 200, f"Agent login failed: {r.status_code} {r.text}"
    token = r.json()["data"]["token"]
    assert isinstance(token, str) and len(token) > 0
    return token


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    token = data.get("access_token") or data.get("token") or data.get("data", {}).get("token")
    assert token, f"No token in admin response: {data}"
    return token


# --- agent-my-clients ---

class TestAgentMyClients:
    def test_returns_clients_list(self, session, agent_token):
        r = session.get(
            f"{BASE_URL}/api/public/agent-my-clients",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        assert "data" in body and "clients" in body["data"]
        assert isinstance(body["data"]["clients"], list)

    def test_every_client_has_start_and_end_date_fields(self, session, agent_token):
        """Every client must include start_date and end_date keys (may be empty string)."""
        r = session.get(
            f"{BASE_URL}/api/public/agent-my-clients",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert r.status_code == 200
        clients = r.json()["data"]["clients"]
        if not clients:
            pytest.skip("No clients created by this agent yet")
        for c in clients:
            assert "start_date" in c, f"Missing start_date for client {c.get('id')}"
            assert "end_date" in c, f"Missing end_date for client {c.get('id')}"
            assert isinstance(c["start_date"], str)
            assert isinstance(c["end_date"], str)


# --- agent-update-client persists dates ---

class TestAgentUpdateClientDates:
    def _get_any_client_id(self, session, token):
        r = session.get(
            f"{BASE_URL}/api/public/agent-my-clients",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        clients = r.json()["data"]["clients"]
        if not clients:
            pytest.skip("No clients available to update")
        return clients[0]["id"]

    def test_update_dates_persists_on_user_record(self, session, agent_token):
        user_id = self._get_any_client_id(session, agent_token)

        new_start = "2024-02-10"
        new_end = "2025-07-20"

        upd = session.put(
            f"{BASE_URL}/api/public/agent-update-client/{user_id}",
            headers={"Authorization": f"Bearer {agent_token}"},
            json={
                "transaction_start_date": new_start,
                "transaction_end_date": new_end,
            },
        )
        assert upd.status_code == 200, f"Update failed: {upd.status_code} {upd.text}"
        assert upd.json().get("ok") is True

        # Verify persistence via subsequent GET
        r = session.get(
            f"{BASE_URL}/api/public/agent-my-clients",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert r.status_code == 200
        clients = r.json()["data"]["clients"]
        match = next((c for c in clients if c["id"] == user_id), None)
        assert match is not None, "Updated client not found in list"
        assert match["start_date"] == new_start, f"start_date not persisted: {match['start_date']}"
        assert match["end_date"] == new_end, f"end_date not persisted: {match['end_date']}"

    def test_update_only_start_date(self, session, agent_token):
        user_id = self._get_any_client_id(session, agent_token)
        new_start = "2024-03-15"
        upd = session.put(
            f"{BASE_URL}/api/public/agent-update-client/{user_id}",
            headers={"Authorization": f"Bearer {agent_token}"},
            json={"transaction_start_date": new_start},
        )
        assert upd.status_code == 200, upd.text

        r = session.get(
            f"{BASE_URL}/api/public/agent-my-clients",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        clients = r.json()["data"]["clients"]
        match = next((c for c in clients if c["id"] == user_id), None)
        assert match["start_date"] == new_start


# --- admin migrate-user-dates ---

class TestAdminMigrateUserDates:
    def test_migrate_endpoint_reachable_and_returns_counts(self, session, admin_token):
        r = session.post(
            f"{BASE_URL}/api/admin/migrate-user-dates",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200, f"Migration failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("ok") is True
        assert "updated" in body
        assert "checked" in body
        assert isinstance(body["updated"], int)
        assert isinstance(body["checked"], int)

    def test_migrate_requires_admin(self, session):
        r = session.post(f"{BASE_URL}/api/admin/migrate-user-dates")
        # No token -> 401/403
        assert r.status_code in (401, 403), f"Expected auth error, got {r.status_code}"


# --- security: agent endpoints require token ---

class TestSecurity:
    def test_agent_my_clients_requires_token(self, session):
        r = session.get(f"{BASE_URL}/api/public/agent-my-clients")
        assert r.status_code in (401, 403)

    def test_agent_update_client_requires_token(self, session):
        r = session.put(
            f"{BASE_URL}/api/public/agent-update-client/some-id",
            json={"transaction_start_date": "2024-01-01"},
        )
        assert r.status_code in (401, 403)
