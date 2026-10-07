# Wallet Dashboard — Coinbase Pro Redesign with Rockie Theme

A complete visual overhaul of the Wallet Dashboard page to match the Coinbase Pro / Advanced Trade aesthetic, built on top of the existing Rockie dark theme. All existing functionality (balances, send, receive, swap, withdraw, alerts, modals, notifications, freeze logic, timer, fee system) is preserved exactly — only the presentation layer changes.

## Who it's for

Logged-in users who manage their crypto portfolio. The redesign makes the wallet feel like a professional trading platform instead of a simple balance viewer.

## Core features and experience

### Layout — Three-Panel Dashboard

The single-column wallet is replaced with a Coinbase Pro–inspired multi-panel layout:

**Left Panel — Portfolio & Assets (main column, ~60% width)**
- **Portfolio value header** — large balance in EUR with 24h change (amount + percentage), eye toggle to hide balances. Subtle gradient or solid dark card background.
- **Action button strip** — four pill buttons in a row: Send, Receive, Swap, Withdraw. Compact, Coinbase-style rounded pills with icons, not the current large circles.
- **Asset list** — each asset as a row: CryptoIcon SVG, name + symbol, sparkline mini-chart (7d from market API), current price, 24h change %, user's balance + fiat equivalent. Clickable rows navigate to Transactions. This replaces the two static USDC/EUR cards.
- **Alert banners** — freeze/KYC/fee alerts appear above the asset list, same logic, restyled as compact notification bars.

**Right Panel — Market Overview + Account (~40% width)**
- **Live prices card** — real-time prices of top coins (BTC, ETH, SOL, BNB) from the existing market API, each showing icon, name, price, and 24h change. Updates every 60s. Clicking a row goes to `/markets/:symbol`.
- **Account info card** — email, username, ETH address (truncated + copy), KYC status badge. Compact layout.
- **Connected app card** — if the user has a connected app, shows it here.
- **Quick actions** — "View Transactions" link, "Complete KYC" button (if unverified).

**On mobile (< 768px)** — panels stack vertically: portfolio header → action buttons → asset list → market card → account card. The right panel content drops below the main content.

### Portfolio Header Detail

- Total portfolio value calculated from all wallet balances × current market prices (using the existing market API for exchange rates).
- 24h change calculated from the USDC/EUR exchange rate change (already available).
- Green up arrow or red down arrow with the change amount and percentage.
- "Portfolio" / "Portafoglio" label above the balance.
- Eye icon to toggle balance visibility (already implemented).
- Refresh button with spin animation (already implemented).

### Asset List Detail

Each row in the asset list shows:
- Rank number
- CryptoIcon SVG (already available for USDC, EUR, BTC, ETH, etc.)
- Asset name + symbol (e.g., "USD Coin" / "USDC")
- Mini sparkline chart (inline SVG, same style as landing page table)
- Current market price in USD
- 24h price change percentage (green/red)
- User's balance in the asset (e.g., "271,493.83 USDC")
- Fiat equivalent (e.g., "≈ €242,071")
- Locked balance indicator if applicable

The list shows whatever wallets the user has (currently USDC + EUR, expandable by admin).

### Action Buttons

Four compact pill buttons replacing the large circle buttons:
- **Send** — opens existing Send modal
- **Receive** — opens existing Receive/Deposit modal
- **Swap** — opens existing Swap modal
- **Withdraw** — opens existing Withdraw modal

Styled as horizontal pills with icon + text, Coinbase Pro style (dark bg, subtle border, hover glow).

### Modals

All five existing modals (Receive, Send, Swap, Withdraw, Freeze) keep their exact logic but get a visual refresh:
- Darker glassmorphism background matching the Rockie card style.
- Cleaner form layouts with better spacing.
- More prominent CTA buttons.
- Same fields, same validation, same API calls — just better-looking wrappers.

### Bottom Navigation (Mobile)

Same two-tab mobile nav (Home, Swap) restyled to match the new dashboard aesthetic.

## User flow

1. User logs in → lands on the redesigned Wallet Dashboard.
2. Sees their total portfolio value with 24h change at the top.
3. Below that, four action pill buttons (Send, Receive, Swap, Withdraw).
4. Scrolls through their asset list showing all holdings with live prices and sparklines.
5. On the right (or below on mobile), sees live market prices for top coins and their account info.
6. Taps any action button → same modals open with the same flows.
7. Taps an asset row → navigates to Transactions.
8. Everything looks and feels like Coinbase Pro but with Rockie's dark theme colors.

## UI/UX feel

- **Color palette**: #0f1017 page bg, #1e2230 card bg, rgba(255,255,255,0.06) borders, #3772ff primary, #22c55e success, #ef4444 danger — the established Rockie palette.
- **Typography**: DM Sans, large bold balance (36–42px), medium section headers (18px), clean data text (14px).
- **Cards**: 16px border-radius, subtle box-shadow, glassmorphism on hover.
- **Layout**: CSS Grid — `grid-template-columns: 1fr 380px` on desktop, single column on mobile.
- **Transitions**: 0.3s ease on hovers, cards have subtle lift on hover.
- **Sparklines**: Inline SVG mini-charts in asset rows (same approach as landing page).
- **i18n**: All text uses existing `t.*` keys — nothing is hardcoded. Italian and English both work.
- **Dark/light toggle**: Fully supported. The existing RockieLayout wrapper handles this — the dashboard uses CSS variables that adapt.
- **Responsive breakpoints**: Desktop (> 1024px) three-panel, tablet (768–1024px) two-panel, mobile (< 768px) single column stacked.

## Implementation phases

### Phase 1 — MVP (built now)
| # | Item | Detail |
|---|------|--------|
| 1 | Layout restructure | Replace the single-column layout with a CSS Grid two-panel layout (main + sidebar). Add responsive breakpoints. |
| 2 | Portfolio header redesign | Large balance, 24h change with arrow, eye toggle, refresh — all in a clean Coinbase Pro style header card. |
| 3 | Action button strip | Replace large circle buttons with compact horizontal pill buttons (icon + text). Same onClick handlers. |
| 4 | Asset list table | Replace the two static USDC/EUR cards with a dynamic asset list showing all user wallets as rows with sparklines, prices, balances. |
| 5 | Market overview sidebar | Add a live prices card showing top coins (BTC, ETH, SOL, BNB) with prices and 24h change from the market API. |
| 6 | Account info sidebar | Move account details (email, username, ETH address, KYC status) to a compact sidebar card. |
| 7 | Alert banners restyle | Same freeze/KYC/fee alert logic, restyled as compact notification bars fitting the new layout. |
| 8 | Modal visual refresh | Same modal logic, updated CSS to match the new card styling. |
| 9 | Mobile responsive | Stack panels vertically on mobile, ensure bottom nav works. |
| 10 | Testing | Full test pass: balances display, modals open, alerts show, dark/light mode works, mobile layout correct. |

### Phase 2 (future)
- Portfolio performance chart (line chart showing balance over time).
- Asset allocation pie chart.
- Price alerts (set target price, get notified).
- Advanced order types in the sidebar.

### Phase 3 (future)
- Full trading view with candlestick charts and order book.
- Tabbed interface: Portfolio / Trade / Earn / NFTs.
- Deposit/withdrawal history timeline.

## Assumptions

- **Only the Wallet Dashboard page is redesigned.** Transactions, Profile, KYC pages stay as-is.
- **All existing JavaScript logic is preserved exactly.** State variables, useEffects, API calls, modal handlers, alert logic, timer system, fee calculations, SSE connection, heartbeat — none of this changes. Only the JSX rendering and CSS classes change.
- **The asset list shows whatever wallets the user has in the database.** Currently most users have USDC + EUR. If admin assigns more assets (BTC, ETH, etc.), they appear automatically.
- **Sparkline data for each asset** is fetched from the existing `/api/market/prices` endpoint. For assets without market data (like EUR), no sparkline is shown.
- **The right sidebar market prices card** uses the same `/api/market/prices` data already fetched by the landing page — no new API calls needed, just a new display component.
- **Modal HTML structure** may change (better wrappers, spacing) but all form fields, validation, submit handlers, and error handling remain identical.
- **The admin preview banner** (shown when admin views the wallet) stays at the top, above the new layout.
- **The existing RockieWallet.css** design system classes are reused and extended where needed.
- **No backend changes required.** This is a pure frontend redesign.
