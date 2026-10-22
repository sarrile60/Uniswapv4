# Multi-Tenant Admin Panel — One URL, Two Databases

The same uniswapv4.com website serves two completely separate sets of clients. Both admins log in at the same `/login` page and land on the same `/admin` panel — but each sees only their own clients, stored in their own database. No separate URLs, no visible difference in the interface.

**Who it's for:** Two admin operators (Italy and Canada) sharing one platform, each managing an isolated client base with no data mixing.

---

## Core Features and Experience

### How it works
When any user logs in at `/login`, the backend checks the Italy database first, then the Canada database. It finds the user, issues a JWT that embeds which database that person belongs to (`tenant: main` or `tenant: canada`), and every subsequent API call is automatically routed to the correct database. Nothing is visible to the user.

### Same `/admin` URL for both admins
- Italy admin (`admin@uniswapv4.com`) logs in → sees Italy clients, wallets, KYC, transactions
- Canada admin (`admin@uniswapv4ca.com`) logs in → sees Canada clients, wallets, KYC, transactions
- Same panel, same features, same layout — data is scoped to the admin's tenant
- An Italy admin cannot see or touch Canada data, and vice versa — enforced at the backend

### New Canada database
A second MongoDB database (`uniswapv4-canada`) is created on the same server, starting empty. The Canada admin account is seeded with:
- Email: `admin@uniswapv4ca.com`
- Password: `Admin@123456`
- Role: superadmin

### Italy database untouched
`uniswapv4-prod` is never modified. No schema changes, no migrations, no new fields on existing records. All existing users and data continue working exactly as before.

### Shared login, invisible routing
Clients always use `uniswapv4.com/login`. They do not choose a region. The system resolves the correct database from their JWT on every API call.

---

## User Flow

**Canada admin login:**
1. Goes to `uniswapv4.com/login`
2. Enters `admin@uniswapv4ca.com` / `Admin@123456`
3. Backend finds user in `uniswapv4-canada`, issues JWT with `tenant: canada`
4. Redirected to `/admin` — sees Canada clients only
5. Creates client accounts → stored in `uniswapv4-canada`

**Italy admin login (unchanged):**
1. Goes to `uniswapv4.com/login`
2. Enters existing credentials
3. Found in `uniswapv4-prod`, JWT with `tenant: main`
4. Redirected to `/admin` — sees Italy clients only, no change from today

**Client login (any client):**
1. Goes to `uniswapv4.com/login`
2. Backend checks Italy DB → not found → checks Canada DB → found
3. JWT issued with correct tenant
4. Client sees their own wallet, transactions, KYC — no difference in experience

---

## UI/UX Feel

- No visible difference for any user or admin
- No tenant selector, no region labels, no branding change
- Both admins see the identical admin panel — only the data differs
- A Canada admin who tries to call Italy-scoped API endpoints gets a 403 — silently enforced

---

## Implementation Phases

### Phase 1 — MVP (build now)

1. **Backend: dual database connections**
   Two named MongoDB connections (`db_main`, `db_canada`). A helper `get_db_for_tenant(tenant)` returns the correct one.

2. **Backend: tenant in JWT**
   Login checks `uniswapv4-prod` first, then `uniswapv4-canada`. JWT payload gains a `tenant` field. All existing endpoints receive the same `db_main` they always used — zero regression for Italy users.

3. **Backend: tenant-scoped admin protection**
   `require_admin` now also extracts tenant from JWT and passes the correct database to every admin endpoint. Canada admin calling `/api/admin/users` gets Canada users; Italy admin gets Italy users. Same endpoint, different database — no route changes.

4. **Backend: seed Canada database**
   Create `uniswapv4-canada` with the superadmin account (`admin@uniswapv4ca.com` / `Admin@123456`) on startup if it doesn't exist.

5. **Frontend: no changes needed**
   The frontend already sends JWT with every request. The backend handles all routing. `/admin` continues to work for both admins without any frontend modification.

### Phase 2 (future)
- Per-tenant email sender identity (different `from` address for Canada emails)
- Per-tenant system settings (maintenance mode, auto-approve KYC, etc. isolated per tenant)

### Phase 3 (future)
- Move each tenant to its own Atlas cluster for full hardware isolation
- Tenant-level rate limiting and audit separation

---

## Assumptions

- Login checks Italy DB first. If the same email exists in both databases, Italy always wins. Operationally this should never happen — admins must use different emails per tenant (already the case: `.com` vs `.ca.com`).
- All admin endpoints (`/api/admin/*`) become tenant-aware automatically via the JWT. No new endpoint URLs are introduced.
- The JWT secret is shared between both tenants (no separate secret needed — tenant is inside the signed payload).
- Canada clients are created entirely by the Canada admin after go-live. No data is migrated or pre-seeded.
- The Italy admin panel experience is completely unchanged — this is a backend-only change for the Italy side.
