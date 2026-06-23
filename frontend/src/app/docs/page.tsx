'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

// ─── Sidebar sections ───
const SECTIONS = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'quickstart', label: 'Quick Start' },
      { id: 'connect-wallet', label: 'Connect Wallet' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { id: 'agents', label: 'AI Agents' },
      { id: 'rental', label: 'Renting' },
      { id: 'staking', label: 'Staking' },
      { id: 'on-chain-chat', label: 'On-Chain Chat' },
    ],
  },
  {
    title: 'Protocol',
    items: [
      { id: 'contracts', label: 'Smart Contracts' },
      { id: 'precompiles', label: 'Precompiles' },
      { id: 'fee-split', label: 'Fee Distribution' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'tech-stack', label: 'Tech Stack' },
      { id: 'roadmap', label: 'Roadmap' },
    ],
  },
];

// ─── Content for each section ───
const CONTENT: Record<string, { title: string; kicker: string; body: string }> = {
  overview: {
    title: 'Overview',
    kicker: 'INTRODUCTION',
    body: `Ritty.ai is a decentralized platform for renting AI agents on Ritual Chain. Every conversation is a verifiable on-chain transaction — not a chatbot wrapper.

Built on Ritual's precompile infrastructure (0x0802 LLM, 0x0820 Persistent Agent), Ritty.ai enables real on-chain inference with cryptographic proof.

**Core value proposition:**
- Rent specialized AI agents with RITUAL tokens
- Chat on-chain with verifiable responses
- Stake on agents and earn yield from rental revenue
- Hybrid mode: fast (~2s) or on-chain verifiable (~15s)`,
  },
  quickstart: {
    title: 'Quick Start',
    kicker: 'GETTING STARTED',
    body: `**Step 1 — Connect Wallet**
Connect an EVM wallet (MetaMask, Rainbow, etc.) to Ritual Testnet (Chain ID 1979).

**Step 2 — Get RITUAL Tokens**
Request testnet RITUAL from the Ritual faucet.

**Step 3 — Browse Agents**
Visit the Agent Rent page. Choose from 6 specialized agents:
- Content Pro — writing, SEO, social media
- Research Alpha — deep research and analysis
- Code Assistant — coding, debugging, review
- Marketing Guru — strategy and campaigns
- Trading Signal — crypto analysis
- HealthGuide — health and wellness

**Step 4 — Rent**
Select duration (1h / 3h / 24h), confirm the transaction. Cost: 0.005 RITUAL/hr.

**Step 5 — Chat**
Messages are sent via Ritual's 0x0802 precompile. Each response is an on-chain transaction with verifiable proof.`,
  },
  'connect-wallet': {
    title: 'Connect Wallet',
    kicker: 'WALLET SETUP',
    body: `Ritty.ai supports any EVM-compatible wallet via RainbowKit.

**Supported wallets:**
- MetaMask
- Rainbow
- WalletConnect
- Coinbase Wallet
- Injected wallets

**Network details:**
| Field | Value |
|-------|-------|
| Network Name | Ritual Testnet |
| Chain ID | 1979 |
| Currency | RITUAL |
| RPC URL | https://rpc.ritualfoundation.org |
| Explorer | https://explorer.ritualfoundation.org |

The platform uses RitualWallet as an escrow contract. Deposit RITUAL once, rent multiple agents without signing each transaction.`,
  },
  agents: {
    title: 'AI Agents',
    kicker: 'PLATFORM',
    body: `Each agent is a smart contract registered on the RittyRental contract. Agents are specialized — not general-purpose chatbots.

**Available agents:**

| Agent | ID | Specialty | Price |
|-------|-----|-----------|-------|
| Content Pro | 1 | Writing, SEO, social | 0.005/hr |
| Research Alpha | 2 | Research, analysis | 0.005/hr |
| Code Assistant | 3 | Coding, debugging | 0.005/hr |
| Marketing Guru | 4 | Strategy, campaigns | 0.005/hr |
| Trading Signal | 5 | Crypto analysis | 0.005/hr |
| HealthGuide | 6 | Health, wellness | 0.005/hr |

**Agent capabilities are embedded** — each agent has system prompts and skill files that define its behavior. No external API calls to third-party LLMs during on-chain mode.`,
  },
  rental: {
    title: 'Renting',
    kicker: 'HOW IT WORKS',
    body: `Renting an agent grants time-limited access to on-chain chat.

**Flow:**
1. Select agent and duration (1h / 3h / 24h)
2. Pay RITUAL via \`rentAgent()\` on-chain
3. Fee split: 70% stakers / 20% creator / 10% platform
4. Chat becomes available for the rental period

**Verification:**
Rental status is checked via AgentRented events on-chain. The platform scans recent blocks for rental events matching your wallet + agent ID.

**Expiry:**
Rental end time = block timestamp + (hours × 3600 × 1000). After expiry, chat access is revoked.`,
  },
  staking: {
    title: 'Staking',
    kicker: 'YIELD',
    body: `Stake RITUAL on any agent pool and earn yield from rental revenue.

**How it works:**
1. Choose an agent pool
2. Deposit RITUAL via \`stake()\`
3. When someone rents that agent, 70% of the fee goes to stakers
4. Claim rewards anytime via \`claimReward()\`

**Fee distribution per rental:**
- 70% → stakers (proportional to stake)
- 20% → agent creator
- 10% → platform treasury

**No lock period.** Unstake anytime. Rewards accrue in real-time.

**APY** is calculated from historical rental data, not projections. Higher-traffic agents generate more yield.`,
  },
  'on-chain-chat': {
    title: 'On-Chain Chat',
    kicker: 'VERIFIABLE INFERENCE',
    body: `Every message sent through Ritty.ai can be verified on-chain.

**Two modes:**

| Mode | Speed | Proof | Use Case |
|------|-------|-------|----------|
| Fast (⚡) | ~2s | Off-chain | Quick questions |
| On-chain (🔗) | ~15s | TX hash | Verifiable responses |

**How on-chain chat works:**
1. Message encoded and sent to Ritual's 0x0802 precompile
2. LLM inference runs on-chain (GLM-4.7-FP8, 128K context)
3. Response returned as on-chain data
4. TX hash serves as cryptographic proof

**Auto-fallback:** If on-chain inference fails, the system automatically retries via fast mode.

**Model:** Dynamic — read from executor \`/health\` endpoint. Currently \`zai-org/GLM-4.7-FP8\`.`,
  },
  contracts: {
    title: 'Smart Contracts',
    kicker: 'PROTOCOL',
    body: `All contracts deployed on Ritual Testnet (Chain ID 1979).

| Contract | Address | Purpose |
|----------|---------|---------|
| RittyRental | \`0x896277Ca55946c3602Bb6f5668d2eDdAb645A76c\` | Agent listing, rental, fee split |
| RittyStakingPool | \`0x2E3f82aE26a0EfE83B63bdabC905fFa3321223d0\` | Staking, yield distribution |
| RitualWallet | \`0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948\` | Deposit/withdraw escrow |
| RittyProfile | \`0xA487bd6BEE21AaE0E1705FE5DDB256Ae6B384c03\` | User profiles |

**RittyRental** — core contract. Handles agent registration, rental payments, and fee distribution (70/20/10). Includes \`updatePrice()\` for flexible pricing.

**RittyStakingPool** — per-agent staking pools. Stakers earn proportional share of rental revenue. No lock period, claim anytime.`,
  },
  precompiles: {
    title: 'Precompiles',
    kicker: 'RITUAL CHAIN',
    body: `Ritty.ai leverages Ritual Chain's enshrined precompile infrastructure.

| Precompile | Address | Purpose |
|------------|---------|---------|
| LLM | \`0x0802\` | On-chain LLM inference |
| Persistent Agent | \`0x0820\` | Agent identity and personality |
| CLI Agents | \`0x080c\` | Command-line agent interface |
| HTTP | \`0x0805\` | Long-running HTTP connections |

**0x0802 — LLM Precompile:**
Accepts model name, messages array, and parameters. Returns inference result as on-chain data. Supports EIP-1559 transactions (mandatory on Ritual).

**0x0820 — Persistent Agent:**
Stores agent personality and system prompts on-chain. Enables consistent agent behavior across sessions.`,
  },
  'fee-split': {
    title: 'Fee Distribution',
    kicker: 'ECONOMICS',
    body: `Every rental payment is split three ways:

**Split:**
- **70% → Stakers** — Distributed to RITUAL holders staked on that agent pool
- **20% → Creator** — Paid to the agent's original creator
- **10% → Platform** — Sent to platform treasury

**Flow:**
1. User pays rental fee via \`rentAgent()\`
2. Contract calculates split
3. Staker share sent to RittyStakingPool via \`distributeRevenue()\`
4. Creator share transferred directly
5. Platform share held in contract (withdrawable by owner)

**Staker rewards** accrue per-token. Larger stakes earn proportionally more. Claim anytime via \`claimReward()\`.`,
  },
  'tech-stack': {
    title: 'Tech Stack',
    kicker: 'REFERENCE',
    body: `| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Wallet | RainbowKit, wagmi, viem |
| Chain | Ritual Testnet (ID 1979) |
| Inference | 0x0802 LLM Precompile |
| Agent Identity | 0x0820 Persistent Agent |
| Smart Contracts | Solidity 0.8.20 |
| Hosting | Vercel |
| Fonts | Space Grotesk, DM Sans |

**Design system:** Dark theme (#050505), green accent (#40FFAF), glass morphism, Space Grotesk headings, DM Sans body text.`,
  },
  roadmap: {
    title: 'Roadmap',
    kicker: 'WHAT\'S NEXT',
    body: `**✅ Completed**
- On-chain chat via 0x0802 precompile
- Hybrid mode (fast + on-chain)
- Agent rental system (6 agents)
- Auto-fallback mechanism
- Dynamic model detection
- RittyRental contract with fee split
- RittyStakingPool with per-agent pools
- Staking UI with APY display

**🔧 In Progress**
- Fee distribution wiring (rental → staker pool)
- Agent personality on-chain via 0x0820
- Conversation history to GCS

**⬜ Planned**
- Agent creation by users
- Multi-agent chat
- Agent rankings and reviews
- Domain (ritty.ai)
- Mainnet deployment`,
  },
};

export default function DocsPage() {
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const content = CONTENT[active];

  return (
    <main className="min-h-screen" style={{ background: '#050505' }}>
      <Navbar activePage="docs" />

      <div className="flex max-w-7xl mx-auto">
        {/* ─── Sidebar ─── */}
        <aside
          className="fixed top-[60px] left-0 bottom-0 w-[260px] overflow-y-auto py-8 px-4 hidden lg:block"
          style={{
            background: 'rgba(5, 5, 5, 0.8)',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-6">
              <h3
                className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2 px-2"
                style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {section.title}
              </h3>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className="w-full text-left px-2 py-1.5 rounded-md text-sm transition-all duration-150"
                  style={{
                    color: active === item.id ? '#40FFAF' : 'rgba(255,255,255,0.5)',
                    background: active === item.id ? 'rgba(64,255,175,0.06)' : 'transparent',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: active === item.id ? 500 : 400,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ─── Mobile sidebar toggle ─── */}
        <button
          className="lg:hidden fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#40FFAF', color: '#050505' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '×' : '≡'}
        </button>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
            <div
              className="absolute left-0 top-[60px] bottom-0 w-[260px] overflow-y-auto py-8 px-4"
              style={{ background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {SECTIONS.map((section) => (
                <div key={section.title} className="mb-6">
                  <h3
                    className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2 px-2"
                    style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {section.title}
                  </h3>
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-md text-sm transition-all duration-150"
                      style={{
                        color: active === item.id ? '#40FFAF' : 'rgba(255,255,255,0.5)',
                        background: active === item.id ? 'rgba(64,255,175,0.06)' : 'transparent',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Content ─── */}
        <div className="flex-1 lg:ml-[260px] px-6 md:px-12 py-10 md:py-16 max-w-3xl">
          {/* Kicker */}
          <p
            className="text-[11px] font-medium uppercase tracking-[0.08em] mb-3"
            style={{ color: '#40FFAF', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {content.kicker}
          </p>

          {/* Title */}
          <h1
            className="text-3xl md:text-4xl font-bold mb-8 tracking-tight"
            style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {content.title}
          </h1>

          {/* Body */}
          <div
            className="docs-content"
            style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(content.body),
            }}
          />

          {/* Nav footer */}
          <div
            className="mt-16 pt-6 flex justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {getPrevNext(active).prev && (
              <button
                onClick={() => setActive(getPrevNext(active).prev!.id)}
                className="text-sm transition-colors hover:text-[#40FFAF]"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                ← {getPrevNext(active).prev!.label}
              </button>
            )}
            {getPrevNext(active).next && (
              <button
                onClick={() => setActive(getPrevNext(active).next!.id)}
                className="text-sm transition-colors hover:text-[#40FFAF] ml-auto"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {getPrevNext(active).next!.label} →
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .docs-content h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .docs-content p {
          margin-bottom: 1rem;
        }
        .docs-content strong {
          color: #fff;
          font-weight: 600;
        }
        .docs-content code {
          font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace;
          font-size: 0.85em;
          background: rgba(255,255,255,0.06);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          color: #40FFAF;
        }
        .docs-content pre {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .docs-content pre code {
          background: none;
          padding: 0;
          color: rgba(255,255,255,0.8);
        }
        .docs-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.875rem;
        }
        .docs-content th {
          text-align: left;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          font-weight: 500;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .docs-content td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .docs-content ul, .docs-content ol {
          padding-left: 1.25rem;
          margin-bottom: 1rem;
        }
        .docs-content li {
          margin-bottom: 0.25rem;
        }
        .docs-content hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin: 2rem 0;
        }
        .docs-content a {
          color: #40FFAF;
          text-decoration: none;
        }
        .docs-content a:hover {
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}

// ─── Simple markdown renderer ───
function renderMarkdown(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\| (.+) \|/g, (_match) => {
      const cells = _match.split('|').filter(Boolean).map((c) => c.trim());
      return '<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>';
    })
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h)/g, '$1')
    .replace(/(<\/h\d>)<\/p>/g, '$1');
}

// ─── Prev/Next navigation ───
function getPrevNext(activeId: string) {
  const allItems = SECTIONS.flatMap((s) => s.items);
  const idx = allItems.findIndex((i) => i.id === activeId);
  return {
    prev: idx > 0 ? allItems[idx - 1] : null,
    next: idx < allItems.length - 1 ? allItems[idx + 1] : null,
  };
}
