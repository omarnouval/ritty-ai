import { NextRequest, NextResponse } from 'next/server';
import {
  createPublicClient, createWalletClient, http, defineChain,
  encodeAbiParameters, parseAbiParameters, decodeAbiParameters, parseEther,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const maxDuration = 120; // Vercel function timeout (on-chain inference is slow)

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ritualfoundation.org'] } },
});

const RPC_URL = 'https://rpc.ritualfoundation.org';
const LLM = '0x0000000000000000000000000000000000000802' as const;
const RITUAL_WALLET = '0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948' as const;
const TEE_REGISTRY = '0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F' as const;
const MARKETPLACE_ADDRESS = '0x896277Ca55946c3602Bb6f5668d2eDdAb645A76c' as const;
const MODEL = 'zai-org/GLM-4.7-FP8';

const REQUEST_ABI = [
  'address, bytes[], uint256, bytes[], bytes,',
  'string, string, int256, string, bool, int256, string, string,',
  'uint256, bool, int256, string, bytes, int256, string, string, bool,',
  'int256, bytes, bytes, int256, int256, string, bool,',
  '(string,string,string)',
].join('');

// System prompts (on-chain agent personalities)
const SYSTEM_PROMPTS: Record<string, string> = {
  content: 'You are Content Pro, an on-chain AI agent on Ritual Chain. Help with content creation and writing. Be concise, no greetings, match the user language. Plain text only.',
  research: 'You are Research Alpha, an on-chain AI agent on Ritual Chain. Help with research and analysis. Be concise, no greetings, use analogies, match the user language. Plain text only.',
  trading: 'You are Trading Signal, an on-chain AI agent on Ritual Chain. Help with crypto and trading. Be concise, always note this is not financial advice, match the user language. Plain text only.',
  marketing: 'You are Marketing Guru, an on-chain AI agent on Ritual Chain. Help with marketing strategy. Be concise, actionable, match the user language. Plain text only.',
  coding: 'You are Code Assistant, an on-chain AI agent on Ritual Chain. Help with coding. Code first then brief explanation, match the user language.',
  healthcare: 'You are HealthGuide, an on-chain AI agent on Ritual Chain. Explain health topics simply. Always note this is not medical advice, never diagnose. Match the user language. Plain text only.',
  other: 'You are an on-chain AI agent on Ritual Chain. Be helpful and concise. Match the user language. Plain text only.',
};

const AGENT_IDS: Record<string, bigint> = {
  content: 0n, research: 1n, trading: 2n, marketing: 3n, coding: 4n, healthcare: 12n,
};

const MAX_MESSAGE_LENGTH = 2000;

// Skill system (embedded locally — no external dependency)
import { getSkillContent, SKILLS } from '@/lib/skills';

const SKILL_MAPPING: Record<string, string[]> = {
  // Research skills
  'riset|research|studi|study|analisa|analyze': ['deep-research', 'last30days'],
  'paper|jurnal|journal|akademik|academic': ['academic-paper', 'academic-paper-reviewer'],
  // Trading skills
  'trading|trade|jual|beli|buy|sell|strategi': ['ai4trade', 'market-intel'],
  'prediksi|predict|polymarket|pasar|market': ['polymarket', 'market-intel'],
  // Marketing skills
  'seo|search engine|ranking|google': ['ai-seo'],
  'konten|content|blog|artikel': ['content-strategy', 'copywriting'],
  'kompetitor|competitor|saingan': ['competitor-profiling'],
  'email|cold email|outreach': ['cold-email'],
  'iklan|ads|advertising|ad creative': ['ad-creative', 'ads'],
  'komunitas|community|engagement': ['community-marketing'],
  'copywriting|copy|sales copy': ['copywriting'],
  'analytics|analitik|tracking': ['analytics'],
  'konversi|conversion|cro': ['cro'],
  'customer|pelanggan|riset pasar': ['customer-research'],
  // Content Creator skills
  'creator|kreator|influencer|personal brand': ['content-creator', 'content-strategy'],
  'caption|thread|tweet|twitter|viral|hook': ['content-creator', 'copywriting', 'viral-content'],
  'video|script|youtube|reels|tiktok|shorts': ['content-creator', 'video-script'],
  'storytelling|narrative|cerita|story': ['content-creator', 'content-strategy'],
  'newsletter|email content|edm': ['content-creator', 'cold-email'],
  'podcast|episode|show notes': ['content-creator'],
  'konten kreator|content creator|social media post': ['content-creator', 'social-media-content'],
  // Coding skills
  'code review|review code|code quality': ['code-review-and-quality'],
  'debug|error|bug|fix': ['debugging-and-error-recovery'],
  'test|testing|tdd|unit test': ['test-driven-development'],
  'performance|optimasi|optimize|speed': ['performance-optimization'],
  'security|secure|vulnerability|vulnerabilitas': ['security-and-hardening'],
  'frontend|ui|ux|design': ['frontend-ui-engineering'],
  'api|endpoint|interface': ['api-and-interface-design'],
  'ci/cd|deploy|automation|pipeline': ['ci-cd-and-automation'],
  'dokumentasi|documentation|docs': ['documentation-and-adrs'],
  'ide|idea|brainstorm': ['idea-refine'],
  'interview|wawancara|interview prep': ['interview-me'],
  // Healthcare skills
  'kesehatan|health|penyakit|disease|symptom|gejala': ['deep-research', 'academic-paper'],
  'obat|medication|medicine|drug|farmasi': ['deep-research', 'academic-paper'],
  'lab|laboratory|blood test|darah|kolesterol|cholesterol': ['deep-research', 'academic-paper'],
  'bmi|blood pressure|tekanan darah|gula darah|diabetes': ['deep-research', 'academic-paper'],
  'diet|nutrition|nutrisi|makanan|food': ['deep-research', 'academic-paper'],
  'exercise|olahraga|fitness|workout': ['deep-research'],
  'mental health|stress|anxiety|depresi|kesehatan mental': ['deep-research', 'academic-paper'],
  'jurnal|journal|paper|riset|research|studi|study': ['academic-paper', 'academic-paper-reviewer'],
};

function getRelevantSkills(message: string): string[] {
  const skills: string[] = [];
  for (const [keywords, skillIds] of Object.entries(SKILL_MAPPING)) {
    if (new RegExp(keywords, 'i').test(message)) skills.push(...skillIds);
  }
  return [...new Set(skills)];
}

function getServerAccount() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  if (!pk) throw new Error('DEPLOYER_PRIVATE_KEY not configured');
  return privateKeyToAccount(pk);
}

// Fetch a live LLM executor from TEE registry (returns teeAddress + endpoint)
async function getExecutor(pc: ReturnType<typeof createPublicClient>): Promise<{ tee: Hex; endpoint: string }> {
  const services = await pc.readContract({
    address: TEE_REGISTRY,
    abi: [{
      name: 'getServicesByCapability', type: 'function', stateMutability: 'view',
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
    }] as const,
    functionName: 'getServicesByCapability',
    args: [1, true],
  });
  const valid = (services as any[]).find(s => s.isValid);
  if (!valid) throw new Error('No valid LLM executor available');
  return { tee: valid.node.teeAddress as Hex, endpoint: valid.node.endpoint as string };
}

// Resolve which model to use: read live available_models from executor /health.
// Falls back to MODEL constant. This makes the app auto-follow when Ritual swaps GLM.
async function resolveModel(endpoint: string): Promise<string> {
  try {
    const h = await fetch(`${endpoint.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(8000) }).then(r => r.json());
    const models: string[] = h?.handlers?.[LLM]?.available_models || [];
    if (models.length === 0) return MODEL;
    // Prefer current MODEL if still listed, else take first available
    return models.includes(MODEL) ? MODEL : models[0];
  } catch {
    return MODEL;
  }
}

function buildRequest(executor: Hex, model: string, messages: { role: string; content: string }[]): Hex {
  return encodeAbiParameters(
    parseAbiParameters(REQUEST_ABI),
    [
      executor, [], 300n, [], '0x',
      JSON.stringify(messages),
      model,
      0n, '', false, 4096n, '', '',
      1n, true, 0n, 'medium', '0x', -1n, 'auto', '',
      false, 700n, '0x', '0x', -1n, 1000n, '',
      false,
      ['', '', ''], // empty convoHistory — full messages inline
    ],
  ) as Hex;
}

// spcCalls via raw RPC (viem strips it from typed receipt)
async function extractSpcOutput(hash: string): Promise<Hex | null> {
  const raw = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [hash] }),
  }).then(r => r.json());
  const spcCalls = raw.result?.spcCalls;
  if (!spcCalls || spcCalls.length === 0) return null;
  return spcCalls[0].output as Hex;
}

function decodeLLM(output: Hex): { content: string | null; error?: string } {
  const [hasError, completionData, , errorMessage] = decodeAbiParameters(
    parseAbiParameters('bool, bytes, bytes, string, (string,string,string)'),
    output,
  );
  if (hasError) return { content: null, error: errorMessage as string };

  const [, , , , , , choicesCount, choicesData] = decodeAbiParameters(
    parseAbiParameters('string, string, uint256, string, string, string, uint256, bytes[], bytes'),
    completionData as Hex,
  );
  if ((choicesCount as bigint) > 0n && (choicesData as Hex[]).length > 0) {
    const [, , messageData] = decodeAbiParameters(
      parseAbiParameters('uint256, string, bytes'), (choicesData as Hex[])[0]);
    const [, content] = decodeAbiParameters(
      parseAbiParameters('string, string, string, uint256, bytes[]'), messageData as Hex);
    return { content: (content as string) || null };
  }
  return { content: null, error: 'no choices returned' };
}

// On-chain rental verification (event-based; getActiveRental reverts on Ritual)
async function verifyRental(pc: ReturnType<typeof createPublicClient>, userAddress: string, agentId: bigint): Promise<boolean> {
  try {
    const latest = await pc.getBlockNumber();
    const fromBlock = latest - 50000n;
    const logs = await pc.getLogs({
      address: MARKETPLACE_ADDRESS,
      event: {
        type: 'event', name: 'AgentRented',
        inputs: [
          { indexed: true, name: 'agentId', type: 'uint256' },
          { indexed: true, name: 'renter', type: 'address' },
          { name: 'duration', type: 'uint256' },
          { name: 'totalPaid', type: 'uint256' },
        ],
      },
      args: { renter: userAddress as Hex, agentId },
      fromBlock, toBlock: latest,
    });
    if (logs.length === 0) return false;
    const lastLog = logs[logs.length - 1] as any;
    const block = await pc.getBlock({ blockNumber: lastLog.blockNumber });
    const duration = Number(lastLog.args.duration);
    const rentalEndMs = Number(block.timestamp) + duration * 3600 * 1000;
    return Date.now() < rentalEndMs;
  } catch (e) {
    console.error('Rental verify failed:', e);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agentCategory, message, userAddress, agentId: agentIdParam, chatLanguage } = await request.json();

    if (!agentCategory || !message) {
      return NextResponse.json({ success: false, error: 'Missing agentCategory or message' }, { status: 400 });
    }
    if (String(message).length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ success: false, error: 'Message too long' }, { status: 400 });
    }
    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return NextResponse.json({ success: false, error: 'Valid wallet address required' }, { status: 401 });
    }

    const pc = createPublicClient({ chain: ritualChain, transport: http() });

    // Rental verification (mandatory)
    const agentId = agentIdParam !== undefined ? BigInt(agentIdParam) : AGENT_IDS[agentCategory];
    if (agentId === undefined || !(await verifyRental(pc, userAddress, agentId))) {
      return NextResponse.json({ success: false, error: 'No active rental. Rent this agent first.' }, { status: 403 });
    }

    // Build messages
    const langMap: Record<string, string> = { id: 'Indonesian', en: 'English', ko: 'Korean', hi: 'Hindi', tl: 'Filipino' };
    const langName = langMap[chatLanguage] || 'English';
    let systemPrompt = (SYSTEM_PROMPTS[agentCategory] || SYSTEM_PROMPTS.other) + ` Respond in ${langName}.`;

    // Inject skills, market data, and web search context into system prompt
    let contextData = '';
    const cleanMessage = String(message).trim();

    const relevantSkills = getRelevantSkills(cleanMessage);
    if (relevantSkills.length > 0) {
      const skillContents = relevantSkills.slice(0, 2).map(skillId => getSkillContent(skillId));
      const validSkills = skillContents.filter(s => s.length > 0);
      if (validSkills.length > 0) {
        contextData += `RELEVANT SKILLS:\n${validSkills.join('\n\n---\n\n')}\n\n`;
      }
    }

    if (contextData) {
      systemPrompt = `${systemPrompt}\n\n${contextData}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: String(message).trim() },
    ];

    // Server wallet signs + pays (testnet demo model)
    const account = getServerAccount();
    const wc = createWalletClient({ account, chain: ritualChain, transport: http() });

    // Ensure RitualWallet has deposit (each inference needs ~0.31 RITUAL)
    const deposit = await pc.readContract({
      address: RITUAL_WALLET,
      abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const,
      functionName: 'balanceOf', args: [account.address],
    });
    if ((deposit as bigint) < parseEther('0.35')) {
      const depHash = await wc.writeContract({
        address: RITUAL_WALLET,
        abi: [{ name: 'deposit', type: 'function', stateMutability: 'payable',
          inputs: [{ name: 'lockDuration', type: 'uint256' }], outputs: [] }] as const,
        functionName: 'deposit', args: [5000n], value: parseEther('0.5'),
      });
      await pc.waitForTransactionReceipt({ hash: depHash });
    }

    // On-chain inference via 0x0802
    const { tee: executor, endpoint } = await getExecutor(pc);
    const activeModel = await resolveModel(endpoint);
    const data = buildRequest(executor, activeModel, messages);
    const fees = await pc.estimateFeesPerGas();
    const hash = await wc.sendTransaction({
      to: LLM, data, gas: 5_000_000n,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      type: 'eip1559',
    });
    await pc.waitForTransactionReceipt({ hash, timeout: 90_000 });

    // Poll spcCalls for settled result
    let output = await extractSpcOutput(hash);
    let attempts = 0;
    while (!output && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      output = await extractSpcOutput(hash);
      attempts++;
    }
    if (!output) {
      return NextResponse.json({ success: false, error: 'Inference settling, try again', txHash: hash }, { status: 504 });
    }

    const { content, error } = decodeLLM(output);
    if (error || !content) {
      return NextResponse.json({ success: false, error: error || 'Empty response', txHash: hash }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      data: {
        response: content,
        txHash: hash,
        model: activeModel,
        onchain: true,
        explorer: `https://explorer.ritualfoundation.org/tx/${hash}`,
      },
    });
  } catch (e: any) {
    console.error('On-chain chat error:', e);
    return NextResponse.json({ success: false, error: e.shortMessage || e.message || 'Internal error' }, { status: 500 });
  }
}
