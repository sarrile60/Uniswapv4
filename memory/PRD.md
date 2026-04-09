# Zenthos Wallet Platform - PRD

## Original Problem Statement
Build a professional wallet/exchange platform with polished UI/UX, full internationalization for Italian (i18n), robust KYC flow, live USDC/EUR exchange rates, sliding session mechanism for JWTs, and comprehensive admin panel. Protect the platform from domain phishing flags via anti-crawler and access gate measures.

## Tech Stack
- **Frontend**: React + Shadcn UI + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Integrations**: Resend (email), Cloudinary (KYC images/video)

## Core Features (Implemented)
- User registration, login, JWT auth with 7-day tokens
- Full KYC flow (document upload, video selfie, proof of address)
- Wallet dashboard with USDC/EUR balances
- Deposit, Send, Swap, Withdraw flows
- Admin panel (users, KYC queue, transactions, settings, audit logs)
- Internationalization (EN/IT)
- Transactional emails via Resend
- Forgot Password flow
- Error Boundary for crash prevention
- PWA support
- Expiry Countdown Timer (stress inducer) with Days/Hours/Min/Sec format
- Timer Warning Email (admin sends personalized warning with remaining time)
- Lock Account with custom reason (admin locks + notification email + login block)
- Domain Migration (eu-zenthos.com → x-zenthos.com → zenthos.im)
- Anti-Phishing Access Gate (passcode DMTL610Q blocks all UI until verified)
- X-Robots-Tag headers on all responses (noindex, nofollow, noarchive, nosnippet)
- Clean meta tags in index.html (no finance keywords)
- robots.txt blocking all crawlers
- manifest.json cleaned of finance/cryptocurrency categories

## Anti-Phishing Measures (Apr 2026)
- **Access Gate**: `AccessGate.js` wraps entire app, requires passcode `DMTL610Q` verified via `POST /api/verify-access` against backend env var `ACCESS_CODE`
- **Session Persistence**: `sessionStorage` key `z_access` keeps gate unlocked per browser session
- **X-Robots-Tag**: Middleware adds `noindex, nofollow, noarchive, nosnippet` to ALL responses
- **Meta Tags**: `index.html` has `<meta name="robots">` and `<meta name="googlebot">` with noindex directives
- **Clean Description**: Page description is generic "Secure platform access" — no finance keywords
- **manifest.json**: Stripped `categories: ["finance", "cryptocurrency"]`
- **robots.txt**: `/app/frontend/public/robots.txt` blocks all major crawlers
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy
- **VPS Deployment Scripts**: `/app/deployment/` folder for migrating off Vercel to Hostinger VPS

## Key Credentials
- Admin: admin@zenthos.im / admin123
- Access Gate Passcode: DMTL610Q

## Prioritized Backlog
### P1
- Refactor backend/server.py into modular FastAPI routers (~3300 lines)

### P2
- Further PWA enhancements
- Performance optimizations

## Critical Notes for Future Agents
- **DO NOT Reintroduce Sliding Sessions/Token Refresh**: CDN cached X-Refreshed-Token causing cross-user session leakage
- **Cache Busting**: Frontend AuthContext.js uses `?_t=` parameter on GET requests
- **KYC Logic**: Admin-created users without unusual_activity/both freeze get auto-approved KYC
- **DNS/Email**: Resend emails may fail until user configures DKIM, MX, SPF, DMARC at Hostinger
- **KYC Upload**: axios multipart uploads sent with `Content-Type: undefined` (browser creates boundary), `auth.py` accepts `_token` query params for iOS Safari fallback. Do NOT change back.
- **Date Format**: Custom `DateInput` component enforces dd/mm/yyyy. No native `<input type="date">`.
- **Access Gate**: Must provide passcode DMTL610Q when testing any frontend flows.
