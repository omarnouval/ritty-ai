'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { LegacyTxProvider } from '@/components/LegacyTxProvider';
import { NotificationProvider } from '@/components/NotificationProvider';
import { useRabbyDetect } from '@/lib/useRabbyDetect';
import { RabbyWarning } from '@/components/RabbyWarning';
import { useState } from 'react';

const queryClient = new QueryClient();

function RabbyGuard({ children }: { children: React.ReactNode }) {
  const isRabby = useRabbyDetect();
  const [dismissed, setDismissed] = useState(false);
  return (
    <>
      {isRabby && !dismissed && <RabbyWarning onClose={() => setDismissed(true)} />}
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme({ accentColor: '#40FFAF' })}>
            <LegacyTxProvider>
              <NotificationProvider>
                <RabbyGuard>
                  {children}
                </RabbyGuard>
              </NotificationProvider>
            </LegacyTxProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </LanguageProvider>
  );
}
