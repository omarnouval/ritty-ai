'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileMenu from '@/components/MobileMenu';
import { useTranslations } from '@/lib/i18n/LanguageContext';

interface NavbarProps {
  activePage?: 'home' | 'agent-rent' | 'how-it-works' | 'feedback' | 'dashboard' | 'staking' | 'docs';
  showConnect?: boolean;
}

export default function Navbar({ activePage, showConnect = true }: NavbarProps) {
  const { isConnected } = useAccount();
  const { t } = useTranslations();

  const links = [
    { id: 'agent-rent', href: '/agent-rent', label: t('buttons.marketplace') || 'Agent Rent' },
    { id: 'staking', href: '/staking', label: 'Staking' },
    { id: 'how-it-works', href: '/how-it-works', label: t('nav.howItWorks') || 'How It Works' },
    { id: 'feedback', href: '/feedback', label: 'Feedback' },
    { id: 'dashboard', href: '/dashboard', label: t('nav.dashboard') || 'Dashboard', authOnly: true },
  ];

  return (
    <nav
      className="relative z-10 flex justify-between items-center px-4 md:px-6 lg:px-12 py-3 md:py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <img src="/ritty-logo.png" alt="Ritty.ai" className="h-7 md:h-10 w-auto" />
        <span
          className="text-base md:text-xl font-bold tracking-tight"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Ritty.ai
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => {
          if (link.authOnly && !isConnected) return null;
          const isActive = activePage === link.id;
          return (
            <Link
              key={link.id}
              href={link.href}
              className="text-sm transition-colors"
              style={{
                color: isActive ? '#40FFAF' : '#FFFFFF',
                opacity: isActive ? 1 : 0.7,
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {showConnect && <ConnectButton />}
        <LanguageSwitcher />
        <MobileMenu />
      </div>
    </nav>
  );
}
