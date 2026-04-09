# Zenthos VPS Deployment Guide

> Deploy Zenthos to a Hostinger VPS running Ubuntu 22.04+

## Architecture
```
Internet -> Cloudflare (optional) -> Nginx (port 80/443)
                                        |
                                        +-- /api/*     -> FastAPI (port 8001)
                                        +-- /*         -> Static React build
```

---

## Step 1: DNS Setup

Point your domain to your VPS IP address:
- Go to your domain registrar (Hostinger, etc.)
- Add an **A record**: `zenthos-eu.com` -> `YOUR_VPS_IP`
- Add an **A record**: `www.zenthos-eu.com` -> `YOUR_VPS_IP`
- Wait for DNS propagation (5-30 minutes)

---

## Step 2: Initial Server Setup

SSH into your VPS and run the setup script:

```bash
ssh root@YOUR_VPS_IP

# Upload the deployment folder to your VPS first, then:
chmod +x /opt/zenthos/deployment/setup-vps.sh
/opt/zenthos/deployment/setup-vps.sh
```

This installs: Node.js 20, Python 3, MongoDB 7, Nginx, PM2, Certbot, UFW firewall.

---

## Step 3: Clone & Configure

```bash
# Switch to the app user
su - zenthos

# Clone your repo
git clone YOUR_GITHUB_REPO_URL /opt/zenthos

# Create backend .env
cp /opt/zenthos/deployment/backend.env.example /opt/zenthos/backend/.env
nano /opt/zenthos/backend/.env
```

**Fill in these values in backend/.env:**
| Variable | What to put |
|---|---|
| `JWT_SECRET_KEY` | Random 64-char string (run: `openssl rand -hex 32`) |
| `RESEND_API_KEY` | Your Resend API key from resend.com |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `ACCESS_CODE` | Keep as `DMTL610Q` or change to your preferred code |

Frontend .env is auto-generated during deploy.

---

## Step 4: Deploy

```bash
chmod +x /opt/zenthos/deployment/deploy.sh
/opt/zenthos/deployment/deploy.sh
```

This will:
1. Set up Python virtual environment + install dependencies
2. Build the React frontend with `REACT_APP_BACKEND_URL=https://zenthos-eu.com`
3. Start the FastAPI backend via PM2

---

## Step 5: Configure Nginx + SSL

```bash
# Run as root
sudo chmod +x /opt/zenthos/deployment/setup-nginx.sh
sudo /opt/zenthos/deployment/setup-nginx.sh

# Get SSL certificate (domain must already point to this VPS)
sudo certbot --nginx -d zenthos-eu.com -d www.zenthos-eu.com
```

Certbot will automatically configure HTTPS and set up auto-renewal.

---

## Step 6: Verify

Visit `https://zenthos-eu.com` — you should see the Access Gate.
Enter code: `DMTL610Q`

---

## Updating the App

```bash
su - zenthos
cd /opt/zenthos
./deployment/deploy.sh
```

---

## Email DNS Records (Required for Resend)

Add these DNS records at your domain registrar for emails to work:

| Type | Name | Value |
|---|---|---|
| MX | zenthos-eu.com | `feedback-smtp.us-east-1.amazonses.com` (check Resend dashboard) |
| TXT | zenthos-eu.com | `v=spf1 include:amazonses.com ~all` |
| CNAME | resend._domainkey | (from Resend dashboard - DKIM key) |
| TXT | _dmarc | `v=DMARC1; p=none;` |

Check your Resend dashboard (resend.com/domains) for exact values.

---

## Monitoring & Troubleshooting

```bash
# Check service status
pm2 status

# View logs
pm2 logs zenthos-backend --lines 100

# Restart backend
pm2 restart zenthos-backend

# Check nginx status
sudo systemctl status nginx
sudo nginx -t

# Check MongoDB
sudo systemctl status mongod

# Check SSL auto-renewal
sudo certbot renew --dry-run
```

---

## Changing the Access Code

```bash
nano /opt/zenthos/backend/.env
# Change ACCESS_CODE=YOUR_NEW_CODE
pm2 restart zenthos-backend
```

---

## Optional: Cloudflare (Extra Protection)

For maximum anti-phishing protection:
1. Add your domain to Cloudflare (free plan)
2. Change nameservers at Hostinger to Cloudflare's
3. In Cloudflare DNS, add A record -> VPS IP (orange cloud = proxied)
4. Enable "Under Attack Mode" if scanners are active
5. This hides your real VPS IP and adds DDoS protection
