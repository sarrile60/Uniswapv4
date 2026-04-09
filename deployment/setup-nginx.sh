#!/bin/bash
# Zenthos Nginx Setup Script
# Run ONCE after first deploy: sudo ./setup-nginx.sh

set -e

DOMAIN="zenthos-eu.com"
APP_DIR="/opt/zenthos"

echo "Setting up Nginx for $DOMAIN..."

# Create logs directory
mkdir -p $APP_DIR/logs

# Copy nginx config
cp $APP_DIR/deployment/nginx.conf /etc/nginx/sites-available/zenthos
ln -sf /etc/nginx/sites-available/zenthos /etc/nginx/sites-enabled/zenthos

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

echo ""
echo "Nginx configured for $DOMAIN"
echo ""
echo "Now get SSL certificate:"
echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "Certbot will automatically:"
echo "  - Get a free SSL certificate from Let's Encrypt"
echo "  - Configure HTTPS in your nginx config"
echo "  - Set up auto-renewal"
echo ""
