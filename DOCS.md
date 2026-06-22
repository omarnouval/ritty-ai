# Ritty.ai — On-Chain AI Agent Rental Platform

> Rent AI agents. Chat on-chain. Earn yield.

Built on [Ritual Chain](https://ritualfoundation.org) (Chain ID 1979).

---

## What is Ritty.ai?

Ritty.ai is a decentralized platform where users rent AI agents and chat with them directly on-chain using Ritual's precompile infrastructure. Every conversation is a verifiable on-chain transaction.

**Not a chatbot wrapper.** Real on-chain inference via Ritual's 0x0802 LLM precompile.

---

## How It Works

1. **Browse** — Choose from specialized AI agents (Code Assistant, Research Alpha, Content Pro, etc.)
2. **Rent** — Pay RITUAL tokens (0.005 RITUAL/hr). Rental recorded on-chain.
3. **Chat** — Messages sent via Ritual's 0x0802 precompile. Responses verified on-chain.
4. **Stake** *(coming soon)* — Stake RITUAL on agents. Earn yield from rental revenue.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Wallet | RainbowKit, wagmi, viem |
| Chain | Ritual Testnet (ID 1979) |
| Inference | 0x0802 LLM Precompile |
| Agent Identity | 0x0820 Persistent Agent |
| Smart Contracts | Solidity (Marketplace, StakingPool) |
| Hosting | Vercel |

---

## Key Features

### ✅ Live Now

- **On-Chain Chat** — Every message is a verifiable transaction via Ritual's 0x0802 precompile
- **Hybrid Mode** — Fast mode (MIMO ~2s) + On-chain mode (~15s verifiable)
- **Auto-Fallback** — If on-chain inference fails, auto-retries via fast mode
- **Dynamic Model** — Reads available models from executor `/health` endpoint
- **Agent Rental** — 6 specialized agents, 1h/3h/24h rental periods
- **RitualWallet** — Deposit/withdraw RITUAL for seamless UX
- **Marketplace** — Browse, rent, rate agents
- **Dashboard** — Track active rentals, earnings, history
- **Embedded Skills** — Content creation, market data, research capabilities

### 🔧 In Progress

- **Agent Staking** — Stake RITUAL on agents, earn yield from rental revenue
- **Fee Distribution** — 70% stakers / 20% creator / 10% platform
- **APY Display** — Real-time yield calculations per agent

### ⬜ Planned

- **Agent Creation** — Users deploy their own AI agents
- **Revenue Sharing** — Creators earn from their agent's rental activity
- **Agent Personality On-Chain** — Persistent personality via 0x0820 precompile
- **Conversation History** — Verifiable chat logs on-chain (GCS + proof)
- **Multi-Agent Chat** — Switch agents mid-conversation
- **Agent Rankings** — Community-driven reviews and ratings

---

## Smart Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| Marketplace | `0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE` | Agent listing, rental, ratings |
| RitualWallet | `0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948` | Deposit/withdraw escrow |
| StakingPool | *deploying soon* | Agent staking + yield |

### Precompiles Used

| Precompile | Address | Function |
|------------|---------|----------|
| LLM Inference | `0x0802` | On-chain AI chat |
| Persistent Agent | `0x0820` | Agent personality storage |

---

## Roadmap

### Phase 1 — Foundation ✅
- [x] Marketplace smart contract
- [x] Agent rental system
- [x] On-chain chat (0x0802)
- [x] Hybrid mode (Fast + On-chain)
- [x] Auto-fallback + dynamic model
- [x] Dashboard + rental display
- [x] RitualWallet integration
- [x] Error boundaries + stability

### Phase 2 — Staking & Yield 🔧
- [ ] StakingPool smart contract
- [ ] Fee distribution (70/20/10)
- [ ] Staking UI (stake, unstake, claim)
- [ ] APY display per agent
- [ ] Update rental pricing

### Phase 3 — Ecosystem ⬜
- [ ] Agent creation (user-deployed)
- [ ] Creator revenue sharing
- [ ] Agent personality on-chain (0x0820)
- [ ] Conversation history (verifiable)
- [ ] Multi-agent chat
- [ ] Agent rankings + reviews

### Phase 4 — Scale ⬜
- [ ] Multi-chain expansion
- [ ] DAO governance
- [ ] Agent-to-agent communication
- [ ] Cross-chain portability
- [ ] Premium agent tiers

---

## The Numbers

| Metric | Value |
|--------|-------|
| Active Agents | 6 |
| Total Rentals | 167 |
| Rental Price | 0.005 RITUAL/hr |
| Chain | Ritual Testnet (ID 1979) |
| Inference Latency | ~2s (Fast) / ~15s (On-chain) |
| Explorer | [explorer.ritualfoundation.org](https://explorer.ritualfoundation.org) |

---

## Vision

Ritty.ai is building the infrastructure for a new economy where AI agents are productive assets — not just tools, but yield-generating participants in a decentralized ecosystem.

**Stake on agents. Earn from intelligence. Build on Ritual.**

---

## Links

- **App:** [ritty-ai.vercel.app](https://ritty-ai.vercel.app)
- **Chain:** [Ritual Foundation](https://ritualfoundation.org)
- **Explorer:** [explorer.ritualfoundation.org](https://explorer.ritualfoundation.org)
- **Faucet:** [faucet.ritualfoundation.org](https://faucet.ritualfoundation.org)

---

*Built by [@omartuta](https://x.com/omartuta) on Ritual Chain.*
