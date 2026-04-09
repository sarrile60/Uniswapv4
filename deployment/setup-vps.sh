#!/bin/bash
# Zenthos VPS Initial Setup Script
# Run this ONCE on a fresh Hostinger VPS (Ubuntu 22.04+)

set -e

echo "=== Zenthos VPS Setup ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install yarn
sudo npm install -g yarn

# Install Python 3.11+ and pip
sudo apt install -y python3 python3-pip python3-venv

# Install MongoDB 7
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# Install PM2
sudo npm install -g pm2

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Create app directory
sudo mkdir -p /opt/zenthos
sudo chown $USER:$USER /opt/zenthos

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "1. Clone your repo to /opt/zenthos"
echo "2. Copy .env files (see .env.example files)"
echo "3. Run deploy.sh"
echo "4. Set up SSL: sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
