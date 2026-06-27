# iDubbl Platform — Architecture & Flow Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [How Authentication Works](#how-authentication-works)
5. [How Wallets Work](#how-wallets-work)
6. [How Deposits Work](#how-deposits-work)
7. [How Withdrawals Work](#how-withdrawals-work)
8. [How Admin Panel Works](#how-admin-panel-works)
9. [Blockchain Integration](#blockchain-integration)
10. [Automated Payout System](#automated-payout-system)
11. [Environment Variables Reference](#environment-variables-reference)
12. [Going Live Checklist](#going-live-checklist)

---

## System Overview

iDubbl is a competitive gaming platform where players deposit USDT (crypto), play matches, earn winnings, and withdraw back to their crypto wallet.

```
User ──► Deposit USDT ──► Play Matches ──► Earn Winnings ──► Withdraw USDT ──► Real Wallet
```

The platform has two main interfaces:
- **Player Dashboard** — for regular users (deposit, play, withdraw, view wallet)
- **Admin Panel** — for platform operators (approve/reject transactions, manage users, view all wallets)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite, Zustand (state), React Router |
| **Backend** | Node.js + Express.js (ESM modules) |
| **Database** | MongoDB Atlas (cloud) |
| **Auth** | Better-Auth library |
| **Blockchain** | TronGrid API (Tron/TRC-20), Etherscan API + Alchemy RPC (Ethereum/ERC-20) |
| **Payout Engine** | TronWeb (Tron signing), Ethers.js (Ethereum signing) |
| **Hosting** | Render.com (backend + frontend) |

---

## Project Structure

```
idubbl/
├── backend/
│   ├── index.js                    ← Express server entry point
│   ├── config.yaml                 ← App configuration (non-sensitive)
│   ├── .env                        ← Private keys & secrets (gitignored)
│   ├── .env.example                ← Template for environment setup
│   ├── routes/
│   │   ├── wallet.js               ← All wallet, deposit, withdrawal routes
│   │   ├── admin.js                ← Admin-only routes (users, deposits list)
│   │   └── match.js                ← Match/game routes
│   ├── services/
│   │   ├── db.js                   ← MongoDB connection singleton
│   │   ├── configLoader.js         ← Loads config.yaml + env vars
│   │   ├── errorRegistry.js        ← Standardized error responses
│   │   ├── emailService.js         ← Email sending service
│   │   ├── index.js                ← Exports all services
│   │   ├── auth/                   ← Better-Auth hexagonal adapter
│   │   ├── payment/                ← Payment gateway adapter
│   │   └── blockchain/
│   │       ├── BlockchainService.js   ← Main blockchain orchestrator
│   │       ├── WalletGenerator.js     ← Generates TRX/ETH keypairs
│   │       └── adapters/
│   │           ├── TronGridAdapter.js    ← Tron API calls
│   │           └── EtherscanAdapter.js   ← Ethereum API calls
│   ├── middleware/
│   │   └── adminAuth.js            ← Admin authentication middleware
│   ├── scripts/
│   │   └── simulateTransactions.js ← Seeds test data in DB
│   └── test/
│       ├── blockchain.test.js      ← Unit tests for wallet + blockchain
│       ├── adminApi.test.js        ← Integration tests against live API
│       └── depositFlow.test.js     ← End-to-end deposit flow tests
│
└── frontend/
    └── src/
        ├── App.jsx                 ← Router with all page routes
        ├── shared/
        │   ├── store/
        │   │   ├── authStore.js    ← User session state (Zustand)
        │   │   └── walletStore.js  ← All wallet/deposit/withdrawal actions
        │   └── components/
        │       └── layout/
        │           ├── AppLayout.jsx      ← Player layout wrapper
        │           └── AdminLayout.jsx    ← Admin sidebar layout
        └── features/
            ├── admin/
            │   ├── AdminDashboardHome.jsx
            │   └── features/
            │       ├── users/AdminUsersPage.jsx
            │       ├── deposits/AdminDepositsPage.jsx
            │       ├── withdrawals/AdminWithdrawalsPage.jsx
            │       └── wallets/AdminWalletsPage.jsx
            ├── deposit/
            │   └── components/
            │       └── PersonalWalletsWidget.jsx
            └── profile/
                └── ProfilePage.jsx
```

---

## How Authentication Works

```
User fills login form
       │
       ▼
Frontend (authStore.js)
POST /api/auth/signin
       │
       ▼
Backend (BetterAuthDriver.js)
Better-Auth validates credentials against MongoDB 'user' collection
       │
       ▼
Session cookie set in browser
       │
       ▼
All subsequent requests include session cookie
Admin requests also include x-user-id header for fallback auth
```

**Admin authentication** has a dual-check system:
1. First checks `x-user-id` header → looks up user in DB → checks `role === 'admin'`
2. Falls back to Better-Auth session cookie if header not present

---

## How Wallets Work

Every user has **two types of wallets**:

### 1. Platform Wallet (Internal Balance)
Stored in the `wallets` MongoDB collection:

| Field | Description |
|---|---|
| `depositBalance` | USDT deposited by the user (approved) |
| `winningsBalance` | USDT earned from winning matches |
| `pendingWithdrawals` | USDT locked while withdrawal is being processed |
| `lockedBalance` | USDT locked in active game entries |

### 2. Personal Crypto Wallet (On-Chain)
Generated addresses stored on the user document:

| Field | Description |
|---|---|
| `tron` | Generated TRC-20 deposit address |
| `ethereum` | Generated ERC-20 deposit address |
| `tronPrivateKey` | Private key for the Tron address |
| `ethereumPrivateKey` | Private key for the Ethereum address |

**Generation Flow:**
```
User clicks "Generate Wallet"
       │
POST /api/wallet/personal/create
       │
WalletGenerator.generateKeyPair()
  → Creates Tron address + private key
  → Creates Ethereum address + private key
       │
Saved to user document in MongoDB (upsert)
       │
Displayed in PersonalWalletsWidget
```

---

## How Deposits Work

```
User sends USDT to platform wallet address
       │
User copies transaction hash from blockchain explorer
       │
User submits hash on Deposit page
POST /api/wallet/deposit { amount, network, txHash }
       │
BlockchainService.verifyUSDTDeposit()
       │
       ├── TRC-20? → TronGridAdapter checks txHash on Tron
       └── ERC-20? → EtherscanAdapter checks txHash on Ethereum
              │
       ┌──── Verified? ────┐
       │ YES               │ NO
       ▼                   ▼
Auto-approve:         Save as 'pending'
Credit balance        Admin reviews manually
status = 'approved'   status = 'pending'
```

---

## How Withdrawals Work

```
User requests withdrawal
POST /api/wallet/withdraw { amount, address, network }
       │
Moves amount: winningsBalance → pendingWithdrawals
Creates transaction: status = 'pending'
       │
Admin sees it in Withdrawal Requests table
       │
       ├── APPROVE clicked
       │         │
       │   BlockchainService.sendOnchainUSDT(address, amount, network)
       │         │
       │    Private key set?
       │    YES → Sign & broadcast real transaction on-chain
       │    NO  → Return simulated txHash (test/demo mode)
       │         │
       │   status → 'approved', payoutTxHash saved
       │   pendingWithdrawals decremented
       │
       └── REJECT clicked
                 │
           status → 'rejected'
           pendingWithdrawals → winningsBalance (refunded)
```

---

## How Admin Panel Works

| Page | Route | Purpose |
|---|---|---|
| **Dashboard** | `/admin` | Live stats: users, deposits, wallets, recent activity |
| **Deposits** | `/admin/deposits` | All deposit requests + approve/reject |
| **Withdrawals** | `/admin/withdrawals` | All withdrawal requests + approve/reject |
| **Users** | `/admin/users` | All registered users, balances, roles |
| **On-Chain Wallets** | `/admin/wallets` | All generated crypto addresses + live balance check |
| **Live Matches** | `/admin/matches` | Active game sessions |
| **Ledger** | `/admin/ledger` | Platform revenue |
| **Audit Log** | `/admin/audit` | Activity log |

**Admin API Routes:**
```
GET  /api/admin/users                        → All users + wallet balances
GET  /api/admin/deposits                     → All deposit transactions
GET  /api/admin/withdrawals                  → All withdrawal transactions
POST /api/wallet/admin/deposit/:id/approve   → Approve deposit
POST /api/wallet/admin/deposit/:id/reject    → Reject deposit
POST /api/wallet/admin/withdraw/:id/approve  → Approve + trigger on-chain payout
POST /api/wallet/admin/withdraw/:id/reject   → Reject + refund user
```

---

## Blockchain Integration

### Verification (Deposits)
```
TronGridAdapter
  GET https://api.trongrid.io/v1/transactions/{txHash}
  Checks: correct recipient address, correct amount, TRC-20 USDT token

EtherscanAdapter
  GET https://api.etherscan.io/v2/api?chainid=1&...
  Checks: correct recipient address, correct amount, ERC-20 USDT contract
```

### Payout (Withdrawals)
```
TronWeb (Tron)
  → Connects to TronGrid (mainnet or Shasta testnet based on TRONGRID_BASE_URL)
  → Builds USDT transfer transaction to user's address
  → Signs with TRON_HOT_WALLET_PRIVATE_KEY
  → Broadcasts, returns real txHash

Ethers.js (Ethereum)
  → Connects via Alchemy RPC (ETH_PROVIDER_URL)
  → Calls USDT ERC-20 contract transfer() to user's address
  → Signs with ETH_HOT_WALLET_PRIVATE_KEY
  → Broadcasts, waits for confirmation, returns txHash
```

---

## Automated Payout System

### Simulation Mode (No private key — current state)
- Approval succeeds immediately
- Returns `simulated_tron_payout_xxxxxx` as txHash
- Database updated correctly
- Safe for full end-to-end testing ✅

### Testnet Mode
- Set `TRONGRID_BASE_URL=https://api.shasta.trongrid.io`
- Use a Shasta testnet wallet private key
- Real transactions on fake network — no real money

### Live Mode
- Set real private keys in Render env vars
- Set `TRONGRID_BASE_URL=https://api.trongrid.io` (mainnet)
- Real USDT sent on-chain automatically on every Approve click

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `BETTER_AUTH_SECRET` | ✅ | Secret key for session signing |
| `TRONGRID_API_KEY` | ✅ | TronGrid API key |
| `ETHERSCAN_API_KEY` | ✅ | Etherscan API key |
| `ETH_PROVIDER_URL` | ✅ | Alchemy RPC URL for Ethereum |
| `TRONGRID_BASE_URL` | Optional | Tron host. Default: mainnet. Set Shasta for testnet |
| `TRON_HOT_WALLET_PRIVATE_KEY` | Live only | Tron payout wallet private key |
| `ETH_HOT_WALLET_PRIVATE_KEY` | Live only | Ethereum payout wallet private key |

---

## Going Live Checklist

- [ ] Add `TRON_HOT_WALLET_PRIVATE_KEY` in Render environment variables
- [ ] Add `ETH_HOT_WALLET_PRIVATE_KEY` in Render environment variables
- [ ] Change `TRONGRID_BASE_URL` to `https://api.trongrid.io` in Render
- [ ] Fund hot wallets with USDT + gas (TRX for Tron, ETH for Ethereum gas)
- [ ] Test one small real withdrawal before opening to all users
- [ ] Set up email notifications for deposit/withdrawal events
- [ ] Monitor hot wallet balances regularly
