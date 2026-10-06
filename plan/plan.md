# Header Avatar Initials, Session Timeout & Dark-Mode Fixes

Uniswap V4's header avatar currently shows a generic person icon for all users. When a client is logged in it should instead display a circle with their **first-name initial + last-name initial** (e.g. "JD" for John Doe). The session currently lasts 7 days; the user wants a **24-hour** expiry. Several pages also have dark-mode colour bugs that need fixing.

## Who it's for
End-users who log in to the platform and navigate across Landing, Wallet, Transactions, Profile, FAQ/Terms, and Privacy pages.

## Core features and experience

1. **Avatar with initials (desktop only for now)**
   - When logged in the blue avatar circle in the header shows the user's first + last initial in white text (e.g. "JD"), replacing the generic person SVG.
   - When not logged in, the avatar stays as the current generic person icon linking to `/login`.
   - Mobile: no change — avatar remains hidden per user request.

2. **24-hour session timeout**
   - JWT token expiry changed from 168 hours (7 days) → **24 hours**.
   - After 24 h the token expires, API calls return 401, and the frontend redirects to `/login`.

3. **Dark-mode colour fixes across pages**
   - **Terms of Service / FAQ page** — uses Tailwind light-mode classes (`text-gray-900`, `bg-gray-50`, etc.) that become invisible on the forced dark background. Will be rewritten with explicit dark-friendly styles (same approach already applied to About page).
   - **Privacy Policy page** — same treatment.
   - **Wallet Dashboard bottom nav bar** — `bg-white` mobile bottom nav renders as near-invisible dark bar; will get explicit dark styling.
   - **Wallet modals and inner cards** — audit any remaining `bg-white`, `text-gray-900`, `bg-gray-100` usages that clash with the dark override and patch them.
   - **EN/USD language toggle** — the "Italiano / EUR" option in the header dropdown is not clickable / does nothing. Wire it to the existing `toggleLang()` i18n function so clicking switches the UI language and closes the dropdown.

## User flow
1. User opens the site → sees landing page with dark theme, real-time prices.
2. User logs in → header avatar switches from person icon to "JD" initials circle.
3. User clicks EN/USD dropdown → can toggle between English / USD and Italiano / EUR.
4. User visits Terms, Privacy, Wallet pages → all text clearly visible on dark background.
5. After 24 hours of inactivity the token expires → user is returned to login.

## UI/UX feel
- Avatar circle stays the same blue (#3772ff) background with white bold initials, same 40 px size.
- Dark-mode fixes use the established palette: `#141416` body, `#222630` cards, `#fff` headings, `#b1b5c3` body text, `#23262f` borders.
- No layout or structural changes — only colour corrections and the avatar text swap.

## Implementation phases

### Phase 1 — MVP (built now)
| # | Item | Detail |
|---|------|--------|
| 1 | Avatar initials | Replace generic SVG with first + last initial when `user` prop is present. Keep generic SVG for logged-out state. |
| 2 | Session timeout | Change `ACCESS_TOKEN_EXPIRE_HOURS` from 168 → 24 in `auth.py`. |
| 3 | Terms/FAQ dark fix | Rewrite `TermsOfServicePage.js` with inline dark styles (same pattern as the About page fix). |
| 4 | Privacy dark fix | Same rewrite for `PrivacyPolicyPage.js`. |
| 5 | Wallet dark audit | Fix bottom nav, modal backgrounds, and any remaining light-mode artefacts in `WalletDashboard.js` and `theme-override.css`. |
| 6 | Language toggle | Wire "Italiano / EUR" click in RockieHeader to `toggleLang` from the i18n context; close dropdown on selection. |
| 7 | Testing agent | Run full verification of all 6 items above. |

### Phase 2 (future)
- Sliding session refresh (extend token on activity) so active users never get logged out mid-session.
- Persist language preference in `localStorage`.

### Phase 3 (future)
- Gravatar / uploaded profile picture in the avatar circle.
- Push-notification support with browser Notification API.

## Assumptions
- "24 hours" means a hard 24-hour token lifetime from login, not 24 hours of inactivity. There is no sliding session at present.
- The Italiano / EUR toggle will use the existing `toggleLang` i18n machinery already in the codebase; no new translations are being added.
- Mobile avatar remains hidden as explicitly requested — no changes to mobile header layout.
- Admin panel pages are untouched (they use their own Tailwind dark styles and are not wrapped in RockieLayout).
