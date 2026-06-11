'use client';

import { useReadContract } from 'wagmi';
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/lib/contracts';
import { AgentCard } from '@/components/AgentCard';
import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

const VIEW_MODES = ['grid', 'list', 'compact'] as const;

export default function AgentRentPage() {
  const { isConnected } = useAccount();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const limit = 12;

  const { data: agentIds, isLoading } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getActiveAgents',
    args: [BigInt(page * limit), BigInt(limit)],
  });

  return (
    <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href="/" className="flex items-center gap-2">
          <img src="/ritty-logo.png" alt="Ritty.ai" className="h-7 md:h-8 w-auto" />
          <span className="text-base md:text-lg font-heavy text-white">Ritty.ai</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-6">
          <Link href="/agent-rent" className="hidden md:block text-sm text-[#40FFAF] font-medium">Agent Rent</Link>
          <Link href="/how-it-works" className="hidden md:block text-sm text-gray-400 hover:text-white transition">How It Works</Link>
          {isConnected && (
            <Link href="/dashboard" className="hidden md:block text-sm text-gray-400 hover:text-white transition">Dashboard</Link>
          )}
          <ConnectButton />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heavy text-white">Agent Rent</h1>
            <p className="text-sm text-gray-500 mt-1">Discover & rent autonomous AI agents on Ritual Chain</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents…"
                className="pl-10 pr-4 py-2 rounded-xl text-sm text-white placeholder-gray-500 outline-none w-full md:w-64"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 text-xs transition ${viewMode === mode ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {mode === 'grid' ? '▦' : mode === 'list' ? '☰' : '≡'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-[#40FFAF] border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 text-sm mt-4">Loading agents…</p>
          </div>
        ) : !agentIds || agentIds.length === 0 ? (
          <div className="text-center py-24 glass rounded-2xl">
            <div className="text-5xl mb-4">🏜️</div>
            <p className="text-gray-400 text-lg font-heavy mb-2">No agents yet</p>
            <p className="text-gray-500 text-sm mb-6">Be the first to list an agent on Ritual</p>
            <Link href="/create" className="inline-flex items-center gap-2 text-sm font-medium text-black px-6 py-2.5 rounded-full" style={{ background: '#40FFAF' }}>
              List your agent →
            </Link>
          </div>
        ) : (
          <>
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : viewMode === 'list'
                ? 'flex flex-col gap-3'
                : 'flex flex-col gap-2'
            }>
              {agentIds.map((id) => (
                <AgentRow key={id.toString()} agentId={id} viewMode={viewMode} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-600 font-mono">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!agentIds || agentIds.length < limit}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function AgentRow({ agentId, viewMode }: { agentId: bigint; viewMode: 'grid' | 'list' | 'compact' }) {
  const { data, isLoading } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'agents',
    args: [agentId],
  });

  if (isLoading || !data) return null;

  const [owner, agentContract, name, description, pricePerHour, totalEarnings, totalRentals, rating, ratingCount, isActive, agentType] = data;

  return (
    <AgentCard
      agent={{
        id: agentId,
        owner,
        agentContract,
        name,
        description,
        pricePerHour,
        totalRentals,
        rating,
        ratingCount,
        isActive,
        agentType,
      }}
      viewMode={viewMode}
    />
  );
}
