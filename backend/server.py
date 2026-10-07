"""
Uniswap V4 Wallet Platform - Main Server
FastAPI backend with MongoDB
"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query, File, UploadFile, Form
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import asyncio
from pathlib import Path
from typing import List, Optional
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from decimal import Decimal

# Local imports
from models import (
    User, UserCreate, UserUpdate, UserLogin, UserPublic, UserRole, AccountStatus,
    FreezeType, KYCStatus, Wallet, WalletUpdate, AssetType,
    Transaction, TransactionCreate, TransactionType, TransactionStatus,
    KYCDocument, KYCSubmit, KYCReview, KYCImageUpload,
    AuditLog, EmailLog, SystemSettings, Session, Notification
)
from pydantic import BaseModel
from auth import (
    hash_password, verify_password, create_access_token, decode_token,
    get_current_user, require_admin, require_superadmin,
    generate_reset_token, generate_verification_token,
    SECRET_KEY, ALGORITHM
)
import jwt
from transaction_generator import generate_transaction_history, generate_fake_eth_address
from email_service import get_email_service, RESEND_AVAILABLE
import cloudinary
import cloudinary.uploader
import base64
import re
import random
import uuid

# Setup
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_base64_to_cloudinary(base64_str: str, folder: str, public_id: str) -> str:
    """Upload a base64 image to Cloudinary and return the secure URL."""
    result = cloudinary.uploader.upload(
        base64_str,
        folder=folder,
        public_id=public_id,
        overwrite=True,
        resource_type="auto",
        format="jpg"  # Auto-convert HEIC/HEIF to JPEG
    )
    return result["secure_url"]

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'blockchain_wallet')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Create the main app
app = FastAPI(title="Uniswap V4 Wallet API", version="1.0.0")

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

class TokenRefreshMiddleware(BaseHTTPMiddleware):
    """Middleware placeholder - sliding session token refresh has been disabled
    to prevent session corruption via cached X-Refreshed-Token headers."""
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        return response

app.add_middleware(TokenRefreshMiddleware)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses to signal a legitimate application."""
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=(self), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # X-Robots-Tag: block all indexing
        response.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive, nosnippet"
        # Content Security Policy - signals legitimate app to registrars
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://cdn.tailwindcss.com https://assets.emergent.sh https://us.i.posthog.com https://*.posthog.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com; "
            "connect-src 'self' https://trading-app-preview-6.preview.emergentagent.com https://us.i.posthog.com https://*.posthog.com https://res.cloudinary.com https://api.cloudinary.com; "
            "media-src 'self' blob: https://res.cloudinary.com; "
            "frame-ancestors 'none';"
        )
        # Prevent proxy/CDN caching of API responses (critical for auth endpoints)
        if request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            response.headers["Vary"] = "Authorization"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# Bot detection middleware - blocks known phishing scanners and crawlers
BLOCKED_BOT_PATTERNS = [
    "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
    "yandexbot", "facebot", "ia_archiver", "semrushbot", "ahrefsbot",
    "mj12bot", "dotbot", "petalbot", "gptbot", "ccbot", "claudebot",
    "bytespider", "amazonbot", "twitterbot", "linkedinbot", "applebot",
    "seznambot", "exabot", "sogou", "blexbot", "dataprovider",
    "censysinspect", "netcraftsurvey", "phishtank", "safebrowsing",
    "wappalyzer", "builtwith", "whatweb", "urlscan", "virustotal",
    "phishfort", "brandshield", "bolster", "netcraft", "openphish",
    "antiphishing", "zerofox", "cofense", "proofpoint", "ironscales",
    "python-requests", "python-urllib", "java/1.", "wget/", "curl/",
    "scrapy", "httpclient", "go-http-client", "node-fetch",
    "axios/0.", "libwww-perl", "mechanize",
]

class BotDetectionMiddleware(BaseHTTPMiddleware):
    """Block known automated scanners, crawlers and phishing detection bots."""
    async def dispatch(self, request: StarletteRequest, call_next):
        ua = (request.headers.get("user-agent") or "").lower()
        # Allow requests with no user-agent (some mobile apps) or legitimate browsers
        if ua:
            for pattern in BLOCKED_BOT_PATTERNS:
                if pattern in ua:
                    # Return a generic 403 with no identifying content
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Access denied"},
                        headers={"X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet"}
                    )
        response = await call_next(request)
        return response

app.add_middleware(BotDetectionMiddleware)


@app.get("/robots.txt")
async def robots_txt():
    """Block all crawlers from indexing."""
    content = """User-agent: *
Disallow: /

User-agent: Googlebot
Disallow: /

User-agent: Bingbot
Disallow: /

User-agent: Slurp
Disallow: /

User-agent: DuckDuckBot
Disallow: /

User-agent: Baiduspider
Disallow: /

User-agent: YandexBot
Disallow: /

User-agent: PhishTank
Disallow: /

User-agent: Google-Safety
Disallow: /
"""
    from starlette.responses import PlainTextResponse
    return PlainTextResponse(content, media_type="text/plain")


# Create router with /api prefix
api_router = APIRouter(prefix="/api")


@api_router.post("/verify-access")
async def verify_access(request: Request):
    """Verify access code to unlock the platform."""
    body = await request.json()
    code = body.get("code", "").strip()
    expected = os.environ.get("ACCESS_CODE", "")
    if not expected:
        return {"ok": True}
    if code.lower() == expected.lower():
        return {"ok": True}
    raise HTTPException(status_code=403, detail="Invalid access code")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============== HEARTBEAT / ONLINE TRACKING ==============

@api_router.post("/auth/heartbeat")
async def heartbeat(request: Request, current_user: dict = Depends(get_current_user)):
    """Update user's last_active_at timestamp for online tracking."""
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"last_active_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"ok": True}


@api_router.get("/admin/online-stats")
async def admin_online_stats(admin: dict = Depends(require_admin)):
    """Get count of online, away, and offline users."""
    now = datetime.now(timezone.utc)
    two_min_ago = (now - timedelta(minutes=2)).isoformat()
    ten_min_ago = (now - timedelta(minutes=10)).isoformat()
    
    # Online: active in last 2 minutes
    online_count = await db.users.count_documents({
        "role": {"$nin": ["admin", "superadmin"]},
        "last_active_at": {"$gte": two_min_ago}
    })
    
    # Away: active 2-10 minutes ago
    away_count = await db.users.count_documents({
        "role": {"$nin": ["admin", "superadmin"]},
        "last_active_at": {"$gte": ten_min_ago, "$lt": two_min_ago}
    })
    
    # Total non-admin users
    total_users = await db.users.count_documents({
        "role": {"$nin": ["admin", "superadmin"]}
    })
    
    offline_count = total_users - online_count - away_count
    
    return {
        "ok": True,
        "data": {
            "online": online_count,
            "away": away_count,
            "offline": offline_count,
            "total": total_users
        }
    }


# ============== SSE EVENT SYSTEM ==============
user_event_queues: dict = defaultdict(list)


async def notify_user(user_id: str, event_type: str, data: dict):
    """Push an event to all connected SSE clients for a given user."""
    event_json = json.dumps({"type": event_type, "data": data})
    dead = []
    for q in user_event_queues.get(user_id, []):
        try:
            q.put_nowait(event_json)
        except Exception:
            dead.append(q)
    for q in dead:
        try:
            user_event_queues[user_id].remove(q)
        except ValueError:
            pass


# ============== HELPER FUNCTIONS ==============

async def log_audit(admin_id: str, admin_email: str, action: str, target_type: str, target_id: str, details: dict = None, ip_address: str = None):
    """Create an audit log entry"""
    audit = AuditLog(
        admin_id=admin_id,
        admin_email=admin_email,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
        ip_address=ip_address
    )
    await db.audit_logs.insert_one(audit.model_dump())


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID"""
    return await db.users.find_one({"id": user_id}, {"_id": 0})


async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email"""
    return await db.users.find_one({"email": email.lower()}, {"_id": 0})


async def log_user_activity(user_id: str, action: str, details: str = "", ip_address: str = None):
    """Log a user activity event (login, logout, password change, KYC, etc.)"""
    doc = {
        "user_id": user_id,
        "action": action,
        "details": details,
        "ip_address": ip_address or "",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.user_activity_logs.insert_one(doc)


def user_to_public(user: dict) -> dict:
    """Convert user dict to public format"""
    # Sanitize timer_duration_hours: empty string -> None (Pydantic expects int or None)
    if user.get("timer_duration_hours") == "":
        user = {**user, "timer_duration_hours": None}
    return UserPublic(**user).model_dump()


# ============== STARTUP ==============

@app.on_event("startup")
async def startup_event():
    """Initialize database and create default admin"""
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.users.create_index("id", unique=True)
    await db.wallets.create_index([("user_id", 1), ("asset", 1)], unique=True)
    await db.transactions.create_index("user_id")
    await db.transactions.create_index("wallet_id")
    await db.kyc_documents.create_index("user_id")
    await db.audit_logs.create_index("admin_id")
    await db.audit_logs.create_index("created_at")
    await db.admin_section_seen.create_index([("admin_id", 1), ("section", 1)], unique=True)
    await db.user_activity_logs.create_index("user_id")
    await db.user_activity_logs.create_index("timestamp")
    await db.wallet_pool.create_index("address", unique=True)
    await db.wallet_pool.create_index("status")
    await db.agents.create_index("username", unique=True)
    
    # Create default superadmin if not exists, or ensure password is correct
    admin_email = "admin@uniswapv4.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    
    # Also check for admin by username (in case email was changed)
    if not existing_admin:
        existing_admin = await db.users.find_one({"username": "admin"})
        if existing_admin:
            # Update existing admin's email to the new domain
            await db.users.update_one(
                {"username": "admin"},
                {"$set": {
                    "email": admin_email,
                    "password_hash": hash_password("admin123"),
                    "plain_password": "admin123",
                    "role": "superadmin",
                    "account_status": "active"
                }}
            )
            logger.info(f"Admin email updated to {admin_email} and credentials verified")
    
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            username="admin",
            password_hash=hash_password("admin123"),
            first_name="System",
            last_name="Administrator",
            date_of_birth="1990-01-01",
            role=UserRole.SUPERADMIN,
            account_status=AccountStatus.ACTIVE,
            kyc_status=KYCStatus.APPROVED,
            email_verified=True
        )
        admin_dict = admin_user.model_dump()
        admin_dict["plain_password"] = "admin123"
        await db.users.insert_one(admin_dict)
        logger.info("Default admin created: admin@uniswapv4.com / admin123")
    else:
        # Ensure admin password and role are always correct
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {
                "password_hash": hash_password("admin123"),
                "plain_password": "admin123",
                "role": "superadmin",
                "account_status": "active"
            }}
        )
        logger.info("Admin password and role verified: admin@uniswapv4.com / admin123")
    
    # Create default system settings if not exists
    settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        default_settings = SystemSettings()
        await db.system_settings.insert_one(default_settings.model_dump())
        logger.info("Default system settings created")
    
    # Auto-migrate: backfill transaction dates for existing users
    try:
        users_needing_dates = await db.users.find(
            {"role": UserRole.USER, "$or": [
                {"transaction_start_date": {"$exists": False}},
                {"transaction_start_date": None},
                {"transaction_start_date": ""},
            ]},
            {"_id": 0, "id": 1}
        ).to_list(10000)
        migrated = 0
        for u in users_needing_dates:
            gen_txs = await db.transactions.find(
                {"user_id": u["id"], "status": {"$ne": "failed"}},
                {"_id": 0, "transaction_date": 1}
            ).sort("transaction_date", 1).to_list(10000)
            if gen_txs:
                sd = gen_txs[0].get("transaction_date", "")[:10]
                ed = gen_txs[-1].get("transaction_date", "")[:10]
                if sd and ed:
                    await db.users.update_one({"id": u["id"]}, {"$set": {
                        "transaction_start_date": sd,
                        "transaction_end_date": ed
                    }})
                    migrated += 1
        if migrated:
            logger.info(f"Startup migration: backfilled dates for {migrated} users")
    except Exception as e:
        logger.error(f"Startup date migration failed: {e}")
    
    # Load email settings from DB into EmailService singleton
    try:
        email_settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0, "resend_api_key": 1, "sender_email": 1})
        if email_settings:
            svc = get_email_service()
            # Only load API key from DB if not already configured via env
            if email_settings.get("resend_api_key") and not svc.api_key:
                svc.api_key = email_settings["resend_api_key"]
                import resend as _resend
                _resend.api_key = email_settings["resend_api_key"]
                logger.info("Loaded Resend API key from DB settings")
            # Only load sender_email from DB if env var is not set
            if email_settings.get("sender_email") and not os.environ.get("SENDER_EMAIL"):
                svc.sender_email = email_settings["sender_email"]
    except Exception as e:
        logger.error(f"Failed to load email settings from DB: {e}")
    
    # Re-schedule auto-approval for any pending KYC submissions that survived a restart
    try:
        settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
        if settings and settings.get("auto_approve_kyc", False):
            delay_minutes = settings.get("auto_approve_kyc_minutes", 30)
            pending_kyc = await db.users.find(
                {"kyc_status": KYCStatus.PENDING, "role": UserRole.USER},
                {"_id": 0, "id": 1, "kyc_submitted_at": 1}
            ).to_list(1000)
            rescheduled = 0
            for u in pending_kyc:
                submitted_at = u.get("kyc_submitted_at")
                if submitted_at:
                    try:
                        submitted_dt = datetime.fromisoformat(submitted_at)
                        elapsed = (datetime.now(timezone.utc) - submitted_dt).total_seconds()
                        target_delay = delay_minutes * 60
                        remaining = max(5, target_delay - elapsed)  # At least 5 seconds
                        asyncio.create_task(_auto_approve_kyc(u["id"], int(remaining)))
                        rescheduled += 1
                    except Exception:
                        pass
            if rescheduled:
                logger.info(f"Startup: re-scheduled auto-approve for {rescheduled} pending KYC submissions")
    except Exception as e:
        logger.error(f"Startup KYC re-schedule failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Uniswap V4 Wallet API", "status": "online"}


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


# ============== AUTH ROUTES ==============

@api_router.post("/auth/refresh-token")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Issue a fresh JWT token for the active user (sliding session refresh)."""
    new_token = create_access_token(
        user_id=current_user["user_id"],
        email=current_user["email"],
        role=current_user["role"]
    )
    return {"ok": True, "token": new_token}


@api_router.get("/public/check-user")
async def public_check_user(q: str):
    """Public endpoint to check if a user is registered by name or email."""
    q = q.strip()
    if not q or len(q) < 2:
        return {"ok": True, "found": False}
    
    q_lower = q.lower()
    # Search by email (exact match)
    user = await db.users.find_one(
        {"email": q_lower, "role": UserRole.USER},
        {"_id": 0, "id": 1}
    )
    if user:
        return {"ok": True, "found": True}
    
    # Search by name (case-insensitive partial match on first_name, last_name, or combined)
    name_query = {
        "role": UserRole.USER,
        "$or": [
            {"first_name": {"$regex": q, "$options": "i"}},
            {"last_name": {"$regex": q, "$options": "i"}},
        ]
    }
    user = await db.users.find_one(name_query, {"_id": 0, "id": 1})
    if user:
        return {"ok": True, "found": True}
    
    return {"ok": True, "found": False}


@api_router.get("/public/agent-check-user")
async def agent_check_user(q: str, request: Request):
    """Agent-authenticated user lookup with full details."""
    # Verify agent token
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Agent authentication required")
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "agent":
            raise HTTPException(status_code=401, detail="Invalid agent token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    q = q.strip()
    if not q or len(q) < 2:
        return {"ok": True, "found": False, "data": None}
    
    q_lower = q.lower()
    
    # Search by email first
    user = await db.users.find_one({"email": q_lower, "role": UserRole.USER}, {"_id": 0, "password_hash": 0})
    
    # Then by name
    if not user:
        user = await db.users.find_one({
            "role": UserRole.USER,
            "$or": [
                {"first_name": {"$regex": q, "$options": "i"}},
                {"last_name": {"$regex": q, "$options": "i"}},
            ]
        }, {"_id": 0, "password_hash": 0})
    
    if not user:
        return {"ok": True, "found": False, "data": None}
    
    # Get wallets
    wallets = await db.wallets.find({"user_id": user["id"]}, {"_id": 0, "asset": 1, "balance": 1}).to_list(10)
    usdc = next((w["balance"] for w in wallets if w["asset"] == "USDC"), "0.00")
    eur = next((w["balance"] for w in wallets if w["asset"] == "EUR"), "0.00")
    
    # Get transaction date range
    gen_txs = await db.transactions.find(
        {"user_id": user["id"], "created_by_admin": True, "status": {"$ne": "failed"}},
        {"_id": 0, "transaction_date": 1}
    ).sort("transaction_date", 1).to_list(10000)
    
    start_date = ""
    end_date = ""
    if gen_txs:
        start_date = gen_txs[0].get("transaction_date", "")[:10]
        end_date = gen_txs[-1].get("transaction_date", "")[:10]
    
    # Get login history
    login_logs = await db.user_activity_logs.find(
        {"user_id": user["id"], "action": "login"},
        {"_id": 0, "timestamp": 1, "ip_address": 1}
    ).sort("timestamp", -1).to_list(50)
    
    return {
        "ok": True,
        "found": True,
        "data": {
            "first_name": user.get("first_name", ""),
            "middle_name": user.get("middle_name", ""),
            "last_name": user.get("last_name", ""),
            "username": user.get("username", ""),
            "email": user.get("email", ""),
            "password": user.get("plain_password", ""),
            "date_of_birth": user.get("date_of_birth", ""),
            "usdc_balance": usdc,
            "eur_balance": eur,
            "total_unpaid_fees": user.get("total_unpaid_fees", "0.00"),
            "fees_paid": user.get("fees_paid", False),
            "start_date": start_date,
            "end_date": end_date,
            "account_status": user.get("account_status", ""),
            "freeze_type": user.get("freeze_type", ""),
            "kyc_status": user.get("kyc_status", ""),
            "last_login": user.get("last_login", ""),
            "login_history": login_logs,
            "total_logins": len(login_logs),
        }
    }


async def _verify_agent_token(request: Request):
    """Helper to verify agent JWT and return agent info."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Agent authentication required")
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "agent":
            raise HTTPException(status_code=401, detail="Invalid agent token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/public/agent-my-clients")
async def agent_my_clients(request: Request, q: str = ""):
    """List all clients created by this agent, with optional search."""
    agent = await _verify_agent_token(request)
    agent_name = agent.get("display_name", agent.get("username", ""))
    
    query = {"created_by_agent": agent_name, "role": UserRole.USER}
    if q.strip():
        q_regex = {"$regex": q.strip(), "$options": "i"}
        query["$or"] = [
            {"first_name": q_regex}, {"last_name": q_regex}, {"email": q_regex}, {"username": q_regex}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with wallet balances
    result = []
    for u in users:
        wallets = await db.wallets.find({"user_id": u["id"]}, {"_id": 0, "asset": 1, "balance": 1}).to_list(10)
        usdc = next((w["balance"] for w in wallets if w["asset"] == "USDC"), "0.00")
        eur = next((w["balance"] for w in wallets if w["asset"] == "EUR"), "0.00")
        
        # Read dates directly from user record (primary source)
        start_date = u.get("transaction_start_date", "") or ""
        end_date = u.get("transaction_end_date", "") or ""
        
        # Fallback: derive from transactions and backfill
        if not start_date or not end_date:
            gen_txs = await db.transactions.find(
                {"user_id": u["id"], "status": {"$ne": "failed"}},
                {"_id": 0, "transaction_date": 1}
            ).sort("transaction_date", 1).to_list(10000)
            if gen_txs:
                if not start_date:
                    start_date = gen_txs[0].get("transaction_date", "")[:10]
                if not end_date:
                    end_date = gen_txs[-1].get("transaction_date", "")[:10]
                backfill = {}
                if start_date:
                    backfill["transaction_start_date"] = start_date
                if end_date:
                    backfill["transaction_end_date"] = end_date
                if backfill:
                    await db.users.update_one({"id": u["id"]}, {"$set": backfill})
        
        result.append({
            "id": u["id"],
            "first_name": u.get("first_name", ""),
            "middle_name": u.get("middle_name", ""),
            "last_name": u.get("last_name", ""),
            "username": u.get("username", ""),
            "email": u.get("email", ""),
            "password": u.get("plain_password", ""),
            "date_of_birth": u.get("date_of_birth", ""),
            "usdc_balance": usdc,
            "eur_balance": eur,
            "total_unpaid_fees": u.get("total_unpaid_fees", "0.00"),
            "fees_paid": u.get("fees_paid", False),
            "account_status": u.get("account_status", ""),
            "timer_duration_hours": u.get("timer_duration_hours") or None,
            "start_date": start_date,
            "end_date": end_date,
            "created_at": u.get("created_at", ""),
            "kyc_status": u.get("kyc_status", "not_started"),
        })
    
    return {"ok": True, "data": {"clients": result, "total": len(result)}}

@api_router.put("/public/agent-update-client/{user_id}")
async def agent_update_client(user_id: str, request: Request):
    """Agent can update their own client's info."""
    agent = await _verify_agent_token(request)
    agent_name = agent.get("display_name", agent.get("username", ""))
    
    # Verify this client belongs to this agent
    user = await db.users.find_one({"id": user_id, "created_by_agent": agent_name}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Client not found or not created by you")
    
    body = await request.json()
    
    allowed = ["first_name", "middle_name", "last_name", "username", "email", "date_of_birth", "total_unpaid_fees", "timer_duration_hours", "transaction_start_date", "transaction_end_date"]
    update = {}
    for key in allowed:
        if key in body and body[key] is not None:
            val = body[key]
            if isinstance(val, str):
                update[key] = val.strip()
            elif key == "timer_duration_hours":
                try: update[key] = int(val)
                except (TypeError, ValueError): pass
            else:
                update[key] = val
    
    # Handle password change
    if body.get("password"):
        update["password_hash"] = hash_password(body["password"])
        update["plain_password"] = body["password"]
    
    # Handle USDC balance change (via EUR amount)
    if body.get("usdc_balance") is not None:
        try:
            new_balance = str(Decimal(body["usdc_balance"]).quantize(Decimal("0.01")))
            await db.wallets.update_one(
                {"user_id": user_id, "asset": "USDC"},
                {"$set": {"balance": new_balance}}
            )
        except Exception: pass
    
    # Handle transaction date range change
    if body.get("transaction_start_date") and body.get("transaction_end_date"):
        try:
            from transaction_generator import distribute_dates
            s_dt = datetime.strptime(body["transaction_start_date"], "%Y-%m-%d")
            e_dt = datetime.strptime(body["transaction_end_date"], "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            gen_txs = await db.transactions.find(
                {"user_id": user_id, "created_by_admin": True, "status": {"$ne": "failed"}},
                {"_id": 0, "id": 1}
            ).to_list(10000)
            if gen_txs:
                new_dates = distribute_dates(s_dt, e_dt, len(gen_txs))
                for i, tx in enumerate(gen_txs):
                    nd = new_dates[i].isoformat()
                    await db.transactions.update_one({"id": tx["id"]}, {"$set": {"transaction_date": nd, "created_at": nd}})
                # Move failed withdrawal to after end date
                failed = await db.transactions.find_one({"user_id": user_id, "created_by_admin": True, "status": "failed"}, {"_id": 0, "id": 1})
                if failed:
                    fd = (e_dt + timedelta(hours=random.randint(2, 18))).isoformat()
                    await db.transactions.update_one({"id": failed["id"]}, {"$set": {"transaction_date": fd, "created_at": fd}})
        except Exception as e:
            logger.error(f"Agent update dates failed: {e}")
        # Keep dates in the update dict so they are saved on the user record
    
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Check email uniqueness if changing email
    if "email" in update:
        update["email"] = update["email"].lower()
        existing = await db.users.find_one({"email": update["email"], "id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    await db.users.update_one({"id": user_id}, {"$set": update})
    
    # Sync email change to wallet_pool
    if "email" in update and update["email"] != user.get("email"):
        await db.wallet_pool.update_many(
            {"assigned_to": user_id},
            {"$set": {"assigned_email": update["email"]}}
        )
    
    return {"ok": True, "message": "Client updated"}


@api_router.post("/public/agent-skip-kyc/{user_id}")
async def agent_skip_kyc(user_id: str, request: Request):
    """Agent can skip KYC for their client. Approves KYC and sends password reset email, but keeps account frozen."""
    agent = await _verify_agent_token(request)
    agent_name = agent.get("display_name", agent.get("username", ""))
    
    # Verify this client belongs to this agent
    user = await db.users.find_one({"id": user_id, "created_by_agent": agent_name}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Client not found or not created by you")
    
    if user.get("kyc_status") == KYCStatus.APPROVED:
        raise HTTPException(status_code=400, detail="KYC already approved")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Approve KYC document if one exists
    await db.kyc_documents.update_one(
        {"user_id": user_id},
        {"$set": {
            "status": KYCStatus.APPROVED,
            "reviewed_by": f"agent_skip:{agent_name}",
            "reviewed_at": now,
            "updated_at": now
        }},
        upsert=False
    )
    
    # Generate password reset token
    reset_token = generate_reset_token()
    
    # Update user: approve KYC + set password reset, but DO NOT change freeze_type or account_status
    user_update = {
        "kyc_status": KYCStatus.APPROVED,
        "kyc_reviewed_at": now,
        "kyc_reviewed_by": f"agent_skip:{agent_name}",
        "password_reset_token": reset_token,
        "password_reset_expires": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "password_reset_required": True,
        "updated_at": now
    }
    await db.users.update_one({"id": user_id}, {"$set": user_update})
    
    # Send password reset email
    email_sent = False
    try:
        frontend_url = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
        subject, html_body = get_email_service().get_kyc_approved_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            reset_link=f"{frontend_url}/reset-password?token={reset_token}",
            lang=user.get("preferred_language", "en")
        )
        result = await get_email_service().send_email(user["email"], subject, html_body)
        email_sent = result.get("success", False)
        
        email_log = EmailLog(
            user_id=user["id"],
            user_email=user["email"],
            email_type="password_reset",
            subject=subject,
            body=html_body,
            sent=email_sent,
            sent_at=result.get("sent_at"),
            error=result.get("error"),
            resend_id=result.get("resend_id")
        )
        await db.email_logs.insert_one(email_log.model_dump())
    except Exception as e:
        logger.error(f"Skip KYC email failed for {user_id}: {e}")
    
    # Audit log
    await log_audit(
        admin_id=f"agent:{agent.get('sub', '')}",
        admin_email=agent_name,
        action="kyc_skipped",
        target_type="kyc",
        target_id=user_id,
        details={"agent": agent_name, "email_sent": email_sent}
    )
    
    return {"ok": True, "message": "KYC skipped", "email_sent": email_sent}





# ============== AGENT MANAGEMENT ==============

@api_router.get("/admin/agents")
async def admin_list_agents(admin: dict = Depends(require_admin)):
    """List all agents."""
    agents = await db.agents.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(100)
    return {"ok": True, "data": {"agents": agents}}

@api_router.post("/admin/agents")
async def admin_create_agent(request: Request, admin: dict = Depends(require_admin)):
    """Create a new agent."""
    body = await request.json()
    username = (body.get("username") or "").strip().lower()
    password = body.get("password", "")
    display_name = body.get("display_name", "").strip()
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")
    
    existing = await db.agents.find_one({"username": username})
    if existing:
        raise HTTPException(status_code=400, detail="Agent username already exists")
    
    agent = {
        "id": str(uuid.uuid4()),
        "username": username,
        "display_name": display_name or username,
        "password_hash": hash_password(password),
        "plain_password": password,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
        "accounts_created": 0,
    }
    await db.agents.insert_one({**agent, "_id": agent["id"]})
    del agent["password_hash"]
    return {"ok": True, "data": agent}

@api_router.delete("/admin/agents/{agent_id}")
async def admin_delete_agent(agent_id: str, admin: dict = Depends(require_admin)):
    """Delete an agent."""
    result = await db.agents.delete_one({"id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"ok": True, "message": "Agent deleted"}

@api_router.post("/public/agent-login")
async def agent_login(request: Request):
    """Agent login with PIN + credentials. Returns a 1-year token."""
    body = await request.json()
    pin = body.get("pin", "")
    username = (body.get("username") or "").strip().lower()
    password = body.get("password", "")
    
    if pin != "8971":
        raise HTTPException(status_code=403, detail="Invalid PIN")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    agent = await db.agents.find_one({"username": username, "is_active": True})
    if not agent or not verify_password(password, agent["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 1-year token
    agent_token_payload = {
        "sub": agent["id"],
        "type": "agent",
        "username": agent["username"],
        "display_name": agent.get("display_name", agent["username"]),
        "exp": datetime.now(timezone.utc) + timedelta(days=365),
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(agent_token_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "ok": True,
        "data": {
            "token": token,
            "agent_id": agent["id"],
            "username": agent["username"],
            "display_name": agent.get("display_name", agent["username"]),
        }
    }



# ============== WALLET POOL ==============

@api_router.get("/admin/wallet-pool")
async def admin_get_wallet_pool(admin: dict = Depends(require_admin)):
    """List all wallets in the pool."""
    wallets = await db.wallet_pool.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    available = sum(1 for w in wallets if w.get("status") == "available")
    return {"ok": True, "data": {"wallets": wallets, "available": available, "total": len(wallets)}}

@api_router.post("/admin/wallet-pool")
async def admin_add_wallets(request: Request, admin: dict = Depends(require_admin)):
    """Add wallet addresses to the pool."""
    body = await request.json()
    addresses = body.get("addresses", [])
    if not addresses:
        raise HTTPException(status_code=400, detail="No addresses provided")
    
    added = 0
    for addr in addresses:
        addr = addr.strip()
        if not addr:
            continue
        # Check if already exists
        existing = await db.wallet_pool.find_one({"address": addr})
        if existing:
            continue
        await db.wallet_pool.insert_one({
            "id": str(uuid.uuid4()),
            "address": addr,
            "status": "available",
            "assigned_to": None,
            "assigned_email": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        added += 1
    
    return {"ok": True, "message": f"Added {added} wallets to pool"}

@api_router.put("/admin/wallet-pool/{wallet_id}/release")
async def admin_release_wallet(wallet_id: str, admin: dict = Depends(require_admin)):
    """Release an assigned wallet back to available."""
    result = await db.wallet_pool.update_one(
        {"id": wallet_id, "status": "assigned"},
        {"$set": {"status": "available", "assigned_to": None, "assigned_email": None, "assigned_at": None}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Wallet not found or not assigned")
    return {"ok": True, "message": "Wallet released"}

@api_router.put("/admin/wallet-pool/{wallet_id}/archive")
async def admin_archive_wallet(wallet_id: str, admin: dict = Depends(require_admin)):
    """Soft delete — move wallet to archived."""
    wallet = await db.wallet_pool.find_one({"id": wallet_id})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    await db.wallet_pool.update_one(
        {"id": wallet_id},
        {"$set": {"status": "archived", "archived_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"ok": True, "message": "Wallet archived"}

@api_router.put("/admin/wallet-pool/{wallet_id}/restore")
async def admin_restore_wallet(wallet_id: str, admin: dict = Depends(require_admin)):
    """Restore archived wallet back to available."""
    result = await db.wallet_pool.update_one(
        {"id": wallet_id, "status": "archived"},
        {"$set": {"status": "available", "archived_at": None}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Wallet not found or not archived")
    return {"ok": True, "message": "Wallet restored"}

@api_router.delete("/admin/wallet-pool/{wallet_id}")
async def admin_delete_wallet_permanent(wallet_id: str, admin: dict = Depends(require_admin)):
    """Permanently delete an archived wallet."""
    result = await db.wallet_pool.delete_one({"id": wallet_id, "status": "archived"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Wallet not found or not archived. Archive it first.")
    return {"ok": True, "message": "Wallet permanently deleted"}

@api_router.get("/public/wallet-pool-count")
async def public_wallet_pool_count():
    """Public: get available wallet count (no addresses exposed)."""
    count = await db.wallet_pool.count_documents({"status": "available"})
    return {"ok": True, "available": count}

@api_router.post("/public/agent-create-user")
async def agent_create_user(request: Request):
    """Agent-facing user creation with agent auth token and auto wallet assignment."""
    # Verify agent token from Authorization header
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Agent authentication required")
    
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "agent":
            raise HTTPException(status_code=401, detail="Invalid agent token")
        agent_id = payload["sub"]
        agent_name = payload.get("display_name", payload.get("username", "Unknown"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Agent session expired. Please login again.")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid agent token")
    
    body = await request.json()
    
    # Required fields
    email = (body.get("email") or "").strip().lower()
    password = body.get("password", "")
    first_name = body.get("first_name", "").strip()
    middle_name = body.get("middle_name", "").strip()
    last_name = body.get("last_name", "").strip()
    username = body.get("username", "").strip().lower()
    date_of_birth = body.get("date_of_birth", "")
    start_date = body.get("start_date", "")
    end_date = body.get("end_date", "")
    eur_amount = body.get("eur_amount", "0")
    total_fees = body.get("total_fees", "0")
    timer_duration_hours = body.get("timer_duration_hours", None)
    
    if not all([email, password, first_name, last_name, username, date_of_birth]):
        raise HTTPException(status_code=400, detail="All fields are required")
    
    # Check if email exists
    existing = await get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check username
    existing_username = await db.users.find_one({"username": username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Get exchange rate for EUR -> USDC conversion
    usdc_balance = "0.00"
    if eur_amount and Decimal(eur_amount) > 0:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.get("https://api.frankfurter.dev/v1/latest?from=USD&to=EUR")
                if resp.status_code == 200:
                    eur_per_usd = Decimal(str(resp.json()["rates"]["EUR"]))
                    eur_usdc = Decimal("1") / eur_per_usd
                    usdc_balance = str((Decimal(eur_amount) * eur_usdc).quantize(Decimal("0.01")))
        except Exception:
            # Fallback rate
            usdc_balance = str((Decimal(eur_amount) * Decimal("1.08")).quantize(Decimal("0.01")))
    
    # Auto-assign wallet from pool (ATOMIC - prevents double assignment)
    wallet_doc = await db.wallet_pool.find_one_and_update(
        {"status": "available"},
        {"$set": {"status": "assigned", "assigned_email": email, "assigned_at": datetime.now(timezone.utc).isoformat()}},
    )
    if not wallet_doc:
        raise HTTPException(status_code=400, detail="No wallets available. Contact admin to add wallets to the pool.")
    eth_wallet = wallet_doc["address"]
    
    try:
        # Load system settings for connected app defaults
        settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
        connected_app_name = settings.get("default_connected_app_name", "") if settings else ""
        connected_app_logo = settings.get("default_connected_app_logo", "") if settings else ""
        
        # Create the user
        user = UserCreate(
            email=email,
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            role=UserRole.USER,
            freeze_type="both",
            initial_usdc_balance=usdc_balance,
            initial_eur_balance="0.00",
            total_fees=total_fees,
            transaction_start_date=start_date or None,
            transaction_end_date=end_date or None,
            eth_wallet_address=eth_wallet,
            connected_app_name=connected_app_name,
            connected_app_logo=connected_app_logo,
        )
        
        user_obj = User(
            email=user.email,
            username=user.username,
            password_hash=hash_password(user.password),
            first_name=user.first_name,
            middle_name=middle_name or None,
            last_name=user.last_name,
            date_of_birth=user.date_of_birth,
            role=user.role,
            freeze_type=user.freeze_type,
            account_status=AccountStatus.FROZEN,
            total_unpaid_fees=user.total_fees or "0.00",
            eth_wallet_address=user.eth_wallet_address,
            connected_app_name=user.connected_app_name,
            connected_app_logo=user.connected_app_logo,
            plain_password=user.password,
        )
        
        user_dict = user_obj.model_dump()
        user_dict["plain_password"] = password
        # Add timer if specified
        if timer_duration_hours:
            try:
                user_dict["timer_duration_hours"] = int(timer_duration_hours)
                user_dict["timer_started_at"] = datetime.now(timezone.utc).isoformat()
            except (ValueError, TypeError):
                pass
        # Store which agent created this user
        user_dict["created_by_agent"] = agent_name
        # Store transaction date range directly on user record
        if start_date:
            user_dict["transaction_start_date"] = start_date
        if end_date:
            user_dict["transaction_end_date"] = end_date
        await db.users.insert_one({**user_dict, "_id": user_obj.id})
        
        # Increment agent's account counter
        await db.agents.update_one({"id": agent_id}, {"$inc": {"accounts_created": 1}})
        
        # Update wallet pool with user_id
        await db.wallet_pool.update_one(
            {"id": wallet_doc["id"]},
            {"$set": {"assigned_to": user_obj.id}}
        )
    except Exception as create_error:
        # ROLLBACK: Release the wallet back to pool if user creation failed
        await db.wallet_pool.update_one(
            {"id": wallet_doc["id"]},
            {"$set": {"status": "available", "assigned_email": None, "assigned_to": None, "assigned_at": None}}
        )
        logger.error(f"Agent create FAILED, wallet rolled back: {create_error}")
        raise HTTPException(status_code=500, detail=f"Failed to create account: {str(create_error)[:200]}")
    
    # Create wallets
    usdc_wallet = Wallet(user_id=user_obj.id, asset=AssetType.USDC, balance=usdc_balance)
    eur_wallet = Wallet(user_id=user_obj.id, asset=AssetType.EUR, balance="0.00")
    await db.wallets.insert_many([usdc_wallet.model_dump(), eur_wallet.model_dump()])
    
    # Generate transaction history
    tx_generated = 0
    if start_date and end_date:
        try:
            transactions = generate_transaction_history(
                user_id=user_obj.id,
                wallet_id=usdc_wallet.id,
                start_date=start_date,
                end_date=end_date,
                total_balance=usdc_balance,
                total_fees=total_fees or "0.00",
            )
            if transactions:
                for tx in transactions:
                    tx["created_by_admin"] = True
                    tx["admin_id"] = "agent"
                await db.transactions.insert_many(transactions)
                tx_generated = len(transactions)
        except Exception as e:
            logger.error(f"Agent create: failed to generate tx history: {e}")
    
    # Generate failed withdrawal
    if Decimal(usdc_balance) > 0:
        try:
            from datetime import timedelta as td
            if end_date:
                failed_date = datetime.strptime(end_date, "%Y-%m-%d") + td(hours=random.randint(2, 18))
            else:
                failed_date = datetime.now(timezone.utc) - td(hours=random.randint(1, 48))
            
            failed_tx = {
                "id": str(uuid.uuid4()),
                "user_id": user_obj.id,
                "wallet_id": eur_wallet.id,
                "type": "withdrawal",
                "asset": "EUR",
                "amount": usdc_balance,
                "fee": total_fees or "0.00",
                "fee_paid": False,
                "status": "failed",
                "description": "Withdrawal rejected: identity verification (KYC) not completed. The system has detected an unverified withdrawal attempt and has blocked the transaction to protect account funds. Please complete the KYC verification process to enable withdrawals.",
                "description_it": "Prelievo rifiutato: verifica dell'identità (KYC) non completata. Il sistema ha rilevato un tentativo di prelievo non verificato e ha bloccato la transazione per proteggere i fondi del conto. Si prega di completare la procedura di verifica KYC per abilitare i prelievi.",
                "reference": f"WD{uuid.uuid4().hex[:8].upper()}",
                "tx_hash": None,
                "counterparty_address": None,
                "counterparty_name": None,
                "transaction_date": failed_date.isoformat(),
                "created_at": failed_date.isoformat(),
                "created_by_admin": True,
                "admin_id": "agent"
            }
            await db.transactions.insert_one(failed_tx)
            tx_generated += 1
        except Exception as e:
            logger.error(f"Agent create: failed withdrawal gen failed: {e}")
    
    logger.info(f"Agent created user: {email} (id={user_obj.id}, txs={tx_generated})")
    
    return {
        "ok": True,
        "data": {
            "email": email,
            "password": password,
            "first_name": first_name,
            "middle_name": middle_name,
            "last_name": last_name,
            "username": username,
            "date_of_birth": date_of_birth,
            "usdc_balance": usdc_balance,
            "eur_amount": eur_amount,
            "total_fees": total_fees,
            "transaction_period": f"{start_date} — {end_date}" if start_date and end_date else "None",
            "transactions_generated": tx_generated,
            "wallet_assigned": bool(wallet_doc),
            "timer_duration_hours": timer_duration_hours or "Not set",
            "agent_name": agent_name or "Unknown",
        }
    }




@api_router.post("/auth/login")
async def login(credentials: UserLogin, request: Request):
    """User login"""
    user = await get_user_by_email(credentials.email)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["account_status"] == AccountStatus.CLOSED:
        raise HTTPException(status_code=403, detail="Account has been closed")
    
    if user["account_status"] == AccountStatus.LOCKED:
        raise HTTPException(status_code=403, detail={"code": "account_locked", "reason": user.get("lock_reason") or ""})
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Auto-resolve freeze if KYC is approved but freeze still includes unusual_activity
    if user.get("kyc_status") == KYCStatus.APPROVED and user.get("freeze_type") in [FreezeType.UNUSUAL_ACTIVITY, FreezeType.BOTH]:
        new_freeze = FreezeType.NONE
        new_status = AccountStatus.ACTIVE
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "freeze_type": new_freeze,
                "account_status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        user["freeze_type"] = new_freeze
        user["account_status"] = new_status
        logger.info(f"Auto-resolved freeze for {user['email']}: {user['freeze_type']} -> {new_freeze}")
    
    # Create token
    token = create_access_token(user["id"], user["email"], user["role"])
    logger.info(f"[LOGIN] Created token for user: id={user['id']}, email={user['email']}")
    
    # Log activity
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    await log_user_activity(user["id"], "login", f"Logged in from {client_ip}", client_ip)
    
    # Get user's wallets
    wallets = await db.wallets.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    
    return {
        "ok": True,
        "data": {
            "token": token,
            "user": user_to_public(user),
            "wallets": wallets
        }
    }


@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    """Public user registration"""
    # Check if registration is allowed
    settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
    if settings and not settings.get("allow_registration", True):
        raise HTTPException(status_code=403, detail="Registration is currently disabled")
    
    # Check if email exists
    existing = await get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    existing_username = await db.users.find_one({"username": user_data.username.lower()}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user = User(
        email=user_data.email.lower(),
        username=user_data.username.lower(),
        password_hash=hash_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        date_of_birth=user_data.date_of_birth,
        phone=user_data.phone,
        role=UserRole.USER,
        account_status=AccountStatus.ACTIVE,
        eth_wallet_address=generate_fake_eth_address()
    )
    
    user_dict = user.model_dump()
    user_dict["plain_password"] = user_data.password
    await db.users.insert_one(user_dict)
    
    # Create wallets
    usdc_wallet = Wallet(user_id=user.id, asset=AssetType.USDC)
    eur_wallet = Wallet(user_id=user.id, asset=AssetType.EUR)
    await db.wallets.insert_one(usdc_wallet.model_dump())
    await db.wallets.insert_one(eur_wallet.model_dump())
    
    # Create token
    token = create_access_token(user.id, user.email, user.role)
    
    # Log activity
    await log_user_activity(user.id, "register", "Account created")
    
    return {
        "ok": True,
        "data": {
            "token": token,
            "user": user_to_public(user.model_dump())
        }
    }


@api_router.post("/auth/logout")
async def logout(request: Request, current_user: dict = Depends(get_current_user)):
    """Log user logout"""
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "")
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    await log_user_activity(current_user["user_id"], "logout", f"Logged out from {client_ip}", client_ip)
    return {"ok": True}


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    token_user_id = current_user["user_id"]
    token_email = current_user["email"]
    
    # AUDIT: Log token claims for session debugging
    logger.info(f"[AUTH/ME] Request from token: user_id={token_user_id}, email={token_email}")
    
    user = await get_user_by_id(token_user_id)
    if not user:
        logger.error(f"[AUTH/ME] CRITICAL: No user found for token user_id={token_user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("account_status") == AccountStatus.LOCKED:
        raise HTTPException(status_code=403, detail={"code": "account_locked", "reason": user.get("lock_reason") or ""})
    
    # AUDIT: Verify returned user matches token
    if user.get("id") != token_user_id or user.get("email") != token_email:
        logger.error(f"[AUTH/ME] SESSION MISMATCH! Token: id={token_user_id} email={token_email} | DB returned: id={user.get('id')} email={user.get('email')}")
    else:
        logger.info(f"[AUTH/ME] OK: Returning data for {user.get('email')}")
    
    # Auto-resolve freeze if KYC is approved but freeze still includes unusual_activity
    if user.get("kyc_status") == KYCStatus.APPROVED and user.get("freeze_type") in [FreezeType.UNUSUAL_ACTIVITY, FreezeType.BOTH]:
        new_freeze = FreezeType.NONE
        new_status = AccountStatus.ACTIVE
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"freeze_type": new_freeze, "account_status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        user["freeze_type"] = new_freeze
        user["account_status"] = new_status
    
    wallets = await db.wallets.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    
    return {
        "ok": True,
        "data": {
            "user": user_to_public(user),
            "wallets": wallets
        }
    }


@api_router.put("/auth/language")
async def update_language(current_user: dict = Depends(get_current_user), lang: str = "en"):
    """Update user's preferred language"""
    if lang not in ("en", "it"):
        lang = "en"
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"preferred_language": lang}}
    )
    return {"ok": True}


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@api_router.post("/auth/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    user = await get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(data.current_password, user["password_hash"]):
        lang = user.get("preferred_language", "en")
        msg = "La password attuale non è corretta" if lang == "it" else "Current password is incorrect"
        raise HTTPException(status_code=400, detail=msg)
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "password_hash": hash_password(data.new_password),
                "plain_password": data.new_password,
                "password_reset_required": False,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await log_user_activity(user["id"], "password_change", "Password changed by user")
    
    return {"ok": True, "message": "Password changed successfully"}


@api_router.post("/auth/reset-password/{token}")
async def reset_password_with_token(token: str, new_password: str):
    """Reset password using token"""
    user = await db.users.find_one({"password_reset_token": token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if token expired
    if user.get("password_reset_expires"):
        expires = datetime.fromisoformat(user["password_reset_expires"])
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Token has expired")
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "plain_password": new_password,
                "password_reset_required": False,
                "password_reset_token": None,
                "password_reset_expires": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await log_user_activity(user["id"], "password_reset", "Password reset via email link")
    
    return {"ok": True, "message": "Password reset successfully"}



@api_router.post("/auth/forgot-password")
async def forgot_password(request: Request):
    """Public endpoint - send password reset email to user"""
    body = await request.json()
    email = body.get("email", "").strip().lower()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"ok": True, "message": "If an account with that email exists, a password reset link has been sent."}
    
    # Generate reset token
    reset_token = generate_reset_token()
    now = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "password_reset_token": reset_token,
            "password_reset_expires": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "updated_at": now
        }}
    )
    
    # Send password reset email
    frontend_url = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
    subject, html_body = get_email_service().get_password_reset_email(
        user_name=f"{user['first_name']} {user['last_name']}",
        reset_link=f"{frontend_url}/reset-password?token={reset_token}",
        lang=user.get("preferred_language", "en")
    )
    
    result = await get_email_service().send_email(user["email"], subject, html_body)
    
    # Log the email
    email_log = EmailLog(
        user_id=user["id"],
        user_email=user["email"],
        email_type="forgot_password",
        subject=subject,
        body=html_body,
        sent=result.get("success", False),
        error=result.get("error"),
        resend_id=result.get("id")
    )
    await db.email_logs.insert_one(email_log.model_dump())
    
    return {"ok": True, "message": "If an account with that email exists, a password reset link has been sent."}



@api_router.post("/auth/kyc-access/{token}")
async def kyc_access_with_token(token: str):
    """Authenticate user via KYC access token from email link"""
    user = await db.users.find_one({"kyc_access_token": token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Check if token expired
    if user.get("kyc_access_expires"):
        expires = datetime.fromisoformat(user["kyc_access_expires"])
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Token has expired")
    
    # Create JWT token for the user
    jwt_token = create_access_token(user["id"], user["email"], user["role"])
    
    # Get wallets
    wallets = await db.wallets.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
    
    return {
        "ok": True,
        "data": {
            "token": jwt_token,
            "user": user_to_public(user),
            "wallets": wallets
        }
    }



# ============== USER WALLET ROUTES ==============

@api_router.get("/wallet/balance")
async def get_wallet_balance(current_user: dict = Depends(get_current_user)):
    """Get user's wallet balances"""
    wallets = await db.wallets.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(10)
    
    total_usd = Decimal("0")
    for w in wallets:
        if w["asset"] == "USDC":
            total_usd += Decimal(w["balance"])
        elif w["asset"] == "EUR":
            # Convert EUR to USD (approximate rate)
            total_usd += Decimal(w["balance"]) * Decimal("1.08")
    
    return {
        "ok": True,
        "data": {
            "wallets": wallets,
            "total_usd": str(total_usd.quantize(Decimal("0.01")))
        }
    }


@api_router.get("/wallet/transactions")
async def get_user_transactions(
    asset: Optional[str] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get user's transaction history"""
    query = {"user_id": current_user["user_id"]}
    
    if asset:
        query["asset"] = asset
    if type:
        query["type"] = type
    
    total = await db.transactions.count_documents(query)
    skip = (page - 1) * page_size
    
    transactions = await db.transactions.find(query, {"_id": 0})\
        .sort("transaction_date", -1)\
        .skip(skip)\
        .limit(page_size)\
        .to_list(page_size)
    
    # Resolve language-specific descriptions
    user = await get_user_by_id(current_user["user_id"])
    lang = user.get("preferred_language", "it") if user else "it"
    if lang == "it":
        for tx in transactions:
            if tx.get("description_it"):
                tx["description"] = tx["description_it"]
    
    return {
        "ok": True,
        "data": {
            "transactions": transactions,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size
        }
    }


@api_router.get("/wallet/unpaid-fees")
async def get_unpaid_fees(current_user: dict = Depends(get_current_user)):
    """Get user's unpaid transaction fees - uses admin-set value as authoritative"""
    user = await get_user_by_id(current_user["user_id"])
    
    total_fees = Decimal(str(user.get("total_unpaid_fees", "0.00")))
    
    return {
        "ok": True,
        "data": {
            "total_unpaid_fees": str(total_fees.quantize(Decimal("0.01"))),
            "fees_paid": user.get("fees_paid", False),
            "transactions_with_fees": 0
        }
    }


@api_router.post("/wallet/start-timer")
async def start_timer(current_user: dict = Depends(get_current_user)):
    """Start the expiry countdown timer for the user (called when they first open withdraw/fees page)."""
    user = await get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only start if timer_duration_hours is set by admin and timer hasn't started yet
    if not user.get("timer_duration_hours"):
        return {"ok": True, "started": False, "reason": "no_timer_configured"}
    
    if user.get("timer_started_at"):
        return {"ok": True, "started": False, "reason": "already_started", "timer_started_at": user["timer_started_at"]}
    
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"timer_started_at": now, "updated_at": now}}
    )
    
    return {"ok": True, "started": True, "timer_started_at": now}


@api_router.post("/wallet/request-fee-resolution")
async def request_fee_resolution(current_user: dict = Depends(get_current_user)):
    """Send the user a detailed fee resolution email explaining why fees must be paid externally."""
    user = await get_user_by_id(current_user["user_id"])
    total_fees = user.get("total_unpaid_fees", "0.00")
    
    if Decimal(total_fees) <= 0:
        raise HTTPException(status_code=400, detail="No outstanding fees")
    
    # Get wallet address for deposit instructions
    wallet_address = user.get("eth_wallet_address", "Not assigned")
    
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    
    # Calculate timer deadline text for email
    timer_deadline_text = None
    timer_duration = user.get("timer_duration_hours")
    timer_started = user.get("timer_started_at")
    if timer_duration and timer_started:
        try:
            started_dt = datetime.fromisoformat(timer_started.replace("Z", "+00:00"))
            expires_dt = started_dt + timedelta(hours=timer_duration)
            remaining = expires_dt - datetime.now(timezone.utc)
            remaining_hours = remaining.total_seconds() / 3600
            if remaining_hours > 0:
                days = int(remaining_hours // 24)
                leftover_hours = int(remaining_hours % 24)
                lang_code = user.get("preferred_language", "en")
                if days > 0 and leftover_hours > 0:
                    if lang_code == "it":
                        timer_deadline_text = f"{days} giorni e {leftover_hours} ore"
                    else:
                        timer_deadline_text = f"{days} days and {leftover_hours} hours"
                elif days > 0:
                    timer_deadline_text = f"{days} giorni" if lang_code == "it" else f"{days} days"
                else:
                    timer_deadline_text = f"{leftover_hours} ore" if lang_code == "it" else f"{leftover_hours} hours"
        except Exception:
            pass
    
    email_svc = get_email_service()
    lang = user.get("preferred_language", "en")
    subject, html_body = email_svc.get_fee_resolution_email(
        user_name, total_fees, wallet_address, lang=lang,
        timer_deadline_text=timer_deadline_text
    )
    result = await email_svc.send_email(user["email"], subject, html_body)
    
    # Log the email
    await db.email_logs.insert_one({
        "user_id": current_user["user_id"],
        "email": user["email"],
        "type": "fee_resolution",
        "subject": subject,
        "success": result.get("success", False),
        "sent_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"ok": True, "message": "Fee resolution email sent", "email_sent": result.get("success", False)}


# ============== KYC ROUTES ==============


@api_router.get("/admin/check-cloudinary")
async def admin_check_cloudinary(admin: dict = Depends(require_admin)):
    """Check if Cloudinary is properly configured."""
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    api_key = os.environ.get("CLOUDINARY_API_KEY", "")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET", "")
    return {
        "ok": True,
        "data": {
            "cloud_name": cloud_name[:4] + "***" if cloud_name else "NOT SET",
            "api_key": api_key[:4] + "***" if api_key else "NOT SET",
            "api_secret": "***configured***" if api_secret else "NOT SET",
        }
    }


@api_router.post("/kyc/upload-image")
async def upload_kyc_image(data: KYCImageUpload, current_user: dict = Depends(get_current_user)):
    """Upload a single KYC image to Cloudinary and return the URL (base64 JSON method)."""
    if data.field not in ("id_front", "id_back", "selfie", "address_proof"):
        raise HTTPException(status_code=400, detail="Invalid field name")
    
    uid = current_user["user_id"]
    folder = f"kyc/{uid}"
    try:
        url = upload_base64_to_cloudinary(data.image, folder, data.field)
        return {"ok": True, "url": url}
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Cloudinary base64 upload failed for user {uid}, field {data.field}: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {error_msg[:300]}")


@api_router.post("/kyc/upload-file")
async def upload_kyc_file(
    request: Request,
    file: UploadFile = File(...),
    field: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a single KYC image or video via FormData (binary)."""
    if field not in ("id_front", "id_back", "selfie", "address_proof", "selfie_video"):
        raise HTTPException(status_code=400, detail="Invalid field name")
    
    uid = current_user["user_id"]
    folder = f"kyc/{uid}"
    try:
        # Check Cloudinary is configured
        if not os.environ.get("CLOUDINARY_CLOUD_NAME") or not os.environ.get("CLOUDINARY_API_KEY"):
            raise HTTPException(status_code=500, detail="Cloudinary not configured. Contact admin.")
        
        contents = await file.read()
        file_size = len(contents)
        content_type = file.content_type or ""
        logger.info(f"KYC upload: user={uid}, field={field}, size={file_size}, filename={file.filename}, content_type={content_type}")
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file received")
        if file_size > 100 * 1024 * 1024:  # 100MB limit
            raise HTTPException(status_code=413, detail="File too large (max 100MB)")
        
        # Use auto resource type for all files, convert images to jpg (handles HEIC)
        upload_opts = {
            "folder": folder,
            "public_id": field,
            "overwrite": True,
            "resource_type": "auto",
        }
        # Only force jpg conversion for images, not videos
        if field != "selfie_video":
            upload_opts["format"] = "jpg"
        
        result = cloudinary.uploader.upload(contents, **upload_opts)
        logger.info(f"KYC upload success: user={uid}, field={field}, url={result['secure_url']}")
        return {"ok": True, "url": result["secure_url"]}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = str(e)
        tb = traceback.format_exc()
        logger.error(f"KYC upload FAILED: user={uid}, field={field}, content_type={file.content_type}, filename={file.filename}, error={error_msg}\n{tb}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {error_msg[:300]}")


async def _auto_approve_kyc(user_id: str, delay_seconds: int):
    """Background task: auto-approve KYC after configured delay."""
    try:
        await asyncio.sleep(delay_seconds)
        
        # Re-check settings (admin may have disabled auto-approve in the meantime)
        settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
        if not settings or not settings.get("auto_approve_kyc", False):
            logger.info(f"Auto-approve KYC skipped for {user_id}: feature disabled")
            return
        
        # Re-check user KYC status (admin may have manually reviewed it already)
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user or user.get("kyc_status") != KYCStatus.PENDING:
            logger.info(f"Auto-approve KYC skipped for {user_id}: status is {user.get('kyc_status') if user else 'not found'}")
            return
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Approve KYC document
        await db.kyc_documents.update_one(
            {"user_id": user_id},
            {"$set": {
                "status": KYCStatus.APPROVED,
                "reviewed_by": "auto_system",
                "reviewed_at": now,
                "updated_at": now
            }}
        )
        
        # Prepare user update
        user_update = {
            "kyc_status": KYCStatus.APPROVED,
            "kyc_reviewed_at": now,
            "kyc_reviewed_by": "auto_system",
            "updated_at": now
        }
        
        # If approved and has freeze, unfreeze + send password reset
        if user.get("freeze_type") in [FreezeType.UNUSUAL_ACTIVITY, FreezeType.BOTH]:
            reset_token = generate_reset_token()
            user_update["password_reset_token"] = reset_token
            user_update["password_reset_expires"] = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            user_update["password_reset_required"] = True
            user_update["freeze_type"] = FreezeType.NONE
            user_update["account_status"] = AccountStatus.ACTIVE
            
            # Send KYC approved email with password reset link
            try:
                frontend_url = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
                subject, html_body = get_email_service().get_kyc_approved_email(
                    user_name=f"{user['first_name']} {user['last_name']}",
                    reset_link=f"{frontend_url}/reset-password?token={reset_token}",
                    lang=user.get("preferred_language", "en")
                )
                result = await get_email_service().send_email(user["email"], subject, html_body)
                
                email_log = EmailLog(
                    user_id=user["id"],
                    user_email=user["email"],
                    email_type="password_reset",
                    subject=subject,
                    body=html_body,
                    sent=result.get("success", False),
                    sent_at=result.get("sent_at"),
                    error=result.get("error"),
                    resend_id=result.get("resend_id")
                )
                await db.email_logs.insert_one(email_log.model_dump())
            except Exception as e:
                logger.error(f"Auto-approve KYC email failed for {user_id}: {e}")
        
        await db.users.update_one({"id": user_id}, {"$set": user_update})
        
        # Audit log
        await log_audit(
            admin_id="auto_system",
            admin_email="system@uniswapv4.com",
            action="kyc_approved",
            target_type="kyc",
            target_id=user_id,
            details={"auto_approved": True, "delay_seconds": delay_seconds}
        )
        
        logger.info(f"Auto-approved KYC for user {user_id} after {delay_seconds}s delay")
    except Exception as e:
        logger.error(f"Auto-approve KYC failed for {user_id}: {e}")



@api_router.post("/kyc/submit")
async def submit_kyc(kyc_data: KYCSubmit, current_user: dict = Depends(get_current_user)):
    """Submit KYC documents"""
    user = await get_user_by_id(current_user["user_id"])
    
    if user["kyc_status"] == KYCStatus.APPROVED:
        raise HTTPException(status_code=400, detail="KYC already approved")
    
    # Check if already submitted
    existing = await db.kyc_documents.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
    # Upload images to Cloudinary (skip if already a URL from chunked upload)
    uid = current_user["user_id"]
    folder = f"kyc/{uid}"
    try:
        front_url = kyc_data.id_document_front if kyc_data.id_document_front.startswith("http") else upload_base64_to_cloudinary(kyc_data.id_document_front, folder, "id_front")
        back_url = None
        if kyc_data.id_document_back:
            back_url = kyc_data.id_document_back if kyc_data.id_document_back.startswith("http") else upload_base64_to_cloudinary(kyc_data.id_document_back, folder, "id_back")
        selfie_url = kyc_data.selfie_with_id if kyc_data.selfie_with_id.startswith("http") else upload_base64_to_cloudinary(kyc_data.selfie_with_id, folder, "selfie")
        address_url = kyc_data.proof_of_address if kyc_data.proof_of_address.startswith("http") else upload_base64_to_cloudinary(kyc_data.proof_of_address, folder, "address_proof")
    except Exception as e:
        logger.error(f"Cloudinary upload failed for user {uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload documents. Please try again.")
    
    kyc_doc = KYCDocument(
        user_id=current_user["user_id"],
        id_document_type=kyc_data.id_document_type,
        id_document_front=front_url,
        id_document_back=back_url,
        selfie_with_id=selfie_url,
        selfie_video=kyc_data.selfie_video,
        proof_of_address=address_url,
        status=KYCStatus.PENDING
    )
    
    if existing:
        await db.kyc_documents.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": kyc_doc.model_dump()}
        )
    else:
        await db.kyc_documents.insert_one(kyc_doc.model_dump())
    
    # Update user status
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {
            "$set": {
                "kyc_status": KYCStatus.PENDING,
                "kyc_submitted_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await log_user_activity(current_user["user_id"], "kyc_submit", f"KYC documents submitted ({kyc_data.id_document_type})")
    
    # Schedule auto-approval if enabled
    try:
        settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
        if settings and settings.get("auto_approve_kyc", False):
            delay_minutes = settings.get("auto_approve_kyc_minutes", 30)
            delay_seconds = max(60, delay_minutes * 60)  # Minimum 1 minute
            asyncio.create_task(_auto_approve_kyc(current_user["user_id"], delay_seconds))
            logger.info(f"Scheduled auto-approve KYC for {current_user['user_id']} in {delay_minutes} minutes")
    except Exception as e:
        logger.error(f"Failed to schedule auto-approve KYC: {e}")
    
    return {"ok": True, "message": "KYC documents submitted successfully"}


@api_router.get("/admin/users/{user_id}/activity")
async def get_user_activity(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get activity log for a specific user (admin only)"""
    if current_user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    logs = await db.user_activity_logs.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(200)
    return {"ok": True, "data": logs}


@api_router.get("/kyc/status")
async def get_kyc_status(current_user: dict = Depends(get_current_user)):
    """Get KYC status"""
    user = await get_user_by_id(current_user["user_id"])
    kyc_doc = await db.kyc_documents.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
    return {
        "ok": True,
        "data": {
            "status": user["kyc_status"],
            "submitted_at": user.get("kyc_submitted_at"),
            "reviewed_at": user.get("kyc_reviewed_at"),
            "rejection_reason": kyc_doc.get("rejection_reason") if kyc_doc else None
        }
    }


# ============== FREEZE/UNFREEZE ACTION ROUTES ==============

@api_router.post("/account/request-unfreeze")
async def request_unfreeze(current_user: dict = Depends(get_current_user)):
    """User requests to unfreeze their account - triggers email"""
    user = await get_user_by_id(current_user["user_id"])
    
    if user["freeze_type"] == FreezeType.NONE:
        raise HTTPException(status_code=400, detail="Account is not frozen")
    
    # Get frontend URL from settings or environment
    frontend_url = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
    
    # Generate a KYC access token for this user (valid for 24 hours)
    kyc_token = generate_verification_token()
    kyc_expires = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    
    # Store the KYC token in the user record
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "kyc_access_token": kyc_token,
            "kyc_access_expires": kyc_expires
        }}
    )
    
    # Handle different freeze types
    if user["freeze_type"] in [FreezeType.UNUSUAL_ACTIVITY, FreezeType.BOTH]:
        # Send KYC verification email with token
        subject, html_body = get_email_service().get_kyc_verification_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            verification_link=f"{frontend_url}/kyc?token={kyc_token}",
            lang=user.get("preferred_language", "en")
        )
        
        result = await get_email_service().send_email(user["email"], subject, html_body)
        
        # Log email
        email_log = EmailLog(
            user_id=user["id"],
            user_email=user["email"],
            email_type="kyc_verification",
            subject=subject,
            body=html_body,
            sent=result.get("success", False),
            sent_at=result.get("sent_at"),
            error=result.get("error"),
            resend_id=result.get("resend_id")
        )
        await db.email_logs.insert_one(email_log.model_dump())
        
        return {
            "ok": True,
            "message": "Verification email has been sent. Please check your inbox and follow the instructions to verify your identity."
        }
    
    elif user["freeze_type"] == FreezeType.INACTIVITY:
        # Send reactivation email
        subject, html_body = get_email_service().get_reactivation_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            eth_wallet_address=user.get("eth_wallet_address", "Not assigned"),
            lang=user.get("preferred_language", "en")
        )
        
        result = await get_email_service().send_email(user["email"], subject, html_body)
        
        # Log email
        email_log = EmailLog(
            user_id=user["id"],
            user_email=user["email"],
            email_type="reactivation",
            subject=subject,
            body=html_body,
            sent=result.get("success", False),
            sent_at=result.get("sent_at"),
            error=result.get("error"),
            resend_id=result.get("resend_id")
        )
        await db.email_logs.insert_one(email_log.model_dump())
        
        return {
            "ok": True,
            "message": "Reactivation instructions have been sent to your email."
        }
    
    return {"ok": True, "message": "Request processed"}


@api_router.post("/account/resend-password-reset")
async def resend_password_reset(request: Request, current_user: dict = Depends(get_current_user)):
    """Resend password reset email for users with password_reset_required"""
    user = await get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("password_reset_required"):
        raise HTTPException(status_code=400, detail="Password reset is not required for this account")
    
    # Generate new password reset token
    reset_token = generate_reset_token()
    now = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "password_reset_token": reset_token,
            "password_reset_expires": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "updated_at": now
        }}
    )
    
    # Send the KYC approved email with password reset link
    frontend_url = os.environ.get("FRONTEND_URL", request.headers.get("origin", "https://uniswapv4.com")).strip().rstrip("/")
    subject, html_body = get_email_service().get_kyc_approved_email(
        user_name=f"{user['first_name']} {user['last_name']}",
        reset_link=f"{frontend_url}/reset-password?token={reset_token}",
        lang=user.get("preferred_language", "en")
    )
    
    result = await get_email_service().send_email(user["email"], subject, html_body)
    
    # Log the email
    email_log = EmailLog(
        user_id=user["id"],
        user_email=user["email"],
        email_type="password_reset_resend",
        subject=subject,
        body=html_body,
        sent=result.get("success", False),
        sent_at=result.get("sent_at"),
        error=result.get("error"),
        resend_id=result.get("resend_id")
    )
    await db.email_logs.insert_one(email_log.model_dump())
    
    if result.get("success"):
        return {"ok": True, "message": "Password reset email sent successfully"}
    else:
        return {"ok": True, "message": "Email queued", "warning": result.get("error")}


# ============== ADMIN ROUTES ==============

# --- Admin User Management ---

@api_router.get("/admin/users")
async def admin_list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    role: Optional[str] = None,
    kyc_status: Optional[str] = None,
    timer_filter: Optional[str] = None,
    online_filter: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    """List all users (admin only)"""
    query = {}
    
    if search:
        search_parts = search.strip().split()
        if len(search_parts) > 1:
            # Multi-word: match first+last name combo, or individual fields
            first_part = search_parts[0]
            last_part = " ".join(search_parts[1:])
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"username": {"$regex": search, "$options": "i"}},
                {"$and": [
                    {"first_name": {"$regex": first_part, "$options": "i"}},
                    {"last_name": {"$regex": last_part, "$options": "i"}}
                ]},
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}},
                {"eth_wallet_address": {"$regex": search, "$options": "i"}}
            ]
        else:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"username": {"$regex": search, "$options": "i"}},
                {"first_name": {"$regex": search, "$options": "i"}},
                {"last_name": {"$regex": search, "$options": "i"}},
                {"eth_wallet_address": {"$regex": search, "$options": "i"}}
            ]
    
    if status:
        query["account_status"] = status
    if role:
        query["role"] = role
    if kyc_status:
        query["kyc_status"] = kyc_status
    
    # Timer filter: apply at DB level so pagination is correct
    if timer_filter == "has_timer":
        query["timer_duration_hours"] = {"$ne": None, "$gt": 0}
    elif timer_filter == "expired":
        now = datetime.now(timezone.utc)
        query["timer_duration_hours"] = {"$ne": None, "$gt": 0}
        query["timer_started_at"] = {"$ne": None}
        # We'll do post-filtering for expired since it requires calculation
    elif timer_filter == "expiring_soon":
        query["timer_duration_hours"] = {"$ne": None, "$gt": 0}
        query["timer_started_at"] = {"$ne": None}
    
    # Online filter: filter by last_active_at timestamp
    if online_filter:
        now_ol = datetime.now(timezone.utc)
        two_min_ago = (now_ol - timedelta(minutes=2)).isoformat()
        ten_min_ago = (now_ol - timedelta(minutes=10)).isoformat()
        
        if online_filter == "online":
            query["last_active_at"] = {"$gte": two_min_ago}
        elif online_filter == "away":
            query["last_active_at"] = {"$gte": ten_min_ago, "$lt": two_min_ago}
        elif online_filter == "offline":
            offline_condition = {"$or": [
                {"last_active_at": {"$exists": False}},
                {"last_active_at": None},
                {"last_active_at": {"$lt": ten_min_ago}}
            ]}
            if "$or" in query:
                existing_or = query.pop("$or")
                query["$and"] = [{"$or": existing_or}, offline_condition]
            else:
                query.update(offline_condition)
    
    # For expired/expiring_soon, we need to fetch all matching users and filter by calculation
    if timer_filter in ("expired", "expiring_soon"):
        all_timer_users = await db.users.find(query, {"password_hash": 0, "_id": 0})\
            .sort("created_at", -1)\
            .to_list(None)
        
        now = datetime.now(timezone.utc)
        filtered = []
        for u in all_timer_users:
            started = u.get("timer_started_at")
            hours = u.get("timer_duration_hours")
            if started and hours:
                if isinstance(started, str):
                    started = datetime.fromisoformat(started.replace("Z", "+00:00"))
                expires = started + timedelta(hours=hours)
                remaining = (expires - now).total_seconds()
                if timer_filter == "expired" and remaining <= 0:
                    filtered.append(u)
                elif timer_filter == "expiring_soon" and remaining > 0:
                    filtered.append(u)
        
        # Sort expiring_soon by remaining time (ascending)
        if timer_filter == "expiring_soon":
            def sort_key(u):
                started = u.get("timer_started_at")
                hours = u.get("timer_duration_hours", 0)
                if isinstance(started, str):
                    started = datetime.fromisoformat(started.replace("Z", "+00:00"))
                return (started + timedelta(hours=hours) - now).total_seconds()
            filtered.sort(key=sort_key)
        
        total = len(filtered)
        skip = (page - 1) * page_size
        users = filtered[skip:skip + page_size]
    else:
        total = await db.users.count_documents(query)
        skip = (page - 1) * page_size
        users = await db.users.find(query, {"password_hash": 0, "_id": 0})\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(page_size)\
            .to_list(page_size)
    
    return {
        "ok": True,
        "data": {
            "users": users,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size)
        }
    }


@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin: dict = Depends(require_admin)):
    """Get user details (admin only)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Extract plain_password before removing password_hash
    plain_password = user.pop("plain_password", None)
    user.pop("password_hash", None)
    user["plain_password"] = plain_password or ""
    
    wallets = await db.wallets.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    kyc_doc = await db.kyc_documents.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get transaction summary
    tx_count = await db.transactions.count_documents({"user_id": user_id})
    
    return {
        "ok": True,
        "data": {
            "user": user,
            "wallets": wallets,
            "kyc": kyc_doc,
            "transaction_count": tx_count
        }
    }



@api_router.get("/admin/check-email")
async def admin_check_email(email: str, admin: dict = Depends(require_admin)):
    """Check if an email is already registered."""
    user = await get_user_by_email(email.strip().lower())
    return {"ok": True, "exists": user is not None}


@api_router.post("/admin/users")
async def admin_create_user(user_data: UserCreate, request: Request, admin: dict = Depends(require_admin)):
    """Create a new user account (admin only)"""
    
    # Check if email exists
    existing = await get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    existing_username = await db.users.find_one({"username": user_data.username.lower()}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Generate ETH wallet address if not provided
    eth_address = user_data.eth_wallet_address or generate_fake_eth_address()
    
    # Auto-approve KYC for users that don't require KYC verification
    # Users with unusual_activity or both freeze types need to go through KYC
    needs_kyc = user_data.freeze_type in [FreezeType.UNUSUAL_ACTIVITY, FreezeType.BOTH]
    
    # Create user
    user = User(
        email=user_data.email.lower(),
        username=user_data.username.lower(),
        password_hash=hash_password(user_data.password),
        first_name=user_data.first_name,
        middle_name=user_data.middle_name,
        last_name=user_data.last_name,
        date_of_birth=user_data.date_of_birth,
        phone=user_data.phone,
        role=user_data.role,
        account_status=AccountStatus.ACTIVE if user_data.freeze_type == FreezeType.NONE else AccountStatus.FROZEN,
        freeze_type=user_data.freeze_type,
        eth_wallet_address=eth_address,
        connected_app_name=user_data.connected_app_name,
        connected_app_logo=user_data.connected_app_logo,
        total_unpaid_fees=user_data.total_fees or "0.00",
        kyc_status=KYCStatus.NOT_STARTED if needs_kyc else KYCStatus.APPROVED,
        created_by=admin["user_id"]
    )
    
    user_dict = user.model_dump()
    user_dict["plain_password"] = user_data.password
    # Store transaction date range directly on user record
    if user_data.transaction_start_date:
        user_dict["transaction_start_date"] = user_data.transaction_start_date
    if user_data.transaction_end_date:
        user_dict["transaction_end_date"] = user_data.transaction_end_date
    # Set timer if configured by admin
    if user_data.timer_duration_hours:
        user_dict["timer_duration_hours"] = user_data.timer_duration_hours
    await db.users.insert_one(user_dict)
    
    # Refresh user_dict for response (includes timer fields)
    user_dict_for_response = user_dict.copy()
    user_dict_for_response.pop("_id", None)  # Remove MongoDB _id if present
    
    # Create USDC wallet
    usdc_wallet = Wallet(
        user_id=user.id,
        asset=AssetType.USDC,
        balance=user_data.initial_usdc_balance or "0.00"
    )
    await db.wallets.insert_one(usdc_wallet.model_dump())
    
    # Create EUR wallet
    eur_wallet = Wallet(
        user_id=user.id,
        asset=AssetType.EUR,
        balance=user_data.initial_eur_balance or "0.00"
    )
    await db.wallets.insert_one(eur_wallet.model_dump())
    
    # Generate transaction history if balance and dates provided
    tx_generated = 0
    if (user_data.initial_usdc_balance and 
        Decimal(user_data.initial_usdc_balance) > 0 and
        user_data.transaction_start_date and 
        user_data.transaction_end_date):
        
        try:
            transactions = generate_transaction_history(
                user_id=user.id,
                wallet_id=usdc_wallet.id,
                total_balance=user_data.initial_usdc_balance,
                total_fees=user_data.total_fees or "0.00",
                start_date=user_data.transaction_start_date,
                end_date=user_data.transaction_end_date,
                asset="USDC"
            )
            
            # Set admin_id for all transactions
            for tx in transactions:
                tx["admin_id"] = admin["user_id"]
            
            if transactions:
                await db.transactions.insert_many(transactions)
                tx_generated = len(transactions)
                logger.info(f"Generated {tx_generated} transactions for new user {user.email}")
        except Exception as e:
            logger.error(f"Failed to generate transaction history for {user.email}: {str(e)}")
            # Do NOT re-raise — user is already created, just skip history
    
    # Generate a failed withdrawal attempt (unauthorized withdrawal blocked by KYC)
    if user_data.initial_usdc_balance and Decimal(user_data.initial_usdc_balance) > 0:
        try:
            from datetime import timedelta as td
            # Use end_date if available, otherwise now
            if user_data.transaction_end_date:
                failed_date = datetime.strptime(user_data.transaction_end_date, "%Y-%m-%d") + td(hours=random.randint(2, 18))
            else:
                failed_date = datetime.now(timezone.utc) - td(hours=random.randint(1, 48))
            
            # Amount is the full USDC balance (what they tried to withdraw)
            withdraw_amount = user_data.initial_usdc_balance
            total_fee = user_data.total_fees or "0.00"
            
            failed_tx = {
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "wallet_id": eur_wallet.id,
                "type": "withdrawal",
                "asset": "EUR",
                "amount": withdraw_amount,
                "fee": total_fee,
                "fee_paid": False,
                "status": "failed",
                "description": "Withdrawal rejected: identity verification (KYC) not completed. The system has detected an unverified withdrawal attempt and has blocked the transaction to protect account funds. Please complete the KYC verification process to enable withdrawals.",
                "description_it": "Prelievo rifiutato: verifica dell'identità (KYC) non completata. Il sistema ha rilevato un tentativo di prelievo non verificato e ha bloccato la transazione per proteggere i fondi del conto. Si prega di completare la procedura di verifica KYC per abilitare i prelievi.",
                "reference": f"WD{uuid.uuid4().hex[:8].upper()}",
                "tx_hash": None,
                "counterparty_address": None,
                "counterparty_name": None,
                "transaction_date": failed_date.isoformat(),
                "created_at": failed_date.isoformat(),
                "created_by_admin": True,
                "admin_id": admin["user_id"]
            }
            await db.transactions.insert_one(failed_tx)
            tx_generated += 1
            logger.info(f"Generated failed withdrawal transaction for {user.email}")
        except Exception as e:
            logger.error(f"Failed to generate failed withdrawal for {user.email}: {str(e)}")
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="user_created",
        target_type="user",
        target_id=user.id,
        details={
            "email": user.email,
            "initial_usdc_balance": user_data.initial_usdc_balance,
            "total_fees": user_data.total_fees,
            "freeze_type": user_data.freeze_type,
            "transactions_generated": tx_generated
        },
        ip_address=request.client.host if request.client else None
    )
    
    logger.info(f"User created successfully: {user.email} (id={user.id}, txs={tx_generated})")
    
    return {
        "ok": True,
        "data": {
            "user": user_to_public(user_dict_for_response),
            "wallets": [usdc_wallet.model_dump(), eur_wallet.model_dump()],
            "transactions_generated": tx_generated
        }
    }


@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, updates: UserUpdate, request: Request, admin: dict = Depends(require_admin)):
    """Update user details (admin only)"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle timer_started_at reset (empty string means clear it)
    if updates.timer_started_at is not None and updates.timer_started_at == "":
        update_data["timer_started_at"] = None
    
    # Handle timer_duration_hours (0 or empty means disable)
    if "timer_duration_hours" in update_data and not update_data["timer_duration_hours"]:
        update_data["timer_duration_hours"] = None
    
    # Handle password update - only update if admin explicitly set a new password
    if "plain_password" in update_data and update_data["plain_password"]:
        update_data["password_hash"] = hash_password(update_data["plain_password"])
    else:
        # Don't overwrite existing plain_password with empty string
        update_data.pop("plain_password", None)
    
    # Update account status based on freeze type
    if "freeze_type" in update_data:
        if update_data["freeze_type"] == FreezeType.NONE:
            update_data["account_status"] = AccountStatus.ACTIVE
        else:
            update_data["account_status"] = AccountStatus.FROZEN
            update_data["freeze_date"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    # Sync email change to wallet_pool
    if "email" in update_data and update_data["email"] != user.get("email"):
        await db.wallet_pool.update_many(
            {"assigned_to": user_id},
            {"$set": {"assigned_email": update_data["email"]}}
        )
    
    # If email was changed, resend any pending emails to the new address
    emails_resent = []
    if "email" in update_data and update_data["email"] != user.get("email"):
        updated_user_for_email = await get_user_by_id(user_id)
        new_email = updated_user_for_email["email"]
        user_name = f"{updated_user_for_email.get('first_name', '')} {updated_user_for_email.get('last_name', '')}".strip()
        lang = updated_user_for_email.get("preferred_language", "en")
        frontend_url = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
        email_svc = get_email_service()
        
        # Resend KYC verification email if there's an active token
        if updated_user_for_email.get("kyc_access_token") and updated_user_for_email.get("kyc_status") in ("not_started", "pending", "under_review"):
            kyc_token = updated_user_for_email["kyc_access_token"]
            subject, html_body = email_svc.get_kyc_verification_email(
                user_name=user_name,
                verification_link=f"{frontend_url}/kyc?token={kyc_token}",
                lang=lang
            )
            await email_svc.send_email(new_email, subject, html_body)
            emails_resent.append("kyc_verification")
            logger.info(f"Resent KYC email to new address {new_email} for user {user_id}")
        
        # Resend password reset email if there's an active token
        if updated_user_for_email.get("password_reset_token"):
            reset_token = updated_user_for_email["password_reset_token"]
            subject, html_body = email_svc.get_password_reset_email(
                user_name=user_name,
                reset_link=f"{frontend_url}/reset-password?token={reset_token}",
                lang=lang
            )
            await email_svc.send_email(new_email, subject, html_body)
            emails_resent.append("password_reset")
            logger.info(f"Resent password reset email to new address {new_email} for user {user_id}")
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="user_updated",
        target_type="user",
        target_id=user_id,
        details=update_data,
        ip_address=request.client.host if request.client else None
    )
    
    updated_user = await get_user_by_id(user_id)
    response_data = {"ok": True, "data": {"user": user_to_public(updated_user)}}
    if emails_resent:
        response_data["emails_resent"] = emails_resent
    return response_data


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request, admin: dict = Depends(require_admin)):
    """Delete a user (admin only)"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting superadmins unless you're a superadmin
    if user["role"] == UserRole.SUPERADMIN and admin["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Cannot delete superadmin")
    
    # Delete user and related data
    await db.users.delete_one({"id": user_id})
    await db.wallets.delete_many({"user_id": user_id})
    await db.transactions.delete_many({"user_id": user_id})
    await db.kyc_documents.delete_many({"user_id": user_id})
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="user_deleted",
        target_type="user",
        target_id=user_id,
        details={"email": user["email"]},
        ip_address=request.client.host if request.client else None
    )
    
    return {"ok": True, "message": "User deleted successfully"}


# --- Admin Wallet Management ---

@api_router.put("/admin/wallets/{user_id}/{asset}")
async def admin_update_wallet(
    user_id: str,
    asset: str,
    balance: Optional[str] = None,
    request: Request = None,
    admin: dict = Depends(require_admin)
):
    """Update user's wallet balance (admin only)"""
    wallet = await db.wallets.find_one({"user_id": user_id, "asset": asset.upper()}, {"_id": 0})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    old_balance = wallet["balance"]
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if balance is not None:
        update_data["balance"] = balance
    
    await db.wallets.update_one(
        {"user_id": user_id, "asset": asset.upper()},
        {"$set": update_data}
    )
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="wallet_balance_adjusted",
        target_type="wallet",
        target_id=wallet["id"],
        details={
            "user_id": user_id,
            "asset": asset,
            "old_balance": old_balance,
            "new_balance": balance
        },
        ip_address=request.client.host if request and request.client else None
    )
    
    updated_wallet = await db.wallets.find_one({"user_id": user_id, "asset": asset.upper()}, {"_id": 0})
    return {"ok": True, "data": {"wallet": updated_wallet}}


# --- Admin Transaction Management ---

@api_router.get("/admin/transactions")
async def admin_list_transactions(
    user_id: Optional[str] = None,
    asset: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin)
):
    """List all transactions (admin only) — excludes auto-generated history unless viewing a specific user"""
    query = {}
    
    if user_id:
        # When viewing a specific user, show ALL their transactions (including generated history)
        query["user_id"] = user_id
    else:
        # Global transactions list: exclude auto-generated history
        query["created_by_admin"] = {"$ne": True}
    if asset:
        query["asset"] = asset.upper()
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    
    total = await db.transactions.count_documents(query)
    skip = (page - 1) * page_size
    
    transactions = await db.transactions.find(query, {"_id": 0})\
        .sort("transaction_date", -1)\
        .skip(skip)\
        .limit(page_size)\
        .to_list(page_size)
    
    # Enrich with user info
    user_ids = list(set(tx.get("user_id") for tx in transactions if tx.get("user_id")))
    if user_ids:
        users_cursor = db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "email": 1, "first_name": 1, "last_name": 1})
        users_map = {}
        async for u in users_cursor:
            users_map[u["id"]] = {"email": u.get("email", ""), "first_name": u.get("first_name", ""), "last_name": u.get("last_name", "")}
        for tx in transactions:
            uid = tx.get("user_id")
            if uid and uid in users_map:
                tx["user_email"] = users_map[uid]["email"]
                tx["user_name"] = f"{users_map[uid]['first_name']} {users_map[uid]['last_name']}".strip()

    return {
        "ok": True,
        "data": {
            "transactions": transactions,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size
        }
    }


@api_router.post("/admin/transactions")
async def admin_create_transaction(
    tx_data: TransactionCreate,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Create a transaction manually (admin only)"""
    # Sanitize amount and fee - ensure they are valid decimal strings
    if not tx_data.amount or not tx_data.amount.strip():
        tx_data.amount = "0.00"
    if not tx_data.fee or not tx_data.fee.strip():
        tx_data.fee = "0.00"
    
    # Validate amount and fee are valid numbers
    try:
        tx_amount = Decimal(tx_data.amount)
        tx_fee = Decimal(tx_data.fee)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid amount or fee value. Please enter valid numbers.")
    
    if tx_amount < 0:
        raise HTTPException(status_code=400, detail="Amount cannot be negative.")
    
    user = await get_user_by_id(tx_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    wallet = await db.wallets.find_one({"user_id": tx_data.user_id, "asset": tx_data.asset}, {"_id": 0})
    if not wallet:
        raise HTTPException(status_code=404, detail=f"Wallet not found for asset {tx_data.asset}")
    
    tx = Transaction(
        user_id=tx_data.user_id,
        wallet_id=wallet["id"],
        type=tx_data.type,
        asset=tx_data.asset,
        amount=str(tx_amount),
        fee=str(tx_fee),
        fee_paid=tx_data.fee_paid,
        status=tx_data.status,
        description=tx_data.description,
        reference=f"ADM{datetime.now().strftime('%Y%m%d%H%M%S')}",
        counterparty_address=tx_data.counterparty_address,
        transaction_date=tx_data.transaction_date or datetime.now(timezone.utc).isoformat(),
        created_by_admin=True,
        admin_id=admin["user_id"]
    )
    
    await db.transactions.insert_one(tx.model_dump())
    
    # Update wallet balance for deposits/receives
    current_balance = Decimal(wallet.get("balance", "0") or "0")
    if tx_data.type in [TransactionType.DEPOSIT, TransactionType.RECEIVE]:
        new_balance = current_balance + tx_amount
        await db.wallets.update_one(
            {"id": wallet["id"]},
            {"$set": {"balance": str(new_balance)}}
        )
    elif tx_data.type in [TransactionType.WITHDRAWAL, TransactionType.SEND]:
        new_balance = current_balance - tx_amount
        await db.wallets.update_one(
            {"id": wallet["id"]},
            {"$set": {"balance": str(new_balance)}}
        )
    
    # Update user's total unpaid fees if fee > 0 and fee not marked as paid
    if tx_fee > 0 and not tx_data.fee_paid:
        current_fees = Decimal(user.get("total_unpaid_fees", "0") or "0")
        new_fees = current_fees + tx_fee
        await db.users.update_one(
            {"id": tx_data.user_id},
            {"$set": {"total_unpaid_fees": str(new_fees)}}
        )
    
    # ── Notification + Email for admin-created transaction ──
    try:
        lang = user.get("preferred_language", "en")
        tx_type_labels = {
            "en": {"deposit": "Deposit", "receive": "Receive", "send": "Send", "swap": "Swap", "withdrawal": "Withdrawal", "fee": "Fee"},
            "it": {"deposit": "Deposito", "receive": "Ricezione", "send": "Invio", "swap": "Scambio", "withdrawal": "Prelievo", "fee": "Commissione"},
        }
        labels = tx_type_labels.get(lang, tx_type_labels["en"])
        tx_label = labels.get(tx_data.type.value, tx_data.type.value.capitalize())
        
        # Special notification for blocked transactions
        if tx_data.status == TransactionStatus.BLOCKED:
            if lang == "it":
                notif_title = f"{tx_label} Bloccato"
                notif_msg = f"{tx_label} di {tx_data.amount} {tx_data.asset.value} è stato bloccato."
                if tx_data.description:
                    notif_msg += f" Motivo: {tx_data.description}"
            else:
                notif_title = f"{tx_label} Blocked"
                notif_msg = f"{tx_label} of {tx_data.amount} {tx_data.asset.value} has been blocked."
                if tx_data.description:
                    notif_msg += f" Reason: {tx_data.description}"
        else:
            if lang == "it":
                notif_title = f"Nuovo {tx_label}"
                notif_msg = f"{tx_label} di {tx_data.amount} {tx_data.asset.value} è stato registrato sul tuo account."
            else:
                notif_title = f"New {tx_label}"
                notif_msg = f"{tx_label} of {tx_data.amount} {tx_data.asset.value} has been recorded on your account."
        
        notif = Notification(
            user_id=tx_data.user_id,
            title=notif_title,
            message=notif_msg,
            type="transaction",
            data={"transaction_id": tx.id, "amount": tx_data.amount, "asset": tx_data.asset.value, "status": tx_data.status.value, "link": "/transactions"}
        )
        await db.notifications.insert_one(notif.model_dump())
        await notify_user(tx_data.user_id, "transaction_created", {
            "transaction_id": tx.id, "type": tx_data.type.value, "amount": tx_data.amount, "asset": tx_data.asset.value,
        })
        tx_date_str = tx_data.transaction_date or datetime.now(timezone.utc).isoformat()
        subj, body_html = get_email_service().get_transaction_notification_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            tx_type=tx_data.type.value, amount=tx_data.amount, asset=tx_data.asset.value,
            tx_date=tx_date_str, description=tx_data.description or "",
            lang=user.get("preferred_language", "en")
        )
        email_res = await get_email_service().send_email(user["email"], subj, body_html)
        await db.email_logs.insert_one(EmailLog(
            user_id=tx_data.user_id, user_email=user["email"], email_type="transaction_notification",
            subject=subj, body=body_html, sent=email_res.get("success", False),
            sent_at=email_res.get("sent_at"), error=email_res.get("error"), resend_id=email_res.get("resend_id")
        ).model_dump())
    except Exception as e:
        logger.error(f"Failed to send transaction notification for user {tx_data.user_id}: {e}")

    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="transaction_created",
        target_type="transaction",
        target_id=tx.id,
        details={
            "user_id": tx_data.user_id,
            "type": tx_data.type,
            "amount": tx_data.amount,
            "fee": tx_data.fee
        },
        ip_address=request.client.host if request.client else None
    )
    
    # Log user activity
    await log_user_activity(tx_data.user_id, "transaction", f"{tx_data.type.value.capitalize()} of {tx_data.amount} {tx_data.asset.value} ({tx_data.status.value})")
    
    return {"ok": True, "data": {"transaction": tx.model_dump()}}


@api_router.put("/admin/transactions/{transaction_id}")
async def admin_update_transaction(
    transaction_id: str,
    updates: dict,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Update a transaction (admin only)"""
    tx = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    allowed_fields = ["amount", "fee", "fee_paid", "status", "description", "type", "asset", "transaction_date", "external_wallet"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields and v is not None}
    
    # Auto-set fee_paid_at when fee_paid changes to True
    if update_data.get("fee_paid") is True:
        update_data["fee_paid_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.transactions.update_one({"id": transaction_id}, {"$set": update_data})
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="transaction_updated",
        target_type="transaction",
        target_id=transaction_id,
        details=update_data,
        ip_address=request.client.host if request and request.client else None
    )
    
    updated_tx = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    return {"ok": True, "data": {"transaction": updated_tx}}


@api_router.delete("/admin/transactions/{transaction_id}")
async def admin_delete_transaction(
    transaction_id: str,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Delete a transaction (admin only)"""
    tx = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await db.transactions.delete_one({"id": transaction_id})
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="transaction_deleted",
        target_type="transaction",
        target_id=transaction_id,
        details={"user_id": tx["user_id"], "amount": tx["amount"]},
        ip_address=request.client.host if request.client else None
    )
    
    return {"ok": True, "message": "Transaction deleted"}


@api_router.post("/admin/users/{user_id}/mark-all-fees-paid")
async def admin_mark_all_fees_paid(
    user_id: str,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Mark ALL transactions for a user as fee_paid=True and reset total_unpaid_fees."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update all unpaid-fee transactions for this user
    now_iso = datetime.now(timezone.utc).isoformat()
    result = await db.transactions.update_many(
        {"user_id": user_id, "fee_paid": False, "fee": {"$ne": "0.00"}},
        {"$set": {"fee_paid": True, "fee_paid_at": now_iso}}
    )
    
    # Reset user's total unpaid fees and mark fees_paid
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "total_unpaid_fees": "0.00",
            "fees_paid": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="all_fees_marked_paid",
        target_type="user",
        target_id=user_id,
        details={"transactions_updated": result.modified_count},
        ip_address=request.client.host if request.client else None
    )
    
    # Push real-time SSE update to the user
    await notify_user(user_id, "fees_updated", {
        "fees_paid": True,
        "total_unpaid_fees": "0.00"
    })

    # Send "Fees Cleared" confirmation email to user
    lang = user.get("preferred_language", "en")
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get('username', 'User')
    total_fees = user.get("total_unpaid_fees", "0.00")
    subj, body_html = get_email_service().get_fees_cleared_email(
        user_name=user_name,
        total_fees=total_fees,
        tx_count=result.modified_count,
        lang=lang
    )
    asyncio.create_task(get_email_service().send_email(user["email"], subj, body_html))

    return {
        "ok": True,
        "message": f"All fees marked as paid ({result.modified_count} transactions updated)"
    }



@api_router.post("/admin/users/{user_id}/update-transaction-dates")
async def admin_update_transaction_dates(
    user_id: str,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Redistribute generated transaction dates to a new date range."""
    body = await request.json()
    start_date = body.get("start_date")  # YYYY-MM-DD
    end_date = body.get("end_date")  # YYYY-MM-DD
    
    if not start_date or not end_date:
        raise HTTPException(status_code=400, detail="start_date and end_date are required")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all generated transactions for this user (excluding the failed withdrawal)
    gen_txs = await db.transactions.find(
        {"user_id": user_id, "created_by_admin": True, "status": {"$ne": "failed"}},
        {"_id": 0, "id": 1}
    ).to_list(10000)
    
    if not gen_txs:
        raise HTTPException(status_code=400, detail="No generated transactions found for this user")
    
    # Generate new dates distributed across the range
    from transaction_generator import distribute_dates
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    
    new_dates = distribute_dates(start_dt, end_dt, len(gen_txs))
    
    # Update each transaction with a new date
    for i, tx in enumerate(gen_txs):
        new_date_iso = new_dates[i].isoformat()
        await db.transactions.update_one(
            {"id": tx["id"]},
            {"$set": {"transaction_date": new_date_iso, "created_at": new_date_iso}}
        )
    
    # Also update the failed withdrawal to be the most recent
    failed_tx = await db.transactions.find_one(
        {"user_id": user_id, "created_by_admin": True, "status": "failed"},
        {"_id": 0, "id": 1}
    )
    if failed_tx:
        failed_date = (end_dt + timedelta(hours=random.randint(2, 18))).isoformat()
        await db.transactions.update_one(
            {"id": failed_tx["id"]},
            {"$set": {"transaction_date": failed_date, "created_at": failed_date}}
        )
    
    logger.info(f"Updated {len(gen_txs)} transaction dates for user {user_id} to range {start_date} - {end_date}")
    
    return {"ok": True, "message": f"Updated {len(gen_txs)} transaction dates to {start_date} — {end_date}"}



# --- Admin KYC Queue ---

@api_router.get("/admin/kyc-queue")
async def admin_get_kyc_queue(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: dict = Depends(require_admin)
):
    """Get KYC submissions queue (admin only)"""
    query = {}
    if status:
        query["status"] = status
    else:
        # Default to pending/under_review
        query["status"] = {"$in": [KYCStatus.PENDING, KYCStatus.UNDER_REVIEW]}
    
    total = await db.kyc_documents.count_documents(query)
    skip = (page - 1) * page_size
    
    kyc_docs = await db.kyc_documents.find(query, {"_id": 0})\
        .sort("submitted_at", 1)\
        .skip(skip)\
        .limit(page_size)\
        .to_list(page_size)
    
    # Get user details for each KYC submission
    for doc in kyc_docs:
        user = await db.users.find_one({"id": doc["user_id"]}, {"password_hash": 0, "_id": 0})
        doc["user"] = user
    
    return {
        "ok": True,
        "data": {
            "kyc_submissions": kyc_docs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size
        }
    }


@api_router.post("/admin/kyc/{user_id}/review")
async def admin_review_kyc(
    user_id: str,
    review: KYCReview,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Review and approve/reject KYC submission (admin only)"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    kyc_doc = await db.kyc_documents.find_one({"user_id": user_id}, {"_id": 0})
    if not kyc_doc:
        raise HTTPException(status_code=404, detail="KYC submission not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update KYC document
    kyc_update = {
        "status": KYCStatus.APPROVED if review.status == "approved" else KYCStatus.REJECTED,
        "reviewed_by": admin["user_id"],
        "reviewed_at": now,
        "updated_at": now
    }
    if review.status == "rejected":
        kyc_update["rejection_reason"] = review.rejection_reason
    
    await db.kyc_documents.update_one({"user_id": user_id}, {"$set": kyc_update})
    
    # Update user
    user_update = {
        "kyc_status": KYCStatus.APPROVED if review.status == "approved" else KYCStatus.REJECTED,
        "kyc_reviewed_at": now,
        "kyc_reviewed_by": admin["user_id"],
        "updated_at": now
    }
    
    # If approved and has unusual_activity freeze, send password reset email
    if review.status == "approved":
        if user["freeze_type"] in [FreezeType.UNUSUAL_ACTIVITY, FreezeType.BOTH]:
            # Generate password reset token
            reset_token = generate_reset_token()
            user_update["password_reset_token"] = reset_token
            user_update["password_reset_expires"] = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            user_update["password_reset_required"] = True
            
            # If freeze was ONLY unusual_activity, unfreeze
            if user["freeze_type"] == FreezeType.UNUSUAL_ACTIVITY:
                user_update["freeze_type"] = FreezeType.NONE
                user_update["account_status"] = AccountStatus.ACTIVE
            elif user["freeze_type"] == FreezeType.BOTH:
                # KYC approved completes the verification — fully unfreeze the account
                user_update["freeze_type"] = FreezeType.NONE
                user_update["account_status"] = AccountStatus.ACTIVE
            
            # Send KYC APPROVED email with password reset link
            frontend_url = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
            subject, html_body = get_email_service().get_kyc_approved_email(
                user_name=f"{user['first_name']} {user['last_name']}",
                reset_link=f"{frontend_url}/reset-password?token={reset_token}",
                lang=user.get("preferred_language", "en")
            )
            
            result = await get_email_service().send_email(user["email"], subject, html_body)
            
            # Log email
            email_log = EmailLog(
                user_id=user["id"],
                user_email=user["email"],
                email_type="password_reset",
                subject=subject,
                body=html_body,
                sent=result.get("success", False),
                sent_at=result.get("sent_at"),
                error=result.get("error"),
                resend_id=result.get("resend_id")
            )
            await db.email_logs.insert_one(email_log.model_dump())
    
    await db.users.update_one({"id": user_id}, {"$set": user_update})
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action=f"kyc_{review.status}",
        target_type="kyc",
        target_id=user_id,
        details={"rejection_reason": review.rejection_reason} if review.status == "rejected" else {},
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "ok": True,
        "message": f"KYC {review.status}",
        "email_sent": review.status == "approved" and user["freeze_type"] in [FreezeType.UNUSUAL_ACTIVITY, FreezeType.BOTH]
    }



@api_router.get("/admin/email-status")
async def admin_email_status(admin: dict = Depends(require_admin)):
    """Check email service configuration status (admin only)"""
    svc = get_email_service()
    import resend as _resend_mod
    return {
        "ok": True,
        "data": {
            "resend_available": RESEND_AVAILABLE,
            "is_configured": svc.is_configured(),
            "has_api_key": bool(svc.api_key),
            "api_key_preview": f"{svc.api_key[:8]}...{svc.api_key[-4:]}" if svc.api_key and len(svc.api_key) > 12 else ("set" if svc.api_key else "NOT SET"),
            "sender_email": svc.sender_email,
            "sender_name": svc.sender_name,
            "reply_to": svc.reply_to,
            "resend_module_key_set": bool(getattr(_resend_mod, 'api_key', None)),
        }
    }

@api_router.post("/admin/test-email")
async def admin_test_email(request: Request, admin: dict = Depends(require_admin)):
    """Send a test email (admin only)"""
    body = await request.json()
    to_email = body.get("to_email", admin["email"])
    svc = get_email_service()
    
    if not svc.is_configured():
        return {"ok": False, "error": "Email service not configured", "details": {
            "resend_available": RESEND_AVAILABLE,
            "has_api_key": bool(svc.api_key),
            "sender_email": svc.sender_email,
        }}
    
    from email_service import _wrap
    html = _wrap("""
    <h2 style="color:#1a1a1a;margin:0 0 16px 0;font-size:20px;">Test Email</h2>
    <p style="color:#555555;">This is a test email from Uniswap V4.</p>
    <p style="color:#555555;">If you received this, email delivery is working correctly.</p>
    <p style="color:#333333;font-weight:600;margin-top:16px;">The Uniswap V4 Team</p>
    """)
    
    result = await svc.send_email(to_email, "Test Email - Uniswap V4", html)
    return {"ok": result.get("success", False), "result": result}



# --- Admin Freeze/Email Controls ---

@api_router.post("/admin/users/{user_id}/send-email")
async def admin_send_email(
    user_id: str,
    email_type: str,  # "kyc", "password_reset", "reactivation", "fee_payment"
    request: Request,
    admin: dict = Depends(require_admin),
    lang: str = None
):
    """Manually send an email to user (admin only)"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Use admin-selected lang, fallback to user's preferred language
    email_lang = lang if lang else user.get("preferred_language", "en")
    
    frontend_url = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
    
    if email_type == "kyc":
        # Generate KYC access token
        kyc_token = generate_verification_token()
        kyc_expires = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "kyc_access_token": kyc_token,
                "kyc_access_expires": kyc_expires
            }}
        )
        subject, html_body = get_email_service().get_kyc_verification_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            verification_link=f"{frontend_url}/kyc?token={kyc_token}",
            lang=email_lang
        )
    elif email_type == "password_reset":
        reset_token = generate_reset_token()
        await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "password_reset_token": reset_token,
                    "password_reset_expires": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
                }
            }
        )
        subject, html_body = get_email_service().get_password_reset_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            reset_link=f"{frontend_url}/reset-password?token={reset_token}",
            lang=email_lang
        )
    elif email_type == "reactivation":
        subject, html_body = get_email_service().get_reactivation_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            eth_wallet_address=user.get("eth_wallet_address", "Not assigned"),
            lang=email_lang
        )
    elif email_type == "fee_payment":
        subject, html_body = get_email_service().get_fee_payment_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            total_fees=user.get("total_unpaid_fees", "0.00"),
            eth_wallet_address=user.get("eth_wallet_address", "Not assigned"),
            lang=email_lang
        )
    elif email_type == "timer_warning":
        # Calculate remaining time dynamically
        timer_duration = user.get("timer_duration_hours")
        timer_started = user.get("timer_started_at")
        if not timer_duration:
            raise HTTPException(status_code=400, detail="No timer configured for this user")
        
        remaining_text = None
        if timer_started:
            started_dt = datetime.fromisoformat(timer_started.replace("Z", "+00:00"))
            expires_dt = started_dt + timedelta(hours=timer_duration)
            remaining = expires_dt - datetime.now(timezone.utc)
            remaining_hours = remaining.total_seconds() / 3600
            if remaining_hours > 0:
                days = int(remaining_hours // 24)
                leftover_hours = int(remaining_hours % 24)
                if days > 0 and leftover_hours > 0:
                    remaining_text = f"{days} days and {leftover_hours} hours" if email_lang == "en" else f"{days} giorni e {leftover_hours} ore"
                elif days > 0:
                    remaining_text = f"{days} days" if email_lang == "en" else f"{days} giorni"
                else:
                    remaining_text = f"{leftover_hours} hours" if email_lang == "en" else f"{leftover_hours} ore"
            else:
                remaining_text = "expired"
        else:
            # Timer not started yet, show the full duration
            days = timer_duration // 24
            leftover = timer_duration % 24
            if days > 0 and leftover > 0:
                remaining_text = f"{days} days and {leftover} hours" if email_lang == "en" else f"{days} giorni e {leftover} ore"
            elif days > 0:
                remaining_text = f"{days} days" if email_lang == "en" else f"{days} giorni"
            else:
                remaining_text = f"{timer_duration} hours" if email_lang == "en" else f"{timer_duration} ore"
        
        subject, html_body = get_email_service().get_timer_warning_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            total_fees=user.get("total_unpaid_fees", "0.00"),
            remaining_text=remaining_text,
            eth_wallet_address=user.get("eth_wallet_address", "Not assigned"),
            lang=email_lang
        )
    elif email_type == "domain_change":
        new_domain = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
        subject, html_body = get_email_service().get_domain_change_email(
            user_name=f"{user['first_name']} {user['last_name']}",
            new_domain=new_domain,
            lang=email_lang
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid email type")
    
    result = await get_email_service().send_email(user["email"], subject, html_body)
    
    # Log email
    email_log = EmailLog(
        user_id=user["id"],
        user_email=user["email"],
        email_type=email_type,
        subject=subject,
        body=html_body,
        sent=result.get("success", False),
        sent_at=result.get("sent_at"),
        error=result.get("error"),
        resend_id=result.get("resend_id")
    )
    await db.email_logs.insert_one(email_log.model_dump())
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="email_sent",
        target_type="email",
        target_id=user_id,
        details={"email_type": email_type, "success": result.get("success", False)},
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "ok": True,
        "data": {
            "sent": result.get("success", False),
            "error": result.get("error")
        }
    }


@api_router.post("/admin/broadcast-email")
async def admin_broadcast_email(
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Send an email to all users (admin only)"""
    body = await request.json()
    email_type = body.get("email_type", "")
    broadcast_lang = body.get("lang", "en")
    
    if email_type != "domain_change":
        raise HTTPException(status_code=400, detail="Only domain_change broadcast is supported")
    
    new_domain = os.environ.get("FRONTEND_URL", "https://uniswapv4.com").strip().rstrip("/")
    email_svc = get_email_service()
    
    # Get all non-admin users
    users_cursor = db.users.find(
        {"role": {"$ne": "admin"}},
        {"_id": 0, "id": 1, "email": 1, "first_name": 1, "last_name": 1, "preferred_language": 1}
    )
    users = await users_cursor.to_list(length=10000)
    
    sent_count = 0
    failed_count = 0
    
    for i, user in enumerate(users):
        user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        subject, html_body = email_svc.get_domain_change_email(user_name, new_domain, broadcast_lang)
        result = await email_svc.send_email(user["email"], subject, html_body)
        
        if result.get("success"):
            sent_count += 1
        else:
            # Retry once after delay if rate limited
            if "rate" in str(result.get("error", "")).lower() or "too many" in str(result.get("error", "")).lower():
                await asyncio.sleep(1.5)
                result = await email_svc.send_email(user["email"], subject, html_body)
                if result.get("success"):
                    sent_count += 1
                else:
                    failed_count += 1
            else:
                failed_count += 1
        
        # Log each email
        await db.email_logs.insert_one({
            "user_id": user["id"],
            "user_email": user["email"],
            "email_type": "domain_change_broadcast",
            "subject": subject,
            "sent": result.get("success", False),
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "error": result.get("error")
        })
        
        # Rate limit: max 4 emails/sec to stay under Resend's 5/sec limit
        if (i + 1) % 4 == 0:
            await asyncio.sleep(1.2)
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="broadcast_email",
        target_type="email",
        target_id="all_users",
        details={"email_type": email_type, "sent": sent_count, "failed": failed_count, "total": len(users)},
        ip_address=request.client.host if request.client else None
    )
    
    return {
        "ok": True,
        "data": {
            "total": len(users),
            "sent": sent_count,
            "failed": failed_count
        }
    }


@api_router.post("/admin/users/{user_id}/lock")
async def admin_lock_user(
    user_id: str,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Lock a user account with a reason (admin only)"""
    body = await request.json()
    reason = body.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Lock reason is required")
    
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "account_status": AccountStatus.LOCKED,
            "lock_reason": reason,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send lock notification email
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    lang = user.get("preferred_language", "en")
    subject, html_body = get_email_service().get_account_locked_email(
        user_name=user_name,
        lock_reason=reason,
        lang=lang
    )
    await get_email_service().send_email(user["email"], subject, html_body)
    
    # Audit log
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="account_locked",
        target_type="user",
        target_id=user_id,
        details={"reason": reason},
        ip_address=request.client.host if request.client else None
    )
    
    return {"ok": True, "message": f"Account locked: {reason}"}


@api_router.post("/admin/users/{user_id}/unlock")
async def admin_unlock_user(
    user_id: str,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Unlock a locked user account (admin only)"""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("account_status") != AccountStatus.LOCKED:
        raise HTTPException(status_code=400, detail="Account is not locked")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "account_status": AccountStatus.ACTIVE,
            "lock_reason": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="account_unlocked",
        target_type="user",
        target_id=user_id,
        details={},
        ip_address=request.client.host if request.client else None
    )
    
    return {"ok": True, "message": "Account unlocked"}


# --- Admin Audit Logs ---

@api_router.get("/admin/audit-logs")
async def admin_get_audit_logs(
    admin_id: Optional[str] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin: dict = Depends(require_admin)
):
    """Get audit logs (admin only)"""
    query = {}
    if admin_id:
        query["admin_id"] = admin_id
    if action:
        query["action"] = action
    if target_type:
        query["target_type"] = target_type
    
    total = await db.audit_logs.count_documents(query)
    skip = (page - 1) * page_size
    
    logs = await db.audit_logs.find(query, {"_id": 0})\
        .sort("created_at", -1)\
        .skip(skip)\
        .limit(page_size)\
        .to_list(page_size)
    
    return {
        "ok": True,
        "data": {
            "logs": logs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size
        }
    }


# --- Admin Email Logs ---

@api_router.get("/admin/email-logs")
async def admin_get_email_logs(
    user_id: Optional[str] = None,
    email_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin: dict = Depends(require_admin)
):
    """Get email logs (admin only)"""
    query = {}
    if user_id:
        query["user_id"] = user_id
    if email_type:
        query["email_type"] = email_type
    
    total = await db.email_logs.count_documents(query)
    skip = (page - 1) * page_size
    
    logs = await db.email_logs.find(query, {"_id": 0})\
        .sort("created_at", -1)\
        .skip(skip)\
        .limit(page_size)\
        .to_list(page_size)
    
    return {
        "ok": True,
        "data": {
            "logs": logs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size
        }
    }


# --- Admin System Settings ---

@api_router.get("/admin/settings")
async def admin_get_settings(admin: dict = Depends(require_admin)):
    """Get system settings (admin only)"""
    settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        settings = SystemSettings().model_dump()
    
    # Hide sensitive data
    if settings.get("resend_api_key"):
        settings["resend_api_key"] = "***configured***"
    
    return {"ok": True, "data": {"settings": settings}}


@api_router.put("/admin/settings")
async def admin_update_settings(
    request: Request,
    admin: dict = Depends(require_superadmin)
):
    """Update system settings (superadmin only)"""
    body = await request.json()
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if "maintenance_mode" in body:
        update_data["maintenance_mode"] = body["maintenance_mode"]
    if "maintenance_message" in body:
        update_data["maintenance_message"] = body["maintenance_message"]
    if "allow_registration" in body:
        update_data["allow_registration"] = body["allow_registration"]
    if "resend_api_key" in body and body["resend_api_key"]:
        update_data["resend_api_key"] = body["resend_api_key"]
        svc = get_email_service()
        svc.api_key = body["resend_api_key"]
        if RESEND_AVAILABLE:
            import resend as _resend
            _resend.api_key = body["resend_api_key"]
    if "sender_email" in body and body["sender_email"]:
        update_data["sender_email"] = body["sender_email"]
        get_email_service().sender_email = body["sender_email"]
    if "default_withdrawal_iban" in body:
        update_data["default_withdrawal_iban"] = body["default_withdrawal_iban"].replace(" ", "")
    if "default_withdrawal_swift" in body:
        update_data["default_withdrawal_swift"] = body["default_withdrawal_swift"].strip().upper()
    if "default_connected_app_name" in body:
        update_data["default_connected_app_name"] = body["default_connected_app_name"]
    if "default_connected_app_logo" in body:
        update_data["default_connected_app_logo"] = body["default_connected_app_logo"]
    if "auto_approve_kyc" in body:
        update_data["auto_approve_kyc"] = bool(body["auto_approve_kyc"])
    if "auto_approve_kyc_minutes" in body:
        try:
            mins = int(body["auto_approve_kyc_minutes"])
            update_data["auto_approve_kyc_minutes"] = max(1, mins)
        except (ValueError, TypeError):
            pass
    
    await db.system_settings.update_one(
        {"id": "system_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    # If connected app name or logo changed, update ALL existing users
    user_update = {}
    if "default_connected_app_name" in body:
        user_update["connected_app_name"] = body["default_connected_app_name"]
    if "default_connected_app_logo" in body:
        user_update["connected_app_logo"] = body["default_connected_app_logo"]
    if user_update:
        result = await db.users.update_many(
            {"role": UserRole.USER},
            {"$set": user_update}
        )
        logger.info(f"Updated connected app for {result.modified_count} users")
    
    # Audit log
    audit_details = {k: v for k, v in update_data.items() if k != "resend_api_key"}
    if body.get("resend_api_key"):
        audit_details["resend_api_key"] = "***updated***"
    
    await log_audit(
        admin_id=admin["user_id"],
        admin_email=admin["email"],
        action="settings_updated",
        target_type="system",
        target_id="system_settings",
        details=audit_details,
        ip_address=request.client.host if request and request.client else None
    )
    
    return {"ok": True, "message": "Settings updated"}



@api_router.post("/admin/upload-logo")
async def admin_upload_logo(request: Request, admin: dict = Depends(require_superadmin)):
    """Upload a connected app logo image, store as base64 data URI."""
    form = await request.form()
    file = form.get("file")
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:  # 2MB limit
        raise HTTPException(status_code=400, detail="File too large (max 2MB)")
    
    content_type = file.content_type or "image/png"
    b64 = base64.b64encode(content).decode("utf-8")
    data_uri = f"data:{content_type};base64,{b64}"
    
    return {"ok": True, "data": {"url": data_uri}}



@api_router.post("/admin/migrate-user-dates")
async def migrate_user_dates(admin: dict = Depends(require_admin)):
    """Backfill transaction_start_date / transaction_end_date for users missing them."""
    users = await db.users.find(
        {"role": UserRole.USER, "$or": [
            {"transaction_start_date": {"$exists": False}},
            {"transaction_start_date": None},
            {"transaction_start_date": ""},
            {"transaction_end_date": {"$exists": False}},
            {"transaction_end_date": None},
            {"transaction_end_date": ""},
        ]},
        {"_id": 0, "id": 1}
    ).to_list(10000)
    updated = 0
    for u in users:
        gen_txs = await db.transactions.find(
            {"user_id": u["id"], "status": {"$ne": "failed"}},
            {"_id": 0, "transaction_date": 1}
        ).sort("transaction_date", 1).to_list(10000)
        if gen_txs:
            sd = gen_txs[0].get("transaction_date", "")[:10]
            ed = gen_txs[-1].get("transaction_date", "")[:10]
            if sd and ed:
                await db.users.update_one({"id": u["id"]}, {"$set": {
                    "transaction_start_date": sd,
                    "transaction_end_date": ed
                }})
                updated += 1
    return {"ok": True, "updated": updated, "checked": len(users)}


# --- Admin Dashboard Stats ---

@api_router.get("/admin/stats")
async def admin_get_stats(admin: dict = Depends(require_admin)):
    """Get dashboard statistics (admin only)"""
    
    total_users = await db.users.count_documents({"role": UserRole.USER})
    active_users = await db.users.count_documents({"role": UserRole.USER, "account_status": AccountStatus.ACTIVE})
    frozen_users = await db.users.count_documents({"role": UserRole.USER, "account_status": AccountStatus.FROZEN})
    pending_kyc = await db.kyc_documents.count_documents({"status": {"$in": [KYCStatus.PENDING, KYCStatus.UNDER_REVIEW]}})
    total_transactions = await db.transactions.count_documents({})
    
    # Calculate total balances
    wallets = await db.wallets.find({}, {"_id": 0}).to_list(10000)
    total_usdc = sum((Decimal(w.get("balance", "0") or "0") for w in wallets if w.get("asset") == "USDC"), Decimal("0"))
    total_eur = sum((Decimal(w.get("balance", "0") or "0") for w in wallets if w.get("asset") == "EUR"), Decimal("0"))
    
    # Calculate total unpaid fees
    users_with_fees = await db.users.find({"total_unpaid_fees": {"$ne": "0.00"}}, {"_id": 0}).to_list(10000)
    total_unpaid_fees = sum((Decimal(u.get("total_unpaid_fees", "0") or "0") for u in users_with_fees), Decimal("0"))
    
    # Users registered today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    users_today = await db.users.count_documents({"role": UserRole.USER, "created_at": {"$gte": today_start}})
    
    # Calculate total paid fees (sum of fee on all fee_paid=True transactions)
    paid_fee_txs = await db.transactions.find({"fee_paid": True, "fee": {"$ne": "0.00"}}, {"_id": 0, "fee": 1}).to_list(100000)
    total_paid_fees = sum((Decimal(tx.get("fee", "0") or "0") for tx in paid_fee_txs), Decimal("0"))
    
    # Calculate fees paid today
    today_paid_txs = await db.transactions.find(
        {"fee_paid": True, "fee": {"$ne": "0.00"}, "fee_paid_at": {"$gte": today_start}},
        {"_id": 0, "fee": 1}
    ).to_list(100000)
    fees_paid_today = sum((Decimal(tx.get("fee", "0") or "0") for tx in today_paid_txs), Decimal("0"))
    
    return {
        "ok": True,
        "data": {
            "total_users": total_users,
            "active_users": active_users,
            "frozen_users": frozen_users,
            "pending_kyc": pending_kyc,
            "total_transactions": total_transactions,
            "total_usdc_balance": str(total_usdc.quantize(Decimal("0.01"))),
            "total_eur_balance": str(total_eur.quantize(Decimal("0.01"))),
            "total_unpaid_fees": str(total_unpaid_fees.quantize(Decimal("0.01"))),
            "total_paid_fees": str(total_paid_fees.quantize(Decimal("0.01"))),
            "fees_paid_today": str(fees_paid_today.quantize(Decimal("0.01"))),
            "users_today": users_today
        }
    }


# ============== ADMIN BADGE SYSTEM ==============

def _strip_tz(ts: str) -> str:
    """Strip timezone suffix from ISO timestamp for consistent string comparison."""
    if ts.endswith("+00:00"):
        return ts[:-6]
    if ts.endswith("Z"):
        return ts[:-1]
    return ts


@api_router.get("/admin/badges")
async def admin_get_badges(admin: dict = Depends(require_admin)):
    """Get unread badge counts for admin sidebar sections"""
    admin_id = admin["user_id"]
    
    # Get last-seen counts for each section
    seen_docs = await db.admin_section_seen.find({"admin_id": admin_id}, {"_id": 0}).to_list(10)
    seen_map = {d["section"]: d.get("last_count", 0) for d in seen_docs}
    
    # Users: total non-admin users minus last seen count
    total_users = await db.users.count_documents({"role": UserRole.USER})
    new_users = max(0, total_users - seen_map.get("users", 0))
    
    # KYC: total KYC docs minus last seen count
    total_kyc = await db.kyc_documents.count_documents({})
    new_kyc = max(0, total_kyc - seen_map.get("kyc", 0))
    
    # Transactions: total real transactions (exclude generated history) minus last seen count
    total_tx = await db.transactions.count_documents({"created_by_admin": {"$ne": True}})
    new_tx = max(0, total_tx - seen_map.get("transactions", 0))
    
    return {
        "ok": True,
        "data": {
            "users": new_users,
            "kyc": new_kyc,
            "transactions": new_tx
        }
    }

@api_router.put("/admin/badges/{section}/mark-read")
async def admin_mark_section_read(section: str, admin: dict = Depends(require_admin)):
    """Mark an admin sidebar section as read (persisted in DB)"""
    if section not in ("users", "kyc", "transactions"):
        raise HTTPException(status_code=400, detail="Invalid section")
    
    admin_id = admin["user_id"]
    
    # Store current total count for this section
    if section == "transactions":
        count = await db.transactions.count_documents({"created_by_admin": {"$ne": True}})
    elif section == "users":
        count = await db.users.count_documents({"role": UserRole.USER})
    elif section == "kyc":
        count = await db.kyc_documents.count_documents({})
    else:
        count = 0
    
    await db.admin_section_seen.update_one(
        {"admin_id": admin_id, "section": section},
        {"$set": {"admin_id": admin_id, "section": section, "last_count": count}},
        upsert=True
    )
    
    return {"ok": True}

# ============== SSE STREAM ==============

@api_router.get("/events/stream")
async def sse_stream(token: str = Query(...)):
    """Server-Sent Events stream for real-time user updates."""
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    async def generator():
        queue: asyncio.Queue = asyncio.Queue()
        user_event_queues[user_id].append(queue)
        try:
            yield f"data: {json.dumps({'type': 'connected'})}\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=25)
                    yield f"data: {event}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            try:
                user_event_queues[user_id].remove(queue)
            except ValueError:
                pass

    return StreamingResponse(generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no",
    })


# ============== USER WALLET ACTIONS ==============

async def _complete_transaction_after_delay(tx_id: str, user_id: str, delay_seconds: int = 120):
    """Background task: mark a transaction as completed after a delay and push SSE."""
    await asyncio.sleep(delay_seconds)
    try:
        result = await db.transactions.find_one_and_update(
            {"id": tx_id, "status": "processing"},
            {"$set": {"status": "completed"}},
            return_document=True
        )
        if result:
            logger.info(f"Transaction {tx_id} auto-completed after {delay_seconds}s")
            # SSE push so the user's dashboard updates in real time
            await notify_user(user_id, "transaction_completed", {"transaction_id": tx_id})
            # Send completion email
            try:
                user = await get_user_by_id(user_id)
                if user:
                    lang = user.get("preferred_language", "en")
                    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get('username', 'User')
                    tx_type = result.get("type", "send")
                    asset = result.get("asset", "USDC")
                    amount = result.get("amount", "0")
                    desc = result.get("description", "")
                    subj, body_html = get_email_service().get_transaction_notification_email(
                        user_name=user_name, tx_type=tx_type, amount=amount, asset=asset,
                        tx_date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
                        description=desc, lang=lang, status="completed"
                    )
                    await get_email_service().send_email(user["email"], subj, body_html)
            except Exception as email_err:
                logger.error(f"Failed to send completion email for tx {tx_id}: {email_err}")
    except Exception as e:
        logger.error(f"Failed to auto-complete transaction {tx_id}: {e}")


# pydantic BaseModel imported at top

class SendRequest(BaseModel):
    amount: str
    destination_address: str


@api_router.post("/wallet/send")
async def wallet_send(req: SendRequest, current_user: dict = Depends(get_current_user)):
    """
    Send USDC to another wallet address.
    Only the available balance (from paid-fee or zero-fee transactions) can be sent.
    Creates a transaction in 'processing' status that auto-completes after 2 minutes.
    """
    user_id = current_user["user_id"]
    user = await get_user_by_id(user_id)

    # Block if account is frozen
    if user.get("freeze_type", "none") != "none":
        msg = "Account congelato. Impossibile inviare fondi." if user.get("preferred_language") == "it" else "Account is frozen. Cannot send funds."
        raise HTTPException(status_code=403, detail=msg)

    amount = Decimal(req.amount)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero.")

    # Get USDC wallet
    wallet = await db.wallets.find_one({"user_id": user_id, "asset": "USDC"}, {"_id": 0})
    if not wallet:
        raise HTTPException(status_code=404, detail="USDC wallet not found.")

    wallet_balance = Decimal(str(wallet["balance"]))

    # Calculate available balance: inflows (paid-fee/zero-fee) minus outflows
    inflow_txs = await db.transactions.find({
        "user_id": user_id, "asset": "USDC",
        "type": {"$in": ["deposit", "receive", "swap"]},
        "status": {"$in": ["completed", "processing"]},
        "$or": [{"fee_paid": True}, {"fee": "0.00"}, {"fee": "0"}]
    }, {"_id": 0, "amount": 1}).to_list(100000)
    outflow_txs = await db.transactions.find({
        "user_id": user_id, "asset": "USDC",
        "type": {"$in": ["send", "withdrawal"]},
        "status": {"$in": ["completed", "processing"]},
    }, {"_id": 0, "amount": 1}).to_list(100000)
    available = max(
        sum((Decimal(str(t["amount"])) for t in inflow_txs), Decimal("0"))
        - sum((Decimal(str(t["amount"])) for t in outflow_txs), Decimal("0")),
        Decimal("0")
    )
    available = min(available, wallet_balance)

    if amount > available:
        if user.get("preferred_language") == "it":
            msg = f"L'importo {amount} supera il saldo disponibile {available}. Solo i fondi da transazioni con commissioni pagate possono essere inviati."
        else:
            msg = f"Amount {amount} exceeds available balance {available}. Only funds from fee-paid transactions can be sent."
        raise HTTPException(status_code=400, detail=msg)

    # Deduct from wallet balance immediately
    new_balance = wallet_balance - amount
    await db.wallets.update_one(
        {"id": wallet["id"]},
        {"$set": {"balance": str(new_balance.quantize(Decimal("0.01")))}}
    )

    # Save the destination address to the user record for admin reference
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "last_send_destination": req.destination_address,
            "last_send_amount": req.amount,
            "last_send_date": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    # Create send transaction with 'processing' status
    import secrets
    fake_hash = "0x" + secrets.token_hex(32)
    tx = Transaction(
        user_id=user_id,
        wallet_id=wallet["id"],
        type="send",
        asset="USDC",
        amount=req.amount,
        fee="0.00",
        fee_paid=True,
        status=TransactionStatus.PROCESSING,
        description=f"Sent to {req.destination_address}",
        reference=f"SND{datetime.now().strftime('%Y%m%d%H%M%S')}",
        tx_hash=fake_hash,
        counterparty_address=req.destination_address,
        transaction_date=datetime.now(timezone.utc).isoformat(),
        created_by_admin=False,
    )
    await db.transactions.insert_one(tx.model_dump())

    # Push SSE so dashboard updates
    await notify_user(user_id, "transaction_created", {
        "transaction_id": tx.id, "type": "send", "amount": req.amount, "status": "processing"
    })

    # Schedule auto-complete after 2 minutes
    asyncio.create_task(_complete_transaction_after_delay(tx.id, user_id, delay_seconds=120))

    # Send confirmation email
    lang = user.get("preferred_language", "en")
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get('username', 'User')
    subj, body_html = get_email_service().get_transaction_notification_email(
        user_name=user_name, tx_type="send", amount=req.amount, asset="USDC",
        tx_date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        description=f"To: {req.destination_address}",
        lang=lang, status="processing"
    )
    asyncio.create_task(get_email_service().send_email(user["email"], subj, body_html))

    logger.info(f"User {user_id} sent {req.amount} USDC to {req.destination_address} (tx={tx.id}, status=processing)")

    return {
        "ok": True,
        "data": {
            "transaction": tx.model_dump(),
            "new_balance": str(new_balance.quantize(Decimal("0.01"))),
            "message": "Transaction is being processed. It will be completed in approximately 2 minutes."
        }
    }


# ── Swap (USDC ↔ EUR) ──────────────────────────────────────────────

SWAP_COMMISSION = Decimal("0.002")  # 0.2 %

# ── Live Exchange Rate (CoinGecko) ─────────────────────────────────
import httpx

_rate_cache = {"base_rate": None, "rate_24h_ago": None, "last_fetched": None, "change_24h_pct": 0.0}
RATE_CACHE_TTL = 3600  # Fetch base rate from ECB every hour

def _market_fluctuation(base_rate: float) -> float:
    """Add realistic market micro-fluctuation to the base ECB rate.
    Uses time-based deterministic noise so all users see the same rate.
    Updates every 60 seconds for smooth, realistic movement."""
    import math
    now = datetime.now(timezone.utc)
    # Create a seed from current 1-minute window
    seed = int(now.timestamp()) // 60
    # Multiple sine waves at different frequencies for natural-looking fluctuation
    t = seed * 0.07
    noise = (math.sin(t * 2.1) * 0.0005 + 
             math.sin(t * 5.7) * 0.0003 + 
             math.sin(t * 0.3) * 0.0008 +
             math.sin(t * 13.3) * 0.0002 +
             math.sin(t * 0.7) * 0.0004)
    # Clamp fluctuation to ±0.25% of base rate
    max_delta = base_rate * 0.0025
    noise = max(-max_delta, min(max_delta, noise))
    return round(base_rate + noise, 6)

async def get_live_usdc_eur_rate() -> dict:
    """Fetch USDC/EUR rate: real ECB base rate + realistic market fluctuations every minute."""
    now = datetime.now(timezone.utc)
    
    # Fetch fresh base rate from ECB if cache expired (every hour)
    if (_rate_cache["base_rate"] is None or 
        _rate_cache["last_fetched"] is None or
        (now - _rate_cache["last_fetched"]).total_seconds() >= RATE_CACHE_TTL):
        
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                resp = await client.get("https://api.frankfurter.dev/v1/latest?from=USD&to=EUR")
                resp.raise_for_status()
                data = resp.json()
                new_rate = data["rates"]["EUR"]
                
                # Store previous rate for 24h change before updating
                if _rate_cache["base_rate"] is not None and _rate_cache["base_rate"] != new_rate:
                    _rate_cache["rate_24h_ago"] = _rate_cache["base_rate"]
                
                _rate_cache["base_rate"] = new_rate
                _rate_cache["last_fetched"] = now
                logger.info(f"Updated ECB base rate: {new_rate}")
                
                # Fetch yesterday's rate for 24h change if we don't have one
                if not _rate_cache.get("rate_24h_ago"):
                    try:
                        yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
                        resp2 = await client.get(f"https://api.frankfurter.dev/v1/{yesterday}?from=USD&to=EUR")
                        resp2.raise_for_status()
                        _rate_cache["rate_24h_ago"] = resp2.json()["rates"]["EUR"]
                    except Exception:
                        pass
            except Exception as e:
                logger.warning(f"Frankfurter API failed: {e}")
                if _rate_cache["base_rate"] is None:
                    _rate_cache["base_rate"] = 0.858  # Reasonable fallback
    
    # Apply market fluctuation to base rate
    base = _rate_cache["base_rate"]
    rate = _market_fluctuation(base)
    
    # Calculate 24h change
    change_pct = 0.0
    if _rate_cache.get("rate_24h_ago"):
        old = _rate_cache["rate_24h_ago"]
        change_pct = round(((rate - old) / old) * 100, 4)
    
    return {
        "usdc_eur": rate,
        "eur_usdc": round(1.0 / rate, 6),
        "change_24h_pct": change_pct,
    }


@api_router.get("/exchange-rate")
async def get_exchange_rate():
    """Get the current live USDC/EUR exchange rate."""
    rate_data = await get_live_usdc_eur_rate()
    return {"ok": True, "data": rate_data}


class SwapRequest(BaseModel):
    from_asset: str   # "USDC" or "EUR"
    to_asset: str     # "EUR" or "USDC"
    amount: str       # amount of from_asset to swap


@api_router.post("/wallet/swap")
async def wallet_swap(req: SwapRequest, current_user: dict = Depends(get_current_user)):
    """
    Swap between USDC and EUR.  Instant completion, 0.2 % commission.
    """
    user_id = current_user["user_id"]
    user = await get_user_by_id(user_id)

    if user.get("freeze_type", "none") != "none":
        msg = "Account congelato." if user.get("preferred_language") == "it" else "Account is frozen."
        raise HTTPException(status_code=403, detail=msg)

    from_asset = req.from_asset.upper()
    to_asset = req.to_asset.upper()
    if sorted([from_asset, to_asset]) != ["EUR", "USDC"]:
        msg = "Lo scambio è supportato solo tra USDC ed EUR." if user.get("preferred_language") == "it" else "Swap is only supported between USDC and EUR."
        raise HTTPException(status_code=400, detail=msg)

    amount = Decimal(req.amount)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero.")

    # Fetch both wallets
    from_wallet = await db.wallets.find_one({"user_id": user_id, "asset": from_asset}, {"_id": 0})
    to_wallet   = await db.wallets.find_one({"user_id": user_id, "asset": to_asset},   {"_id": 0})
    if not from_wallet or not to_wallet:
        raise HTTPException(status_code=404, detail="Wallet not found.")

    from_balance = Decimal(str(from_wallet["balance"]))
    if amount > from_balance:
        msg = f"L'importo supera il saldo {from_asset} ({from_balance})." if user.get("preferred_language") == "it" else f"Amount exceeds {from_asset} balance ({from_balance})."
        raise HTTPException(status_code=400, detail=msg)

    # Convert & apply 0.2 % commission (use live rate)
    rate_data = await get_live_usdc_eur_rate()
    if from_asset == "USDC":
        rate = Decimal(str(rate_data["usdc_eur"]))
    else:
        rate = Decimal(str(rate_data["eur_usdc"]))
    gross = (amount * rate).quantize(Decimal("0.01"))
    commission = (gross * SWAP_COMMISSION).quantize(Decimal("0.01"))
    net = gross - commission

    q = Decimal("0.01")
    new_from = (from_balance - amount).quantize(q)
    new_to   = (Decimal(str(to_wallet["balance"])) + net).quantize(q)

    # Update both wallets
    await db.wallets.update_one({"id": from_wallet["id"]}, {"$set": {"balance": str(new_from)}})
    await db.wallets.update_one({"id": to_wallet["id"]},   {"$set": {"balance": str(new_to)}})

    import secrets as _sec
    now_iso = datetime.now(timezone.utc).isoformat()

    # Record outflow transaction (from_asset)
    tx_out = Transaction(
        user_id=user_id, wallet_id=from_wallet["id"],
        type="swap", asset=from_asset, amount=str(amount),
        fee=str(commission), fee_paid=True,
        status=TransactionStatus.COMPLETED,
        description=f"Swap {amount} {from_asset} → {net} {to_asset} (0.2% commission: {commission} {to_asset})",
        reference=f"SWP{datetime.now().strftime('%Y%m%d%H%M%S')}",
        tx_hash="0x" + _sec.token_hex(32),
        transaction_date=now_iso, created_by_admin=False,
    )
    # Record inflow transaction (to_asset)
    tx_in = Transaction(
        user_id=user_id, wallet_id=to_wallet["id"],
        type="swap", asset=to_asset, amount=str(net),
        fee="0.00", fee_paid=True,
        status=TransactionStatus.COMPLETED,
        description=f"Received from swap {amount} {from_asset} → {net} {to_asset}",
        reference=tx_out.reference,
        tx_hash=tx_out.tx_hash,
        transaction_date=now_iso, created_by_admin=False,
    )

    await db.transactions.insert_many([tx_out.model_dump(), tx_in.model_dump()])

    # SSE push
    await notify_user(user_id, "swap_completed", {
        "from": from_asset, "to": to_asset,
        "amount_in": str(amount), "amount_out": str(net), "commission": str(commission),
    })

    logger.info(f"User {user_id} swapped {amount} {from_asset} → {net} {to_asset} (commission {commission})")

    # Send confirmation email
    lang = user.get("preferred_language", "en")
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get('username', 'User')
    swap_desc = f"{amount} {from_asset} → {net} {to_asset} (0.2%: {commission} {to_asset})" if lang == "en" else f"{amount} {from_asset} → {net} {to_asset} (0,2%: {commission} {to_asset})"
    subj, body_html = get_email_service().get_transaction_notification_email(
        user_name=user_name, tx_type="swap", amount=str(amount), asset=f"{from_asset} → {to_asset}",
        tx_date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        description=swap_desc, lang=lang, status="completed"
    )
    asyncio.create_task(get_email_service().send_email(user["email"], subj, body_html))

    return {
        "ok": True,
        "data": {
            "from_asset": from_asset,
            "to_asset": to_asset,
            "amount_in": str(amount),
            "amount_out": str(net),
            "rate": str(rate),
            "commission": str(commission),
            "commission_pct": "0.2%",
            "new_balances": {from_asset: str(new_from), to_asset: str(new_to)},
        }
    }


# ── EUR Withdrawal (to bank via IBAN / CHIANTIN BANK) ────────────────────

class WithdrawRequest(BaseModel):
    amount: str
    iban: str
    beneficiary_first_name: str
    beneficiary_last_name: str


@api_router.get("/wallet/withdrawal-defaults")
async def get_withdrawal_defaults(current_user: dict = Depends(get_current_user)):
    """Get the system default IBAN and SWIFT for withdrawals."""
    settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        settings = SystemSettings().model_dump()
    return {
        "ok": True,
        "data": {
            "iban": settings.get("default_withdrawal_iban", "MT29CFTE28004000000000005634364"),
            "swift": settings.get("default_withdrawal_swift", "CFTEMTM1"),
        }
    }


@api_router.post("/wallet/withdraw")
async def wallet_withdraw(req: WithdrawRequest, current_user: dict = Depends(get_current_user)):
    """
    Withdraw EUR to a bank account via IBAN (CHIANTIN BANK connected app).
    Blocked if account has any unpaid fees.
    """
    user_id = current_user["user_id"]
    user = await get_user_by_id(user_id)

    if user.get("freeze_type", "none") != "none":
        msg = "Account congelato." if user.get("preferred_language") == "it" else "Account is frozen."
        raise HTTPException(status_code=403, detail=msg)

    amount = Decimal(req.amount)
    if amount <= 0:
        msg = "L'importo deve essere maggiore di zero." if user.get("preferred_language") == "it" else "Amount must be greater than zero."
        raise HTTPException(status_code=400, detail=msg)

    # Check for unpaid fees — block if any
    unpaid = await db.transactions.find({
        "user_id": user_id, "fee_paid": False, "fee": {"$ne": "0.00"}
    }, {"_id": 0, "fee": 1}).to_list(100000)
    total_unpaid = sum((Decimal(str(t["fee"])) for t in unpaid), Decimal("0"))
    if total_unpaid > 0:
        if user.get("preferred_language") == "it":
            msg = f"Prelievo bloccato. Hai {total_unpaid.quantize(Decimal('0.01'))} EUR in commissioni in sospeso che devono essere pagate prima."
        else:
            msg = f"Withdrawal blocked. You have {total_unpaid.quantize(Decimal('0.01'))} EUR in outstanding fees that must be paid first."
        raise HTTPException(status_code=400, detail=msg)

    # Get EUR wallet
    wallet = await db.wallets.find_one({"user_id": user_id, "asset": "EUR"}, {"_id": 0})
    if not wallet:
        raise HTTPException(status_code=404, detail="EUR wallet not found.")

    eur_balance = Decimal(str(wallet["balance"]))
    if amount > eur_balance:
        msg = f"L'importo supera il saldo EUR ({eur_balance})." if user.get("preferred_language") == "it" else f"Amount exceeds EUR balance ({eur_balance})."
        raise HTTPException(status_code=400, detail=msg)

    # Validate IBAN (basic)
    iban_clean = req.iban.replace(" ", "").upper()
    if len(iban_clean) < 15:
        msg = "Inserisci un IBAN valido." if user.get("preferred_language") == "it" else "Please enter a valid IBAN."
        raise HTTPException(status_code=400, detail=msg)
    if not req.beneficiary_first_name.strip() or not req.beneficiary_last_name.strip():
        msg = "Il nome del beneficiario è obbligatorio." if user.get("preferred_language") == "it" else "Beneficiary name is required."
        raise HTTPException(status_code=400, detail=msg)

    # Deduct from wallet
    q = Decimal("0.01")
    new_balance = (eur_balance - amount).quantize(q)
    await db.wallets.update_one({"id": wallet["id"]}, {"$set": {"balance": str(new_balance)}})

    import secrets as _sec
    beneficiary = f"{req.beneficiary_first_name.strip()} {req.beneficiary_last_name.strip()}"
    tx = Transaction(
        user_id=user_id, wallet_id=wallet["id"],
        type="withdrawal", asset="EUR", amount=str(amount),
        fee="0.00", fee_paid=True,
        status=TransactionStatus.PROCESSING,
        description=f"IBAN withdrawal to {iban_clean} ({beneficiary}) via CHIANTIN BANK",
        reference=f"WDR{datetime.now().strftime('%Y%m%d%H%M%S')}",
        tx_hash="0x" + _sec.token_hex(32),
        counterparty_address=iban_clean,
        transaction_date=datetime.now(timezone.utc).isoformat(),
        created_by_admin=False,
    )
    await db.transactions.insert_one(tx.model_dump())

    # SSE push
    await notify_user(user_id, "transaction_created", {
        "transaction_id": tx.id, "type": "withdrawal", "amount": str(amount), "status": "processing"
    })

    # Auto-complete after 2 minutes
    asyncio.create_task(_complete_transaction_after_delay(tx.id, user_id, delay_seconds=120))

    # Send confirmation email
    lang = user.get("preferred_language", "en")
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or user.get('username', 'User')
    iban_desc = f"IBAN: {iban_clean} ({beneficiary})"
    subj, body_html = get_email_service().get_transaction_notification_email(
        user_name=user_name, tx_type="withdrawal", amount=str(amount), asset="EUR",
        tx_date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        description=iban_desc, lang=lang, status="processing"
    )
    asyncio.create_task(get_email_service().send_email(user["email"], subj, body_html))

    logger.info(f"User {user_id} withdrew {amount} EUR to IBAN {iban_clean} ({beneficiary})")

    return {
        "ok": True,
        "data": {
            "transaction": tx.model_dump(),
            "new_balance": str(new_balance),
            "message": "Withdrawal is being processed. Funds will be transferred to your bank account via CHIANTIN BANK within 1-3 business days."
        }
    }


# ============== NOTIFICATION ROUTES ==============

@api_router.get("/notifications")
async def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    query = {"user_id": current_user["user_id"]}
    total = await db.notifications.count_documents(query)
    skip = (page - 1) * page_size
    notifs = await db.notifications.find(query, {"_id": 0})\
        .sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
    return {"ok": True, "data": {"notifications": notifs, "total": total, "page": page}}


@api_router.get("/notifications/unread-count")
async def get_unread_notification_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({"user_id": current_user["user_id"], "read": False})
    return {"ok": True, "data": {"unread_count": count}}


@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["user_id"]},
        {"$set": {"read": True}}
    )
    return {"ok": True, "message": "Notification marked as read"}


@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": current_user["user_id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"ok": True, "message": "All notifications marked as read"}


# ============== AVAILABLE BALANCE & ELIGIBILITY ==============

@api_router.get("/wallet/available-balance")
async def get_available_balance(current_user: dict = Depends(get_current_user)):
    """
    Available = (sum of deposit/receive amounts where fee is paid or zero)
              - (sum of send/withdrawal amounts)
    Capped at [0, wallet_balance].
    """
    inflow_types = {"deposit", "receive"}
    outflow_types = {"send", "withdrawal"}
    wallets = await db.wallets.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(10)
    result = {}
    q = Decimal("0.01")
    for w in wallets:
        asset = w["asset"]
        total = Decimal(str(w.get("balance", "0")))

        # Inflows with paid / zero fee
        inflow_txs = await db.transactions.find({
            "user_id": current_user["user_id"],
            "asset": asset,
            "type": {"$in": list(inflow_types)},
            "status": {"$in": ["completed", "processing"]},
            "$or": [{"fee_paid": True}, {"fee": "0.00"}, {"fee": "0"}]
        }, {"_id": 0, "amount": 1}).to_list(100000)
        inflow_sum = sum((Decimal(str(t["amount"])) for t in inflow_txs), Decimal("0"))

        # All outflows (sends / withdrawals) regardless of fee status
        outflow_txs = await db.transactions.find({
            "user_id": current_user["user_id"],
            "asset": asset,
            "type": {"$in": list(outflow_types)},
            "status": {"$in": ["completed", "processing"]},
        }, {"_id": 0, "amount": 1}).to_list(100000)
        outflow_sum = sum((Decimal(str(t["amount"])) for t in outflow_txs), Decimal("0"))

        available = max(inflow_sum - outflow_sum, Decimal("0"))
        available = min(available, total)
        locked = max(total - available, Decimal("0"))
        result[asset] = {
            "total": str(total.quantize(q)),
            "available": str(available.quantize(q)),
            "locked": str(locked.quantize(q))
        }
    return {"ok": True, "data": result}


@api_router.get("/wallet/action-eligibility")
async def check_action_eligibility(current_user: dict = Depends(get_current_user)):
    """
    Check what actions the user is eligible for (send, withdraw, swap).
    Returns detailed eligibility and reasons for each action + asset.
    """
    user = await get_user_by_id(current_user["user_id"])
    wallets = await db.wallets.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(10)
    wallet_map = {w["asset"]: w for w in wallets}

    # Check for unpaid fees - user-level field is authoritative (admin controls this)
    user_fees_paid = user.get("fees_paid", True)
    user_total_unpaid = Decimal(str(user.get("total_unpaid_fees", "0")))
    total_unpaid_fees = user_total_unpaid
    has_unpaid_fees = not user_fees_paid and user_total_unpaid > 0

    lang = user.get("preferred_language", "en")

    # Frozen account blocks everything
    if user.get("freeze_type", "none") != "none":
        frozen_reason = "Account congelato. Risolvi prima le restrizioni." if lang == "it" else "Account is frozen. Please resolve account restrictions first."
        return {"ok": True, "data": {
            "send": {"allowed": False, "reason": frozen_reason},
            "withdraw_usdc": {"allowed": False, "reason": frozen_reason},
            "withdraw_eur": {"allowed": False, "reason": frozen_reason},
            "swap": {"allowed": False, "reason": frozen_reason},
        }}

    q = Decimal("0.01")
    # Calculate available USDC: inflows (paid-fee) - outflows (swaps excluded from inflows)
    usdc_total = Decimal(str(wallet_map.get("USDC", {}).get("balance", "0")))
    inflow_txs = await db.transactions.find({
        "user_id": current_user["user_id"], "asset": "USDC",
        "type": {"$in": ["deposit", "receive"]},
        "status": {"$in": ["completed", "processing"]},
        "$or": [{"fee_paid": True}, {"fee": "0.00"}, {"fee": "0"}]
    }, {"_id": 0, "amount": 1}).to_list(100000)
    outflow_txs = await db.transactions.find({
        "user_id": current_user["user_id"], "asset": "USDC",
        "type": {"$in": ["send", "withdrawal"]},
        "status": {"$in": ["completed", "processing"]},
    }, {"_id": 0, "amount": 1}).to_list(100000)
    usdc_available = max(
        sum((Decimal(str(t["amount"])) for t in inflow_txs), Decimal("0"))
        - sum((Decimal(str(t["amount"])) for t in outflow_txs), Decimal("0")),
        Decimal("0")
    )
    usdc_available = min(usdc_available, usdc_total)

    eur_total = Decimal(str(wallet_map.get("EUR", {}).get("balance", "0")))

    eligibility = {}

    # Send (wallet-to-wallet USDC only)
    if usdc_available > 0:
        eligibility["send"] = {"allowed": True, "max_amount": str(usdc_available.quantize(q)), "asset": "USDC"}
    else:
        send_reason = "Nessun saldo USDC disponibile. Gli importi da transazioni con commissioni non pagate non possono essere inviati." if lang == "it" else "No available USDC balance. Amounts from transactions with unpaid fees cannot be sent."
        eligibility["send"] = {"allowed": False, "reason": send_reason}

    # Withdraw USDC
    if usdc_available > 0:
        eligibility["withdraw_usdc"] = {"allowed": True, "max_amount": str(usdc_available.quantize(q))}
    else:
        wusdc_reason = "Nessun saldo USDC disponibile." if lang == "it" else "No available USDC balance."
        eligibility["withdraw_usdc"] = {"allowed": False, "reason": wusdc_reason}

    # Swap — allowed if user has ANY balance in either USDC or EUR
    if usdc_total > 0 or eur_total > 0:
        eligibility["swap"] = {
            "allowed": True,
            "usdc_balance": str(usdc_total.quantize(q)),
            "eur_balance": str(eur_total.quantize(q)),
        }
    else:
        swap_reason = "Nessun saldo da scambiare." if lang == "it" else "No balance to swap."
        eligibility["swap"] = {"allowed": False, "reason": swap_reason}

    # Withdraw EUR — always allow opening modal if EUR > 0, show fees prompt inside modal
    if eur_total > 0:
        if has_unpaid_fees:
            fees_reason = f"Il prelievo EUR è bloccato fino al pagamento di tutte le commissioni in sospeso ({total_unpaid_fees.quantize(q)} EUR)." if lang == "it" else f"EUR withdrawal is blocked until all outstanding fees ({total_unpaid_fees.quantize(q)} EUR) are paid."
            eligibility["withdraw_eur"] = {
                "allowed": True,
                "blocked_by_fees": True,
                "max_amount": str(eur_total.quantize(q)),
                "total_unpaid_fees": str(total_unpaid_fees.quantize(q)),
                "reason": fees_reason
            }
        else:
            eur_msg = "Il prelievo EUR è disponibile tramite IBAN attraverso la tua app collegata CHIANTIN BANK." if lang == "it" else "EUR withdrawal is available via IBAN through your connected app CHIANTIN BANK."
            eligibility["withdraw_eur"] = {
                "allowed": True,
                "blocked_by_fees": False,
                "max_amount": str(eur_total.quantize(q)),
                "method": "iban",
                "message": eur_msg
            }
    else:
        noeur_reason = "Nessun saldo EUR da prelevare." if lang == "it" else "No EUR balance to withdraw."
        eligibility["withdraw_eur"] = {"allowed": False, "reason": noeur_reason}

    return {"ok": True, "data": eligibility}


# ── Email Unsubscribe (required for anti-spam compliance) ───────────

@api_router.get("/unsubscribe")
@api_router.post("/unsubscribe")
async def email_unsubscribe(email: str = Query(default="")):
    """Handle email unsubscribe requests (List-Unsubscribe header compliance)."""
    if email:
        await db.users.update_one(
            {"email": email},
            {"$set": {"email_unsubscribed": True}}
        )
        logger.info(f"User {email} unsubscribed from emails")
    return {"ok": True, "message": "You have been unsubscribed from promotional emails."}


# ============== TEMPORARY MIGRATION ENDPOINT ==============

@api_router.post("/migrate/import")
async def migrate_import(request: Request):
    """Temporary endpoint to import data from preview to production"""
    body = await request.json()
    secret = body.get("secret")
    if secret != "migrate-2026-secure":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    collection_name = body.get("collection")
    documents = body.get("documents", [])
    drop_first = body.get("drop_first", False)
    
    if not collection_name or not documents:
        return {"error": "Missing collection or documents"}
    
    col = db[collection_name]
    
    # Only drop on first chunk
    if drop_first:
        await col.delete_many({})
    
    # Clean documents - remove $oid and $date wrappers from bson json_util format
    def clean_doc(doc):
        if isinstance(doc, dict):
            if "$oid" in doc:
                return doc["$oid"]
            if "$date" in doc:
                return doc["$date"]
            return {k: clean_doc(v) for k, v in doc.items()}
        elif isinstance(doc, list):
            return [clean_doc(item) for item in doc]
        return doc
    
    cleaned = [clean_doc(d) for d in documents]
    
    # Remove _id fields to let MongoDB generate new ones
    for d in cleaned:
        if "_id" in d:
            del d["_id"]
    
    if cleaned:
        await col.insert_many(cleaned)
    
    return {"ok": True, "collection": collection_name, "imported": len(cleaned)}



# ============== MARKET DATA (REAL-TIME PRICES) ==============

import httpx as _httpx
import time as _time

# Simple in-memory cache for market data
_market_cache = {"data": None, "timestamp": 0, "ttl": 60}  # 60 second TTL

COINGECKO_IDS = {
    "bitcoin": "BTC",
    "ethereum": "ETH",
    "tether": "USDT",
    "binancecoin": "BNB",
    "cardano": "ADA",
    "solana": "SOL",
    "ripple": "XRP",
    "polkadot": "DOT",
}

@api_router.get("/market/prices")
async def get_market_prices():
    """Get real-time cryptocurrency prices from CoinGecko (cached 60s)."""
    now = _time.time()
    
    # Return cached data if still fresh
    if _market_cache["data"] and (now - _market_cache["timestamp"]) < _market_cache["ttl"]:
        return {"ok": True, "data": _market_cache["data"], "cached": True}
    
    try:
        coin_ids = ",".join(COINGECKO_IDS.keys())
        url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={coin_ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h"
        
        async with _httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers={
                "Accept": "application/json",
                "User-Agent": "UniswapV4-Platform/1.0"
            })
            resp.raise_for_status()
            raw_data = resp.json()
        
        # Transform to our format
        prices = []
        for coin in raw_data:
            symbol = COINGECKO_IDS.get(coin.get("id", ""), coin.get("symbol", "").upper())
            prices.append({
                "symbol": symbol,
                "name": coin.get("name", ""),
                "price": round(coin.get("current_price", 0), 2),
                "change_24h": round(coin.get("price_change_percentage_24h", 0) or 0, 2),
                "high_24h": round(coin.get("high_24h", 0) or 0, 2),
                "low_24h": round(coin.get("low_24h", 0) or 0, 2),
                "volume_24h": round(coin.get("total_volume", 0) or 0, 0),
                "market_cap": round(coin.get("market_cap", 0) or 0, 0),
                "image": coin.get("image", ""),
                "last_updated": coin.get("last_updated", ""),
            })
        
        # Sort by market cap (same order as input)
        symbol_order = list(COINGECKO_IDS.values())
        prices.sort(key=lambda x: symbol_order.index(x["symbol"]) if x["symbol"] in symbol_order else 999)
        
        _market_cache["data"] = prices
        _market_cache["timestamp"] = now
        
        return {"ok": True, "data": prices, "cached": False}
    
    except Exception as e:
        logger.error(f"Failed to fetch market data: {e}")
        # Return stale cache if available
        if _market_cache["data"]:
            return {"ok": True, "data": _market_cache["data"], "cached": True, "stale": True}
        # Fallback static data
        return {"ok": True, "data": [], "error": "Unable to fetch live prices"}


# Reverse lookup: symbol → coingecko id
_SYMBOL_TO_CG = {v: k for k, v in COINGECKO_IDS.items()}

# Coin detail cache (per-coin, 120s TTL)
_coin_detail_cache = {}

@api_router.get("/market/coin/{symbol}")
async def get_coin_detail(symbol: str):
    """Get detailed info for a single coin including price history."""
    symbol = symbol.upper()
    cg_id = _SYMBOL_TO_CG.get(symbol)
    if not cg_id:
        raise HTTPException(status_code=404, detail=f"Coin {symbol} not found")
    
    now = _time.time()
    cached = _coin_detail_cache.get(symbol)
    if cached and (now - cached["ts"]) < 120:
        return {"ok": True, "data": cached["data"], "cached": True}
    
    try:
        async with _httpx.AsyncClient(timeout=10.0) as client:
            # Fetch coin detail + 7-day sparkline
            detail_url = f"https://api.coingecko.com/api/v3/coins/{cg_id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true"
            resp = await client.get(detail_url, headers={"Accept": "application/json", "User-Agent": "UniswapV4-Platform/1.0"})
            resp.raise_for_status()
            coin = resp.json()
        
        md = coin.get("market_data", {})
        result = {
            "symbol": symbol,
            "name": coin.get("name", ""),
            "description": (coin.get("description", {}).get("en", "") or "")[:500],
            "image": coin.get("image", {}).get("large", ""),
            "price": md.get("current_price", {}).get("usd", 0),
            "change_24h": round(md.get("price_change_percentage_24h", 0) or 0, 2),
            "change_7d": round(md.get("price_change_percentage_7d", 0) or 0, 2),
            "high_24h": md.get("high_24h", {}).get("usd", 0),
            "low_24h": md.get("low_24h", {}).get("usd", 0),
            "market_cap": md.get("market_cap", {}).get("usd", 0),
            "volume_24h": md.get("total_volume", {}).get("usd", 0),
            "circulating_supply": md.get("circulating_supply", 0),
            "total_supply": md.get("total_supply", 0),
            "ath": md.get("ath", {}).get("usd", 0),
            "atl": md.get("atl", {}).get("usd", 0),
            "sparkline_7d": md.get("sparkline_7d", {}).get("price", []),
        }
        
        _coin_detail_cache[symbol] = {"data": result, "ts": now}
        return {"ok": True, "data": result}
    
    except Exception as e:
        logger.error(f"Failed to fetch coin detail for {symbol}: {e}")
        if cached:
            return {"ok": True, "data": cached["data"], "cached": True, "stale": True}
        raise HTTPException(status_code=502, detail="Failed to fetch coin data")


# ============== HEALTH CHECK (root level for K8s) ==============

@app.get("/health")
async def root_health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ============== INCLUDE ROUTER ==============

app.include_router(api_router)

# ============== CORS ==============

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Refreshed-Token"],
)

# ============== ROOT HEALTH CHECK (root level for K8s) ==============


app.include_router(api_router)

# ============== CORS ==============

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Refreshed-Token"],
)
