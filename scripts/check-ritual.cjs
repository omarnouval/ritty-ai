const { createPublicClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ritualfoundation.org'] } },
});

const pc = createPublicClient({ chain: ritualChain, transport: http() });
const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);

const TEE_REGISTRY = '0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F';
const RITUAL_WALLET = '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948';

(async () => {
  console.log('Wallet:', account.address);

  const bal = await pc.getBalance({ address: account.address });
  console.log('Native balance:', Number(bal) / 1e18, 'RITUAL');

  const block = await pc.getBlockNumber();
  console.log('Current block:', block);

  // Check executors
  try {
    const services = await pc.readContract({
      address: TEE_REGISTRY,
      abi: [{
        name: 'getServicesByCapability',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'capability', type: 'uint8' }, { name: 'checkValidity', type: 'bool' }],
        outputs: [{
          name: 'services', type: 'tuple[]',
          components: [
            { name: 'node', type: 'tuple', components: [
              { name: 'paymentAddress', type: 'address' },
              { name: 'teeAddress', type: 'address' },
              { name: 'teeType', type: 'uint8' },
              { name: 'publicKey', type: 'bytes' },
              { name: 'endpoint', type: 'string' },
              { name: 'certPubKeyHash', type: 'bytes32' },
              { name: 'capability', type: 'uint8' },
            ]},
            { name: 'isValid', type: 'bool' },
            { name: 'workloadId', type: 'bytes32' },
          ],
        }],
      }],
      functionName: 'getServicesByCapability',
      args: [1, true],
    });
    console.log('\nLLM Executors found:', services.length);
    services.forEach((s, i) => {
      console.log(`  [${i}] teeAddress=${s.node.teeAddress} valid=${s.isValid} pubkeyLen=${s.node.publicKey.length}`);
    });
  } catch (e) {
    console.error('Registry error:', e.shortMessage || e.message);
  }

  // Check RitualWallet deposit
  try {
    const deposit = await pc.readContract({
      address: RITUAL_WALLET,
      abi: [{
        name: 'balanceOf', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
      }],
      functionName: 'balanceOf',
      args: [account.address],
    });
    console.log('\nRitualWallet deposit:', Number(deposit) / 1e18, 'RITUAL');
  } catch (e) {
    console.log('\nRitualWallet balanceOf not available:', e.shortMessage || e.message);
  }
})();
