# 🤖 Ritty.ai — On-Chain AI Agent Rental Platform

> Rent AI agents. Chat on-chain. Earn yield.

Built on [Ritual Chain](https://ritualfoundation.org) (Chain ID 1979).

## What is Ritty.ai?

Ritty.ai is a decentralized platform where users rent AI agents and chat with them directly on-chain using Ritual's precompile infrastructure. Stake RITUAL on agents to earn yield from rental revenue.

**Not a chatbot wrapper.** Real on-chain inference via Ritual's 0x0802 LLM precompile.

## Key Features

- **On-Chain Chat** — Every message is a verifiable transaction via 0x0802
- **Hybrid Mode** — Fast (MIMO ~2s) + On-chain (~15s verifiable)
- **Agent Staking** — Stake RITUAL, earn yield from rental revenue
- **Fee Distribution** — 70% stakers / 20% creator / 10% platform
- **Auto-Fallback** — On-chain fails → auto-retry via fast mode
- **Dynamic Model** — Auto-adapts when Ritual swaps models

## Architecture

```
Users → Vercel (Next.js) → Ritual Chain
                           ├── AgentMarketplace (0xAFDBA...)
                           ├── RittyStakingPool (0x93A54...)
                           ├── 0x0802 LLM Precompile
                           └── 0x0820 Persistent Agent
```

## Smart Contracts

| Contract | Address |
|----------|---------|
| AgentMarketplace | `0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE` |
| RittyStakingPool | `0x93A5445D1f514b00a4012b2cceA4c669cDcc43D5` |
| RitualWallet | `0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948` |

## Quick Start

```bash
# Install deps
npm install

# Compile contracts
npx hardhat compile

# Deploy to Ritual Testnet
npx hardhat run scripts/deploy-staking.ts --network ritual

# Start frontend
cd frontend && npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Wallet | RainbowKit, wagmi, viem |
| Chain | Ritual Testnet (ID 1979) |
| Inference | 0x0802 LLM Precompile |
| Contracts | Solidity 0.8.20, Hardhat |
| Hosting | Vercel |

## File Structure

```
contracts/              # Solidity contracts + interfaces
frontend/               # Next.js app
├── src/app/            # Pages (landing, rent, staking, dashboard)
├── src/components/     # React components
├── src/lib/            # Utilities, contracts, skills
└── src/app/api/        # Serverless API routes
scripts/                # Deploy scripts
```

## Links

- **App:** [ritty-ai.vercel.app](https://ritty-ai.vercel.app)
- **Explorer:** [explorer.ritualfoundation.org](https://explorer.ritualfoundation.org)
- **Docs:** [DOCS.md](./DOCS.md)
- **PRD:** [PRD.md](./PRD.md)

---

*Built by [@omartuta](https://x.com/omartuta) on Ritual Chain.*
