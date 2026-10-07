#!/usr/bin/env python3
"""
Backend Test: Email Diagnostic Endpoints
Tests the email configuration status and test email functionality
"""

import requests
import json
import sys

# Backend URL
BASE_URL = "https://trading-app-preview-6.preview.emergentagent.com/api"

# Admin credentials
ADMIN_EMAIL = "admin@uniswapv4.com"
ADMIN_PASSWORD = "admin123"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def print_response(response, title="Response"):
    """Print formatted response details"""
    print(f"\n{title}:")
    print(f"  Status Code: {response.status_code}")
    print(f"  Headers: {dict(response.headers)}")
    try:
        data = response.json()
        print(f"  Body: {json.dumps(data, indent=2)}")
        return data
    except:
        print(f"  Body (raw): {response.text}")
        return None

def test_email_diagnostics():
    """Test email diagnostic endpoints"""
    
    print_section("STEP 1: Login as Admin")
    
    # Step 1: Login as admin
    login_url = f"{BASE_URL}/auth/login"
    login_payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    # Use a proper browser user-agent to avoid bot detection
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }
    
    print(f"\nPOST {login_url}")
    print(f"Body: {json.dumps(login_payload, indent=2)}")
    
    try:
        login_response = requests.post(login_url, json=login_payload, headers=headers, timeout=10)
        login_data = print_response(login_response, "Login Response")
        
        if login_response.status_code != 200:
            print("\n❌ LOGIN FAILED!")
            return False
        
        # Extract token
        token = login_data.get("token")
        if not token:
            print("\n❌ No token in login response!")
            return False
        
        print(f"\n✅ Login successful! Token extracted: {token[:20]}...")
        
    except Exception as e:
        print(f"\n❌ Login request failed: {str(e)}")
        return False
    
    # Step 2: Check email status
    print_section("STEP 2: Check Email Status")
    
    email_status_url = f"{BASE_URL}/admin/email-status"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print(f"\nGET {email_status_url}")
    print(f"Headers: Authorization: Bearer {token[:20]}...")
    
    try:
        status_response = requests.get(email_status_url, headers=headers, timeout=10)
        status_data = print_response(status_response, "Email Status Response")
        
        if status_response.status_code != 200:
            print("\n❌ EMAIL STATUS CHECK FAILED!")
            return False
        
        print("\n✅ Email status retrieved successfully!")
        
        # Print detailed email configuration
        if status_data and "data" in status_data:
            config = status_data["data"]
            print("\n📧 EMAIL CONFIGURATION DETAILS:")
            print(f"  • is_configured: {config.get('is_configured')}")
            print(f"  • has_api_key: {config.get('has_api_key')}")
            print(f"  • api_key_preview: {config.get('api_key_preview')}")
            print(f"  • sender_email: {config.get('sender_email')}")
            print(f"  • sender_name: {config.get('sender_name')}")
            print(f"  • reply_to: {config.get('reply_to')}")
            print(f"  • resend_available: {config.get('resend_available')}")
            print(f"  • resend_module_key_set: {config.get('resend_module_key_set')}")
        
    except Exception as e:
        print(f"\n❌ Email status request failed: {str(e)}")
        return False
    
    # Step 3: Try to send a test email
    print_section("STEP 3: Send Test Email")
    
    test_email_url = f"{BASE_URL}/admin/test-email"
    test_email_payload = {
        "to_email": ADMIN_EMAIL
    }
    
    print(f"\nPOST {test_email_url}")
    print(f"Headers: Authorization: Bearer {token[:20]}...")
    print(f"Body: {json.dumps(test_email_payload, indent=2)}")
    
    try:
        test_response = requests.post(test_email_url, json=test_email_payload, headers=headers, timeout=10)
        test_data = print_response(test_response, "Test Email Response")
        
        if test_response.status_code != 200:
            print("\n⚠️  TEST EMAIL REQUEST RETURNED NON-200 STATUS")
        else:
            print("\n✅ Test email request completed!")
        
        # Print detailed test email result
        if test_data:
            print("\n📧 TEST EMAIL RESULT:")
            print(f"  • ok: {test_data.get('ok')}")
            if "result" in test_data:
                result = test_data["result"]
                print(f"  • success: {result.get('success')}")
                if "error" in result:
                    print(f"  • error: {result.get('error')}")
                if "resend_id" in result:
                    print(f"  • resend_id: {result.get('resend_id')}")
                if "sent_at" in result:
                    print(f"  • sent_at: {result.get('sent_at')}")
                if "would_send" in result:
                    print(f"  • would_send: {result.get('would_send')}")
            if "error" in test_data:
                print(f"  • error: {test_data.get('error')}")
            if "details" in test_data:
                print(f"  • details: {test_data.get('details')}")
        
    except Exception as e:
        print(f"\n❌ Test email request failed: {str(e)}")
        return False
    
    print_section("DIAGNOSTIC TEST COMPLETE")
    print("\n✅ All diagnostic tests completed successfully!")
    print("\nThis was a diagnostic test - all response details have been reported above.")
    
    return True

if __name__ == "__main__":
    print("="*80)
    print("  EMAIL DIAGNOSTIC ENDPOINT TEST")
    print("  Testing Uniswap V4 Backend Email Configuration")
    print("="*80)
    
    success = test_email_diagnostics()
    
    if success:
        print("\n✅ TEST SUITE PASSED")
        sys.exit(0)
    else:
        print("\n❌ TEST SUITE FAILED")
        sys.exit(1)
