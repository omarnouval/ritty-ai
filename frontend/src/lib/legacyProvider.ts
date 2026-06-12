/**
 * EIP-1193 provider wrapper that forces all transactions to be legacy (type 0).
 * Ritual Chain doesn't support EIP-1559 (type 2) transactions.
 */

interface EIP1193Provider {
  request: (args: { method: string; params?: any }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

export function createLegacyProvider(provider: EIP1193Provider): EIP1193Provider {
  return {
    ...provider,
    on: provider.on,
    removeListener: provider.removeListener,
    request: async (args: { method: string; params?: any }) => {
      // Intercept eth_sendTransaction and force legacy format
      if (args.method === 'eth_sendTransaction' && args.params?.[0]) {
        const tx = { ...args.params[0] };

        // Strip EIP-1559 fields
        delete tx.maxFeePerGas;
        delete tx.maxPriorityFeePerGas;

        // Ensure legacy transaction type
        tx.type = '0x0';

        // Ensure gasPrice is set (default 1 gwei if not provided)
        if (!tx.gasPrice) {
          tx.gasPrice = '0x3B9ACA00'; // 1 gwei
        }

        return provider.request({
          method: args.method,
          params: [tx],
        });
      }

      return provider.request(args);
    },
  };
}
