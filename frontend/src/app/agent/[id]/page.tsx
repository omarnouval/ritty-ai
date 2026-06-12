'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts';
import { PROFILE_ADDRESS, PROFILE_ABI } from '@/lib/profile';
import { formatEther } from 'viem';
import { useTranslations } from '@/lib/i18n/LanguageContext';
import { UsernameModal } from '@/components/UsernameModal';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params?.id ? BigInt(params.id as string) : BigInt(0);
  const { address, isConnected } = useAccount();
  const { t } = useTranslations();

  const DURATIONS = [
    { label: t('agent.duration1h'), hours: 1 },
    { label: t('agent.duration8h'), hours: 8 },
    { label: t('agent.duration24h'), hours: 24 },
    { label: t('agent.duration1w'), hours: 168 },
  ];

  const [selectedHours, setSelectedHours] = useState(1);
  const [customHours, setCustomHours] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

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

  // Check if user has profile on-chain
  const { data: hasProfile } = useReadContract({
    address: PROFILE_ADDRESS,
    abi: PROFILE_ABI,
    functionName: 'hasProfile',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Rent agent
  const { data: rentHash, writeContract: rentAgent, isPending: isRenting } = useWriteContract();
  const { isLoading: isRentConfirming, isSuccess: isRentSuccess } = useWaitForTransactionReceipt({
    hash: rentHash,
  });

  const doRent = () => {
    const hours = useCustom ? parseInt(customHours) || 1 : selectedHours;
    if (!rentalCost) return;
    rentAgent({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'rentAgent',
      args: [agentId, BigInt(hours)],
      value: rentalCost,
      type: 'legacy' as const,
      gasPrice: BigInt(1000000000),
    });
  };

  const handleRent = () => {
    // Check if user has profile first
    if (hasProfile === false) {
      setShowUsernameModal(true);
      return;
    }
    doRent();
  };

  // After username created, auto-rent
  const handleUsernameComplete = useCallback((username: string) => {
    setShowUsernameModal(false);
    doRent();
  }, [rentalCost, selectedHours, customHours, useCustom]);

  if (isLoading) {
    return (
      <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
        <Nav />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="text-gray-500 text-lg">{t('agent.loading')}</div>
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
          <p className="text-gray-400 text-lg">{t('agent.notFound')}</p>
          <Link href="/agent-rent" className="text-orange-400 text-sm mt-4 inline-block hover:underline">
            {t('agent.backToRent')}
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
      {showUsernameModal && <UsernameModal onComplete={handleUsernameComplete} />}
      <Nav />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Back link */}
        <Link href="/agent-rent" className="text-gray-500 text-sm hover:text-white transition mb-6 inline-block">
          {t('agent.backToRent')}
        </Link>

        {/* Agent Header */}
        <div className="glass rounded-2xl p-4 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-heavy text-white">{name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {isActive ? t('agent.active') : t('agent.inactive')}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{t('agent.aiAgent')}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-heavy text-white">{pricePerHourEth} <span className="text-sm text-gray-500">RITUAL/hr</span></div>
              <div className="flex items-center gap-1 justify-end mt-1">
                <span className="text-yellow-400">★</span>
                <span className="text-white text-sm">{avgRating.toFixed(1)}</span>
                <span className="text-gray-600 text-xs">({Number(ratingCount)} {t('agent.reviews')})</span>
              </div>
            </div>
          </div>

          <p className="text-gray-300 leading-relaxed mb-6">{description}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-gray-500 text-xs mb-1">{t('agent.totalRentals')}</div>
              <div className="text-white text-xl font-heavy">{Number(totalRentals)}</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-gray-500 text-xs mb-1">{t('agent.totalEarnings')}</div>
              <div className="text-white text-xl font-heavy">{formatEther(totalEarnings)} <span className="text-xs text-gray-500">RITUAL</span></div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-gray-500 text-xs mb-1">{t('agent.contract')}</div>
              <div className="text-white text-xs font-mono truncate">{agentContract}</div>
            </div>
          </div>
        </div>

        {/* Rental Section */}
        <div className="glass rounded-2xl p-4 md:p-8">
          <h2 className="text-xl font-heavy text-white mb-6">{t('agent.rentTitle')}</h2>

          {/* Duration Presets */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-2 block">{t('agent.duration')}</label>
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
                {t('agent.custom')}
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
                placeholder={t('agent.enterHours')}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          )}

          {/* Cost Summary */}
          <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(64,255,175,0.05)', border: '1px solid rgba(64,255,175,0.15)' }}>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{t('agent.totalCost')}</span>
              <span className="text-white text-xl font-heavy">{costEth} <span className="text-sm text-gray-500">RITUAL</span></span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-500 text-xs">{t('agent.duration')}</span>
              <span className="text-gray-400 text-xs">{useCustom ? (customHours || '1') : selectedHours} {t('agent.hour')}</span>
            </div>
          </div>

          {/* Rent Button */}
          {!isConnected ? (
            <div>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="w-full py-3 rounded-xl text-sm font-heavy text-black transition"
                    style={{ background: '#40FFAF' }}
                  >
                    {t('agent.connectWallet') || 'Connect Wallet'}
                  </button>
                )}
              </ConnectButton.Custom>
              <p className="text-gray-500 text-xs text-center mt-3">
                📱 Mobile? Open in MetaMask / Trust Wallet browser
              </p>
            </div>
          ) : isRentSuccess ? (
            <div className="text-center">
              <div className="text-green-400 text-lg font-heavy mb-2">✅ {t('agent.rentalSuccess')}</div>
              <p className="text-gray-500 text-sm">{t('agent.rentalSuccessDesc')}</p>
              <Link href="/dashboard" className="text-orange-400 text-sm mt-2 inline-block hover:underline">
                {t('agent.goToDashboard')}
              </Link>
            </div>
          ) : (
            <button
              onClick={handleRent}
              disabled={isRenting || isRentConfirming || !isActive || (useCustom && (!customHours || parseInt(customHours) < 1))}
              className="w-full py-3 rounded-xl text-sm font-heavy text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#40FFAF' }}
            >
              {isRenting ? t('agent.confirmWallet') : isRentConfirming ? t('agent.processing') : `${t('agent.rentFor')} ${costEth} RITUAL`}
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
  const { t } = useTranslations();
  return (
    <nav className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <img src="/ritty-logo.png" alt="Ritty.ai" className="h-7 md:h-8 w-auto" />
        <span className="text-base md:text-lg font-heavy text-white">Ritty.ai</span>
      </Link>
      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        <Link href="/agent-rent" className="hidden md:block text-sm text-gray-400 hover:text-white transition">{t('buttons.marketplace')}</Link>
        <ConnectButton />
        <LanguageSwitcher />
      </div>
    </nav>
  );
}
