# Uniswap V4 — Header Trade Experience, Learn Articles & BTC Icon Fix

A simulated crypto exchange platform branded as Uniswap V4, receiving three targeted UX improvements: a professional Coinbase-style Trade button replacing the current Buy/Sell dropdowns, fully clickable Learn articles with real educational content, and a broken BTC icon fix in the header.

Built for internal/demo use where admins control the simulation environment.

---

## Who it's for

Platform end-users (simulated traders) who interact with the exchange UI, and admins who control the simulation. The changes improve the user-facing experience only; the admin panel remains untouched.

---

## Core features and experience

### 1. Professional Trade Button (replaces "Compra Crypto" & "Vendi Crypto")

- Remove both "Compra Crypto ▾" and "Vendi Crypto ▾" dropdown menus from the header navigation.
- Replace with a single prominent **"Trade"** button styled like Coinbase's primary CTA — filled accent color, stands out in the nav bar.
- Clicking "Trade" opens a **professional full-screen or centered modal** with:
  - **Buy / Sell** tab switcher at the top
  - Asset selector dropdown (BTC, ETH, SOL, etc. with icons and current prices)
  - Amount input field with currency toggle (USD/EUR ↔ crypto)
  - Live price quote area showing estimated receive amount
  - "Preview Order" button leading to a confirmation step
  - On the confirmation step: since the user account is simulated/unverified, display a professional **"Account Under Review"** notice explaining the trade cannot be executed until verification is complete — matching the existing simulated block behavior.
- The modal is fully localized (EN/IT) and respects dark/light mode.

### 2. Learn Page — Clickable Article Cards with Full Content

- Each of the 6 existing Learn cards becomes clickable, navigating to `/learn/:slug`.
- Each article detail page contains **real, substantive educational content** (500–800 words per article):
  - What is Bitcoin?
  - What is Ethereum?
  - How to Secure Your Crypto
  - Understanding DeFi
  - What is Staking?
  - NFTs Explained
- Article detail page layout: hero section with topic icon and difficulty badge, article body with headings/paragraphs, a "Back to Learn" link, and suggested related articles at the bottom.
- Fully localized (EN/IT), dark/light mode compatible.

### 3. BTC Icon Fix in Header

- The Bitcoin icon/image next to the live BTC price ticker in the header is currently broken (not rendering).
- Fix the image source to display the BTC icon correctly. Use an inline SVG or a reliable CDN source that won't break.

---

## User flow

**Trade button:**
1. User sees "Trade" button in the header nav (always visible, prominent).
2. Clicks → professional modal opens with Buy tab active.
3. User selects an asset, enters an amount, sees a live quote preview.
4. Clicks "Preview Order" → confirmation screen appears.
5. Confirmation shows "Account Under Review" notice — trade blocked (simulated).
6. User can switch to Sell tab and repeat the same flow.
7. User dismisses modal and returns to their previous page.

**Learn articles:**
1. User navigates to /learn from the header.
2. Sees the 6 topic cards (existing layout).
3. Clicks any card → navigates to /learn/what-is-bitcoin (or relevant slug).
4. Reads the full article with professional formatting.
5. Can click "Back to Learn" or a related article link.

---

## UI/UX feel

- **Trade modal**: Clean, minimal, Coinbase-inspired. White/dark card with generous padding. Smooth open/close animation. The Buy/Sell tabs use underline or pill-style active indicator. Asset selector shows coin icons + ticker + current price. Amount input is large and prominent. The "under review" state uses an info banner with a shield icon — professional, not alarming.
- **Learn articles**: Magazine-style reading experience. Clear typography hierarchy. Difficulty badges carry over from the card. Subtle fade-in on page load.
- **Header**: The Trade button replaces two dropdown menus, decluttering the nav. BTC ticker shows a proper icon.

---

## Implementation phases

### Phase 1 — MVP (built now)

1. **Fix BTC icon** in header ticker (inline SVG or reliable source).
2. **Replace header nav** — remove Compra/Vendi dropdowns, add single "Trade" button.
3. **Build Trade modal** — Buy/Sell tabs, asset selector, amount input, preview step, "under review" block on confirm. Localized EN/IT.
4. **Make Learn cards clickable** — add routing to `/learn/:slug`.
5. **Build Learn article detail page** — layout, 6 full articles with real content, EN/IT localized.
6. Test all changes across dark/light mode and both languages.

### Phase 2 — Enhancements

- Animate Trade modal transitions (slide-up on mobile, fade on desktop).
- Add price change sparkline inside the Trade modal asset selector.
- Add search/filter to Learn page by difficulty level.
- Add "Share" button on articles.

### Phase 3 — Advanced

- Make Trade flow functional for simulated execution (balance updates on confirmed trades) once admin approves accounts.
- Add more Learn articles dynamically (admin-managed content).
- Trading history page linked from Trade modal.

---

## Assumptions

- The "under review" block in the Trade modal is the final state for all users in simulation mode — no simulated trade execution in this phase.
- The 6 existing Learn topics are the full set for Phase 1; no new topics added.
- Article content is written in English first, then translated to Italian — both hardcoded in the i18n system (no CMS).
- The Trade button replaces both dropdown menus entirely — no residual dropdown behavior.
- The BTC icon fix uses an inline SVG to avoid external CDN dependency issues.
- The Learn article detail page uses the existing RockieLayout wrapper for consistent header/footer.
- Mobile responsiveness follows existing patterns (no dedicated mobile redesign).
