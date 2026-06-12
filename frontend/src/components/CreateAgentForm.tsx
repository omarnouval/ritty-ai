'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MARKETPLACE_ABI, MARKETPLACE_ADDRESS } from '@/lib/contracts';
import { parseEther } from 'viem';
import Link from 'next/link';

export function CreateAgentForm() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [form, setForm] = useState({
    name: '',
    description: '',
    agentContract: '',
    capabilities: '',
    pricePerHour: '',
    agentType: 0 as 0 | 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const caps = form.capabilities.split(',').map((c) => c.trim()).filter(Boolean);
      const hash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'listAgent',
        args: [
          form.agentContract as `0x${string}`,
          form.name,
          form.description,
          caps,
          parseEther(form.pricePerHour),
          form.agentType,
        ],
      });
      setTxHash(hash);
    } catch (err) {
      console.error('List failed:', err);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
        <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
          <div className="glass rounded-2xl p-10 text-center max-w-md">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-heavy text-white mb-2">Agent Listed!</h3>
            <p className="text-gray-400 text-sm mb-6">Your agent is now live on Agent Rent.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/agent-rent" className="text-sm font-medium text-white px-5 py-2.5 rounded-full" style={{ background: 'rgba(249,115,22,0.8)' }}>
                View Agent Rent
              </Link>
              <a href={`https://scan.ritual.net/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white px-5 py-2.5 rounded-full transition" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                RitualScan ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-orange-500/40 focus:bg-white/[0.06] transition placeholder-gray-600";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 w-full max-w-lg">
          <h2 className="text-2xl font-heavy text-white mb-1">List Your Agent</h2>
          <p className="text-sm text-gray-500 mb-8">Deploy an agent to Ritual Chain</p>

          <div className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Agent Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alpha Hunter Bot" className={inputStyle} required />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Monitors Twitter/Telegram for alpha signals…" className={`${inputStyle} h-24 resize-none`} required />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Agent Contract Address</label>
              <input type="text" value={form.agentContract} onChange={(e) => setForm({ ...form, agentContract: e.target.value })} placeholder="0x…" className={`${inputStyle} font-mono`} pattern="^0x[a-fA-F0-9]{40}$" required />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Capabilities</label>
              <input type="text" value={form.capabilities} onChange={(e) => setForm({ ...form, capabilities: e.target.value })} placeholder="research, trading, monitoring" className={inputStyle} required />
              <p className="text-xs text-gray-600 mt-1.5">Comma-separated</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Price (RITUAL/hr)</label>
              <input type="number" step="0.001" min="0.001" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} placeholder="0.01" className={inputStyle} required />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="w-full mt-8 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50"
            style={{ background: 'rgba(249,115,22,0.9)' }}
          >
            {isPending ? 'Confirm in wallet…' : isConfirming ? 'Listing…' : 'List Agent'}
          </button>
      </form>
    </div>
  );
}
