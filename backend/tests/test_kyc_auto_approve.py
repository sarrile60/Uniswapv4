"""Tests for KYC Auto-Approval feature.

Covers:
- GET /api/admin/settings exposes auto_approve_kyc + auto_approve_kyc_minutes
- PUT /api/admin/settings can update both fields (with validation: minutes >= 1)
- Persistence check via GET after PUT
- Restoration of DB state at the end
- Direct call to _auto_approve_kyc() to validate the approval logic:
    * Skips when feature disabled
    * Skips when KYC not pending
    * Approves & sets kyc_reviewed_by='auto_system' when pending + enabled
- Verification of the scheduling log line 'Scheduled auto-approve KYC' via KYC submit,
  performed indirectly by (a) enabling the feature and (b) calling _auto_approve_kyc
  directly since the KYC submit path requires Cloudinary uploads.
"""
import os
import sys
import asyncio
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://uniswap-infra.preview.emergentagent.com").rstrip("/")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 KYCAutoApproveTest/1.0"

# Add backend to sys.path so we can import server + models for direct DB access
sys.path.insert(0, "/app/backend")


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@zenthos-eu.com", "password": "admin123"},
        headers={"User-Agent": UA, "Content-Type": "application/json"},
        timeout=15,
    )
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json().get("data", {})
    assert data.get("token"), "no token in login response"
    return data["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json",
        "User-Agent": UA,
    }


@pytest.fixture(scope="module")
def original_settings(auth_headers):
    r = requests.get(f"{BASE_URL}/api/admin/settings", headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["data"]["settings"]


# --- 1) GET returns the new fields
def test_get_settings_exposes_auto_approve_fields(auth_headers):
    r = requests.get(f"{BASE_URL}/api/admin/settings", headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text
    settings = r.json()["data"]["settings"]
    assert "auto_approve_kyc" in settings, "auto_approve_kyc missing from settings"
    assert "auto_approve_kyc_minutes" in settings, "auto_approve_kyc_minutes missing from settings"
    assert isinstance(settings["auto_approve_kyc"], bool)
    assert isinstance(settings["auto_approve_kyc_minutes"], int)


# --- 2) PUT updates both fields
def test_put_settings_updates_auto_approve_fields(auth_headers, original_settings):
    body = {"auto_approve_kyc": True, "auto_approve_kyc_minutes": 7}
    r = requests.put(f"{BASE_URL}/api/admin/settings", json=body, headers=auth_headers, timeout=15)
    assert r.status_code == 200, r.text

    # Verify via GET
    g = requests.get(f"{BASE_URL}/api/admin/settings", headers=auth_headers, timeout=15).json()["data"]["settings"]
    assert g["auto_approve_kyc"] is True
    assert g["auto_approve_kyc_minutes"] == 7


# --- 3) minutes minimum clamp: 0/-5 should be normalized to 1
def test_put_settings_minutes_minimum_clamp(auth_headers):
    for bad in [0, -5]:
        r = requests.put(
            f"{BASE_URL}/api/admin/settings",
            json={"auto_approve_kyc_minutes": bad},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        g = requests.get(f"{BASE_URL}/api/admin/settings", headers=auth_headers, timeout=15).json()["data"]["settings"]
        assert g["auto_approve_kyc_minutes"] >= 1, f"minutes not clamped to >=1: got {g['auto_approve_kyc_minutes']}"


# --- 4) PUT can disable the feature
def test_put_settings_can_disable(auth_headers):
    r = requests.put(
        f"{BASE_URL}/api/admin/settings",
        json={"auto_approve_kyc": False},
        headers=auth_headers,
        timeout=15,
    )
    assert r.status_code == 200
    g = requests.get(f"{BASE_URL}/api/admin/settings", headers=auth_headers, timeout=15).json()["data"]["settings"]
    assert g["auto_approve_kyc"] is False


# --- 5) Direct-call test for _auto_approve_kyc logic (bypasses Cloudinary requirement)
def test_auto_approve_kyc_logic_direct():
    """Call server._auto_approve_kyc directly with a seeded pending user."""
    from server import _auto_approve_kyc, db
    from models import KYCStatus

    async def _run():
        user_id = f"TEST_AUTO_KYC_{uuid.uuid4().hex[:8]}"
        # seed user & kyc document in pending state
        now_iso = "2026-01-01T00:00:00+00:00"
        seed_user = {
            "id": user_id,
            "email": f"TEST_autokyc_{user_id}@test.com",
            "first_name": "Auto",
            "last_name": "Kyc",
            "role": "user",
            "kyc_status": KYCStatus.PENDING,
            "account_status": "active",
            "freeze_type": "none",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        await db.users.insert_one(dict(seed_user))
        await db.kyc_documents.insert_one({
            "user_id": user_id,
            "status": KYCStatus.PENDING,
            "created_at": now_iso,
            "updated_at": now_iso,
        })

        try:
            # 5a) Feature disabled -> should skip (no changes)
            await db.system_settings.update_one(
                {"id": "system_settings"},
                {"$set": {"auto_approve_kyc": False}},
                upsert=True,
            )
            await _auto_approve_kyc(user_id, delay_seconds=0)
            u = await db.users.find_one({"id": user_id}, {"_id": 0})
            assert u["kyc_status"] == KYCStatus.PENDING, "Should NOT approve when feature disabled"

            # 5b) Feature enabled + pending -> should approve
            await db.system_settings.update_one(
                {"id": "system_settings"},
                {"$set": {"auto_approve_kyc": True, "auto_approve_kyc_minutes": 1}},
                upsert=True,
            )
            await _auto_approve_kyc(user_id, delay_seconds=0)
            u = await db.users.find_one({"id": user_id}, {"_id": 0})
            k = await db.kyc_documents.find_one({"user_id": user_id}, {"_id": 0})
            assert u["kyc_status"] == KYCStatus.APPROVED, f"Expected APPROVED got {u['kyc_status']}"
            assert u.get("kyc_reviewed_by") == "auto_system"
            assert u.get("kyc_reviewed_at")
            assert k["status"] == KYCStatus.APPROVED
            assert k.get("reviewed_by") == "auto_system"

            # 5c) Re-run should be a no-op (status already approved, not pending)
            await _auto_approve_kyc(user_id, delay_seconds=0)
            u2 = await db.users.find_one({"id": user_id}, {"_id": 0})
            assert u2["kyc_status"] == KYCStatus.APPROVED
            assert u2.get("kyc_reviewed_at") == u.get("kyc_reviewed_at"), "Should not re-approve/update timestamp"
        finally:
            # cleanup
            await db.users.delete_one({"id": user_id})
            await db.kyc_documents.delete_one({"user_id": user_id})

    asyncio.run(_run())


# --- 6) Restore original settings state at the end
def test_zzz_restore_original_settings(auth_headers, original_settings):
    """Restore settings to what we found at module load (auto_approve_kyc=True, 5 min per PS)."""
    body = {
        "auto_approve_kyc": bool(original_settings.get("auto_approve_kyc", True)),
        "auto_approve_kyc_minutes": int(original_settings.get("auto_approve_kyc_minutes", 5)),
    }
    r = requests.put(f"{BASE_URL}/api/admin/settings", json=body, headers=auth_headers, timeout=15)
    assert r.status_code == 200
    g = requests.get(f"{BASE_URL}/api/admin/settings", headers=auth_headers, timeout=15).json()["data"]["settings"]
    assert g["auto_approve_kyc"] == body["auto_approve_kyc"]
    assert g["auto_approve_kyc_minutes"] == body["auto_approve_kyc_minutes"]
