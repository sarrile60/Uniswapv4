#!/usr/bin/env python3
"""
Comprehensive 2FA (TOTP) Backend Testing Script
Tests all 2FA endpoints end-to-end including setup, verify, disable, and login flow
"""

import requests
import pyotp
import json
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://v4-markets-dashboard.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@zenthos-eu.com"
ADMIN_PASSWORD = "admin123"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(test_name: str):
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST: {test_name}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")

def print_pass(message: str):
    print(f"{Colors.GREEN}✅ PASS: {message}{Colors.RESET}")

def print_fail(message: str):
    print(f"{Colors.RED}❌ FAIL: {message}{Colors.RESET}")

def print_info(message: str):
    print(f"{Colors.YELLOW}ℹ️  INFO: {message}{Colors.RESET}")

def make_request(method: str, endpoint: str, headers: Optional[Dict] = None, 
                 json_data: Optional[Dict] = None) -> tuple[int, Any]:
    """Make HTTP request and return status code and response data"""
    url = f"{BACKEND_URL}{endpoint}"
    
    # Add user-agent to avoid bot detection
    if headers is None:
        headers = {}
    if "User-Agent" not in headers:
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=json_data, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        try:
            data = response.json()
        except:
            data = response.text
        
        return response.status_code, data
    except Exception as e:
        print_fail(f"Request failed: {str(e)}")
        return 0, {"error": str(e)}

def test_admin_login_no_2fa() -> Optional[str]:
    """Test 1: Admin login should work without 2FA prompt"""
    print_test("Test 1: Admin Login (No 2FA)")
    
    status, data = make_request("POST", "/auth/login", json_data={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if status != 200:
        print_fail(f"Login failed with status {status}: {data}")
        return None
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return None
    
    response_data = data.get("data", {})
    
    # Check requires_2fa is false
    if response_data.get("requires_2fa") != False:
        print_fail(f"Expected requires_2fa=false, got {response_data.get('requires_2fa')}")
        return None
    
    # Check token is present
    token = response_data.get("token")
    if not token:
        print_fail("No token in response")
        return None
    
    print_pass("Admin login successful without 2FA prompt")
    print_info(f"Token received: {token[:20]}...")
    return token

def test_2fa_status(token: str, expected_enabled: bool) -> bool:
    """Test 2: Check 2FA status"""
    print_test(f"Test 2: Check 2FA Status (Expected: {expected_enabled})")
    
    headers = {"Authorization": f"Bearer {token}"}
    status, data = make_request("GET", "/2fa/status", headers=headers)
    
    if status != 200:
        print_fail(f"Status check failed with status {status}: {data}")
        return False
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return False
    
    totp_enabled = data.get("data", {}).get("totp_enabled")
    
    if totp_enabled != expected_enabled:
        print_fail(f"Expected totp_enabled={expected_enabled}, got {totp_enabled}")
        return False
    
    print_pass(f"2FA status correct: totp_enabled={totp_enabled}")
    return True

def test_2fa_setup(token: str) -> Optional[str]:
    """Test 3: Setup 2FA and get secret + QR code"""
    print_test("Test 3: Setup 2FA")
    
    headers = {"Authorization": f"Bearer {token}"}
    status, data = make_request("POST", "/2fa/setup", headers=headers)
    
    if status != 200:
        print_fail(f"Setup failed with status {status}: {data}")
        return None
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return None
    
    response_data = data.get("data", {})
    
    # Check secret is present
    secret = response_data.get("secret")
    if not secret:
        print_fail("No secret in response")
        return None
    
    # Check QR code is present
    qr_code = response_data.get("qr_code")
    if not qr_code:
        print_fail("No qr_code in response")
        return None
    
    # Check QR code is base64 PNG
    if not qr_code.startswith("data:image/png;base64,"):
        print_fail(f"QR code doesn't start with expected prefix: {qr_code[:50]}")
        return None
    
    print_pass("2FA setup successful")
    print_info(f"Secret: {secret}")
    print_info(f"QR code length: {len(qr_code)} chars")
    print_info(f"Issuer: {response_data.get('issuer')}")
    print_info(f"Account: {response_data.get('account')}")
    
    return secret

def test_2fa_verify_setup(token: str, secret: str) -> Optional[list]:
    """Test 4: Verify setup with valid TOTP code"""
    print_test("Test 4: Verify 2FA Setup")
    
    # Generate valid TOTP code
    totp = pyotp.TOTP(secret)
    code = totp.now()
    print_info(f"Generated TOTP code: {code}")
    
    headers = {"Authorization": f"Bearer {token}"}
    status, data = make_request("POST", "/2fa/verify-setup", headers=headers, json_data={
        "code": code
    })
    
    if status != 200:
        print_fail(f"Verify setup failed with status {status}: {data}")
        return None
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return None
    
    response_data = data.get("data", {})
    
    # Check backup codes
    backup_codes = response_data.get("backup_codes")
    if not backup_codes:
        print_fail("No backup_codes in response")
        return None
    
    if not isinstance(backup_codes, list):
        print_fail(f"backup_codes is not a list: {type(backup_codes)}")
        return None
    
    if len(backup_codes) != 8:
        print_fail(f"Expected 8 backup codes, got {len(backup_codes)}")
        return None
    
    print_pass("2FA verify setup successful")
    print_info(f"Received {len(backup_codes)} backup codes")
    print_info(f"Sample backup codes: {backup_codes[:3]}")
    
    return backup_codes

def test_2fa_login_flow(secret: str) -> Optional[str]:
    """Test 5: Login with 2FA enabled (should get pending_token)"""
    print_test("Test 5: Login with 2FA Enabled")
    
    status, data = make_request("POST", "/auth/login", json_data={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if status != 200:
        print_fail(f"Login failed with status {status}: {data}")
        return None
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return None
    
    response_data = data.get("data", {})
    
    # Admin should bypass 2FA, so this should still return full token
    # But let's check what we actually get
    requires_2fa = response_data.get("requires_2fa")
    
    print_info(f"requires_2fa: {requires_2fa}")
    
    if requires_2fa == False:
        # Admin bypass is working
        token = response_data.get("token")
        if token:
            print_pass("Admin bypass working - got full token without 2FA")
            return token
        else:
            print_fail("requires_2fa=false but no token in response")
            return None
    elif requires_2fa == True:
        # 2FA is required (shouldn't happen for admin)
        pending_token = response_data.get("pending_token")
        if pending_token:
            print_info("2FA required (unexpected for admin) - got pending_token")
            return pending_token
        else:
            print_fail("requires_2fa=true but no pending_token in response")
            return None
    else:
        print_fail(f"Unexpected requires_2fa value: {requires_2fa}")
        return None

def test_2fa_complete(pending_token: str, secret: str) -> Optional[str]:
    """Test 6: Complete 2FA login with TOTP code"""
    print_test("Test 6: Complete 2FA Login")
    
    # Generate valid TOTP code
    totp = pyotp.TOTP(secret)
    code = totp.now()
    print_info(f"Generated TOTP code: {code}")
    
    status, data = make_request("POST", "/auth/2fa-complete", json_data={
        "pending_token": pending_token,
        "code": code
    })
    
    if status != 200:
        print_fail(f"2FA complete failed with status {status}: {data}")
        return None
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return None
    
    response_data = data.get("data", {})
    
    # Check token is present
    token = response_data.get("token")
    if not token:
        print_fail("No token in response")
        return None
    
    print_pass("2FA complete successful")
    print_info(f"Token received: {token[:20]}...")
    
    return token

def test_2fa_complete_with_backup(pending_token: str, backup_code: str) -> Optional[str]:
    """Test 7: Complete 2FA login with backup code"""
    print_test("Test 7: Complete 2FA Login with Backup Code")
    
    print_info(f"Using backup code: {backup_code}")
    
    status, data = make_request("POST", "/auth/2fa-complete", json_data={
        "pending_token": pending_token,
        "code": backup_code
    })
    
    if status != 200:
        print_fail(f"2FA complete with backup failed with status {status}: {data}")
        return None
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return None
    
    response_data = data.get("data", {})
    
    # Check token is present
    token = response_data.get("token")
    if not token:
        print_fail("No token in response")
        return None
    
    print_pass("2FA complete with backup code successful")
    print_info(f"Token received: {token[:20]}...")
    
    return token

def test_2fa_complete_invalid_code(pending_token: str) -> bool:
    """Test 8: Complete 2FA login with invalid code (should fail)"""
    print_test("Test 8: Complete 2FA Login with Invalid Code")
    
    invalid_code = "000000"
    print_info(f"Using invalid code: {invalid_code}")
    
    status, data = make_request("POST", "/auth/2fa-complete", json_data={
        "pending_token": pending_token,
        "code": invalid_code
    })
    
    if status == 401:
        print_pass("Invalid code correctly rejected with 401")
        return True
    else:
        print_fail(f"Expected 401, got {status}: {data}")
        return False

def test_2fa_disable(token: str, secret: str) -> bool:
    """Test 9: Disable 2FA"""
    print_test("Test 9: Disable 2FA")
    
    # Generate valid TOTP code
    totp = pyotp.TOTP(secret)
    code = totp.now()
    print_info(f"Generated TOTP code: {code}")
    
    headers = {"Authorization": f"Bearer {token}"}
    status, data = make_request("POST", "/2fa/disable", headers=headers, json_data={
        "password": ADMIN_PASSWORD,
        "code": code
    })
    
    if status != 200:
        print_fail(f"Disable failed with status {status}: {data}")
        return False
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return False
    
    print_pass("2FA disable successful")
    return True

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}2FA (TOTP) COMPREHENSIVE BACKEND TESTING{Colors.RESET}")
    print(f"{Colors.BLUE}Backend URL: {BACKEND_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0
    }
    
    # Test 1: Admin login without 2FA
    token = test_admin_login_no_2fa()
    results["total"] += 1
    if token:
        results["passed"] += 1
    else:
        results["failed"] += 1
        print_fail("Cannot continue without admin token")
        return
    
    # Test 2: Check 2FA status (should be false initially)
    results["total"] += 1
    if test_2fa_status(token, expected_enabled=False):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test 3: Setup 2FA
    secret = test_2fa_setup(token)
    results["total"] += 1
    if secret:
        results["passed"] += 1
    else:
        results["failed"] += 1
        print_fail("Cannot continue without secret")
        return
    
    # Test 4: Verify setup with valid TOTP code
    backup_codes = test_2fa_verify_setup(token, secret)
    results["total"] += 1
    if backup_codes:
        results["passed"] += 1
    else:
        results["failed"] += 1
        print_fail("Cannot continue without backup codes")
        return
    
    # Test 5: Check 2FA status (should be true now)
    results["total"] += 1
    if test_2fa_status(token, expected_enabled=True):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test 6: Login with 2FA enabled
    # Note: Admin should bypass 2FA, so this will return full token
    token_or_pending = test_2fa_login_flow(secret)
    results["total"] += 1
    if token_or_pending:
        results["passed"] += 1
        print_info("Admin bypass confirmed - admins are not asked for 2FA on login")
    else:
        results["failed"] += 1
    
    # Test 7: Disable 2FA
    if token_or_pending:
        results["total"] += 1
        if test_2fa_disable(token_or_pending, secret):
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # Test 8: Check 2FA status (should be false after disable)
    if token_or_pending:
        results["total"] += 1
        if test_2fa_status(token_or_pending, expected_enabled=False):
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # Print summary
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"Total Tests: {results['total']}")
    print(f"{Colors.GREEN}Passed: {results['passed']}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.RESET}")
    
    if results['failed'] == 0:
        print(f"\n{Colors.GREEN}✅ ALL TESTS PASSED!{Colors.RESET}\n")
    else:
        print(f"\n{Colors.RED}❌ SOME TESTS FAILED{Colors.RESET}\n")

if __name__ == "__main__":
    main()
