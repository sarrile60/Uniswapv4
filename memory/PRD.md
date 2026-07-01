# Zenthos Wallet Platform - PRD

## Original Problem Statement
Build a full-stack crypto wallet platform (Zenthos) with Admin panel, Agent Portal, Wallet Pool management, KYC flows, and Italian localization.

## Core Architecture
- **Backend**: FastAPI + MongoDB (Motor) + JWT Auth
- **Frontend**: React SPA with Shadcn/UI
- **Database**: MongoDB (collections: users, wallets, transactions, agents, wallet_pool, kyc_documents, audit_logs, system_settings)

## Implemented Features

### User System
- User registration/login with JWT, Access Gate, Password reset
- Account freeze (deposit/withdrawal/both), Timer-based expiry, Account locking

### Admin Panel
- Dashboard, User management, Wallet Pool, Agent management
- Audit logs, System settings, Fee tracking, KYC Queue

### Agent Portal (/CreateAccount)
- Hidden route with PIN gate (8971), Agent JWT auth
- Create Account, Check Account, My Clients (view/edit with dates)
- Atomic wallet assignment, Transaction generation

### Wallet System
- USDC/EUR wallets, Wallet Pool with atomic assignment
- Email sync on user email change

### KYC System
- Document upload (HEIC support via Cloudinary)
- Admin manual review workflow
- **KYC Auto-Approval**: Configurable in Admin Settings
  - Toggle on/off
  - Configurable delay in minutes (minimum 1)
  - Background asyncio task auto-approves after delay
  - Checks settings still enabled and KYC still pending before approving
  - Sends password reset email if user was frozen
  - Audit logged as "auto_system"

### Integrations
- MongoDB, Resend, Cloudinary, Frankfurter API

## Recent Changes

### 2025-07-01: KYC Auto-Approval Feature
- Added `auto_approve_kyc` (bool) and `auto_approve_kyc_minutes` (int) to SystemSettings model
- Background task `_auto_approve_kyc()` runs after configurable delay
- Admin Settings UI has KYC Auto-Approval card with toggle + minutes input
- Testing: 7/7 backend + full frontend E2E verified

### 2025-07-01: Wallet Pool Email Sync
- Email changes in admin/agent update now sync to wallet_pool.assigned_email

### 2025-07-01: Agent-Created Users Login Fix
- Fixed timer_duration_hours '' → None Pydantic validation error

### 2025-06-30: Agent My Clients Date Display Fix
- Dates stored directly on user record, startup migration for existing users

## Backlog
- P2: Refactor server.py (4600+ lines) into modular FastAPI routers
- P2: Refactor CreateAccountPage.js into smaller components
- P3: Server-side YYYY-MM-DD format validation for date fields
- P3: Store asyncio task references to prevent GC on high load
