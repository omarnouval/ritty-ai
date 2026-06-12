'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

/**
 * Intercepts eth_sendTransaction to force legacy (type 0) transactions.
 * Ritual Chain doesn't support EIP-1559 (type 2).
 * 
 * Patches ALL possible providers: window.ethereum, window.rabby, 
 * connector.getProvider(), and any multi-provider arrays.
 */

function patchProvider(provider: any, label: string): boolean {
  if (!provider || provider.__legacyPatched) return false;
  if (typeof provider.request !== 'function') return false;

  const originalRequest = provider.request.bind(provider);
  
  provider.request = async (args: { method: string; params?: any }) => {
    // Intercept ALL transaction send methods
    if (
      (args.method === 'eth_sendTransaction' || 
       args.method === 'wallet_sendTransaction') && 
      args.params?.[0]
    ) {
      const tx = { ...args.params[0] };
      
      // Strip ALL EIP-1559 / EIP-4844 fields
      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
      delete tx.maxFeePerBlobGas;
      delete tx.accessList;
      
      // Force legacy type
      tx.type = '0x0';
      
      // Ensure gasPrice is set (1 gwei)
      if (!tx.gasPrice) {
        tx.gasPrice = '0x3B9ACA00';
      }

      return originalRequest({ method: args.method, params: [tx] });
    }
    return originalRequest(args);
  };

  provider.__legacyPatched = true;
  return true;
}

function patchAllProviders(connector: any): boolean {
  let patched = false;

  // 1. Patch connector's provider (works for injected, walletconnect, etc.)
  if (connector?.getProvider) {
    connector.getProvider().then((p: any) => {
      if (patchProvider(p, 'connector')) patched = true;
    }).catch(() => {});
  }

  // 2. Patch window.ethereum (MetaMask, Rabby, Trust, etc.)
  const eth = (window as any).ethereum;
  if (eth) {
    // Multi-provider (some wallets inject as array)
    if (Array.isArray(eth.providers)) {
      eth.providers.forEach((p: any, i: number) => {
        if (patchProvider(p, `window.ethereum.providers[${i}]`)) patched = true;
      });
    }
    // Single provider
    if (patchProvider(eth, 'window.ethereum')) patched = true;
  }

  // 3. Patch Rabby-specific provider
  const rabby = (window as any).rabby;
  if (rabby && patchProvider(rabby, 'window.rabby')) patched = true;

  // 4. Patch isRabby / isMetaMask providers
  if (eth?.isRabby && patchProvider(eth, 'rabby-via-ethereum')) patched = true;

  return patched;
}

export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();
  const patchedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || patchedRef.current) return;

    // Patch immediately
    patchAllProviders(connector);
    
    // Patch again after delay (provider might not be ready immediately)
    const t1 = setTimeout(() => {
      patchAllProviders(connector);
    }, 500);

    // Patch once more after 2s (for slow wallet initialization)
    const t2 = setTimeout(() => {
      if (patchAllProviders(connector)) {
        patchedRef.current = true;
      }
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isConnected, connector]);

  return <>{children}</>;
}
