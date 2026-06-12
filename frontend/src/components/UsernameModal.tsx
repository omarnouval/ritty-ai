'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';

const PROFILE_ADDRESS = '0xA487bd6BEE21AaE0E1705FE5DDB256Ae6B384c03' as const;

const PROFILE_ABI = [
  {
    name: 'createProfile',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_username', type: 'string' },
      { name: '_bio', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'hasProfile',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'isUsernameAvailable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_username', type: 'string' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getUsername',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

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

  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Check if user already has profile
  const { data: hasProfile, isLoading: isCheckingProfile } = useReadContract({
    address: PROFILE_ADDRESS,
    abi: PROFILE_ABI,
    functionName: 'hasProfile',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // If already has profile, skip modal
  useEffect(() => {
    if (hasProfile === true) {
      onComplete('');
    }
  }, [hasProfile, onComplete]);

  // Show modal after profile check completes
  useEffect(() => {
    if (!isCheckingProfile && hasProfile === false) {
      // Profile doesn't exist, modal should be visible
    }
  }, [isCheckingProfile, hasProfile]);

  // Check username availability with debounce
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const check = async () => {
      setIsChecking(true);
      try {
        // Simple client-side check
        const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
        if (!isValid) {
          setError('Only letters, numbers, underscore (3-20 chars)');
          setIsAvailable(false);
        } else {
          setError('');
          setIsAvailable(true); // Optimistic — will verify on-chain
        }
      } catch {
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    const timeout = setTimeout(check, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleCreate = async () => {
    if (!username || !isAvailable || !address) return;

    try {
      setError('');
      const hash = await writeContractAsync({
        address: PROFILE_ADDRESS,
        abi: PROFILE_ABI,
        functionName: 'createProfile',
        args: [username, bio || 'Ritty.ai user'],
        type: 'legacy' as const,
      });
      setTxHash(hash);
    } catch (err: any) {
      if (err.message?.includes('Username taken')) {
        setError('Username already taken');
      } else {
        setError(err.message || 'Transaction failed');
      }
    }
  };

  // On success
  useEffect(() => {
    if (isSuccess) {
      // Save to localStorage
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
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="satoshi"
                maxLength={20}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#40FFAF]/40 transition placeholder-gray-600"
              />
              {isChecking && (
                <span className="absolute right-3 top-3 text-xs text-gray-500">Checking...</span>
              )}
              {!isChecking && isAvailable === true && username.length >= 3 && (
                <span className="absolute right-3 top-3 text-xs text-green-400">✓ Available</span>
              )}
              {!isChecking && isAvailable === false && username.length >= 3 && (
                <span className="absolute right-3 top-3 text-xs text-red-400">✗ Taken</span>
              )}
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Bio <span className="text-gray-600">(optional)</span></label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="AI agent enthusiast 🤖"
              maxLength={100}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#40FFAF]/40 transition placeholder-gray-600"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!username || !isAvailable || isPending || isConfirming}
          className="w-full mt-6 py-3 rounded-xl text-sm font-medium text-black disabled:opacity-40 transition-all"
          style={{ background: '#40FFAF' }}
        >
          {isPending ? 'Confirm in wallet...' : isConfirming ? 'Creating profile...' : 'Create Profile'}
        </button>

        {txHash && (
          <p className="text-xs text-center text-gray-500 mt-3">
            TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </p>
        )}

        <p className="text-xs text-center text-gray-600 mt-4">
          Stored on-chain on Ritual Testnet
        </p>
      </div>
    </div>
  );
}
