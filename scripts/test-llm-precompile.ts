/**
 * Ritty.ai — On-chain LLM Test Script
 * Tests 0x0802 precompile call on Ritual Chain
 * 
 * Run: npx tsx scripts/test-llm-precompile.ts
 */

import { defineChain, createWalletClient, createPublicClient, http, encodeAbiParameters, parseAbiParameters, decodeAbiParameters, parseEther, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Address, Hex, TransactionReceipt } from 'viem';

// ─── Config ────────────────────────────────────────────────────
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
if (!PRIVATE_KEY) throw new Error('Set DEPLOYER_PRIVATE_KEY in .env');

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ritualfoundation.org'] } },
});

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain: ritualChain, transport: http() });
const publicClient = createPublicClient({ chain: ritualChain, transport: http() });

// ─── System Contracts ──────────────────────────────────────────
const RITUAL_WALLET = '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948' as Address;
const TEE_REGISTRY = '0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F' as Address;
const LLM_PRECOMPILE = '0x0000000000000000000000000000000000000802' as Address;

// ─── ABI ───────────────────────────────────────────────────────
const walletAbi = [{
  name: 'deposit', type: 'function', stateMutability: 'payable',
  inputs: [{ name: 'lockDuration', type: 'uint256' }],
  outputs: [],
}] as const;

const registryAbi = [{
  name: 'getServiceProvidersByCapability',
  type: 'function', stateMutability: 'view',
  inputs: [{ name: 'capability', type: 'uint8' }],
  outputs: [{ name: '', type: 'address[]' }],
}] as const;

const registryGetAbi = [{
  name: 'getServiceInfo',
  type: 'function', stateMutability: 'view',
  inputs: [{ name: 'teeAddress', type: 'address' }],
  outputs: [
    { name: 'teeAddress', type: 'address' },
    { name: 'publicKey', type: 'bytes' },
    { name: 'endpoint', type: 'string' },
    { name: 'capabilities', type: 'uint8[]' },
    { name: 'isActive', type: 'bool' },
  ],
}] as const;

const PRECOMPILE_CALLED_TOPIC = keccak256(toHex('PrecompileCalled(address,bytes,bytes)'));

// ─── Step 1: Get LLM Executor ──────────────────────────────────
async function getLLMExecutor(): Promise<Address> {
  console.log('📡 Looking up LLM executor from TEE Registry...');
  
  const executors = await publicClient.readContract({
    address: TEE_REGISTRY,
    abi: registryAbi,
    functionName: 'getServiceProvidersByCapability',
    args: [1], // Capability.LLM = 1
  });

  if (!executors || executors.length === 0) {
    throw new Error('No LLM executors found in registry');
  }

  // Get first active executor's info
  for (const executor of executors) {
    const info = await publicClient.readContract({
      address: TEE_REGISTRY,
      abi: registryGetAbi,
      functionName: 'getServiceInfo',
      args: [executor],
    });
    
    if (info[4]) { // isActive
      console.log(`✅ Found active executor: ${executor}`);
      console.log(`   Public key: ${info[1].slice(0, 20)}...`);
      return executor;
    }
  }

  throw new Error('No active LLM executor found');
}

// ─── Step 2: Deposit to RitualWallet ───────────────────────────
async function depositToWallet(amount: string = '0.05') {
  console.log(`💰 Depositing ${amount} RITUAL to RitualWallet...`);
  
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`   Current balance: ${balance} wei`);

  if (balance < parseEther(amount)) {
    throw new Error(`Insufficient balance. Need ${amount} RITUAL`);
  }

  const hash = await walletClient.writeContract({
    address: RITUAL_WALLET,
    abi: walletAbi,
    functionName: 'deposit',
    args: [5000n], // lock for 5000 blocks
    value: parseEther(amount),
  });

  console.log(`   TX: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Deposited! Block: ${receipt.blockNumber}`);
}

// ─── Step 3: Send LLM Precompile Call ──────────────────────────
async function callLLM(executor: Address, message: string): Promise<Hex> {
  console.log(`🤖 Sending LLM call: "${message}"`);
  
  const messagesJson = JSON.stringify([
    { role: 'system', content: 'You are a helpful DeFi trading assistant on Ritual Chain. Be concise.' },
    { role: 'user', content: message },
  ]);

  const encoded = encodeAbiParameters(
    parseAbiParameters([
      'address, bytes[], uint256, bytes[], bytes,',
      'string, string, int256, string, bool, int256, string, string,',
      'uint256, bool, int256, string, bytes, int256, string, string, bool,',
      'int256, bytes, bytes, int256, int256, string, bool,',
      '(string,string,string)',
    ].join('')),
    [
      executor,                   // executor
      [],                         // encryptedSecrets
      300n,                       // ttl (300 blocks)
      [],                         // secretSignatures
      '0x',                       // userPublicKey
      messagesJson,               // messagesJson
      'zai-org/GLM-4.7-FP8',    // model
      0n,                         // frequencyPenalty
      '',                         // logitBiasJson
      false,                      // logprobs
      4096n,                      // maxCompletionTokens
      '',                         // metadataJson
      '',                         // modalitiesJson
      1n,                         // n
      true,                       // parallelToolCalls
      0n,                         // presencePenalty
      'medium',                   // reasoningEffort
      '0x',                       // responseFormatData
      -1n,                        // seed
      'auto',                     // serviceTier
      '',                         // stopJson
      false,                      // stream
      700n,                       // temperature (0.7)
      '0x',                       // toolChoiceData
      '0x',                       // toolsData
      -1n,                        // topLogprobs
      1000n,                      // topP (1.0)
      '',                         // user
      false,                      // piiEnabled
      ['', '', ''],               // convoHistory (empty for now)
    ],
  );

  const hash = await walletClient.sendTransaction({
    to: LLM_PRECOMPILE,
    data: encoded,
    gas: 5_000_000n,
  });

  console.log(`   TX: ${hash}`);
  return hash;
}

// ─── Step 4: Extract Result from Receipt ───────────────────────
function extractLLMResult(receipt: TransactionReceipt): { content: string; model: string } | null {
  for (const log of receipt.logs) {
    if (log.topics[0] !== PRECOMPILE_CALLED_TOPIC) continue;

    try {
      const [addr, , output] = decodeAbiParameters(
        parseAbiParameters('address, bytes, bytes'),
        log.data as Hex,
      );

      if ((addr as string).toLowerCase() !== LLM_PRECOMPILE.toLowerCase()) continue;

      // Unwrap async envelope
      let actual: Hex;
      try {
        [, actual] = decodeAbiParameters(parseAbiParameters('bytes, bytes'), output as Hex);
      } catch {
        actual = output as Hex;
      }

      // Decode response envelope: (bool hasError, bytes completionData, bytes modelMetadata, string errorMessage, (string,string,string) updatedConvoHistory)
      const [hasError, completionData, , errorMessage] = decodeAbiParameters(
        parseAbiParameters('bool, bytes, bytes, string, (string,string,string)'),
        actual,
      );

      if (hasError) {
        console.error(`❌ LLM Error: ${errorMessage}`);
        return null;
      }

      // Decode completionData: (string id, string object, uint256 created, string model, string systemFingerprint, string serviceTier, uint256 choicesCount, bytes[] choicesData, bytes usageData)
      const [, , , model, , , , choicesData] = decodeAbiParameters(
        parseAbiParameters('string, string, uint256, string, string, string, uint256, bytes[], bytes'),
        completionData as Hex,
      );

      if (choicesData.length > 0) {
        // Decode first choice: (uint256 index, string finishReason, bytes messageData)
        const [, , messageData] = decodeAbiParameters(
          parseAbiParameters('uint256, string, bytes'),
          choicesData[0],
        );

        // Decode message: (string role, string content, string refusal, uint256 toolCallsCount, bytes[] toolCallsData)
        const [, content] = decodeAbiParameters(
          parseAbiParameters('string, string, string, uint256, bytes[]'),
          messageData,
        );

        return { content, model };
      }
    } catch (e) {
      console.error('Decode error:', e);
    }
  }
  return null;
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Ritty.ai — On-chain LLM Test');
  console.log(`   Account: ${account.address}`);
  console.log(`   Chain: Ritual (1979)`);
  console.log('');

  // Step 1: Get executor
  const executor = await getLLMExecutor();

  // Step 2: Deposit (skip if already funded)
  const walletBalance = await publicClient.readContract({
    address: RITUAL_WALLET,
    abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }] as const,
    functionName: 'balanceOf',
    args: [account.address],
  });
  
  if (walletBalance < parseEther('0.01')) {
    await depositToWallet('0.05');
  } else {
    console.log(`💰 Wallet already funded: ${walletBalance} wei`);
  }

  // Step 3: Call LLM
  const txHash = await callLLM(executor, 'What is impermanent loss in DeFi? Explain in 2 sentences.');

  // Step 4: Wait for receipt + decode
  console.log('⏳ Waiting for settlement...');
  const receipt = await publicClient.waitForTransactionReceipt({ 
    hash: txHash,
    timeout: 120_000, // 2 min timeout
  });
  
  console.log(`   Block: ${receipt.blockNumber}`);
  console.log(`   Status: ${receipt.status}`);

  // Try to extract result
  const result = extractLLMResult(receipt);
  if (result) {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`🤖 Model: ${result.model}`);
    console.log(`📝 Response: ${result.content}`);
    console.log('═══════════════════════════════════════');
  } else {
    console.log('⚠️  Could not extract LLM result from receipt');
    console.log('   spcCalls:', (receipt as any).spcCalls);
  }
}

main().catch(console.error);
