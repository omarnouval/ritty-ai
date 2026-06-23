'use client';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-white/40 text-sm">
          © 2026 Ritty.ai — Built on Ritual Chain
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/omarnouval/ritty-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-[#40FFAF] transition-colors text-sm"
          >
            GitHub
          </a>
          <a
            href="https://x.com/OmarNouval"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-[#40FFAF] transition-colors text-sm"
          >
            Twitter
          </a>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-[#40FFAF] transition-colors text-sm"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
