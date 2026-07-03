# Zenthos Wallet Platform - PRD

## Original Problem Statement
Build a full-stack crypto wallet platform (Zenthos) with Admin panel, Agent Portal, Wallet Pool management, KYC flows, and Italian localization.

## Core Architecture
- **Backend**: FastAPI + MongoDB (Motor) + JWT Auth
- **Frontend**: React SPA with Shadcn/UI

## Implemented Features
- User system (auth, freeze, timer, locking)
- Admin panel (dashboard, users, KYC queue, wallet pool, agents, audit logs, settings)
- Agent Portal (/CreateAccount): Create Account, Check Account (with login history), My Clients
- Wallet Pool (atomic assignment, email sync on user email change)
- KYC (upload, manual review, auto-approval with configurable timer)
- Transaction generation, PDF export, Italian localization
- Integrations: MongoDB, Resend, Cloudinary, Frankfurter API

## Recent Changes

### 2025-07-03: Client Login History in Agent Check Account
- Agent "Verifica Account" now shows client login history (timestamps + IPs)
- Backend returns `login_history` array and `total_logins` count
- Frontend shows "Cronologia Accessi" with scrollable list and count badge
- Testing: 6/6 backend + frontend E2E verified

### 2025-07-03: KYC Email Fix + Auto-Approve Resilience
- Fixed DB sender_email typo, startup re-schedule of orphaned auto-approve tasks
- EmailService now loads settings from DB on startup

### Earlier: dates display, login bug, wallet email sync, KYC auto-approval feature

## Backlog
- P2: Refactor server.py into modular routers
- P2: Refactor CreateAccountPage.js
- P3: Add data-testid to login history items
