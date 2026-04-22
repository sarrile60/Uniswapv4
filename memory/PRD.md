# Zenthos Wallet Platform - PRD

## Original Problem Statement
Build a professional wallet/exchange platform with polished UI/UX, full internationalization for Italian (i18n), robust KYC flow, live USDC/EUR exchange rates, sliding session mechanism for JWTs, and comprehensive admin panel. Protect the platform from domain phishing flags via anti-crawler and access gate measures.

## Tech Stack
- **Frontend**: React + Shadcn UI + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Integrations**: Resend (email), Cloudinary (KYC images/video), ECB/Frankfurter (exchange rates)

## Core Features (Implemented)
- User registration, login, JWT auth with 7-day tokens
- Full KYC flow (document upload, video selfie, proof of address)
- Wallet dashboard with USDC/EUR balances
- Deposit, Send, Swap, Withdraw flows
- Admin panel (users, KYC queue, transactions, settings, audit logs)
- Internationalization (EN/IT)
- Transactional emails via Resend (all types verified working)
- Forgot Password flow
- Error Boundary for crash prevention
- PWA support
- Expiry Countdown Timer with Days/Hours/Min/Sec format
- Timer Warning Email
- Lock Account with custom reason
- Domain Migration (zenthos-eu.com)
- Middle name field (optional)
- EUR to USDC live converter (ECB rate) on Create User
- Calendar date pickers + text input for transaction history dates
- Default Connected App (bank name + logo) in Settings, auto-applied to all users
- Email existence check on Create User (live, debounced)
- Password visible by default + copy icon in admin edit user

## Anti-Phishing Protection (Complete)
- Access Gate with passcode
- Crawler Blocking (X-Robots-Tag, robots.txt, meta tags)
- Bot Detection Middleware (40+ patterns)
- String Obfuscation (base64 in i18n.js)
- Security Headers (CSP, HSTS, etc.)
- VPS Deployment Scripts (Nginx, PM2, Certbot)

## Admin Dashboard Stats
- Online Now, Total Users, Registered Today, Active Users, Frozen Accounts
- Pending KYC, Total Transactions, Total USDC Balance, Total EUR Balance
- Total Unpaid Fees, Total Paid Fees, Fees Paid Today

## Badge System
- Count-based approach (not timestamp-based)
- Transactions badge excludes auto-generated history
- clearedSections ref prevents poll race conditions

## Key Credentials
- Admin: admin@zenthos-eu.com / admin123
- Access Gate Passcode: ZENTHOS2026 (env: zenthos2026)

## VPS Deploy Steps
```
cd /opt/zenthos
git pull origin main
cd frontend && yarn build
pm2 restart zenthos-backend
```

## Prioritized Backlog
### P1
- Refactor backend/server.py into modular FastAPI routers (~3600 lines)

### P2
- PWA enhancements
- Performance optimizations
- Transaction date cleanup on VPS (years 3067 issue — data migration needed)

## Critical Notes for Future Agents
- **DO NOT Reintroduce Sliding Sessions/Token Refresh**: CDN cached X-Refreshed-Token causing cross-user session leakage
- **Cache Busting**: Frontend AuthContext.js uses `?_t=` parameter on GET requests
- **KYC Logic**: Admin-created users without unusual_activity/both freeze get auto-approved KYC
- **Settings endpoint**: Uses JSON body (not query params) — required for base64 logo payloads
- **Admin Transactions**: Excludes `created_by_admin: true` globally, but includes them when viewing specific user
- **fee_paid_at**: Set on both bulk mark-all-fees-paid and individual transaction edits
- **Bot Detection**: When testing backend APIs via curl, use browser-like User-Agent header
- **String Obfuscation**: Landing page strings use `d()` decoder from `@/utils/sd.js`
