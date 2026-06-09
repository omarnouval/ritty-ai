import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

export const ritual = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: {
    decimals: 18,
    name: 'RITUAL',
    symbol: 'RITUAL',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'RitualScan',
      url: 'https://explorer.ritualfoundation.org',
    },
  },
});

export const config = createConfig({
  chains: [ritual],
  transports: {
    [ritual.id]: http(process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org'),
  },
});
