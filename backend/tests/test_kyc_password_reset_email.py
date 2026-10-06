"""
Bug regression tests: KYC → password reset email flow.

Covers:
  1. Startup re-schedule log for pending KYC after server restart
  2. EmailService singleton is configured (env var OR DB settings)
  3. Auto-approve KYC direct call sets password_reset_token, password_reset_required,
     unfreezes user, and inserts an email_log row (freeze_type=both AND unusual_activity)
  4. Auto-approve is idempotent (does nothing when already approved) and respects
     the disabled feature flag
  5. Manual admin KYC review approval sends the password reset email
  6. Forgot-password endpoint fallback works
"""

import asyncio
import os
import sys
import time
import uuid
import pytest
import requests
from datetime import datetime, timezone, timedelta

# Load backend .env into process env for direct-import tests
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

sys.path.insert(0, "/app/backend")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env preview URL for backend base
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except FileNotFoundError:
        pass

API = f"{BASE_URL}/api"

# Non-bot UA (BotDetectionMiddleware blocks common scanner UAs)
UA_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Content-Type": "application/json",
}

ADMIN_EMAIL = "admin@uniswapv4.com"
ADMIN_PASSWORD = "admin123"

# ── shared event loop (server.py binds motor client to first loop it sees) ───
_LOOP = asyncio.new_event_loop()
asyncio.set_event_loop(_LOOP)


def run_async(coro):
    """Run coroutine on the shared module event loop.
    All server-side motor operations must use this single loop, otherwise motor
    raises 'Event loop is closed' when server.db was bound to a previous loop.
    """
    return _LOOP.run_until_complete(coro)


# ── shared fixtures ────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update(UA_HEADERS)
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = (data.get("data") or {}).get("token") or data.get("token")
    assert tok, f"No token in login response: {data}"
    return tok


@pytest.fixture(scope="session")
def admin_client(api, admin_token):
    s = requests.Session()
    s.headers.update({**UA_HEADERS, "Authorization": f"Bearer {admin_token}"})
    return s


# ── async DB helpers ───────────────────────────────────────────────────────────
async def _get_db():
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    return client, client[os.environ["DB_NAME"]]


async def _create_test_user_frozen(db, freeze_type: str, email_suffix: str = None) -> dict:
    """Create a TEST_ prefixed user in frozen+kyc-pending state."""
    from models import UserRole
    uid = f"TEST_KYC_{uuid.uuid4().hex[:12]}"
    email = f"test_kyc_{email_suffix or uuid.uuid4().hex[:8]}@test.uniswapv4.local"
    now = datetime.now(timezone.utc).isoformat()
    user_doc = {
        "id": uid,
        "email": email,
        "username": f"test_kyc_{uuid.uuid4().hex[:12]}",
        "first_name": "Test",
        "last_name": "KYCUser",
        "password_hash": "$2b$12$placeholderhashthatshouldneverwork1234567890abcdef",
        "role": UserRole.USER.value if hasattr(UserRole.USER, "value") else "user",
        "account_status": "frozen",
        "freeze_type": freeze_type,
        "kyc_status": "pending",
        "kyc_submitted_at": now,
        "preferred_language": "en",
        "password_reset_required": False,
        "password_reset_token": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user_doc)
    await db.kyc_documents.insert_one({
        "id": f"TEST_KYCDOC_{uuid.uuid4().hex[:8]}",
        "user_id": uid,
        "status": "pending",
        "submitted_at": now,
        "created_at": now,
        "updated_at": now,
    })
    return user_doc


async def _cleanup_test_user(db, user_id: str):
    await db.users.delete_many({"id": user_id})
    await db.kyc_documents.delete_many({"user_id": user_id})
    await db.email_logs.delete_many({"user_id": user_id})
    await db.audit_logs.delete_many({"target_id": user_id})


# ── 1. Startup re-schedule log ────────────────────────────────────────────────
def test_startup_reschedule_log_present():
    """Verify server logs contain the startup re-schedule message from most recent boot."""
    log_files = ["/var/log/supervisor/backend.err.log", "/var/log/supervisor/backend.out.log"]
    hit = False
    for path in log_files:
        if not os.path.exists(path):
            continue
        with open(path, "r", errors="ignore") as f:
            for line in f:
                if "Startup: re-scheduled auto-approve for" in line and "pending KYC" in line:
                    hit = True
                    break
        if hit:
            break
    assert hit, "Expected 'Startup: re-scheduled auto-approve for N pending KYC submissions' in backend logs"


# ── 2. EmailService is configured ─────────────────────────────────────────────
def test_email_service_configured():
    """After startup, get_email_service() must have api_key set (from env or DB)."""
    from email_service import get_email_service
    svc = get_email_service()
    assert svc.api_key, "EmailService.api_key must be set (from env RESEND_API_KEY or DB system_settings)"
    assert svc.is_configured(), "EmailService.is_configured() must return True after startup"
    assert svc.sender_email, "EmailService.sender_email must be set"


# ── 3. Direct call to _auto_approve_kyc (freeze_type=both) ────────────────────
def test_auto_approve_kyc_direct_freeze_both():
    """Calling _auto_approve_kyc(uid, 0) on a pending KYC user with freeze_type='both'
    must approve KYC, unfreeze, set reset token, mark password_reset_required=True,
    and insert an email_log entry with email_type='password_reset'."""
    import server

    async def _run():
        client, db = await _get_db()
        try:
            user = await _create_test_user_frozen(db, freeze_type="both")
            uid = user["id"]

            # Ensure auto_approve setting is enabled during the test
            await db.system_settings.update_one(
                {"id": "system_settings"},
                {"$set": {"auto_approve_kyc": True}},
                upsert=True,
            )

            await server._auto_approve_kyc(uid, 0)

            after = await db.users.find_one({"id": uid}, {"_id": 0})
            assert after["kyc_status"] == "approved", f"kyc_status should be approved: {after.get('kyc_status')}"
            assert after["freeze_type"] == "none", f"freeze_type should be reset to none: {after.get('freeze_type')}"
            assert after["account_status"] == "active", f"account_status should be active: {after.get('account_status')}"
            assert after.get("password_reset_required") is True, "password_reset_required must be True"
            assert after.get("password_reset_token"), "password_reset_token must be set"
            assert after.get("password_reset_expires"), "password_reset_expires must be set"
            assert after.get("kyc_reviewed_by") == "auto_system"

            kyc_doc = await db.kyc_documents.find_one({"user_id": uid}, {"_id": 0})
            assert kyc_doc["status"] == "approved"
            assert kyc_doc["reviewed_by"] == "auto_system"

            log = await db.email_logs.find_one({"user_id": uid, "email_type": "password_reset"}, {"_id": 0})
            assert log is not None, "email_log entry for password_reset must be inserted"
            assert "Identity Verified" in (log.get("subject") or ""), \
                f"Email subject should be KYC-approved template, got: {log.get('subject')}"
            # NOTE: log.sent == True requires the Resend sender domain to be verified.
            # If this assertion fails with 'domain is not verified', check the DB
            # value at system_settings.sender_email (may override the .env SENDER_EMAIL
            # on startup via server.py L455-456).
            assert log.get("sent") is True, (
                f"Email should have been delivered by Resend, but sent=False. "
                f"Error: {log.get('error')}. Check system_settings.sender_email in DB."
            )
        finally:
            await _cleanup_test_user(db, uid)
            client.close()

    run_async(_run())


# ── 4. Direct call (freeze_type=unusual_activity) ─────────────────────────────
def test_auto_approve_kyc_direct_freeze_unusual():
    """Same behaviour when freeze_type='unusual_activity'."""
    import server

    async def _run():
        client, db = await _get_db()
        try:
            user = await _create_test_user_frozen(db, freeze_type="unusual_activity")
            uid = user["id"]
            await db.system_settings.update_one(
                {"id": "system_settings"},
                {"$set": {"auto_approve_kyc": True}},
                upsert=True,
            )

            await server._auto_approve_kyc(uid, 0)

            after = await db.users.find_one({"id": uid}, {"_id": 0})
            assert after["kyc_status"] == "approved"
            assert after["freeze_type"] == "none"
            assert after.get("password_reset_required") is True
            assert after.get("password_reset_token")

            log = await db.email_logs.find_one({"user_id": uid, "email_type": "password_reset"})
            assert log is not None
        finally:
            await _cleanup_test_user(db, uid)
            client.close()

    run_async(_run())


# ── 5. Idempotency + disabled feature flag ────────────────────────────────────
def test_auto_approve_kyc_idempotent_and_flag_respected():
    """Second call must be a no-op; disabling the feature mid-flight must skip approval."""
    import server

    async def _run():
        client, db = await _get_db()
        try:
            user = await _create_test_user_frozen(db, freeze_type="both")
            uid = user["id"]
            await db.system_settings.update_one(
                {"id": "system_settings"}, {"$set": {"auto_approve_kyc": True}}, upsert=True
            )

            await server._auto_approve_kyc(uid, 0)
            first = await db.users.find_one({"id": uid}, {"_id": 0})
            first_reviewed_at = first["kyc_reviewed_at"]
            first_token = first["password_reset_token"]

            # Second call — should be a no-op because status is already 'approved'
            await server._auto_approve_kyc(uid, 0)
            second = await db.users.find_one({"id": uid}, {"_id": 0})
            assert second["kyc_reviewed_at"] == first_reviewed_at, "Idempotency violated: reviewed_at changed"
            assert second["password_reset_token"] == first_token, "Idempotency violated: token changed"

            # Now: disable feature, create a new pending user, verify skip
            user2 = await _create_test_user_frozen(db, freeze_type="both")
            uid2 = user2["id"]
            await db.system_settings.update_one(
                {"id": "system_settings"}, {"$set": {"auto_approve_kyc": False}}, upsert=True
            )
            try:
                await server._auto_approve_kyc(uid2, 0)
                after = await db.users.find_one({"id": uid2}, {"_id": 0})
                assert after["kyc_status"] == "pending", "Feature-flag OFF must skip approval"
            finally:
                await db.system_settings.update_one(
                    {"id": "system_settings"}, {"$set": {"auto_approve_kyc": True}}, upsert=True
                )
                await _cleanup_test_user(db, uid2)
        finally:
            await _cleanup_test_user(db, uid)
            client.close()

    run_async(_run())


# ── 6. Manual admin KYC review triggers email ─────────────────────────────────
def test_manual_admin_kyc_approve_sends_email(admin_client):
    """POST /api/admin/kyc/{user_id}/review with status=approved on a frozen
    (freeze_type=both) pending user must:
      - return 200 with email_sent=True
      - set password_reset_token and password_reset_required=True
      - insert an email_log entry
    """
    async def _setup():
        client, db = await _get_db()
        user = await _create_test_user_frozen(db, freeze_type="both")
        client.close()
        return user["id"]

    async def _teardown(uid):
        client, db = await _get_db()
        await _cleanup_test_user(db, uid)
        client.close()

    uid = run_async(_setup())
    try:
        r = admin_client.post(
            f"{API}/admin/kyc/{uid}/review",
            json={"status": "approved"},
        )
        assert r.status_code == 200, f"Manual review failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("ok") is True
        assert body.get("email_sent") is True, f"email_sent must be True in response: {body}"

        # DB verification
        async def _verify():
            client, db = await _get_db()
            try:
                u = await db.users.find_one({"id": uid}, {"_id": 0})
                assert u["kyc_status"] == "approved"
                assert u["freeze_type"] == "none"
                assert u["account_status"] == "active"
                assert u.get("password_reset_required") is True
                assert u.get("password_reset_token")
                log = await db.email_logs.find_one(
                    {"user_id": uid, "email_type": "password_reset"}, {"_id": 0}
                )
                assert log is not None, "email_log must be inserted for password_reset"
                assert "Identity Verified" in (log.get("subject") or "")
            finally:
                client.close()

        run_async(_verify())
    finally:
        run_async(_teardown(uid))


# ── 7. Forgot-password endpoint fallback ──────────────────────────────────────
def test_forgot_password_endpoint(api):
    """POST /api/auth/forgot-password with a real user email must:
      - return 200
      - set password_reset_token on the user
      - insert an email_log with email_type='forgot_password'
    """
    async def _setup():
        client, db = await _get_db()
        user = await _create_test_user_frozen(db, freeze_type="none")
        # forgot-password just needs a user, kyc/freeze fields don't matter
        client.close()
        return user

    async def _teardown(uid):
        client, db = await _get_db()
        await _cleanup_test_user(db, uid)
        client.close()

    user = run_async(_setup())
    uid = user["id"]
    try:
        r = api.post(f"{API}/auth/forgot-password", json={"email": user["email"]})
        assert r.status_code == 200, f"forgot-password failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("ok") is True

        async def _verify():
            client, db = await _get_db()
            try:
                u = await db.users.find_one({"id": uid}, {"_id": 0})
                assert u.get("password_reset_token"), "password_reset_token must be set"
                assert u.get("password_reset_expires"), "password_reset_expires must be set"
                log = await db.email_logs.find_one(
                    {"user_id": uid, "email_type": "forgot_password"}, {"_id": 0}
                )
                assert log is not None
                assert "Reset Your Password" in (log.get("subject") or "") or \
                       "Reset Password" in (log.get("subject") or "")
            finally:
                client.close()

        run_async(_verify())
    finally:
        run_async(_teardown(uid))


# ── 8. Re-schedule remaining-delay math (unit test) ───────────────────────────
def test_reschedule_delay_calculation_math():
    """Startup re-schedule uses:
        remaining = max(5, delay_minutes*60 - elapsed_since_submitted)
    Verify boundary conditions on the math itself."""
    delay_minutes = 5
    target_delay = delay_minutes * 60  # 300s

    # Just submitted (elapsed = 0) -> remaining ~ 300s
    remaining = max(5, target_delay - 0)
    assert remaining == 300

    # Elapsed 60s -> remaining 240s
    remaining = max(5, target_delay - 60)
    assert remaining == 240

    # Elapsed 300s (exactly target) -> remaining = 5 (floor)
    remaining = max(5, target_delay - 300)
    assert remaining == 5

    # Elapsed > target -> still 5 (fires ~immediately with 5s guard)
    remaining = max(5, target_delay - 999)
    assert remaining == 5


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v", "--tb=short"]))
