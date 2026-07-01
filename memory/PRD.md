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
- Timer-based account expiry
- Account locking

### Admin Panel
- Dashboard with stats (users, balances, fees)
- User management (CRUD, freeze, KYC review)
- Wallet Pool management (bulk add, assign, archive)
- Agent management (create, activate/deactivate)
- Audit logs with clickable details
- System settings
- Fee tracking with "Fees paid today" stat

### Agent Portal (/CreateAccount)
- Hidden route with PIN gate (8971)
- Agent JWT authentication (separate from admin)
- 3-tab menu: Create Account, Check Account, My Clients
- Atomic wallet assignment from pool
- Transaction history generation
- Failed KYC withdrawal auto-generation
- My Clients: view/edit all agent-created clients
- Date fields stored on user record and displayed for ALL clients

### Wallet System
- USDC and EUR wallets per user
- Wallet Pool with atomic assignment
- States: Available, Assigned, Archived

### KYC
- Document upload (HEIC support via Cloudinary)
- Admin review workflow
- Email notifications

### Integrations
- MongoDB, Resend, Cloudinary, Frankfurter API

## Recent Bug Fixes

### 2025-07-01: Agent-Created Users Can't Login
- **Root Cause**: `timer_duration_hours` stored as empty string `''` for agent-created users without timers. `UserPublic` Pydantic model expects `Optional[int]`, causing validation error on serialization → 500 on admin update and login.
- **Fix**: Sanitize `''` → `None` in `user_to_public()`, fix `agent_my_clients` to return `None` not `''`, migrated existing DB records.
- **Testing**: 5/5 backend + full frontend flow verified.

### 2025-06-30: Missing Dates in Agent "My Clients"
- **Root Cause**: Dates were computed from transactions (users without transactions had none). User model lacked date fields. Update endpoint popped dates.
- **Fix**: Added fields to User/UserUpdate models, read from user record, keep dates on update, startup migration.
- **Testing**: 8/8 backend + full frontend flow verified.

## Backlog
- P2: Refactor server.py (4500+ lines) into modular FastAPI routers
- P2: Refactor CreateAccountPage.js into smaller components
- P3: Add server-side YYYY-MM-DD format validation for date fields
