# Changelog

All notable changes to **Aegis Zero** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-06-22

### Added
- **Live MetaMask Balance Synchronization Hub**: Integrated real-time MetaMask wallet balance retrieval directly into the dashboard.
- **Dynamic Valuation Adapters**: The dashboard now automatically translates active ETH balances into estimated USD valuations matching prevailing rates (e.g. $3,120/ETH).
- **Faucet Auto-Detections**: Added dynamic onboarding helpers that warn the user if their active balance is `0 ETH` and guide them directly to use the integrated test faucets.

### Changed
- **Simulated Real-Asset Alignment**: Re-architected backend hooks (`getOrCreateStateForAddress`) to dynamically scale and calibrate simulated DeFi platform weight ratios based on the user's authentic live wallet deposits.
- **Simplified Project Metadata**: Updated overall application descriptions inside project files from overly technical crypto-jargon to plain, human-friendly, non-technical English.

---

## [1.1.0] - 2026-06-21

### Added
- **Secure 0G Verification Cards**: Deployed secure proof-details and state-hashes generated off-chain using Zero Gravity modules.
- **Interactive Action Deck**: Added direct triggers for manual portfolio rebalancing cycles, safety vault deployments, and mock faucet grants.
- **Real-Time Log Terminals**: Integrated persistent execution history feeds showing cryptographic hashes, proof logs, and execution times.

### Fixed
- **Responsive Sizing**: Rectified canvas layout overflow bugs occurring on compact desktop viewports and smaller devices.

---

## [1.0.0] - 2026-06-15

### Added
- **Initial Release**: Launched core Aegis Zero landing page, hardware wallet simulator, live asset weight indexes (Bitcoin, Ethereum, Solana, Chainlink), and dynamic chart visualizations.
