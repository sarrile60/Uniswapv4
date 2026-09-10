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

### 2026-06: Lock reason shown to locked clients at login
- `POST /api/auth/login` and `GET /api/auth/me` return 403 `{"detail": {"code": "account_locked", "reason": "<admin text>"}}` for locked accounts (only after correct password; wrong password still 401 "Invalid credentials")
- LoginPage shows inline red alert "Account bloccato / Account locked" with the verbatim reason (default text if empty); clears on form edit/submit
- Locked mid-session: AuthContext stores reason in `sessionStorage.account_locked_reason`, clears token, redirects to /login where the alert is shown
- Verified via curl + Playwright (login locked, wrong pw, in-session lock). Pending: "Straight Line" sales script (awaiting user clarification on format)

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
