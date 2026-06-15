'use client';

import { encodeFunctionData, type Abi, type Address } from 'viem';

/**
 * Send transaction directly through window.ethereum provider.
 * Bypasses viem/wagmi transaction preparation.
 * Just encode + send raw to wallet — let wallet handle everything.
 */
export async function sendDirectTx({
  to,
  abi,
  functionName,
  args,
  value,
}: {
  to: Address;
  abi: Abi;
  functionName: string;
  args: any[];
  value?: bigint;
}): Promise<`0x${string}`> {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error('No wallet provider found');

  // Encode function call using viem
  const data = encodeFunctionData({ abi, functionName, args });

  // Get connected account — request if not connected
  let accounts = await provider.request({ method: 'eth_accounts' });
  if (!accounts?.[0]) {
    // Request accounts (triggers wallet popup if not connected)
    accounts = await provider.request({ method: 'eth_requestAccounts' });
  }
  if (!accounts?.[0]) throw new Error('No account connected');

  // Build minimal tx — NO type, let the wallet handle everything
  const tx: Record<string, string> = {
    from: accounts[0],
    to,
    data,
    gas: '0x493E0', // 300,000 gas limit - enough for profile creation
  };

  if (value && value > BigInt(0)) {
    tx.value = '0x' + value.toString(16);
  }

  // Rabby workaround: force legacy tx by setting gasPrice
  // Rabby constructs EIP-7702 (type 4) by default, Ritual RPC rejects it
  const isRabby = provider.isRabby || provider.providers?.some((p: any) => p.isRabby);
  if (isRabby) {
    try {
      const gasPrice = await provider.request({ method: 'eth_gasPrice' });
      if (gasPrice) tx.gasPrice = gasPrice;
    } catch {
      // fallback: use a reasonable gas price
      tx.gasPrice = '0x3B9ACA00'; // 1 gwei
    }
  }

  // Send directly to wallet provider
  const hash = await provider.request({
    method: 'eth_sendTransaction',
    params: [tx],
  });

  return hash;
}
