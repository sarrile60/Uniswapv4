# Fix: Portfolio Allocation Donut — Correct Value Display

The "Allocazione Portafoglio" donut chart center converts all assets to a EUR-equivalent total and displays it with a € symbol (e.g. €166,645.77). But that number is the USDC balance converted at the exchange rate — it is not the user's actual EUR balance. Showing € on a USDC-denominated figure is misleading. The left-side portfolio card already shows the correct EUR total; the donut should reflect the real asset values without implying they are all in Euro.

**Who it's for:** All logged-in users viewing the Wallet Dashboard.

## Core Features and Experience

- **Center label fix:** The donut center currently shows `total` (sum of all wallets converted to EUR) with a `€` prefix. Since the bulk of the balance may be USDC (not EUR), this is replaced with the raw total and the currency symbol is made accurate:
  - If the portfolio is 100% EUR → show `€` prefix.
  - If the portfolio contains USDC or other non-EUR assets → show the total in USDC terms with a `$` prefix (or no symbol), making clear it is not a Euro amount.
  - Simplest correct approach: **remove the `€` prefix entirely** and replace it with the dominant asset's symbol label (e.g. "USDC" sub-label instead of "Total"), OR just show a plain number with "Totale" below.

- **Cleaner option (recommended):** Show the raw total value with no currency prefix, and change the sub-label from "Total" to "≈ EUR" or "Equiv. EUR" so the user understands it is an approximation — not a real EUR balance.

## User Flow

1. User opens Wallet Dashboard.
2. Portfolio card (left) correctly shows `€148.894,33` — the real EUR balance.
3. Donut chart (right) shows the combined portfolio value without a misleading `€` prefix.
4. Center reads: `166.645,77` with sub-label `≈ EUR` (approximation label).
5. Legend below lists each asset (USDC 100%, or BTC/ETH/USDC split) with correct coin logos and percentages.

## UI/UX Feel

- Honest and clear: the `€` symbol only appears where the value is truly in Euro.
- The `≈ EUR` sub-label communicates "approximate Euro equivalent" without claiming it is real EUR.
- No layout change — only the center label text is updated.

## Implementation Phases

### Phase 1 (MVP — Build Now)
- In `WalletDashboard.js` line ~742: change `{'€' + formatBalance(total.toFixed(2))}` → `{formatBalance(total.toFixed(2))}`.
- On line ~744: change sub-label from `"Total"` → `"≈ EUR"` (or `"Equiv. EUR"`).

### Phase 2 (Future)
- Optionally: if the wallet has only EUR balance, restore the `€` prefix dynamically.

### Phase 3 (Future)
- N/A

## Assumptions

- The recommended fix is: remove `€` prefix, change sub-label to `≈ EUR`.
- The left portfolio card (`€148.894,33`) is correct and untouched.
- No backend changes needed.
- The donut chart's EUR-equivalent conversion logic itself (USDC × exchange rate) stays — only the display label changes.
