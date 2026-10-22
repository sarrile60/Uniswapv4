#!/usr/bin/env python3
"""
Backend Test: Multi-Tenant Admin Panel
Tests the multi-tenant implementation with Italy and Canada databases
"""

import requests
import json
import sys
import jwt

# Backend URL
BASE_URL = "https://v4-markets-dashboard.preview.emergentagent.com/api"

# Admin credentials
ITALY_ADMIN_EMAIL = "admin@uniswapv4.com"
ITALY_ADMIN_PASSWORD = "admin123"

CANADA_ADMIN_EMAIL = "admin@uniswapv4ca.com"
CANADA_ADMIN_PASSWORD = "Admin@123456"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_response(response, title="Response"):
    """Print formatted response details"""
    print(f"\n{title}:")
    print(f"  Status Code: {response.status_code}")
    try:
        data = response.json()
        print(f"  Body: {json.dumps(data, indent=2)}")
        return data
    except:
        print(f"  Body (raw): {response.text}")
        return None

def decode_jwt_token(token):
    """Decode JWT token without verification to inspect payload"""
    try:
        # Decode without verification to inspect the payload
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded
    except Exception as e:
        print(f"  ❌ Failed to decode JWT: {str(e)}")
        return None

def test_italy_admin_login():
    """Test 1: Italy admin login"""
    print_section("TEST 1: Italy Admin Login")
    
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "email": ITALY_ADMIN_EMAIL,
        "password": ITALY_ADMIN_PASSWORD
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/json"
    }
    
    print(f"\nPOST {login_url}")
    print(f"Body: {json.dumps(login_payload, indent=2)}")
    
    try:
        response = requests.post(login_url, json=login_payload, headers=headers, timeout=10)
        data = print_response(response, "Italy Admin Login Response")
        
        if response.status_code != 200:
            print("\n❌ TEST 1 FAILED: Login returned non-200 status")
            return None
        
        if not data or not data.get("ok"):
            print("\n❌ TEST 1 FAILED: Response does not have ok: true")
            return None
        
        token = data.get("token")
        if not token:
            print("\n❌ TEST 1 FAILED: No token in response")
            return None
        
        print(f"\n✅ Login successful! Token: {token[:30]}...")
        
        # Decode JWT to verify tenant field
        print("\n🔍 Decoding JWT token...")
        decoded = decode_jwt_token(token)
        if decoded:
            print(f"  JWT Payload: {json.dumps(decoded, indent=2, default=str)}")
            tenant = decoded.get("tenant")
            if tenant == "main":
                print(f"\n✅ TEST 1 PASSED: JWT contains tenant='main' ✓")
            else:
                print(f"\n❌ TEST 1 FAILED: JWT tenant='{tenant}', expected 'main'")
                return None
        else:
            print("\n❌ TEST 1 FAILED: Could not decode JWT")
            return None
        
        return token
        
    except Exception as e:
        print(f"\n❌ TEST 1 FAILED: {str(e)}")
        return None

def test_canada_admin_login():
    """Test 2: Canada admin login"""
    print_section("TEST 2: Canada Admin Login")
    
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "email": CANADA_ADMIN_EMAIL,
        "password": CANADA_ADMIN_PASSWORD
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/json"
    }
    
    print(f"\nPOST {login_url}")
    print(f"Body: {json.dumps(login_payload, indent=2)}")
    
    try:
        response = requests.post(login_url, json=login_payload, headers=headers, timeout=10)
        data = print_response(response, "Canada Admin Login Response")
        
        if response.status_code != 200:
            print("\n❌ TEST 2 FAILED: Login returned non-200 status")
            return None
        
        if not data or not data.get("ok"):
            print("\n❌ TEST 2 FAILED: Response does not have ok: true")
            return None
        
        token = data.get("token")
        if not token:
            print("\n❌ TEST 2 FAILED: No token in response")
            return None
        
        print(f"\n✅ Login successful! Token: {token[:30]}...")
        
        # Decode JWT to verify tenant field
        print("\n🔍 Decoding JWT token...")
        decoded = decode_jwt_token(token)
        if decoded:
            print(f"  JWT Payload: {json.dumps(decoded, indent=2, default=str)}")
            tenant = decoded.get("tenant")
            if tenant == "canada":
                print(f"\n✅ TEST 2 PASSED: JWT contains tenant='canada' ✓")
            else:
                print(f"\n❌ TEST 2 FAILED: JWT tenant='{tenant}', expected 'canada'")
                return None
        else:
            print("\n❌ TEST 2 FAILED: Could not decode JWT")
            return None
        
        return token
        
    except Exception as e:
        print(f"\n❌ TEST 2 FAILED: {str(e)}")
        return None

def test_italy_admin_sees_italy_users(italy_token):
    """Test 3: Italy admin sees Italy users only"""
    print_section("TEST 3: Italy Admin Sees Italy Users Only")
    
    users_url = f"{BASE_URL}/admin/users"
    headers = {
        "Authorization": f"Bearer {italy_token}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    print(f"\nGET {users_url}")
    print(f"Headers: Authorization: Bearer {italy_token[:30]}...")
    
    try:
        response = requests.get(users_url, headers=headers, timeout=10)
        data = print_response(response, "Italy Admin Users Response")
        
        if response.status_code != 200:
            print("\n❌ TEST 3 FAILED: Users endpoint returned non-200 status")
            return False
        
        if not data or "users" not in data:
            print("\n❌ TEST 3 FAILED: No users array in response")
            return False
        
        users = data.get("users", [])
        print(f"\n📊 Found {len(users)} users")
        
        # Check for Italy admin
        italy_admin_found = False
        canada_admin_found = False
        
        for user in users:
            email = user.get("email", "")
            print(f"  • {email}")
            if email == ITALY_ADMIN_EMAIL:
                italy_admin_found = True
            if email == CANADA_ADMIN_EMAIL:
                canada_admin_found = True
        
        if not italy_admin_found:
            print(f"\n⚠️  WARNING: Italy admin ({ITALY_ADMIN_EMAIL}) not found in users list")
        
        if canada_admin_found:
            print(f"\n❌ TEST 3 FAILED: Canada admin ({CANADA_ADMIN_EMAIL}) should NOT be visible to Italy admin")
            return False
        
        print(f"\n✅ TEST 3 PASSED: Italy admin sees Italy users only (Canada admin not visible) ✓")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST 3 FAILED: {str(e)}")
        return False

def test_canada_admin_sees_canada_users(canada_token):
    """Test 4: Canada admin sees Canada users only"""
    print_section("TEST 4: Canada Admin Sees Canada Users Only")
    
    users_url = f"{BASE_URL}/admin/users"
    headers = {
        "Authorization": f"Bearer {canada_token}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    print(f"\nGET {users_url}")
    print(f"Headers: Authorization: Bearer {canada_token[:30]}...")
    
    try:
        response = requests.get(users_url, headers=headers, timeout=10)
        data = print_response(response, "Canada Admin Users Response")
        
        if response.status_code != 200:
            print("\n❌ TEST 4 FAILED: Users endpoint returned non-200 status")
            return False
        
        if not data or "users" not in data:
            print("\n❌ TEST 4 FAILED: No users array in response")
            return False
        
        users = data.get("users", [])
        print(f"\n📊 Found {len(users)} users")
        
        # Check for Canada admin
        italy_admin_found = False
        canada_admin_found = False
        
        for user in users:
            email = user.get("email", "")
            print(f"  • {email}")
            if email == ITALY_ADMIN_EMAIL:
                italy_admin_found = True
            if email == CANADA_ADMIN_EMAIL:
                canada_admin_found = True
        
        if not canada_admin_found:
            print(f"\n⚠️  WARNING: Canada admin ({CANADA_ADMIN_EMAIL}) not found in users list")
        
        if italy_admin_found:
            print(f"\n❌ TEST 4 FAILED: Italy admin ({ITALY_ADMIN_EMAIL}) should NOT be visible to Canada admin")
            return False
        
        print(f"\n✅ TEST 4 PASSED: Canada admin sees Canada users only (Italy admin not visible) ✓")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST 4 FAILED: {str(e)}")
        return False

def test_italy_wallet_endpoint(italy_token):
    """Test 5: Italy user wallet endpoint works"""
    print_section("TEST 5: Italy User Wallet Endpoint")
    
    # Try both wallet endpoints
    endpoints = [
        "/wallet/balances",
        "/wallet/available-balance"
    ]
    
    headers = {
        "Authorization": f"Bearer {italy_token}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    all_passed = True
    
    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n🔍 Testing: GET {url}")
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            data = print_response(response, f"Response for {endpoint}")
            
            if response.status_code == 500:
                print(f"\n❌ FAILED: {endpoint} returned 500 error")
                all_passed = False
            elif response.status_code >= 400:
                print(f"\n⚠️  {endpoint} returned {response.status_code} (may be expected if no wallet exists)")
            else:
                print(f"\n✅ {endpoint} returned {response.status_code} (no crash)")
                
        except Exception as e:
            print(f"\n❌ FAILED: {endpoint} raised exception: {str(e)}")
            all_passed = False
    
    if all_passed:
        print(f"\n✅ TEST 5 PASSED: Wallet endpoints work without 500 errors ✓")
    else:
        print(f"\n❌ TEST 5 FAILED: Some wallet endpoints returned 500 errors")
    
    return all_passed

def test_backend_health():
    """Test 6: Backend health check"""
    print_section("TEST 6: Backend Health Check")
    
    health_url = f"{BASE_URL}/health"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    print(f"\nGET {health_url}")
    
    try:
        response = requests.get(health_url, headers=headers, timeout=10)
        data = print_response(response, "Health Check Response")
        
        if response.status_code != 200:
            print("\n❌ TEST 6 FAILED: Health check returned non-200 status")
            return False
        
        if not data or data.get("status") != "healthy":
            print("\n❌ TEST 6 FAILED: Health check did not return status: healthy")
            return False
        
        print(f"\n✅ TEST 6 PASSED: Backend is healthy ✓")
        return True
        
    except Exception as e:
        print(f"\n❌ TEST 6 FAILED: {str(e)}")
        return False

def run_all_tests():
    """Run all multi-tenant tests"""
    print("="*80)
    print("  MULTI-TENANT ADMIN PANEL TEST SUITE")
    print("  Testing Italy and Canada Database Isolation")
    print("="*80)
    
    results = {
        "test1_italy_login": False,
        "test2_canada_login": False,
        "test3_italy_users": False,
        "test4_canada_users": False,
        "test5_italy_wallet": False,
        "test6_health": False
    }
    
    # Test 1: Italy admin login
    italy_token = test_italy_admin_login()
    results["test1_italy_login"] = (italy_token is not None)
    
    # Test 2: Canada admin login
    canada_token = test_canada_admin_login()
    results["test2_canada_login"] = (canada_token is not None)
    
    # Test 3: Italy admin sees Italy users only
    if italy_token:
        results["test3_italy_users"] = test_italy_admin_sees_italy_users(italy_token)
    else:
        print_section("TEST 3: SKIPPED (Italy login failed)")
    
    # Test 4: Canada admin sees Canada users only
    if canada_token:
        results["test4_canada_users"] = test_canada_admin_sees_canada_users(canada_token)
    else:
        print_section("TEST 4: SKIPPED (Canada login failed)")
    
    # Test 5: Italy wallet endpoint
    if italy_token:
        results["test5_italy_wallet"] = test_italy_wallet_endpoint(italy_token)
    else:
        print_section("TEST 5: SKIPPED (Italy login failed)")
    
    # Test 6: Backend health
    results["test6_health"] = test_backend_health()
    
    # Print summary
    print_section("TEST SUMMARY")
    
    passed = 0
    failed = 0
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\n📊 Results: {passed} passed, {failed} failed out of {len(results)} tests")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Multi-tenant implementation is working correctly.")
        return True
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED. Please review the failures above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
