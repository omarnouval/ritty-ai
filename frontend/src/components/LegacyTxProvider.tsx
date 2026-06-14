'use client';

/**
 * Minimal provider — no monkey-patching.
 * Let the wallet handle transaction types natively.
 */

export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
