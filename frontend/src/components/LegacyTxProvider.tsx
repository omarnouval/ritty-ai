'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

/**
 * Forces legacy (type 0) transactions for Ritual Chain (1979).
 * 
 * Rabby wallet auto-upgrades transactions to EIP-1559 (type 2),
 * but Ritual Chain's RPC rejects type 2 transactions.
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

      // Strip EIP-1559 fields
      delete tx.maxFeePerGas;
      delete tx.maxPriorityFeePerGas;
      delete tx.maxFeePerBlobGas;
      delete tx.accessList;
      delete tx.authorizationList;
      delete tx.blobs;
      delete tx.blobVersionedHashes;

      // Force legacy
      tx.type = '0x0';
      if (!tx.gasPrice) {
        tx.gasPrice = '0x3B9ACA00';
      }

      try {
        return await originalRequest({ method: args.method, params: [tx] });
      } catch (err: any) {
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
            return await originalRequest({
              method: 'eth_sendRawTransaction',
              params: [signed],
            });
          } catch {
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

// Detect wallet type
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
  const [walletName, setWalletName] = useState<string>('unknown');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    patchProvider((window as any).ethereum);
    patchProvider((window as any).rabby);

    const eth = (window as any).ethereum;
    if (eth?.providers && Array.isArray(eth.providers)) {
      eth.providers.forEach(patchProvider);
    }

    if (isConnected) {
      setWalletName(detectWallet());
    }
  }, [isConnected]);

  return (
    <>
      {isConnected && walletName === 'rabby' && !dismissed && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #ff6b35 0%, #d63031 100%)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '13px',
            color: 'white',
            fontWeight: 500,
          }}
        >
          <span>⚠️</span>
          <span>
            Rabby wallet has compatibility issues with Ritual Chain. Please use{' '}
            <strong>OKX Wallet</strong> or <strong>MetaMask</strong> for transactions.
          </span>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </>
  );
}
