#!/usr/bin/env python3
"""
Canada User Password Reset Flow Testing
Tests the fix for password reset endpoints to search both Italy and Canada DBs
"""

import requests
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import sys
import uuid
from passlib.context import CryptContext

# Configuration
BACKEND_URL = "https://multitenant-vault--91znyxas.preview.emergentagent.com/api"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME_CANADA = 'uniswapv4-canada'
DB_NAME_ITALY = 'blockchain_wallet'

# Test user details
TEST_EMAIL = "resettest@canada.com"
TEST_PASSWORD = "test1234"
NEW_PASSWORD = "newpass123"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

async def create_test_canada_user():
    """Step 1: Create a test Canada user directly in the Canada DB"""
    print_test("Step 1: Create Test Canada User in Canada DB")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db_canada = client[DB_NAME_CANADA]
        
        # Check if user already exists
        existing = await db_canada.users.find_one({"email": TEST_EMAIL})
        if existing:
            print_info(f"User {TEST_EMAIL} already exists, deleting first...")
            await db_canada.users.delete_one({"email": TEST_EMAIL})
        
        # Create test user
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": TEST_EMAIL,
            "username": "resettest",
            "first_name": "Reset",
            "last_name": "Test",
            "password_hash": pwd_context.hash(TEST_PASSWORD),
            "plain_password": TEST_PASSWORD,
            "role": "user",
            "account_status": "active",
            "kyc_status": "pending",
            "freeze_type": "none",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None,
            "password_reset_token": None,
            "password_reset_expires": None,
            "password_reset_required": False,
            "preferred_language": "en",
            "totp_secret": None,
            "totp_enabled": False,
            "backup_codes": [],
            "total_unpaid_fees": "0.00",
            "fees_paid": "0.00",
            "email_verified": True
        }
        
        result = await db_canada.users.insert_one(user_doc)
        print_pass(f"Created test user in Canada DB: {TEST_EMAIL}")
        print_info(f"User ID: {user_id}")
        
        client.close()
        return user_id
        
    except Exception as e:
        print_fail(f"Failed to create test user: {str(e)}")
        return None

async def test_forgot_password_canada():
    """Step 2: Test forgot-password for Canada user"""
    print_test("Step 2: Test Forgot-Password for Canada User")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.post(
            f"{BACKEND_URL}/auth/forgot-password",
            json={"email": TEST_EMAIL},
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 200:
            print_fail(f"Forgot-password failed with status {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("ok"):
            print_fail(f"Response ok=false: {data}")
            return False
        
        print_pass("Forgot-password request successful")
        print_info(f"Response: {data.get('message')}")
        return True
        
    except Exception as e:
        print_fail(f"Request failed: {str(e)}")
        return False

async def verify_token_in_canada_db():
    """Step 2b: Verify token was stored in Canada DB"""
    print_test("Step 2b: Verify Token Stored in Canada DB")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db_canada = client[DB_NAME_CANADA]
        
        user = await db_canada.users.find_one({"email": TEST_EMAIL})
        
        if not user:
            print_fail("User not found in Canada DB")
            client.close()
            return None
        
        token = user.get("password_reset_token")
        if not token:
            print_fail("No password_reset_token found in user document")
            client.close()
            return None
        
        print_pass(f"Token found in Canada DB: {token[:20]}...")
        print_info(f"Token expires: {user.get('password_reset_expires')}")
        
        client.close()
        return token
        
    except Exception as e:
        print_fail(f"Failed to verify token: {str(e)}")
        return None

async def test_reset_password_with_token(token: str):
    """Step 3: Test reset-password with the token"""
    print_test("Step 3: Test Reset-Password with Token")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.post(
            f"{BACKEND_URL}/auth/reset-password/{token}",
            params={"new_password": NEW_PASSWORD},
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 200:
            print_fail(f"Reset-password failed with status {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("ok"):
            print_fail(f"Response ok=false: {data}")
            return False
        
        print_pass("Reset-password successful")
        print_info(f"Response: {data.get('message')}")
        return True
        
    except Exception as e:
        print_fail(f"Request failed: {str(e)}")
        return False

async def verify_password_updated_in_canada_db():
    """Step 3b: Verify password was updated and token cleared in Canada DB"""
    print_test("Step 3b: Verify Password Updated and Token Cleared")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db_canada = client[DB_NAME_CANADA]
        
        user = await db_canada.users.find_one({"email": TEST_EMAIL})
        
        if not user:
            print_fail("User not found in Canada DB")
            client.close()
            return False
        
        # Check token is cleared
        token = user.get("password_reset_token")
        if token is not None:
            print_fail(f"Token not cleared: {token}")
            client.close()
            return False
        
        print_pass("Token cleared (set to null)")
        
        # Check password was updated
        password_hash = user.get("password_hash")
        plain_password = user.get("plain_password")
        
        if plain_password != NEW_PASSWORD:
            print_fail(f"Plain password not updated: {plain_password}")
            client.close()
            return False
        
        # Verify hash matches new password
        if not pwd_context.verify(NEW_PASSWORD, password_hash):
            print_fail("Password hash doesn't match new password")
            client.close()
            return False
        
        print_pass("Password updated correctly in Canada DB")
        print_info(f"New plain_password: {plain_password}")
        
        client.close()
        return True
        
    except Exception as e:
        print_fail(f"Failed to verify password update: {str(e)}")
        return False

async def test_login_with_new_password():
    """Step 4: Test login with new password"""
    print_test("Step 4: Test Login with New Password")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": NEW_PASSWORD},
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 200:
            print_fail(f"Login failed with status {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("ok"):
            print_fail(f"Response ok=false: {data}")
            return False
        
        token = data.get("data", {}).get("token")
        if not token:
            print_fail("No token in response")
            return False
        
        print_pass("Login successful with new password")
        print_info(f"Token received: {token[:20]}...")
        return True
        
    except Exception as e:
        print_fail(f"Request failed: {str(e)}")
        return False

async def test_italy_password_reset_regression():
    """Step 5: Test Italy password reset still works (regression check)"""
    print_test("Step 5: Regression Check - Italy Password Reset")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        # Use admin@uniswapv4.net from Italy DB
        response = requests.post(
            f"{BACKEND_URL}/auth/forgot-password",
            json={"email": "admin@uniswapv4.net"},
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 200:
            print_fail(f"Italy forgot-password failed with status {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("ok"):
            print_fail(f"Response ok=false: {data}")
            return False
        
        print_pass("Italy forgot-password still works (no regression)")
        print_info(f"Response: {data.get('message')}")
        return True
        
    except Exception as e:
        print_fail(f"Request failed: {str(e)}")
        return False

async def cleanup_test_user():
    """Step 6: Cleanup - delete test Canada user"""
    print_test("Step 6: Cleanup - Delete Test User")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db_canada = client[DB_NAME_CANADA]
        
        result = await db_canada.users.delete_one({"email": TEST_EMAIL})
        
        if result.deleted_count > 0:
            print_pass(f"Deleted test user: {TEST_EMAIL}")
        else:
            print_info("Test user not found (may have been deleted already)")
        
        client.close()
        return True
        
    except Exception as e:
        print_fail(f"Failed to cleanup: {str(e)}")
        return False

async def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}CANADA USER PASSWORD RESET FLOW TESTING{Colors.RESET}")
    print(f"{Colors.BLUE}Backend URL: {BACKEND_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}MongoDB URL: {MONGO_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0
    }
    
    # Step 1: Create test Canada user
    user_id = await create_test_canada_user()
    results["total"] += 1
    if user_id:
        results["passed"] += 1
    else:
        results["failed"] += 1
        print_fail("Cannot continue without test user")
        return
    
    # Step 2: Test forgot-password for Canada user
    results["total"] += 1
    if await test_forgot_password_canada():
        results["passed"] += 1
    else:
        results["failed"] += 1
        await cleanup_test_user()
        return
    
    # Step 2b: Verify token in Canada DB
    token = await verify_token_in_canada_db()
    results["total"] += 1
    if token:
        results["passed"] += 1
    else:
        results["failed"] += 1
        await cleanup_test_user()
        return
    
    # Step 3: Test reset-password with token
    results["total"] += 1
    if await test_reset_password_with_token(token):
        results["passed"] += 1
    else:
        results["failed"] += 1
        await cleanup_test_user()
        return
    
    # Step 3b: Verify password updated and token cleared
    results["total"] += 1
    if await verify_password_updated_in_canada_db():
        results["passed"] += 1
    else:
        results["failed"] += 1
        await cleanup_test_user()
        return
    
    # Step 4: Test login with new password
    results["total"] += 1
    if await test_login_with_new_password():
        results["passed"] += 1
    else:
        results["failed"] += 1
        await cleanup_test_user()
        return
    
    # Step 5: Regression check - Italy password reset
    results["total"] += 1
    if await test_italy_password_reset_regression():
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Step 6: Cleanup
    results["total"] += 1
    if await cleanup_test_user():
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
        print(f"\n{Colors.GREEN}✅ ALL TESTS PASSED!{Colors.RESET}")
        print(f"{Colors.GREEN}Canada user password reset flow is working correctly!{Colors.RESET}\n")
    else:
        print(f"\n{Colors.RED}❌ SOME TESTS FAILED{Colors.RESET}\n")

if __name__ == "__main__":
    asyncio.run(main())
