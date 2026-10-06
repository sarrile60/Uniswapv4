"""Integration test: KYC submit schedules auto-approval and log message appears.

Enables auto_approve_kyc, calls /api/kyc/submit for a real test user with
dummy URLs (no Cloudinary upload required because KYCSubmit accepts any string),
then verifies the backend log contains 'Scheduled auto-approve KYC for {user_id}'.

Restores original settings + user KYC state at teardown so it can run repeatedly.
"""
import os
import re
import time
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://uniswap-infra.preview.emergentagent.com").rstrip("/")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 KYCSubmitScheduleTest/1.0"

ADMIN = {"email": "admin@uniswapv4.com", "password": "admin123"}
USER = {"email": "fetest_bug20_1782908617@test.com", "password": "TestFE123!"}


def _login(creds):
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=creds,
        headers={"User-Agent": UA, "Content-Type": "application/json"},
        timeout=15,
    )
    assert r.status_code == 200, f"login failed for {creds['email']}: {r.status_code} {r.text}"
    return r.json()["data"]


@pytest.fixture(scope="module")
def admin_headers():
    d = _login(ADMIN)
    return {"Authorization": f"Bearer {d['token']}", "Content-Type": "application/json", "User-Agent": UA}


@pytest.fixture(scope="module")
def user_login():
    return _login(USER)


@pytest.fixture(scope="module")
def user_headers(user_login):
    return {"Authorization": f"Bearer {user_login['token']}", "Content-Type": "application/json", "User-Agent": UA}


def test_kyc_submit_schedules_auto_approval(admin_headers, user_headers, user_login):
    user_id = user_login["user"]["id"]

    # Preserve original settings
    orig = requests.get(f"{BASE_URL}/api/admin/settings", headers=admin_headers, timeout=15).json()["data"]["settings"]

    # Enable auto-approve with a long delay so the direct approval doesn't race
    # (60 minutes -> 3600s sleep, we won't wait for it)
    requests.put(
        f"{BASE_URL}/api/admin/settings",
        json={"auto_approve_kyc": True, "auto_approve_kyc_minutes": 60},
        headers=admin_headers,
        timeout=15,
    )

    # Reset user KYC status if approved (so /kyc/submit doesn't 400)
    # Use admin update to force status to not_started
    from pymongo import MongoClient
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    assert mongo_url and db_name, "MONGO_URL/DB_NAME not set"
    client = MongoClient(mongo_url)
    db = client[db_name]
    original_user = db.users.find_one({"id": user_id})
    db.users.update_one({"id": user_id}, {"$set": {"kyc_status": "not_started"}})

    try:
        # Submit KYC (URL strings are accepted per KYCSubmit model)
        payload = {
            "id_document_type": "passport",
            "id_document_front": "https://example.com/front.jpg",
            "id_document_back": "https://example.com/back.jpg",
            "selfie_with_id": "https://example.com/selfie.jpg",
            "proof_of_address": "https://example.com/addr.jpg",
        }
        r = requests.post(f"{BASE_URL}/api/kyc/submit", json=payload, headers=user_headers, timeout=15)
        assert r.status_code == 200, f"KYC submit failed: {r.status_code} {r.text}"

        # Wait a moment for log flush
        time.sleep(1.5)

        # Grep the backend log for the schedule message
        out = subprocess.run(
            ["grep", "-h", "Scheduled auto-approve KYC", "/var/log/supervisor/backend.out.log", "/var/log/supervisor/backend.err.log"],
            capture_output=True, text=True, timeout=10,
        )
        combined = out.stdout
        # Expect a line containing our user_id
        pattern = re.compile(rf"Scheduled auto-approve KYC for {re.escape(user_id)} in \d+ minutes")
        assert pattern.search(combined), f"Schedule log line for user {user_id} not found. Log tail:\n{combined[-2000:]}"
    finally:
        # Restore settings
        requests.put(
            f"{BASE_URL}/api/admin/settings",
            json={
                "auto_approve_kyc": bool(orig.get("auto_approve_kyc", True)),
                "auto_approve_kyc_minutes": int(orig.get("auto_approve_kyc_minutes", 5)),
            },
            headers=admin_headers,
            timeout=15,
        )
        # Restore user's original kyc_status
        if original_user:
            db.users.update_one(
                {"id": user_id},
                {"$set": {"kyc_status": original_user.get("kyc_status", "not_started")}}
            )
        client.close()
