"""
Test Access Gate and Security Features for Uniswap V4 Wallet Platform
Tests:
- Access Gate verification endpoint
- X-Robots-Tag headers
- Admin login functionality
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ACCESS_CODE = "DMTL610Q"
ADMIN_EMAIL = "admin@uniswapv4.com"
ADMIN_PASSWORD = "admin123"


class TestAccessGate:
    """Access Gate verification endpoint tests"""
    
    def test_verify_access_correct_code(self):
        """Test that correct access code returns ok: true"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": ACCESS_CODE}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("ok") == True, f"Expected ok=true, got {data}"
    
    def test_verify_access_wrong_code(self):
        """Test that wrong access code returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": "WRONGCODE"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        data = response.json()
        assert "Invalid access code" in data.get("detail", ""), f"Expected 'Invalid access code' in detail, got {data}"
    
    def test_verify_access_empty_code(self):
        """Test that empty access code returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": ""}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_verify_access_lowercase_code(self):
        """Test that lowercase code (case sensitivity) returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": "dmtl610q"}
        )
        # Code should be case-sensitive
        assert response.status_code == 403, f"Expected 403 for lowercase code, got {response.status_code}"


class TestSecurityHeaders:
    """Security headers tests"""
    
    def test_x_robots_tag_on_api_root(self):
        """Test X-Robots-Tag header is present on API root"""
        response = requests.get(f"{BASE_URL}/api/")
        assert "x-robots-tag" in response.headers, "X-Robots-Tag header missing"
        robots_tag = response.headers.get("x-robots-tag", "").lower()
        assert "noindex" in robots_tag, f"Expected 'noindex' in X-Robots-Tag, got {robots_tag}"
        assert "nofollow" in robots_tag, f"Expected 'nofollow' in X-Robots-Tag, got {robots_tag}"
    
    def test_x_robots_tag_on_health(self):
        """Test X-Robots-Tag header is present on health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert "x-robots-tag" in response.headers, "X-Robots-Tag header missing on health endpoint"
        robots_tag = response.headers.get("x-robots-tag", "").lower()
        assert "noindex" in robots_tag, f"Expected 'noindex' in X-Robots-Tag"
    
    def test_x_robots_tag_on_verify_access(self):
        """Test X-Robots-Tag header is present on verify-access endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/verify-access",
            json={"code": ACCESS_CODE}
        )
        assert "x-robots-tag" in response.headers, "X-Robots-Tag header missing on verify-access"
        robots_tag = response.headers.get("x-robots-tag", "").lower()
        assert "noindex" in robots_tag, f"Expected 'noindex' in X-Robots-Tag"
    
    def test_cache_control_headers(self):
        """Test Cache-Control headers prevent caching on API endpoints"""
        response = requests.get(f"{BASE_URL}/api/health")
        cache_control = response.headers.get("cache-control", "").lower()
        assert "no-store" in cache_control or "no-cache" in cache_control, \
            f"Expected no-store or no-cache in Cache-Control, got {cache_control}"
    
    def test_security_headers_present(self):
        """Test other security headers are present"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        # X-Content-Type-Options
        assert "x-content-type-options" in response.headers, "X-Content-Type-Options header missing"
        assert response.headers.get("x-content-type-options") == "nosniff"
        
        # X-Frame-Options
        assert "x-frame-options" in response.headers, "X-Frame-Options header missing"
        
        # Strict-Transport-Security
        assert "strict-transport-security" in response.headers, "Strict-Transport-Security header missing"


class TestAdminLogin:
    """Admin login tests"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("ok") == True, f"Expected ok=true, got {data}"
        assert "data" in data, "Expected 'data' in response"
        assert "token" in data["data"], "Expected 'token' in data"
        assert "user" in data["data"], "Expected 'user' in data"
        
        user = data["data"]["user"]
        assert user.get("email") == ADMIN_EMAIL, f"Expected email {ADMIN_EMAIL}, got {user.get('email')}"
        assert user.get("role") in ["admin", "superadmin"], f"Expected admin/superadmin role, got {user.get('role')}"
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_admin_login_wrong_email(self):
        """Test login with non-existent email returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "anypassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAdminAccess:
    """Test admin can access admin endpoints after login"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["data"]["token"]
        pytest.skip("Admin login failed")
    
    def test_admin_can_access_users_list(self, admin_token):
        """Test admin can access users list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("ok") == True
        assert "data" in data
        assert "users" in data["data"]
    
    def test_admin_can_access_dashboard_stats(self, admin_token):
        """Test admin can access dashboard stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # Stats endpoint may or may not exist, but should not return 401/403
        assert response.status_code != 401, "Admin should not get 401 on admin endpoints"
        assert response.status_code != 403, "Admin should not get 403 on admin endpoints"


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", f"Expected status=healthy, got {data}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
