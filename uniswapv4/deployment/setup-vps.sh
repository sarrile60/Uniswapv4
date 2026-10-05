#!/bin/bash
# UniswapV4 VPS Initial Setup Script
# Run this ONCE on a fresh Hostinger VPS (Ubuntu 22.04+)
# Usage: chmod +x setup-vps.sh && sudo ./setup-vps.sh

set -e

DOMAIN="uniswapv4.com"
APP_DIR="/opt/uniswapv4"
APP_USER="uniswapv4"

echo "============================================"
echo "  UniswapV4 VPS Setup - Ubuntu 22.04+"
echo "============================================"
echo ""

# 1. Update system
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# 2. Install Node.js 20
echo "[2/8] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn

# 3. Install Python 3.11+ and pip
echo "[3/8] Installing Python..."
apt install -y python3 python3-pip python3-venv

# 4. Install MongoDB 7
echo "[4/8] Installing MongoDB 7..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 5. Install Nginx
echo "[5/8] Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# 6. Install PM2
echo "[6/8] Installing PM2..."
npm install -g pm2

# 7. Install Certbot
echo "[7/8] Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# 8. Create app directory and user
echo "[8/8] Setting up app directory..."
useradd -m -s /bin/bash $APP_USER 2>/dev/null || true
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# Configure UFW firewall
echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Point $DOMAIN DNS (A record) to this VPS IP"
echo "  2. Clone your repo:"
echo "     su - $APP_USER"
echo "     git clone https://github.com/sarrile60/Uniswapv4 $APP_DIR"
echo "  3. Configure .env files:"
echo "     cp $APP_DIR/deployment/backend.env.example $APP_DIR/backend/.env"
echo "     nano $APP_DIR/backend/.env"
echo "  4. Run: $APP_DIR/deployment/deploy.sh"
echo "  5. Run: sudo $APP_DIR/deployment/setup-nginx.sh"
echo "  6. Get SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
