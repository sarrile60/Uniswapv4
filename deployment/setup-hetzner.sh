#!/bin/bash
# ============================================================
# Hetzner VPS - Full Setup Script for uni-swapv4.org
# Run as root: bash setup-hetzner.sh
# ============================================================

set -e
echo "========================================"
echo " uni-swapv4.org — Hetzner VPS Setup"
echo "========================================"

# ── 1. System update ─────────────────────────────────────────
echo ""
echo "[1/9] Updating system..."
apt update -qq && apt upgrade -y -qq
apt install -y -qq git curl wget nginx certbot python3-certbot-nginx \
  python3 python3-pip python3-venv build-essential ufw

# ── 2. Node.js 20 + Yarn ─────────────────────────────────────
echo ""
echo "[2/9] Installing Node.js 20 + Yarn..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y -qq nodejs
npm install -g yarn pm2 --silent

# ── 3. MongoDB 7 ─────────────────────────────────────────────
echo ""
echo "[3/9] Installing MongoDB 7..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
apt update -qq
apt install -y -qq mongodb-org
systemctl enable mongod
systemctl start mongod
echo "MongoDB started ✓"

# ── 4. Clone repo ─────────────────────────────────────────────
echo ""
echo "[4/9] Cloning repository..."
mkdir -p /opt/uniswapv4
cd /opt/uniswapv4

if [ -d ".git" ]; then
  echo "Repo already exists, pulling latest..."
  git pull origin main
else
  git clone https://github.com/sarrile60/Uniswapv4.git .
fi

# ── 5. Backend setup ─────────────────────────────────────────
echo ""
echo "[5/9] Setting up backend..."
cd /opt/uniswapv4/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -q
deactivate

# Create .env file
cat > /opt/uniswapv4/backend/.env << 'ENVEOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="blockchain_wallet"
DB_NAME_CANADA="uniswapv4-canada"
CORS_ORIGINS="*"
RESEND_API_KEY="re_TxwLNCEv_PJJSPVn6QSUykKyJVzaywbBZ"
SENDER_EMAIL="noreply@secure-blockchainplatform.com"
FRONTEND_URL="https://uni-swapv4.org"
UNSUBSCRIBE_URL="https://uni-swapv4.org/api/unsubscribe"
REPLY_TO_EMAIL="support@secure-blockchainplatform.com"
CLOUDINARY_CLOUD_NAME=ditryuycq
CLOUDINARY_API_KEY=458857888894956
CLOUDINARY_API_SECRET=7JcM2POPh-YCdlLSTHlyncitZAE
JWT_SECRET_KEY=6ca55294bbf227c284fe763542c554c7a0010422e80916c0ef4eddbd65b0bf39
ACCESS_CODE="wyz234"
ENVEOF

echo "Backend .env created ✓"

# ── 6. Frontend build ─────────────────────────────────────────
echo ""
echo "[6/9] Building frontend..."
cd /opt/uniswapv4/frontend
yarn install --silent
yarn build
echo "Frontend built ✓"

# ── 7. PM2 — start backend ────────────────────────────────────
echo ""
echo "[7/9] Starting backend with PM2..."
cd /opt/uniswapv4

pm2 delete backend 2>/dev/null || true
pm2 start "source backend/venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1" \
  --name backend \
  --interpreter bash \
  --cwd /opt/uniswapv4/backend
pm2 save
pm2 startup | tail -1 | bash || true
echo "PM2 backend started ✓"

# ── 8. Nginx config ───────────────────────────────────────────
echo ""
echo "[8/9] Configuring Nginx..."
cp /opt/uniswapv4/uniswapv4/deployment/nginx.conf /etc/nginx/sites-available/uni-swapv4
ln -sf /etc/nginx/sites-available/uni-swapv4 /etc/nginx/sites-enabled/uni-swapv4
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
echo "Nginx configured ✓"

# ── 9. Firewall ───────────────────────────────────────────────
echo ""
echo "[9/9] Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
echo "Firewall configured ✓"

echo ""
echo "========================================"
echo " SETUP COMPLETE!"
echo "========================================"
echo ""
echo " Next step — get SSL certificate:"
echo " certbot --nginx -d uni-swapv4.org -d www.uni-swapv4.org"
echo ""
echo " After SSL, your deploy command is:"
echo " cd /opt/uniswapv4 && git pull origin main && cd backend && source venv/bin/activate && pip install -r requirements.txt -q && deactivate && cd ../frontend && yarn install --silent && yarn build && cd .. && pm2 restart backend && sudo systemctl reload nginx"
echo ""
