# UniswapV4 Platform — PRD

## Overview
A production-grade simulated crypto exchange platform branded as **Uniswap V4**, featuring real-time market data, the Rockie ThemeForest template, and a comprehensive admin panel.

## What Has Been Built

### Phase 1 — Core Platform (Previously completed)
- Full codebase with React frontend + FastAPI backend + MongoDB
- Deployment package at `/app/uniswapv4/` for Hostinger VPS
- Rockie ThemeForest template integrated for all user-facing pages
- Admin panel with original Tailwind styling (untouched)
- KYC verification, wallet management, transactions, profiles
- Resend email integration
- RBAC with superadmin/admin/user roles
- SSE real-time events

### Phase 2b — Current Session (Avatar, Session, Dark-Mode, i18n)

#### Completed Items (All Verified ✅)
1. **Avatar Initials** — When logged in, the header avatar circle shows the user's first+last initial (e.g. "SA" for System Administrator) in white bold text on blue (#3772ff) background, replacing the generic person SVG. Logged-out state keeps the generic icon.
2. **24-hour Session Timeout** — JWT `ACCESS_TOKEN_EXPIRE_HOURS` changed from 168 (7 days) → 24 hours in `auth.py`.
3. **Terms/FAQ Dark Mode Fix** — `TermsOfServicePage.js` rewritten with inline dark-friendly styles: white headings, #b1b5c3 body text, #222630 card backgrounds.
4. **Privacy Policy Dark Mode Fix** — `PrivacyPolicyPage.js` same treatment.
5. **Wallet Dashboard Bottom Nav** — Mobile bottom nav bar changed from `bg-white` to explicit dark styling (#18191d background, #23262f border).
6. **Wallet Receive Modal** — QR code container and address field updated with dark styling instead of `bg-white`/`bg-gray-100`.
7. **Language Toggle** — EN/USD dropdown in RockieHeader wired to the `useLang()` i18n hook. Clicking "English / USD" or "Italiano / EUR" calls `toggleLang()` and closes the dropdown. Button text dynamically reflects current language.

#### Bug Fixes (All Verified ✅)
1. **About Page "Z" Icon** → Replaced with 🦄 unicorn emoji with pink-purple gradient background
2. **Crypto Icons** → Replaced letter-based icons (B, E, U) with real SVG cryptocurrency logos for BTC, ETH, BNB, USDT, ADA, SOL, XRP, DOT, USDC, EUR
3. **Mobile Hamburger Menu** → Fixed CSS issue where `.left__main` was hiding the nav on mobile. Added `:has()` selector to keep parent visible when nav is active
4. **Color Visibility (About Page)** → Rewrote About page with inline dark-theme styles for consistent visibility

#### New Features (All Verified ✅)
1. **Real-time Market Data** (CoinGecko API integration)
   - Backend endpoint: `GET /api/market/prices`
   - 60-second server-side cache
   - Fetches live prices for 8 coins: BTC, ETH, USDT, BNB, ADA, SOL, XRP, DOT
   - Frontend auto-refreshes every 60 seconds
   - Graceful fallback to stale cache if API is unavailable

2. **Animated Page Transitions**
   - CSS-based fade/slide-up animation (0.35s cubic-bezier)
   - No new dependencies needed
   - Applies to all route changes

3. **Notification Bell Dropdown**
   - Replaces static bell icon with interactive dropdown
   - Shows unread count badge (red dot with number)
   - Fetches real notifications from backend API
   - "Log in to see notifications" for unauthenticated users
   - Mark-as-read functionality
   - Auto-refreshes every 30 seconds
   - Stays visible on mobile (not hidden with other header items)

4. **CryptoIcons Component** (`/app/frontend/src/components/CryptoIcons.js`)
   - Reusable SVG icon component for all major cryptocurrencies
   - Used in Landing Page and Wallet Dashboard
   - Fallback rendering for unknown symbols

## Key Files Modified/Created
| File | Change |
|------|--------|
| `/app/frontend/src/components/CryptoIcons.js` | NEW - SVG crypto icon component |
| `/app/frontend/src/components/PageTransition.js` | NEW - Page transition animation wrapper |
| `/app/frontend/src/components/RockieHeader.js` | Updated - notification dropdown, fetch logic |
| `/app/frontend/src/pages/LandingPage.js` | Updated - live market data, CryptoIcon usage |
| `/app/frontend/src/pages/LandingPage.css` | Updated - hamburger fix, notification styles |
| `/app/frontend/src/pages/AboutPage.js` | Rewritten - dark theme inline styles, 🦄 icon |
| `/app/frontend/src/pages/WalletDashboard.js` | Updated - CryptoIcon for USDC/EUR |
| `/app/frontend/src/App.js` | Updated - PageTransition wrapper |
| `/app/backend/server.py` | Updated - `/api/market/prices` endpoint |

## Tech Stack
- Frontend: React + TypeScript + Tailwind + Rockie CSS Theme
- Backend: FastAPI + MongoDB (Motor async driver)
- Real-time: SSE events, CoinGecko API (cached)
- Auth: JWT + role-based access
- Email: Resend

## Credentials
- Admin: `admin@uniswapv4.com` / `admin123`

### Phase 3 — Trade Experience, Learn Articles & BTC Icon Fix

#### Completed Items (All Verified ✅)
1. **Professional Trade Button** — Replaced both "Buy Crypto" and "Sell Crypto" dropdown menus with a single prominent blue "Trade" button in the header nav. Opens a professional Coinbase-style full-screen trade modal.
2. **Trade Modal** — Full-featured trade modal (rendered via React Portal for z-index safety) with:
   - Buy/Sell tab switcher (green buy, red sell)
   - Asset selector dropdown (BTC, ETH, SOL, BNB, ADA, XRP, DOT, USDT with icons and live prices from CoinGecko)
   - Amount input with EUR prefix and currency label
   - Live quote area showing estimated receive amount
   - "Preview Order" step with order summary (price, 0.5% fee, estimated receive)
   - Confirm step triggers "Account Under Review" notice (simulated security review block)
   - Contact Support and Close buttons on the under-review screen
   - Fully localized EN/IT, dark/light mode compatible
3. **BTC Icon Fix** — Replaced broken `₿` text symbol in header BTC ticker with a proper inline SVG Bitcoin logo (orange circle with white ₿ path). No external CDN dependency.
4. **Clickable Learn Cards** — All 6 Learn page cards now link to `/learn/:slug` with "Read article →" CTAs. Each card has a unique slug: what-is-bitcoin, what-is-ethereum, secure-your-crypto, understanding-defi, what-is-staking, nfts-explained.
5. **Learn Article Detail Pages** — New `/learn/:slug` route with full educational content (500-800 words per article):
   - Hero section with topic icon, difficulty badge, title
   - Read time and "Uniswap V4 Academy" metadata
   - Full article body with headings, paragraphs, and bullet lists
   - Related Articles section at bottom with clickable cards
   - "← Back to Learn" navigation link
   - 404 handling for invalid slugs
   - Fully localized EN/IT, dark/light mode compatible

## Upcoming Tasks
- Task 5: Build full exchange/trading UI pages (spot trading, order book)
- Task 6: Implement advanced charting integration
- Task 7: Build a Mobile app wrapper
- Task 8: Set up production monitoring, alerting, automated backups, and CI/CD pipeline
