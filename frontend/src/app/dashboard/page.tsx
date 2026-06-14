'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ChatBox } from '@/components/ChatBox';
import { UsernameModal } from '@/components/UsernameModal';
import { AGENT_CATEGORIES, type AgentCategory } from '@/lib/agents';
import ReviewModal from '@/components/ReviewModal';

interface ActiveRental {
  id: string;
  agentName: string;
  category: string;
  icon: string;
  endTime: number; // unix timestamp
  agentAddress: string;
}

function DashboardNav({ username }: { username?: string | null }) {
  return (
    <nav className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <Image src="/ritty-logo.png" alt="Ritty.ai" width={32} height={32} className="h-7 md:h-8 w-auto" />
        <span className="text-base md:text-lg font-heavy text-white">Ritty.ai</span>
      </Link>
      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        <Link href="/agent-rent" className="hidden md:block text-sm text-gray-400 hover:text-white transition">Agent Rent</Link>
        <Link href="/dashboard" className="hidden md:block text-sm text-[#40FFAF] font-medium">Dashboard</Link>
        <div className="flex items-center gap-2">
          {username && (
            <span className="hidden md:inline text-sm text-gray-300 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(64,255,175,0.08)', border: '1px solid rgba(64,255,175,0.15)' }}>
              @{username}
            </span>
          )}
          <ConnectButton />
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([
    // Demo data — replace with on-chain data later
    {
      id: '1',
      agentName: 'Content Pro',
      category: 'content',
      icon: '✍️',
      endTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
      agentAddress: '0x0000000000000000000000000000000000000001',
    },
    {
      id: '2',
      agentName: 'Research Alpha',
      category: 'research',
      icon: '🔬',
      endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      agentAddress: '0x0000000000000000000000000000000000000002',
    },
  ]);
  const [chatRental, setChatRental] = useState<ActiveRental | null>(null);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRental, setReviewRental] = useState<ActiveRental | null>(null);
  const [reviewedRentals, setReviewedRentals] = useState<Set<string>>(new Set());

  // Countdown timer + detect expiry for review
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const newCounters: Record<string, number> = {};
      activeRentals.forEach((r) => {
        const remaining = Math.max(0, r.endTime - now);
        newCounters[r.id] = remaining;
        
        // If just expired and not yet reviewed, show review modal
        if (remaining === 0 && !reviewedRentals.has(r.id) && !showReviewModal) {
          setReviewRental(r);
          setShowReviewModal(true);
        }
      });
      setCounters(newCounters);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRentals, reviewedRentals, showReviewModal]);

  // Check username on connect
  useEffect(() => {
    if (isConnected && address) {
      const stored = localStorage.getItem(`ritty_username_${address}`);
      if (stored) {
        setUsername(stored);
      } else {
        setShowUsernameModal(true);
      }
    }
  }, [isConnected, address]);

  const handleRentCategory = (cat: AgentCategory) => {
    if (cat.id === 'custom') {
      // TODO: open custom request modal
      return;
    }
    // TODO: trigger smart contract rental
    const newRental: ActiveRental = {
      id: Date.now().toString(),
      agentName: cat.name + ' Agent',
      category: cat.id,
      icon: cat.icon,
      endTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      agentAddress: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setActiveRentals((prev) => [...prev, newRental]);
    setChatRental(newRental);
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
        <DashboardNav />
        <div className="flex flex-col items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <p className="text-gray-400 mb-4 text-center">Connect your wallet to access the dashboard</p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
      <DashboardNav username={username} />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Active Rentals */}
        {activeRentals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-heavy text-white mb-4">Active Rentals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeRentals.map((rental) => {
                const remaining = counters[rental.id] || 0;
                return (
                  <button
                    key={rental.id}
                    onClick={() => setChatRental(rental)}
                    className={`text-left p-4 rounded-xl transition-all ${chatRental?.id === rental.id ? 'ring-1' : ''}`}
                    style={{
                      background: chatRental?.id === rental.id ? 'rgba(64,255,175,0.08)' : 'rgba(17,17,17,0.8)',
                      border: `1px solid ${chatRental?.id === rental.id ? 'rgba(64,255,175,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      ...(chatRental?.id === rental.id ? { ringColor: '#40FFAF' } : {}),
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{rental.icon}</span>
                        <span className="text-sm font-medium text-white">{rental.agentName}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(64,255,175,0.1)', color: '#40FFAF' }}>
                        {rental.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-500">{rental.agentAddress.slice(0, 6)}...{rental.agentAddress.slice(-4)}</span>
                      <span className={`text-xs font-medium ${remaining > 3600 ? 'text-[#40FFAF]' : remaining > 600 ? 'text-orange-400' : 'text-red-400'}`}>
                        {remaining > 3600 ? `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m` : remaining > 600 ? `${Math.floor(remaining / 60)}m` : remaining > 0 ? `${remaining}s` : 'Expired'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Area */}
        {chatRental ? (
          <div className="mb-8" style={{ height: '500px' }}>
            <ChatBox
              key={chatRental.id}
              agentName={chatRental.agentName}
              agentCategory={chatRental.category}
              agentIcon={chatRental.icon}
              remainingTime={counters[chatRental.id] || 0}
              onExtend={() => {/* TODO: extend rental */}}
              onSwitch={() => setChatRental(null)}
            />
          </div>
        ) : (
          /* Category Picker */
          <div>
            <h2 className="text-xl font-heavy text-white mb-2">Rent an Agent</h2>
            <p className="text-sm text-gray-400 mb-6">Pick a category to start chatting instantly</p>
            <div className="flex flex-wrap gap-3">
              {AGENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleRentCategory(cat)}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(17,17,17,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = cat.id === 'custom' ? 'rgba(255,255,255,0.2)' : 'rgba(64,255,175,0.3)';
                    e.currentTarget.style.background = cat.id === 'custom' ? 'rgba(255,255,255,0.05)' : 'rgba(64,255,175,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'rgba(17,17,17,0.8)';
                  }}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm text-gray-300 font-medium">{cat.name}</span>
                  {cat.id === 'custom' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1" style={{ background: 'rgba(255,255,255,0.08)', color: '#A1A1AA' }}>
                      Request
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Rentals', value: activeRentals.length.toString() },
            { label: 'Total Spent', value: '0 RITUAL' },
            { label: 'Agents Used', value: new Set(activeRentals.map(r => r.category)).size.toString() },
            { label: 'Member Since', value: 'Today' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl" style={{ background: 'rgba(17,17,17,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-lg font-heavy text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Username Modal */}
      {showUsernameModal && (
        <UsernameModal
          onComplete={(name) => {
            setUsername(name);
            setShowUsernameModal(false);
          }}
        />
      )}

      {/* Review Modal - shows when rental expires */}
      {showReviewModal && reviewRental && (
        <ReviewModal
          isOpen={showReviewModal}
          agentId={reviewRental.id}
          agentName={reviewRental.agentName}
          onClose={() => {
            setReviewedRentals(prev => new Set([...prev, reviewRental.id]));
            setShowReviewModal(false);
            setReviewRental(null);
          }}
        />
      )}
    </main>
  );
}
