'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

/**
 * Intercepts eth_sendTransaction to force legacy (type 0) transactions.
 * Ritual Chain doesn't support EIP-1559 (type 2).
 * 
 * Works for:
 * - Injected wallets (MetaMask, Trust Wallet) via window.ethereum
 * - WalletConnect via provider patching on connection
 */
export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();
  const patchedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || patchedRef.current) return;

    // Small delay to let wallet provider initialize
    const timeout = setTimeout(async () => {
      try {
        // Try to get the provider from the connector
        let provider: any = null;
        
        if (connector) {
          try {
            provider = await connector.getProvider();
          } catch {}
        }

        // Fallback to window.ethereum
        if (!provider) {
          provider = (window as any).ethereum;
        }

        if (!provider || provider.__legacyPatched) return;

        const originalRequest = provider.request?.bind(provider);
        if (!originalRequest) return;

        provider.request = async (args: { method: string; params?: any }) => {
          if (args.method === 'eth_sendTransaction' && args.params?.[0]) {
            const tx = { ...args.params[0] };
            
            // Strip EIP-1559 fields that wallet/viem might add
            delete tx.maxFeePerGas;
            delete tx.maxPriorityFeePerGas;
            delete tx.accessList;
            
            // Force legacy type
            tx.type = '0x0';
            
            // Ensure gasPrice is set
            if (!tx.gasPrice) {
              tx.gasPrice = '0x3B9ACA00'; // 1 gwei
            }

            return originalRequest({ method: args.method, params: [tx] });
          }
          return originalRequest(args);
        };

        provider.__legacyPatched = true;
        patchedRef.current = true;
      } catch (e) {
        console.warn('LegacyTxProvider: failed to patch provider', e);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [isConnected, connector]);

  return <>{children}</>;
}
