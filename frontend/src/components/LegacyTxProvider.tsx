'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';

/**
 * Wallet detection and re-patching.
 * Main patching happens in wagmi.ts (runs before config creation).
 * This component handles connector-level patching after wallet connects.
 */

function patchProvider(provider: any) {
  if (!provider || provider.__ritualPatched || typeof provider.request !== 'function') return;
  const orig = provider.request.bind(provider);
  provider.request = async (args: any) => {
    if (
      (args.method === 'eth_sendTransaction' ||
        args.method === 'wallet_sendTransaction') &&
      args.params?.[0]
    ) {
      const tx = { ...args.params[0] };
      delete tx.maxFeePerBlobGas;
      delete tx.blobVersionedHashes;
      delete tx.blobs;
      delete tx.authorizationList;
      const t = typeof tx.type === 'string' ? parseInt(tx.type, 16) : tx.type;
      if (t > 2) {
        tx.type = '0x0';
        delete tx.maxFeePerGas;
        delete tx.maxPriorityFeePerGas;
        if (!tx.gasPrice) tx.gasPrice = '0x3B9ACA00';
      }
      return orig({ method: args.method, params: [tx] });
    }
    return orig(args);
  };
  provider.__ritualPatched = true;
}

export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();

  useEffect(() => {
    if (!isConnected || !connector) return;
    // Patch the connector's provider directly
    connector.getProvider().then((p: any) => {
      patchProvider(p);
    }).catch(() => {});
  }, [isConnected, connector]);

  return <>{children}</>;
}
