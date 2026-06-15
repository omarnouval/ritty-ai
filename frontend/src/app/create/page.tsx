'use client';

import { CreateAgentForm } from '@/components/CreateAgentForm';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileMenu from '@/components/MobileMenu';

export default function CreatePage() {
  return (
    <main className="min-h-screen" style={{ background: 'rgb(8, 9, 23)' }}>
      <nav className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/ritty-logo.png" alt="Ritty.ai" className="h-7 md:h-8 w-auto" />
          <span className="text-base md:text-lg font-heavy text-white">Ritty.ai</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <ConnectButton />
          <LanguageSwitcher />
          <MobileMenu />
        </div>
      </nav>
      <div className="px-4 py-8">
        <CreateAgentForm />
      </div>
    </main>
  );
}
