# 2FA — TOTP Authenticator App for Clients (with Admin Bypass + Stored Bypass Code)

Real two-factor authentication using time-based one-time passwords (TOTP), compatible with Google Authenticator, Authy, and Microsoft Authenticator. Clients opt in from the Security page and are asked for a 6-digit code on every login once enabled. Admins can bypass 2FA on any account using a stored admin bypass code visible in the user's admin panel record.

**Who it's for:** Regular user clients who want to secure their account with a second factor. Admins are not affected by 2FA on their own login and can access any user account by using that user's stored admin bypass code.

---

## Core Features and Experience

- **Enable 2FA:** From the Security page, the user clicks "Enable 2FA". The app generates a unique secret, shows a QR code to scan with any authenticator app, and asks the user to confirm with one live code before activating. Once confirmed, 2FA is on.
- **Login with 2FA:** After entering email + password, if 2FA is enabled, the login page shows a second screen asking for the 6-digit code from the authenticator app. Wrong or expired code → rejected. Correct code → logged in normally.
- **Disable 2FA:** From the Security page, the user enters their current password and a live 6-digit code to turn it off.
- **Recovery codes:** On setup confirmation, 8 single-use backup codes are shown once and never again. If the user loses their phone, they can enter a backup code instead of the TOTP code.
- **Admin bypass code (stored per user):** Every user has an `admin_bypass_code` stored in plaintext on their record in the admin panel. When a user enables 2FA, this code is auto-generated (16-character alphanumeric). The admin opens the user's record, copies the bypass code, and can hand it to anyone who needs access to that account. Entering this code at the 2FA step grants full access, exactly like a valid TOTP code.
- **Admin bypass code visible in admin panel:** The bypass code appears in the user's detail page in the admin panel — visible only to admins, never shown to the user themselves.

---

## User Flow

**Enabling:**
1. User opens Security page → clicks "Enable 2FA"
2. Modal shows QR code + manual entry key
3. User scans with Google Authenticator → enters the 6-digit code shown
4. Backend verifies code → marks 2FA as active → generates and stores `admin_bypass_code` → shows 8 backup codes once
5. Security page now shows "2FA: Enabled" with a green badge

**Logging in with 2FA active (regular user):**
1. User enters email + password → backend validates credentials
2. Backend issues a short-lived `2fa_pending` token (5 minutes)
3. Frontend shows "Enter your authenticator code" step
4. User types the 6-digit TOTP code → verified → full JWT issued → logged in
5. A backup code works once then is invalidated

**Admin accessing an account with 2FA enabled:**
1. Admin opens the user's record in the admin panel → sees `Admin Bypass Code: XXXXXXXXXXXXXXXX`
2. Admin copies the code and gives it (or uses it directly) at the 2FA login step
3. The bypass code is accepted at the same 6-digit code input — it never expires and is always valid
4. Alternatively, admin can use "Preview as user" from the admin panel which silently skips 2FA entirely (no code needed)

**Disabling:**
1. User clicks "Disable 2FA" on Security page
2. Modal asks for current password + a live TOTP code
3. Both correct → 2FA off, TOTP secret and bypass code deleted from the account

---

## UI/UX Feel

- Setup modal: QR code → verify step → backup codes (3-step flow)
- Login 2FA step: same login card style, new code input screen
- Backup codes: monospace grid, "Copy all" button, one-time warning
- Admin panel user detail page: new read-only field "Admin Bypass Code" with a copy button, shown only when `totp_enabled = true` for that user
- No visible change for the user — they never see the bypass code

---

## Implementation Phases

### Phase 1 — MVP (build now)
- Install `pyotp` and `qrcode[pil]` on the backend
- New endpoints:
  - `POST /api/2fa/setup` — generates secret, returns QR base64 PNG + manual key
  - `POST /api/2fa/verify-setup` — verifies first TOTP code, activates 2FA, generates `admin_bypass_code`, returns 8 backup codes
  - `POST /api/2fa/disable` — verifies password + TOTP code, removes 2FA and bypass code
- Modify `POST /api/auth/login` — if 2FA enabled, return `requires_2fa: true` + `2fa_pending` token instead of full JWT
- Add `POST /api/auth/2fa-complete` — accepts pending token + TOTP code OR backup code OR admin bypass code → returns full JWT
- Store on the user record: `totp_secret` (Fernet-encrypted), `totp_enabled` (bool), `totp_backup_codes` (bcrypt-hashed list), `admin_bypass_code` (plaintext, 16-char alphanumeric)
- Admin panel user detail page: display `admin_bypass_code` in a read-only field with copy button when 2FA is active
- Admin "Preview as user": silently bypasses 2FA (no code needed at all)
- Frontend Security page: replace "UNAVAILABLE / Coming Soon" with working Enable/Disable flow
- Frontend login: detect `requires_2fa` and show code entry step

### Phase 2 (future)
- Admin panel user list shows a "2FA" column (on/off)
- Admin can regenerate or revoke the bypass code from the user detail page
- Rate-limit TOTP attempts (max 5 wrong codes per 15 minutes)

### Phase 3 (future)
- SMS fallback
- Session trust ("remember this device for 30 days")

---

## Assumptions

- The `admin_bypass_code` is stored in plaintext (not hashed) so admins can read and share it; it is only accessible via authenticated admin endpoints
- The bypass code is 16 characters (alphanumeric uppercase), e.g. `A3FX9KL2MNQ7BWDP` — long enough to be unguessable but short enough to copy/paste easily
- The bypass code is accepted at the same input as the TOTP code — no separate field
- The bypass code does not expire and is not consumed on use (unlike backup codes which are single-use)
- The bypass code is generated fresh each time 2FA is enabled and deleted when 2FA is disabled
- The QR code is generated server-side as base64 PNG
- TOTP secret is Fernet-encrypted before storage
- Backup codes are bcrypt-hashed, shown once only
- `2fa_pending` token is a 5-minute JWT with `type: "2fa_pending"` — cannot be used for any other API call
- Issuer name in authenticator app is `"Uniswap V4"`
- Admins are never asked for a TOTP code on their own login
