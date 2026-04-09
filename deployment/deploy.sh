#!/bin/bash
# Zenthos Deploy Script
# Run this to deploy or update the application

set -e

APP_DIR="/opt/zenthos"
cd "$APP_DIR"

echo "=== Deploying Zenthos ==="

# Pull latest code
git pull origin main

# Backend setup
echo "--- Setting up backend ---"
cd "$APP_DIR/backend"
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Frontend setup
echo "--- Building frontend ---"
cd "$APP_DIR/frontend"
yarn install
yarn build

# Restart services
echo "--- Restarting services ---"
cd "$APP_DIR"
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== Deployment Complete ==="
pm2 status
