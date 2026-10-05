# UniswapV4 — Separate Deployment to VPS

A complete, independent copy of the existing platform deployed to uniswapv4.com on a Hostinger VPS (179.198.211.231), with its own fresh MongoDB database — without touching the existing Zenthos EU codebase or data.

---

## Who it's for

The platform owner deploying a second, independent instance to a new domain.

---

## Core deliverables

1. **Separate codebase copy** — Full copy of the app prepared in `/app/uniswapv4/`, with deployment configs changed for `uniswapv4.com`. Ready to push to `https://github.com/sarrile60/Uniswapv4`. The original `/app` code is **never modified**.

2. **Fresh database** — Connects to a new MongoDB database named `uniswapv4-prod` on the VPS's local MongoDB instance. The existing Zenthos database is completely untouched.

3. **Resend email integration** — Pre-configured with the provided Resend API key, sending from `info@uniswapv4.com` (or `noreply@uniswapv4.com` depending on Resend domain verification).

4. **SSL/HTTPS** — Certbot instructions for free Let's Encrypt certificate on the VPS.

5. **VPS deployment scripts** — Updated `setup-vps.sh`, `deploy.sh`, `setup-nginx.sh`, `nginx.conf`, and `ecosystem.config.js` — all pointing to `uniswapv4.com`, `/opt/uniswapv4/`, and `uniswapv4-prod` database.

6. **DNS + Email DNS guide** — Step-by-step instructions for A records, SPF, DKIM, DMARC at the registrar.

---

## What changes in the copy (configs only, no branding)

| Item | Zenthos (original, untouched) | UniswapV4 (new copy) |
|------|------|------|
| Domain | zenthos-eu.com | uniswapv4.com |
| VPS directory | /opt/zenthos | /opt/uniswapv4 |
| MongoDB database | blockchain_wallet | uniswapv4-prod |
| Default admin email | admin@zenthos-eu.com | admin@uniswapv4.com |
| Admin password | admin123 | admin123 |
| PM2 process name | zenthos-backend | uniswapv4-backend |
| Nginx site name | zenthos | uniswapv4 |
| Sender email | noreply@zenthos-eu.com | info@uniswapv4.com |
| Frontend URL env | https://zenthos-eu.com | https://uniswapv4.com |
| Resend API key | (existing) | re_39Rm39WT_F11KXowPxvtXAtfhNz24Mbia |
| App branding | Zenthos | Zenthos (unchanged for now) |

---

## Deployment flow (what the owner does)

1. We prepare the full codebase in `/app/uniswapv4/` with all configs updated.
2. Owner pushes to `https://github.com/sarrile60/Uniswapv4`.
3. Owner points `uniswapv4.com` A record to `179.198.211.231`.
4. Owner adds Resend DNS records (SPF/DKIM/DMARC) at their registrar.
5. Owner SSHs into VPS and runs the setup + deploy scripts.
6. Owner runs Certbot for SSL.
7. Site is live at `https://uniswapv4.com` with a fresh empty database and `admin@uniswapv4.com / admin123`.

---

## Implementation — Phase 1 (built now)

| Step | What | Done when |
|------|------|-----------|
| 1 | **Copy codebase** to `/app/uniswapv4/` — full backend + frontend + deployment folder | Directory exists with all files |
| 2 | **Update deployment configs** — `setup-vps.sh`, `deploy.sh`, `nginx.conf`, `setup-nginx.sh`, `ecosystem.config.js` all reference `uniswapv4.com`, `/opt/uniswapv4/`, `uniswapv4-prod` | All scripts use correct paths/domain |
| 3 | **Update backend defaults** — admin email, DB name, sender email, frontend URL in server.py startup and email_service.py | Backend boots with correct admin and DB |
| 4 | **Create `.env.example`** — Pre-filled template with Resend key, DB name, all required vars documented | File ready to copy to `.env` on VPS |
| 5 | **Update deployment README** — Complete step-by-step guide with VPS IP, DNS records, Resend setup, and troubleshooting | README covers full deployment |
| 6 | **Verify no original files touched** — Confirm `/app/backend/`, `/app/frontend/`, `/app/deployment/` are unmodified | Original code untouched |

## Phase 2 (later)

- UI rebranding (logos, colors, "UniswapV4" branding, ThemeForest theme)
- Custom email templates with UniswapV4 branding

## Phase 3 (later)

- Monitoring and backups
- CI/CD pipeline for updates

---

## Architecture (same as Zenthos, proven to work)

```
Internet → Nginx (port 80/443, SSL via Certbot)
               |
               +── /api/*     → FastAPI (port 8001, via PM2)
               +── /*         → Static React build (served by Nginx)
               
MongoDB (local, port 27017, database: uniswapv4-prod)
```

No Docker. Same PM2 + Nginx + local MongoDB setup that already works for Zenthos.

---

## Assumptions

- **Same architecture as Zenthos** — PM2, Nginx, local MongoDB. Not Docker. This is proven and the owner is familiar with it.
- **Branding stays as Zenthos** — No UI/email text changes in Phase 1. Only deployment configs change.
- **VPS is a fresh Ubuntu 22.04+ Hostinger instance** at 179.198.211.231.
- **Resend domain verification needed** — The owner must verify `uniswapv4.com` in their Resend dashboard and add the DNS records before emails will send. Instructions provided.
- **GitHub push is manual** — We prepare the code; the owner pushes it to their repo.
- **Original `/app` code is read-only** — We copy files, never modify originals.
