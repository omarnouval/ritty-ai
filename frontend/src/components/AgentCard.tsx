'use client';

import Link from 'next/link';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/lib/contracts';
import { PROFILE_ADDRESS, PROFILE_ABI } from '@/lib/profile';
import { sendDirectTx } from '@/lib/directTx';
import { formatEther } from 'viem';
import { useState, useCallback } from 'react';
import { useTranslations } from '@/lib/i18n/LanguageContext';
import { UsernameModal } from '@/components/UsernameModal';

interface Agent {
  id: bigint;
  owner: `0x${string}`;
  agentContract: `0x${string}`;
  name: string;
  description: string;
  pricePerHour: bigint;
  totalRentals: bigint;
  rating: bigint;
  ratingCount: bigint;
  isActive: boolean;
  agentType: number;
}

const CAP_COLORS: Record<string, string> = {
  research: 'cyan', trading: 'green', monitoring: 'blue',
  'code-review': 'purple', 'content-generation': 'pink', chat: 'orange',
  analysis: 'cyan',
};

export function AgentCard({ agent, viewMode = 'grid' }: { agent: Agent; viewMode?: 'grid' | 'list' | 'compact' }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslations();
  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });
  const [hours, setHours] = useState(1);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isRenting, setIsRenting] = useState(false);

  const { data: hasProfile } = useReadContract({
    address: PROFILE_ADDRESS,
    abi: PROFILE_ABI,
    functionName: 'hasProfile',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const doRent = async () => {
    try {
      setIsRenting(true);
      const hash = await sendDirectTx({
        to: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI as any,
        functionName: 'rentAgent',
        args: [agent.id, BigInt(hours)],
        value: agent.pricePerHour * BigInt(hours),
      });
      setTxHash(hash);
    } catch (err) {
      console.error('Rent failed:', err);
    } finally {
      setIsRenting(false);
    }
  };

  const handleUsernameComplete = useCallback((username: string) => {
    setShowUsernameModal(false);
    doRent();
  }, [agent.id, hours]);

  const handleRent = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (hasProfile === false) {
      setShowUsernameModal(true);
      return;
    }
    await doRent();
  };

  const rating = agent.ratingCount > BigInt(0) ? Number(agent.rating) / 100 : 0;
  const typeLabel = t('agent.aiAgent');
  const typeColor = 'green';
  const caps = ['research', 'monitoring'];

  if (viewMode === 'compact') {
    return (
      <>
        {showUsernameModal && <UsernameModal onComplete={handleUsernameComplete} />}
        <div className="glass rounded-xl px-4 py-3 flex items-center justify-between hover:bg-white/[0.06] transition">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `rgba(${agent.agentType === 0 ? '59,130,246' : '168,85,247'},0.15)` }}>
              {agent.agentType === 0 ? '⚡' : '🔄'}
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-white truncate block">{agent.name}</span>
              <span className="text-xs text-gray-500 truncate block">{agent.description}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-4">
            <span className="text-xs text-gray-400">{'★'.repeat(Math.round(rating))} ({agent.ratingCount.toString()})</span>
            <span className="text-xs font-mono text-green-400">{formatEther(agent.pricePerHour)}/hr</span>
            <button onClick={handleRent} disabled={isPending} className="text-xs text-[#40FFAF] hover:text-[#2EF19C] font-medium cursor-pointer">
              {isConnected ? t('agent.rent') : t('agent.connectToRent')}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (viewMode === 'list') {
    return (
      <>
        {showUsernameModal && <UsernameModal onComplete={handleUsernameComplete} />}
        <div className="glass rounded-xl p-4 flex items-center gap-6 hover:bg-white/[0.06] transition">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `rgba(${agent.agentType === 0 ? '59,130,246' : '168,85,247'},0.12)` }}>
            {agent.agentType === 0 ? '⚡' : '🔄'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-heavy text-white text-sm">{agent.name}</h3>
              <span className={`pill pill-${typeColor}`}>{typeLabel}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">{agent.description}</p>
            <div className="flex gap-1.5 mt-2">
              {caps.map((cap) => (
                <span key={cap} className={`pill pill-${CAP_COLORS[cap] || 'orange'}`}>{cap}</span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-mono text-green-400 font-medium">{formatEther(agent.pricePerHour)} RITUAL/hr</div>
            <div className="text-xs text-gray-500 mt-1">{'★'.repeat(Math.round(rating))} · {agent.totalRentals.toString()} {t('agent.rentals')}</div>
          </div>
          <button
            onClick={handleRent}
            disabled={isPending || isConfirming}
            className="shrink-0 text-sm font-medium text-black px-5 py-2 rounded-full transition-all cursor-pointer"
            style={{ background: '#40FFAF' }}
          >
            {isPending ? '…' : isConnected ? t('agent.rent') : t('agent.connect')}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {showUsernameModal && <UsernameModal onComplete={handleUsernameComplete} />}
      <Link href={`/agent/${agent.id.toString()}`}>
        <div className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition group cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `rgba(${agent.agentType === 0 ? '59,130,246' : '168,85,247'},0.12)` }}>
              {agent.agentType === 0 ? '⚡' : '🔄'}
            </div>
            <div>
              <h3 className="font-heavy text-white text-sm">{agent.name}</h3>
              <span className={`pill pill-${typeColor} mt-0.5`}>{typeLabel}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">{agent.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {caps.map((cap) => (
            <span key={cap} className={`pill pill-${CAP_COLORS[cap] || 'orange'}`}>{cap}</span>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
          <span className="text-yellow-400">{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
          <span>({agent.ratingCount.toString()})</span>
          <span>·</span>
          <span>{agent.totalRentals.toString()} {t('agent.rentals')}</span>
        </div>

        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              onClick={(e) => e.preventDefault()}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-300 outline-none"
            >
              {[1, 3, 6, 12, 24].map((h) => (
                <option key={h} value={h}>{h}h</option>
              ))}
            </select>
            <span className="text-sm font-mono text-green-400 font-medium">
              {formatEther(agent.pricePerHour * BigInt(hours))} RITUAL
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleRent();
            }}
            disabled={isPending || isConfirming}
            className="text-xs font-medium text-black px-4 py-2 rounded-full transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            style={{ background: '#40FFAF' }}
          >
            {isPending ? t('agent.confirming') : isConfirming ? t('agent.processing') : isConnected ? t('agent.rent') : t('agent.connect')}
          </button>
        </div>

        {txHash && (
          <a
            href={`https://scan.ritual.net/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-xs text-[#40FFAF]/70 hover:text-[#40FFAF] text-center"
          >
            View on RitualScan ↗
          </a>
        )}
        </div>
      </Link>
    </>
  );
}
