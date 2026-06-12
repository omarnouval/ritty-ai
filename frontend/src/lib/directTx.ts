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

  // Build minimal tx — NO type, NO gasPrice, NO maxFeePerGas
  // Let the wallet handle everything
  const tx: Record<string, string> = {
    from: accounts[0],
    to,
    data,
  };

  if (value && value > 0n) {
    tx.value = '0x' + value.toString(16);
  }

  // Send directly to wallet provider
  const hash = await provider.request({
    method: 'eth_sendTransaction',
    params: [tx],
  });

  return hash;
}
