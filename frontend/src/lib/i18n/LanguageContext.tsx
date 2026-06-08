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
  "buttons.marketplace": "Marketplace",
  "buttons.deploy": "Deploy",
  "nav.features": "Features",
  "nav.agents": "Agents",
  "nav.docs": "Docs",
  "nav.dashboard": "Dashboard"
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
