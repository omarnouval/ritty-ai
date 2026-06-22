# Ritty.ai — Product Requirements Document

**Version:** 3.0
**Last Updated:** June 2026
**Status:** Phase 2 Complete ✅ — Building Phase 3 (Staking)

---

## 1. Overview

### 1.1 Vision
Ritty.ai is an on-chain AI agent rental platform built on Ritual Chain where users can rent AI agents, chat with them on-chain, and earn yield by staking on agents. Every interaction is verifiable on-chain via Ritual precompiles.

### 1.2 Problem
- AI agents are fragmented with no unified rental platform
- No way to earn passive income from AI agent usage
- Existing platforms are centralized with no verifiable inference
- No native integration between AI inference and DeFi yield

### 1.3 Solution
A decentralized agent rental platform where:
- **Users** rent AI agents and chat on-chain via Ritual's 0x0802 LLM precompile
- **Stakers** stake RITUAL on agents and earn yield from rental revenue
- **Creators** deploy agents and earn from rental fees
- **All inference** runs on-chain (verifiable, transparent, decentralized)

### 1.4 Target Audience
- Crypto-native users who want AI automation on-chain
- DeFi users wanting passive yield from AI agent usage
- Builders in the Ritual ecosystem
- AI developers looking to monetize agents

---

## 2. Product Architecture

### 2.1 Chain: Ritual Chain (ID 1979)

**Precompiles:**
| Address | Name | Function |
|---------|------|----------|
| 0x0820 | Persistent Agent | Always-on agents with state |
| 0x080C | Sovereign Agent | One-shot task execution |
| 0x0802 | LLM | Text generation inference |
| 0x0818 | Image | Image generation inference |
| 0x0819 | Audio | Audio generation inference |
| 0x0801 | HTTP | Off-chain HTTP fetch |

### 2.2 Agent Types

| Type | Precompile | Behavior | Use Case |
|------|-----------|----------|----------|
| Persistent | 0x0820 | Always-on, maintains state, 24/7 available | Customer service, trading bots, monitoring |
| Sovereign | 0x080C | One-shot, execute → return result → done | Image generation, data analysis, translation |

### 2.3 Pricing Model
- **Rental Price:** 0.005 RITUAL/hr
- **Rental Durations:** 1h, 3h, 24h
- **Payment:** RITUAL tokens (native currency of Ritual Chain)

### 2.4 Fee Distribution (Staking)
| Recipient | Share | Description |
|-----------|-------|-------------|
| Stakers | 70% | Distributed proportional to stake |
| Creator | 20% | Agent deployer |
| Platform | 10% | Ritty.ai platform fee |

---

## 3. Features

### 3.1 Landing Page
- Hero section: "Rent AI Agents Instantly" (gradient heading)
- Subtitle: "Rent AI agents on Ritual Chain. Chat on-chain, earn yield."
- Centered chat input with category pills
- Quick suggestion cards
- Stats section: Chain ID, Agent count, Rental count
- Multi-language support (5 languages)
- Footer: GitHub, Twitter, Docs links

### 3.2 Agent Rent (`/agent-rent`)
- Browse all listed agents
- Search by name
- View modes: grid, list, compact
- Agent cards with: name, description, price/hour, rating, badges
- Badges: 🔥 Popular (50+ rentals), ⭐ Trending (20+), 👑 Top Rated, 🆕 New
- Click to view agent detail → Rent flow
- Request custom agent button

### 3.3 Dashboard (`/dashboard`)
- View active rentals
- Chat with rented agents (hybrid mode: Fast + On-track)
- Track rental history
- Agent performance stats

### 3.4 Staking (`/staking`) — NEW
- Browse agent pools
- Stake RITUAL on agents
- Unstake anytime (no lock period)
- Claim rewards
- View APY per agent
- View pool stats (total staked, total rewards, staker count)

### 3.5 Agent Rental Flow
1. User browses agents → selects agent
2. Chooses duration (1h / 3h / 24h)
3. Price auto-calculated (0.005 RITUAL/hr × hours)
4. Confirms rental → pays RITUAL tokens
5. Chat with agent via on-chain inference (0x0802)
6. Auto-expires when time runs out
7. Fee distributed: 70% stakers / 20% creator / 10% platform

### 3.6 Chat System (Hybrid Mode)
- **Fast Mode (⚡):** MIMO model ~2s response (default)
- **On-Chain Mode (🔗):** Ritual 0x0802 precompile ~15s (verifiable)
- **Auto-Fallback:** If on-chain fails, auto-retry via Fast mode
- **Dynamic Model:** Reads available models from executor `/health`
- **Toggle:** User can switch between modes

### 3.7 Internationalization (i18n)
- 5 languages: English, Indonesia, Filipino, 한국어, हिंदी
- Globe icon dropdown in navbar
- Language preference saved in localStorage
- Full translation of landing page content

### 3.8 Precompile Integration
- `executeTask()` — Run tasks on persistent agents (0x0820)
- `createSovereignTask()` — One-shot tasks on sovereign agents (0x080C)
- On-chain LLM inference via 0x0802
- Verifiable transaction hashes for every chat

---

## 4. Smart Contracts

### 4.1 AgentMarketplace.sol
Core marketplace contract handling:
- `listAgent()` — Creator lists agent with metadata + pricing
- `rentAgent(id, hours)` — User rents agent for specified duration
- `rateAgent(id, rating)` — User rates agent after rental
- `withdrawEarnings()` — Creator withdraws accumulated RITUAL
- `executeTask(id, task)` — Execute task on rented persistent agent
- `createSovereignTask(id, input)` — Create one-shot task on sovereign agent

**Contract Address:** `0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE`

### 4.2 RittyStakingPool.sol — NEW
Staking pool for agent rental yield distribution:
- `stake(agentId)` — Stake RITUAL on an agent
- `unstake(agentId, amount)` — Unstake RITUAL (no lock period)
- `claimReward(agentId)` — Claim pending rewards
- `claimAllRewards()` — Claim from all pools
- `distributeRevenue(agentId)` — Distribute rental revenue to stakers
- `createPool(agentId)` — Create staking pool for agent
- `getAPY(agentId)` — Get APY estimate
- `getPoolInfo(agentId)` — Get pool stats

**Fee Split:** 70% stakers / 20% creator / 10% platform
**Contract Address:** `0x93A5445D1f514b00a4012b2cceA4c669cDcc43D5`

### 4.3 RitualWallet.sol
Escrow wallet for seamless UX:
- `deposit()` — Deposit RITUAL
- `withdraw(amount)` — Withdraw RITUAL
- Balance management for rental payments

**Contract Address:** `0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948`

### 4.4 Interfaces
- `IPersistentAgent.sol` — Interface for 0x0820 precompile
- `ISovereignAgent.sol` — Interface for 0x080C precompile
- `AgentTypes.sol` — Shared types and precompile addresses

---

## 5. Tech Stack

### 5.1 Frontend
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Web3:** wagmi + viem + RainbowKit
- **State:** React Context (LanguageProvider)

### 5.2 Smart Contracts
- **Language:** Solidity ^0.8.20
- **Framework:** Hardhat
- **Network:** Ritual Chain (ID 1979)

### 5.3 Backend (Serverless API)
- **Runtime:** Next.js API Routes (App Router)
- **Chat API:** `/api/chat` (Fast/MIMO) + `/api/chat-onchain` (0x0802)
- **Skills:** Embedded content creator, market data skills

### 5.4 Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS                                │
│              (Desktop / Mobile Browser)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL CDN                                │
│            https://ritty-ai.vercel.app                       │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Static     │  │   SSR/ISR   │  │   API Routes        │ │
│  │   Assets     │  │   Pages     │  │   (Serverless)      │ │
│  │             │  │             │  │                     │ │
│  │  - CSS/JS   │  │  - Landing  │  │  /api/chat          │ │
│  │  - Images   │  │  - Rent     │  │  /api/chat-onchain  │ │
│  │  - Logo     │  │  - Staking  │  │  /api/rental-check  │ │
│  │             │  │  - Dashboard│  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               RITUAL CHAIN (ID 1979)                         │
│            https://rpc.ritualfoundation.org                   │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ AgentMarketplace│  │ RittyStakingPool│                   │
│  │ 0xAFDBA...      │  │ 0x93A54...      │                   │
│  │                 │  │                 │                   │
│  │ - listAgent()   │  │ - stake()       │                   │
│  │ - rentAgent()   │  │ - unstake()     │                   │
│  │ - rateAgent()   │  │ - claimReward() │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  0x0820      │  │  0x080C      │  │  0x0802      │      │
│  │  Persistent  │  │  Sovereign   │  │  LLM         │      │
│  │  Agent       │  │  Agent       │  │  Inference   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 Data Flow

```
User Action → Frontend (wagmi) → Smart Contract → Ritual Chain
     ↑                                    │
     │                                    ▼
     └──────── Events/State ◄──── Precompile (0x0820/0x0802)

Chat Message → API Route → 0x0802 Precompile → On-Chain Response
            → OR MIMO Model → Fast Response (auto-fallback)

Rental Payment → Marketplace Contract → Fee Split → Staking Pool
                                       → Creator Wallet
                                       → Platform Wallet
```

---

## 6. Design System

### 6.1 Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Background | #050505 | Page background |
| Primary | #40FFAF | CTA, accents, links |
| Surface | #111111 | Cards, inputs |
| Border | #222222 | Dividers, card borders |
| Secondary Text | #A1A1AA | Descriptions, labels |
| Primary Text | #FFFFFF | Headings, body |

### 6.2 Typography
- **Headings:** Orbitron, Space Grotesk (font-weight: 900)
- **Body:** DM Sans (font-weight: 400)
- **Mono:** Space Grotesk / system monospace (addresses, stats)

### 6.3 Visual Style
- Dark glassmorphism
- Animated ColorBends background
- Clean, minimal, futuristic
- Consistent shared Navbar across pages
- Agent badges (Popular, Trending, Top Rated, New)

### 6.4 Logo
- Stylized "R" monogram (teal/cyan gradient, 3D fluid glow)
- Small dot in R's negative space
- "Ritty.ai" text below (white, cyan dot separator)
- Black background

---

## 7. UI/UX Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Landing hero | "Rent AI Agents Instantly" | Clear value proposition |
| Subtitle | "Rent AI agents on Ritual Chain. Chat on-chain, earn yield." | Explains 3 key features |
| Stats | Chain ID / Agent count / Rental count | Real metrics, not technical jargon |
| Chat default | Fast mode (MIMO ~2s) | Best UX, on-chain optional |
| Staking | No lock period | Lower barrier, user-friendly |
| Fee split | 70/20/10 (staker/creator/platform) | Incentivizes staking |
| Agent badges | Visual indicators (Popular, Trending, etc.) | Helps users discover agents |
| Navbar | Shared component, consistent across pages | Professional, unified UX |
| Footer | GitHub, Twitter, Docs | Standard web3 project links |

---

## 8. Roadmap

### Phase 1 — Foundation ✅
- [x] Landing page (dark theme, hero, chat input)
- [x] Design system (color palette, fonts, glassmorphism)
- [x] Logo
- [x] i18n (5 languages)
- [x] Smart contracts (Marketplace, Profile, Agent)
- [x] Agent rental flow
- [x] Mobile responsive

### Phase 2 — On-Chain Chat ✅
- [x] Deploy contracts to Ritual Testnet
- [x] Connect frontend to contracts
- [x] Wallet connect flow
- [x] On-chain chat via 0x0802 precompile
- [x] Hybrid mode (Fast MIMO + On-chain)
- [x] Auto-fallback on-chain → MIMO
- [x] Dynamic model detection
- [x] Error boundaries + stability
- [x] Vercel deployment

### Phase 3 — Staking & Yield 🔧
- [x] StakingPool smart contract
- [x] Deploy staking contract
- [x] Create pools for all agents
- [ ] Staking UI (stake, unstake, claim, APY)
- [ ] Update rental price to 0.005/hr
- [ ] Wire fee distribution (rental → staker pool)
- [ ] APY display per agent
- [ ] Pool stats dashboard

### Phase 4 — Polish & Launch ⬜
- [ ] Search & filter marketplace
- [ ] Rating system UI
- [ ] Agent metadata (IPFS)
- [ ] Domain setup (ritty.ai)
- [ ] Featured agents / trending
- [ ] Notification system

### Phase 5 — Growth 🚀
- [ ] Agent creation (user-deployed)
- [ ] Creator revenue sharing
- [ ] Agent personality on-chain (0x0820)
- [ ] Conversation history (verifiable)
- [ ] Multi-agent chat
- [ ] Agent rankings & reviews
- [ ] Multi-chain expansion
- [ ] DAO governance
- [ ] Mobile app

---

## 9. API Routes

### 9.1 Chat Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Fast chat via MIMO model (~2s) |
| POST | `/api/chat-onchain` | On-chain chat via 0x0802 (~15s, verifiable) |
| GET | `/api/rental-check` | Check active rental for user |

### 9.2 Chat Request Format

```json
{
  "message": "What is Bitcoin?",
  "agentId": 1,
  "walletAddress": "0x..."
}
```

### 9.3 Chat Response Format

```json
{
  "success": true,
  "response": "Bitcoin is a decentralized digital currency...",
  "txHash": "0xabc...def",
  "model": "zai-org/GLM-4.7-FP8",
  "latency": 15234
}
```

---

## 10. Smart Contract Addresses

| Contract | Address | Explorer |
|----------|---------|----------|
| AgentMarketplace | `0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE` | [View](https://explorer.ritualfoundation.org/address/0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE) |
| RittyStakingPool | `0x93A5445D1f514b00a4012b2cceA4c669cDcc43D5` | [View](https://explorer.ritualfoundation.org/address/0x93A5445D1f514b00a4012b2cceA4c669cDcc43D5) |
| RitualWallet | `0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948` | [View](https://explorer.ritualfoundation.org/address/0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948) |
| RittyProfile | `0xA487b...` | [View](https://explorer.ritualfoundation.org) |

---

## 11. Success Metrics

| Metric | Target (Month 1) | Target (Month 6) |
|--------|-------------------|-------------------|
| Agents listed | 12 | 50 |
| Active rentals | 100 | 1,000 |
| Unique stakers | 50 | 500 |
| TVL staked (RITUAL) | 10 | 1,000 |
| Total rental volume | 1 RITUAL | 100 RITUAL |
| Languages | 5 | 8+ |

---

## 12. Open Questions

1. **Agent creation:** When to open for user-deployed agents?
2. **Contract audit:** Needed before mainnet
3. **IPFS storage:** For agent metadata and prompts
4. **Domain:** ritty.ai registration
5. **Multi-chain:** Which chains next?

---

*This is a living document. Update as product evolves.*
*Last updated: June 2026 — Phase 3 (Staking) In Progress*
