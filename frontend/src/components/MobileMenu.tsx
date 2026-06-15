'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col gap-1.5 p-2 md:hidden"
        aria-label="Menu"
      >
        <span className={`block w-5 h-0.5 bg-white transition-transform ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 bg-white transition-opacity ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-white transition-transform ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: 'rgba(0,0,0,0.95)' }}>
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2"
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/agent-rent"
              onClick={() => setIsOpen(false)}
              className="text-xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Agent Rent
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setIsOpen(false)}
              className="text-xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/feedback"
              onClick={() => setIsOpen(false)}
              className="text-xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Feedback
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/marketplace"
              onClick={() => setIsOpen(false)}
              className="text-xl font-medium text-white hover:text-[#40FFAF] transition-colors"
            >
              Marketplace
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
