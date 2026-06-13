'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Agent {
  id: number;
  owner: string;
  name: string;
  description: string;
  pricePerHour: string;
  totalEarnings: string;
  totalRentals: number;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  agentType: string;
}

interface UserProfile {
  address: string;
  username: string;
}

const AGENT_TYPE_LABELS: Record<number, string> = {
  0: 'Research',
  1: 'Trading',
  2: 'Marketing',
  3: 'Content',
  4: 'Coding',
  5: 'Other',
};

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'users' | 'feedback'>('overview');
  const [feedbackList, setFeedbackList] = useState<any[]>([]);

  // Check if already authenticated in this session
  useEffect(() => {
    if (sessionStorage.getItem('ritty_admin') === 'ok') {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchOnChainData();
      fetchFeedback();
    }
  }, [authenticated]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Password from env or default
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'ritty2026';
    if (password === adminPassword) {
      sessionStorage.setItem('ritty_admin', 'ok');
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Password gate
  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: '#0A0A0A', border: '1px solid rgba(64,255,175,0.2)' }}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>Admin Access</h2>
            <p className="text-xs text-gray-500 mt-1">Enter password to continue</p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none mb-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${passwordError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}` }}
            />
            {passwordError && (
              <p className="text-xs text-red-400 mb-3">Wrong password</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-bold text-black transition hover:opacity-80"
              style={{ background: '#40FFAF' }}
            >
              Enter
            </button>
          </form>
        </div>
      </main>
    );
  }

  const fetchOnChainData = async () => {
    try {
      setLoading(true);
      
      // Fetch agents from API
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
        setUsers(data.users || []);
      } else {
        // Fallback: direct RPC calls via client
        setError('API not available — using direct RPC');
        await fetchDirectFromRPC();
      }
    } catch (err) {
      setError('Failed to fetch data');
      await fetchDirectFromRPC();
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectFromRPC = async () => {
    try {
      const { createPublicClient, http } = await import('viem');
      
      const client = createPublicClient({
        chain: { id: 1979, name: 'Ritual', rpcUrls: { default: { http: ['https://rpc.ritualfoundation.org'] } } },
        transport: http('https://rpc.ritualfoundation.org'),
      });

      // Get agent count
      const agentCount = await client.readContract({
        address: '0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE',
        abi: [{ name: 'agentCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }],
        functionName: 'agentCount',
      });

      // Fetch all agents
      const agentList: Agent[] = [];
      const ownerAddresses = new Set<string>();

      for (let i = 0; i < Number(agentCount); i++) {
        try {
          const data = await client.readContract({
            address: '0xAFDBA0921A3D108DF0282Eed99a44AFDbdBAF9cE',
            abi: [{
              name: 'agents', type: 'function', stateMutability: 'view',
              inputs: [{ type: 'uint256' }],
              outputs: [
                { name: 'owner', type: 'address' },
                { name: 'agentContract', type: 'address' },
                { name: 'name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'pricePerHour', type: 'uint256' },
                { name: 'totalEarnings', type: 'uint256' },
                { name: 'totalRentals', type: 'uint256' },
                { name: 'rating', type: 'uint256' },
                { name: 'ratingCount', type: 'uint256' },
                { name: 'isActive', type: 'bool' },
                { name: 'agentType', type: 'uint8' },
              ],
            }],
            functionName: 'agents',
            args: [BigInt(i)],
          });

          const [owner, , name, description, pricePerHour, totalEarnings, totalRentals, rating, ratingCount, isActive, agentType] = data;
          
          agentList.push({
            id: i,
            owner,
            name,
            description,
            pricePerHour: (Number(pricePerHour) / 1e18).toFixed(6),
            totalEarnings: (Number(totalEarnings) / 1e18).toFixed(6),
            totalRentals: Number(totalRentals),
            rating: Number(rating),
            ratingCount: Number(ratingCount),
            isActive,
            agentType: AGENT_TYPE_LABELS[Number(agentType)] || 'Unknown',
          });

          ownerAddresses.add(owner.toLowerCase());
        } catch (e) {
          // Skip invalid agents
        }
      }

      // Fetch usernames for each owner
      const userList: UserProfile[] = [];
      for (const addr of ownerAddresses) {
        try {
          const username = await client.readContract({
            address: '0xA487bd6BEE21AaE0E1705FE5DDB256Ae6B384c03',
            abi: [{
              name: 'getUsername', type: 'function', stateMutability: 'view',
              inputs: [{ type: 'address' }],
              outputs: [{ type: 'string' }],
            }],
            functionName: 'getUsername',
            args: [addr as `0x${string}`],
          });
          
          if (username) {
            userList.push({ address: addr, username });
          }
        } catch (e) {
          // No profile
        }
      }

      setAgents(agentList);
      setUsers(userList);
    } catch (err) {
      setError('Failed to fetch from RPC');
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/admin/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedback || []);
      }
    } catch {
      // Feedback not available
    }
  };

  const totalRentals = agents.reduce((sum, a) => sum + a.totalRentals, 0);
  const totalEarnings = agents.reduce((sum, a) => sum + parseFloat(a.totalEarnings), 0);
  const activeAgents = agents.filter(a => a.isActive).length;
  const sortedByRentals = [...agents].sort((a, b) => b.totalRentals - a.totalRentals);

  const tabs = [
    { id: 'overview' as const, label: '📊 Overview', icon: '📊' },
    { id: 'agents' as const, label: '🤖 Agents', icon: '🤖' },
    { id: 'users' as const, label: '👥 Users', icon: '👥' },
    { id: 'feedback' as const, label: '💬 Feedback', icon: '💬' },
  ];

  return (
    <main className="min-h-screen" style={{ background: '#050505' }}>
      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4" style={{ borderBottom: '1px solid #161616' }}>
        <Link href="/" className="flex items-center gap-2">
          <img src="/ritty-logo.png" alt="Ritty.ai" className="h-8 w-auto" />
          <span className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ritty.ai</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            🔒 Admin
          </span>
          <Link href="/agent-rent" className="text-sm text-gray-400 hover:text-white transition">Marketplace</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Ritty.ai on-chain analytics & management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap"
              style={{
                background: activeTab === tab.id ? '#40FFAF' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#000' : '#9ca3af',
                border: `1px solid ${activeTab === tab.id ? '#40FFAF' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[#40FFAF] border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 mt-4">Loading on-chain data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: users.length, icon: '👥', color: '#40FFAF' },
                    { label: 'Active Agents', value: activeAgents, icon: '🤖', color: '#3b82f6' },
                    { label: 'Total Rentals', value: totalRentals, icon: '📈', color: '#f59e0b' },
                    { label: 'Total Revenue', value: `${totalEarnings.toFixed(4)} RITUAL`, icon: '💰', color: '#10b981' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl p-5"
                      style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold" style={{ color: stat.color, fontFamily: 'Space Grotesk' }}>{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Top Agents */}
                <div className="rounded-2xl p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-lg font-bold text-white mb-4">🏆 Most Rented Agents</h3>
                  <div className="space-y-3">
                    {sortedByRentals.slice(0, 5).map((agent, i) => (
                      <div key={agent.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold" style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7f32' : '#4b5563' }}>
                            #{i + 1}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-white">{agent.name}</div>
                            <div className="text-xs text-gray-500">{agent.agentType} · {agent.owner.slice(0, 6)}...{agent.owner.slice(-4)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold" style={{ color: '#40FFAF' }}>{agent.totalRentals} rentals</div>
                          <div className="text-xs text-gray-500">{agent.totalEarnings} RITUAL</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div className="rounded-2xl p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 className="text-lg font-bold text-white mb-4">👥 Registered Users</h3>
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-sm">No users registered yet</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {users.map((user) => (
                        <div key={user.address} className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(64,255,175,0.15)', color: '#40FFAF' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{user.username}</div>
                            <div className="text-xs text-gray-600">{user.address.slice(0, 6)}...</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Agents Tab */}
            {activeTab === 'agents' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">ID</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Type</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Price/h</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Rentals</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Earnings</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Rating</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <tr key={agent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-4 text-sm text-gray-400 font-mono">#{agent.id}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-white">{agent.name}</div>
                            <div className="text-xs text-gray-600">{agent.owner.slice(0, 8)}...</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(64,255,175,0.1)', color: '#40FFAF' }}>
                              {agent.agentType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">{agent.pricePerHour} RITUAL</td>
                          <td className="py-3 px-4 text-sm font-bold" style={{ color: '#40FFAF' }}>{agent.totalRentals}</td>
                          <td className="py-3 px-4 text-sm text-gray-300">{agent.totalEarnings} RITUAL</td>
                          <td className="py-3 px-4 text-sm text-gray-400">
                            {agent.ratingCount > 0 ? `⭐ ${(agent.rating / agent.ratingCount).toFixed(1)} (${agent.ratingCount})` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-lg ${agent.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {agent.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="rounded-2xl p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">All Registered Users</h3>
                    <span className="text-sm text-gray-500">{users.length} total</span>
                  </div>
                  {users.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">👤</div>
                      <p className="text-gray-500">No users registered yet</p>
                      <p className="text-xs text-gray-600 mt-1">Users appear here after creating a profile on-chain</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((user, i) => (
                        <div key={user.address} className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 font-mono w-8">{i + 1}.</span>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(64,255,175,0.15)', color: '#40FFAF' }}>
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{user.username}</div>
                              <div className="text-xs text-gray-600 font-mono">{user.address}</div>
                            </div>
                          </div>
                          <a
                            href={`https://ritualscan.com/address/${user.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-[#40FFAF] transition"
                          >
                            View on Explorer →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="rounded-2xl p-6" style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-lg font-bold text-white mb-4">💬 Feedback & Requests</h3>
                {feedbackList.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-500">No feedback yet</p>
                    <p className="text-xs text-gray-600 mt-1">Feedback submissions appear here and are sent to Telegram</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedbackList.map((fb, i) => (
                      <div key={i} className="py-3 px-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: fb.category === 'request' ? 'rgba(64,255,175,0.1)' : 'rgba(59,130,246,0.1)', color: fb.category === 'request' ? '#40FFAF' : '#3b82f6' }}>
                            {fb.category === 'request' ? '🛠️ Request' : '💬 Feedback'}
                          </span>
                          <span className="text-xs text-gray-600">{fb.name || 'Anonymous'}</span>
                        </div>
                        <p className="text-sm text-gray-300">{fb.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
