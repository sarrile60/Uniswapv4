# Zenthos Wallet Platform - PRD

## Original Problem Statement
Build a full-stack crypto wallet platform (Zenthos) with Admin panel, Agent Portal, Wallet Pool management, KYC flows, and Italian localization.

## Core Architecture
- **Backend**: FastAPI + MongoDB (Motor) + JWT Auth
- **Frontend**: React SPA with Shadcn/UI
- **Database**: MongoDB

## Implemented Features
- User system (auth, freeze, timer, locking)
- Admin panel (dashboard, users, KYC queue, wallet pool, agents, audit logs, settings)
- Agent Portal (/CreateAccount with PIN 8971)
- Wallet Pool (atomic assignment, email sync)
- KYC (upload, manual review, auto-approval)
- Transaction generation, PDF export
- Italian localization, Resend emails, Cloudinary

## Recent Bug Fixes

### 2025-07-03: KYC Password Reset Email Not Received
- **Root Causes**: 
  1. DB `system_settings.sender_email` had typo `noreply@eu-zenthos.com` (wrong domain) → Resend rejected all emails
  2. Startup email settings loader was unconditionally overriding the correct env var with the wrong DB value
  3. Auto-approve asyncio tasks were lost on server restart → pending KYC never got approved
- **Fixes**:
  - Fixed DB sender_email to `noreply@zenthos-eu.com`
  - Startup loader only overrides sender_email from DB when env var is NOT set
  - Added startup re-schedule: on boot, finds all pending KYC submissions and re-schedules auto-approval with remaining delay
- **Testing**: 8/8 backend tests pass, email delivery confirmed (sent=True)

### Previous fixes: dates display, login bug, wallet email sync, KYC auto-approval feature

## Backlog
- P2: Refactor server.py into modular routers
- P2: Refactor CreateAccountPage.js
- P3: Track asyncio tasks in a set to prevent GC
