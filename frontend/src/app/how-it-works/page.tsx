'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function HowItWorksPage() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen" style={{ background: '#050505' }}>
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 md:px-6 lg:px-12 py-4" style={{ borderBottom: '1px solid #161616' }}>
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <img src="/ritty-logo.png" alt="Ritty.ai" className="h-8 md:h-10 w-auto" />
          <span className="text-lg md:text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ritty.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <Link href="/agent-rent" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>Agent Rent</Link>
          <Link href="/how-it-works" className="text-sm transition-colors hover:text-white" style={{ color: '#40FFAF' }}>How It Works</Link>
          {isConnected && (
            <Link href="/dashboard" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>Dashboard</Link>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <ConnectButton />
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
            How It Works
          </h1>
          <p className="text-sm md:text-base" style={{ color: '#fff', opacity: 0.7 }}>
            Three steps. No code. Start using AI agents in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20">
          {[
            {
              step: '01',
              icon: '🔍',
              title: 'Browse Agents',
              desc: 'Explore AI agents built for research, trading, content, and more. Each agent has clear pricing and capabilities listed on the Agent Rent page.',
              detail: 'Use the search bar or category pills to filter agents by type. Every agent card shows its name, description, rating, rental count, and hourly price in RITUAL tokens.',
            },
            {
              step: '02',
              icon: '🔗',
              title: 'Connect & Rent',
              desc: 'Connect your wallet, pick a rental duration, and confirm the transaction on-chain.',
              detail: 'Click "Rent" on any agent card. If you haven\'t connected a wallet yet, the connect modal will appear automatically. Choose your duration (1h, 3h, 6h, 12h, or 24h) and confirm. Your first rental is free on testnet.',
            },
            {
              step: '03',
              icon: '🚀',
              title: 'Use Your Agent',
              desc: 'Your rented agent appears in the dashboard. Chat with it, give it tasks, and get results instantly.',
              detail: 'After renting, go to your Dashboard to see all active rentals. Each agent has a countdown timer showing remaining time. Click on any active rental to start chatting. You can extend your rental before it expires.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 md:p-8 transition-all duration-300"
              style={{
                background: '#0A0A0A',
                border: '1px solid #161616',
              }}
            >
              <div className="text-xs font-mono font-bold mb-4 tracking-widest" style={{ color: '#40FFAF' }}>
                STEP {item.step}
              </div>
              <div className="text-4xl mb-5">{item.icon}</div>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#fff', opacity: 0.8 }}>
                {item.desc}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#fff', opacity: 0.6 }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="mb-20">
          <h2 className="text-xl md:text-2xl font-bold mb-8 text-center" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
            What You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: '🦊',
                title: 'EVM Wallet',
                desc: 'MetaMask, Rainbow, Coinbase Wallet, or any WalletConnect-compatible wallet.',
              },
              {
                icon: '⛽',
                title: 'RITUAL Tokens',
                desc: 'Used to pay for agent rentals and gas fees. Get free testnet tokens from the Ritual faucet.',
              },
              {
                icon: '🌐',
                title: 'Ritual Chain Network',
                desc: 'Add Ritual Chain (ID 1979) to your wallet. RPC details available on the Ritual docs.',
              },
              {
                icon: '💡',
                title: 'An Idea',
                desc: 'Describe what you want your agent to do in plain language. No technical knowledge needed.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl px-5 py-5"
                style={{ background: '#0A0A0A', border: '1px solid #161616' }}
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#fff', opacity: 0.7 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-xl md:text-2xl font-bold mb-8 text-center" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
            FAQ
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Do I need to code?',
                a: 'No. Describe what you want in plain language. The platform matches you with the right agent.',
              },
              {
                q: 'What wallet do I need?',
                a: 'Any EVM-compatible wallet (MetaMask, Rainbow, etc.) connected to Ritual Chain testnet.',
              },
              {
                q: 'How much does it cost?',
                a: 'Agents are priced per hour in RITUAL tokens. Your first rental is free on testnet.',
              },
              {
                q: 'Can I extend my rental?',
                a: 'Yes. Extend anytime from the dashboard before your rental expires.',
              },
              {
                q: 'What happens when my rental expires?',
                a: 'The agent becomes unavailable in your dashboard. You can re-rent it anytime from the Agent Rent page.',
              },
              {
                q: 'Can I rent multiple agents at once?',
                a: 'Yes. Rent as many agents as you need. Each one appears as a separate card in your dashboard.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-xl px-6 py-5"
                style={{ background: '#0A0A0A', border: '1px solid #161616' }}
              >
                <p className="text-sm font-bold mb-2" style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {faq.q}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#fff', opacity: 0.7 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/agent-rent"
            className="inline-flex items-center gap-2 text-sm font-medium px-8 py-3 rounded-xl transition-all hover:shadow-lg"
            style={{ background: '#40FFAF', color: '#050505', boxShadow: '0 0 20px rgba(64,255,175,0.15)' }}
          >
            Browse Agents →
          </Link>
        </div>
      </div>
    </main>
  );
}
