'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

/**
 * Ritual Chain (1979) supports legacy (type 0) and EIP-1559 (type 2),
 * but does NOT support EIP-4844 (type 3) or EIP-7702 (type 4).
 *
 * Some wallets (Rabby) auto-send newer tx types that the chain rejects.
 * This provider strips unsupported tx type fields while keeping EIP-1559 intact.
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
    if (
      (args.method === 'eth_sendTransaction' ||
        args.method === 'wallet_sendTransaction') &&
      args.params?.[0]
    ) {
      const tx = { ...args.params[0] };

      // Strip EIP-4844 (blob) fields — type 3
      delete tx.maxFeePerBlobGas;
      delete tx.blobVersionedHashes;
      delete tx.blobs;

      // Strip EIP-7702 (authorization) fields — type 4
      delete tx.authorizationList;

      // If wallet sent type 3 or 4, downgrade to type 2 (EIP-1559)
      if (tx.type === '0x3' || tx.type === '0x4' || tx.type === 3 || tx.type === 4) {
        tx.type = '0x2';
        // Ensure EIP-1559 fields exist
        if (!tx.maxFeePerGas) {
          tx.maxFeePerGas = '0x3B9ACA00'; // 1 gwei
        }
        if (!tx.maxPriorityFeePerGas) {
          tx.maxPriorityFeePerGas = '0x3B9ACA00'; // 1 gwei
        }
      }

      return originalRequest({ method: args.method, params: [tx] });
    }

    return originalRequest(args);
  };

  provider.__legacyPatched = true;
}

function detectWallet(): string {
  if (typeof window === 'undefined') return 'unknown';
  const eth = (window as any).ethereum;
  if (!eth) return 'none';
  if (eth.isRabby) return 'rabby';
  if (eth.isMetaMask) return 'metamask';
  if (eth.isOkxWallet || eth.isOKExWallet) return 'okx';
  if (eth.isTrust) return 'trust';
  return 'other';
}

export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();

  useEffect(() => {
    patchProvider((window as any).ethereum);
    patchProvider((window as any).rabby);

    const eth = (window as any).ethereum;
    if (eth?.providers && Array.isArray(eth.providers)) {
      eth.providers.forEach(patchProvider);
    }
  }, []);

  return <>{children}</>;
}
