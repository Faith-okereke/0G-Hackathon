# Ægis Zero (Æ0) — 0G Secure Smart Vault

> **"An autonomous, on-chain smart vault that self-rebalances DeFi liquidity positions under strict, user-defined risk guardrails."**

---

## 📖 Product Description
**Ægis Zero (Æ0)** is an intelligent, full-stack autonomous asset-management platform designed for secure, self-rebalancing decentralized finance (DeFi) liquidity provisioning.

Traditional liquidity management requires constant manual adjustment, exposing liquidity providers to impermanent loss, market drift, and complex transaction calculations. Ægis Zero solves this by deploying a specialized **Autonomous Rebalancing Agent** that constantly monitors pool concentration across multiple major DeFi protocols (such as Uniswap v3, Aave v3, and Curve). 

To ensure absolute safety, the system implements **Structural Risk Guardrails**. Users define precise portfolio limits, slippage bounds, and daily transaction volume boundaries during onboarding. The agent is strictly forbidden from executing maneuvers that breach these parameters. With a hybrid architecture merging a hyper-responsive frontend, a secure Express server state engine, and robust on-chain simulations, Ægis Zero delivers institutional-grade active portfolio management without sacrificing user sovereignty.

---

## ⚡ Core Features

### 1. Autonomous Agent-in-the-Loop Rebalancing
* **Continuous Monitoring**: Scans active pools (e.g., Uniswap v3 USDC/ETH, Aave v3 USDC Supply, Curve 3pool) for capital efficiency and pool concentration.
* **On-Demand Realignment**: Initiates smart, automated pool re-allocation sequences when positions experience "active drift."
* **Real-time Logs**: Logs every strategy evaluation, decision outcome, and transactional event to a tamper-proof Decisions Feed.

### 2. Hardened Risk Guardrails
* **Slippage Bounds**: Enforces maximum margin tolerances for all automated swaps.
* **Capital Safety Boundaries**: Limits maximum position sizes and single-transaction execution ceilings.
* **Emergency Override**: Single-click absolute loop suspension ("Emergency Pause") instantly halts the autonomous agent to safeguard remaining collateral.

### 3. High-Fidelity Interface
* **Neo-Brutalist Aesthetic**: Styled under the premium **Slate-Light Theme** with clear, high-contrast visual hierarchies pairing "Space Grotesk" display typography and "JetBrains Mono" indicator metrics.
* **Interactive Controls**: Handled by custom SVG graphics, modular component architecture, and comprehensive wizard onboarding sequences.

---

## 🛠️ Technology Stack

* **Frontend**: React 18+, Vite, Tailwind CSS, Lucide Icons, and Motion (for butter-smooth onboarding flows).
* **Backend**: Express.js server administering agent evaluation cycles, secure state management, and API endpoints.
* **Simulated Ledger Protocol**: Mocked integration for cryptographic 0G Ledger Wallet handshakes and MetaMask interactions.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The server will start running on http://localhost:3000 hosting both the static React interface and Express `/api/*` endpoints.

---

## 🛡️ License
Distributed under the MIT License. Created with pride for the 0G Chain DeFi Hackathon.
