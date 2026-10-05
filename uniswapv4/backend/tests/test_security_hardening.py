"""
Test Security Hardening Features:
1. Bot Detection Middleware - blocks known crawler/scanner User-Agents
2. CSP Headers - Content-Security-Policy on all responses
3. X-Robots-Tag header on all responses
4. Access Gate verification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Browser-like User-Agent for normal requests
BROWSER_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Bot User-Agents that should be blocked
BOT_USER_AGENTS = [
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "python-requests/2.28.0",
    "curl/7.68.0",
    "PhishTank/1.0",
    "Scrapy/2.5.0",
    "wget/1.21",
]


class TestBotDetection:
    """Test bot detection middleware blocks known crawlers/scanners"""
    
    def test_health_blocked_with_googlebot_ua(self):
        """GET /api/health with Googlebot User-Agent returns 403"""
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={"User-Agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"}
        )
        assert response.status_code == 403, f"Expected 403 for Googlebot, got {response.status_code}"
        print("PASS: Googlebot blocked with 403")
    
    def test_health_blocked_with_python_requests_ua(self):
        """GET /api/health with python-requests User-Agent returns 403"""
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={"User-Agent": "python-requests/2.28.0"}
        )
        assert response.status_code == 403, f"Expected 403 for python-requests, got {response.status_code}"
        print("PASS: python-requests blocked with 403")
    
    def test_health_blocked_with_curl_ua(self):
        """GET /api/health with curl User-Agent returns 403"""
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={"User-Agent": "curl/7.68.0"}
        )
        assert response.status_code == 403, f"Expected 403 for curl, got {response.status_code}"
        print("PASS: curl blocked with 403")
    
    def test_health_blocked_with_phishtank_ua(self):
        """GET /api/health with PhishTank User-Agent returns 403"""
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={"User-Agent": "PhishTank/1.0"}
        )
        assert response.status_code == 403, f"Expected 403 for PhishTank, got {response.status_code}"
        print("PASS: PhishTank blocked with 403")
    
    def test_health_allowed_with_browser_ua(self):
        """GET /api/health with browser User-Agent returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200, f"Expected 200 for browser UA, got {response.status_code}"
        print("PASS: Browser UA allowed with 200")
    
    def test_verify_access_blocked_with_bot_ua(self):
        """POST /api/verify-access with bot User-Agent returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": "DMTL610Q"},
            headers={"User-Agent": "Googlebot/2.1"}
        )
        assert response.status_code == 403, f"Expected 403 for Googlebot on verify-access, got {response.status_code}"
        print("PASS: Bot blocked on verify-access endpoint")
    
    def test_verify_access_allowed_with_browser_ua(self):
        """POST /api/verify-access with browser User-Agent and correct code returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": "DMTL610Q"},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200, f"Expected 200 for browser UA on verify-access, got {response.status_code}"
        data = response.json()
        assert data.get("ok") == True, "Expected ok=True in response"
        print("PASS: Browser UA allowed on verify-access with correct code")


class TestCSPHeaders:
    """Test Content-Security-Policy headers are present on all responses"""
    
    def test_csp_header_on_health(self):
        """GET /api/health includes Content-Security-Policy header"""
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200
        csp = response.headers.get("Content-Security-Policy")
        assert csp is not None, "Content-Security-Policy header missing"
        assert "default-src" in csp, "CSP should include default-src directive"
        print(f"PASS: CSP header present: {csp[:100]}...")
    
    def test_csp_header_on_verify_access(self):
        """POST /api/verify-access includes Content-Security-Policy header"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": "DMTL610Q"},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200
        csp = response.headers.get("Content-Security-Policy")
        assert csp is not None, "Content-Security-Policy header missing on verify-access"
        print("PASS: CSP header present on verify-access")
    
    def test_csp_header_on_auth_login(self):
        """POST /api/auth/login includes Content-Security-Policy header"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@uniswapv4.com", "password": "admin123"},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200
        csp = response.headers.get("Content-Security-Policy")
        assert csp is not None, "Content-Security-Policy header missing on auth/login"
        print("PASS: CSP header present on auth/login")


class TestXRobotsTag:
    """Test X-Robots-Tag header is present on all responses"""
    
    def test_x_robots_tag_on_health(self):
        """GET /api/health includes X-Robots-Tag header"""
        response = requests.get(
            f"{BASE_URL}/api/health",
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200
        robots_tag = response.headers.get("X-Robots-Tag")
        assert robots_tag is not None, "X-Robots-Tag header missing"
        assert "noindex" in robots_tag.lower(), "X-Robots-Tag should include noindex"
        assert "nofollow" in robots_tag.lower(), "X-Robots-Tag should include nofollow"
        print(f"PASS: X-Robots-Tag header present: {robots_tag}")
    
    def test_x_robots_tag_on_verify_access(self):
        """POST /api/verify-access includes X-Robots-Tag header"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": "DMTL610Q"},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200
        robots_tag = response.headers.get("X-Robots-Tag")
        assert robots_tag is not None, "X-Robots-Tag header missing on verify-access"
        print("PASS: X-Robots-Tag header present on verify-access")


class TestAccessGate:
    """Test Access Gate functionality"""
    
    def test_access_gate_correct_code(self):
        """POST /api/verify-access with correct code returns ok=True"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": "DMTL610Q"},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print("PASS: Access Gate accepts correct code DMTL610Q")
    
    def test_access_gate_wrong_code(self):
        """POST /api/verify-access with wrong code returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": "WRONGCODE"},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 403
        print("PASS: Access Gate rejects wrong code with 403")
    
    def test_access_gate_empty_code(self):
        """POST /api/verify-access with empty code returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": ""},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 403
        print("PASS: Access Gate rejects empty code with 403")


class TestAdminLogin:
    """Test admin login still works"""
    
    def test_admin_login_success(self):
        """POST /api/auth/login with admin credentials returns token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@uniswapv4.com", "password": "admin123"},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("ok") == True
        assert "data" in data
        assert "token" in data["data"]
        assert "user" in data["data"]
        assert data["data"]["user"]["email"] == "admin@uniswapv4.com"
        print("PASS: Admin login successful with admin@uniswapv4.com/admin123")
    
    def test_admin_login_wrong_password(self):
        """POST /api/auth/login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@uniswapv4.com", "password": "wrongpassword"},
            headers={"User-Agent": BROWSER_UA}
        )
        assert response.status_code == 401
        print("PASS: Admin login rejects wrong password with 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
