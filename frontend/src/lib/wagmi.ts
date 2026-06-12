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

// Patch ALL providers BEFORE wagmi config is created
// This ensures the connector captures the patched provider
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
        // Downgrade type 3/4 to legacy
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
    p.__ritualPatched = true;
  };

  // Immediate patch
  patch((window as any).ethereum);
  patch((window as any).rabby);

  // Patch when provider appears (wallet injects async)
  const observer = setInterval(() => {
    patch((window as any).ethereum);
    patch((window as any).rabby);
    const eth = (window as any).ethereum;
    if (eth?.providers && Array.isArray(eth.providers)) {
      eth.providers.forEach(patch);
    }
  }, 100);

  // Stop polling after 10s
  setTimeout(() => clearInterval(observer), 10000);
}

export const config = getDefaultConfig({
  appName: 'Ritty.ai',
  projectId: '3d4e82389f1dbf057f8b96f6ca197d24',
  chains: [ritual],
});
