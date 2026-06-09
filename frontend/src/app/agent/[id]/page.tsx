'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts';
import { parseEther, formatEther } from 'viem';

const DURATIONS = [
  { label: '1 jam', hours: 1 },
  { label: '8 jam', hours: 8 },
  { label: '24 jam', hours: 24 },
  { label: '1 minggu', hours: 168 },
];

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params?.id ? BigInt(params.id as string) : BigInt(0);
  const { address, isConnected } = useAccount();

  const [selectedHours, setSelectedHours] = useState(1);
  const [customHours, setCustomHours] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  // Fetch agent data
  const { data: agent, isLoading } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'agents',
    args: [agentId],
  });

  // Calculate rental cost
  const { data: rentalCost } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'calculateRentalCost',
    args: [agentId, BigInt(useCustom ? (parseInt(customHours) || 1) : selectedHours)],
  });

  // Rent agent
  const { data: rentHash, writeContract: rentAgent, isPending: isRenting } = useWriteContract();
  const { isLoading: isRentConfirming, isSuccess: isRentSuccess } = useWaitForTransactionReceipt({
    hash: rentHash,
  });

  const handleRent = () => {
    const hours = useCustom ? parseInt(customHours) || 1 : selectedHours;
    if (!rentalCost) return;
    rentAgent({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'rentAgent',
      args: [agentId, BigInt(hours)],
      value: rentalCost,
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
        <Nav />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="text-gray-500 text-lg">Loading agent...</div>
        </div>
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
        <Nav />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-400 text-lg">Agent not found</p>
          <Link href="/marketplace" className="text-orange-400 text-sm mt-4 inline-block hover:underline">
            ← Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  const [owner, agentContract, name, description, pricePerHour, totalEarnings, totalRentals, rating, ratingCount, isActive, agentType] = agent;
  const pricePerHourEth = formatEther(pricePerHour);
  const costEth = rentalCost ? formatEther(rentalCost) : '0';
  const avgRating = ratingCount > 0 ? Number(rating) / Number(ratingCount) : 0;
  const agentTypes = ['Persistent', 'Sovereign'];

  return (
    <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
      <Nav />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link href="/marketplace" className="text-gray-500 text-sm hover:text-white transition mb-6 inline-block">
          ← Back to Marketplace
        </Link>

        {/* Agent Header */}
        <div className="glass rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-heavy text-white">{name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Type: {agentTypes[Number(agentType)] || 'Unknown'}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-heavy text-white">{pricePerHourEth} <span className="text-sm text-gray-500">RITUAL/hr</span></div>
              <div className="flex items-center gap-1 justify-end mt-1">
                <span className="text-yellow-400">★</span>
                <span className="text-white text-sm">{avgRating.toFixed(1)}</span>
                <span className="text-gray-600 text-xs">({Number(ratingCount)} reviews)</span>
              </div>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">{description}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-gray-500 text-xs mb-1">Total Rentals</div>
              <div className="text-white text-xl font-heavy">{Number(totalRentals)}</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-gray-500 text-xs mb-1">Total Earnings</div>
              <div className="text-white text-xl font-heavy">{formatEther(totalEarnings)} <span className="text-xs text-gray-500">RITUAL</span></div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-gray-500 text-xs mb-1">Contract</div>
              <div className="text-white text-xs font-mono truncate">{agentContract}</div>
            </div>
          </div>
        </div>

        {/* Rental Section */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-heavy text-white mb-6">Rent this Agent</h2>

          {/* Duration Presets */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.hours}
                  onClick={() => { setSelectedHours(d.hours); setUseCustom(false); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${!useCustom && selectedHours === d.hours
                    ? 'text-black'
                    : 'text-gray-400 hover:text-white'
                    }`}
                  style={{
                    background: !useCustom && selectedHours === d.hours ? '#40FFAF' : 'rgba(255,255,255,0.05)',
                    border: '1px solid ' + (!useCustom && selectedHours === d.hours ? '#40FFAF' : 'rgba(255,255,255,0.08)')
                  }}
                >
                  {d.label}
                </button>
              ))}
              <button
                onClick={() => setUseCustom(true)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${useCustom ? 'text-black' : 'text-gray-400 hover:text-white'
                  }`}
                style={{
                  background: useCustom ? '#40FFAF' : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (useCustom ? '#40FFAF' : 'rgba(255,255,255,0.08)')
                }}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom Duration Input */}
          {useCustom && (
            <div className="mb-4">
              <input
                type="number"
                min="1"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="Enter hours..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          )}

          {/* Cost Summary */}
          <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(64,255,175,0.05)', border: '1px solid rgba(64,255,175,0.15)' }}>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total Cost</span>
              <span className="text-white text-xl font-heavy">{costEth} <span className="text-sm text-gray-500">RITUAL</span></span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-500 text-xs">Duration</span>
              <span className="text-gray-400 text-xs">{useCustom ? (customHours || '1') : selectedHours} hour(s)</span>
            </div>
          </div>

          {/* Rent Button */}
          {!isConnected ? (
            <ConnectButton />
          ) : isRentSuccess ? (
            <div className="text-center">
              <div className="text-green-400 text-lg font-heavy mb-2">✅ Rental Successful!</div>
              <p className="text-gray-500 text-sm">Your agent is now active. Check your dashboard.</p>
              <Link href="/dashboard" className="text-orange-400 text-sm mt-2 inline-block hover:underline">
                Go to Dashboard →
              </Link>
            </div>
          ) : (
            <button
              onClick={handleRent}
              disabled={isRenting || isRentConfirming || !isActive || (useCustom && (!customHours || parseInt(customHours) < 1))}
              className="w-full py-3 rounded-xl text-sm font-heavy text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#40FFAF' }}
            >
              {isRenting ? 'Confirm in wallet...' : isRentConfirming ? 'Processing...' : `Rent for ${costEth} RITUAL`}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
        }
      `}</style>
    </main>
  );
}

function Nav() {
  return (
    <nav className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <Link href="/" className="flex items-center gap-2.5">
        <img src="/ritty-logo.png" alt="Ritty.ai" className="h-8 w-auto" />
        <span className="text-lg font-heavy text-white">Ritty.ai</span>
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white transition">Marketplace</Link>
        <Link href="/create" className="text-sm text-gray-400 hover:text-white transition">Create</Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</Link>
        <ConnectButton />
      </div>
    </nav>
  );
}
