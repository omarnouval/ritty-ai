'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

/**
 * Ritual Chain (1979) only supports type 0 (legacy) and type 2 (EIP-1559).
 * Some wallets send type 3/4 which the chain rejects.
 * 
 * This provider intercepts eth_sendTransaction and downgrades
 * unsupported transaction types to type 0 (legacy).
 */

let patched = false;

function patchProvider(provider: any, label: string): boolean {
  if (!provider || provider.__legacyPatched) return false;
  if (typeof provider.request !== 'function') return false;

  const originalRequest = provider.request.bind(provider);

  provider.request = async (args: { method: string; params?: any }) => {
    if (
      (args.method === 'eth_sendTransaction' ||
        args.method === 'wallet_sendTransaction') &&
      args.params?.[0]
    ) {
      const tx = { ...args.params[0] };

      // Strip ALL fields that newer tx types add
      delete tx.maxFeePerBlobGas;
      delete tx.blobVersionedHashes;
      delete tx.blobs;
      delete tx.authorizationList;

      // Check the type
      const txType = typeof tx.type === 'string' ? parseInt(tx.type, 16) : tx.type;

      // If type > 2 (EIP-4844 or EIP-7702), downgrade to legacy
      if (txType > 2) {
        tx.type = '0x0';
        // Remove EIP-1559 fields, add gasPrice
        delete tx.maxFeePerGas;
        delete tx.maxPriorityFeePerGas;
        if (!tx.gasPrice) {
          tx.gasPrice = '0x3B9ACA00'; // 1 gwei
        }
      }

      return originalRequest({ method: args.method, params: [tx] });
    }
    return originalRequest(args);
  };

  provider.__legacyPatched = true;
  patched = true;
  return true;
}

function tryPatchAll(): boolean {
  let result = false;
  const eth = (window as any).ethereum;
  if (eth) {
    if (Array.isArray(eth.providers)) {
      eth.providers.forEach((p: any) => {
        if (patchProvider(p, 'multi-provider')) result = true;
      });
    }
    if (patchProvider(eth, 'window.ethereum')) result = true;
  }
  if (patchProvider((window as any).rabby, 'window.rabby')) result = true;
  return result;
}

export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();
  const [debug, setDebug] = useState('');

  useEffect(() => {
    // Try patching immediately
    tryPatchAll();

    // Also try via connector
    if (connector?.getProvider) {
      connector.getProvider().then((p: any) => {
        patchProvider(p, 'connector-provider');
      }).catch(() => {});
    }

    // Poll every 200ms for up to 5 seconds until patched
    const interval = setInterval(() => {
      if (patched) {
        clearInterval(interval);
        return;
      }
      tryPatchAll();
    }, 200);

    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isConnected, connector]);

  return <>{children}</>;
}
