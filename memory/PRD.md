# Zenthos Wallet Platform - PRD

## Original Problem Statement
Build a full-stack crypto wallet platform (Zenthos) with Admin panel, Agent Portal, Wallet Pool management, KYC flows, and Italian localization.

## Core Architecture
- **Backend**: FastAPI + MongoDB (Motor) + JWT Auth
- **Frontend**: React SPA with Shadcn/UI
- **Database**: MongoDB (collections: users, wallets, transactions, agents, wallet_pool, kyc_documents, audit_logs, system_settings)

## Implemented Features

### User System
- User registration/login with JWT
- Access Gate passcode protection
- Password reset flow
- Account freeze (deposit/withdrawal/both)
- Timer-based account expiry, Account locking

### Admin Panel
- Dashboard with stats, User management (CRUD, freeze, KYC review)
- Wallet Pool management (bulk add, assign, archive)
- Agent management, Audit logs, System settings, Fee tracking

### Agent Portal (/CreateAccount)
- Hidden route with PIN gate (8971)
- Agent JWT auth, 3-tab menu: Create Account, Check Account, My Clients
- Atomic wallet assignment, Transaction history generation
- My Clients: view/edit all agent-created clients with date fields

### Wallet System
- USDC and EUR wallets per user
- Wallet Pool with atomic assignment, States: Available/Assigned/Archived
- **Email sync**: When admin/agent changes user email, wallet_pool.assigned_email auto-updates

### Integrations
- MongoDB, Resend, Cloudinary, Frankfurter API

## Recent Bug Fixes

### 2025-07-01: Wallet Pool Email Not Syncing on User Email Change
- **Root Cause**: Admin and agent update endpoints only updated `users` collection email, not `wallet_pool.assigned_email`.
- **Fix**: Added `wallet_pool.update_many({assigned_to: user_id}, {assigned_email: new_email})` in both admin and agent update endpoints.
- **Testing**: 5/5 backend + full frontend E2E verified.

### 2025-07-01: Agent-Created Users Can't Login
- **Root Cause**: `timer_duration_hours` stored as `''` causing Pydantic validation error.
- **Fix**: Sanitize `''` → `None` in `user_to_public()`, migrated DB records.

### 2025-06-30: Missing Dates in Agent "My Clients"
- **Root Cause**: Dates computed from transactions, not stored on user record.
- **Fix**: Added fields to models, read from user record, startup migration.

## Backlog
- P2: Refactor server.py (4500+ lines) into modular FastAPI routers
- P2: Refactor CreateAccountPage.js into smaller components
- P3: Add server-side YYYY-MM-DD format validation for date fields
