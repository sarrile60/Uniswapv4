# Markets Page — Live Cryptocurrency Explorer

A dedicated Markets page where users browse all available cryptocurrencies with real-time prices, search/filter, and click into individual coin detail pages with price charts and key statistics.

Designed for all users (logged in or not) who want to explore the crypto market before trading.

## Core features and experience

### Markets List Page (`/markets`)
- **Header**: "Markets" title with a search bar to filter coins by name or symbol.
- **Category tabs**: All, DeFi, NFT, Layer 1, Stablecoins — filters the displayed list.
- **Coin table**: Each row shows rank, coin icon (CryptoIcon SVG), name, symbol, live price, 24h change %, 7d sparkline mini-chart, market cap, and 24h volume. Data pulled from the existing `/api/market/prices` endpoint (CoinGecko cached).
- **Sorting**: Click column headers to sort by price, change, market cap, or volume.
- **Favorites column**: Star icon to save favorites (same localStorage system already built for the landing page).
- **Responsive**: On mobile, the table collapses to card-style rows showing coin, price, and change only.

### Coin Detail Page (`/markets/:symbol`)
- **Price header**: Large coin icon, name, current price, 24h change badge, 24h high/low.
- **Price chart**: Interactive line chart showing price history. Uses a lightweight charting approach (SVG-based or a small library). Timeframe toggles: 1D, 1W, 1M, 3M, 1Y.
- **Key stats grid**: Market cap, 24h volume, circulating supply, all-time high, all-time low.
- **About section**: Short description of the cryptocurrency.
- **Action button**: "Trade" button linking to the register page (or wallet if logged in).
- **Back to markets link**.

### Data source
- Extends the existing `/api/market/prices` backend endpoint to also return market cap, volume, and image URL (already returned by CoinGecko but not all fields are exposed).
- Adds a new `/api/market/coin/:id` endpoint for individual coin detail (price history, description) — also from CoinGecko free API with server-side caching.
- No new database tables needed.

## User flow

1. User clicks "Markets" / "Mercati" in the header nav → lands on `/markets`.
2. Sees a table of all tracked cryptocurrencies with live prices.
3. Can search by name, filter by category, sort by any column.
4. Clicks a coin row → navigates to `/markets/BTC` (or ETH, SOL, etc.).
5. Sees the coin's price chart, stats, and description.
6. Clicks "Trade" → goes to register (or wallet if logged in).
7. Clicks back → returns to the markets list.

## UI/UX feel

- Follows the established Rockie dark theme: #0f1017 background, #1e2230 cards, #3772ff primary.
- The markets table uses the existing `rk-card` design system from `RockieWallet.css`.
- Coin detail page has a full-width price chart area with the glassmorphism card style.
- Category tabs use the `rk-tab` / `rk-tab.active` pill styling.
- Search bar matches the Rockie input styling.
- Sparkline mini-charts in the table use inline SVGs (same approach as the landing page).
- All text uses i18n `t.*` keys — table headers, category names, stats labels, "Trade" button all translated IT/EN.
- Fully responsive: table → card layout on mobile.
- Page wrapped in `RockieLayout` (gets the header, dark/light toggle, footer automatically).

## Implementation phases

### Phase 1 — MVP (built now)
| # | Item | Detail |
|---|------|--------|
| 1 | Markets list page | `/markets` route with coin table, search, category filters, sorting, favorites |
| 2 | Coin detail page | `/markets/:symbol` route with price header, chart (SVG-based), stats grid, about text |
| 3 | Backend endpoints | Extend `/api/market/prices` to expose all CoinGecko fields; add `/api/market/coin/:id` for detail + price history |
| 4 | Navigation wiring | "Markets" / "Mercati" header link points to `/markets` instead of `/#crypto-section` or `/wallet` |
| 5 | i18n translations | All new strings (table headers, stat labels, categories, "Trade", "Back to Markets") added in EN + IT |
| 6 | Responsive | Mobile card layout for the table, chart scales down properly |

### Phase 2 (future)
- Advanced charting with candlestick view and technical indicators.
- Coin comparison tool (overlay two coins on one chart).
- Price alerts — set a target price and get notified.

### Phase 3 (future)
- Full Buy/Sell flow pages (select coin → enter amount → confirm → receipt).
- Order book and limit orders.
- Recurring buy scheduling.

## Assumptions

- The markets page is public (accessible without login). Favorites require login.
- CoinGecko free API is used for all data. The existing 60-second cache is extended to cover the new endpoints. Rate limiting is handled gracefully with stale-cache fallback (already implemented).
- The price chart on the coin detail page uses SVG-based rendering (no heavy charting library like Chart.js or TradingView). This keeps the bundle small. A lightweight approach with animated SVG paths, similar to the existing sparklines but larger and interactive.
- The initial coin list includes the 8 coins already tracked (BTC, ETH, USDT, BNB, ADA, SOL, XRP, DOT). The backend can be expanded later to track more.
- "Trade" button on the coin detail page links to `/register` for non-logged-in users and `/wallet` for logged-in users. No actual buy/sell flow is built in Phase 1.
- The Markets page replaces the current "Markets" nav link behavior (which currently goes to `/#crypto-section` on landing or `/wallet` when logged in).
