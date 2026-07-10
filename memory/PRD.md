# Zenthos Wallet Platform - PRD

## Original Problem Statement
Build a full-stack crypto wallet platform (Zenthos) with Admin panel, Agent Portal, Wallet Pool management, KYC flows, and Italian localization.

## Core Architecture
- **Backend**: FastAPI + MongoDB (Motor) + JWT Auth
- **Frontend**: React SPA with Shadcn/UI

## Implemented Features
- User system (auth, freeze, timer, locking)
- Admin panel (dashboard, users, KYC queue, wallet pool, agents, audit logs, settings)
- Agent Portal (/CreateAccount): Create Account, Check Account (with login history), My Clients (with Skip KYC)
- Wallet Pool (atomic assignment, email sync)
- KYC (upload, manual review, auto-approval, agent skip KYC)
- Transaction generation, PDF export, Italian localization
- Integrations: MongoDB, Resend, Cloudinary, Frankfurter API

## Recent Changes

### 2025-07-10: Skip KYC in Agent My Clients
- Agents can skip KYC for clients who have issues completing verification
- Sets KYC to approved + sends password reset email, but keeps account frozen
- Shows "Salta KYC" link for non-approved, "KYC approvato" for approved
- Testing: 6/6 backend + frontend E2E verified

### 2025-07-03: Client Login History, KYC Email Fix, Auto-Approve Resilience
### Earlier: dates display, login bug, wallet email sync, KYC auto-approval feature

## Backlog
- P2: Refactor server.py into modular routers
- P2: Refactor CreateAccountPage.js
