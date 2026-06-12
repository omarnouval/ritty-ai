'use client';

import { useEffect } from 'react';

/**
 * Forces legacy (type 0) transactions for Ritual Chain (1979).
 * 
 * Rabby wallet auto-upgrades transactions to EIP-1559 (type 2),
 * but Ritual Chain's RPC rejects type 2 transactions.
 * 
 * Strategy:
 * 1. Strip EIP-1559 fields from eth_sendTransaction params
 * 2. If wallet still sends type 2 (bypassing our strip),
 *    fall back to eth_signTransaction + eth_sendRawTransaction
 */

if (typeof window !== 'undefined') {
  patchProvider((window as any).ethereum);
  patchProvider((window as any).rabby);
}

function patchProvider(provider: any) {
  if (!provider || provider.__legacyPatched) return;
  if (typeof provider.request !== 'function') return;

  const originalRequest = provider.request.bind(provider);

  provider.request = async (args: { method: string; params?: any }) => {
    // Intercept transaction sends
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
      delete tx.authorizationList;
      delete tx.blobs;
      delete tx.blobVersionedHashes;

      // Force legacy type
      tx.type = '0x0';

      // Ensure gasPrice (1 gwei)
      if (!tx.gasPrice) {
        tx.gasPrice = '0x3B9ACA00';
      }

      // Try eth_sendTransaction first (normal path)
      try {
        const result = await originalRequest({
          method: args.method,
          params: [tx],
        });
        return result;
      } catch (err: any) {
        // If wallet still sends type 2 and RPC rejects,
        // try signing locally and broadcasting
        const errMsg = err?.message || err?.data?.message || '';
        if (
          errMsg.includes('transaction type not supported') ||
          errMsg.includes('type not supported')
        ) {
          // Try eth_signTransaction + eth_sendRawTransaction
          try {
            const signed = await originalRequest({
              method: 'eth_signTransaction',
              params: [tx],
            });
            // Broadcast the raw signed transaction
            const hash = await originalRequest({
              method: 'eth_sendRawTransaction',
              params: [signed],
            });
            return hash;
          } catch (signErr) {
            // eth_signTransaction not supported, re-throw original error
            throw err;
          }
        }
        throw err;
      }
    }

    return originalRequest(args);
  };

  provider.__legacyPatched = true;
}

export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Re-patch on mount (in case provider loaded after module)
    patchProvider((window as any).ethereum);
    patchProvider((window as any).rabby);

    const eth = (window as any).ethereum;
    if (eth?.providers && Array.isArray(eth.providers)) {
      eth.providers.forEach(patchProvider);
    }
  }, []);

  return <>{children}</>;
}
