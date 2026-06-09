import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts';

const ritualChain = {
  id: 1979,
  name: 'Ritual',
  network: 'ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.ritualfoundation.org'] },
  },
};

const client = createPublicClient({
  chain: ritualChain,
  transport: http(),
});

export async function GET() {
  try {
    // Get total agent count
    const agentCount = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'agentCount',
    });

    // Get active agents (first 100)
    const activeAgentIds = await client.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: 'getActiveAgents',
      args: [BigInt(0), BigInt(100)],
    });

    // Calculate stats
    let totalRentals = 0;
    let totalEarnings = BigInt(0);
    let persistentCount = 0;
    let sovereignCount = 0;

    for (const id of activeAgentIds as bigint[]) {
      const data = await client.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'agents',
        args: [id],
      });

      const agent = data as unknown as any[];
      totalRentals += Number(agent[6]); // totalRentals
      totalEarnings += agent[5]; // totalEarnings
      if (agent[10] === 1) persistentCount++; // agentType
      else sovereignCount++;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalAgents: Number(agentCount),
        activeAgents: (activeAgentIds as bigint[]).length,
        totalRentals,
        totalEarnings: formatEther(totalEarnings),
        persistentAgents: persistentCount,
        sovereignAgents: sovereignCount,
        platformFee: '5%',
        chainId: 1979,
        contractAddress: MARKETPLACE_ADDRESS,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
