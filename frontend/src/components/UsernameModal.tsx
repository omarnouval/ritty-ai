'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { PROFILE_ADDRESS, PROFILE_ABI } from '@/lib/profile';
import { sendDirectTx } from '@/lib/directTx';

interface UsernameModalProps {
  onComplete: (username: string) => void;
}

export function UsernameModal({ onComplete }: UsernameModalProps) {
  const { address, isConnected } = useAccount();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: hasProfile, isLoading: isCheckingProfile } = useReadContract({
    address: PROFILE_ADDRESS,
    abi: PROFILE_ABI,
    functionName: 'hasProfile',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (hasProfile === true) onComplete('');
  }, [hasProfile, onComplete]);

  useEffect(() => {
    if (username.length < 3) { setIsAvailable(null); return; }
    const check = async () => {
      setIsChecking(true);
      try {
        const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
        if (!isValid) { setError('Only letters, numbers, underscore (3-20 chars)'); setIsAvailable(false); }
        else { setError(''); setIsAvailable(true); }
      } catch { setIsAvailable(false); }
      finally { setIsChecking(false); }
    };
    const timeout = setTimeout(check, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleCreate = async () => {
    if (!username || !isAvailable || !address) return;
    try {
      setError('');
      setIsPending(true);
      const hash = await sendDirectTx({
        to: PROFILE_ADDRESS,
        abi: PROFILE_ABI as any,
        functionName: 'createProfile',
        args: [username, bio || 'Ritty.ai user'],
      });
      
      setIsPending(false);
      setIsConfirming(true);
      
      // Wait for receipt to confirm TX actually succeeded
      const provider = (window as any).ethereum;
      let receipt = null;
      let attempts = 0;
      while (!receipt && attempts < 30) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          });
        } catch {
          // retry
        }
        attempts++;
      }
      
      setIsConfirming(false);
      
      if (!receipt) {
        throw new Error('Transaction timeout - please check your wallet');
      }
      
      if (receipt.status === '0x0' || receipt.status === '0') {
        throw new Error('Transaction failed on-chain. Please try again.');
      }
      
      // TX confirmed successful
      setIsSuccess(true);
    } catch (err: any) {
      if (err.message?.includes('Username taken')) setError('Username already taken');
      else setError(err.message || 'Transaction failed');
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      localStorage.setItem(`ritty_username_${address}`, username);
      onComplete(username);
    }
  }, [isSuccess, username, address, onComplete]);

  if (!isConnected || hasProfile === true) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md mx-4 rounded-2xl p-8" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(64,255,175,0.1)' }}>
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-2xl font-heavy text-white mb-2">Welcome to Ritty.ai</h2>
          <p className="text-sm text-gray-400">Create your on-chain profile to get started</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Username</label>
            <div className="relative">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="satoshi" maxLength={20} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#40FFAF]/40 transition placeholder-gray-600" />
              {isChecking && <span className="absolute right-3 top-3 text-xs text-gray-500">Checking...</span>}
              {!isChecking && isAvailable === true && username.length >= 3 && <span className="absolute right-3 top-3 text-xs text-green-400">✓ Available</span>}
              {!isChecking && isAvailable === false && username.length >= 3 && <span className="absolute right-3 top-3 text-xs text-red-400">✗ Taken</span>}
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Bio <span className="text-gray-600">(optional)</span></label>
            <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="AI agent enthusiast 🤖" maxLength={100} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#40FFAF]/40 transition placeholder-gray-600" />
          </div>
        </div>
        <button onClick={handleCreate} disabled={!username || !isAvailable || isPending || isConfirming} className="w-full mt-6 py-3 rounded-xl text-sm font-medium text-black disabled:opacity-40 transition-all" style={{ background: '#40FFAF' }}>
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Creating profile...' : 'Create Profile'}
        </button>
        <p className="text-xs text-center text-gray-600 mt-4">Stored on-chain on Ritual Testnet</p>
      </div>
    </div>
  );
}
