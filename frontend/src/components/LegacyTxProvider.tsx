'use client';

import { useEffect } from 'react';

/**
 * Monkey-patches window.ethereum/rabby BEFORE wagmi/RainbowKit captures
 * the provider reference. This runs as early as possible in the client.
 * 
 * Ritual Chain (1979) only supports legacy (type 0) transactions.
 * Rabby/MetaMask auto-upgrade to EIP-1559 (type 2) which the RPC rejects.
 */

// Run patch IMMEDIATELY on module load (before any React renders)
if (typeof window !== 'undefined') {
  patchProvider((window as any).ethereum);
  patchProvider((window as any).rabby);
}

function patchProvider(provider: any) {
  if (!provider || provider.__legacyPatched) return;
  if (typeof provider.request !== 'function') return;

  const originalRequest = provider.request.bind(provider);

  provider.request = async (args: { method: string; params?: any }) => {
    if (
      (args.method === 'eth_sendTransaction' ||
        args.method === 'wallet_sendTransaction') &&
      args.params?.[0]
    ) {
      const tx = { ...args.params[0] };

      // Nuclear strip: remove ALL EIP-1559 / blob fields
      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
      delete tx.maxFeePerBlobGas;
      delete tx.accessList;

      // Force legacy
      tx.type = '0x0';

      // Ensure gasPrice (1 gwei)
      if (!tx.gasPrice) {
        tx.gasPrice = '0x3B9ACA00';
      }

      return originalRequest({ method: args.method, params: [tx] });
    }
    return originalRequest(args);
  };

  provider.__legacyPatched = true;
}

export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  // Re-patch on mount in case provider loaded after module
  useEffect(() => {
    patchProvider((window as any).ethereum);
    patchProvider((window as any).rabby);

    // Also patch multi-provider arrays (some wallets inject as array)
    const eth = (window as any).ethereum;
    if (eth?.providers && Array.isArray(eth.providers)) {
      eth.providers.forEach(patchProvider);
    }
  }, []);

  return <>{children}</>;
}
