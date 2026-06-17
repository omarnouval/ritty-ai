'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import Link from 'next/link';
import Image from 'next/image';
import { PenTool, FlaskConical, TrendingUp, Megaphone, Code, Bot, Stethoscope } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileMenu from '@/components/MobileMenu';
import { ChatBox } from '@/components/ChatBox';
import { UsernameModal } from '@/components/UsernameModal';
import { AGENT_CATEGORIES, type AgentCategory } from '@/lib/agents';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts';
import ReviewModal from '@/components/ReviewModal';
import { useNotifications } from '@/components/NotificationProvider';

interface ActiveRental {
  id: string;
  agentId: number;
  agentName: string;
  category: string;
  icon: string;
  endTime: number; // unix timestamp
  agentAddress: string;
}

// Agent ID to category mapping
const AGENT_CATEGORY_MAP: Record<number, { category: string; Icon: any }> = {
  0: { category: 'content', Icon: PenTool },
  1: { category: 'research', Icon: FlaskConical },
  2: { category: 'trading', Icon: TrendingUp },
  3: { category: 'marketing', Icon: Megaphone },
  4: { category: 'coding', Icon: Code },
  5: { category: 'other', Icon: Bot },
  12: { category: 'healthcare', Icon: Stethoscope },
};

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
          <MobileMenu />
        </div>
      </div>
      </nav>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { addNotification } = useNotifications();
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [chatRental, setChatRental] = useState<ActiveRental | null>(null);
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRental, setReviewRental] = useState<ActiveRental | null>(null);
  const [reviewedRentals, setReviewedRentals] = useState<Set<string>>(new Set());
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Fetch agent count to know how many agents exist
  const { data: agentCount } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'agentCount',
  });

  // Fetch real active rentals from contract
  const fetchActiveRentals = useCallback(async (retryCount = 0) => {
    if (!address || !agentCount) return;
    setLoadingRentals(true);
    const count = Number(agentCount);
    const rentals: ActiveRental[] = [];

    // Check each agent for active rental
    const checks = [];
    for (let i = 0; i < count; i++) {
      checks.push(
        fetch(`/api/rental-check?address=${address}&agentId=${i}`)
          .then(r => r.json())
          .then(data => {
            if (data.active) {
              const meta = AGENT_CATEGORY_MAP[i] || { category: 'other', icon: '🤖' };
              rentals.push({
                id: `${i}-${data.rentalId}`,
                agentId: i,
                agentName: data.name || `Agent #${i}`,
                category: meta.category,
                icon: meta.icon,
                endTime: Number(data.endTime),
                agentAddress: MARKETPLACE_ADDRESS,
              });
            }
          })
          .catch(() => {/* skip */})
      );
    }

    await Promise.all(checks);
    setActiveRentals(rentals);
    if (rentals.length > 0 && !chatRental) {
      setChatRental(rentals[0]);
    }
    setLoadingRentals(false);
    
    // Retry if no rentals found and we haven't retried too many times
    // This helps when redirecting from a fresh rental tx
    if (rentals.length === 0 && retryCount < 3) {
      setTimeout(() => {
        fetchActiveRentals(retryCount + 1);
      }, 2000 * (retryCount + 1)); // 2s, 4s, 6s delays
    }
  }, [address, agentCount]);

  // Fetch rentals on connect
  useEffect(() => {
    if (isConnected && address) {
      fetchActiveRentals();
      // Fetch tickets
      setLoadingTickets(true);
      fetch(`/api/tickets?address=${address}`)
        .then(r => r.json())
        .then(data => setTickets(data.tickets || []))
        .catch(() => {})
        .finally(() => setLoadingTickets(false));
    }
  }, [isConnected, address, fetchActiveRentals]);

  // Auto-refresh when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isConnected && address) {
        fetchActiveRentals();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, address, fetchActiveRentals]);

  // Countdown timer + detect expiry for review
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const newCounters: Record<string, number> = {};
      activeRentals.forEach((r) => {
        const remaining = Math.max(0, r.endTime - now);
        newCounters[r.id] = remaining;
        
        // If just expired and not yet reviewed, show review modal + notification
        if (remaining === 0 && !reviewedRentals.has(r.id) && !showReviewModal) {
          setReviewRental(r);
          setShowReviewModal(true);
          addNotification({
            type: 'rental_expired',
            title: 'Rental Expired',
            message: `Your ${r.agentName} rental has expired. Thank you for using Ritty.ai! 🙏`,
          });
        }
      });
      setCounters(newCounters);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRentals, reviewedRentals, showReviewModal]);

  // Refresh rental data when tab becomes visible (fixes browser throttle causing expired display)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isConnected && address) {
        fetchActiveRentals();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isConnected, address, fetchActiveRentals]);

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
        {loadingRentals ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-[#40FFAF] border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 mt-4 text-sm">Loading your rentals...</p>
          </div>
        ) : activeRentals.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heavy text-white">Active Rentals</h2>
              <button
                onClick={() => fetchActiveRentals()}
                className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
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
                      <span className="text-xs font-mono text-gray-500">#{rental.agentId}</span>
                      <span className={`text-xs font-medium ${remaining > 3600 ? 'text-[#40FFAF]' : remaining > 600 ? 'text-orange-400' : 'text-red-400'}`}>
                        {remaining > 3600 ? `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m` : remaining > 600 ? `${Math.floor(remaining / 60)}m` : remaining > 0 ? `${remaining}s` : 'Expired'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 mb-8">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-gray-400 text-lg mb-2">No active rentals</p>
            <p className="text-gray-500 text-sm mb-6">Rent an agent from the marketplace to start chatting</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/agent-rent" className="text-sm px-6 py-2.5 rounded-xl text-black font-medium" style={{ background: '#40FFAF' }}>
                Browse Agents →
              </Link>
              <button
                onClick={() => fetchActiveRentals()}
                className="text-sm px-6 py-2.5 rounded-xl text-gray-400 hover:text-white transition border"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        {chatRental && (
          <div className="mb-8" style={{ height: '500px' }}>
            <ChatBox
              key={chatRental.id}
              agentId={chatRental.agentId}
              agentName={chatRental.agentName}
              agentCategory={chatRental.category}
              agentIcon={chatRental.icon}
              remainingTime={counters[chatRental.id] || 0}
              walletAddress={address}
              onExtend={() => {/* TODO: extend rental */}}
              onSwitch={() => setChatRental(null)}
            />
          </div>
        )}

        {/* Agent Tickets */}
        {tickets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-heavy text-white mb-4">🎫 Agent Requests</h2>
            <div className="space-y-3">
              {tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'rgba(17,17,17,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold" style={{ color: '#40FFAF', fontFamily: 'Space Grotesk' }}>#{ticket.id}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{ticket.agentType}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{ticket.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background: ticket.status === 'completed' ? 'rgba(64,255,175,0.15)' : ticket.status === 'in_progress' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                        color: ticket.status === 'completed' ? '#40FFAF' : ticket.status === 'in_progress' ? '#60a5fa' : '#fbbf24',
                        border: `1px solid ${ticket.status === 'completed' ? 'rgba(64,255,175,0.3)' : ticket.status === 'in_progress' ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)'}`,
                      }}
                    >
                      {ticket.status === 'completed' ? '✅ Ready' : ticket.status === 'in_progress' ? '🔨 Building' : '⏳ Waiting'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Rentals', value: activeRentals.length.toString() },
            { label: 'Total Spent', value: '—' },
            { label: 'Agents Used', value: new Set(activeRentals.map(r => r.category)).size.toString() },
            { label: 'Status', value: activeRentals.length > 0 ? 'Active' : 'Idle' },
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
          agentId={reviewRental.agentId.toString()}
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
