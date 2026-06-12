import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain, type Chain } from 'viem';

export const ritual: Chain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: {
    decimals: 18,
    name: 'RITUAL',
    symbol: 'RITUAL',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ritualfoundation.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'RitualScan',
      url: 'https://explorer.ritualfoundation.org',
    },
  },
});

/**
 * Patch wallet provider to intercept eth_sendTransaction.
 * For Rabby: try eth_signTransaction + eth_sendRawTransaction
 * to bypass Rabby's internal tx reconstruction.
 */
if (typeof window !== 'undefined') {
  const patch = (p: any) => {
    if (!p || p.__ritualPatched || typeof p.request !== 'function') return;
    const orig = p.request.bind(p);
    p.request = async (args: any) => {
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

        // Parse type
        const t = typeof tx.type === 'string' ? parseInt(tx.type, 16) : tx.type;

        // Downgrade type 3/4 to legacy
        if (t > 2) {
          tx.type = '0x0';
          delete tx.maxFeePerGas;
          delete tx.maxPriorityFeePerGas;
          if (!tx.gasPrice) tx.gasPrice = '0x3B9ACA00';
        }

        // Try normal send first
        try {
          return await orig({ method: args.method, params: [tx] });
        } catch (err: any) {
          const msg = (err?.message || '').toLowerCase();
          // If chain rejects tx type, try sign-then-send
          if (msg.includes('type not supported') || msg.includes('not supported')) {
            try {
              // Step 1: Ask wallet to sign the transaction (legacy format)
              const signed = await orig({
                method: 'eth_signTransaction',
                params: [{ ...tx, type: '0x0' }],
              });
              // Step 2: Broadcast the raw signed transaction
              return await orig({
                method: 'eth_sendRawTransaction',
                params: [signed],
              });
            } catch {
              // eth_signTransaction not supported, re-throw original
              throw err;
            }
          }
          throw err;
        }
      }
      return orig(args);
    };
    p.__ritualPatched = true;
  };

  // Patch immediately
  patch((window as any).ethereum);
  patch((window as any).rabby);

  // Poll for provider (wallet injects async)
  const poll = setInterval(() => {
    patch((window as any).ethereum);
    patch((window as any).rabby);
    const eth = (window as any).ethereum;
    if (eth?.providers?.forEach) eth.providers.forEach(patch);
  }, 100);
  setTimeout(() => clearInterval(poll), 10000);
}

export const config = getDefaultConfig({
  appName: 'Ritty.ai',
  projectId: '3d4e82389f1dbf057f8b96f6ca197d24',
  chains: [ritual],
});
