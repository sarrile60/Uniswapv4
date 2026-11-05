#!/usr/bin/env python3
"""
Create a Canada test user with unpaid fees for testing fee resolution email endpoint
"""

import requests
import json

BACKEND_URL = "https://multitenant-vault--91znyxas.preview.emergentagent.com/api"
CANADA_ADMIN_EMAIL = "admin@uniswapv4ca.net"
CANADA_ADMIN_PASSWORD = "Admin@123456"

def login_admin():
    """Login as Canada admin"""
    response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "email": CANADA_ADMIN_EMAIL,
        "password": CANADA_ADMIN_PASSWORD
    }, headers={"User-Agent": "Mozilla/5.0"})
    
    if response.status_code == 200:
        data = response.json()
        return data.get("data", {}).get("token")
    return None

def create_test_user(token):
    """Create a test user with unpaid fees"""
    import random
    import string
    
    random_suffix = ''.join(random.choices(string.digits, k=10))
    test_email = f"TEST_canada_fee_test_{random_suffix}@test.com"
    
    user_data = {
        "email": test_email,
        "username": f"test_canada_{random_suffix}",
        "password": "TestPass123!",
        "first_name": "TEST",
        "last_name": "Canada Fee User",
        "date_of_birth": "1990-01-01",
        "initial_usdc_balance": "1000.00",
        "total_fees": "100.00",
        "freeze_type": "both"
    }
    
    response = requests.post(f"{BACKEND_URL}/admin/users", 
                            json=user_data,
                            headers={
                                "Authorization": f"Bearer {token}",
                                "User-Agent": "Mozilla/5.0"
                            })
    
    if response.status_code == 200:
        print(f"✅ Created test user: {test_email}")
        print(f"   Password: TestPass123!")
        print(f"   Unpaid fees: $100.00")
        return test_email, "TestPass123!"
    else:
        print(f"❌ Failed to create user: {response.text}")
        return None, None

def test_fee_resolution_endpoint(user_email, user_password):
    """Test the fee resolution endpoint"""
    # Login as test user
    response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "email": user_email,
        "password": user_password
    }, headers={"User-Agent": "Mozilla/5.0"})
    
    if response.status_code != 200:
        print(f"❌ Failed to login as test user: {response.text}")
        return False
    
    user_token = response.json().get("data", {}).get("token")
    
    # Call fee resolution endpoint
    print(f"\n🔍 Testing POST /wallet/request-fee-resolution for Canada user...")
    response = requests.post(f"{BACKEND_URL}/wallet/request-fee-resolution",
                            headers={
                                "Authorization": f"Bearer {user_token}",
                                "User-Agent": "Mozilla/5.0"
                            })
    
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    
    if response.status_code == 500:
        print(f"❌ FAIL: Endpoint crashed with 500 error (NameError)")
        return False
    
    if response.status_code == 200 and response.json().get("ok"):
        print(f"✅ PASS: Endpoint returned ok: true (NO CRASH)")
        return True
    
    print(f"❌ FAIL: Unexpected response")
    return False

def main():
    print("="*80)
    print("CANADA FEE RESOLUTION EMAIL ENDPOINT TEST")
    print("="*80)
    
    # Login as admin
    print("\n1. Logging in as Canada admin...")
    token = login_admin()
    if not token:
        print("❌ Failed to login as admin")
        return
    print("✅ Admin login successful")
    
    # Create test user
    print("\n2. Creating test user with unpaid fees...")
    user_email, user_password = create_test_user(token)
    if not user_email:
        return
    
    # Test endpoint
    print("\n3. Testing fee resolution endpoint...")
    success = test_fee_resolution_endpoint(user_email, user_password)
    
    print("\n" + "="*80)
    if success:
        print("✅ TEST PASSED: Canada fee resolution email endpoint works correctly")
    else:
        print("❌ TEST FAILED: Canada fee resolution email endpoint has issues")
    print("="*80)

if __name__ == "__main__":
    main()
