'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, FULL_LABELS, SUPPORTED, type Locale } from '@/lib/i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslations();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 9999 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 12,
          background: '#111',
          border: '1px solid #222',
          color: '#A1A1AA',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {locale.toUpperCase()}
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: '110%',
          right: 0,
          background: '#111',
          border: '1px solid #222',
          borderRadius: 12,
          overflow: 'visible',
          minWidth: 140,
          zIndex: 99999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {SUPPORTED.map((code) => (
            <button
              key={code}
              onMouseDown={(e) => {
                console.log('mousedown!', code);
              }}
              onClick={(e) => {
                console.log('click!', code);
                setLocale(code);
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                background: code === locale ? '#1a1a1a' : 'transparent',
                color: code === locale ? '#fff' : '#A1A1AA',
                border: 'none',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 0.15s',
                pointerEvents: 'all' as const,
                position: 'relative' as const,
                zIndex: 999999,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
              onMouseLeave={e => (e.currentTarget.style.background = code === locale ? '#1a1a1a' : 'transparent')}
            >
              {FULL_LABELS[code]}
              {code === locale && (
                <span style={{ float: 'right', color: '#22c55e' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
