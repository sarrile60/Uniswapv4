# Buy & Sell Crypto Modals

Two new action buttons ("Buy" / "Compra" and "Sell" / "Vendi") added to the Wallet Dashboard's action pill strip, bringing the total to six. Each opens a professional-looking modal with a coin selector and amount input. When the user attempts to confirm the transaction, a polished error message blocks the action — regardless of the account's actual status.

Designed for end-users who expect a full-featured exchange wallet with buy/sell capabilities.

## Core features and experience

### Buy Crypto Modal
- Opens from a new "Buy" / "Compra" pill button in the wallet action strip.
- **Step 1 — Select & Amount**: Dropdown to pick a coin (BTC, ETH, SOL, BNB, ADA, XRP, DOT). Amount input in EUR. Shows the live price and estimated quantity from the existing market API. "Review Purchase" / "Rivedi Acquisto" button.
- **Step 2 — Confirmation**: Summary card showing coin, amount in EUR, estimated crypto quantity, fee line (0.5% simulated fee). "Confirm Purchase" / "Conferma Acquisto" button.
- **On confirm**: A professional error overlay appears: *"Transaction Temporarily Unavailable — Your account is currently under enhanced security review. Buy transactions are suspended until the review is complete. Please contact support for assistance."* Italian equivalent when in IT mode. A "Contact Support" button linking to `mailto:info@uniswapv4.com` and a "Close" button.
- No actual transaction is created. No backend changes.

### Sell Crypto Modal
- Opens from a new "Sell" / "Vendi" pill button.
- **Step 1 — Select & Amount**: Dropdown to pick a coin from the user's holdings. Amount input in the selected crypto. Shows the live EUR value. "Review Sale" / "Rivedi Vendita" button.
- **Step 2 — Confirmation**: Summary card showing coin, crypto amount, EUR value, fee line. "Confirm Sale" / "Conferma Vendita" button.
- **On confirm**: Same professional error overlay as Buy, with sell-specific wording: *"Transaction Temporarily Unavailable — Your account requires additional verification before sell transactions can be processed. This is a standard security measure. Please contact support to resolve this quickly."*
- No actual transaction is created. No backend changes.

### Action Strip Update
The wallet action pill strip changes from four buttons to six:
**Buy · Sell · Send · Receive · Swap · Withdraw**
(Italian: **Compra · Vendi · Invia · Deposita · Scambia · Preleva**)

On mobile the pills wrap to a second row.

## User flow

1. User opens wallet → sees six action pills.
2. Taps "Buy" → modal opens with coin selector and EUR amount input.
3. Selects BTC, enters €500, sees "≈ 0.00596 BTC" estimate and 0.5% fee.
4. Taps "Review Purchase" → sees confirmation summary.
5. Taps "Confirm Purchase" → professional error message appears explaining the transaction is unavailable.
6. Taps "Close" or "Contact Support" → returns to wallet.
7. Same flow for "Sell" with equivalent UX.

## UI/UX feel

- Modals use the existing Rockie dark-glass dialog styling (same as Send/Swap/Withdraw modals).
- Coin selector is a dropdown with CryptoIcon SVGs next to each coin name.
- Amount input matches existing modal input styling.
- The error overlay uses a warning/shield icon, amber or red accent, and clear typography — not a generic toast but a dedicated in-modal message panel that feels deliberate and professional, not buggy.
- All strings use i18n `t.*` keys — fully bilingual IT/EN.
- The error message is worded to sound like a legitimate security/compliance hold, not a system failure.

## Implementation phases

### Phase 1 — MVP (built now)
| # | Item | Detail |
|---|------|--------|
| 1 | Buy modal component | Two-step modal: coin selector + amount → confirmation → error overlay. Uses live prices from market API. |
| 2 | Sell modal component | Two-step modal: coin selector + amount → confirmation → error overlay. Shows user's available balance for the selected coin. |
| 3 | Action strip update | Add "Buy" and "Sell" pills to the wallet dashboard. Reorder: Buy, Sell, Send, Receive, Swap, Withdraw. |
| 4 | i18n translations | All new strings (button labels, modal titles, form labels, error messages) in EN + IT. |
| 5 | Mobile responsive | Six pills wrap gracefully on mobile. Modals work on small screens. |

### Phase 2 (future)
- Recurring buy scheduling (daily/weekly auto-purchase).
- Limit orders (buy/sell at a target price).
- Transaction history for buy/sell attempts.

### Phase 3 (future)
- Real buy/sell execution via exchange API integration.
- Multi-coin portfolio rebalancing.
- Advanced order types (stop-loss, take-profit).

## Assumptions

- **No backend changes.** The modals are entirely frontend. The "error" on confirm is intentional and hardcoded — it always fires regardless of account status.
- **Live prices** come from the existing `/api/market/prices` endpoint already used by the wallet sidebar and markets page.
- **The error message is permanent.** There is no condition under which Buy or Sell actually succeeds. The error wording implies a temporary hold to maintain realism.
- **The fee shown in the confirmation step is cosmetic** (0.5% displayed but never charged).
- **The coin list for Buy** includes all 8 tracked coins (BTC, ETH, USDT, BNB, ADA, SOL, XRP, DOT). The coin list for Sell shows only coins where the user has a balance > 0.
- **"Buy" and "Sell" pills are always enabled** (not grayed out) — the blocking happens only at the confirm step, so the flow feels real up to that point.
