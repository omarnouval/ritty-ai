'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

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

// ─── Content blocks (structured, not markdown strings) ───

function OverviewContent() {
  return (
    <>
      <p className="mb-6">
        Ritty.ai is a decentralized platform for renting AI agents on Ritual Chain. Every conversation is a verifiable on-chain transaction, not a chatbot wrapper.
      </p>
      <p className="mb-6">
        Built on Ritual's precompile infrastructure (0x0802 LLM, 0x820 Persistent Agent), Ritty.ai enables real on-chain inference with cryptographic proof.
      </p>
      <h2>Core Value</h2>
      <ul>
        <li>Rent specialized AI agents with RITUAL tokens</li>
        <li>Chat on-chain with verifiable responses</li>
        <li>Stake on agents and earn yield from rental revenue</li>
        <li>Hybrid mode: fast (~2s) or on-chain verifiable (~15s)</li>
      </ul>
    </>
  );
}

function QuickstartContent() {
  return (
    <>
      <h2>1. Connect Wallet</h2>
      <p>Connect an EVM wallet (MetaMask, Rainbow, etc.) to Ritual Testnet (Chain ID 1979).</p>

      <h2>2. Get RITUAL Tokens</h2>
      <p>Request testnet RITUAL from the Ritual faucet.</p>

      <h2>3. Browse Agents</h2>
      <p>Visit the Agent Rent page. Choose from 6 specialized agents:</p>
      <ul>
        <li><strong>Content Pro</strong> - writing, SEO, social media</li>
        <li><strong>Research Alpha</strong> - deep research and analysis</li>
        <li><strong>Code Assistant</strong> - coding, debugging, review</li>
        <li><strong>Marketing Guru</strong> - strategy and campaigns</li>
        <li><strong>Trading Signal</strong> - crypto analysis</li>
        <li><strong>HealthGuide</strong> - health and wellness</li>
      </ul>

      <h2>4. Rent</h2>
      <p>Select duration (1h / 3h / 24h), confirm the transaction. Cost: 0.005 RITUAL/hr.</p>

      <h2>5. Chat</h2>
      <p>Messages are sent via Ritual's 0x0802 precompile. Each response is an on-chain transaction with verifiable proof.</p>
    </>
  );
}

function ConnectWalletContent() {
  return (
    <>
      <p className="mb-6">Ritty.ai supports any EVM-compatible wallet via RainbowKit.</p>
      <h2>Supported Wallets</h2>
      <ul>
        <li>MetaMask</li>
        <li>Rainbow</li>
        <li>WalletConnect</li>
        <li>Coinbase Wallet</li>
        <li>Injected wallets</li>
      </ul>
      <h2>Network Details</h2>
      <table>
        <tbody>
          <tr><td>Network Name</td><td>Ritual Testnet</td></tr>
          <tr><td>Chain ID</td><td>1979</td></tr>
          <tr><td>Currency</td><td>RITUAL</td></tr>
          <tr><td>RPC URL</td><td><code>https://rpc.ritualfoundation.org</code></td></tr>
          <tr><td>Explorer</td><td><code>https://explorer.ritualfoundation.org</code></td></tr>
        </tbody>
      </table>
      <p className="mt-4">The platform uses RitualWallet as an escrow contract. Deposit RITUAL once, rent multiple agents without signing each transaction.</p>
    </>
  );
}

function AgentsContent() {
  return (
    <>
      <p className="mb-6">Each agent is a smart contract registered on the RittyRental contract. Agents are specialized, not general-purpose chatbots.</p>
      <h2>Available Agents</h2>
      <table>
        <thead>
          <tr><th>Agent</th><th>ID</th><th>Specialty</th><th>Price</th></tr>
        </thead>
        <tbody>
          <tr><td>Content Pro</td><td>1</td><td>Writing, SEO, social</td><td>0.005/hr</td></tr>
          <tr><td>Research Alpha</td><td>2</td><td>Research, analysis</td><td>0.005/hr</td></tr>
          <tr><td>Code Assistant</td><td>3</td><td>Coding, debugging</td><td>0.005/hr</td></tr>
          <tr><td>Marketing Guru</td><td>4</td><td>Strategy, campaigns</td><td>0.005/hr</td></tr>
          <tr><td>Trading Signal</td><td>5</td><td>Crypto analysis</td><td>0.005/hr</td></tr>
          <tr><td>HealthGuide</td><td>6</td><td>Health, wellness</td><td>0.005/hr</td></tr>
        </tbody>
      </table>
      <p className="mt-4">Agent capabilities are embedded via system prompts and skill files. No external API calls during on-chain mode.</p>
    </>
  );
}

function RentalContent() {
  return (
    <>
      <p className="mb-6">Renting an agent grants time-limited access to on-chain chat.</p>
      <h2>Flow</h2>
      <ol>
        <li>Select agent and duration (1h / 3h / 24h)</li>
        <li>Pay RITUAL via <code>rentAgent()</code> on-chain</li>
        <li>Fee split: 70% stakers / 20% creator / 10% platform</li>
        <li>Chat becomes available for the rental period</li>
      </ol>
      <h2>Verification</h2>
      <p>Rental status is checked via AgentRented events on-chain. The platform scans recent blocks for rental events matching your wallet + agent ID.</p>
      <h2>Expiry</h2>
      <p>Rental end time = block timestamp + (hours x 3600 x 1000). After expiry, chat access is revoked.</p>
    </>
  );
}

function StakingContent() {
  return (
    <>
      <p className="mb-6">Stake RITUAL on any agent pool and earn yield from rental revenue.</p>
      <h2>How It Works</h2>
      <ol>
        <li>Choose an agent pool</li>
        <li>Deposit RITUAL via <code>stake()</code></li>
        <li>When someone rents that agent, 70% of the fee goes to stakers</li>
        <li>Claim rewards anytime via <code>claimReward()</code></li>
      </ol>
      <h2>Fee Distribution Per Rental</h2>
      <ul>
        <li><strong>70%</strong> to stakers (proportional to stake)</li>
        <li><strong>20%</strong> to agent creator</li>
        <li><strong>10%</strong> to platform treasury</li>
      </ul>
      <p className="mt-4">No lock period. Unstake anytime. Rewards accrue in real-time.</p>
      <p>APY is calculated from historical rental data, not projections. Higher-traffic agents generate more yield.</p>
    </>
  );
}

function OnChainChatContent() {
  return (
    <>
      <p className="mb-6">Every message sent through Ritty.ai can be verified on-chain.</p>
      <h2>Two Modes</h2>
      <table>
        <thead>
          <tr><th>Mode</th><th>Speed</th><th>Proof</th><th>Use Case</th></tr>
        </thead>
        <tbody>
          <tr><td>Fast</td><td>~2s</td><td>Off-chain</td><td>Quick questions</td></tr>
          <tr><td>On-chain</td><td>~15s</td><td>TX hash</td><td>Verifiable responses</td></tr>
        </tbody>
      </table>
      <h2>How On-Chain Chat Works</h2>
      <ol>
        <li>Message encoded and sent to Ritual's 0x0802 precompile</li>
        <li>LLM inference runs on-chain (GLM-4.7-FP8, 128K context)</li>
        <li>Response returned as on-chain data</li>
        <li>TX hash serves as cryptographic proof</li>
      </ol>
      <p className="mt-4"><strong>Auto-fallback:</strong> If on-chain inference fails, the system automatically retries via fast mode.</p>
      <p><strong>Model:</strong> Dynamic, read from executor <code>/health</code> endpoint. Currently <code>zai-org/GLM-4.7-FP8</code>.</p>
    </>
  );
}

function ContractsContent() {
  return (
    <>
      <p className="mb-6">All contracts deployed on Ritual Testnet (Chain ID 1979).</p>
      <table>
        <thead>
          <tr><th>Contract</th><th>Address</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>RittyRental</td><td><code>0x8962...A76c</code></td><td>Agent listing, rental, fee split</td></tr>
          <tr><td>RittyStakingPool</td><td><code>0x2E3f...23d0</code></td><td>Staking, yield distribution</td></tr>
          <tr><td>RitualWallet</td><td><code>0x532F...3948</code></td><td>Deposit/withdraw escrow</td></tr>
          <tr><td>RittyProfile</td><td><code>0xA487...4c03</code></td><td>User profiles</td></tr>
        </tbody>
      </table>
      <h2>RittyRental</h2>
      <p>Core contract. Handles agent registration, rental payments, and fee distribution (70/20/10). Includes <code>updatePrice()</code> for flexible pricing.</p>
      <h2>RittyStakingPool</h2>
      <p>Per-agent staking pools. Stakers earn proportional share of rental revenue. No lock period, claim anytime.</p>
    </>
  );
}

function PrecompilesContent() {
  return (
    <>
      <p className="mb-6">Ritty.ai leverages Ritual Chain's enshrined precompile infrastructure.</p>
      <table>
        <thead>
          <tr><th>Precompile</th><th>Address</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td>LLM</td><td><code>0x0802</code></td><td>On-chain LLM inference</td></tr>
          <tr><td>Persistent Agent</td><td><code>0x0820</code></td><td>Agent identity and personality</td></tr>
          <tr><td>CLI Agents</td><td><code>0x080c</code></td><td>Command-line agent interface</td></tr>
          <tr><td>HTTP</td><td><code>0x0805</code></td><td>Long-running HTTP connections</td></tr>
        </tbody>
      </table>
      <h2>0x0802 - LLM Precompile</h2>
      <p>Accepts model name, messages array, and parameters. Returns inference result as on-chain data. Supports EIP-1559 transactions (mandatory on Ritual).</p>
      <h2>0x0820 - Persistent Agent</h2>
      <p>Stores agent personality and system prompts on-chain. Enables consistent agent behavior across sessions.</p>
    </>
  );
}

function FeeSplitContent() {
  return (
    <>
      <p className="mb-6">Every rental payment is split three ways.</p>
      <h2>Split</h2>
      <ul>
        <li><strong>70% to Stakers</strong> - Distributed to RITUAL holders staked on that agent pool</li>
        <li><strong>20% to Creator</strong> - Paid to the agent's original creator</li>
        <li><strong>10% to Platform</strong> - Sent to platform treasury</li>
      </ul>
      <h2>Flow</h2>
      <ol>
        <li>User pays rental fee via <code>rentAgent()</code></li>
        <li>Contract calculates split</li>
        <li>Staker share sent to RittyStakingPool via <code>distributeRevenue()</code></li>
        <li>Creator share transferred directly</li>
        <li>Platform share held in contract (withdrawable by owner)</li>
      </ol>
      <p className="mt-4">Staker rewards accrue per-token. Larger stakes earn proportionally more. Claim anytime via <code>claimReward()</code>.</p>
    </>
  );
}

function TechStackContent() {
  return (
    <>
      <table>
        <tbody>
          <tr><td>Frontend</td><td>Next.js 16, React 19, Tailwind CSS</td></tr>
          <tr><td>Wallet</td><td>RainbowKit, wagmi, viem</td></tr>
          <tr><td>Chain</td><td>Ritual Testnet (ID 1979)</td></tr>
          <tr><td>Inference</td><td>0x0802 LLM Precompile</td></tr>
          <tr><td>Agent Identity</td><td>0x0820 Persistent Agent</td></tr>
          <tr><td>Smart Contracts</td><td>Solidity 0.8.20</td></tr>
          <tr><td>Hosting</td><td>Vercel</td></tr>
          <tr><td>Fonts</td><td>Space Grotesk, DM Sans</td></tr>
        </tbody>
      </table>
      <p className="mt-4">Design system: dark theme (#050505), green accent (#40FFAF), glass morphism, Space Grotesk headings, DM Sans body text.</p>
    </>
  );
}

function RoadmapContent() {
  return (
    <>
      <h2>Completed</h2>
      <ul>
        <li>On-chain chat via 0x0802 precompile</li>
        <li>Hybrid mode (fast + on-chain)</li>
        <li>Agent rental system (6 agents)</li>
        <li>Auto-fallback mechanism</li>
        <li>Dynamic model detection</li>
        <li>RittyRental contract with fee split</li>
        <li>RittyStakingPool with per-agent pools</li>
        <li>Staking UI with APY display</li>
      </ul>
      <h2>In Progress</h2>
      <ul>
        <li>Fee distribution wiring (rental to staker pool)</li>
        <li>Agent personality on-chain via 0x0820</li>
        <li>Conversation history to GCS</li>
      </ul>
      <h2>Planned</h2>
      <ul>
        <li>Agent creation by users</li>
        <li>Multi-agent chat</li>
        <li>Agent rankings and reviews</li>
        <li>Domain (ritty.ai)</li>
        <li>Mainnet deployment</li>
      </ul>
    </>
  );
}

const CONTENT_MAP: Record<string, { title: string; kicker?: string; Component: React.FC }> = {
  overview: { title: 'Overview', kicker: 'INTRODUCTION', Component: OverviewContent },
  quickstart: { title: 'Quick Start', Component: QuickstartContent },
  'connect-wallet': { title: 'Connect Wallet', Component: ConnectWalletContent },
  agents: { title: 'AI Agents', Component: AgentsContent },
  rental: { title: 'Renting', Component: RentalContent },
  staking: { title: 'Staking', Component: StakingContent },
  'on-chain-chat': { title: 'On-Chain Chat', Component: OnChainChatContent },
  contracts: { title: 'Smart Contracts', kicker: 'PROTOCOL', Component: ContractsContent },
  precompiles: { title: 'Precompiles', Component: PrecompilesContent },
  'fee-split': { title: 'Fee Distribution', Component: FeeSplitContent },
  'tech-stack': { title: 'Tech Stack', kicker: 'REFERENCE', Component: TechStackContent },
  roadmap: { title: 'Roadmap', Component: RoadmapContent },
};

export default function DocsPage() {
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { title, kicker, Component } = CONTENT_MAP[active];

  return (
    <main className="min-h-screen" style={{ background: '#050505' }}>
      <Navbar activePage="docs" />

      <div className="flex max-w-7xl mx-auto">
        {/* ─── Sidebar ─── */}
        <aside
          className="fixed top-[60px] left-0 bottom-0 w-[260px] overflow-y-auto py-10 px-5 hidden lg:block"
          style={{
            background: 'rgba(8, 8, 8, 0.9)',
            borderRight: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-8">
              <h3
                className="text-[10px] font-medium uppercase tracking-[0.1em] mb-3 px-2"
                style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {section.title}
              </h3>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className="w-full text-left px-2 py-1.5 rounded text-[13px] transition-all duration-150 block"
                  style={{
                    color: active === item.id ? '#fff' : 'rgba(255,255,255,0.4)',
                    background: active === item.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: active === item.id ? 500 : 400,
                    borderLeft: active === item.id ? '2px solid #40FFAF' : '2px solid transparent',
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
          className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center text-lg"
          style={{ background: '#40FFAF', color: '#050505' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '\u00D7' : '\u2261'}
        </button>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)}>
            <div
              className="absolute left-0 top-0 bottom-0 w-[280px] overflow-y-auto py-10 px-5"
              style={{ background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.06)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {SECTIONS.map((section) => (
                <div key={section.title} className="mb-8">
                  <h3
                    className="text-[10px] font-medium uppercase tracking-[0.1em] mb-3 px-2"
                    style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {section.title}
                  </h3>
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActive(item.id); setSidebarOpen(false); }}
                      className="w-full text-left px-2 py-1.5 rounded text-[13px] transition-all duration-150 block"
                      style={{
                        color: active === item.id ? '#fff' : 'rgba(255,255,255,0.4)',
                        background: active === item.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: active === item.id ? 500 : 400,
                        borderLeft: active === item.id ? '2px solid #40FFAF' : '2px solid transparent',
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
        <div className="flex-1 lg:ml-[260px] px-6 md:px-16 py-12 md:py-20 max-w-3xl">
          {/* Kicker (only on first section - overview) */}
          {kicker && (
            <p
              className="text-[10px] font-medium uppercase tracking-[0.12em] mb-4"
              style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {kicker}
            </p>
          )}

          {/* Title */}
          <h1
            className="text-2xl md:text-3xl font-bold mb-10 tracking-tight"
            style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
          >
            {title}
          </h1>

          {/* Content */}
          <div className="docs-body">
            <Component />
          </div>

          {/* Nav footer */}
          <div
            className="mt-20 pt-8 flex justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            {getPrevNext(active).prev && (
              <button
                onClick={() => setActive(getPrevNext(active).prev!.id)}
                className="text-[13px] transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}
              >
                {getPrevNext(active).prev!.label}
              </button>
            )}
            {getPrevNext(active).next && (
              <button
                onClick={() => setActive(getPrevNext(active).next!.id)}
                className="text-[13px] transition-colors hover:text-white ml-auto"
                style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Sans, sans-serif' }}
              >
                {getPrevNext(active).next!.label}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .docs-body h2 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
        }
        .docs-body p {
          color: rgba(255,255,255,0.55);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          line-height: 1.8;
          margin-bottom: 0.75rem;
        }
        .docs-body strong {
          color: rgba(255,255,255,0.85);
          font-weight: 600;
        }
        .docs-body code {
          font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace;
          font-size: 0.8em;
          background: rgba(255,255,255,0.05);
          padding: 0.15em 0.4em;
          border-radius: 3px;
          color: #40FFAF;
        }
        .docs-body ul, .docs-body ol {
          padding-left: 1.25rem;
          margin-bottom: 1rem;
          color: rgba(255,255,255,0.55);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          line-height: 1.8;
        }
        .docs-body li {
          margin-bottom: 0.25rem;
        }
        .docs-body li strong {
          color: rgba(255,255,255,0.85);
        }
        .docs-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0 1.5rem;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
        }
        .docs-body thead th {
          text-align: left;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.35);
          font-weight: 500;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .docs-body tbody td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.55);
        }
        .docs-body tbody tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </main>
  );
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
