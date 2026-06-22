'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther } from 'viem';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { motion, useReducedMotion } from 'framer-motion';

const STAKING_ADDRESS = '0x2E3f82aE26a0EfE83B63bdabC905fFa3321223d0' as const;
const RENTAL_ADDRESS = '0x896277Ca55946c3602Bb6f5668d2eDdAb645A76c' as const;
const MARKETPLACE_ADDRESS = RENTAL_ADDRESS;

const STAKING_ABI = [
  { type: 'function', name: 'stake', stateMutability: 'payable', inputs: [{ name: '_agentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'unstake', stateMutability: 'nonpayable', inputs: [{ name: '_agentId', type: 'uint256' }, { name: '_amount', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'claimReward', stateMutability: 'nonpayable', inputs: [{ name: '_agentId', type: 'uint256' }], outputs: [] },
  { type: 'function', name: 'pendingReward', stateMutability: 'view', inputs: [{ name: '_agentId', type: 'uint256' }, { name: '_staker', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'getPoolInfo', stateMutability: 'view', inputs: [{ name: '_agentId', type: 'uint256' }], outputs: [{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }] },
  { type: 'function', name: 'stakers', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'address' }], outputs: [{ name: 'staked', type: 'uint256' }, { name: 'rewardPerTokenPaid', type: 'uint256' }, { name: 'rewards', type: 'uint256' }] },
  { type: 'function', name: 'getAllPools', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256[]' }] },
] as const;

const MARKETPLACE_ABI = [
  { type: 'function', name: 'agents', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ type: 'address' }, { type: 'string' }, { type: 'string' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'bool' }] },
] as const;

// Historical earnings data (from on-chain)
const AGENT_EARNINGS: Record<number, number> = {
  1: 0.315,  // Content Pro - 59 rentals
  2: 0.150,  // Research Alpha - 30 rentals
  3: 0.105,  // Code Assistant - 22 rentals
  4: 0.095,  // Marketing Guru - 20 rentals
  5: 0.085,  // Trading Signal - 18 rentals
  6: 0.085,  // HealthGuide - 18 rentals
};

const AGENT_RENTALS: Record<number, number> = {
  1: 59, 2: 30, 3: 22, 4: 20, 5: 18, 6: 18,
};

function AgentPoolCard({ agentId, address }: { agentId: number; address: `0x${string}` | undefined }) {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isExpanded, setIsExpanded] = useState(false);
  const reduce = useReducedMotion();

  const { data: agentData } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'agents',
    args: [BigInt(agentId)],
  });

  const { data: poolInfo } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getPoolInfo',
    args: [BigInt(agentId)],
  });

  const { data: stakerInfo } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'stakers',
    args: address ? [BigInt(agentId), address] : undefined,
    query: { enabled: !!address },
  });

  const { data: pendingReward } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'pendingReward',
    args: address ? [BigInt(agentId), address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContractAsync: writeStake, isPending: isStaking } = useWriteContract();
  const { writeContractAsync: writeUnstake, isPending: isUnstaking } = useWriteContract();
  const { writeContractAsync: writeClaim, isPending: isClaiming } = useWriteContract();
  const { isLoading: isTxPending } = useWaitForTransactionReceipt({ hash: txHash });

  const agentName = agentData?.[1] || `Agent ${agentId}`;
  const totalStaked = poolInfo?.[0] || BigInt(0);
  const userStaked = stakerInfo?.[0] || BigInt(0);
  const totalPending = pendingReward || BigInt(0);
  const earnings = AGENT_EARNINGS[agentId] || 0;
  const rentals = AGENT_RENTALS[agentId] || 0;

  const getDisplayAPY = () => {
    const stakedNum = Number(formatEther(totalStaked));
    if (stakedNum === 0) return '---';
    return ((earnings * 0.7 / stakedNum) * 100).toFixed(0);
  };

  const apy = getDisplayAPY();
  const isHighAPY = Number(apy) > 30;

  const handleStake = async () => {
    if (!stakeAmount || !address) return;
    try {
      const hash = await writeStake({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [BigInt(agentId)],
        value: parseEther(stakeAmount),
      });
      setTxHash(hash);
      setStakeAmount('');
    } catch (e) { console.error('Stake failed:', e); }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || !address) return;
    try {
      const hash = await writeUnstake({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'unstake',
        args: [BigInt(agentId), parseEther(unstakeAmount)],
      });
      setTxHash(hash);
      setUnstakeAmount('');
    } catch (e) { console.error('Unstake failed:', e); }
  };

  const handleClaim = async () => {
    if (!address) return;
    try {
      const hash = await writeClaim({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'claimReward',
        args: [BigInt(agentId)],
      });
      setTxHash(hash);
    } catch (e) { console.error('Claim failed:', e); }
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(64,255,175,0.04), transparent 70%)' }}
      />

      {/* Header */}
      <div className="relative p-5 pb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">{agentName}</h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{rentals} rentals</p>
          </div>
          <div className="text-right">
            <div
              className="text-2xl font-bold font-mono tracking-tight"
              style={{ color: isHighAPY ? '#40FFAF' : '#fff' }}
            >
              {apy === '---' ? (
                <span className="text-zinc-600">---</span>
              ) : (
                <>{apy}<span className="text-sm text-zinc-500">%</span></>
              )}
            </div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">APY</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex-1">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Pool</p>
            <p className="text-sm font-mono text-zinc-300">{Number(formatEther(totalStaked)).toFixed(2)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Your Stake</p>
            <p className="text-sm font-mono text-zinc-300">{Number(formatEther(userStaked)).toFixed(2)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Earned</p>
            <p className="text-sm font-mono" style={{ color: '#40FFAF' }}>
              {Number(formatEther(totalPending)).toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
      >
        <span>{isExpanded ? 'Close' : 'Manage'}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Tab switch */}
          <div className="flex rounded-lg overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {(['stake', 'unstake'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-1.5 text-xs font-medium transition cursor-pointer"
                style={{
                  background: activeTab === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#52525b',
                }}
              >
                {tab === 'stake' ? 'Stake' : 'Unstake'}
              </button>
            ))}
          </div>

          {/* Input + Action */}
          {activeTab === 'stake' ? (
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
              <button
                onClick={handleStake}
                disabled={!stakeAmount || !address || isStaking || isTxPending}
                className="px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-40"
                style={{ background: '#40FFAF', color: '#000' }}
              >
                {isStaking || isTxPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : 'Stake'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
              <button
                onClick={handleUnstake}
                disabled={!unstakeAmount || !address || isUnstaking || isTxPending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 transition cursor-pointer disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {isUnstaking || isTxPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : 'Unstake'}
              </button>
            </div>
          )}

          {/* Claim */}
          <button
            onClick={handleClaim}
            disabled={!address || totalPending === BigInt(0) || isClaiming || isTxPending}
            className="w-full py-2 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-20"
            style={{
              background: totalPending > BigInt(0) ? 'rgba(64,255,175,0.08)' : 'rgba(255,255,255,0.02)',
              color: totalPending > BigInt(0) ? '#40FFAF' : '#3f3f46',
              border: `1px solid ${totalPending > BigInt(0) ? 'rgba(64,255,175,0.15)' : 'rgba(255,255,255,0.04)'}`,
            }}
          >
            {isClaiming || isTxPending ? 'Claiming...' : `Claim ${Number(formatEther(totalPending)).toFixed(4)} RITUAL`}
          </button>

          {/* Tx link */}
          {txHash && (
            <a
              href={`https://explorer.ritualfoundation.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-[10px] text-center text-zinc-600 hover:text-[#40FFAF] transition font-mono"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)} ↗
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function StakingPage() {
  const { address, isConnected } = useAccount();
  const reduce = useReducedMotion();

  const { data: poolIds } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getAllPools',
  });

  return (
    <main className="min-h-screen relative" style={{ background: '#050505' }}>
      <Navbar activePage="staking" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* Page header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Stake on Agents
          </h1>
          <p className="text-sm text-zinc-500 max-w-md">
            Earn yield from real rental revenue. No inflation, no token printing.
          </p>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-6 md:gap-10 mb-10 pb-10"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { value: poolIds?.length?.toString() || '0', label: 'Pools' },
            { value: '70/20/10', label: 'Fee Split' },
            { value: 'None', label: 'Lock' },
            { value: '0.01', label: 'Min Stake' },
          ].map((stat, i) => (
            <div key={stat.label}>
              <p className="text-lg md:text-xl font-mono font-bold text-white">{stat.value}</p>
              <p className="text-[11px] text-zinc-600 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Content */}
        {!isConnected ? (
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <p className="text-zinc-500 text-sm mb-6">Connect wallet to start staking</p>
            <ConnectButton />
          </motion.div>
        ) : !poolIds || poolIds.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-zinc-600 text-sm">No pools available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {poolIds.map((id) => (
              <AgentPoolCard key={id.toString()} agentId={Number(id)} address={address} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
