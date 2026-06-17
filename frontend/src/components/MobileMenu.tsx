'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onPointerDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex flex-col justify-center items-center w-10 h-10 md:hidden relative"
        aria-label="Menu"
        style={{ minWidth: '40px', minHeight: '40px', zIndex: 9999 }}
      >
        <span className={`block w-6 h-0.5 bg-white mb-1.5 transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-6 h-0.5 bg-white mb-1.5 transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-6 h-0.5 bg-white transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile Menu Overlay — Portal to body so it's above everything */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 md:hidden"
          style={{ zIndex: 99998, background: 'rgba(0,0,0,0.97)' }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="flex flex-col items-center justify-center h-full gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-3"
              aria-label="Close menu"
              style={{ zIndex: 99999, minWidth: '44px', minHeight: '44px' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/agent-rent"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Agent Rent
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/feedback"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Feedback
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Marketplace
            </Link>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
