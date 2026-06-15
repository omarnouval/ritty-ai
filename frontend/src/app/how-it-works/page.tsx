'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MobileMenu from '@/components/MobileMenu';
import { useTranslations } from '@/lib/i18n/LanguageContext';

export default function HowItWorksPage() {
  const { isConnected } = useAccount();
  const { t } = useTranslations();

  return (
    <main className="min-h-screen" style={{ background: '#050505' }}>
      {/* Nav */}
      <nav className="flex justify-between items-center px-4 md:px-6 lg:px-12 py-4" style={{ borderBottom: '1px solid #161616' }}>
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <img src="/ritty-logo.png" alt="Ritty.ai" className="h-8 md:h-10 w-auto" />
          <span className="text-lg md:text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ritty.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <Link href="/agent-rent" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>{t('buttons.marketplace')}</Link>
          <Link href="/how-it-works" className="text-sm transition-colors hover:text-white" style={{ color: '#40FFAF' }}>{t('nav.howItWorks')}</Link>
          <Link href="/feedback" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>Feedback</Link>
          {isConnected && (
            <Link href="/dashboard" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>{t('nav.dashboard')}</Link>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <ConnectButton />
          <LanguageSwitcher />
          <MobileMenu />
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
            {t('howItWorks.title')}
          </h1>
          <p className="text-sm md:text-base" style={{ color: '#fff', opacity: 0.7 }}>
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20">
          {[
            {
              step: '01',
              icon: '🔍',
              title: t('howItWorks.step1Title'),
              desc: t('howItWorks.step1Desc'),
              detail: t('howItWorks.step1Detail'),
            },
            {
              step: '02',
              icon: '🔗',
              title: t('howItWorks.step2Title'),
              desc: t('howItWorks.step2Desc'),
              detail: t('howItWorks.step2Detail'),
            },
            {
              step: '03',
              icon: '🚀',
              title: t('howItWorks.step3Title'),
              desc: t('howItWorks.step3Desc'),
              detail: t('howItWorks.step3Detail'),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 md:p-8 transition-all duration-300"
              style={{
                background: '#0A0A0A',
                border: '1px solid #161616',
              }}
            >
              <div className="text-xs font-mono font-bold mb-4 tracking-widest" style={{ color: '#40FFAF' }}>
                STEP {item.step}
              </div>
              <div className="text-4xl mb-5">{item.icon}</div>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#fff', opacity: 0.8 }}>
                {item.desc}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#fff', opacity: 0.6 }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="mb-20">
          <h2 className="text-xl md:text-2xl font-bold mb-8 text-center" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
            {t('howItWorks.needTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: '🦊',
                title: t('howItWorks.needEvmTitle'),
                desc: t('howItWorks.needEvmDesc'),
              },
              {
                icon: '⛽',
                title: t('howItWorks.needTokensTitle'),
                desc: t('howItWorks.needTokensDesc'),
              },
              {
                icon: '🌐',
                title: t('howItWorks.needNetworkTitle'),
                desc: t('howItWorks.needNetworkDesc'),
              },
              {
                icon: '💡',
                title: t('howItWorks.needIdeaTitle'),
                desc: t('howItWorks.needIdeaDesc'),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl px-5 py-5"
                style={{ background: '#0A0A0A', border: '1px solid #161616' }}
              >
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#fff', opacity: 0.7 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-xl md:text-2xl font-bold mb-8 text-center" style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>
            FAQ
          </h2>
          <div className="space-y-3">
            {[
              {
                q: t('howItWorks.faq1q'),
                a: t('howItWorks.faq1a'),
              },
              {
                q: t('howItWorks.faq2q'),
                a: t('howItWorks.faq2a'),
              },
              {
                q: t('howItWorks.faq3q'),
                a: t('howItWorks.faq3a'),
              },
              {
                q: t('howItWorks.faq4q'),
                a: t('howItWorks.faq4a'),
              },
              {
                q: t('howItWorks.faq5q'),
                a: t('howItWorks.faq5a'),
              },
              {
                q: t('howItWorks.faq6q'),
                a: t('howItWorks.faq6a'),
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-xl px-6 py-5"
                style={{ background: '#0A0A0A', border: '1px solid #161616' }}
              >
                <p className="text-sm font-bold mb-2" style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {faq.q}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#fff', opacity: 0.7 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/agent-rent"
            className="inline-flex items-center gap-2 text-sm font-medium px-8 py-3 rounded-xl transition-all hover:shadow-lg"
            style={{ background: '#40FFAF', color: '#050505', boxShadow: '0 0 20px rgba(64,255,175,0.15)' }}
          >
            {t('howItWorks.browseAgents')}
          </Link>
        </div>
      </div>
    </main>
  );
}
