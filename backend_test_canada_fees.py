#!/usr/bin/env python3
"""
Canada User Fee Bug Fix Testing Script
Tests that when admin sets total_fees=8000, transactions have large fees (~200-500 each), NOT 0.50 each
"""

import requests
import json
from typing import Dict, Any, Optional
from decimal import Decimal

# Configuration
BACKEND_URL = "https://multitenant-vault--91znyxas.preview.emergentagent.com/api"
CANADA_ADMIN_EMAIL = "admin@uniswapv4ca.com"
CANADA_ADMIN_PASSWORD = "Admin@123456"

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
                 json_data: Optional[Dict] = None, params: Optional[Dict] = None) -> tuple[int, Any]:
    """Make HTTP request and return status code and response data"""
    url = f"{BACKEND_URL}{endpoint}"
    
    if headers is None:
        headers = {}
    if "User-Agent" not in headers:
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=json_data, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
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

def test_canada_admin_login() -> Optional[str]:
    """Test 1: Login as Canada admin"""
    print_test("Test 1: Canada Admin Login")
    
    status, data = make_request("POST", "/auth/login", json_data={
        "email": CANADA_ADMIN_EMAIL,
        "password": CANADA_ADMIN_PASSWORD
    })
    
    if status != 200:
        print_fail(f"Login failed with status {status}: {data}")
        return None
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return None
    
    token = data.get("data", {}).get("token")
    if not token:
        print_fail("No token in response")
        return None
    
    print_pass(f"Canada admin login successful")
    print_info(f"Token: {token[:30]}...")
    return token

def test_create_user_with_large_fees(token: str, total_fees: str, test_name: str) -> Optional[str]:
    """Test 2: Create user with specified total_fees"""
    print_test(f"Test 2: Create User with total_fees={total_fees} ({test_name})")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Generate unique email for this test
    import time
    timestamp = int(time.time())
    email = f"feetest_{test_name}_{timestamp}@canada.com"
    
    user_data = {
        "email": email,
        "username": f"feetest{test_name}{timestamp}",
        "password": "TestPassword123!",
        "first_name": "Fee",
        "last_name": f"Test{test_name}",
        "date_of_birth": "1990-01-01",
        "initial_usdc_balance": "50000",
        "total_fees": total_fees,
        "transaction_start_date": "2024-01-01",
        "transaction_end_date": "2024-06-01",
        "freeze_type": "both"
    }
    
    print_info(f"Creating user: {email}")
    print_info(f"Initial USDC balance: $50,000")
    print_info(f"Total fees: ${total_fees}")
    
    status, data = make_request("POST", "/admin/users", headers=headers, json_data=user_data)
    
    if status != 200:
        print_fail(f"User creation failed with status {status}: {data}")
        return None
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return None
    
    user_id = data.get("data", {}).get("user", {}).get("id")
    if not user_id:
        print_fail("No user_id in response")
        return None
    
    print_pass(f"User created successfully")
    print_info(f"User ID: {user_id}")
    print_info(f"Email: {email}")
    
    return user_id

def test_verify_user_total_unpaid_fees(token: str, user_id: str, expected_fees: str) -> bool:
    """Test 3: Verify user's total_unpaid_fees matches expected value"""
    print_test(f"Test 3: Verify total_unpaid_fees = ${expected_fees}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    status, data = make_request("GET", f"/admin/users/{user_id}", headers=headers)
    
    if status != 200:
        print_fail(f"Get user failed with status {status}: {data}")
        return False
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return False
    
    user = data.get("data", {}).get("user", {})
    total_unpaid_fees = user.get("total_unpaid_fees")
    
    print_info(f"User total_unpaid_fees: ${total_unpaid_fees}")
    
    # Convert to Decimal for accurate comparison
    try:
        actual_fees = Decimal(str(total_unpaid_fees))
        expected_fees_decimal = Decimal(expected_fees)
        
        if actual_fees == expected_fees_decimal:
            print_pass(f"total_unpaid_fees matches expected value: ${expected_fees}")
            return True
        else:
            print_fail(f"total_unpaid_fees mismatch: expected ${expected_fees}, got ${actual_fees}")
            return False
    except Exception as e:
        print_fail(f"Error comparing fees: {e}")
        return False

def test_verify_transaction_fees(token: str, user_id: str, expected_total_fees: str, test_scenario: str) -> bool:
    """Test 4: Verify transaction fees are distributed correctly"""
    print_test(f"Test 4: Verify Transaction Fees ({test_scenario})")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    status, data = make_request("GET", "/admin/transactions", headers=headers, params={"user_id": user_id})
    
    if status != 200:
        print_fail(f"Get transactions failed with status {status}: {data}")
        return False
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return False
    
    transactions = data.get("data", {}).get("transactions", [])
    
    if not transactions:
        print_fail("No transactions found for user")
        return False
    
    print_info(f"Found {len(transactions)} transactions")
    
    # Analyze transaction fees
    fees = []
    negative_fees = []
    tiny_fees = []  # fees around 0.50
    large_fees = []  # fees >= 50
    failed_withdrawals = []
    
    for tx in transactions:
        fee = Decimal(str(tx.get("fee", "0")))
        fees.append(fee)
        
        if tx.get("status") == "failed" and tx.get("type") == "withdrawal":
            failed_withdrawals.append((fee, tx.get("asset")))
        
        if fee < 0:
            negative_fees.append(fee)
        elif fee < Decimal("1.00"):
            tiny_fees.append(fee)
        elif fee >= Decimal("50"):
            large_fees.append(fee)
    
    total_fees = sum(fees)
    expected_total = Decimal(expected_total_fees)
    
    print_info(f"Total fees from transactions: ${total_fees}")
    print_info(f"Expected total fees: ${expected_total}")
    print_info(f"Number of failed withdrawals: {len(failed_withdrawals)}")
    if failed_withdrawals:
        print_info(f"Failed withdrawal fees: {[(str(f), a) for f, a in failed_withdrawals]}")
    print_info(f"Number of negative fees: {len(negative_fees)}")
    print_info(f"Number of tiny fees (<$1): {len(tiny_fees)}")
    print_info(f"Number of large fees (≥$50): {len(large_fees)}")
    
    # Show fee distribution
    if fees:
        print_info(f"Min fee: ${min(fees)}")
        print_info(f"Max fee: ${max(fees)}")
        print_info(f"Average fee: ${total_fees / len(fees):.2f}")
    
    # Show sample fees
    print_info(f"Sample fees (first 5): {[str(f) for f in fees[:5]]}")
    
    # Validation checks
    passed = True
    
    # Check 1: No negative fees
    if negative_fees:
        print_fail(f"Found {len(negative_fees)} negative fees: {negative_fees}")
        passed = False
    else:
        print_pass("No negative fees found")
    
    # Check 2: Total fees should approximately match expected (within 1% tolerance)
    tolerance = expected_total * Decimal("0.01")
    if abs(total_fees - expected_total) <= tolerance:
        print_pass(f"Total fees match expected: ${total_fees} ≈ ${expected_total}")
    else:
        print_fail(f"Total fees mismatch: ${total_fees} vs ${expected_total} (diff: ${abs(total_fees - expected_total)})")
        passed = False
    
    # Check 3: For large total_fees (8000), each transaction should have large fee
    if expected_total >= Decimal("1000"):
        if large_fees:
            print_pass(f"Found {len(large_fees)} transactions with large fees (≥$50)")
        else:
            print_fail("No transactions with large fees found (expected fees ≥$50)")
            passed = False
        
        # Check that most fees are large (not tiny 0.50 fees)
        if len(tiny_fees) > len(transactions) * 0.1:  # More than 10% tiny fees is bad
            print_fail(f"Too many tiny fees: {len(tiny_fees)} out of {len(transactions)} transactions")
            passed = False
        else:
            print_pass(f"Tiny fees are minimal: {len(tiny_fees)} out of {len(transactions)} transactions")
    
    # Check 4: For zero total_fees, all fees should be 0.00
    if expected_total == Decimal("0"):
        non_zero_fees = [f for f in fees if f != Decimal("0.00")]
        if non_zero_fees:
            print_fail(f"Found {len(non_zero_fees)} non-zero fees when total_fees=0: {non_zero_fees[:5]}")
            passed = False
        else:
            print_pass("All transaction fees are 0.00 (as expected for total_fees=0)")
    
    return passed

def test_cleanup_user(token: str, user_id: str) -> bool:
    """Test 5: Delete test user"""
    print_test(f"Test 5: Cleanup - Delete User {user_id}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    status, data = make_request("DELETE", f"/admin/users/{user_id}", headers=headers)
    
    if status != 200:
        print_fail(f"Delete user failed with status {status}: {data}")
        return False
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return False
    
    print_pass(f"User {user_id} deleted successfully")
    return True

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}CANADA USER FEE BUG FIX TESTING{Colors.RESET}")
    print(f"{Colors.BLUE}Backend URL: {BACKEND_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}Testing: Large fees distribution (8000) and zero fees (0){Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0
    }
    
    # Test 1: Login as Canada admin
    token = test_canada_admin_login()
    results["total"] += 1
    if token:
        results["passed"] += 1
    else:
        results["failed"] += 1
        print_fail("Cannot continue without admin token")
        return
    
    # Test Scenario A: total_fees = 8000 (large fees)
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}SCENARIO A: total_fees = 8000 (Large Fees){Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    
    user_id_8000 = test_create_user_with_large_fees(token, "8000", "8000")
    results["total"] += 1
    if user_id_8000:
        results["passed"] += 1
    else:
        results["failed"] += 1
        user_id_8000 = None
    
    if user_id_8000:
        # Verify total_unpaid_fees
        results["total"] += 1
        if test_verify_user_total_unpaid_fees(token, user_id_8000, "8000"):
            results["passed"] += 1
        else:
            results["failed"] += 1
        
        # Verify transaction fees
        results["total"] += 1
        if test_verify_transaction_fees(token, user_id_8000, "8000", "Large Fees (8000)"):
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # Test Scenario B: total_fees = 0 (zero fees)
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}SCENARIO B: total_fees = 0 (Zero Fees){Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    
    user_id_0 = test_create_user_with_large_fees(token, "0", "0")
    results["total"] += 1
    if user_id_0:
        results["passed"] += 1
    else:
        results["failed"] += 1
        user_id_0 = None
    
    if user_id_0:
        # Verify total_unpaid_fees
        results["total"] += 1
        if test_verify_user_total_unpaid_fees(token, user_id_0, "0"):
            results["passed"] += 1
        else:
            results["failed"] += 1
        
        # Verify transaction fees
        results["total"] += 1
        if test_verify_transaction_fees(token, user_id_0, "0", "Zero Fees (0)"):
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    # Cleanup
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}CLEANUP{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    
    if user_id_8000:
        results["total"] += 1
        if test_cleanup_user(token, user_id_8000):
            results["passed"] += 1
        else:
            results["failed"] += 1
    
    if user_id_0:
        results["total"] += 1
        if test_cleanup_user(token, user_id_0):
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
        print(f"\n{Colors.GREEN}✅ ALL TESTS PASSED! Canada fee bug fix is working correctly.{Colors.RESET}\n")
    else:
        print(f"\n{Colors.RED}❌ SOME TESTS FAILED - Fee distribution issue detected{Colors.RESET}\n")

if __name__ == "__main__":
    main()
