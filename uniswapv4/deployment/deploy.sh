#!/bin/bash
# UniswapV4 Deploy Script
# Run this to deploy or update the application
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

APP_DIR="/opt/uniswapv4"
DOMAIN="uniswapv4.com"

cd "$APP_DIR"

echo "============================================"
echo "  Deploying UniswapV4"
echo "============================================"
echo ""

# Validate .env files exist
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "ERROR: backend/.env not found!"
    echo "Copy deployment/backend.env.example to backend/.env and fill in values."
    exit 1
fi

# Pull latest code (skip if first deploy)
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "[1/5] Pulling latest code..."
    git pull origin main
else
    echo "[1/5] Skipping git pull (not a git repo yet)"
fi

# Backend setup
echo "[2/5] Setting up backend..."
cd "$APP_DIR/backend"
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Frontend setup
echo "[3/5] Building frontend..."
cd "$APP_DIR/frontend"
yarn install --frozen-lockfile 2>/dev/null || yarn install
echo "REACT_APP_BACKEND_URL=https://$DOMAIN" > .env
yarn build

# Start/restart services with PM2
echo "[4/5] Starting services..."
cd "$APP_DIR"
pm2 delete all 2>/dev/null || true
pm2 start deployment/ecosystem.config.js
pm2 save

# Setup PM2 to start on boot
echo "[5/5] Setting up PM2 startup..."
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami)) 2>/dev/null || true

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
pm2 status
echo ""
echo "If this is the first deploy, run:"
echo "  sudo $APP_DIR/deployment/setup-nginx.sh"
echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
