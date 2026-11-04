#!/usr/bin/env python3
"""
Exchange Rate Testing Script
Tests tenant-aware exchange rate functionality for Canada (CAD) and Italy (EUR)
"""

import requests
import json
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://v4-markets-dashboard.preview.emergentagent.com/api"
CANADA_ADMIN_EMAIL = "admin@uniswapv4ca.com"
CANADA_ADMIN_PASSWORD = "Admin@123456"
ITALY_ADMIN_EMAIL = "admin@uniswapv4.com"
ITALY_ADMIN_PASSWORD = "admin123"

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
    
    if headers is None:
        headers = {}
    if "User-Agent" not in headers:
        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    
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

def login_user(email: str, password: str) -> Optional[str]:
    """Login and return access token"""
    status, data = make_request("POST", "/auth/login", json_data={
        "email": email,
        "password": password
    })
    
    if status != 200 or not data.get("ok"):
        print_fail(f"Login failed for {email}: {data}")
        return None
    
    token = data.get("data", {}).get("token")
    if not token:
        print_fail(f"No token in login response for {email}")
        return None
    
    print_pass(f"Login successful for {email}")
    return token

def test_1_italy_exchange_rate() -> bool:
    """Test 1: Italy admin - GET /api/exchange-rate should return EUR rates"""
    print_test("Test 1: Italy Admin - EUR Exchange Rate")
    
    # Login as Italy admin
    token = login_user(ITALY_ADMIN_EMAIL, ITALY_ADMIN_PASSWORD)
    if not token:
        return False
    
    # Get exchange rate
    headers = {"Authorization": f"Bearer {token}"}
    status, data = make_request("GET", "/exchange-rate", headers=headers)
    
    if status != 200:
        print_fail(f"Exchange rate request failed with status {status}: {data}")
        return False
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return False
    
    rate_data = data.get("data", {})
    usdc_eur = rate_data.get("usdc_eur")
    eur_usdc = rate_data.get("eur_usdc")
    
    print_info(f"Response: {json.dumps(rate_data, indent=2)}")
    
    # Verify EUR rates (should be around 0.85-0.95 EUR per USDC)
    if usdc_eur is None:
        print_fail("Missing usdc_eur in response")
        return False
    
    if eur_usdc is None:
        print_fail("Missing eur_usdc in response")
        return False
    
    # EUR rate should be around 0.85-0.95 (EUR per USDC)
    if not (0.80 <= usdc_eur <= 1.00):
        print_fail(f"usdc_eur rate {usdc_eur} is outside expected EUR range (0.80-1.00)")
        return False
    
    print_pass(f"usdc_eur rate {usdc_eur} is within EUR range (0.80-1.00)")
    
    # eur_usdc should be around 1.05-1.20 (USDC per EUR)
    if not (1.00 <= eur_usdc <= 1.30):
        print_fail(f"eur_usdc rate {eur_usdc} is outside expected range (1.00-1.30)")
        return False
    
    print_pass(f"eur_usdc rate {eur_usdc} is within expected range (1.00-1.30)")
    print_pass("Italy admin correctly receives EUR exchange rates")
    
    return True

def test_2_canada_exchange_rate() -> bool:
    """Test 2: Canada admin - GET /api/exchange-rate should return CAD rates"""
    print_test("Test 2: Canada Admin - CAD Exchange Rate")
    
    # Login as Canada admin
    token = login_user(CANADA_ADMIN_EMAIL, CANADA_ADMIN_PASSWORD)
    if not token:
        return False
    
    # Get exchange rate
    headers = {"Authorization": f"Bearer {token}"}
    status, data = make_request("GET", "/exchange-rate", headers=headers)
    
    if status != 200:
        print_fail(f"Exchange rate request failed with status {status}: {data}")
        return False
    
    if not data.get("ok"):
        print_fail(f"Response ok=false: {data}")
        return False
    
    rate_data = data.get("data", {})
    usdc_eur = rate_data.get("usdc_eur")  # Actually CAD for Canada tenant
    eur_usdc = rate_data.get("eur_usdc")  # Actually USDC per CAD
    
    print_info(f"Response: {json.dumps(rate_data, indent=2)}")
    
    # Verify CAD rates (should be around 1.35-1.45 CAD per USDC)
    if usdc_eur is None:
        print_fail("Missing usdc_eur (CAD rate) in response")
        return False
    
    if eur_usdc is None:
        print_fail("Missing eur_usdc (USDC per CAD) in response")
        return False
    
    # CAD rate should be around 1.35-1.45 (CAD per USDC)
    if not (1.30 <= usdc_eur <= 1.50):
        print_fail(f"usdc_eur (CAD) rate {usdc_eur} is outside expected CAD range (1.30-1.50)")
        return False
    
    print_pass(f"usdc_eur (CAD) rate {usdc_eur} is within CAD range (1.30-1.50)")
    
    # USDC per CAD should be around 0.68-0.75
    if not (0.65 <= eur_usdc <= 0.80):
        print_fail(f"eur_usdc (USDC per CAD) rate {eur_usdc} is outside expected range (0.65-0.80)")
        return False
    
    print_pass(f"eur_usdc (USDC per CAD) rate {eur_usdc} is within expected range (0.65-0.80)")
    print_pass("Canada admin correctly receives CAD exchange rates")
    
    return True

def test_3_rates_are_different() -> bool:
    """Test 3: Verify Italy EUR and Canada CAD rates are different"""
    print_test("Test 3: Verify EUR and CAD Rates Are Different")
    
    # Get Italy EUR rate
    italy_token = login_user(ITALY_ADMIN_EMAIL, ITALY_ADMIN_PASSWORD)
    if not italy_token:
        return False
    
    headers = {"Authorization": f"Bearer {italy_token}"}
    status, italy_data = make_request("GET", "/exchange-rate", headers=headers)
    
    if status != 200 or not italy_data.get("ok"):
        print_fail(f"Failed to get Italy rate: {italy_data}")
        return False
    
    italy_rate = italy_data.get("data", {}).get("usdc_eur")
    
    # Get Canada CAD rate
    canada_token = login_user(CANADA_ADMIN_EMAIL, CANADA_ADMIN_PASSWORD)
    if not canada_token:
        return False
    
    headers = {"Authorization": f"Bearer {canada_token}"}
    status, canada_data = make_request("GET", "/exchange-rate", headers=headers)
    
    if status != 200 or not canada_data.get("ok"):
        print_fail(f"Failed to get Canada rate: {canada_data}")
        return False
    
    canada_rate = canada_data.get("data", {}).get("usdc_eur")
    
    print_info(f"Italy EUR rate: {italy_rate}")
    print_info(f"Canada CAD rate: {canada_rate}")
    
    # Rates should be significantly different
    # EUR is around 0.88, CAD is around 1.39
    if italy_rate is None or canada_rate is None:
        print_fail("Missing rate data")
        return False
    
    # Calculate difference percentage
    diff_pct = abs(italy_rate - canada_rate) / italy_rate * 100
    
    if diff_pct < 30:  # Should be at least 30% different
        print_fail(f"Rates are too similar: Italy={italy_rate}, Canada={canada_rate}, diff={diff_pct:.1f}%")
        return False
    
    print_pass(f"Rates are significantly different: Italy={italy_rate}, Canada={canada_rate}, diff={diff_pct:.1f}%")
    
    return True

def test_4_cad_reflects_reality() -> bool:
    """Test 4: Verify CAD rate reflects reality (1 USDC ≈ 1.39 CAD, not 0.88 like EUR)"""
    print_test("Test 4: Verify CAD Rate Reflects Reality")
    
    # Get Canada CAD rate
    canada_token = login_user(CANADA_ADMIN_EMAIL, CANADA_ADMIN_PASSWORD)
    if not canada_token:
        return False
    
    headers = {"Authorization": f"Bearer {canada_token}"}
    status, canada_data = make_request("GET", "/exchange-rate", headers=headers)
    
    if status != 200 or not canada_data.get("ok"):
        print_fail(f"Failed to get Canada rate: {canada_data}")
        return False
    
    canada_rate = canada_data.get("data", {}).get("usdc_eur")  # Actually CAD
    
    print_info(f"Canada CAD rate: {canada_rate}")
    
    # CAD should be around 1.39 (definitely NOT 0.88 like EUR)
    if canada_rate is None:
        print_fail("Missing CAD rate")
        return False
    
    # Verify it's NOT in EUR range (0.80-1.00)
    if 0.80 <= canada_rate <= 1.00:
        print_fail(f"CAD rate {canada_rate} is in EUR range (0.80-1.00) - should be in CAD range (1.30-1.50)")
        return False
    
    print_pass(f"CAD rate {canada_rate} is NOT in EUR range (0.80-1.00)")
    
    # Verify it IS in CAD range (1.30-1.50)
    if not (1.30 <= canada_rate <= 1.50):
        print_fail(f"CAD rate {canada_rate} is outside expected CAD range (1.30-1.50)")
        return False
    
    print_pass(f"CAD rate {canada_rate} reflects reality: 1 USDC ≈ {canada_rate} CAD (expected ~1.39)")
    
    return True

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}EXCHANGE RATE TESTING - TENANT-AWARE CAD/EUR{Colors.RESET}")
    print(f"{Colors.BLUE}Backend URL: {BACKEND_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0
    }
    
    tests = [
        ("Test 1: Italy EUR Exchange Rate", test_1_italy_exchange_rate),
        ("Test 2: Canada CAD Exchange Rate", test_2_canada_exchange_rate),
        ("Test 3: Rates Are Different", test_3_rates_are_different),
        ("Test 4: CAD Reflects Reality", test_4_cad_reflects_reality),
    ]
    
    for test_name, test_func in tests:
        results["total"] += 1
        try:
            if test_func():
                results["passed"] += 1
            else:
                results["failed"] += 1
        except Exception as e:
            print_fail(f"Test raised exception: {str(e)}")
            import traceback
            traceback.print_exc()
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
    
    return results

if __name__ == "__main__":
    main()
