import { getDefaultConfig } from '@rainbow-me/rainbowkit';
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

export const config = getDefaultConfig({
  appName: 'Ritty.ai',
  projectId: 'ritty-ai-demo', // WalletConnect project ID
  chains: [ritual],
});
