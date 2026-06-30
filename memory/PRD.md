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
- Date fields (transaction_start_date/transaction_end_date) stored on user record and displayed for ALL clients

### Wallet System
- USDC and EUR wallets per user
- Wallet Pool with atomic assignment (find_one_and_update)
- States: Available, Assigned, Archived

### KYC
- Document upload (supports HEIC via Cloudinary resource_type="auto")
- Admin review workflow
- Email notifications

### Transaction System
- Auto-generated transaction history
- Failed withdrawal on KYC rejection
- Date redistribution when date range changes

### Integrations
- MongoDB (database)
- Resend (emails)
- Cloudinary (KYC media, HEIC support)
- Frankfurter API (EUR/USDC exchange rates)

## Recent Changes (2025-06-30)
- **Bug Fix**: Agent "My Clients" dates now stored directly on user record (transaction_start_date/transaction_end_date)
- **Migration**: Startup auto-backfill of dates from transactions for existing users
- **Model Update**: User, UserCreate, UserUpdate models all include date fields
- **Frontend**: Shows "No dates" placeholder for clients without dates set
- **Testing**: 8/8 backend tests pass, full frontend flow verified

## Backlog
- P2: Refactor server.py (4500+ lines) into modular FastAPI routers
- P2: Refactor CreateAccountPage.js into smaller components
- P3: Add server-side YYYY-MM-DD format validation for date fields
