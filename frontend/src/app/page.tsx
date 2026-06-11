'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from '@/lib/i18n/LanguageContext';

const HERO_LINES: Record<string, { line1: string; prefix: string; boldWord: string }> = {
  en: { line1: "You Don't Need", prefix: 'to', boldWord: 'Code' },
  id: { line1: 'Kamu Gak Perlu', prefix: '', boldWord: 'Coding' },
  fil: { line1: 'Hindi Mo Kailangan ng', prefix: 'mag', boldWord: 'Code' },
  ko: { line1: '코딩은 필요', prefix: '', boldWord: '없어요' },
  hi: { line1: 'आपको', prefix: '', boldWord: 'Code करने की ज़रूरत नहीं है' },
};

const HERO_SUB: Record<string, string> = {
  en: 'The future is agent-native. Build yours on Ritual Chain',
  id: 'Masa depan itu agent-native. Bikin punyamu di Ritual Chain',
  fil: 'Ang future ay agent-native. Gawin mo sa Ritual Chain',
  ko: '미래는 에이전트 네이티브입니다. Ritual Chain에서 만드세요',
  hi: 'भविष्य agent-native है। Ritual Chain पर अपना बनाएं',
};

const HERO_NOTE: Record<string, string> = {
  en: 'You can always make changes later. Your first agent deploy is free.',
  id: 'Kamu bisa ubah kapan aja nanti. Deploy agent pertama gratis.',
  fil: 'Pwede mong baguhin mamaya. Libre ang unang agent deploy.',
  ko: '나중에 언제든 변경할 수 있습니다. 첫 에이전트 배포는 무료입니다.',
  hi: 'आप बाद में कभी भी बदलाव कर सकते हैं। पहला agent deploy मुफ्त है।',
};

const PROMPT_PH: Record<string, string> = {
  en: 'Describe your agent…',
  id: 'Jelasin agent impianmu...',
  fil: 'I-describe ang ideal agent mo...',
  ko: '원하는 에이전트를 설명해주세요...',
  hi: 'अपने ideal agent का वर्णन करें...',
};

const NAV_LABELS: Record<string, { agentRent: string; create: string; dashboard: string; howItWorks: string }> = {
  en: { agentRent: 'Agent Rent', create: 'Create', dashboard: 'Dashboard', howItWorks: 'How It Works' },
  id: { agentRent: 'Agent Rent', create: 'Buat Agent', dashboard: 'Dashboard', howItWorks: 'Cara Kerja' },
  fil: { agentRent: 'Agent Rent', create: 'Gumawa ng Agent', dashboard: 'Dashboard', howItWorks: 'Paano Ito Gumagana' },
  ko: { agentRent: 'Agent Rent', create: '에이전트 생성', dashboard: '대시보드', howItWorks: '이용 방법' },
  hi: { agentRent: 'Agent Rent', create: 'Agent बनाएं', dashboard: 'डैशबोर्ड', howItWorks: 'कैसे काम करता है' },
};

const SUGGESTIONS: Record<string, string[]> = {
  en: ['A chatbot that handles customer support 24/7', 'Build a code review agent', 'An agent that analyzes on-chain data and sends reports', 'Generate images from text prompts using AI'],
  id: ['Chatbot customer support 24/7', 'Agent code review', 'Agent yang analisis data on-chain dan kirim laporan', 'Generate gambar dari prompt text pakai AI'],
  fil: ['Chatbot para sa customer support 24/7', 'Code review agent', 'Agent na nag-aanalyze ng on-chain data', 'Mag-generate ng larawan gamit ang AI'],
  ko: ['24시간 고객 지원 챗봇', '코드 리뷰 에이전트', '온체인 데이터 분석 에이전트', 'AI로 이미지 생성'],
  hi: ['24/7 कस्टमर सपोर्ट चैटबॉट', 'कोड रिव्यू agent', 'ऑन-चेन डेटा विश्लेषण agent', 'AI से इमेज जनरेट करें'],
};

export default function Home() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { locale } = useTranslations();

  const l = locale as keyof typeof HERO_LINES;
  const hero = HERO_LINES[l] || HERO_LINES.en;
  const nav = NAV_LABELS[l] || NAV_LABELS.en;
  const suggestions = SUGGESTIONS[l] || SUGGESTIONS.en;

  const AGENT_LABELS: Record<string, { research: string; trading: string; monitor: string; codeReview: string; content: string; chatbot: string }> = {
    en: { research: 'Research', trading: 'Trading', monitor: 'Monitor', codeReview: 'Code Review', content: 'Content', chatbot: 'Chatbot' },
    id: { research: 'Riset', trading: 'Trading', monitor: 'Monitor', codeReview: 'Review Kode', content: 'Konten', chatbot: 'Chatbot' },
    fil: { research: 'Pananaliksik', trading: 'Trading', monitor: 'Monitor', codeReview: 'Code Review', content: 'Content', chatbot: 'Chatbot' },
    ko: { research: '리서치', trading: '트레이딩', monitor: '모니터', codeReview: '코드 리뷰', content: '콘텐츠', chatbot: '챗봇' },
    hi: { research: 'अनुसंधान', trading: 'ट्रेडिंग', monitor: 'मॉनिटर', codeReview: 'कोड रिव्यू', content: 'कंटेंट', chatbot: 'चैटबॉट' },
  };

  const agentLabels = AGENT_LABELS[l] || AGENT_LABELS.en;
  const agentTypes = [
    { id: 'research', label: agentLabels.research, icon: '🔬' },
    { id: 'trading', label: agentLabels.trading, icon: '📈' },
    { id: 'monitoring', label: agentLabels.monitor, icon: '📡' },
    { id: 'code-review', label: agentLabels.codeReview, icon: '🧑‍💻' },
    { id: 'content', label: agentLabels.content, icon: '✍️' },
    { id: 'chatbot', label: agentLabels.chatbot, icon: '💬' },
  ];

  const handleSearch = () => {
    if (prompt || selectedType) {
      const params = new URLSearchParams();
      if (prompt) params.set('q', prompt);
      if (selectedType) params.set('category', selectedType);
      router.push(`/agent-rent?${params.toString()}`);
    }
  };

  return (
    <main className="min-h-screen relative" style={{ background: '#050505' }}>
      {/* ─── Ambient Blobs ─── */}
      <div className="blob" style={{ width: 600, height: 600, background: '#40FFAF', top: '-200px', right: '-100px', animationDelay: '0s' }} />
      <div className="blob" style={{ width: 400, height: 400, background: '#40FFAF', bottom: '-150px', left: '-100px', animationDelay: '-5s' }} />
      <div className="blob" style={{ width: 300, height: 300, background: '#2EF19C', top: '40%', left: '60%', animationDelay: '-10s' }} />

      {/* ─── Nav ─── */}
      <nav className="relative z-10 flex justify-between items-center px-4 md:px-6 lg:px-12 py-4" style={{ borderBottom: '1px solid #161616' }}>
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <img src="/ritty-logo.png" alt="Ritty.ai" className="h-8 md:h-10 w-auto" />
          <span className="text-lg md:text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ritty.ai</span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link href="/agent-rent" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>
            {nav.agentRent}
          </Link>
          <Link href="/how-it-works" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>
            {nav.howItWorks}
          </Link>
          {isConnected && (
            <Link href="/dashboard" className="text-sm transition-colors hover:text-white" style={{ color: '#A1A1AA' }}>
              {nav.dashboard}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 76px)' }}>
        <div className="max-w-2xl w-full text-center">
          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5 tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {hero.line1}<br />
            {hero.prefix && <>{hero.prefix} </>}<span style={{ color: '#40FFAF' }}>{hero.boldWord}</span><span style={{ color: '#40FFAF', fontSize: '0.5em', verticalAlign: 'super' }}>.</span>
          </h1>

          <p className="text-base md:text-lg mb-3 font-light" style={{ color: '#FFFFFF', opacity: 0.7, fontFamily: 'DM Sans, sans-serif' }}>
            {HERO_SUB[l] || HERO_SUB.en}
          </p>

          <p className="text-sm mb-14" style={{ color: '#FFFFFF', opacity: 0.4 }}>
            {HERO_NOTE[l] || HERO_NOTE.en}
          </p>

          {/* ─── Chat Input ─── */}
          <div
            className="rounded-2xl p-5 max-w-xl mx-auto transition-all duration-300"
            style={{
              background: '#111',
              border: `1px solid ${isFocused ? 'rgba(64,255,175,0.25)' : '#222'}`,
              boxShadow: isFocused ? '0 0 30px rgba(64,255,175,0.06), 0 0 80px rgba(64,255,175,0.03)' : 'none',
            }}
          >
            <div className="flex items-start gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder={PROMPT_PH[l] || PROMPT_PH.en}
                rows={2}
                className="flex-1 text-white text-sm resize-none outline-none leading-relaxed"
                style={{ background: 'transparent', fontFamily: 'DM Sans, sans-serif', color: '#fff' }}
              />
              <button
                onClick={handleSearch}
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                style={{
                  background: prompt || selectedType ? '#40FFAF' : '#1A1A1A',
                  boxShadow: prompt || selectedType ? '0 0 15px rgba(64,255,175,0.2)' : 'none',
                  opacity: prompt || selectedType ? 1 : 0.5,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={prompt ? '#050505' : '#555'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* Type pills */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #1A1A1A' }}>
              {agentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                  style={{
                    background: selectedType === type.id ? 'rgba(64,255,175,0.1)' : '#161616',
                    color: selectedType === type.id ? '#40FFAF' : '#A1A1AA',
                    border: `1px solid ${selectedType === type.id ? 'rgba(64,255,175,0.2)' : '#222'}`,
                  }}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-10">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="text-xs px-4 py-2 rounded-lg transition-all duration-200 hover:border-[#333]"
                style={{ color: '#555', background: '#0A0A0A', border: '1px solid #1A1A1A', fontFamily: 'DM Sans, sans-serif' }}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 mt-12 md:mt-20 max-w-lg mx-auto px-2">
            {[
              { value: '1979', label: 'Ritual Chain', sub: 'testnet' },
              { value: '5+', label: 'AI Agents', sub: 'ready to rent' },
              { value: '5%', label: 'Platform Fee', sub: 'per rental' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-sm md:text-lg font-bold font-mono mb-1" style={{ color: '#40FFAF', fontFamily: 'Space Grotesk, monospace' }}>{stat.value}</div>
                <div className="text-xs font-medium" style={{ color: '#A1A1AA' }}>{stat.label}</div>
                <div className="text-[10px] md:text-xs mt-0.5" style={{ color: '#3A3A3A' }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
