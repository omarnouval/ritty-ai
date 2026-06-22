'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(8, 9, 23)' }}>
      <div className="text-center px-4 max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-400 mb-6">
          Dashboard encountered an error. This is usually caused by a network issue or wallet connection problem.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-black transition hover:opacity-80"
            style={{ background: '#40FFAF' }}
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition border"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            Reload Page
          </a>
        </div>
      </div>
    </main>
  );
}
