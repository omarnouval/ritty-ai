'use client';

/**
 * Custom sendTransaction that bypasses wagmi/RainbowKit connector chain.
 * Directly uses window.ethereum provider with forced legacy type.
 */

import { encodeFunctionData, type Abi, type Address } from 'viem';

// Get the raw injected provider
function getRawProvider(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).rabby || (window as any).ethereum;
}

/**
 * Send a contract write transaction directly through the provider.
 * Bypasses wagmi/viem to prevent EIP-7702 type 4 transactions.
 */
export async function sendLegacyContractWrite({
  address,
  abi,
  functionName,
  args,
  value,
}: {
  address: Address;
  abi: Abi;
  functionName: string;
  args: any[];
  value?: bigint;
}): Promise<`0x${string}`> {
  const provider = getRawProvider();
  if (!provider) throw new Error('No wallet provider found');

  // Encode the function call
  const data = encodeFunctionData({
    abi,
    functionName,
    args,
  });

  // Get the current account
  const accounts = await provider.request({ method: 'eth_accounts' });
  if (!accounts?.[0]) throw new Error('No account connected');

  // Build legacy transaction
  const tx: any = {
    from: accounts[0],
    to: address,
    data,
    type: '0x0', // Force legacy
    gasPrice: '0x3B9ACA00', // 1 gwei
  };

  if (value && value > 0n) {
    tx.value = '0x' + value.toString(16);
  }

  try {
    // Try sending as legacy
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [tx],
    });
    return hash;
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();

    // If legacy not supported, try as EIP-1559
    if (msg.includes('type not supported') || msg.includes('not supported')) {
      const eip1559Tx = {
        ...tx,
        type: '0x2',
        maxFeePerGas: '0x3B9ACA00',
        maxPriorityFeePerGas: '0x3B9ACA00',
      };
      delete eip1559Tx.gasPrice;

      try {
        const hash = await provider.request({
          method: 'eth_sendTransaction',
          params: [eip1559Tx],
        });
        return hash;
      } catch (err2: any) {
        // If EIP-1559 also fails, try sign-then-send
        try {
          const signed = await provider.request({
            method: 'eth_signTransaction',
            params: [tx],
          });
          return await provider.request({
            method: 'eth_sendRawTransaction',
            params: [signed],
          });
        } catch {
          throw err2;
        }
      }
    }

    throw err;
  }
}

/**
 * Send a simple ETH transfer (for payable functions)
 */
export async function sendLegacySimpleTx({
  to,
  value,
  data,
  from,
}: {
  to: Address;
  value?: bigint;
  data?: `0x${string}`;
  from: Address;
}): Promise<`0x${string}`> {
  const provider = getRawProvider();
  if (!provider) throw new Error('No wallet provider found');

  const tx: any = {
    from,
    to,
    type: '0x0',
    gasPrice: '0x3B9ACA00',
  };

  if (value && value > 0n) {
    tx.value = '0x' + value.toString(16);
  }
  if (data) {
    tx.data = data;
  }

  return provider.request({
    method: 'eth_sendTransaction',
    params: [tx],
  });
}
