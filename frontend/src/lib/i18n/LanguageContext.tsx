'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Locale = 'en' | 'id' | 'fil' | 'ko' | 'hi';

const SUPPORTED: Locale[] = ['en', 'id', 'fil', 'ko', 'hi'];

const LABELS: Record<Locale, string> = {
  en: 'EN',
  id: 'ID',
  fil: 'FIL',
  ko: 'KO',
  hi: 'HI',
};

const FULL_LABELS: Record<Locale, string> = {
  en: 'English',
  id: 'Indonesia',
  fil: 'Filipino',
  ko: '한국어',
  hi: 'हिंदी',
};

// Inline English as default so SSR prerender has real text
const EN_DICT: Record<string, string> = {
  "hero.title": "You Don't Need\nto **Code.",
  "hero.sub": "The future is agent-native. Build yours on Ritual Chain",
  "hero.note": "You can always make changes later. Your first agent deploy is free.",
  "prompt.placeholder": "Describe your agent…",
  "category.llm": "LLM",
  "category.image": "Image",
  "category.audio": "Audio",
  "category.http": "HTTP",
  "category.all": "All Agents",
  "example.chatbot": "A chatbot that handles customer support 24/7",
  "example.dataAnalysis": "An agent that analyzes on-chain data and sends reports",
  "example.imageGenerator": "Generate images from text prompts using AI",
  "buttons.launchApp": "Launch App",
  "buttons.create": "Create Agent",
  "buttons.marketplace": "Agent Rent",
  "buttons.deploy": "Deploy",
  "nav.features": "Features",
  "nav.agents": "Agents",
  "nav.docs": "Docs",
  "nav.dashboard": "Dashboard",
  "nav.howItWorks": "How It Works",
  "agentRent.title": "Agent Rent",
  "agentRent.subtitle": "Discover & rent autonomous AI agents on Ritual Chain",
  "agentRent.search": "Search agents…",
  "agentRent.loading": "Loading agents…",
  "agentRent.empty": "No agents yet",
  "agentRent.emptyDesc": "Be the first to list an agent on Ritual",
  "agentRent.listAgent": "List your agent →",
  "agentRent.prev": "← Previous",
  "agentRent.next": "Next →",
  "agentRent.page": "Page",
  "agent.backToRent": "← Back to Agent Rent",
  "agent.active": "Active",
  "agent.inactive": "Inactive",
  "agent.aiAgent": "AI Agent",
  "agent.reviews": "reviews",
  "agent.totalRentals": "Total Rentals",
  "agent.totalEarnings": "Total Earnings",
  "agent.contract": "Contract",
  "agent.rentTitle": "Rent this Agent",
  "agent.duration": "Duration",
  "agent.duration1h": "1 hour",
  "agent.duration8h": "8 hours",
  "agent.duration24h": "24 hours",
  "agent.duration1w": "1 week",
  "agent.custom": "Custom",
  "agent.enterHours": "Enter hours…",
  "agent.totalCost": "Total Cost",
  "agent.hour": "hour(s)",
  "agent.rentalSuccess": "Rental Successful!",
  "agent.rentalSuccessDesc": "Your agent is now active. Check your dashboard.",
  "agent.goToDashboard": "Go to Dashboard →",
  "agent.confirmWallet": "Confirm in wallet…",
  "agent.processing": "Processing…",
  "agent.loading": "Loading agent…",
  "agent.notFound": "Agent not found",
  "howItWorks.title": "How It Works",
  "howItWorks.subtitle": "Three steps. No code. Start using AI agents in minutes.",
  "howItWorks.step1Title": "Browse Agents",
  "howItWorks.step1Desc": "Explore AI agents built for research, trading, content, and more. Each agent has clear pricing and capabilities listed on the Agent Rent page.",
  "howItWorks.step1Detail": "Use the search bar or category pills to filter agents by type. Every agent card shows its name, description, rating, rental count, and hourly price in RITUAL tokens.",
  "howItWorks.step2Title": "Connect & Rent",
  "howItWorks.step2Desc": "Connect your wallet, pick a rental duration, and confirm the transaction on-chain.",
  "howItWorks.step2Detail": "Click \"Rent\" on any agent card. If you haven't connected a wallet yet, the connect modal will appear automatically. Choose your duration (1h, 3h, 6h, 12h, or 24h) and confirm. Your first rental is free on testnet.",
  "howItWorks.step3Title": "Use Your Agent",
  "howItWorks.step3Desc": "Your rented agent appears in the dashboard. Chat with it, give it tasks, and get results instantly.",
  "howItWorks.step3Detail": "After renting, go to your Dashboard to see all active rentals. Each agent has a countdown timer showing remaining time. Click on any active rental to start chatting. You can extend your rental before it expires.",
  "howItWorks.needTitle": "What You Need",
  "howItWorks.needEvmTitle": "EVM Wallet",
  "howItWorks.needEvmDesc": "MetaMask, Rainbow, Coinbase Wallet, or any WalletConnect-compatible wallet.",
  "howItWorks.needTokensTitle": "RITUAL Tokens",
  "howItWorks.needTokensDesc": "Used to pay for agent rentals and gas fees. Get free testnet tokens from the Ritual faucet.",
  "howItWorks.needNetworkTitle": "Ritual Chain Network",
  "howItWorks.needNetworkDesc": "Add Ritual Chain (ID 1979) to your wallet. RPC details available on the Ritual docs.",
  "howItWorks.needIdeaTitle": "An Idea",
  "howItWorks.needIdeaDesc": "Describe what you want your agent to do in plain language. No technical knowledge needed.",
  "howItWorks.faq1q": "Do I need to code?",
  "howItWorks.faq1a": "No. Describe what you want in plain language. The platform matches you with the right agent.",
  "howItWorks.faq2q": "What wallet do I need?",
  "howItWorks.faq2a": "Any EVM-compatible wallet (MetaMask, Rainbow, etc.) connected to Ritual Chain testnet.",
  "howItWorks.faq3q": "How much does it cost?",
  "howItWorks.faq3a": "Agents are priced per hour in RITUAL tokens. Your first rental is free on testnet.",
  "howItWorks.faq4q": "Can I extend my rental?",
  "howItWorks.faq4a": "Yes. Extend anytime from the dashboard before your rental expires.",
  "howItWorks.faq5q": "What happens when my rental expires?",
  "howItWorks.faq5a": "The agent becomes unavailable in your dashboard. You can re-rent it anytime from the Agent Rent page.",
  "howItWorks.faq6q": "Can I rent multiple agents at once?",
  "howItWorks.faq6a": "Yes. Rent as many agents as you need. Each one appears as a separate card in your dashboard.",
  "howItWorks.browseAgents": "Browse Agents →"
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => EN_DICT[k] ?? k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [dict, setDict] = useState<Record<string, string>>(EN_DICT);

  useEffect(() => {
    const saved = localStorage.getItem('ritty-lang');
    if (saved && SUPPORTED.includes(saved as Locale)) {
      setLocaleState(saved as Locale);
    }
  }, []);

  useEffect(() => {
    if (locale === 'en') {
      setDict(EN_DICT);
      return;
    }
    import(`@/lib/i18n/translations/${locale}.json`)
      .then((mod) => setDict(mod.default || mod))
      .catch(() => setDict(EN_DICT));
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('ritty-lang', l);
  }, []);

  const t = useCallback(
    (key: string) => dict[key] ?? EN_DICT[key] ?? key,
    [dict]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslations() {
  return useContext(I18nContext);
}

export { LABELS, FULL_LABELS, SUPPORTED };
export type { Locale };
