# Ritty.ai — Product Requirements Document

**Version:** 2.0
**Last Updated:** June 2026
**Status:** Phase 2 Complete ✅

---

## 1. Overview

### 1.1 Vision
Ritty.ai is an AI Agent Marketplace built on Ritual Chain where users can deploy, discover, and rent autonomous AI agents using RITUAL tokens. The platform enables anyone to create and monetize AI agents without writing code — powered by on-chain inference precompiles.

### 1.2 Problem
- AI agents are fragmented across platforms with no unified marketplace
- Deploying AI agents requires deep technical knowledge
- No native integration between AI inference and blockchain execution
- Existing agent platforms are centralized and custodial

### 1.3 Solution
A decentralized marketplace where:
- **Creators** deploy AI agents with one click, set pricing, earn RITUAL tokens
- **Users** discover, rent, and interact with agents seamlessly
- **All inference** runs on-chain via Ritual precompiles (no centralized servers)

### 1.4 Target Audience
- Crypto-native users who want AI automation on-chain
- AI developers looking to monetize agents
- DeFi users wanting autonomous trading/research bots
- Builders in the Ritual ecosystem

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

**Factory Contracts:**
- PersistentAgentFactory: `0xD4AA...`
- SovereignAgentFactory: `0x9dC4...`

### 2.2 Agent Types

| Type | Precompile | Behavior | Use Case |
|------|-----------|----------|----------|
| Persistent | 0x0820 | Always-on, maintains state, 24/7 available | Customer service, trading bots, monitoring |
| Sovereign | 0x080C | One-shot, execute → return result → done | Image generation, data analysis, translation |

### 2.3 Pricing Model
- **Platform Fee:** 5% per rental (deducted from creator earnings)
- **Creator Revenue:** 95% of rental price
- **Rental Durations:** 1h, 8h, 24h, 1 week, or custom (minutes/days)
- **Payment:** RITUAL tokens (native currency of Ritual Chain)

---

## 3. Features

### 3.1 Landing Page
- Hero section: "You Don't Need to Code." (gradient heading)
- Centered chat input (Replit-style) with category pills
- Quick suggestion cards
- Stats section: Persistent (0x0820), Sovereign (0x080C), 5% Platform Fee
- "Launch App" button → Marketplace
- No wallet connect on landing (wallet only on marketplace/create/dashboard)
- Multi-language support (5 languages)

### 3.2 Marketplace (`/marketplace`)
- Browse all listed agents
- Filter by type (Persistent/Sovereign), category, price
- Agent cards with: name, description, price/hour, rating, type badge
- Click to view agent detail → Rent flow

### 3.3 Create Agent (`/create`)
- Form to list a new agent on marketplace
- Fields: name, description, category, type (Persistent/Sovereign), price per hour
- Upload agent configuration/prompt
- Deploy to chain → appears in marketplace

### 3.4 Dashboard (`/dashboard`)
- View my listed agents
- Track earnings (total RITUAL earned)
- Withdraw earnings
- View rental history
- Agent performance stats (rentals, ratings)

### 3.5 Agent Rental Flow
1. User browses marketplace → selects agent
2. Chooses duration (1h / 8h / 24h / 1w / custom)
3. Price auto-calculated (pricePerHour × hours)
4. Confirms rental → pays RITUAL tokens
5. Agent executes tasks for duration
6. Auto-expires when time runs out
7. Creator receives 95%, platform takes 5%

### 3.6 Internationalization (i18n)
- 5 languages: English, Indonesia, Filipino, 한국어, हिंदी
- Globe icon dropdown in navbar
- Language preference saved in localStorage
- Full translation of landing page content

### 3.7 Precompile Integration ✅
- `executeTask()` — Run tasks on persistent agents (0x0820)
- `createSovereignTask()` — One-shot tasks on sovereign agents (0x080C)
- `onlyActiveRental` modifier — Only active renters can execute
- Precompile interface validation on agent listing

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
- `isPrecompileAgent(id)` — Check if agent uses precompile
- Platform fee: 5% per rental

### 4.2 Interfaces
- `IPersistentAgent.sol` — Interface for 0x0820 precompile
- `ISovereignAgent.sol` — Interface for 0x080C precompile
- `AgentTypes.sol` — Shared types and precompile addresses

### 4.3 Contract State
- **Status:** Deployed ✅
- **Network:** Ritual Testnet (Chain ID 1979)
- **Contract Address:** `0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE`
- **Explorer:** https://explorer.ritualfoundation.org/address/0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE
- **Compiler:** Solidity ^0.8.20
- **Framework:** Hardhat

---

## 5. Tech Stack

### 5.1 Frontend
- **Framework:** Next.js 16.2.7 (App Router, Turbopack)
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
- **Database:** In-memory + blockchain reads (Phase 1)
- **Future:** PostgreSQL / Supabase (Phase 2)

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
│  │  - CSS/JS   │  │  - Landing  │  │  /api/agents        │ │
│  │  - Images   │  │  - Market   │  │  /api/agents/[id]   │ │
│  │  - Logo     │  │  - Create   │  │  /api/search        │ │
│  │             │  │  - Dashboard│  │  /api/stats         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               RITUAL CHAIN (ID 1979)                         │
│            https://rpc.ritualfoundation.org                   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            AgentMarketplace.sol                        │  │
│  │         0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE    │  │
│  │                                                        │  │
│  │  - listAgent()     - rentAgent()      - rateAgent()   │  │
│  │  - executeTask()   - createTask()     - withdraw()    │  │
│  └───────────────────────────────────────────────────────┘  │
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
     └──────── Events/State ◄──── Precompile (0x0820/0x080C)
     
API Routes → Blockchain RPC → Cache Response → Frontend
```

### 5.6 Deployment Pipeline

```
Local Edit → Git Push → GitHub → Vercel Auto-Deploy → Production
     │
     └── Contract Deploy → Hardhat → Ritual Testnet
```

---

## 6. Design System

### 6.1 Color Palette (Ritual Native)
| Token | Hex | Usage |
|-------|-----|-------|
| Background | #050505 | Page background |
| Primary | #40FFAF | CTA, accents, links |
| Surface | #111111 | Cards, inputs |
| Border | #222222 | Dividers, card borders |
| Secondary Text | #A1A1AA | Descriptions, labels |
| Primary Text | #FFFFFF | Headings, body |

### 6.2 Typography
- **Headings:** Space Grotesk (font-weight: 900)
- **Body:** DM Sans (font-weight: 400)
- **Mono:** Space Grotesk / system monospace (addresses, stats)

### 6.3 Visual Style
- Dark glassmorphism
- Ambient green blob animations
- Replit-style centered input flow
- Clean, minimal, futuristic

### 6.4 Logo
- Stylized "R" monogram (teal/cyan gradient, 3D fluid glow)
- Small dot in R's negative space
- "Ritty.ai" text below (white, cyan dot separator)
- Black background

---

## 7. UI/UX Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Landing page CTA | "Launch App" (not "Connect Wallet") | Less aggressive, wallet only when needed |
| Chat input style | Replit-style centered | Familiar, modern AI UX |
| Heading | "You Don't Need to Code." | Bold, aspirational, green gradient on "Code" |
| Hero period | Superscript, 50% size | Stylistic, doesn't dominate |
| Stats section | 0x0820 / 0x080C / 5% | Technical credibility, Ritual-native |
| Rental UX | Preset buttons + custom | Quick selection + flexibility |
| Language switcher | Globe icon, dropdown | Universal icon, non-intrusive |
| Mobile nav | Hidden links, logo + connect only | Clean mobile experience |

---

## 8. Roadmap

### Phase 1 — Foundation ✅
- [x] Landing page (dark theme, hero, chat input)
- [x] Design system (Ritual Native palette, fonts)
- [x] Logo selection
- [x] i18n (5 languages)
- [x] Smart contracts written
- [x] Basic marketplace/create/dashboard pages
- [x] Rental UX (presets + custom duration)

### Phase 2 — Deploy & Connect ✅
- [x] Deploy contracts to Ritual Testnet
- [x] Connect frontend to contracts (ABI integration)
- [x] Wallet connect flow (marketplace/create/dashboard)
- [x] Rent agent flow (real transactions)
- [x] Withdraw earnings flow
- [x] Agent detail page (/agent/[id])
- [x] Precompile integration (executeTask, createSovereignTask)
- [x] Mobile responsive

### Phase 3 — Polish & Launch 🔄
- [x] Vercel deployment + auto-deploy
- [x] Environment variables configured
- [ ] Search & filter marketplace (API routes)
- [ ] Agent metadata (IPFS)
- [ ] Rating system UI
- [ ] Error handling & loading states
- [ ] Domain setup (ritty.ai)

### Phase 4 — Backend & Scale 📋
- [ ] Serverless API routes (search, stats, cache)
- [ ] Agent analytics dashboard
- [ ] Featured agents / trending
- [ ] Notification system
- [ ] PostgreSQL for off-chain data

### Phase 5 — Growth 🚀
- [ ] Agent templates (pre-built configs)
- [ ] Social features (reviews, comments)
- [ ] Multi-chain support
- [ ] Subgraph indexer
- [ ] API for third-party integrations
- [ ] Mobile app

---

## 9. API Routes (Serverless)

### 9.1 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List all active agents (paginated) |
| GET | `/api/agents/[id]` | Get agent details + rental history |
| GET | `/api/search?q=&type=&minPrice=&maxPrice=` | Search agents |
| GET | `/api/stats` | Platform statistics |
| GET | `/api/user/[address]` | User's agents + earnings |

### 9.2 Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## 10. Open Questions

1. **Domain:** ritty.ai not yet registered — need to secure
2. **Contract audit:** Needed before mainnet
3. **Token economics:** RITUAL token distribution, staking?
4. **Agent storage:** Where do agent prompts/configs live? (IPFS? On-chain?)
5. **KYC/Compliance:** Required for marketplace?

---

## 11. Success Metrics

| Metric | Target (Month 1) | Target (Month 6) |
|--------|-------------------|-------------------|
| Agents listed | 10 | 100 |
| Active rentals | 50 | 500 |
| Unique users | 200 | 2,000 |
| TVL (RITUAL) | 1,000 | 50,000 |
| Languages | 5 | 8+ |

---

*This is a living document. Update as product evolves.*
*Last updated: June 2026 — Phase 2 Complete*
