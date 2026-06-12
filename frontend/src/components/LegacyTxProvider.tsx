'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';

/**
 * Ensures Ritual Chain (1979) is properly configured in the wallet,
 * and downgrades unsupported transaction types (3/4) to legacy (type 0).
 */

const RITUAL_CHAIN = {
  chainId: '0x7BB', // 1979 in hex
  chainName: 'Ritual',
  nativeCurrency: {
    name: 'RITUAL',
    symbol: 'RITUAL',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.ritualfoundation.org'],
  blockExplorerUrls: ['https://explorer.ritualfoundation.org'],
};

let patched = false;
let chainAdded = false;

function patchProvider(provider: any): boolean {
  if (!provider || provider.__legacyPatched) return false;
  if (typeof provider.request !== 'function') return false;

  const originalRequest = provider.request.bind(provider);

  provider.request = async (args: { method: string; params?: any }) => {
    // Intercept transaction sends
    if (
      (args.method === 'eth_sendTransaction' ||
        args.method === 'wallet_sendTransaction') &&
      args.params?.[0]
    ) {
      const tx = { ...args.params[0] };

      // Strip blob/auth fields
      delete tx.maxFeePerBlobGas;
      delete tx.blobVersionedHashes;
      delete tx.blobs;
      delete tx.authorizationList;

      // Check type
      const txType = typeof tx.type === 'string' ? parseInt(tx.type, 16) : tx.type;

      // If type > 2, downgrade to legacy
      if (txType > 2) {
        tx.type = '0x0';
        delete tx.maxFeePerGas;
        delete tx.maxPriorityFeePerGas;
        if (!tx.gasPrice) {
          tx.gasPrice = '0x3B9ACA00';
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

function tryPatchAll() {
  const eth = (window as any).ethereum;
  if (eth) {
    if (Array.isArray(eth.providers)) {
      eth.providers.forEach(patchProvider);
    }
    patchProvider(eth);
  }
  patchProvider((window as any).rabby);
}

async function ensureRitualChain(provider: any) {
  if (!provider || chainAdded) return;
  try {
    // Try to switch to Ritual Chain first
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: RITUAL_CHAIN.chainId }],
    });
    chainAdded = true;
  } catch (switchErr: any) {
    // Chain not added yet, add it
    if (switchErr.code === 4902 || switchErr.message?.includes('Unrecognized chain')) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [RITUAL_CHAIN],
        });
        chainAdded = true;
      } catch (addErr) {
        // Already added or user rejected
      }
    }
  }
}

export function LegacyTxProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();

  useEffect(() => {
    // Patch providers
    tryPatchAll();

    // Also try via connector
    if (connector?.getProvider) {
      connector.getProvider().then((p: any) => {
        patchProvider(p);
        // Ensure chain is properly configured
        if (isConnected) {
          ensureRitualChain(p);
        }
      }).catch(() => {});
    }

    // Poll until patched
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
