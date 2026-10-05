# UniswapV4 Deployment Package — PRD

## Overview
A complete, independent copy of the Zenthos wallet platform prepared for deployment to `uniswapv4.com` on a Hostinger VPS (179.198.211.231). The original `/app` codebase is **untouched**.

## What Was Built (Phase 1)
- Full codebase copy at `/app/uniswapv4/` with all deployment configs updated
- Backend defaults changed: admin email, DB name, sender email, frontend URL
- Frontend email references updated to `info@uniswapv4.com`
- Deployment scripts updated: setup-vps.sh, deploy.sh, nginx.conf, setup-nginx.sh, ecosystem.config.js
- `.env.example` with pre-filled Resend API key
- Comprehensive deployment README with step-by-step instructions

## Key Config Changes (Copy Only)
| Item | Original (untouched) | Copy (updated) |
|------|---------------------|----------------|
| Domain | zenthos-eu.com | uniswapv4.com |
| VPS directory | /opt/zenthos | /opt/uniswapv4 |
| MongoDB database | blockchain_wallet | uniswapv4-prod |
| Admin email | admin@zenthos-eu.com | admin@uniswapv4.com |
| PM2 process | zenthos-backend | uniswapv4-backend |
| Sender email | noreply@zenthos-eu.com | info@uniswapv4.com |

## Next Steps (Owner)
1. Push `/app/uniswapv4/` to https://github.com/sarrile60/Uniswapv4
2. Point uniswapv4.com A record to 179.198.211.231
3. Add Resend DNS records (SPF/DKIM/DMARC)
4. SSH into VPS and run setup + deploy scripts
5. Run Certbot for SSL

## Phase 2 (Later): UI rebranding
## Phase 3 (Later): Monitoring, backups, CI/CD
