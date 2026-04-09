# Zenthos VPS Deployment Guide

## Prerequisites
- Hostinger VPS (Ubuntu 22.04+)
- Domain pointing to VPS IP (A record)
- SSH access to VPS

## Step 1: Initial Server Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Run setup script (installs Node, Python, MongoDB, Nginx, PM2)
chmod +x deployment/setup-vps.sh
./deployment/setup-vps.sh
```

## Step 2: Clone & Configure

```bash
# Clone your repo
cd /opt/zenthos
git clone YOUR_REPO_URL .

# Create backend .env
cp deployment/backend.env.example backend/.env
nano backend/.env  # Fill in your actual values

# Create frontend .env
cp deployment/frontend.env.example frontend/.env
nano frontend/.env  # Set REACT_APP_BACKEND_URL=https://yourdomain.com
```

## Step 3: Deploy

```bash
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

## Step 4: Configure Nginx

```bash
# Copy nginx config
sudo cp deployment/nginx.conf /etc/nginx/sites-available/zenthos
sudo ln -sf /etc/nginx/sites-available/zenthos /etc/nginx/sites-enabled/zenthos
sudo rm -f /etc/nginx/sites-enabled/default

# Edit: replace yourdomain.com with your actual domain
sudo nano /etc/nginx/sites-available/zenthos

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 6: Cloudflare (Recommended)

1. Add your domain to Cloudflare (free plan)
2. Point your domain's nameservers to Cloudflare
3. In Cloudflare DNS, add A record pointing to your VPS IP (orange cloud = proxied)
4. Enable "Under Attack Mode" if needed
5. This hides your real VPS IP from scanners

## Updating

```bash
cd /opt/zenthos
./deployment/deploy.sh
```

## Access Code

The platform is protected by an access code. Users must enter `DMTL610Q` to access the site.
To change it, edit `ACCESS_CODE` in `backend/.env` and restart:

```bash
pm2 restart zenthos-backend
```

## Monitoring

```bash
pm2 status          # Check if services are running
pm2 logs            # View logs
pm2 logs zenthos-backend --lines 50  # Backend logs
```
