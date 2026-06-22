'use client';

import Image from 'next/image';

export default function MaintenancePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'rgb(8, 9, 23)' }}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{ background: 'rgba(64, 255, 175, 0.05)' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ background: 'rgba(139, 92, 246, 0.05)' }}
        />
      </div>

      <div className="relative z-10 text-center px-4 max-w-lg mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image
            src="/ritty-logo.png"
            alt="Ritty.ai"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
          <span className="text-2xl font-heavy text-white">Ritty.ai</span>
        </div>

        {/* Status badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
          </span>
          <span className="text-sm font-medium text-yellow-400">Under Maintenance</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-heavy text-white mb-4">
          We're Upgrading
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-base leading-relaxed mb-3">
          Ritty.ai is moving to <span className="text-[#40FFAF] font-medium">fully on-chain AI inference</span> using Ritual Chain precompiles.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Every chat, every agent response — verifiable on-chain. We'll be back soon.
        </p>

        {/* Chain info */}
        <div
          className="inline-flex items-center gap-3 px-5 py-3 rounded-xl mb-8"
          style={{
            background: 'rgba(17, 17, 17, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="text-left">
            <p className="text-xs text-gray-500">Powered by</p>
            <p className="text-sm font-medium text-white">Ritual Chain · Precompile 0x0802</p>
          </div>
        </div>

        {/* Socials */}
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://x.com/rittyai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-white transition text-sm"
          >
            Twitter/X
          </a>
          <span className="text-gray-700">·</span>
          <a
            href="https://t.me/rittyai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-white transition text-sm"
          >
            Telegram
          </a>
        </div>
      </div>
    </main>
  );
}
