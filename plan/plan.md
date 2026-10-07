# Wallet & Inner Pages — Full Rockie Theme Redesign

A complete visual overhaul of the user-facing wallet, transactions, profile, and KYC pages to match the Rockie cryptocurrency exchange template aesthetic. All existing functionality is preserved; only the presentation layer changes.

Designed for end-users who interact with the wallet dashboard, view transactions, manage their profile, and complete KYC verification.

## Core features and experience

The redesign covers four pages. Each page adopts the Rockie dark-theme design language: rounded cards with subtle glass effects, the DM Sans typeface, the established color palette (#0f1017 background, #1e2230 cards, #3772ff primary, #58bd7d success, #ef4444 danger), and the same icon set (Lucide). No backend changes are required — the redesign is purely frontend.

### Wallet Dashboard
- **Portfolio header** — Full-width gradient banner (dark blue → indigo) showing total balance, 24h change, eye toggle. Clean, large typography.
- **Action bar** — Four circular action buttons (Swap, Send, Deposit, Withdraw) in a horizontal strip below the banner, with hover glow effects.
- **Asset cards** — Two-column grid on desktop, stacked on mobile. Each card shows the real CryptoIcon SVG, asset name, balance, fiat equivalent, and a subtle sparkline or change badge. Cards have the glassmorphism look (semi-transparent bg, soft border, shadow).
- **Account section** — Clean info rows (email, username, ETH address, KYC status) inside a Rockie-styled card.
- **Connected app** — If present, a branded card showing the connected service.
- **Alert banners** — Styled with Rockie alert components (left border accent, muted background, clear CTA button).
- **Modals** (Receive, Send, Swap, Withdraw, Freeze) — Redesigned with Rockie modal styling: dark glass background, rounded corners, clear section dividers, prominent CTA button.
- **Mobile bottom nav** — Two-tab (Home, Swap) bar at the bottom, matching Rockie's mobile nav style.

### Transactions Page
- **Filter tabs** — Horizontal pill tabs (All, Deposits, Withdrawals, Sends, Receives, Swaps) matching Rockie tab styling.
- **Transaction list** — Each transaction as a Rockie-styled row/card: icon on left (colored circle with directional arrow), asset name + type, amount + fiat value on right, fee badge, status badge, expandable detail area.
- **Pagination** — Rockie-styled prev/next buttons.
- **Empty state** — Centered illustration placeholder with message.

### Profile Page
- **Profile header** — User avatar (initials circle), name, email, member-since date.
- **Info sections** — Two-column card grid: Personal Info (email, phone, DOB, username) and Wallet & Security (ETH address, account status, KYC status).
- **Change password** — Rockie-styled dialog/modal with form fields.
- **KYC badge** — Prominent verification status with action button if unverified.

### KYC Page
- **Step progress** — Visual step indicator (1–2–3 dots or bar) showing document type → upload → selfie/video.
- **Upload zones** — Rockie drag-and-drop style upload areas with dashed borders, icon, and helper text.
- **Document preview** — Thumbnail display of uploaded documents.
- **Status states** — Pending review, approved, rejected screens with appropriate Rockie styling.
- The complex KYC logic (camera, video, in-app browser detection) remains untouched — only the visual wrapper changes.

## User flow

1. User logs in → lands on the redesigned Wallet Dashboard.
2. Taps an action button (Send/Receive/Swap/Withdraw) → modal opens in new Rockie style.
3. Navigates to Transactions → sees filtered, paginated list in new design.
4. Navigates to Profile → views personal info, can change password.
5. Navigates to KYC → completes verification through redesigned step flow.
6. All dark/light mode toggle behavior is preserved from the RockieLayout wrapper.

## UI/UX feel

- **Dark mode default**: #0f1017 body, #1e2230 cards, rgba(255,255,255,0.06) borders, #f0f2f5 headings, #9ca3b4 secondary text.
- **Light mode**: #f3f4f6 body, #ffffff cards, standard Tailwind borders, dark text.
- Cards use `border-radius: 16px`, `backdrop-filter: blur` where appropriate.
- Buttons: primary blue (#3772ff) with rounded-full pill shape, hover lift with shadow.
- All text uses the i18n `t.*` keys — zero hardcoded strings. Italian and English both work.
- Responsive: mobile-first layout with stacked cards, collapsible sections, and proper bottom nav spacing.
- Transitions: 0.3s ease on hovers, card entrances use the existing `reveal` scroll animation class.

## Implementation phases

### Phase 1 — MVP (built now)
| # | Item | Detail |
|---|------|--------|
| 1 | Wallet Dashboard redesign | Rewrite `WalletDashboard.js` UI with Rockie-styled components. Keep all state, API calls, and modal logic intact. New layout: gradient header, action bar, asset card grid, account card, alert banners. |
| 2 | Wallet modals redesign | Restyle all five modals (Receive, Send, Swap, Withdraw, Freeze) with Rockie dark-glass look. |
| 3 | Transactions page redesign | Rewrite `TransactionsPage.js` UI. New filter pill tabs, transaction row cards, pagination, empty state. |
| 4 | Profile page redesign | Rewrite `ProfilePage.js` UI. New profile header, info card grid, change-password modal. |
| 5 | KYC page visual refresh | Update `KYCPage.js` wrapper styling — step indicator, upload zones, status screens. Preserve all camera/video/upload logic. |
| 6 | Mobile responsive polish | Ensure all four pages render perfectly on 390×844 (iPhone) and 768×1024 (iPad). Bottom nav, stacked cards, no horizontal overflow. |
| 7 | Testing | Full test pass on all four pages in both dark and light mode, desktop and mobile. |

### Phase 2 (future)
- Dedicated Swap/Exchange page with two-panel layout (select pair, enter amount, confirm).
- Portfolio analytics: pie chart of asset allocation, historical balance chart.
- Price alerts and watchlist.

### Phase 3 (future)
- Full spot trading page with order book, candlestick chart, and trade history.
- Staking / DeFi yield page.
- NFT gallery page.

## Assumptions

- Login, Register, Forgot Password, and Reset Password pages are NOT redesigned — they stay as-is.
- Admin panel is NOT redesigned — it keeps its current layout and toggle.
- The RockieHeader (site header with nav, notifications, avatar) is NOT changed — it already matches the Rockie theme.
- The RockieLayout wrapper (which provides dark/light toggle and the header) is NOT changed.
- All existing backend API contracts remain the same — no backend changes.
- The KYC page's camera, video, and upload JavaScript logic is preserved exactly; only the surrounding CSS/HTML structure changes.
- "Swap exchange" refers to the existing swap modal (USDC ↔ EUR), not a new trading page. A dedicated exchange page is deferred to Phase 2.
- All existing i18n translations continue to work — the redesign uses the same `t.*` keys.
- The existing theme-override.css dark/light scoping is preserved and extended as needed for new components.
