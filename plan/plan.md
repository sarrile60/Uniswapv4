# Fix: Transaction Amount Currency Symbol

Every transaction in the Transactions page displays its amount with a `€` prefix regardless of the asset involved. A USDC→EUR swap therefore shows `−€166,645.77` on the USDC debit row even though no Euros left the account — only USDC did.

**Who it's for:** All logged-in users viewing their transaction history.

## Core Features and Experience

- The amount column on each transaction card shows the correct currency symbol for that transaction's asset:
  - `tx.asset === 'EUR'` → `€` prefix (current behavior, keep as-is)
  - `tx.asset === 'USDC'` → `$` prefix (USDC is USD-pegged; no Euro sign)
  - Any other crypto asset (BTC, ETH, SOL, etc.) → no prefix; append the asset symbol as a suffix (e.g. `−0.15 BTC`)
- Positive/negative sign logic is unchanged.
- No other layout, color, or badge change.

## User Flow

1. User opens the Transactions page (`/transactions`).
2. The USDC swap debit row shows `−$166,645.77` (or `−166,645.77 USDC`), not `−€166,645.77`.
3. The EUR credit row from the same swap continues to show `+€148,553.97` — correct, unchanged.
4. EUR withdrawals, deposits, and fees keep the `€` symbol.
5. Any BTC/ETH send shows the amount with the coin's symbol suffix.

## UI/UX Feel

- Honest denomination per asset — users immediately see which asset moved and in what unit.
- No layout shift; the fix is text-only inside the existing amount `<div>`.

## Implementation Phases

### Phase 1 (MVP — Build Now)
- In `TransactionsPage.js` line ~264, replace the hardcoded `&euro;` with a helper that returns the right prefix/suffix based on `tx.asset`.
- Helper logic: `EUR` → `€{amount}`, `USDC` → `${amount}`, everything else → `{amount} {asset}`.

### Phase 2 (Future)
- Apply the same asset-aware symbol logic to the mini transaction list on the Wallet Dashboard (`WalletDashboard.js` lines ~662–664), which currently shows `{tx.amount} {tx.asset}` (already correct there, but worth a consistency review).

### Phase 3 (Future)
- N/A

## Assumptions

- USDC displays with a `$` prefix (not `USDC` suffix) because it is USD-pegged and `$` reads more naturally to users.
- Other non-EUR, non-USDC assets use `{amount} {symbol}` suffix format (e.g. `0.15 BTC`).
- No backend changes; the `tx.asset` field is already present in the API response.
- The fee amount (line ~298, also hardcoded `&euro;`) is always stored and denominated in EUR, so it is left unchanged.
