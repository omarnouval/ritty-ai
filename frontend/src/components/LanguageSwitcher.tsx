'use client';
import React, { useCallback } from 'react';
import { useTranslations, FULL_LABELS, SUPPORTED, type Locale } from '@/lib/i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslations();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value as Locale);
  }, [setLocale]);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Globe icon */}
      <svg
        width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="#A1A1AA" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>

      <select
        value={locale}
        onChange={handleChange}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          padding: '6px 28px 6px 30px',
          borderRadius: 12,
          background: '#111',
          border: '1px solid #222',
          color: '#A1A1AA',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
        }}
      >
        {SUPPORTED.map((code) => (
          <option key={code} value={code} style={{ background: '#111', color: '#fff' }}>
            {FULL_LABELS[code]}
          </option>
        ))}
      </select>

      {/* Chevron */}
      <svg
        width="10" height="10" viewBox="0 0 24 24"
        fill="none" stroke="#A1A1AA" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ position: 'absolute', right: 10, pointerEvents: 'none' }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
