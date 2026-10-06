# Landing Page Header — Match Original Rockie Theme

Upgrade the landing page header from the current simplified 5-link navigation to the full Rockie theme header layout with dropdowns, extra right-side controls, and a notification icon.

For the platform owner who wants the landing page header to look identical to the purchased ThemeForest Rockie template.

---

## What changes

**Current header (simplified):**
```
🦄 Uniswap V4   Homepage  Markets  How It Works  About  Testimonials       ☀️  Login  Register
```

**Target header (matching Rockie theme):**
```
🦄 Uniswap V4   Buy Crypto ▾  Markets  Sell Crypto ▾  Blog  BITUSDT 🔥  Pages ▾     Assets ▾  Orders & Trades ▾  EN/USD ▾  ☀️  🔔  (Wallet)  👤
```

---

## Specific elements to add

### Left side — Navigation menu
| Item | Type | Behavior |
|------|------|----------|
| Buy Crypto | Dropdown | Shows sub-links (Buy Crypto Select, Buy Crypto Confirm, Buy Crypto Details) — all link to `/register` since this is a landing page |
| Markets | Link | Scrolls to `#crypto-section` or links to `/register` |
| Sell Crypto | Dropdown | Shows sub-links — all link to `/register` |
| Blog | Link | Links to `#about-section` (no blog page exists) |
| BITUSDT 🔥 | Decorative link | Links to `/register` — shows the "hot pair" like the original |
| Pages | Dropdown | Links to About, Login, Register, Contact, FAQ |

### Right side — Controls
| Item | Type | Behavior |
|------|------|----------|
| Assets ▾ | Dropdown button | Shows Visa Card, Crypto Loans, Pay — all link to `/register` |
| Orders & Trades ▾ | Dropdown button | Shows Convert, Spot, Margin, P2P — all link to `/register` |
| EN/USD ▾ | Dropdown button | Decorative language/currency selector |
| ☀️ / 🌙 | Toggle | Dark/light mode switch (already exists) |
| 🔔 | Icon button | Notification bell — decorative, links to `/login` |
| Wallet | Button | Outlined "Wallet" button — links to `/login` |
| 👤 | Avatar | User avatar icon — links to `/login` |

### Mobile
- All dropdowns collapse into the hamburger menu (already exists)

---

## What stays the same
- Logo (🦄 Uniswap V4)
- Dark/light mode toggle
- Fixed position header
- All existing CSS structure

## What is NOT built
- No actual blog pages, FAQ pages, or trading pages — dropdown links point to `/register` or `/login` as appropriate
- No functional notification system in the header — bell is decorative
- No real currency switcher — EN/USD is decorative

---

## Assumptions
- All dropdown sub-links that imply "do something" (buy, sell, trade) go to `/register`
- All dropdown sub-links that imply "view my stuff" (wallet, orders, profile) go to `/login`  
- The "BITUSDT 🔥" decorative ticker link goes to `/register`
- The header dropdowns open on hover (desktop) and on tap (mobile), matching the original Rockie behavior
- "Blog" links to the About section since no blog exists
- The Wallet button in the right side is outlined style (border, no fill) matching the original
