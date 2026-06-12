'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/lib/contracts';
import { formatEther } from 'viem';
import { useState } from 'react';

export function AgentDashboard() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const { data: agentIds } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'getUserAgents',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const handleWithdraw = async () => {
    try {
      const hash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'withdrawEarnings',
        type: 'legacy' as const,
        gasPrice: BigInt(1000000000), // 1 gwei - force legacy tx
      });
      setTxHash(hash);
    } catch (err) {
      console.error('Withdraw failed:', err);
    }
  };

  if (!address) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Connect wallet to view your agents</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">My Agents</h1>
        <button
          onClick={handleWithdraw}
          disabled={isPending || isConfirming}
          className="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          {isPending ? 'Confirming...' : 'Withdraw Earnings'}
        </button>
      </div>

      {!agentIds || agentIds.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-lg mb-4">You haven&apos;t listed any agents yet</p>
          <a href="/create" className="text-orange-400 hover:text-orange-300">
            List your first agent →
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {agentIds.map((id) => (
            <AgentRow key={id.toString()} agentId={id} />
          ))}
        </div>
      )}

      {txHash && (
        <div className="mt-4 text-center">
          <a
            href={`https://scan.ritual.net/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-400 hover:text-orange-300"
          >
            View transaction ↗
          </a>
        </div>
      )}
    </div>
  );
}

function AgentRow({ agentId }: { agentId: bigint }) {
  const { data } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: 'agents',
    args: [agentId],
  });

  if (!data) return null;

  const [owner, agentContract, name, description, pricePerHour, totalEarnings, totalRentals, rating, ratingCount, isActive, agentType] = data;
  const avgRating = ratingCount > BigInt(0) ? Number(rating) / 100 : 0;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-white font-bold">{name}</h3>
          <span className="px-2 py-0.5 rounded text-xs bg-green-900/30 text-green-400">
            AI Agent
          </span>
          {!isActive && (
            <span className="px-2 py-0.5 rounded text-xs bg-red-900 text-red-300">Inactive</span>
          )}
        </div>
        <p className="text-gray-500 text-sm font-mono">{agentContract}</p>
      </div>
      <div className="text-right">
        <div className="text-green-400 font-mono">{formatEther(totalEarnings)} RITUAL earned</div>
        <div className="text-gray-400 text-sm">
          {totalRentals.toString()} rentals · {'★'.repeat(Math.round(avgRating))} ({ratingCount.toString()})
        </div>
      </div>
    </div>
  );
}
