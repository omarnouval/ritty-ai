const {
  createPublicClient, createWalletClient, http, defineChain,
  encodeAbiParameters, parseAbiParameters, decodeAbiParameters,
  parseEther, keccak256, toHex,
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ritualfoundation.org'] } },
});

const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
const pc = createPublicClient({ chain: ritualChain, transport: http() });
const wc = createWalletClient({ account, chain: ritualChain, transport: http() });

const LLM = '0x0000000000000000000000000000000000000802';
const RITUAL_WALLET = '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948';
const EXECUTOR = '0xB42e435c4252A5a2E7440e37B609F00c61a0c91B';
const PRECOMPILE_CALLED_TOPIC = keccak256(toHex('PrecompileCalled(address,bytes,bytes)'));

const REQUEST_ABI = [
  'address, bytes[], uint256, bytes[], bytes,',
  'string, string, int256, string, bool, int256, string, string,',
  'uint256, bool, int256, string, bytes, int256, string, string, bool,',
  'int256, bytes, bytes, int256, int256, string, bool,',
  '(string,string,string)',
].join('');

function buildRequest(messages) {
  return encodeAbiParameters(
    parseAbiParameters(REQUEST_ABI),
    [
      EXECUTOR,            // executor
      [],                  // encryptedSecrets
      300n,                // ttl
      [],                  // secretSignatures
      '0x',                // userPublicKey
      JSON.stringify(messages),
      'zai-org/GLM-4.7-FP8',
      0n,                  // frequencyPenalty
      '',                  // logitBiasJson
      false,               // logprobs
      4096n,               // maxCompletionTokens (>=4096 for reasoning model)
      '',                  // metadataJson
      '',                  // modalitiesJson
      1n,                  // n
      true,                // parallelToolCalls
      0n,                  // presencePenalty
      'medium',            // reasoningEffort
      '0x',                // responseFormatData
      -1n,                 // seed
      'auto',              // serviceTier
      '',                  // stopJson
      false,               // stream
      700n,                // temperature (0.7)
      '0x',                // toolChoiceData
      '0x',                // toolsData
      -1n,                 // topLogprobs
      1000n,               // topP (1.0)
      '',                  // user
      false,               // piiEnabled
      ['', '', ''],        // convoHistory: empty = no persistence, full msgs inline
    ],
  );
}

function decodeResponse(output) {
  const [hasError, completionData, , errorMessage] = decodeAbiParameters(
    parseAbiParameters('bool, bytes, bytes, string, (string,string,string)'),
    output,
  );
  if (hasError) return { error: errorMessage };

  const [, , , model, , , choicesCount, choicesData] = decodeAbiParameters(
    parseAbiParameters('string, string, uint256, string, string, string, uint256, bytes[], bytes'),
    completionData,
  );
  if (choicesCount > 0n && choicesData.length > 0) {
    const [, finishReason, messageData] = decodeAbiParameters(
      parseAbiParameters('uint256, string, bytes'), choicesData[0]);
    const [role, content] = decodeAbiParameters(
      parseAbiParameters('string, string, string, uint256, bytes[]'), messageData);
    return { model, role, content, finishReason };
  }
  return { error: 'no choices' };
}

// spcCalls comes via RAW RPC — viem's typed receipt strips it.
async function extractSpcOutput(hash) {
  const raw = await fetch('https://rpc.ritualfoundation.org', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'eth_getTransactionReceipt', params: [hash],
    }),
  }).then(r => r.json());
  const spcCalls = raw.result?.spcCalls;
  if (!spcCalls || spcCalls.length === 0) return null;
  return spcCalls[0].output;
}

(async () => {
  // Step 1: Deposit to RitualWallet if empty
  const deposit = await pc.readContract({
    address: RITUAL_WALLET,
    abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
    functionName: 'balanceOf', args: [account.address],
  });
  console.log('Current deposit:', Number(deposit) / 1e18, 'RITUAL');

  if (deposit < parseEther('0.4')) {
    console.log('Depositing 0.5 RITUAL...');
    const depHash = await wc.writeContract({
      address: RITUAL_WALLET,
      abi: [{ name: 'deposit', type: 'function', stateMutability: 'payable',
        inputs: [{ name: 'lockDuration', type: 'uint256' }], outputs: [] }],
      functionName: 'deposit', args: [5000n], value: parseEther('0.5'),
    });
    console.log('Deposit tx:', depHash);
    await pc.waitForTransactionReceipt({ hash: depHash });
    console.log('Deposit confirmed.');
  }

  // Step 2: Send inference
  const messages = [
    { role: 'system', content: 'You are a helpful trading agent on Ritty.ai. Be concise.' },
    { role: 'user', content: 'What is Ritual Chain in one sentence?' },
  ];
  const data = buildRequest(messages);

  console.log('\nSending inference tx...');
  let hash;
  try {
    const fees = await pc.estimateFeesPerGas();
    console.log('maxFeePerGas:', fees.maxFeePerGas, 'maxPriority:', fees.maxPriorityFeePerGas);
    hash = await wc.sendTransaction({
      to: LLM, data, gas: 5_000_000n,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      type: 'eip1559',
    });
  } catch (e) {
    console.error('sendTransaction failed.');
    console.error('shortMessage:', e.shortMessage);
    console.error('details:', e.details);
    throw e;
  }
  console.log('Tx hash:', hash);

  console.log('Waiting for receipt...');
  const receipt = await pc.waitForTransactionReceipt({ hash, timeout: 120_000 });
  console.log('Receipt status:', receipt.status);

  // Step 3: Poll spcCalls via raw RPC for settled result
  let output = await extractSpcOutput(hash);
  let attempts = 0;
  while (!output && attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    output = await extractSpcOutput(hash);
    attempts++;
  }

  if (!output) {
    console.log('No spcCalls result after polling. Tx may still be settling.');
    return;
  }

  console.log('\n=== DECODED RESPONSE ===');
  console.log(JSON.stringify(decodeResponse(output), null, 2));
})().catch(e => {
  console.error('FATAL:', e.shortMessage || e.message);
  if (e.cause) console.error('Cause:', e.cause.shortMessage || e.cause.message);
});
