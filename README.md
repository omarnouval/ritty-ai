# 🤖 Ritual AI Agent Marketplace

On-chain marketplace for deploying, discovering, and renting autonomous AI agents on **Ritual** (Chain ID 1979).

## Architecture

- **Smart Contracts**: Solidity 0.8.20 — `AgentMarketplace.sol`
- **Frontend**: Next.js + wagmi + RainbowKit
- **Precompiles**: 0x0820 (Persistent Agent), 0x080C (Sovereign Agent)
- **Fee Model**: 5% platform fee per rental

## Quick Start

```bash
# Install deps
npm install

# Compile contracts
npx hardhat compile

# Deploy to local
npm run deploy:local

# Deploy to Ritual
npm run deploy:ritual

# Start frontend
cd frontend && npm run dev
```

## Agent Types

| Type | Precompile | Use Case |
|------|-----------|----------|
| Persistent | 0x0820 | Always-on (bots, monitors, traders) |
| Sovereign | 0x080C | One-shot (research, code review) |

## Contract Functions

- `listAgent()` — List an agent on marketplace
- `rentAgent()` — Rent an agent (pay in ETH)
- `rateAgent()` — Rate agent 1-5 after rental
- `withdrawEarnings()` — Withdraw accumulated earnings
- `getActiveAgents()` — Browse active listings (paginated)

## File Structure

```
contracts/           # Solidity contracts + interfaces
frontend/            # Next.js app (marketplace, create, dashboard)
scripts/             # Deploy + create-agent scripts
```
