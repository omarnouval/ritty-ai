'use client';

import { CreateAgentForm } from '@/components/CreateAgentForm';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function CreatePage() {
  return (
    <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
      <nav className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/ritty-logo.jpg" alt="Ritty.ai" className="h-8 w-auto" />
          <span className="text-lg font-heavy text-white">Ritty.ai</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/marketplace" className="text-sm text-gray-400 hover:text-white transition">Marketplace</Link>
          <Link href="/create" className="text-sm text-orange-400 font-medium">Create</Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</Link>
          <ConnectButton />
        </div>
      </nav>
      <div className="px-4 py-8">
        <CreateAgentForm />
      </div>
    </main>
  );
}
