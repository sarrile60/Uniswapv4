# Fix: Portfolio Allocation Chart — Coin Logo Bug

The Wallet Dashboard's "Allocazione Portafoglio" (Portfolio Allocation) section shows a EUR (€) icon next to each coin in the legend instead of the actual coin's logo (e.g., USDC should show the USDC logo, BTC should show the Bitcoin logo, etc.).

**Who it's for:** All logged-in users viewing their Wallet Dashboard.

## Core Fix

In the portfolio allocation pie chart legend (right side of the dashboard), each asset row currently renders a EUR symbol/icon as the coin identifier. The fix replaces that with the correct `CryptoIcon` component for each respective coin (USDC → USDC logo, BTC → Bitcoin logo, ETH → Ethereum logo, etc.).

## User Flow

1. User opens Wallet Dashboard
2. The right-side "Allocazione Portafoglio" card shows a donut/conic chart with a legend below
3. Each legend item shows: [Coin Logo] [Coin Name] [Percentage]
4. **After fix:** Coin logos are correct per asset — not defaulting to the EUR symbol

## UI/UX Feel

- Consistent with the rest of the dashboard where `CryptoIcon` components are used for asset logos
- No layout or structural change — only the icon rendered in the legend is corrected

## Implementation Phases

### Phase 1 (MVP — Build Now)
- Locate the portfolio allocation legend rendering in `WalletDashboard.js`
- Replace the hardcoded/defaulting EUR icon with the `CryptoIcon` component keyed by the asset symbol
- Verify all coins in the allocation list render their correct logo

### Phase 2 (Future)
- N/A for this fix

### Phase 3 (Future)
- N/A for this fix

## Assumptions

- The `CryptoIcon` component in `/app/frontend/src/components/CryptoIcons.js` already has icons for USDC and other common assets
- The portfolio allocation data structure already contains the asset symbol (e.g., "USDC", "BTC", "ETH") — it just isn't being passed to the icon renderer correctly
- No backend changes are needed; this is a pure frontend rendering fix
