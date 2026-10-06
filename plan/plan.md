# Inside App — Rockie Theme Styling + Landing Feature Connection

Restyle all user-facing pages (wallet dashboard, transactions, profile, KYC) with the Rockie theme's dark design language and connect the landing page's market data display into the logged-in dashboard. The admin panel stays as-is.

For the platform owner who wants the inside app to feel like a continuation of the Rockie-themed landing page — same header, same colors, same card/table/form styling — so logged-in users see a cohesive product.

---

## Core changes

### 1. Shared Rockie header for logged-in users

The same full Rockie header from the landing page (Buy Crypto ▾, Markets, Sell Crypto ▾, Blog, BITUSDT 🔥, Pages ▾ | Assets ▾, Orders & Trades ▾, EN/USD ▾, ☀️, 🔔, Wallet, 👤) appears on every inside page, but with these differences when authenticated:

- **Wallet button** → links to `/wallet` (not `/login`)
- **👤 avatar** → opens a dropdown with: Profile, Transactions, KYC, Logout (not just `/login`)
- **🔔 bell** → links to `/wallet` (existing notification behavior)
- All other nav links stay the same (Buy Crypto, Markets etc. still link to landing sections or `/register` for non-functional pages)

This header is extracted into a shared `<RockieHeader />` component used by both the landing page and all inside pages. The landing page passes `isLoggedIn={false}`, inside pages pass `isLoggedIn={true}` with user data.

### 2. Wallet Dashboard — Rockie card styling

The existing wallet dashboard keeps all its current logic (balances, deposit modal, withdraw modal, send modal, fee alerts, freeze alerts, timer, connected app display) but gets restyled:

- Dark background (`#141416`) with dark cards (`#222630`)
- Balance cards use Rockie's rounded card style with blue accent borders
- Action buttons (Deposit, Withdraw, Send) styled as Rockie blue buttons
- The deposit QR code modal, withdraw IBAN modal, and send modal get Rockie's dark dialog styling
- Fee alert and freeze alert banners get Rockie-consistent warning styling

**Added section:** Below the wallet cards, a "Market Overview" strip showing the same 4 crypto price cards from the landing page (Bitcoin, Ethereum, Tether, Binance with sparklines). This is decorative — same static data as the landing page.

### 3. Transactions page — Rockie table styling

The existing transactions list keeps all its current logic (filters, pagination, date sorting, status badges, transaction details) but gets:

- Rockie's dark table styling (matching the landing page's market table)
- Status badges restyled with Rockie color scheme (green for completed, red for failed, yellow for pending)
- Filter tabs restyled as Rockie pill tabs

### 4. Profile page — Rockie form styling

The existing profile page keeps all its current logic (view profile info, change password) but gets:

- Dark card containers
- Rockie-styled form inputs (dark background `#18191d`, border `#23262f`, blue focus ring)
- Rockie-styled buttons

### 5. KYC page — Rockie form styling

The existing KYC page keeps all its current logic (document upload, selfie, proof of address, status display) but gets:

- Dark card containers
- Upload zones restyled with Rockie dark borders
- Progress/status indicators in Rockie blue
- Rockie-styled form layout

### 6. About / Privacy / Terms pages — Rockie styling

These static pages get the Rockie dark theme applied consistently (they partially have it via the global CSS override, but need the Rockie header and footer added for consistency).

---

## What stays the same

- **All backend logic** — zero backend changes
- **All existing JS functionality** — modals, API calls, state management, auth flow, fee calculations, freeze logic, KYC flow, timer countdown
- **Admin panel** — completely untouched, keeps current Tailwind styling
- **Database** — no changes
- **Routing** — no new routes added
- **API contracts** — no changes

---

## User flow

1. Visitor lands on `/` → sees Rockie landing page with full header (not logged in)
2. Clicks Login → `/login` with Rockie auth styling
3. Logs in → redirected to `/wallet`
4. Sees the **same Rockie header** but now the avatar dropdown shows Profile/Transactions/Logout, and Wallet links to their actual wallet
5. Wallet dashboard shows balances in Rockie dark cards, action buttons, and a market overview strip
6. Navigates to Transactions → same header, Rockie-styled transaction table
7. Navigates to Profile → same header, Rockie-styled profile card
8. If needed, goes to KYC → Rockie-styled upload forms
9. Admin logs in → redirected to `/admin` → admin panel looks the same as today (unchanged)

---

## Implementation phases

### Phase 1 — Built now

| Step | What | Done when |
|------|------|-----------|
| 1 | **Extract `<RockieHeader />` component** from LandingPage.js into a shared component. Accept `isLoggedIn`, `user`, `onLogout` props. Landing page and all inside pages use it. | Header renders correctly on both landing and wallet pages |
| 2 | **Restyle Wallet Dashboard** — Apply Rockie dark card styling, button styling, modal styling via CSS. Add market overview strip below wallet cards. | Wallet page has dark theme with all existing functionality working |
| 3 | **Restyle Transactions page** — Apply Rockie table styling, filter tabs, status badges. | Transactions page matches Rockie dark theme |
| 4 | **Restyle Profile page** — Apply Rockie form/card styling. | Profile page matches theme |
| 5 | **Restyle KYC page** — Apply Rockie form/upload styling. | KYC page matches theme |
| 6 | **Add Rockie header + footer to About/Privacy/Terms** — Wrap these pages with the shared header and landing footer. | Static pages look consistent |
| 7 | **Test all flows** — Login, wallet actions, transactions, profile, KYC, admin (unchanged). | No regressions |

### Phase 2 — Later
- Animated transitions between pages
- Real-time market data via WebSocket or API (instead of static crypto prices)
- Custom notification dropdown in the bell icon

### Phase 3 — Later
- Full exchange/trading UI pages (spot trading, order book)
- Advanced charting integration
- Mobile app wrapper

---

## Assumptions

- **CSS-only restyling for wallet/transactions/profile/KYC** — The existing React component structure and logic stays intact. Styling changes are applied via CSS class additions and wrapper elements, not by rewriting the components from scratch. This minimizes regression risk.
- **The shared header is a new component file** (`/src/components/RockieHeader.js`) extracted from the landing page code, not a copy-paste.
- **Market overview strip in wallet** uses the same static/hardcoded crypto data as the landing page. No new API calls.
- **The admin panel is completely excluded** from all styling changes.
- **The `theme-override.css` global dark theme continues to apply** to inside pages as a baseline, and the Rockie component-level CSS adds the polished Rockie-specific styling on top.
- **The dark/light mode toggle** on the shared header works inside the app too (same as landing page behavior).
