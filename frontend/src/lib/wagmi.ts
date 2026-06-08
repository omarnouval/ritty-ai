import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

export const ritual = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://rpc.ritual.net'],
    },
  },
  blockExplorers: {
    default: {
      name: 'RitualScan',
      url: 'https://scan.ritual.net',
    },
  },
});

export const config = createConfig({
  chains: [ritual],
  transports: {
    [ritual.id]: http(process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://rpc.ritual.net'),
  },
});
