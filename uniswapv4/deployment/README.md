# UniswapV4 — VPS Deployment Guide

> Deploy UniswapV4 to a Hostinger VPS (179.198.211.231) running Ubuntu 22.04+

## Architecture
```
Internet → Nginx (port 80/443, SSL via Let's Encrypt)
               |
               +── /api/*     → FastAPI backend (port 8001, via PM2)
               +── /*         → Static React build (served by Nginx)
               
MongoDB (local, port 27017, database: uniswapv4-prod)
```

---

## Quick Reference

| Item | Value |
|------|-------|
| Domain | uniswapv4.com |
| VPS IP | 179.198.211.231 |
| VPS directory | /opt/uniswapv4 |
| Database | uniswapv4-prod |
| Admin login | admin@uniswapv4.com / admin123 |
| PM2 process | uniswapv4-backend |
| Sender email | info@uniswapv4.com |
| GitHub repo | https://github.com/sarrile60/Uniswapv4 |

---

## Step 1: DNS Setup (Do This First)

Go to your domain registrar (where you bought uniswapv4.com) and add these DNS records:

### A Records (Required)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 179.198.211.231 | 300 |
| A | www | 179.198.211.231 | 300 |

### Email DNS Records (Required for Resend emails to work)

Log into your Resend dashboard at https://resend.com/domains and add the domain `uniswapv4.com`. Resend will give you specific DNS records to add. They typically look like:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT | @ | `v=spf1 include:amazonses.com ~all` | SPF — authorizes Resend to send email |
| CNAME | `resend._domainkey` | *(from Resend dashboard)* | DKIM — email authentication |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC — email policy |
| MX | @ | `feedback-smtp.us-east-1.amazonses.com` (priority 10) | MX — for bounce handling |

> **Important:** The exact DKIM value comes from your Resend dashboard. Go to https://resend.com/domains → Add Domain → `uniswapv4.com` → it will show you the exact records to add.

Wait 5-30 minutes for DNS propagation before proceeding.

You can verify propagation with:
```bash
dig uniswapv4.com +short
# Should return: 179.198.211.231
```

---

## Step 2: Push Code to GitHub

The code is prepared in this repository. Push it to `https://github.com/sarrile60/Uniswapv4`:

```bash
# From your local machine where you have the code:
cd /path/to/uniswapv4
git init
git remote add origin https://github.com/sarrile60/Uniswapv4.git
git add .
git commit -m "Initial UniswapV4 deployment"
git branch -M main
git push -u origin main
```

---

## Step 3: Initial Server Setup

SSH into the VPS and run the setup script:

```bash
ssh root@179.198.211.231

# First, create a temporary directory and clone the repo
mkdir -p /tmp/uniswapv4-setup
cd /tmp/uniswapv4-setup
git clone https://github.com/sarrile60/Uniswapv4 .

# Run the setup script (installs Node, Python, MongoDB, Nginx, PM2, Certbot)
chmod +x deployment/setup-vps.sh
sudo ./deployment/setup-vps.sh
```

This installs:
- Node.js 20 + Yarn
- Python 3 + pip + venv
- MongoDB 7
- Nginx
- PM2
- Certbot
- UFW firewall (allows SSH + HTTP/HTTPS)

---

## Step 4: Clone & Configure

```bash
# Switch to the app user
su - uniswapv4

# Clone the repo into the app directory
git clone https://github.com/sarrile60/Uniswapv4 /opt/uniswapv4

# Create the backend .env from the template
cp /opt/uniswapv4/deployment/backend.env.example /opt/uniswapv4/backend/.env
```

Now edit the `.env` file:
```bash
nano /opt/uniswapv4/backend/.env
```

**Required changes:**
1. **JWT_SECRET_KEY** — Generate a random key:
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and paste it as the JWT_SECRET_KEY value.

2. **RESEND_API_KEY** — Already pre-filled with `re_39Rm39WT_F11KXowPxvtXAtfhNz24Mbia`

3. **Cloudinary credentials** — Fill in your Cloudinary cloud name, API key, and API secret (for KYC document uploads). Get these from https://cloudinary.com/console

4. **ACCESS_CODE** — The gate code. Default is `DMTL610Q`. Change if desired.

Save and exit (`Ctrl+X`, `Y`, `Enter`).

---

## Step 5: Deploy

```bash
# Make sure you're the uniswapv4 user
su - uniswapv4

# Run the deploy script
chmod +x /opt/uniswapv4/deployment/deploy.sh
/opt/uniswapv4/deployment/deploy.sh
```

This will:
1. Create Python virtual environment & install backend dependencies
2. Install frontend dependencies with Yarn
3. Build the React frontend with `REACT_APP_BACKEND_URL=https://uniswapv4.com`
4. Start the FastAPI backend via PM2

---

## Step 6: Configure Nginx + SSL

```bash
# Run as root (exit back to root if you're the uniswapv4 user)
exit

# Setup Nginx
chmod +x /opt/uniswapv4/deployment/setup-nginx.sh
sudo /opt/uniswapv4/deployment/setup-nginx.sh

# Get SSL certificate (domain MUST already point to this VPS!)
sudo certbot --nginx -d uniswapv4.com -d www.uniswapv4.com
```

Certbot will:
- Get a free SSL certificate from Let's Encrypt
- Automatically configure HTTPS in your Nginx config
- Set up auto-renewal (certificates renew automatically)

---

## Step 7: Verify

1. Visit `https://uniswapv4.com` — you should see the Access Gate
2. Enter code: `DMTL610Q` (or whatever you set in `.env`)
3. Login with admin: `admin@uniswapv4.com` / `admin123`
4. **Change the admin password immediately after first login!**

---

## Updating the App

When you push new code to GitHub:

```bash
su - uniswapv4
cd /opt/uniswapv4
./deployment/deploy.sh
```

This pulls latest code, rebuilds frontend, and restarts the backend.

---

## Monitoring & Troubleshooting

```bash
# Check backend status
pm2 status

# View backend logs (live)
pm2 logs uniswapv4-backend --lines 100

# Restart backend
pm2 restart uniswapv4-backend

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check MongoDB
sudo systemctl status mongod

# Check SSL auto-renewal
sudo certbot renew --dry-run

# Check if ports are listening
sudo ss -tlnp | grep -E '(8001|80|443|27017)'
```

### Common Issues

**Site not loading:**
```bash
# Check if backend is running
pm2 status
# Check backend logs
pm2 logs uniswapv4-backend --lines 50
# Check Nginx is running
sudo systemctl status nginx
```

**API returning 502 Bad Gateway:**
```bash
# Backend probably crashed - check logs and restart
pm2 logs uniswapv4-backend --lines 50
pm2 restart uniswapv4-backend
```

**SSL certificate issues:**
```bash
# Make sure DNS is pointing to the VPS first, then:
sudo certbot --nginx -d uniswapv4.com -d www.uniswapv4.com
```

**Emails not sending:**
1. Check that Resend domain is verified at https://resend.com/domains
2. Check that DNS records (SPF, DKIM) are added at your registrar
3. Check backend logs: `pm2 logs uniswapv4-backend --lines 50`

**MongoDB not starting:**
```bash
sudo systemctl status mongod
sudo journalctl -u mongod --lines 50
```

---

## Changing the Access Code

```bash
nano /opt/uniswapv4/backend/.env
# Change ACCESS_CODE=YOUR_NEW_CODE
pm2 restart uniswapv4-backend
```

---

## Database Management

```bash
# Connect to MongoDB shell
mongosh

# List databases
show dbs

# Use the UniswapV4 database
use uniswapv4-prod

# Check users
db.users.find({role: "superadmin"}).pretty()

# Check collection counts
db.users.countDocuments()
db.wallets.countDocuments()
db.transactions.countDocuments()
```

### Backup Database
```bash
# Create a backup
mongodump --db uniswapv4-prod --out /opt/uniswapv4/backups/$(date +%Y%m%d)

# Restore from backup
mongorestore --db uniswapv4-prod /opt/uniswapv4/backups/YYYYMMDD/uniswapv4-prod/
```

---

## Resend Email Verification

After adding DNS records, verify in Resend:

1. Go to https://resend.com/domains
2. Click on `uniswapv4.com`
3. All records should show green checkmarks ✅
4. If any are pending, wait a few more minutes for DNS propagation
5. You can send a test email from the Resend dashboard to verify

---

## File Structure on VPS

```
/opt/uniswapv4/
├── backend/
│   ├── .env              ← Your environment variables (NEVER commit this)
│   ├── server.py         ← FastAPI application
│   ├── models.py         ← Database models
│   ├── auth.py           ← Authentication
│   ├── email_service.py  ← Resend email integration
│   ├── requirements.txt  ← Python dependencies
│   └── venv/             ← Python virtual environment (created by deploy.sh)
├── frontend/
│   ├── src/              ← React source code
│   ├── build/            ← Production build (created by deploy.sh)
│   ├── .env              ← Frontend env (auto-created by deploy.sh)
│   └── package.json      ← Frontend dependencies
├── deployment/
│   ├── setup-vps.sh      ← Initial VPS setup (run once)
│   ├── deploy.sh         ← Deploy/update script
│   ├── setup-nginx.sh    ← Nginx configuration (run once)
│   ├── nginx.conf        ← Nginx site config
│   ├── ecosystem.config.js ← PM2 process config
│   └── backend.env.example ← .env template
└── logs/
    ├── backend-out.log   ← Backend stdout
    └── backend-error.log ← Backend stderr
```

---

## Security Notes

- The admin password is `admin123` by default — **change it immediately** after first login
- The access code gate prevents unauthorized access to the login page
- All API responses include security headers (X-Frame-Options, CSP, HSTS, etc.)
- Bot detection blocks known crawlers and scanners
- robots.txt blocks all indexing
- MongoDB is only accessible locally (not exposed to internet)
- UFW firewall only allows SSH, HTTP, and HTTPS traffic
