# Uniswap V4 — Professional Wallet Upgrade: Full Markets, Rich Asset View & Transactions Redesign

A simulated crypto exchange wallet upgraded to match Coinbase's professional feel — expanded market coverage with 50+ coins, a rich asset list inside the wallet showing live prices and trends, and a redesigned transactions experience with inline charts and live data.

---

## Who it's for

End-users of the simulated exchange who expect a polished, data-rich wallet experience comparable to Coinbase or Binance.

---

## Core features and experience

### 1. Expanded Markets (50+ coins)

- Backend fetches top 50 coins by market cap from CoinGecko instead of the current 8.
- Includes all major cryptos (BTC, ETH, SOL, BNB, ADA, XRP, DOT, AVAX, MATIC, LINK, etc.) plus stablecoins (USDC, USDT, DAI, BUSD).
- Markets page displays all 50 coins in a scrollable, searchable, filterable table — same layout as today but with full data.
- Coin detail pages (`/markets/:symbol`) work for all 50 coins.

### 2. Rich Asset List in Wallet Dashboard

- The "Assets" section in the wallet sidebar/main area shows all 50 coins (not just USDC and EUR).
- Each row displays: coin icon, name/symbol, live USD price, 24h % change (green/red), and the user's balance for that coin (0 if none held).
- Coins with held balances appear first, sorted by value; remaining coins follow sorted by market cap.
- Clicking any asset row navigates to a coin detail view (reuses `/markets/:symbol` or an inline view).

### 3. Transactions Page Redesign (Chart + Live Price + History)

- The wallet dashboard gets a visible "Transactions" button/tab.
- When clicked, the page shows:
  - **Top section**: Interactive price chart (reuses the portfolio sparkline approach) with timeframe buttons (1D, 1W, 1M, 3M).
  - **Middle**: Live price display for the user's primary asset or portfolio total.
  - **Bottom section**: Full transaction history list (existing functionality).
- This mirrors Coinbase's pattern: chart context above, transactions below — not just a bare transaction list.

### 4. Header Navigation Renames

- "Impara" / "Learn" → renamed to **"Sicurezza" / "Security"** (same link destination — still goes to `/learn`).
- "Pagine" / "Pages" → renamed to **"Chi Siamo" / "About Us"** (same dropdown with same sub-links underneath).

---

## User flow

**Markets:**
1. User clicks "Markets" / "Mercati" in header.
2. Sees 50+ coins with live prices, 24h change, market cap, volume.
3. Can search, filter by category (DeFi, Layer 1, Stablecoins, etc.).
4. Clicks any coin → full detail page with chart and stats.

**Wallet Assets:**
1. User logs in, lands on wallet dashboard.
2. Scrolls to Assets section — sees all 50 coins with live prices and their personal balance.
3. Held coins (non-zero balance) appear at the top.
4. Clicks a coin → navigates to its market detail page.

**Transactions:**
1. User clicks the "Transactions" button in the wallet.
2. Sees a portfolio chart at the top with timeframe toggles.
3. Below the chart: live portfolio value.
4. Below that: full transaction history with filters (deposits, withdrawals, sends, swaps, etc.).

---

## UI/UX feel

- **Markets table**: Clean Coinbase-style table with alternating hover rows. Coin icons, sparkline mini-charts optional. Mobile-responsive with horizontal scroll.
- **Wallet Assets**: Coinbase portfolio list — each coin row is a clickable card with icon, name, price, change badge, and personal balance right-aligned. Subtle separators. "See all" expands if list is long.
- **Transactions page**: Chart-first layout. The chart is prominent (not tiny). Transaction list below uses the existing card/row style with type icons, amounts, and status badges.
- **Header**: Clean text links. No visual change beyond the label renames.

---

## Implementation phases

### Phase 1 — MVP (built now)

1. **Backend**: Expand CoinGecko fetch to top 50 coins. Update `/api/market/prices` to return 50 coins. Update the coin ID mapping for all 50.
2. **Markets page**: Update to display all 50 coins. Ensure search and category filters work with the larger dataset.
3. **Wallet Assets**: Replace the current 2-coin (USDC/EUR) asset list with the full 50-coin list showing live prices and user balances.
4. **Transactions redesign**: Add chart + live price section above the transaction list on the `/transactions` page (or within the wallet view when "Transactions" is clicked).
5. **Header renames**: "Impara"→"Sicurezza", "Pagine"→"Chi Siamo" in both EN and IT.

### Phase 2 — Enhancements

- Add mini sparkline charts to each coin row in Markets and Assets.
- Add "Favorites" / watchlist functionality.
- Portfolio breakdown by coin in the transactions chart header.

### Phase 3 — Advanced

- Real-time price updates via WebSocket instead of polling.
- Advanced filtering and sorting in Markets (gainers, losers, trending).
- Export transaction history as CSV/PDF.

---

## Assumptions

- Top 50 coins by market cap provides sufficient coverage. The exact list comes from CoinGecko's ranking at fetch time.
- CoinGecko free API rate limits are managed with the existing 60-second cache. 50 coins in one call is within limits.
- The wallet asset list shows ALL 50 coins for discoverability (Coinbase style), even if the user holds 0 — held coins sort to the top.
- "Sicurezza"/"Security" label still links to `/learn` (not `/security`) — it's purely a text rename as requested.
- "Chi Siamo"/"About Us" replaces "Pagine"/"Pages" as the dropdown label — the sub-links inside remain the same.
- The transactions chart uses BTC as a market proxy (same approach as the portfolio chart today).
- The existing transaction list functionality (filters, pagination) is preserved — the chart is added above it, not replacing it.
